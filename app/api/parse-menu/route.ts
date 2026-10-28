import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const MODEL = "gemini-3.5-flash-lite";
const USER_AGENT = "DicedMenuReader/1.0 (one-time menu read)";
const MAX_TEXT_CHARS = 30000;
const MAX_PDF_BYTES = 10 * 1024 * 1024;

type MenuItem = { name: string; calories: number; protein: number; carbs: number; fat: number };

async function fetchWithTimeout(url: string, ms = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      redirect: "follow",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

// Simple robots.txt check: skips paths disallowed for all bots ("User-agent: *").
async function isAllowedByRobots(origin: string, path: string): Promise<boolean> {
  try {
    const res = await fetchWithTimeout(`${origin}/robots.txt`, 4000);
    if (!res.ok) return true;
    const lines = (await res.text()).split(/\r?\n/).map((l) => l.split("#")[0].trim());

    let applies = false;
    const disallows: string[] = [];
    for (const line of lines) {
      const idx = line.indexOf(":");
      if (idx === -1) continue;
      const key = line.slice(0, idx).trim().toLowerCase();
      const val = line.slice(idx + 1).trim();
      if (key === "user-agent") applies = val === "*";
      else if (key === "disallow" && applies && val) disallows.push(val);
    }
    return !disallows.some((d) => path.startsWith(d));
  } catch {
    return true;
  }
}

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|tr|section)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&rsquo;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim()
    .slice(0, MAX_TEXT_CHARS);
}

// Finds the most likely menu link on the restaurant's own domain.
function findMenuLink(html: string, base: URL): URL | null {
  const linkRegex = /<a\s[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const baseHost = base.hostname.replace(/^www\./, "");
  let best: { url: URL; score: number } | null = null;

  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    let url: URL;
    try {
      url = new URL(match[1], base);
    } catch {
      continue;
    }
    if (url.hostname.replace(/^www\./, "") !== baseHost) continue;

    const href = url.pathname.toLowerCase();
    const text = match[2].replace(/<[^>]+>/g, "").toLowerCase();

    let score = 0;
    if (href.includes("menu") || text.includes("menu")) score += 10;
    if (/food|dinner|lunch|brunch|eat/.test(href + " " + text)) score += 3;
    if (href.endsWith(".pdf")) score += 2;
    if (/order|catering|gift|career|job/.test(href)) score -= 4;

    if (score > 0 && (!best || score > best.score)) best = { url, score };
  }
  return best?.url ?? null;
}

type MenuContent =
  | { kind: "text"; text: string; url: string }
  | { kind: "pdf"; base64: string; url: string };

async function fetchContent(url: URL): Promise<MenuContent | null> {
  if (!(await isAllowedByRobots(url.origin, url.pathname))) return null;

  const res = await fetchWithTimeout(url.toString());
  if (!res.ok) return null;

  const type = res.headers.get("content-type") ?? "";
  if (type.includes("pdf") || url.pathname.toLowerCase().endsWith(".pdf")) {
    const buf = await res.arrayBuffer();
    if (buf.byteLength > MAX_PDF_BYTES) return null;
    return { kind: "pdf", base64: Buffer.from(buf).toString("base64"), url: url.toString() };
  }

  const text = htmlToText(await res.text());
  return { kind: "text", text, url: url.toString() };
}

async function readWebsiteMenu(website: string): Promise<MenuContent | null> {
  let home: URL;
  try {
    home = new URL(website);
  } catch {
    return null;
  }
  if (!(await isAllowedByRobots(home.origin, home.pathname))) return null;

  const homeRes = await fetchWithTimeout(home.toString());
  if (!homeRes.ok) return null;
  const homeHtml = await homeRes.text();

  const menuUrl = findMenuLink(homeHtml, home);
  if (menuUrl) {
    const content = await fetchContent(menuUrl);
    // Under ~300 characters usually means a JavaScript-rendered page we can't read
    if (content && (content.kind === "pdf" || content.text.length > 300)) return content;
  }

  // Some sites put the menu right on the homepage
  const homeText = htmlToText(homeHtml);
  if (homeText.length > 300) return { kind: "text", text: homeText, url: home.toString() };

  return null;
}

async function parseMenuWithGemini(content: MenuContent, restaurantName: string): Promise<MenuItem[]> {
  const model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: { responseMimeType: "application/json" },
  });

  const prompt = `This is content from the website of the restaurant "${restaurantName}".

If it contains a food menu, extract up to 25 dishes (skip drinks unless it's mainly a cafe). For each dish:
- If the page lists calories/macros, use those exact numbers.
- Otherwise estimate realistic macros for one typical serving using the dish name and description.

If this content is not a food menu, set "hasMenu" to false and return an empty items list.

Return JSON in exactly this shape:
{"hasMenu": boolean, "items": [{"name": string, "calories": number, "protein": number, "carbs": number, "fat": number}]}`;

  const parts: any[] =
    content.kind === "pdf"
      ? [prompt, { inlineData: { data: content.base64, mimeType: "application/pdf" } }]
      : [`${prompt}\n\nWEBSITE CONTENT:\n${content.text}`];

  const result = await model.generateContent(parts);
  const parsed = JSON.parse(result.response.text());
  if (!parsed.hasMenu) return [];
  return cleanItems(parsed.items);
}

async function generateEstimatedMenu(
  restaurantName: string,
  cuisine?: string,
  address?: string
): Promise<{ isKnownChain: boolean; items: MenuItem[] }> {
  const model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: { responseMimeType: "application/json" },
  });

  const prompt = `You are building a menu with nutrition info for a restaurant app.

Restaurant: ${restaurantName}
Cuisine: ${cuisine ?? "unknown"}
Address: ${address ?? "unknown"}

If this is a well-known chain (e.g. Dunkin', McDonald's, Chick-fil-A, Starbucks), list 10-12 of its most popular real menu items using the chain's actual published nutrition facts as closely as you can.

If it is an independent restaurant you don't know, list 8-10 dishes that a typical ${cuisine ?? ""} restaurant like this would serve, with realistic estimates for a typical serving.

Return JSON in exactly this shape:
{"isKnownChain": boolean, "items": [{"name": string, "calories": number, "protein": number, "carbs": number, "fat": number}]}`;

  const result = await model.generateContent(prompt);
  const parsed = JSON.parse(result.response.text());
  return { isKnownChain: !!parsed.isKnownChain, items: cleanItems(parsed.items) };
}

function cleanItems(items: any[]): MenuItem[] {
  return (items ?? [])
    .filter((i) => i?.name && typeof i.calories === "number")
    .map((i) => ({
      name: String(i.name).trim(),
      calories: Math.round(i.calories),
      protein: Math.round(i.protein ?? 0),
      carbs: Math.round(i.carbs ?? 0),
      fat: Math.round(i.fat ?? 0),
    }));
}

export async function POST(req: Request) {
  try {
    const { restaurantName, cuisine, address, website } = await req.json();
    if (!restaurantName) {
      return NextResponse.json({ error: "restaurantName is required" }, { status: 400 });
    }

    // 1. Try the restaurant's real website menu
    if (website) {
      try {
        const content = await readWebsiteMenu(website);
        if (content) {
          const items = await parseMenuWithGemini(content, restaurantName);
          if (items.length > 0) {
            return NextResponse.json({ items, source: "website_menu", sourceUrl: content.url });
          }
        }
      } catch (err) {
        console.error(`Website menu read failed for ${restaurantName}:`, err);
      }
    }

    // 2. Fall back to chain knowledge / typical-dish estimates
    const fallback = await generateEstimatedMenu(restaurantName, cuisine, address);
    if (fallback.items.length === 0) {
      return NextResponse.json({ error: "generation_failed" }, { status: 500 });
    }
    return NextResponse.json({
      items: fallback.items,
      source: fallback.isKnownChain ? "chain_ai" : "estimated_menu_ai",
      sourceUrl: null,
    });
  } catch (err) {
    console.error("Parse menu failed:", err);
    return NextResponse.json({ error: "generation_failed", details: String(err) }, { status: 500 });
  }
}
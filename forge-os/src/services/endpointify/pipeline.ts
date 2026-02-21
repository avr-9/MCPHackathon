import { chromium } from "playwright";
import type { EndpointComponent, EndpointifyResult } from "../../state/store.js";
import { getCachedEndpointify } from "./cache.js";
import { extractHeuristicComponents } from "./heuristics.js";
import { runVisionExtraction } from "./vision.js";

export interface EndpointifyOptions {
  backgroundLive?: boolean;
  timeoutMs?: number;
  forceLive?: boolean;
}

interface LiveCapture {
  html: string;
  screenshotBase64?: string;
}

export async function runEndpointify(url: string, options: EndpointifyOptions = {}): Promise<EndpointifyResult> {
  const started = Date.now();
  const notes: string[] = [];
  const retryCount = 0;
  const { normalized, cached } = getCachedEndpointify(url);

  if (cached && !options.forceLive) {
    notes.push("Returned cached demo result immediately");

    if (options.backgroundLive !== false) {
      void runLiveExtraction(url, normalized, options.timeoutMs ?? 11_000).catch(() => {
        // Silent fallback to keep demo deterministic.
      });
    }

    return {
      url,
      normalizedUrl: normalized,
      components: cached.components,
      confidence: cached.confidence,
      source: "demo_cache",
      diagnostics: {
        source: "demo_cache",
        retry_count: retryCount,
        timing_ms: Date.now() - started,
        notes: [...cached.notes, ...notes]
      }
    };
  }

  try {
    return await runLiveExtraction(url, normalized, options.timeoutMs ?? 11_000);
  } catch (error) {
    notes.push(`Live extraction failed: ${error instanceof Error ? error.message : String(error)}`);

    if (cached) {
      notes.push("Fallback to cached demo payload");
      return {
        url,
        normalizedUrl: normalized,
        components: cached.components,
        confidence: cached.confidence,
        source: "demo_cache",
        diagnostics: {
          source: "demo_cache",
          retry_count: retryCount,
          timing_ms: Date.now() - started,
          notes
        }
      };
    }

    notes.push("Fallback to heuristic-only mode");
    let heuristicHtml = "";
    try {
      heuristicHtml = await fetchHtmlFallback(url, Math.min(options.timeoutMs ?? 11_000, 8_000));
      notes.push("Fetched raw HTML for heuristic fallback");
    } catch (fallbackError) {
      notes.push(
        `Raw HTML fetch failed: ${
          fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
        }`
      );
    }

    const heuristicComponents = extractHeuristicComponents(heuristicHtml);
    return {
      url,
      normalizedUrl: normalized,
      components: heuristicComponents,
      confidence: heuristicComponents.length ? 0.42 : 0.2,
      source: "heuristic",
      diagnostics: {
        source: "heuristic",
        retry_count: retryCount,
        timing_ms: Date.now() - started,
        notes
      }
    };
  }
}

async function fetchHtmlFallback(url: string, timeoutMs: number): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`status ${response.status}`);
    }
    return (await response.text()).slice(0, 200_000);
  } finally {
    clearTimeout(timeout);
  }
}

async function runLiveExtraction(url: string, normalizedUrl: string, timeoutMs: number): Promise<EndpointifyResult> {
  const started = Date.now();
  const notes: string[] = [];

  const capture = await capturePage(url, timeoutMs);
  notes.push("Playwright capture completed");

  const heuristicComponents = extractHeuristicComponents(capture.html);
  let components: EndpointComponent[] = heuristicComponents;
  let confidence = heuristicComponents.length ? 0.62 : 0.3;
  let source: EndpointifyResult["source"] = "heuristic";

  try {
    const vision = await runVisionExtraction({
      url,
      html: capture.html,
      screenshotBase64: capture.screenshotBase64
    });
    const merged = mergeComponents(vision.components, heuristicComponents);
    components = merged;
    confidence = Math.max(vision.confidence, 0.7);
    source = "live";
    notes.push("Vision extraction merged with heuristic fallback");
  } catch (error) {
    notes.push(`Vision skipped: ${error instanceof Error ? error.message : String(error)}`);
  }

  return {
    url,
    normalizedUrl,
    components,
    confidence,
    source,
    diagnostics: {
      source,
      retry_count: 0,
      timing_ms: Date.now() - started,
      notes
    }
  };
}

async function capturePage(url: string, timeoutMs: number): Promise<LiveCapture> {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: timeoutMs });
    await page.waitForTimeout(600);

    const html = await page.content();
    const screenshot = await page.screenshot({ type: "jpeg", quality: 65, fullPage: false });

    return {
      html,
      screenshotBase64: screenshot.toString("base64")
    };
  } finally {
    await browser.close();
  }
}

function mergeComponents(primary: EndpointComponent[], fallback: EndpointComponent[]): EndpointComponent[] {
  const merged = new Map<string, EndpointComponent>();

  for (const component of primary) {
    merged.set(component.selector || component.id, component);
  }
  for (const component of fallback) {
    const key = component.selector || component.id;
    if (!merged.has(key)) {
      merged.set(key, component);
    }
  }

  return Array.from(merged.values()).slice(0, 12);
}

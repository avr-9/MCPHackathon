import type { EndpointComponent } from "../../state/store.js";

interface VisionInput {
  url: string;
  html: string;
  screenshotBase64?: string;
}

interface VisionResponse {
  components: EndpointComponent[];
  confidence: number;
}

export async function runVisionExtraction(input: VisionInput): Promise<VisionResponse> {
  const endpoint = process.env.VISION_API_URL;
  const apiKey = process.env.VISION_API_KEY;

  if (!endpoint || !apiKey) {
    throw new Error("VISION_API_URL or VISION_API_KEY not configured");
  }

  const prompt = [
    "Extract interactive web components from this page.",
    "Return JSON with fields: components[], confidence.",
    "Each component must include id,type,label,selector,description,confidence,actionHints.",
    "Allowed type values: search,form,table,button,filter,pagination.",
    `Page URL: ${input.url}`
  ].join("\n");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        prompt,
        html: input.html.slice(0, 40_000),
        screenshot_base64: input.screenshotBase64
      })
    });

    if (!response.ok) {
      throw new Error(`Vision request failed with status ${response.status}`);
    }

    const json = (await response.json()) as Partial<VisionResponse>;
    if (!Array.isArray(json.components)) {
      throw new Error("Vision response missing components");
    }

    return {
      components: json.components,
      confidence: typeof json.confidence === "number" ? json.confidence : 0.7
    };
  } finally {
    clearTimeout(timeout);
  }
}

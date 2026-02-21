import { DEMO_ENDPOINTIFY_CACHE } from "../../demo/endpointify-cache.js";

export function normalizeUrl(input: string): string {
  const url = new URL(input);
  url.hash = "";
  const normalizedPath = url.pathname === "/" ? "" : url.pathname.replace(/\/+$/, "");

  const params = Array.from(url.searchParams.entries()).sort((a, b) =>
    a[0] === b[0] ? a[1].localeCompare(b[1]) : a[0].localeCompare(b[0])
  );
  const normalizedQuery = params.length ? `?${new URLSearchParams(params).toString()}` : "";

  return `${url.protocol}//${url.host}${normalizedPath}${normalizedQuery}`;
}

export function getCachedEndpointify(url: string) {
  const normalized = normalizeUrl(url);
  const cached = DEMO_ENDPOINTIFY_CACHE[normalized];
  return { normalized, cached };
}

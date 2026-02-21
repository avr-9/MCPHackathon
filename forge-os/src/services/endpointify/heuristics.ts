import { load } from "cheerio";
import type { EndpointComponent } from "../../state/store.js";

function clip(text: string, max = 72): string {
  return text.trim().replace(/\s+/g, " ").slice(0, max);
}

export function extractHeuristicComponents(html: string): EndpointComponent[] {
  const $ = load(html);
  const components: EndpointComponent[] = [];

  const search = $("input[type='search'], input[name*='search' i], input[placeholder*='search' i]").first();
  if (search.length) {
    components.push({
      id: "heur_search",
      type: "search",
      label: clip(search.attr("placeholder") ?? search.attr("name") ?? "Search"),
      selector: cssSelector(search),
      description: "Detected search field",
      confidence: 0.75,
      actionHints: ["submit_query", "clear"]
    });
  }

  const filters = $("select, input[type='checkbox'], input[type='radio']").slice(0, 3);
  filters.each((idx, el) => {
    const node = $(el);
    components.push({
      id: `heur_filter_${idx}`,
      type: "filter",
      label: clip(node.attr("name") ?? node.attr("id") ?? "Filter"),
      selector: cssSelector(node),
      description: "Detected filtering control",
      confidence: 0.64,
      actionHints: ["set_filter"]
    });
  });

  const buttons = $("button, input[type='submit'], a[role='button']").slice(0, 4);
  buttons.each((idx, el) => {
    const node = $(el);
    const text = clip(node.text() || node.attr("value") || node.attr("aria-label") || "Action");
    components.push({
      id: `heur_button_${idx}`,
      type: "button",
      label: text || `Action ${idx + 1}`,
      selector: cssSelector(node),
      description: "Detected clickable action",
      confidence: 0.7,
      actionHints: ["click"]
    });
  });

  const table = $("table, [role='table'], ul, ol").first();
  if (table.length) {
    components.push({
      id: "heur_table",
      type: "table",
      label: clip(table.attr("aria-label") ?? "Result List"),
      selector: cssSelector(table),
      description: "Detected result container",
      confidence: 0.67,
      actionHints: ["read_rows", "open_item"]
    });
  }

  const next = $("a[rel='next'], a:contains('More'), button:contains('Next')").first();
  if (next.length) {
    components.push({
      id: "heur_pagination",
      type: "pagination",
      label: clip(next.text() || "Next"),
      selector: cssSelector(next),
      description: "Detected navigation control",
      confidence: 0.6,
      actionHints: ["next_page"]
    });
  }

  if (components.length === 0) {
    const firstLink = $("a[href]").first();
    if (firstLink.length) {
      components.push({
        id: "heur_link_0",
        type: "button",
        label: clip(firstLink.text() || firstLink.attr("aria-label") || "Open Link"),
        selector: cssSelector(firstLink),
        description: "Fallback interactive link",
        confidence: 0.52,
        actionHints: ["open_link"]
      });
    }
  }

  if (components.length === 0) {
    components.push({
      id: "heur_page_content",
      type: "table",
      label: "Page Content",
      selector: "body",
      description: "Fallback page content container",
      confidence: 0.35,
      actionHints: ["read_rows"]
    });
  }

  return components.slice(0, 10);
}

function cssSelector(node: any): string {
  const id = node.attr("id");
  if (id) {
    return `#${id}`;
  }
  const cls = (node.attr("class") ?? "").trim().split(/\s+/).filter(Boolean).slice(0, 2);
  const tag = node[0]?.tagName || "*";
  return cls.length ? `${tag}.${cls.join(".")}` : tag;
}

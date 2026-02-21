import type { EndpointComponent } from "../state/store.js";

export interface CachedEndpointify {
  url: string;
  components: EndpointComponent[];
  confidence: number;
  notes: string[];
}

export const DEMO_ENDPOINTIFY_CACHE: Record<string, CachedEndpointify> = {
  "https://news.ycombinator.com": {
    url: "https://news.ycombinator.com",
    confidence: 0.94,
    notes: [
      "Precomputed for stage reliability",
      "Covers top-story listing and search pattern"
    ],
    components: [
      {
        "id": "cmp_search",
        "type": "search",
        "label": "Story Search",
        "selector": "input[name='q']",
        "description": "Search input for finding specific discussions",
        "confidence": 0.95,
        "actionHints": ["submit_query", "clear"]
      },
      {
        "id": "cmp_table",
        "type": "table",
        "label": "Top Stories List",
        "selector": "table.itemlist",
        "description": "Primary list of ranked stories",
        "confidence": 0.97,
        "actionHints": ["read_rows", "open_story"]
      },
      {
        "id": "cmp_more",
        "type": "pagination",
        "label": "More Link",
        "selector": "a.morelink",
        "description": "Loads additional stories",
        "confidence": 0.93,
        "actionHints": ["next_page"]
      },
      {
        "id": "cmp_vote",
        "type": "button",
        "label": "Vote Button",
        "selector": "a[id^='up_']",
        "description": "Interactive vote control",
        "confidence": 0.86,
        "actionHints": ["click"]
      }
    ]
  }
};

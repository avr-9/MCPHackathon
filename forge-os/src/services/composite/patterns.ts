import type { CompositeTool, ToolCallLog, WorkspaceState } from "../../state/store.js";
import { makeId, nowIso } from "../../state/store.js";

function chainKey(chain: string[]): string {
  return chain.join("->");
}

export function detectCompositeCandidate(
  state: WorkspaceState,
  patternHint?: string
): CompositeTool | null {
  if (patternHint) {
    const chain = patternHint
      .split("->")
      .map((token) => token.trim())
      .filter(Boolean);

    if (chain.length >= 2) {
      return {
        id: `cmp_${makeId("tool")}`,
        name: `flow-${Date.now().toString().slice(-4)}`,
        chain,
        estimate: `${Math.max(2, chain.length)}x faster`,
        status: "proposed",
        createdAt: nowIso()
      };
    }
  }

  const recent = state.toolCalls.slice(-60);
  const frequency = rankNGrams(recent, 3);
  if (frequency.length === 0) {
    return null;
  }

  const [winner] = frequency;
  if (winner.count < 2) {
    return null;
  }

  return {
    id: `cmp_${makeId("tool")}`,
    name: `flow-${Date.now().toString().slice(-4)}`,
    chain: winner.chain,
    estimate: `${Math.min(6, winner.count)}x faster`,
    status: "proposed",
    createdAt: nowIso()
  };
}

function rankNGrams(logs: ToolCallLog[], n: number) {
  const countMap = new Map<string, { chain: string[]; count: number }>();

  for (let i = 0; i <= logs.length - n; i += 1) {
    const chain = logs.slice(i, i + n).map((item) => item.toolName);
    const key = chainKey(chain);
    const current = countMap.get(key);
    if (!current) {
      countMap.set(key, { chain, count: 1 });
    } else {
      current.count += 1;
    }
  }

  return Array.from(countMap.values()).sort((a, b) => b.count - a.count);
}

import { MCPServer } from "mcp-use/server";
import { z } from "zod";

const studiesByServer = new Map();
const trialToServer = new Map();

function nowIso() {
  return new Date().toISOString();
}

function makeTrialId() {
  return `t_${Math.random().toString(16).slice(2, 12)}`;
}

function getStudy(serverId) {
  if (!studiesByServer.has(serverId)) {
    studiesByServer.set(serverId, {
      serverId,
      trials: [],
      bestTrialId: null,
      bestValue: null
    });
  }
  return studiesByServer.get(serverId);
}

function sampleInt(spec) {
  const low = Number(spec.low);
  const high = Number(spec.high);
  const step = Number(spec.step ?? 1);
  const count = Math.floor((high - low) / step) + 1;
  return low + Math.floor(Math.random() * count) * step;
}

function sampleFloat(spec) {
  const low = Number(spec.low);
  const high = Number(spec.high);
  const step = spec.step == null ? null : Number(spec.step);
  const raw = low + Math.random() * (high - low);
  if (!step || step <= 0) {
    return Number(raw.toFixed(6));
  }
  const snapped = Math.round((raw - low) / step) * step + low;
  return Number(snapped.toFixed(6));
}

function sampleCategorical(spec) {
  const choices = Array.isArray(spec.choices) ? spec.choices : [];
  if (!choices.length) {
    throw new Error("categorical param missing choices");
  }
  return choices[Math.floor(Math.random() * choices.length)];
}

function sampleParams(paramSpace) {
  const out = {};
  for (const [name, spec] of Object.entries(paramSpace)) {
    const kind = String(spec.type ?? "categorical");
    if (kind === "int") {
      out[name] = sampleInt(spec);
      continue;
    }
    if (kind === "float") {
      out[name] = sampleFloat(spec);
      continue;
    }
    if (kind === "categorical") {
      out[name] = sampleCategorical(spec);
      continue;
    }
    throw new Error(`unsupported param type: ${kind}`);
  }
  return out;
}

function chooseSampler(paramSpace) {
  const entries = Object.values(paramSpace);
  const allNumeric = entries.length > 0 && entries.every((spec) => spec.type === "int" || spec.type === "float");
  return allNumeric && entries.length >= 2 ? "cmaes" : "tpe";
}

const server = new MCPServer({
  name: "forge-optimizer",
  title: "forge-optimizer",
  version: "0.1.0",
  description: "Optimization server for trial suggestion and feedback.",
  baseUrl: process.env.MCP_URL || "http://localhost:3000"
});

server.tool(
  {
    name: "suggest_trial",
    description: "Suggest a new optimization trial for a server and parameter space.",
    schema: z.object({
      server_id: z.string().min(1),
      param_space: z.record(z.string(), z.record(z.string(), z.any()))
    })
  },
  async ({ server_id, param_space }) => {
    const trialId = makeTrialId();
    const candidateParams = sampleParams(param_space);
    const sampler = chooseSampler(param_space);
    const createdAt = nowIso();

    const study = getStudy(server_id);
    study.trials.push({
      trial_id: trialId,
      params: candidateParams,
      sampler,
      created_at: createdAt,
      reward: null,
      metrics: {}
    });
    trialToServer.set(trialId, server_id);

    return {
      trial_id: trialId,
      candidate_params: candidateParams,
      sampler,
      created_at: createdAt
    };
  }
);

server.tool(
  {
    name: "record_feedback",
    description: "Record trial reward and metrics, update best-known config.",
    schema: z.object({
      trial_id: z.string().min(1),
      reward: z.number(),
      metrics: z.record(z.string(), z.any()).optional()
    })
  },
  async ({ trial_id, reward, metrics }) => {
    const serverId = trialToServer.get(trial_id);
    if (!serverId) {
      throw new Error(`unknown trial_id ${trial_id}`);
    }

    const study = getStudy(serverId);
    const trial = study.trials.find((item) => item.trial_id === trial_id);
    if (!trial) {
      throw new Error(`trial not found ${trial_id}`);
    }

    trial.reward = reward;
    trial.metrics = metrics ?? {};

    const previousBest = study.bestValue;
    if (study.bestValue === null || reward > study.bestValue) {
      study.bestValue = reward;
      study.bestTrialId = trial_id;
    }

    return {
      accepted: true,
      updated_best: previousBest === null || reward > previousBest,
      best_value: study.bestValue,
      study_size: study.trials.length
    };
  }
);

server.tool(
  {
    name: "get_best_config",
    description: "Return current best parameters for a server.",
    schema: z.object({
      server_id: z.string().min(1)
    })
  },
  async ({ server_id }) => {
    const study = getStudy(server_id);
    if (!study.bestTrialId) {
      return { best_params: {}, best_value: null, trial_id: null };
    }
    const trial = study.trials.find((item) => item.trial_id === study.bestTrialId);
    if (!trial) {
      return { best_params: {}, best_value: null, trial_id: null };
    }
    return {
      best_params: trial.params,
      best_value: study.bestValue,
      trial_id: study.bestTrialId
    };
  }
);

server.tool(
  {
    name: "get_trial_history",
    description: "Return all trials for a server.",
    schema: z.object({
      server_id: z.string().min(1)
    })
  },
  async ({ server_id }) => {
    const study = getStudy(server_id);
    return {
      trials: study.trials
    };
  }
);

server.listen().then(() => {
  console.log("forge-optimizer node service running");
});

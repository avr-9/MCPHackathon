from __future__ import annotations

import uuid
from typing import Any

import optuna
from optuna.samplers import CmaEsSampler, TPESampler

from .state import TrialHandle, TrialRecord, now_iso, state


class EngineError(Exception):
    pass


def _suggest_param(trial: optuna.Trial, name: str, spec: dict[str, Any]) -> Any:
    kind = str(spec.get("type", "categorical"))
    if kind == "float":
        return trial.suggest_float(
            name,
            float(spec["low"]),
            float(spec["high"]),
            log=bool(spec.get("log", False)),
            step=spec.get("step"),
        )
    if kind == "int":
        return trial.suggest_int(
            name,
            int(spec["low"]),
            int(spec["high"]),
            step=int(spec.get("step", 1)),
            log=bool(spec.get("log", False)),
        )
    if kind == "categorical":
        choices = spec.get("choices") or []
        if not choices:
            raise EngineError(f"categorical param '{name}' missing choices")
        return trial.suggest_categorical(name, choices)

    raise EngineError(f"unsupported parameter type '{kind}' for {name}")


def _is_continuous_space(param_space: dict[str, dict[str, Any]]) -> bool:
    if not param_space:
        return False
    return all(spec.get("type") in {"float", "int"} for spec in param_space.values())


def _choose_sampler(param_space: dict[str, dict[str, Any]]) -> tuple[optuna.samplers.BaseSampler, str]:
    if _is_continuous_space(param_space) and len(param_space) >= 2:
        return CmaEsSampler(seed=42), "cmaes"
    return TPESampler(seed=42), "tpe"


def _ensure_server_state(server_id: str) -> None:
    if server_id not in state.records_by_server:
        state.records_by_server[server_id] = []


def suggest_trial(server_id: str, param_space: dict[str, dict[str, Any]]) -> dict[str, Any]:
    if not server_id:
        raise EngineError("server_id is required")
    if not param_space:
        raise EngineError("param_space is required")

    _ensure_server_state(server_id)

    study = state.studies_by_server.get(server_id)
    sampler_name = "tpe"

    if study is None:
        sampler, sampler_name = _choose_sampler(param_space)
        study = optuna.create_study(
            direction="maximize",
            storage=optuna.storages.InMemoryStorage(),
            study_name=f"forge_opt_{server_id}",
            sampler=sampler,
        )
        state.studies_by_server[server_id] = study
    else:
        sampler_name = study.sampler.__class__.__name__.replace("Sampler", "").lower()

    trial = study.ask()
    params: dict[str, Any] = {}
    for name, spec in param_space.items():
        params[name] = _suggest_param(trial, name, spec)

    trial_id = f"t_{uuid.uuid4().hex[:10]}"

    state.handles_by_trial[trial_id] = TrialHandle(
        trial_id=trial_id,
        server_id=server_id,
        study_name=study.study_name,
        trial_number=trial.number,
        created_at=now_iso(),
    )

    state.records_by_server[server_id].append(
        TrialRecord(
            trial_id=trial_id,
            server_id=server_id,
            params=params,
            sampler=sampler_name,
            created_at=now_iso(),
        )
    )

    return {
        "trial_id": trial_id,
        "candidate_params": params,
        "sampler": sampler_name,
        "created_at": now_iso(),
    }


def record_feedback(trial_id: str, reward: float, metrics: dict[str, Any] | None = None) -> dict[str, Any]:
    handle = state.handles_by_trial.get(trial_id)
    if handle is None:
        raise EngineError(f"unknown trial_id {trial_id}")

    study = state.studies_by_server.get(handle.server_id)
    if study is None:
        raise EngineError(f"study not found for {handle.server_id}")

    study.tell(handle.trial_number, float(reward))

    records = state.records_by_server.get(handle.server_id, [])
    for record in records:
        if record.trial_id == trial_id:
            record.reward = float(reward)
            record.metrics = metrics or {}
            break

    best = None
    if study.best_trials:
        best = {
            "value": float(study.best_value),
            "params": dict(study.best_params),
        }

    return {
        "accepted": True,
        "updated_best": best is not None,
        "best_value": None if best is None else best["value"],
        "study_size": len(study.trials),
    }


def get_best_config(server_id: str) -> dict[str, Any]:
    study = state.studies_by_server.get(server_id)
    if study is None or not study.best_trials:
        return {
            "best_params": {},
            "best_value": None,
            "trial_id": None,
        }

    best_params = dict(study.best_params)
    best_value = float(study.best_value)

    best_trial_id = None
    for record in state.records_by_server.get(server_id, []):
        if record.reward == best_value and record.params == best_params:
            best_trial_id = record.trial_id
            break

    return {
        "best_params": best_params,
        "best_value": best_value,
        "trial_id": best_trial_id,
    }


def get_trial_history(server_id: str) -> dict[str, Any]:
    records = state.records_by_server.get(server_id, [])
    return {
        "trials": [
            {
                "trial_id": record.trial_id,
                "params": record.params,
                "reward": record.reward,
                "metrics": record.metrics,
                "sampler": record.sampler,
                "created_at": record.created_at,
            }
            for record in records
        ]
    }

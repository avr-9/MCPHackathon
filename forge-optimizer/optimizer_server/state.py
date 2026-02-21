from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any


@dataclass
class TrialHandle:
    trial_id: str
    server_id: str
    study_name: str
    trial_number: int
    created_at: str


@dataclass
class TrialRecord:
    trial_id: str
    server_id: str
    params: dict[str, Any]
    sampler: str
    created_at: str
    reward: float | None = None
    metrics: dict[str, Any] = field(default_factory=dict)


@dataclass
class OptimizerState:
    studies_by_server: dict[str, Any] = field(default_factory=dict)
    handles_by_trial: dict[str, TrialHandle] = field(default_factory=dict)
    records_by_server: dict[str, list[TrialRecord]] = field(default_factory=dict)


state = OptimizerState()


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

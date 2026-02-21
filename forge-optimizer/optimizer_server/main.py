from __future__ import annotations

from typing import Any

from mcp_use.server import MCPServer

from .optuna_engine import EngineError, get_best_config, get_trial_history, record_feedback, suggest_trial

server = MCPServer(
    name="forge-optimizer",
    version="0.1.0",
    instructions="Optimization server for trial suggestion and feedback",
)


@server.tool(name="suggest_trial", description="Suggest a new Optuna trial for a server")
def suggest_trial_tool(server_id: str, param_space: dict[str, dict[str, Any]]) -> dict[str, Any]:
    try:
        return suggest_trial(server_id=server_id, param_space=param_space)
    except EngineError as exc:
        return {"error": str(exc)}


@server.tool(name="record_feedback", description="Record trial feedback and reward")
def record_feedback_tool(trial_id: str, reward: float, metrics: dict[str, Any] | None = None) -> dict[str, Any]:
    try:
        return record_feedback(trial_id=trial_id, reward=reward, metrics=metrics)
    except EngineError as exc:
        return {"error": str(exc)}


@server.tool(name="get_best_config", description="Get best known configuration for a server")
def get_best_config_tool(server_id: str) -> dict[str, Any]:
    return get_best_config(server_id=server_id)


@server.tool(name="get_trial_history", description="Get trial history for a server")
def get_trial_history_tool(server_id: str) -> dict[str, Any]:
    return get_trial_history(server_id=server_id)


if __name__ == "__main__":
    server.run(
        transport="streamable-http",
        host="0.0.0.0",
        port=8100,
    )

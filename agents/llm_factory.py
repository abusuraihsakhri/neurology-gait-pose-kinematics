"""
Deterministic mock inference adapter with identifier-pattern checks.
"""
from typing import Dict, Any, Optional
from .base import PHIGuard


class MockLLM:
    def __init__(self, system_name: str = "Neurology Gait Pose Kinematics"):
        self.system_name = system_name

    def invoke(self, prompt: str) -> str:
        PHIGuard.assert_no_phi(prompt)
        return f"[{self.system_name} mock response]: No clinical or scientific analysis was performed. Query: '{prompt[:60]}...'."


class LLMFactory:
    """Creates the supported mock adapter; other providers are not implemented."""

    @staticmethod
    def create(provider: str = "mock", system_name: str = "Neurology Gait Pose Kinematics"):
        prov = str(provider).lower()
        if prov in ["mock", "deterministic", "test"]:
            return MockLLM(system_name)
        raise ValueError(
            f"Provider {provider!r} is not implemented. "
            "Only the deterministic mock provider is available."
        )

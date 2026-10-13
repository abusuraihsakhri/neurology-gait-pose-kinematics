import pytest
from fastapi.testclient import TestClient
from agents.base import AuditTrail, PHIGuard, SecurityException
from agents.api import app
from agents.models import SystemTaskPayload
from agents.supervisor import SystemSupervisor
from agents.llm_factory import LLMFactory


def test_audit_signature_detects_modified_fields():
    ledger = AuditTrail(secret_key="unit-test-secret")
    ledger.log("tester", "supervisor", "EVALUATED", {"result": "ok"})
    ledger.log("tester", "supervisor", "NEXT", {"result": "ok"})
    assert ledger.verify_integrity()
    ledger.logs[0]["actor"] = "attacker"
    assert not ledger.verify_integrity()


def test_audit_signature_detects_corrupted_hash():
    ledger = AuditTrail(secret_key="unit-test-secret")
    ledger.log("tester", "supervisor", "EVALUATED", {"result": "ok"})
    ledger.logs[0]["current_hash"] = "0" * 64
    assert not ledger.verify_integrity()


def test_get_trail_is_defensive_copy():
    ledger = AuditTrail(secret_key="unit-test-secret")
    ledger.log("tester", "supervisor", "EVALUATED", {"result": "ok"})
    copy = ledger.get_trail()
    copy[0]["actor"] = "different"
    assert ledger.verify_integrity()


def test_metadata_identifier_is_screened():
    payload = SystemTaskPayload(
        task_id="T1", target_identifier="KEY-001", primary_metric=12,
        attributes={"contact": "jane@example.com"},
    )
    with pytest.raises(SecurityException):
        SystemSupervisor().process_task(payload)


def test_audit_log_endpoint_requires_admin_token(monkeypatch):
    client = TestClient(app)
    monkeypatch.delenv("AUDIT_ADMIN_TOKEN", raising=False)
    assert client.get("/api/audit/logs").status_code == 403
    monkeypatch.setenv("AUDIT_ADMIN_TOKEN", "test-only-token")
    assert client.get("/api/audit/logs").status_code == 403
    assert client.get("/api/audit/logs", headers={"x-audit-token": "test-only-token"}).status_code == 200


def test_unimplemented_llm_providers_do_not_pretend_to_work():
    with pytest.raises(ValueError, match="not implemented"):
        LLMFactory.create("openai")


def test_mock_does_not_claim_validated_analysis():
    assert "No clinical or scientific analysis" in LLMFactory.create().invoke("status")

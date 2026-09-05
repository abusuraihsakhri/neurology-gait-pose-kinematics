# Neurology Gait Pose Kinematics

> **Domain:** Clinical Decision Support & Biomedical Computing  
> **Reference Guidelines & Standards:** CAP / CLSI / ISO Standards, MDS-UPDRS Motor Examination Standards

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
![Python](https://img.shields.io/badge/Python-3.10%20%7C%203.11%20%7C%203.12-3776AB.svg?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688.svg?logo=fastapi&logoColor=white)
![Audit Trail](https://img.shields.io/badge/Audit-HMAC--SHA256_Tamper--Evident-brightgreen.svg)
![Zero-PHI Guard](https://img.shields.io/badge/Guard-Zero--PHI_Outbound-blue.svg)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg?logo=docker&logoColor=white)

</div>

---

## 📖 What It Does

Neurology Gait Pose Kinematics is a multi-agent evaluation system for clinical gait analysis. It processes kinematic measurements through specialized worker agents that perform quality control, safety escalation, and protocol conformance checks, producing cryptographically signed audit trails for each evaluation.

---

## ⚙️ Key Capabilities & Algorithmic Modules

- **Deterministic Calculation Engine**: Strict compliance with standard reference formulations and thresholds.
- **Risk & Urgency Classification**: Multi-tier categorization (ROUTINE, ELEVATED_RISK, CRITICAL_STAT_PANIC) with automated clinical/operational action recommendations.
- **Validation & Guardrails**: Rigorous input bounds checking, NaN/Inf rejection, and anomaly detection.
- **Multi-Agent Worker Architecture**: Specialized workers for QC invariants, safety boundaries, and protocol conformance.

---

## 💻 CLI Quickstart & Usage

### Installation
```bash
pip install -e ".[dev]"
```

### 1. Run Single Task Evaluation
```bash
python cli.py audit --task-id TASK-001 --target KEY-01 --primary 28.5 --secondary 14.2 --critical --status DISCORDANT
```

### 2. Interactive Chat Query
```bash
python cli.py chat "What is the system status?"
```

### 3. Batch Process CSV Records
```bash
python cli.py batch -i sample.csv -o results.csv
```

### 4. Verify Audit Trail Integrity
```bash
python cli.py verify-audit
```

### 5. Launch FastAPI REST Server
```bash
python cli.py serve --host 127.0.0.1 --port 8000
```

### Parameter Reference
| Argument | Description | Default |
|:---------|:------------|:--------|
| `--task-id` | Unique task/case identifier | TASK-2026-001 |
| `--target` | Entity or patient key identifier | KEY-TARGET-01 |
| `--primary` | Primary domain measurement or score | 28.5 |
| `--secondary` | Secondary kinetic or confidence score | 14.2 |
| `--critical` | Emergency escalation flag | False |
| `--status` | Status code or phenotype descriptor | DISCORDANT |

### Input Data Schema (CSV/JSON)

| Field | Description | Requirement |
|:------|:------------|:------------|
| `task_id` | Unique task identifier | Required |
| `target_identifier` | Entity/patient key | Required |
| `primary_metric` | Primary measurement value | Required |
| `secondary_metric` | Secondary kinetic score | Optional (default: 0.0) |
| `is_critical_flag` | Emergency escalation flag | Optional (default: false) |
| `status_descriptor` | Status/phenotype code | Optional (default: NOMINAL) |

---

## 🛡️ Security & Enterprise Architecture

* **Zero-PHI Outbound Interceptor:** Active regex inspection blocking SSNs, MRNs, phone numbers, and patient identifiers.
* **Tamper-Evident HMAC-SHA256 Audit Trail:** Chained, cryptographically signed logs for every evaluation and state transition.
* **Air-Gapped LLM Reasoning Adapter:** Agnostic integration for local Ollama instances (`llama3`, `mistral`), Claude 3.5 Sonnet, GPT-4o, and deterministic test mocks.
* **Active Learning Bayesian Calibration:** Dynamic tracker updating worker reliability weights and monitoring Brier calibration drift.
* **FastAPI & Prometheus Telemetry:** Exposes OpenAPI 3.1 REST endpoints and operational Prometheus metrics (`/metrics`).

### Security Configuration

Set the `AUDIT_SECRET_KEY` environment variable in production:
```bash
export AUDIT_SECRET_KEY="your-secure-random-key-here"
```

Without this variable, the system will emit a warning and use a development-only default.

---

## 🧪 Testing & Verification

Run the automated test suite:

```bash
pytest -v
```

Execute high-throughput batch simulation benchmarks:

```bash
python simulator.py --tasks 1000 --concurrency 8
```

---

## 🐳 Container Deployment

```bash
docker build -t neurology-gait-pose-kinematics .
docker run -p 8000:8000 -e AUDIT_SECRET_KEY=your-secure-key neurology-gait-pose-kinematics
```

---

## 📁 Project Structure

```
neurology-gait-pose-kinematics/
├── agents/                  # Multi-agent evaluation system
│   ├── api.py              # FastAPI REST endpoints
│   ├── base.py             # PHI guard, HMAC audit trail, security
│   ├── models.py           # Pydantic v2 schemas
│   ├── supervisor.py       # Master orchestrator
│   ├── workers.py          # Specialized evaluation workers
│   ├── llm_factory.py      # LLM provider abstraction
│   ├── metrics.py          # Prometheus metrics collector
│   ├── learning.py         # Bayesian calibration engine
│   └── streamer.py         # WebSocket telemetry broadcaster
├── gait_mind_ai/           # GaitMind-AI specialized module
│   ├── agents.py           # Skeletal keypoint & UPDRS agents
│   ├── engine.py           # Core algorithmic engine
│   ├── models.py           # Data models & telemetry definitions
│   ├── cli.py              # GaitMind-specific CLI
│   └── server.py           # FastAPI server factory
├── tests/                  # Pytest test suite
├── web/                    # Static web assets
├── cli.py                  # Main CLI entry point
├── simulator.py            # High-throughput simulation benchmark
├── enrichment.py           # Domain enrichment feature engines
├── sample.csv              # Sample input data
├── sample_payload.json     # Sample API payload
├── Dockerfile              # Container build instructions
└── docker-compose.yml      # Multi-service orchestration
```

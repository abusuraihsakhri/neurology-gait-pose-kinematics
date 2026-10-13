# Neurology Gait Pose Kinematics

Rule-based numeric evaluation utilities for a **research demonstration**, with a standalone browser interface and two existing Python evaluation pipelines. The name is historical: this repository **does not** process video, estimate 3D poses, compute stride or joint kinematics, train gait classifiers, or produce validated MDS-UPDRS scores.

## Browser application

The `web/` directory contains a fully local evaluator with three configurable-in-code checks. It runs without a backend or Python runtime, and is suitable for static hosting on GitHub Pages after Pages is enabled in repository settings.

To test locally:

```bash
python -m http.server 8080 --directory web
```

Open `http://localhost:8080/`. Evaluate one task or upload a CSV of up to 5,000 records (1 MB); download the resulting JSON or CSV. The browser version applies the main `agents/workers.py` rule thresholds: primary metric greater than **25**, secondary metric greater than **12**, explicit critical flag, and descriptor keyword matching. Equality to a threshold does not trigger an alert. It performs no network requests or persistent storage.

**Limitations:** The thresholds are illustrative and not clinically validated. The results are rule flags, not diagnoses, triage instructions, or fall-risk estimates. Avoid uploading or entering protected health information. The browser does not generate cryptographic audit signatures.

## Python CLI and API

Python **3.10+** is required. The default CLI uses the `agents/` pipeline; the separately packaged `gait-mind` command uses the legacy `gait_mind_ai/` demonstration pipeline, which has different secondary thresholds.

```bash
python -m pip install -e ".[server,dev]"
neurology-gait-pose-kinematics audit --task-id TASK-001 --target KEY-01 --primary 28.5 --secondary 14.2
neurology-gait-pose-kinematics batch -i sample.csv -o results.csv
neurology-gait-pose-kinematics verify-audit
neurology-gait-pose-kinematics serve --host 127.0.0.1 --port 8000
```

API endpoints: `GET /health`, `GET /metrics`, `POST /api/audit`, `POST /api/chat`. `GET /api/audit/logs` requires the `X-Audit-Token` header matching `AUDIT_ADMIN_TOKEN`; without that environment variable it is disabled.

`sample.csv` demonstrates the batch fields: `task_id`, `target_identifier`, `primary_metric`, `secondary_metric`, `status_descriptor`, and `is_critical_flag`. Malformed Python batch rows are skipped with warnings; browser CSV batches instead report per-row errors.

For container deployment:

```bash
export AUDIT_SECRET_KEY="$(python -c 'import secrets; print(secrets.token_hex(32))')"
export AUDIT_ADMIN_TOKEN="$(python -c 'import secrets; print(secrets.token_hex(32))')"
docker compose up --build
```

Compose binds to localhost by default. Treat access to the API as trusted-network access; it is **not** a production-grade clinical service with authenticated audit submissions.

## Security and privacy

Python evaluation results are retained in process memory, and the Python audit ledger stores HMAC-SHA256 entries (metadata and payload hashes, not raw metric details). Signature and predecessor checks detect post-hoc modifications within the running process. Provide `AUDIT_SECRET_KEY` to retain the same verification key across restarts; without it a random temporary key is generated with a warning. Neither ledger persistence nor clinical-record retention is implemented.

The optional regex identifier filter detects some common identifier patterns; it is **not comprehensive de-identification, a HIPAA compliance guarantee, or an outbound network interceptor**. The chat adapter is a deterministic mock. External LLM providers are not implemented.

## Testing

```bash
python -m pytest -q
python -m compileall -q agents gait_mind_ai cli.py enrichment.py simulator.py
node --test web/evaluator.test.mjs
node --check web/ui.mjs
```

GitHub Actions runs the Python suite on Python 3.10–3.12 and browser-rule tests on Node 22. The `enrichment.py` modules are placeholder numeric threshold evaluators, not functioning ML or device integrations.

## Technology and compatibility

Python, Pydantic 2, optional FastAPI/Uvicorn, and dependency-free ES modules/CSS/HTML for current desktop and mobile browsers. Run the browser app over HTTP(S), not via `file://`, so ES modules can load. The static web app uses no CDN.

## License

[MIT](LICENSE).

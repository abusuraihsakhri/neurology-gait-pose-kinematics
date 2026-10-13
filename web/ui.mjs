import { evaluate, parseCsv, evaluateBatch, resultsCsv } from './evaluator.mjs';

const byId = id => document.getElementById(id);
let lastResult = null;
let lastBatch = null;
let evaluated = 0;
let flagged = 0;
let critical = 0;

function download(filename, data, mime) {
  const blob = new Blob([data], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
function renderResult(result) {
  const status = byId('status-label');
  status.textContent = result.overall_urgency.replaceAll('_', ' ');
  status.className = 'status ' + (result.overall_urgency === 'ROUTINE' ? 'ok' :
    result.critical_alerts_count ? 'critical' : 'warn');
  byId('result-summary').textContent = result.total_alerts + ' rule alert(s) · ' +
    result.integrity_status.replaceAll('_', ' ') + '.';
  const host = byId('alerts');
  host.replaceChildren();
  for (const alert of result.alerts) {
    const item = document.createElement('article');
    item.className = 'alert';
    const title = document.createElement('strong');
    title.textContent = alert.summary;
    const worker = document.createElement('small');
    worker.textContent = alert.origin_worker + ' · ' + alert.urgency;
    const details = document.createElement('p');
    details.textContent = alert.technical_details;
    item.append(title, document.createElement('br'), worker, details);
    host.append(item);
  }
  byId('result-json').textContent = JSON.stringify(result, null, 2);
  byId('download-json').disabled = false;
}
byId('audit-form').addEventListener('submit', event => {
  event.preventDefault();
  const fd = new FormData(event.currentTarget);
  try {
    const result = evaluate({
      task_id: fd.get('task_id'), target_identifier: fd.get('target_identifier'),
      primary_metric: fd.get('primary_metric'), secondary_metric: fd.get('secondary_metric'),
      status_descriptor: fd.get('status_descriptor'),
      is_critical_flag: fd.has('is_critical_flag'),
    });
    lastResult = result;
    evaluated++;
    if (result.total_alerts) flagged++;
    if (result.critical_alerts_count) critical++;
    byId('count').textContent = String(evaluated);
    byId('flagged').textContent = String(flagged);
    byId('critical-count').textContent = String(critical);
    renderResult(result);
  } catch (error) {
    byId('status-label').textContent = 'Invalid input';
    byId('status-label').className = 'status critical';
    byId('result-summary').textContent = error.message;
    byId('alerts').replaceChildren();
    byId('result-json').textContent = 'No result';
    byId('download-json').disabled = true;
    lastResult = null;
  }
});
byId('download-json').addEventListener('click', () => {
  if (lastResult) download('gait-rule-result.json', JSON.stringify(lastResult, null, 2) + '\n', 'application/json');
});
byId('run-batch').addEventListener('click', async () => {
  const file = byId('csv-file').files[0];
  const status = byId('batch-status');
  lastBatch = null;
  byId('download-csv').disabled = true;
  if (!file) { status.textContent = 'Choose a CSV file first.'; return; }
  if (file.size > 1024 * 1024) { status.textContent = 'File exceeds 1 MB limit.'; return; }
  try {
    const rows = parseCsv(await file.text());
    lastBatch = evaluateBatch(rows);
    const bad = lastBatch.filter(item => item.status === 'ERROR').length;
    status.textContent = lastBatch.length + ' rows evaluated; ' + bad +
      ' invalid rows. Export CSV for row-level details.';
    byId('download-csv').disabled = false;
  } catch (error) {
    status.textContent = 'CSV error: ' + error.message;
  }
});
byId('download-csv').addEventListener('click', () => {
  if (lastBatch) download('gait-rule-batch-results.csv', resultsCsv(lastBatch), 'text/csv;charset=utf-8');
});

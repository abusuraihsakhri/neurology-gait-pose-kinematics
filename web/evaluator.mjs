/**
 * Browser-only parity implementation of the generic rule checks in agents/workers.py.
 * These numerical cutoffs are demonstration settings, not validated gait standards.
 */
export const THRESHOLDS = Object.freeze({ primary: 25, secondary: 12 });
export const MAX_CSV_ROWS = 5000;

function text(value, name) {
  if (typeof value !== 'string' || !value.trim() || value.length > 200) {
    throw new Error(name + ' must be 1–200 characters');
  }
  return value.trim();
}
function number(value, name) {
  if (value === '' || value === null || value === undefined ||
      (typeof value === 'string' && !value.trim())) {
    throw new Error(name + ' is required');
  }
  const n = Number(value);
  if (!Number.isFinite(n)) throw new Error(name + ' must be a finite number');
  return n;
}
export function evaluate(payload) {
  const task = text(payload.task_id, 'Task ID');
  const target = text(payload.target_identifier, 'Target identifier');
  const descriptor = text(payload.status_descriptor, 'Status descriptor');
  const primary = number(payload.primary_metric, 'Primary metric');
  const secondary = number(payload.secondary_metric, 'Secondary metric');
  if (typeof payload.is_critical_flag !== 'boolean') {
    throw new Error('Critical flag must be a boolean');
  }
  const alerts = [];
  function add(worker, urgency, summary, details, remediation) {
    alerts.push({
      origin_worker: worker, urgency, summary,
      technical_details: details, actionable_remediation: remediation,
    });
  }
  if (primary > THRESHOLDS.primary) {
    add('InvariantQCWorker', 'ELEVATED_RISK', 'Primary Metric Threshold Exceeded',
      'Primary value ' + primary.toFixed(2) + ' exceeds configured limit 25.00.',
      'Review the parameter and its measurement method.');
  }
  if (payload.is_critical_flag || secondary > THRESHOLDS.secondary) {
    add('SafetyEscalationWorker', payload.is_critical_flag ? 'CRITICAL_STAT_PANIC' : 'ELEVATED_RISK',
      'Safety Rule Triggered', 'CriticalFlag=' + payload.is_critical_flag +
      '; secondary index ' + secondary.toFixed(2) + '.',
      'Review the rule trigger and confirm the underlying data.');
  }
  if (['DISCORDANT', 'ANOMALY', 'MUTANT', 'VIOLATION', 'FAIL', 'REJECT']
      .some(word => descriptor.toUpperCase().includes(word))) {
    add('ProtocolConformanceWorker', 'ELEVATED_RISK',
      'Descriptor Flag Detected', 'Descriptor: ' + descriptor,
      'Review the input descriptor and data provenance.');
  }
  const critical = alerts.filter(a => a.urgency === 'CRITICAL_STAT_PANIC').length;
  const urgency = critical ? 'CRITICAL_STAT_PANIC' :
    alerts.length ? 'ELEVATED_RISK' : 'ROUTINE';
  const integrity = critical ? 'RECALIBRATION_REQUIRED' :
    alerts.length ? 'DISCORDANT_ANOMALY' : 'VALIDATED_OPTIMAL';
  return {
    mode: 'LOCAL_BROWSER_RULES', task_id: task, target_identifier: target,
    overall_urgency: urgency, integrity_status: integrity,
    total_alerts: alerts.length, critical_alerts_count: critical, alerts,
    note: 'Research demonstration only. Thresholds are illustrative, not clinically validated.',
  };
}

export function parseCsv(content) {
  if (typeof content !== 'string') throw new Error('Invalid CSV input');
  const rows = []; let row = []; let cell = ''; let quoted = false;
  for (let i = 0; i < content.length; i++) {
    const c = content[i];
    if (c === '"') {
      if (quoted && content[i + 1] === '"') { cell += '"'; i++; }
      else if (quoted) quoted = false;
      else if (cell === '') quoted = true;
      else throw new Error('Unexpected quote in CSV');
    } else if (c === ',' && !quoted) {
      row.push(cell); cell = '';
    } else if ((c === '\n' || c === '\r') && !quoted) {
      if (c === '\r' && content[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      if (row.some(x => x !== '')) rows.push(row);
      row = [];
    } else {
      cell += c;
    }
  }
  if (quoted) throw new Error('Unterminated quoted CSV field');
  row.push(cell);
  if (row.some(x => x !== '')) rows.push(row);
  if (!rows.length) throw new Error('CSV is empty');
  if (rows.length - 1 > MAX_CSV_ROWS) throw new Error('Maximum 5000 records per batch');
  const headers = rows.shift().map(x => x.trim().replace(/^\uFEFF/, ''));
  if (new Set(headers).size !== headers.length) throw new Error('Duplicate CSV headers');
  for (const required of ['task_id', 'target_identifier', 'primary_metric']) {
    if (!headers.includes(required)) throw new Error('Missing CSV column: ' + required);
  }
  return rows.map((values, index) => {
    if (values.length !== headers.length) {
      throw new Error('CSV record ' + (index + 2) + ' has wrong column count');
    }
    return Object.fromEntries(headers.map((h, i) => [h, values[i]]));
  });
}
function parseBool(value) {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (['1', 'yes', 'true'].includes(normalized)) return true;
  if (['0', 'no', 'false', ''].includes(normalized)) return false;
  throw new Error('Critical flag must be true/false or 1/0');
}
export function evaluateBatch(rows) {
  return rows.map((row, index) => {
    try {
      const result = evaluate({
        task_id: row.task_id, target_identifier: row.target_identifier,
        primary_metric: row.primary_metric,
        secondary_metric: row.secondary_metric === '' || row.secondary_metric === undefined ? 0 : row.secondary_metric,
        status_descriptor: row.status_descriptor || 'NOMINAL',
        is_critical_flag: parseBool(row.is_critical_flag),
      });
      return { row: index + 2, task_id: result.task_id, status: result.overall_urgency,
        alerts: result.total_alerts, error: '' };
    } catch (error) {
      return { row: index + 2, task_id: String(row.task_id || ''), status: 'ERROR',
        alerts: '', error: error.message };
    }
  });
}
export function resultsCsv(results) {
  const columns = ['row', 'task_id', 'status', 'alerts', 'error'];
  const quote = value => {
    let clean = String(value ?? '');
    // Prevent spreadsheet formula execution when exported CSV is opened in Excel.
    if (/^\s*[=+@-]/.test(clean)) clean = "'" + clean;
    return '"' + clean.replaceAll('"', '""') + '"';
  };
  return [columns.join(','), ...results.map(row => columns.map(key => quote(row[key])).join(','))].join('\r\n') + '\r\n';
}

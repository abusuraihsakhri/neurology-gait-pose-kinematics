import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, parseCsv, evaluateBatch, resultsCsv } from './evaluator.mjs';

function payload(overrides = {}) {
  return { task_id: 'T1', target_identifier: 'KEY-1', primary_metric: 10,
    secondary_metric: 4, status_descriptor: 'NOMINAL', is_critical_flag: false, ...overrides };
}
test('normal case and exact boundaries are routine', () => {
  assert.equal(evaluate(payload({primary_metric:25,secondary_metric:12})).overall_urgency, 'ROUTINE');
});
test('above each threshold produces an elevated alert', () => {
  const result = evaluate(payload({primary_metric:26,secondary_metric:13}));
  assert.equal(result.total_alerts, 2);
  assert.equal(result.overall_urgency, 'ELEVATED_RISK');
});
test('critical input overrides elevated descriptors', () => {
  const result = evaluate(payload({is_critical_flag:true,status_descriptor:'discordant'}));
  assert.equal(result.overall_urgency, 'CRITICAL_STAT_PANIC');
  assert.equal(result.critical_alerts_count, 1);
  assert.equal(result.total_alerts, 2);
});
test('NaN, Infinity, and empty inputs are rejected', () => {
  for (const value of ['NaN', 'Infinity', '', null]) {
    assert.throws(() => evaluate(payload({primary_metric:value})), /finite|require/);
  }
});
test('invalid boolean type is rejected', () => {
  assert.throws(() => evaluate(payload({is_critical_flag:'false'})), /boolean/);
});
test('quoted CSV fields and embedded newlines parse', () => {
  const rows = parseCsv('task_id,target_identifier,primary_metric,status_descriptor\r\n"T,1",KEY,26,"Anomaly\nflag"\r\n');
  assert.equal(rows[0].task_id, 'T,1');
  assert.equal(rows[0].status_descriptor, 'Anomaly\nflag');
  assert.equal(evaluateBatch(rows)[0].status, 'ELEVATED_RISK');
});
test('CSV schema, malformed quoting, duplicate columns are rejected', () => {
  assert.throws(() => parseCsv('task_id,primary_metric\na,2\n'), /target_identifier/);
  assert.throws(() => parseCsv('task_id,task_id,target_identifier,primary_metric\na,b,c,2'), /Duplicate/);
  assert.throws(() => parseCsv('task_id,target_identifier,primary_metric\n"oops'), /Unterminated/);
});
test('bad rows are reported, not omitted', () => {
  const out = evaluateBatch([{task_id:'A',target_identifier:'B',primary_metric:'not a number'},
    {task_id:'B',target_identifier:'C',primary_metric:'7',is_critical_flag:'no'}]);
  assert.equal(out[0].status, 'ERROR');
  assert.equal(out[1].status, 'ROUTINE');
  assert.match(resultsCsv(out), /ERROR/);
});
\ntest('whitespace-only numeric input is invalid', () => {
  assert.throws(() => evaluate(payload({ primary_metric: '  ' })), /required/);
});
test('CSV export neutralizes spreadsheet formulas', () => {
  const csv = resultsCsv([{row: 2, task_id: '=2+2', status: 'ERROR', alerts: '', error: ''}]);
  assert.ok(csv.includes(`"'=2+2"`));
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('../posthog-dashboards.mjs', import.meta.url));
const dryRun = (...args) => JSON.parse(execFileSync(process.execPath, [script, '--dry-run', ...args], { env: {} }).toString());

test('dashboard and insight names are unique (sync matches by name)', () => {
  const { dashboards } = dryRun();
  assert.equal(new Set(dashboards.map((d) => d.name)).size, dashboards.length);
  for (const d of dashboards) {
    const names = d.insights.map((i) => i.name);
    assert.equal(new Set(names).size, names.length, `duplicate insight name in ${d.name}`);
  }
});

test('every SQL insight keeps {filters} so the dashboard date and channel filters apply', () => {
  for (const d of dryRun().dashboards) {
    for (const i of d.insights) {
      if (i.query.kind !== 'DataVisualizationNode') continue;
      assert.match(i.query.source.query, /\{filters\}/, i.name);
    }
  }
});

test('every insight has a query PostHog knows how to render', () => {
  const kinds = new Set(['TrendsQuery', 'RetentionQuery', 'StickinessQuery', 'FunnelsQuery', 'HogQLQuery']);
  for (const d of dryRun().dashboards) {
    for (const i of d.insights) assert.ok(kinds.has(i.query.source?.kind), `${i.name}: ${i.query.source?.kind}`);
  }
});

test('--channel picks the dashboard filter', () => {
  assert.equal(dryRun().channel, 'production');
  assert.equal(dryRun('--channel', 'all').channel, 'all');
});

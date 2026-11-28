// protects=the committed occasion table is exactly what the generator produces; fails_when=someone hand-edits dates.generated.ts or changes the generator without regenerating; no_claim=does not prove Umm al-Qura matches local moon sighting
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const script = join(here, '..', 'generate-dates.mjs');
const committed = join(here, '..', '..', '..', 'src', 'sdk', 'occasion', 'dates.generated.ts');

test('regenerating gives the committed table', () => {
  const out = join(mkdtempSync(join(tmpdir(), 'occasion-')), 'dates.ts');
  execFileSync(process.execPath, [script], { env: { ...process.env, OCCASION_DATES_OUT: out }, stdio: 'ignore' });
  assert.equal(readFileSync(out, 'utf8'), readFileSync(committed, 'utf8'));
});

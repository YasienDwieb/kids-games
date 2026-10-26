import fs from 'fs';
import path from 'path';

// Swapping analytics vendors must stay a one-sink change: only files under
// src/sdk/analytics/sinks/ may import a vendor SDK.
const VENDORS = ['posthog-react-native', '@aptabase/', '@amplitude/', 'mixpanel', '@segment/'];
const SRC = path.resolve(__dirname, '../../..');
const SINKS = path.join(SRC, 'sdk', 'analytics', 'sinks');

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === '__tests__' ? [] : sourceFiles(full);
    return /\.tsx?$/.test(e.name) ? [full] : [];
  });
}

it('keeps vendor analytics SDK imports inside sinks/', () => {
  const offenders = sourceFiles(SRC)
    .filter((f) => !f.startsWith(SINKS))
    .filter((f) => {
      const text = fs.readFileSync(f, 'utf8');
      return VENDORS.some((v) => text.includes(`'${v}`) || text.includes(`"${v}`));
    })
    .map((f) => path.relative(SRC, f));
  expect(offenders).toEqual([]);
});

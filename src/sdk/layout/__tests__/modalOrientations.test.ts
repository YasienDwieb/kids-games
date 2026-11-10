import fs from 'fs';
import path from 'path';

// A <Modal> without supportedOrientations presents in portrait on iOS, which crashes
// the landscape-only release build (Color Mixer's discovery card did).
const SRC = path.resolve(__dirname, '../../..');

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === '__tests__' ? [] : sourceFiles(full);
    return /\.tsx$/.test(e.name) ? [full] : [];
  });
}

it('gives every <Modal> the landscape orientations', () => {
  const offenders = sourceFiles(SRC).flatMap((f) => {
    const text = fs.readFileSync(f, 'utf8');
    const opens = [...text.matchAll(/<Modal\b[^>]*>/g)];
    return opens
      .filter((m) => !m[0].includes('supportedOrientations={MODAL_ORIENTATIONS}'))
      .map(() => path.relative(SRC, f));
  });
  expect(offenders).toEqual([]);
});

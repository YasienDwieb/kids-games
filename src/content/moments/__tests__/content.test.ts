import { validateMoments } from '@/sdk/moments/validate';
import { MOMENTS } from '../index';

// protects=no unsourced or unreviewed moment is ever bundled; fails_when=an entry lacks reviewedBy, reviewedOn, a source, or recitation permission (the test names it); no_claim=does not check the content itself is correct, only that someone named signed it off
it('every bundled moment is sourced and reviewed', () => {
  expect(validateMoments(MOMENTS).dropped).toEqual([]);
});

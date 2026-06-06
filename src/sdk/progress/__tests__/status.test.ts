import { resumeStatusFor } from '../status';

describe('resumeStatusFor', () => {
  it('is playing for a fresh checkpoint', () => {
    expect(resumeStatusFor({ level: 1, score: 0, updatedAt: 0 })).toBe('playing');
  });

  it('is resumable when past level 1', () => {
    expect(resumeStatusFor({ level: 3, score: 0, updatedAt: 5 })).toBe('resumable');
  });

  it('is resumable when score was earned on level 1', () => {
    expect(resumeStatusFor({ level: 1, score: 8, updatedAt: 5 })).toBe('resumable');
  });
});

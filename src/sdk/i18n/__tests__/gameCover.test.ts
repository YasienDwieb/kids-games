import { i18n } from '../index';
import { gameCover } from '../gameMeta';
import type { GameConfig } from '@/sdk/config/types';

const game = { id: 'g', cover: 1, coverByLanguage: { ar: 2 } } as unknown as GameConfig;

describe('gameCover', () => {
  const was = i18n.language;
  afterAll(() => i18n.changeLanguage(was));

  it('picks the cover for the active language, else the default', async () => {
    await i18n.changeLanguage('ar');
    expect(gameCover(game)).toBe(2);
    await i18n.changeLanguage('en');
    expect(gameCover(game)).toBe(1);
    expect(gameCover({ ...game, coverByLanguage: undefined })).toBe(1);
  });
});

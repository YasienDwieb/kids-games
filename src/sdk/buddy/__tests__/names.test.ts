import { buddyNameFor, clearBuddyName, customName, customWelcomeClip, saveBuddyName } from '../names';

const flush = () => new Promise((r) => setTimeout(r, 0));

it('falls back to the built-in name until a grown-up saves one', async () => {
  expect(customName('mariam', 'en')).toBeNull();
  expect(customWelcomeClip('mariam', 'en')).toBeNull();

  await saveBuddyName('mariam', { en: 'Noor', ar: '', clips: { en: 'file:///en.wav', ar: 'file:///ar.wav' } });
  await flush();
  expect(customName('mariam', 'en')).toBe('Noor');
  // No Arabic spelling: the English one is shown in Arabic too.
  expect(customName('mariam', 'ar')).toBe('Noor');
  expect(customWelcomeClip('mariam', 'ar')).toBe('file:///ar.wav');
  expect(customName('anas', 'en')).toBeNull();

  await saveBuddyName('mariam', { en: 'Noor', ar: 'نور', clips: { en: 'file:///en.wav', ar: 'file:///ar.wav' } });
  await flush();
  expect(customName('mariam', 'ar')).toBe('نور');

  await clearBuddyName('mariam');
  await flush();
  expect(buddyNameFor('mariam')).toBeNull();
  expect(customName('mariam', 'en')).toBeNull();
});

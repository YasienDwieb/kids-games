import { holdVoice, reserveVoice, voiceBusyRemaining, voiceHoldRemaining } from '../voiceGate';

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

it('makes prompts wait for both playing and booked clips', () => {
  holdVoice(1000);
  reserveVoice(3000);
  expect(voiceHoldRemaining()).toBe(3000);
  // SDK moments only wait for what is actually playing.
  expect(voiceBusyRemaining()).toBe(1000);

  jest.advanceTimersByTime(3000);
  expect(voiceHoldRemaining()).toBe(0);
  expect(voiceBusyRemaining()).toBe(0);
});

it('never shortens an existing hold', () => {
  holdVoice(2000);
  holdVoice(500);
  expect(voiceBusyRemaining()).toBe(2000);
  jest.advanceTimersByTime(2000);
});

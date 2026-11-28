import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, create } from 'react-test-renderer';
import { useOccasionWelcome } from '../useOccasion';
import { OCCASION_THEMES, type OccasionTheme } from '../themes';
import { giftsStore } from '@/sdk/player/outfitStore';
import { greetedStore } from '../useOccasion';
import { track } from '@/sdk/analytics/client';

const mockSpeak = jest.fn(() => Promise.resolve());
jest.mock('@/sdk/speech/useSpeech', () => ({ useSpeech: () => ({ speak: mockSpeak, stop: jest.fn() }) }));
jest.mock('@/sdk/analytics/client', () => ({ track: jest.fn() }));
jest.mock('@/sdk/i18n', () => ({ currentLanguage: () => 'en' }));
const mockTrack = track as jest.MockedFunction<typeof track>;

let result: ReturnType<typeof useOccasionWelcome>;
function Probe({ theme, active }: { theme: OccasionTheme | null; active: boolean }) {
  result = useOccasionWelcome(theme, active);
  return null;
}

const flush = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });
const mounted: any[] = [];
async function mount(theme: OccasionTheme | null, active = true) {
  let tree: any;
  await act(async () => {
    tree = create(<Probe theme={theme} active={active} />);
  });
  await flush();
  mounted.push(tree);
  return tree;
}

beforeEach(async () => {
  await AsyncStorage.clear();
  await giftsStore.set([]);
  await greetedStore.set(null);
  mockSpeak.mockClear();
  mockTrack.mockClear();
});
afterEach(() => {
  act(() => mounted.splice(0).forEach((t) => t.unmount()));
});

const ramadan = OCCASION_THEMES.ramadan;

// protects=the first Ramadan visit gives the gift, greets once and reports occasion_seen once; fails_when=no gift, no greeting, or duplicate reports; no_claim=speech and analytics are mocked
it('gives the gift and greets on the first visit', async () => {
  await mount(ramadan);
  expect(result.gift).toBe('crescent-moon');
  expect(await giftsStore.get()).toEqual(['crescent-moon']);
  expect(mockSpeak).toHaveBeenCalledWith('Ramadan Mubarak!');
  expect(mockTrack).toHaveBeenCalledWith('occasion_seen', { id: 'ramadan' });
  expect(mockTrack).toHaveBeenCalledTimes(1);
});

// protects=the greeting is once per day and the gift once ever; fails_when=a second visit the same day greets again or shows the gift again; no_claim=does not change the device date (the date key is tested via greetedStore)
it('does not repeat on a second visit the same day', async () => {
  await mount(ramadan);
  mockSpeak.mockClear();
  await mount(ramadan);
  expect(result.gift).toBeNull();
  expect(mockSpeak).not.toHaveBeenCalled();
});

// protects=a new day greets again but never re-gives; fails_when=yesterday's greeting blocks today's or the gift reappears; no_claim=simulates the new day by rewinding the stored date
it('greets again on the next day without re-giving', async () => {
  await mount(ramadan);
  await greetedStore.set('2000-01-01');
  mockSpeak.mockClear();
  await mount(ramadan);
  expect(mockSpeak).toHaveBeenCalledTimes(1);
  expect(result.gift).toBeNull();
});

// protects=nothing happens off-occasion or while the buddy picker is up; fails_when=a gift or greeting fires with no theme or when inactive; no_claim=none beyond protects
it('stays quiet without a theme or while inactive', async () => {
  await mount(null);
  await mount(ramadan, false);
  expect(mockSpeak).not.toHaveBeenCalled();
  expect(await giftsStore.get()).toEqual([]);
});

// protects=the gift card can be closed; fails_when=dismissGift leaves the gift set; no_claim=none beyond protects
it('dismisses the gift', async () => {
  await mount(ramadan);
  act(() => result.dismissGift());
  expect(result.gift).toBeNull();
});

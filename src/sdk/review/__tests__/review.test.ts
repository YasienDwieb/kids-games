import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';
import { DEFAULT_REWARDS, rewardsStore } from '../../rewards/store';
import { DEFAULT_PLAYTIME, playtimeStore } from '../../playtime/playtime';
import {
  REVIEW_COOLDOWN_DAYS,
  REVIEW_MIN_STARS,
  maybeAskForReview,
  reviewStore,
  shouldAskForReview,
} from '../review';

jest.mock('expo-store-review', () => ({
  hasAction: jest.fn(async () => true),
  requestReview: jest.fn(async () => undefined),
}));

const DAY = 86_400_000;
const happy = { ...DEFAULT_REWARDS, stars: REVIEW_MIN_STARS };
const twoDays = { ...DEFAULT_PLAYTIME, days: { '2026-10-20': 300, '2026-10-21': 120 } };

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

it('waits for enough stars', () => {
  expect(shouldAskForReview({ ...happy, stars: REVIEW_MIN_STARS - 1 }, twoDays, { askedAt: null })).toBe(false);
});

it('waits for a second day of play', () => {
  const oneDay = { ...DEFAULT_PLAYTIME, days: { '2026-10-20': 3000, '2026-10-21': 0 } };
  expect(shouldAskForReview(happy, oneDay, { askedAt: null })).toBe(false);
});

it('asks a happy family once, then not again until the cooldown passes', () => {
  const now = Date.now();
  expect(shouldAskForReview(happy, twoDays, { askedAt: null }, now)).toBe(true);
  expect(shouldAskForReview(happy, twoDays, { askedAt: now - DAY }, now)).toBe(false);
  expect(shouldAskForReview(happy, twoDays, { askedAt: now - REVIEW_COOLDOWN_DAYS * DAY }, now)).toBe(true);
});

it('shows the native sheet and records the ask', async () => {
  await rewardsStore.set(happy);
  await playtimeStore.set(twoDays);
  await maybeAskForReview();
  expect(StoreReview.requestReview).toHaveBeenCalledTimes(1);
  expect((await reviewStore.get()).askedAt).not.toBeNull();

  await maybeAskForReview();
  expect(StoreReview.requestReview).toHaveBeenCalledTimes(1);
});

it('stays quiet for a new install', async () => {
  await maybeAskForReview();
  expect(StoreReview.requestReview).not.toHaveBeenCalled();
});

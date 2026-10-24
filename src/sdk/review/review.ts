/**
 * Store review prompts (kg:review). Only ever called from behind the parent
 * gate: Apple's Kids category and Play's Families policy keep rating prompts
 * away from the child, so the native sheet is shown to a grown-up who just
 * unlocked Settings, and only once the child has clearly enjoyed the app.
 */
import { Linking, Platform } from 'react-native';
import * as StoreReview from 'expo-store-review';
import { createStore } from '@/sdk/storage/createStore';
import { rewardsStore, type Rewards } from '@/sdk/rewards/store';
import { playtimeStore, type Playtime } from '@/sdk/playtime/playtime';

export type ReviewState = { askedAt: number | null };

export const reviewStore = createStore<ReviewState>('review', { askedAt: null });

/** Lifetime stars before we ask. */
export const REVIEW_MIN_STARS = 15;
/** Distinct days played before we ask, so one long first session isn't enough. */
export const REVIEW_MIN_DAYS = 2;
/** Gap between automatic asks; the OS rate-limits the sheet on top of this. */
export const REVIEW_COOLDOWN_DAYS = 120;

const ANDROID_ID = 'dev.waybeyond.kidszone';
const IOS_ID = '6793942277';

export function shouldAskForReview(
  rewards: Rewards,
  playtime: Playtime,
  state: ReviewState,
  now: number = Date.now(),
): boolean {
  if (rewards.stars < REVIEW_MIN_STARS) return false;
  const daysPlayed = Object.values(playtime.days).filter((s) => s > 0).length;
  if (daysPlayed < REVIEW_MIN_DAYS) return false;
  return state.askedAt == null || now - state.askedAt >= REVIEW_COOLDOWN_DAYS * 86_400_000;
}

/** Show the native review sheet if the child has earned it. Safe to call often. */
export async function maybeAskForReview(): Promise<void> {
  try {
    const [rewards, playtime, state] = await Promise.all([
      rewardsStore.get(),
      playtimeStore.get(),
      reviewStore.get(),
    ]);
    if (!shouldAskForReview(rewards, playtime, state)) return;
    if (!(await StoreReview.hasAction())) return;
    await reviewStore.set({ askedAt: Date.now() });
    await StoreReview.requestReview();
  } catch {
    // A review prompt is never worth an error in front of a parent.
  }
}

/**
 * The "Rate Kids Zone" row: open the store's review page directly. The native
 * sheet can't be used here because the OS silently drops it once its quota is
 * spent, which would make the button look broken.
 */
export async function openStoreReview(): Promise<void> {
  const [app, web] =
    Platform.OS === 'ios'
      ? [
          `itms-apps://apps.apple.com/app/id${IOS_ID}?action=write-review`,
          `https://apps.apple.com/app/id${IOS_ID}?action=write-review`,
        ]
      : [
          `market://details?id=${ANDROID_ID}`,
          `https://play.google.com/store/apps/details?id=${ANDROID_ID}`,
        ];
  try {
    await Linking.openURL(app);
  } catch {
    await Linking.openURL(web).catch(() => undefined);
  }
}

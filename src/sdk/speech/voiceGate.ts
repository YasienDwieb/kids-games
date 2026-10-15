/**
 * One shared "someone is talking" window. SDK clips (the celebration praise,
 * the "New sticker!" toast, the level-up jingle) hold it, and round prompts
 * wait it out, so no two voices talk over each other.
 *
 * Two parts: `holdVoice` marks a clip that is playing now; `reserveVoice` books
 * one that will play shortly (the sticker toast, the level-up jingle), so a
 * prompt starting in between already waits. SDK moments schedule themselves
 * after what is *playing* (`voiceBusyRemaining`) — not after each other's
 * reservations, which are ordered by the overlay gate instead.
 */
let speakingUntil = 0;
let reservedUntil = 0;

export function holdVoice(ms: number): void {
  speakingUntil = Math.max(speakingUntil, Date.now() + ms);
}

export function reserveVoice(ms: number): void {
  reservedUntil = Math.max(reservedUntil, Date.now() + ms);
}

/** How long a game prompt should wait before speaking. */
export function voiceHoldRemaining(): number {
  return Math.max(0, Math.max(speakingUntil, reservedUntil) - Date.now());
}

/** How long until the clip playing now ends (ignores reservations). */
export function voiceBusyRemaining(): number {
  return Math.max(0, speakingUntil - Date.now());
}

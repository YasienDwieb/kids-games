/**
 * Lets an SDK voice clip (e.g. the "New sticker!" toast) hold off game speech,
 * so a round's spoken prompt doesn't talk over it.
 */
let heldUntil = 0;

export function holdVoice(ms: number): void {
  heldUntil = Math.max(heldUntil, Date.now() + ms);
}

export function voiceHoldRemaining(): number {
  return Math.max(0, heldUntil - Date.now());
}

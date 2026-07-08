// A whisper of tactile feedback for confirming selections and saves. Guarded so
// it's a no-op where the Vibration API is unavailable (desktop, iOS Safari) and
// never throws. Keep durations short — this is punctuation, not a buzzer.

export function haptic(pattern: number | number[] = 10): void {
  if (typeof navigator === "undefined") return;
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // Some browsers throw on rapid repeat calls; feedback is best-effort.
  }
}

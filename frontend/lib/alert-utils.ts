/**
 * Alert utilities for ID generation, timing, and progress calculations.
 */

/**
 * Generate a unique alert ID combining timestamp and random string.
 */
export function generateAlertId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Calculate progress percentage based on elapsed time.
 * @param elapsed - Elapsed time in milliseconds
 * @param total - Total duration in milliseconds
 * @returns Progress percentage (0-100)
 */
export function calculateProgress(elapsed: number, total: number): number {
  return Math.min((elapsed / total) * 100, 100);
}

/**
 * Animation timing constants (in milliseconds)
 */
export const ALERT_TIMINGS = {
  /** Time for alert to slide out before removal */
  SLIDE_OUT_DURATION: 180,
  /** Time for alert to slide in after mount */
  SLIDE_IN_DURATION: 220,
  /** Default duration before auto-dismiss */
  AUTO_DISMISS_DURATION: 5000,
  /** Progress bar update interval */
  PROGRESS_UPDATE_INTERVAL: 50,
} as const;

/**
 * Easing functions for animations
 */
export const ALERT_EASING = {
  SLIDE_IN: "cubic-bezier(0.16, 1, 0.3, 1)",
  SLIDE_OUT: "ease-in",
} as const;

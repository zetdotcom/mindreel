import { createCaptureWindow } from "./captureWindowHandlers";
import { getDatabaseService } from "./databaseHandlers";

let timerInterval: NodeJS.Timeout | null = null;
let currentIntervalMinutes = 60;

export async function initializeCaptureTimer(): Promise<void> {
  try {
    const settings = await getDatabaseService().getSettings();
    currentIntervalMinutes = settings?.popup_interval_minutes ?? 60;

    console.log(`[CaptureTimer] Initializing with interval: ${currentIntervalMinutes} minutes`);

    const onboardingCompleted = settings?.onboarding_completed ?? 0;

    if (onboardingCompleted === 1) {
      createCaptureWindow();
      console.log("[CaptureTimer] Initial capture window opened on app start");
    } else {
      console.log("[CaptureTimer] Skipping initial capture window - onboarding not completed");
    }

    startTimer();
  } catch (error) {
    console.error("[CaptureTimer] Failed to initialize:", error);
  }
}

function startTimer(): void {
  stopTimer();

  if (currentIntervalMinutes === 0) {
    console.log("[CaptureTimer] Automatic popups disabled (interval = 0)");
    return;
  }

  const intervalMs = currentIntervalMinutes * 60 * 1000;

  timerInterval = setInterval(() => {
    console.log(`[CaptureTimer] Timer triggered (${currentIntervalMinutes} min interval)`);
    try {
      createCaptureWindow();
      console.log("[CaptureTimer] Capture window opened automatically");
    } catch (error) {
      console.error("[CaptureTimer] Failed to open capture window:", error);
    }
  }, intervalMs);

  console.log(`[CaptureTimer] Timer started with ${currentIntervalMinutes} minute interval`);
}

function stopTimer(): void {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
    console.log("[CaptureTimer] Timer stopped");
  }
}

export function updateCaptureTimerInterval(minutes: number): void {
  console.log(
    `[CaptureTimer] Updating interval from ${currentIntervalMinutes} to ${minutes} minutes`,
  );

  currentIntervalMinutes = minutes;

  if (minutes === 0) {
    stopTimer();
    console.log("[CaptureTimer] Automatic popups disabled");
  } else {
    startTimer();
    console.log(`[CaptureTimer] Timer restarted with ${minutes} minute interval`);
  }
}

export function cleanupCaptureTimer(): void {
  stopTimer();
  console.log("[CaptureTimer] Timer cleanup complete");
}

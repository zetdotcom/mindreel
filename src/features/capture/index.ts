/**
 * Capture Feature Public API
 *
 * Exports stable interfaces for the capture popup functionality.
 */

export { closeCaptureWindow, getRecentUniqueEntries, openCaptureWindow } from "./model/repository";
export { useCapture } from "./model/useCapture";
export { CapturePopup } from "./ui/CapturePopup";

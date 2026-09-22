import type { GenerationProgressEvent } from "../services/generation/generationTypes.js";

export type ProgressCallback = (event: GenerationProgressEvent) => void | Promise<void>;

export async function emitProgress(
  callback: ProgressCallback | undefined,
  event: GenerationProgressEvent
): Promise<void> {
  if (!callback) return;
  try {
    await callback(event);
  } catch {
    // Ignore callback errors to ensure pipeline integrity
  }
}

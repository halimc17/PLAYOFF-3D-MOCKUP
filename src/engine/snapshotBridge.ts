export interface FourAngleRenders {
  front: string;
  back: string;
  left: string;
  right: string;
}

type CaptureFn = () => Promise<FourAngleRenders>;

let captureHandler: CaptureFn | null = null;

export function registerSnapshotCapture(fn: CaptureFn | null) {
  captureHandler = fn;
}

export async function captureFourAngleRenders(): Promise<FourAngleRenders | null> {
  if (!captureHandler) return null;
  return captureHandler();
}

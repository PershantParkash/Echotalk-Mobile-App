import { captureRef } from 'react-native-view-shot';

type StartRenderedViewFrameCaptureParams = {
  targetRef: React.RefObject<any>;
  intervalMs?: number;
  label?: string;
  onFrameBase64?: (base64: string) => void;
};

/**
 * Captures frames by snapshotting the already-rendered video view (Agora surface).
 * This is the most reliable cross-platform approach in JS without native raw-frame hooks.
 */
export function startRenderedViewFrameCapture({
  targetRef,
  intervalMs = 750,
  label = 'call-frame',
  onFrameBase64,
}: StartRenderedViewFrameCaptureParams) {
  let stopped = false;
  let inFlight = false;

  const tick = async () => {
    if (stopped || inFlight) return;
    const node = targetRef?.current;
    if (!node) return;

    inFlight = true;
    try {
      const startedAt = Date.now();
      const base64 = await captureRef(node, {
        format: 'jpg',
        quality: 0.55,
        result: 'base64',
      });

      onFrameBase64?.(base64);

      // const elapsedMs = Date.now() - startedAt;
      // const size = base64?.length ?? 0;

      // console.log(`[${label}] frame captured`, { elapsedMs, size });
    } catch (e) {
      console.log(
        `[${label}] frame capture failed`,
        e instanceof Error ? e.message : String(e ?? 'unknown'),
      );
    } finally {
      inFlight = false;
    }
  };

  // Fire quickly, then continue on an interval.
  void tick();
  const timer = setInterval(() => void tick(), intervalMs);

  return () => {
    stopped = true;
    clearInterval(timer);
  };
}


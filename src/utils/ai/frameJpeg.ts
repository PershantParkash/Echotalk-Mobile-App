import { Buffer } from 'buffer';
import * as jpeg from 'jpeg-js';

export function stripJpegDataUrlPrefix(value: string): string {
  const s = value ?? '';
  if (!s) return '';
  return s.startsWith('data:image/jpeg;base64,')
    ? s.slice('data:image/jpeg;base64,'.length)
    : s;
}

export type RawRgbaFrame = {
  width: number;
  height: number;
  /**
   * RGBA bytes (length must be width * height * 4).
   * This is the most common format coming from camera frame processors.
   */
  rgba: Uint8Array;
};

type FrameToJpegBase64Params = {
  frame: RawRgbaFrame;
  /** 0.6 - 0.7 recommended */
  quality?: number;
};

export function frameToJpegBase64({
  frame,
  quality = 0.65,
}: FrameToJpegBase64Params): string {
  const w = Math.max(0, Math.floor(frame?.width ?? 0));
  const h = Math.max(0, Math.floor(frame?.height ?? 0));
  const rgba = frame?.rgba;

  if (!w || !h || !rgba) {
    throw new Error('frameToJpegBase64: invalid frame');
  }

  const expectedLen = w * h * 4;
  if ((rgba?.length ?? 0) !== expectedLen) {
    throw new Error(
      `frameToJpegBase64: rgba length mismatch (got ${rgba?.length ?? 0}, expected ${expectedLen})`,
    );
  }

  const clampedQuality = Math.min(0.7, Math.max(0.6, quality));
  const q = Math.round(clampedQuality * 100);

  const encoded = jpeg.encode(
    {
      data: Buffer.from(rgba),
      width: w,
      height: h,
    },
    q,
  );

  // NOTE: This intentionally returns *raw* base64 (no `data:image/jpeg;base64,` prefix).
  return stripJpegDataUrlPrefix(Buffer.from(encoded?.data ?? []).toString('base64'));
}


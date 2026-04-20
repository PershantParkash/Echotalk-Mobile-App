import { NEXT_PUBLIC_SIGN_WS_URL } from '@env';
import { frameToJpegBase64, stripJpegDataUrlPrefix, type RawRgbaFrame } from './frameJpeg';

type SignAiFrameStreamerOptions = {
  /**
   * Defaults to NEXT_PUBLIC_SIGN_WS_URL.
   * Example: wss://socket.echotalk.co.uk/
   */
  url?: string;
  /** Milliseconds between sends; extra frames are dropped. */
  minIntervalMs?: number;
  /** JPEG compression quality (0.6 - 0.7). */
  jpegQuality?: number;
  /** Auto reconnect on close/error. Default: true */
  autoReconnect?: boolean;
  /** Print incoming ws messages to console. Default: false */
  debug?: boolean;
  /** Backoff base delay in ms. Default: 500 */
  reconnectBaseDelayMs?: number;
  /** Max backoff delay in ms. Default: 10_000 */
  reconnectMaxDelayMs?: number;
};

export class SignAiFrameStreamer {
  private ws: WebSocket | null = null;
  private url: string;
  private minIntervalMs: number;
  private jpegQuality: number;
  private debug: boolean;
  private lastSentAt = 0;
  private connecting: Promise<void> | null = null;
  private shouldReconnect = true;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private autoReconnect: boolean;
  private reconnectBaseDelayMs: number;
  private reconnectMaxDelayMs: number;
  private lastQueuedFrameBase64: string | null = null;
  private sendLoopTimer: ReturnType<typeof setInterval> | null = null;
  private onMessageHandler: ((data: unknown) => void) | null = null;

  constructor(options?: SignAiFrameStreamerOptions) {
    const envUrl = NEXT_PUBLIC_SIGN_WS_URL?.trim?.() ?? '';
    this.url = options?.url?.trim?.() || envUrl || 'wss://socket.echotalk.co.uk/';
    // CRITICAL: default ~8-9 fps (every 120ms)
    this.minIntervalMs = Math.max(0, Math.floor(options?.minIntervalMs ?? 120));
    this.jpegQuality = options?.jpegQuality ?? 0.65;
    this.autoReconnect = options?.autoReconnect ?? true;
    this.debug = options?.debug ?? false;
    this.reconnectBaseDelayMs = Math.max(
      50,
      Math.floor(options?.reconnectBaseDelayMs ?? 500),
    );
    this.reconnectMaxDelayMs = Math.max(
      this.reconnectBaseDelayMs,
      Math.floor(options?.reconnectMaxDelayMs ?? 10_000),
    );
  }

  get isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  onServerMessage(handler: ((data: unknown) => void) | null): void {
    this.onMessageHandler = handler;
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (!this.autoReconnect) return;
    if (!this.shouldReconnect) return;
    if (this.reconnectTimer) return;

    const attempt = (this.reconnectAttempts ?? 0) + 1;
    this.reconnectAttempts = attempt;

    const backoff = Math.min(
      this.reconnectMaxDelayMs,
      this.reconnectBaseDelayMs * Math.pow(2, Math.min(10, attempt - 1)),
    );
    const jitter = Math.floor(Math.random?.() * 150) ?? 0;
    const delay = Math.max(0, Math.floor(backoff + jitter));

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect().catch(() => {
        // If connect fails, onclose/onerror will schedule again.
      });
    }, delay);

    // console.log('[SignAI] scheduling reconnect', { attempt, delay });
  }

  async connect(): Promise<void> {
    if (this.isConnected) return;
    if (this.connecting) return this.connecting;

    if (!this.url) {
      throw new Error('SignAiFrameStreamer: missing WS url (NEXT_PUBLIC_SIGN_WS_URL)');
    }

    this.connecting = new Promise<void>((resolve, reject) => {
      try {
        this.clearReconnectTimer();
        const ws = new WebSocket(this.url);
        this.ws = ws;

        const handleMessage = (event: any) => {
          const raw = event?.data ?? '';
          let payload: unknown = raw;
          if (typeof raw === 'string') {
            try {
              payload = JSON.parse(raw);
            } catch {
              payload = raw;
            }
          }

          if (this.debug) {
            console.log('[SignAI] ws message', payload);
          }
          this.onMessageHandler?.(payload);
        };

        ws.onopen = () => {
          // console.log('[SignAI] WS connected');
          this.reconnectAttempts = 0;

          // If we queued a frame while disconnected, flush the latest one.
          if (this.lastQueuedFrameBase64 && ws.readyState === WebSocket.OPEN) {
            try {
              ws.send?.(JSON.stringify({ frame: this.lastQueuedFrameBase64 }));
              // console.log('[SignAI] flushed queued frame', {
              //   size: this.lastQueuedFrameBase64?.length ?? 0,
              // });
            } catch {
              // ignore
            } finally {
              this.lastQueuedFrameBase64 = null;
            }
          }
          resolve();
        };
        ws.onerror = () => {
          // Do not reject here; some platforms emit error then close.
          // console.log('[SignAI] WS error');
          this.scheduleReconnect();
        };
        ws.onclose = () => {
          // console.log('[SignAI] WS closed');
          // If this socket is our current one, clear it.
          if (this.ws === ws) {
            this.ws = null;
          }
          this.scheduleReconnect();
        };
        ws.onmessage = handleMessage;
        // RN WebSocket implementations vary; attach both styles.
        ws.addEventListener?.('message', handleMessage as any);

        // If we don't open soon, reject so callers can proceed; reconnect will still happen.
        const openTimeout = setTimeout(() => {
          if (ws.readyState !== WebSocket.OPEN) {
            try {
              ws.close?.();
            } catch {
              // ignore
            }
            this.scheduleReconnect();
            reject(new Error('[SignAI] WS connect timeout'));
          }
        }, 20_000);

        const clear = () => clearTimeout(openTimeout);
        ws.addEventListener?.('open', clear as any);
        ws.addEventListener?.('close', clear as any);
      } catch (e) {
        reject(e instanceof Error ? e : new Error(String(e ?? 'connect error')));
      }
    }).finally(() => {
      this.connecting = null;
    });

    return this.connecting;
  }

  disconnect(): void {
    this.shouldReconnect = false;
    this.clearReconnectTimer();
    this.stopSendLoop();
    try {
      this.ws?.close?.();
    } finally {
      this.ws = null;
      this.connecting = null;
    }
  }

  start(): void {
    this.shouldReconnect = true;
    this.connect().catch(() => {
      // reconnect loop handles it
    });
  }

  /**
   * Starts a continuous send loop (every `minIntervalMs` by default).
   * You provide a getter that returns the latest raw frame (or null if unavailable).
   *
   * This loop does NOT wait for server responses; it just sends on schedule.
   */
  startSendLoop(getLatestFrame: () => RawRgbaFrame | null | undefined): void {
    if (this.sendLoopTimer) return;

    const interval = Math.max(1, this.minIntervalMs);
    this.sendLoopTimer = setInterval(() => {
      const frame = getLatestFrame?.();
      if (!frame) return;
      this.sendRawFrame(frame);
    }, interval);
  }

  stopSendLoop(): void {
    if (!this.sendLoopTimer) return;
    clearInterval(this.sendLoopTimer);
    this.sendLoopTimer = null;
  }

  /**
   * Accepts a raw RGBA frame, converts to JPEG (quality 0.6-0.7), then sends
   * `{ frame: <base64> }` over the SignAI websocket.
   */
  sendRawFrame(frame: RawRgbaFrame): void {
    const now = Date.now?.() ?? 0;
    if (this.minIntervalMs > 0 && now - (this.lastSentAt ?? 0) < this.minIntervalMs) {
      return;
    }

    const ws = this.ws;
    const base64 = frameToJpegBase64({ frame, quality: this.jpegQuality });
    this.lastSentAt = now;

    if (ws?.readyState !== WebSocket.OPEN) {
      // Keep only the latest frame while offline; flush on reconnect.
      this.lastQueuedFrameBase64 = base64;
      this.scheduleReconnect();
      return;
    }
    try {
      ws.send?.(JSON.stringify({ frame: base64 }));
    } catch {
      // If sending fails, queue latest and let reconnect logic recover.
      this.lastQueuedFrameBase64 = base64;
      this.scheduleReconnect();
    }

    // console.log('[SignAI] sent frame', { size: base64?.length ?? 0 });
  }

  /**
   * Sends an already-encoded JPEG base64 string (with or without data-url prefix).
   * Useful when your capture pipeline already outputs base64 JPEG (e.g. view snapshots).
   */
  sendJpegBase64(base64OrDataUrl: string): void {
    const now = Date.now?.() ?? 0;
    if (this.minIntervalMs > 0 && now - (this.lastSentAt ?? 0) < this.minIntervalMs) {
      return;
    }

    const ws = this.ws;
    const base64 = stripJpegDataUrlPrefix(base64OrDataUrl ?? '');
    if (!base64) return;
    this.lastSentAt = now;

    if (ws?.readyState !== WebSocket.OPEN) {
      this.lastQueuedFrameBase64 = base64;
      this.scheduleReconnect();
      return;
    }
    try {
      ws.send?.(JSON.stringify({ frame: base64 }));
    } catch {
      this.lastQueuedFrameBase64 = base64;
      this.scheduleReconnect();
    }
  }
}


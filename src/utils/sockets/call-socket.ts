import { io, Socket } from "socket.io-client";
import { getAccessToken } from "../storage";
// import { NEXT_PUBLIC_API_BASE } from "@env";

const NEXT_PUBLIC_API_BASE = "http://10.10.10.68:5001"

class CallSocketSingleton {
  private static instance: Socket | null = null;
  private static currentToken: string | null = null;
  /** Single in-flight connect; avoids parallel connects creating two sockets or killing a handshaking socket. */
  private static connectPromise: Promise<Socket> | null = null;

  private constructor() { }

  private static waitUntilConnectedOrError(socket: Socket, ms: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (socket.connected) {
        resolve();
        return;
      }
      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error("Call socket: connection timeout"));
      }, ms);
      const onConnect = () => {
        cleanup();
        resolve();
      };
      const onErr = (err: Error) => {
        cleanup();
        reject(err);
      };
      const cleanup = () => {
        clearTimeout(timeout);
        socket.off("connect", onConnect);
        socket.off("connect_error", onErr);
      };
      socket.once("connect", onConnect);
      socket.once("connect_error", onErr);
    });
  }

  private static async createOrReuseSocket(token: string): Promise<Socket> {
    if (!NEXT_PUBLIC_API_BASE) {
      throw new Error("Call socket: NEXT_PUBLIC_API_BASE is missing");
    }
    if (!token) {
      throw new Error("Call socket: missing access token");
    }

    if (
      CallSocketSingleton.instance &&
      !CallSocketSingleton.instance.connected &&
      CallSocketSingleton.currentToken === token
    ) {
      try {
        // If a socket exists but is disconnected (or mid-handshake), trigger connect then wait.
        CallSocketSingleton.instance.connect?.();
        await CallSocketSingleton.waitUntilConnectedOrError(
          CallSocketSingleton.instance,
          20_000,
        );
      } catch {
        /* replaced below */
      }
      if (CallSocketSingleton.instance?.connected) {
        return CallSocketSingleton.instance;
      }
    }

    if (CallSocketSingleton.instance) {
      CallSocketSingleton.instance.disconnect();
      CallSocketSingleton.instance = null;
      CallSocketSingleton.currentToken = null;
    }

    const baseURL = NEXT_PUBLIC_API_BASE.trim?.().replace?.(/\/+$/, "") ?? "";
    const socketURL = `${baseURL}/call`;

    const socket: Socket = io(socketURL, {
      query: { token },
      auth: { token },
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
      forceNew: false,
    });

    CallSocketSingleton.instance = socket;
    CallSocketSingleton.currentToken = token;

    socket.on("connect_error", async (err) => {
      console.warn(
        "[CallSocket] connect_error:",
        err instanceof Error ? err?.message : String(err ?? ""),
      );
      const freshToken = await getAccessToken();
      if (freshToken && freshToken !== CallSocketSingleton.currentToken) {
        CallSocketSingleton.updateAuthentication(freshToken);
      }
    });

    if (!socket.connected) {
      await CallSocketSingleton.waitUntilConnectedOrError(socket, 20_000);
    }

    return socket;
  }

  public static connect(): Promise<Socket> {
    /** Fast path: already connected; refresh token if needed. */
    if (CallSocketSingleton.instance?.connected) {
      return (async () => {
        const token = await getAccessToken();
        if (!token) {
          throw new Error("Call socket: missing access token");
        }
        if (token !== CallSocketSingleton.currentToken) {
          CallSocketSingleton.updateAuthentication(token);
        }
        return CallSocketSingleton.instance!;
      })();
    }

    if (CallSocketSingleton.connectPromise) {
      return CallSocketSingleton.connectPromise;
    }

    /** IIFE starts synchronously so `connectPromise` is set before any `await` (avoids duplicate handshakes). */
    CallSocketSingleton.connectPromise = (async () => {
      try {
        const token = await getAccessToken();
        if (!token) {
          throw new Error("Call socket: missing access token");
        }
        return await CallSocketSingleton.createOrReuseSocket(token);
      } finally {
        CallSocketSingleton.connectPromise = null;
      }
    })();

    return CallSocketSingleton.connectPromise;
  }

  public static getInstance(): Socket | null {
    return CallSocketSingleton.instance;
  }

  private static updateAuthentication(newToken: string): void {
    const socket = CallSocketSingleton.instance;
    if (!socket) return;

    CallSocketSingleton.currentToken = newToken;
    socket.auth = { token: newToken };

    if (socket.connected) {
      socket.emit("refresh-auth", { token: newToken });
    } else {
      (socket as any).io.opts.query = { token: newToken };
      socket.connect();
    }
  }

  public static refreshAuth(): void {
    const socket = CallSocketSingleton.instance;
    if (!socket) return;
    getAccessToken()
      .then((t) => {
        if (t && t !== CallSocketSingleton.currentToken) {
          CallSocketSingleton.updateAuthentication(t);
        }
      })
      .catch(() => { });
  }

  public static disconnect(): void {
    if (CallSocketSingleton.instance) {
      CallSocketSingleton.instance.disconnect();
      CallSocketSingleton.instance = null;
      CallSocketSingleton.currentToken = null;
    }
  }
}

export default CallSocketSingleton;

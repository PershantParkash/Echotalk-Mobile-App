import { io, Socket } from "socket.io-client";
import { getAccessToken } from "../storage";
// import { NEXT_PUBLIC_API_BASE } from "@env";

const NEXT_PUBLIC_API_BASE = "http://10.10.10.68:5001"

class ChatSocketSingleton {
  private static instance: Socket | null = null;
  private static currentToken: string | null = null;
  /** Single in-flight connect; avoids parallel connects creating two sockets or killing a handshaking socket. */
  private static connectPromise: Promise<Socket> | null = null;

  private constructor() { }

  private static waitUntilConnectedOrError(socket: Socket, ms: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (socket?.connected) {
        resolve();
        return;
      }

      const timeout = setTimeout(() => {
        cleanup?.();
        reject(new Error("Chat socket: connection timeout"));
      }, ms);

      const onConnect = () => {
        cleanup?.();
        resolve();
      };

      const onErr = (err: any) => {
        cleanup?.();
        reject(err instanceof Error ? err : new Error(String(err ?? "Chat socket: connect_error")));
      };

      const cleanup = () => {
        clearTimeout(timeout);
        socket?.off?.("connect", onConnect);
        socket?.off?.("connect_error", onErr);
      };

      socket?.once?.("connect", onConnect);
      socket?.once?.("connect_error", onErr);
    });
  }

  private static async createOrReuseSocket(token: string): Promise<Socket> {
    if (!NEXT_PUBLIC_API_BASE) {
      throw new Error("Chat socket: NEXT_PUBLIC_API_BASE is missing");
    }
    if (!token) {
      throw new Error("Chat socket: missing access token");
    }

    // If a socket exists and is mid-handshake, wait for it instead of disconnecting it.
    if (
      ChatSocketSingleton.instance &&
      !ChatSocketSingleton.instance.connected &&
      ChatSocketSingleton.currentToken === token
    ) {
      try {
        ChatSocketSingleton.instance.connect?.();
        await ChatSocketSingleton.waitUntilConnectedOrError(ChatSocketSingleton.instance, 20_000);
      } catch {
        /* replaced below */
      }
      if (ChatSocketSingleton.instance?.connected) {
        return ChatSocketSingleton.instance;
      }
    }

    if (ChatSocketSingleton.instance) {
      ChatSocketSingleton.instance.disconnect?.();
      ChatSocketSingleton.instance = null;
      ChatSocketSingleton.currentToken = null;
    }

    const baseURL = NEXT_PUBLIC_API_BASE.trim?.().replace?.(/\/+$/, "") ?? "";
    const socketURL = `${baseURL}/chat`;

    // Backend expects token via handshake.query.token on /chat namespace.
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

    ChatSocketSingleton.instance = socket;
    ChatSocketSingleton.currentToken = token;

    socket.on("connect_error", async (err: any) => {
      console.warn(
        "[ChatSocket] connect_error:",
        err instanceof Error ? err?.message : String(err ?? ""),
      );
      const freshToken = await getAccessToken();
      if (freshToken && freshToken !== ChatSocketSingleton.currentToken) {
        ChatSocketSingleton.updateAuthentication(freshToken);
      }
    });

    if (!socket?.connected) {
      await ChatSocketSingleton.waitUntilConnectedOrError(socket, 20_000);
    }

    return socket;
  }

  public static connect(): Promise<Socket> {
    // Fast path: already connected; refresh token if needed.
    if (ChatSocketSingleton.instance?.connected) {
      return (async () => {
        const token = await getAccessToken();
        if (!token) {
          throw new Error("Chat socket: missing access token");
        }
        if (token !== ChatSocketSingleton.currentToken) {
          ChatSocketSingleton.updateAuthentication(token);
        }
        return ChatSocketSingleton.instance!;
      })();
    }

    if (ChatSocketSingleton.connectPromise) {
      return ChatSocketSingleton.connectPromise;
    }

    ChatSocketSingleton.connectPromise = (async () => {
      try {
        const token = await getAccessToken();
        if (!token) {
          throw new Error("Chat socket: missing access token");
        }
        return await ChatSocketSingleton.createOrReuseSocket(token);
      } finally {
        ChatSocketSingleton.connectPromise = null;
      }
    })();

    return ChatSocketSingleton.connectPromise;
  }

  public static getInstance(): Socket | null {
    return ChatSocketSingleton.instance;
  }

  private static updateAuthentication(newToken: string): void {
    const socket = ChatSocketSingleton.instance;
    if (!socket) return;

    ChatSocketSingleton.currentToken = newToken;
    socket.auth = { token: newToken };

    // The backend reads the token from client.handshake.query.token which is
    // immutable after the initial handshake. A full reconnect is required so
    // the new token is sent as part of a fresh handshake.
    (socket as any).io.opts.query = { token: newToken };
    socket.disconnect?.();
    socket.connect?.();
  }

  public static refreshAuth(): void {
    const socket = ChatSocketSingleton.instance;
    if (!socket) return;
    getAccessToken()
      .then((t) => {
        if (t && t !== ChatSocketSingleton.currentToken) {
          ChatSocketSingleton.updateAuthentication(t);
        }
      })
      .catch(() => { });
  }

  public static disconnect(): void {
    if (ChatSocketSingleton.instance) {
      ChatSocketSingleton.instance.disconnect?.();
      ChatSocketSingleton.instance = null;
      ChatSocketSingleton.currentToken = null;
    }
  }

  public static isConnected(): boolean {
    return ChatSocketSingleton.instance?.connected || false;
  }
}

export default ChatSocketSingleton;
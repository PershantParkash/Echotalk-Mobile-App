import { io, Socket } from "socket.io-client";
import { getAccessToken } from "../storage";
import { NEXT_PUBLIC_API_BASE } from "@env";

class ChatSocketSingleton {
  private static instance: Socket | null = null;

  private constructor() { }

  public static async connect(): Promise<Socket> {
    // ✅ Reuse existing connection
    if (ChatSocketSingleton.instance?.connected) {
      return ChatSocketSingleton.instance;
    }

    // ✅ Clean previous instance
    if (ChatSocketSingleton.instance) {
      ChatSocketSingleton.instance.disconnect();
      ChatSocketSingleton.instance = null;
    }

    try {
      const token = await getAccessToken();

      if (!NEXT_PUBLIC_API_BASE) {
        throw new Error("❌ NEXT_PUBLIC_API_BASE is missing");
      }

      if (!token) {
        throw new Error("❌ Missing access token (user not logged in?)");
      }

      const baseURL = NEXT_PUBLIC_API_BASE.trim().replace(/\/+$/, "");
      const socketURL = `${baseURL}/chat`;

      // Backend expects token via handshake.query.token on /chat namespace.
      const socket: Socket = io(socketURL, {
        query: { token },
        auth: { token },
        // If websocket upgrade is blocked on mobile/proxy, polling keeps working.
        transports: ["polling", "websocket"],

        // ✅ Stability
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,

        timeout: 20000,
        forceNew: false,
      });

      // ================= EVENTS =================

      socket.on("connect", () => {
      });

      socket.on("connect_error", (error: any) => {

        if (error?.message?.includes("Invalid namespace")) {
        }

        if (error?.message?.includes("websocket error") || error?.message?.includes("xhr poll error")) {
        }

        if (!error?.message) {
        }

      });

      socket.on("disconnect", (reason) => {
      });

      socket.on("error", (error: any) => {
      });

      socket.io.on("reconnect_attempt", (attempt) => {
      });

      socket.io.on("reconnect_failed", () => {
      });

      // ==========================================

      ChatSocketSingleton.instance = socket;

      return socket;
    } catch (error: any) {
      throw error;
    }
  }

  public static getInstance(): Socket | null {
    return ChatSocketSingleton.instance;
  }

  public static disconnect(): void {
    if (ChatSocketSingleton.instance) {
      ChatSocketSingleton.instance.disconnect();
      ChatSocketSingleton.instance = null;
    }
  }

  public static isConnected(): boolean {
    return ChatSocketSingleton.instance?.connected || false;
  }
}

export default ChatSocketSingleton;
import { io, Socket } from "socket.io-client";
import { getAccessToken } from "../storage";
import { NEXT_PUBLIC_API_BASE } from "@env";

class ChatSocketSingleton {
  private static instance: Socket | null = null;

  private constructor() { }

  public static async connect(): Promise<Socket> {
    // ✅ Reuse existing connection
    if (ChatSocketSingleton.instance?.connected) {
      console.log("✅ Reusing existing socket");
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

      console.log("\n================ SOCKET DEBUG ================");
      console.log("🌐 URL:", socketURL);
      console.log("🔑 Token exists:", !!token);
      console.log("=============================================\n");

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
        console.log("✅ SOCKET CONNECTED");
        console.log("🆔 ID:", socket.id);
        console.log("🚀 Transport:", socket.io.engine.transport.name);
      });

      socket.on("connect_error", (error: any) => {
        console.log("❌ CONNECT ERROR:", error?.message);

        if (error?.message?.includes("Invalid namespace")) {
          console.log("👉 ISSUE: Server does not expose /chat namespace");
        }

        if (error?.message?.includes("websocket error") || error?.message?.includes("xhr poll error")) {
          console.log("👉 ISSUE: Network/proxy/SSL blocked transport");
        }

        if (!error?.message) {
          console.log("👉 ISSUE: Possible CORS / SSL / Network problem");
        }

        console.log("💡 Socket path:", socket?.io?.opts?.path);
        console.log("💡 Socket transports:", socket?.io?.opts?.transports);
      });

      socket.on("disconnect", (reason) => {
        console.log("🔌 DISCONNECTED:", reason);
      });

      socket.on("error", (error: any) => {
        console.log("❌ SOCKET ERROR:", error);
      });

      socket.io.on("reconnect_attempt", (attempt) => {
        console.log(`🔄 Reconnect attempt: ${attempt}`);
      });

      socket.io.on("reconnect_failed", () => {
        console.log("❌ Reconnect failed");
      });

      // ==========================================

      ChatSocketSingleton.instance = socket;

      return socket;
    } catch (error: any) {
      console.log("❌ FATAL ERROR:", error.message);
      throw error;
    }
  }

  public static getInstance(): Socket | null {
    return ChatSocketSingleton.instance;
  }

  public static disconnect(): void {
    if (ChatSocketSingleton.instance) {
      console.log("🔌 Disconnecting socket...");
      ChatSocketSingleton.instance.disconnect();
      ChatSocketSingleton.instance = null;
    }
  }

  public static isConnected(): boolean {
    return ChatSocketSingleton.instance?.connected || false;
  }
}

export default ChatSocketSingleton;
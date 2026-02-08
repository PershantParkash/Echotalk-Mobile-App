// // import { io, Socket } from "socket.io-client";
// // import { getAccessToken } from "../storage"; 
// // import { NEXT_PUBLIC_API_URL } from '@env';

// // const SOCKET_URL = NEXT_PUBLIC_API_URL; 

// // class ChatSocketSingleton {
// //   private static instance: Socket | null = null;

// //   private constructor() {}

// //   public static async connect(): Promise<Socket> {
// //     if (ChatSocketSingleton.instance?.connected) {
// //       console.log("Socket already connected, reusing instance");
// //       return ChatSocketSingleton.instance;
// //     }

// //     // Disconnect existing instance if any
// //     if (ChatSocketSingleton.instance) {
// //       ChatSocketSingleton.instance.disconnect();
// //     }

// //     const token = await getAccessToken();
    
// //     console.log("🔌 Connecting to socket:", `${SOCKET_URL}/chat`);
// //     console.log("🔑 Using token:", token ? "Token exists" : "No token");
    
// //     ChatSocketSingleton.instance = io(`${SOCKET_URL}/chat`, {
// //       query: { token },
// //       transports: ['websocket'],
// //       reconnection: true,
// //       reconnectionDelay: 1000,
// //       reconnectionDelayMax: 5000,
// //       reconnectionAttempts: 5,
// //     });

// //     ChatSocketSingleton.instance.on("connect", () => {
// //       console.log(
// //         "✅ Chat socket connected with ID:",
// //         ChatSocketSingleton.instance?.id
// //       );
// //     });

// //     ChatSocketSingleton.instance.on("disconnect", (reason) => {
// //       console.log("❌ Chat socket disconnected:", reason);
// //     });

// //     ChatSocketSingleton.instance.on("connect_error", (error) => {
// //       console.error("❌ Socket connection error:", error);
// //     });

// //     ChatSocketSingleton.instance.on("error", (error: any) => {
// //       console.error("❌ Socket error:", error);
// //       if (error?.message === "Session expired. Please login again.") {
// //         console.log("Session expired, logging out...");
// //         // Optionally: auto logout user
// //         // clearAllTokens();
// //       }
// //     });

// //     return ChatSocketSingleton.instance;
// //   }

// //   public static getInstance(): Socket | null {
// //     return ChatSocketSingleton.instance;
// //   }

// //   public static disconnect(): void {
// //     if (ChatSocketSingleton.instance) {
// //       console.log("🔌 Disconnecting chat socket");
// //       ChatSocketSingleton.instance.disconnect();
// //       ChatSocketSingleton.instance = null;
// //     }
// //   }
// // }

// // export default ChatSocketSingleton;

// import { io, Socket } from "socket.io-client";
// import { getAccessToken } from "../storage"; 
// import { NEXT_PUBLIC_API_URL } from '@env';

// const SOCKET_URL = NEXT_PUBLIC_API_URL; 

// class ChatSocketSingleton {
//   private static instance: Socket | null = null;

//   private constructor() {}

//   public static async connect(): Promise<Socket> {
//     if (ChatSocketSingleton.instance?.connected) {
//       console.log("Socket already connected, reusing instance");
//       return ChatSocketSingleton.instance;
//     }

//     // Disconnect existing instance if any
//     if (ChatSocketSingleton.instance) {
//       ChatSocketSingleton.instance.disconnect();
//     }

//     const token = await getAccessToken();
    
//     console.log("🔌 Connecting to socket:", SOCKET_URL);
//     console.log("🔑 Using token:", token ? "Token exists" : "No token");
    
//     // OPTION 1: Connect without namespace (most common)
//     ChatSocketSingleton.instance = io(SOCKET_URL, {
//       auth: { 
//         token  // Use 'auth' instead of 'query' - this is the standard way in Socket.IO v3+
//       },
//       transports: ['websocket', 'polling'], // Add polling as fallback
//       reconnection: true,
//       reconnectionDelay: 1000,
//       reconnectionDelayMax: 5000,
//       reconnectionAttempts: 5,
//       timeout: 10000,
//       autoConnect: true,
//     });

//     // OPTION 2: If your server DOES have a /chat namespace, uncomment this instead:
//     // ChatSocketSingleton.instance = io(`${SOCKET_URL}/chat`, {
//     //   auth: { token },
//     //   transports: ['websocket', 'polling'],
//     //   reconnection: true,
//     //   reconnectionDelay: 1000,
//     //   reconnectionDelayMax: 5000,
//     //   reconnectionAttempts: 5,
//     //   timeout: 10000,
//     // });

//     ChatSocketSingleton.instance.on("connect", () => {
//       console.log(
//         "✅ Chat socket connected with ID:",
//         ChatSocketSingleton.instance?.id
//       );
//     });

//     ChatSocketSingleton.instance.on("disconnect", (reason) => {
//       console.log("❌ Chat socket disconnected:", reason);
//     });

//     ChatSocketSingleton.instance.on("connect_error", (error) => {
//       console.error("❌ Socket connection error:", error.message);
//       console.error("Error details:", error);
//     });

//     ChatSocketSingleton.instance.on("error", (error: any) => {
//       console.error("❌ Socket error:", error);
//       if (error?.message === "Session expired. Please login again.") {
//         console.log("Session expired, logging out...");
//         // Optionally: auto logout user
//         // clearAllTokens();
//       }
//     });

//     return ChatSocketSingleton.instance;
//   }

//   public static getInstance(): Socket | null {
//     return ChatSocketSingleton.instance;
//   }

//   public static disconnect(): void {
//     if (ChatSocketSingleton.instance) {
//       console.log("🔌 Disconnecting chat socket");
//       ChatSocketSingleton.instance.disconnect();
//       ChatSocketSingleton.instance = null;
//     }
//   }
// }

// export default ChatSocketSingleton;
import { io, Socket } from "socket.io-client";
import { getAccessToken } from "../storage"; 
import { NEXT_PUBLIC_API_URL } from '@env';

class ChatSocketSingleton {
  private static instance: Socket | null = null;
  private static connectionAttempts = 0;
  private static maxRetries = 3;

  private constructor() {}

  public static async connect(): Promise<Socket> {
    if (ChatSocketSingleton.instance?.connected) {
      console.log("✅ Socket already connected, reusing instance");
      return ChatSocketSingleton.instance;
    }

    // Disconnect existing instance if any
    if (ChatSocketSingleton.instance) {
      console.log("🔄 Disconnecting existing socket instance");
      ChatSocketSingleton.instance.disconnect();
      ChatSocketSingleton.instance = null;
    }

    try {
      const token = await getAccessToken();
      
      // Validate environment variable
      if (!NEXT_PUBLIC_API_URL) {
        throw new Error('NEXT_PUBLIC_API_URL is not defined. Check your .env file.');
      }
      
      // Clean the URL properly
      const baseURL = NEXT_PUBLIC_API_URL.replace(/\/+$/, '');
      const socketURL = `${baseURL}/chat`;
      
      // Detailed logging
      console.log('\n==========================================');
      console.log('🔌 SOCKET CONNECTION ATTEMPT', ChatSocketSingleton.connectionAttempts + 1);
      console.log('==========================================');
      console.log('📍 Base URL:', baseURL);
      console.log('📍 Socket URL:', socketURL);
      console.log('🔑 Token exists:', !!token);
      console.log('🔑 Token length:', token?.length || 0);
      console.log('==========================================\n');
      
      // Validate URL format
      if (!socketURL.startsWith('http://') && !socketURL.startsWith('https://')) {
        throw new Error(`Invalid socket URL format: ${socketURL}. Must start with http:// or https://`);
      }

      ChatSocketSingleton.instance = io(socketURL, {
        query: { token },
        transports: ['websocket', 'polling'], // Use both for better reliability
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
        timeout: 20000, // 20 second timeout
        autoConnect: true,
        forceNew: false,
        // Add these for better mobile connection
        upgrade: true,
        rememberUpgrade: true,
        path: '/socket.io/', // Default path, but explicit
      });

      // Connection successful
      ChatSocketSingleton.instance.on("connect", () => {
        ChatSocketSingleton.connectionAttempts = 0; // Reset on success
        console.log('✅ ========================================');
        console.log('✅ SOCKET CONNECTED SUCCESSFULLY!');
        console.log('✅ Socket ID:', ChatSocketSingleton.instance?.id);
        console.log('✅ Transport:', ChatSocketSingleton.instance?.io.engine.transport.name);
        console.log('✅ ========================================\n');
      });

      // Connection error
      ChatSocketSingleton.instance.on("connect_error", (error: any) => {
        ChatSocketSingleton.connectionAttempts++;
        
        console.log('❌ ========================================');
        console.log('❌ SOCKET CONNECTION ERROR');
        console.log('❌ ========================================');
        console.log('Error message:', error.message || 'Unknown error');
        console.log('Error type:', error.type || 'Unknown type');
        console.log('Error description:', error.description || 'No description');
        console.log('Attempt:', ChatSocketSingleton.connectionAttempts);
        console.log('Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
        console.log('==========================================\n');

        // Diagnose specific errors
        if (error.message.includes('Invalid namespace')) {
          console.log('🚨 DIAGNOSIS: Server does not have /chat namespace');
          console.log('💡 SOLUTION: Check server configuration or remove /chat from URL');
        } else if (error.message.includes('xhr poll error') || error.message.includes('websocket error')) {
          console.log('🚨 DIAGNOSIS: Network connectivity issue');
          console.log('💡 SOLUTION: Check if server is running and accessible');
          console.log('💡 Server URL:', socketURL);
        } else if (error.message.includes('timeout')) {
          console.log('🚨 DIAGNOSIS: Connection timeout');
          console.log('💡 SOLUTION: Server may be slow or unreachable');
        } else if (!error.message || error.message === '{}') {
          console.log('🚨 DIAGNOSIS: Empty error object - likely network/CORS issue');
          console.log('💡 SOLUTION 1: Check if server is running');
          console.log('💡 SOLUTION 2: Check CORS configuration on server');
          console.log('💡 SOLUTION 3: If using localhost, change to your computer IP');
          console.log('💡 Example: http://192.168.1.100:3000 instead of http://localhost:3000');
        }
      });

      // Connection timeout
      ChatSocketSingleton.instance.on("connect_timeout", () => {
        console.log('⏱️ Connection timeout after 20 seconds');
        console.log('💡 Server might be down or unreachable at:', socketURL);
      });

      // Disconnection
      ChatSocketSingleton.instance.on("disconnect", (reason: string) => {
        console.log('🔌 Socket disconnected:', reason);
        
        if (reason === 'io server disconnect') {
          console.log('💡 Server forcefully disconnected the socket');
          console.log('   This might be due to authentication issues');
        } else if (reason === 'transport close') {
          console.log('💡 Connection lost - will attempt to reconnect');
        }
      });

      // Reconnection attempt
      ChatSocketSingleton.instance.on("reconnect_attempt", (attemptNumber: number) => {
        console.log(`🔄 Reconnection attempt ${attemptNumber}...`);
      });

      // Reconnection failed
      ChatSocketSingleton.instance.on("reconnect_failed", () => {
        console.log('❌ Reconnection failed after all attempts');
      });

      // General error handler
      ChatSocketSingleton.instance.on("error", (error: any) => {
        console.error('❌ Socket error event:', error);
        
        if (error?.message === "Session expired. Please login again.") {
          console.log('🚨 Session expired - user needs to login again');
          // Optionally: auto logout user
          // clearAllTokens();
          // Navigate to login screen
        }
      });

      return ChatSocketSingleton.instance;

    } catch (error: any) {
      console.error('❌ ========================================');
      console.error('❌ FATAL ERROR CREATING SOCKET');
      console.error('❌ ========================================');
      console.error('Error:', error.message);
      console.error('Stack:', error.stack);
      console.error('==========================================\n');
      
      throw error;
    }
  }

  public static getInstance(): Socket | null {
    return ChatSocketSingleton.instance;
  }

  public static disconnect(): void {
    if (ChatSocketSingleton.instance) {
      console.log("🔌 Disconnecting chat socket");
      ChatSocketSingleton.instance.disconnect();
      ChatSocketSingleton.instance = null;
      ChatSocketSingleton.connectionAttempts = 0;
    }
  }

  public static isConnected(): boolean {
    return ChatSocketSingleton.instance?.connected || false;
  }

  public static getConnectionAttempts(): number {
    return ChatSocketSingleton.connectionAttempts;
  }
}

export default ChatSocketSingleton;
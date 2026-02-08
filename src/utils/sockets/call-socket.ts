import { io, Socket } from "socket.io-client";
import { getAccessToken } from "@/utils/localstorage";

class CallSocketSingleton {
  private static instance: Socket | null = null;
  private static currentToken: string | null = null;

  public static getInstance(): Socket {
    const token = getAccessToken();
    if (!token) {
      console.warn('CallSocketSingleton: no token, skipping socket connection');
      return null as any;
    }

    // If socket exists and token changed, update auth instead of reconnecting
    if (this.instance && token !== this.currentToken) {
      this.updateAuthentication(token);
      return this.instance;
    }

    if (!this.instance) {
      this.currentToken = token;
      this.instance = io(`${process.env.NEXT_PUBLIC_API_BASE}/call`, {
        query: { token }, // Keep query for initial connection (your server expects this)
        auth: { token },  // Also add to auth for future compatibility
        autoConnect: true,
        transports: ['websocket', 'polling'], // Fallback options
      });
      
      this.instance.on('connect', () => {
        console.log('Call socket connected with ID:', this.instance!.id);
      });
      
      this.instance.on('disconnect', (reason) => {
        console.log('Call socket disconnected:', reason);
      });

      // Handle authentication errors and token refresh
      this.instance.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        // If it's an auth error, try with fresh token
        const freshToken = getAccessToken();
        if (freshToken && freshToken !== this.currentToken) {
  console.log('Retrying connection with fresh token');
  this.updateAuthentication(freshToken);
   }
      });

      // Handle server-side auth update responses (if you implement them)
      this.instance.on('auth-updated', (response) => {
        console.log('Server confirmed auth update:', response);
      });

      this.instance.on('auth-error', (error) => {
        console.error('Server auth error:', error);
        // Could trigger a full reconnection here if needed
      });
    }

    return this.instance;
  }

  private static updateAuthentication(newToken: string): void {
    if (!this.instance) return;

    this.currentToken = newToken;
    
    // Method 1: Update auth object for potential reconnections
    this.instance.auth = { token: newToken };
    
    // Method 2: If socket is connected, emit a custom event to update server-side auth
    if (this.instance.connected) {
      this.instance.emit('refresh-auth', { token: newToken });
      console.log('Sent auth refresh to server');
    } else {
      // Method 3: If disconnected, update query and reconnect
      // Update the handshake query for reconnection
      (this.instance as any).io.opts.query = { token: newToken };
      this.instance.connect();
      console.log('Reconnecting with new token');
    }
    
    console.log('Socket authentication updated with new token');
  }

  // Simplified method for axios interceptor
  public static refreshConnection(): Socket {
    const token = getAccessToken();
    if (this.instance && token && token !== this.currentToken) {
      this.updateAuthentication(token);
    }
    return this.getInstance();
  }

  // More explicit method for token refresh scenarios
  public static refreshAuth(): void {
    const token = getAccessToken();
    if (token && this.instance) {
      this.updateAuthentication(token);
    }
  }

  // Force reconnection if auth update fails
  public static forceReconnect(): Socket {
    if (this.instance) {
      this.instance.disconnect();
      this.instance = null;
      this.currentToken = null;
    }
    return this.getInstance();
  }

  public static disconnect(): void {
    if (this.instance) {
      this.instance.disconnect();
      this.instance = null;
      this.currentToken = null;
    }
  }
}

export default CallSocketSingleton;
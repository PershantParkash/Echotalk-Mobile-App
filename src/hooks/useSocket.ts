import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { Socket } from 'socket.io-client';
import type { RootState } from '../store';
import { getChatSocket, getCallSocket } from '../utils/sockets/socketManager';

export function useChatSocket(): Socket | null {
  const isConnected = useSelector(
    (state: RootState) => state?.socket?.chatSocket?.isConnected,
  );
  return useMemo(
    () => (isConnected ? getChatSocket() : null),
    [isConnected],
  );
}

export function useCallSocket(): Socket | null {
  const isConnected = useSelector(
    (state: RootState) => state?.socket?.callSocket?.isConnected,
  );
  return useMemo(
    () => (isConnected ? getCallSocket() : null),
    [isConnected],
  );
}

export function useChatSocketStatus() {
  return useSelector((state: RootState) => state?.socket?.chatSocket);
}

export function useCallSocketStatus() {
  return useSelector((state: RootState) => state?.socket?.callSocket);
}

export function useSocketStatus() {
  return useSelector((state: RootState) => state?.socket);
}

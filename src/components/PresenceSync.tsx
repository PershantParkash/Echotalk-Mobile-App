import React, { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import type { Socket } from 'socket.io-client';
import CallSocketSingleton from '../utils/sockets/call-socket';
import { setUserPresence } from '../store/presence/presence.actions';

type UserStatusPayload = {
  userId?: string;
  isOnline?: boolean;
  timestamp?: string;
};

/**
 * Listens to `userStatusChanged` on the `/call` socket (same event as web StatusSync)
 * and mirrors presence into Redux for Messages / Chat UI.
 */
const PresenceSync: React.FC = () => {
  const dispatch = useDispatch();
  const handlerRef = useRef<(data: UserStatusPayload) => void>(() => {});

  useEffect(() => {
    handlerRef.current = (data: UserStatusPayload) => {
      const rawId = data?.userId;
      const broadcastUserId =
        typeof rawId === 'string' ? parseInt(rawId, 10) : Number(rawId);
      if (!Number.isFinite(broadcastUserId)) {
        return;
      }
      dispatch(
        setUserPresence({
          userId: broadcastUserId,
          isOnline: Boolean(data?.isOnline),
          lastSeenAt: data?.isOnline ? undefined : data?.timestamp,
        }),
      );
    };
  }, [dispatch]);

  useEffect(() => {
    let cancelled = false;
    let socket: Socket | null = null;

    const onStatus = (data: UserStatusPayload) => {
      handlerRef.current?.(data);
    };

    CallSocketSingleton.connect()
      .then((instance) => {
        if (cancelled || !instance) {
          return;
        }
        socket = instance;
        instance.on?.('userStatusChanged', onStatus);
      })
      .catch(() => {
        /* connect errors logged in CallSocketSingleton */
      });

    return () => {
      cancelled = true;
      socket?.off?.('userStatusChanged', onStatus);
    };
  }, []);

  return null;
};

export default PresenceSync;

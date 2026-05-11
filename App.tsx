import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState, AppStateStatus } from 'react-native';
import './global.css';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { Provider, useDispatch, useSelector } from 'react-redux';
import AppStack from './src/navigation/AppStack';
import { store, RootState } from './src/store';
import Toast from 'react-native-toast-message';
import CallSocketSingleton from './src/utils/sockets/call-socket';
import ChatSocketSingleton from './src/utils/sockets/chat-socket';
import type { RootStackParamList } from './src/navigation/navigation';
import type { Socket } from 'socket.io-client';
import IncomingCallModal from './src/components/call/IncomingCallModal';
import type { IncomingCallPayload } from './src/types/incomingCall';
import {
  incomingCallToRejectPayload,
} from './src/types/incomingCall';
import { ensureAudioPermission, ensureVideoPermission } from './src/utils/permissions';
import { setupIncomingCallPush } from './src/utils/incomingCallPush';
import { getAccessToken } from './src/utils/storage';
import { clearPresence } from './src/store/presence/presence.actions';
import PresenceSync from './src/components/PresenceSync';
import useChatsService from './src/services/chat';

function isValidIncomingPayload(payload: IncomingCallPayload | undefined): boolean {
  const from = payload?.from;
  const to = payload?.to;
  if (from === undefined || from === null || to === undefined || to === null) {
    return false;
  }
  return String(from).length > 0 && String(to).length > 0;
}

/**
 * Call socket connects only when `getAccessToken()` succeeds (after login).
 * Redux `userDetails.id` can load later from HomeScreen; the token is enough for `/call`.
 */
function incomingEventMatchesPendingCall(
  pending: IncomingCallPayload | null,
  data: { callLogId?: number } | undefined,
): boolean {
  if (pending == null) {
    return true;
  }
  const evId = data?.callLogId;
  const curId = pending?.callLogId;
  if (evId != null && curId != null && Number(evId) !== Number(curId)) {
    return false;
  }
  return true;
}

function AppWithCallSocket() {
  const dispatch = useDispatch();
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList> | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCallPayload | null>(null);
  /** Call socket auth uses the token; id may load later from HomeScreen profile fetch. */
  const [hasAuthToken, setHasAuthToken] = useState(false);
  /** Avoid treating a transient Keychain null as logout (would clear the incoming modal). */
  const hadAuthTokenRef = useRef(false);
  const userId = useSelector((state: RootState) => state.user?.userDetails?.id);
  const { getChats } = useChatsService();
  const chatSocketAttachedRef = useRef(false);
  const lastJoinedChatIdsKeyRef = useRef<string>('');

  const clearIncomingModal = useCallback(() => {
    setIncomingCall(null);
  }, []);

  /**
   * Auto-decline after 30s if the user doesn't answer/decline.
   * This runs at the global modal level (before navigating to CallScreen).
   */
  useEffect(() => {
    if (!incomingCall) {
      return;
    }

    const payload = incomingCall;
    const timer = setTimeout(() => {
      // Best-effort: reject on the socket, always dismiss the modal.
      CallSocketSingleton.connect?.()
        .then(sock => {
          sock?.emit?.('rejectCall', incomingCallToRejectPayload(payload));
        })
        .catch(() => { })
        .finally(() => {
          setIncomingCall(prev => {
            // Only clear if it's still the same pending call.
            const prevId = prev?.callLogId;
            const payloadId = payload?.callLogId;
            if (prevId != null && payloadId != null && Number(prevId) !== Number(payloadId)) {
              return prev;
            }
            if (String(prev?.from ?? '') !== String(payload?.from ?? '')) {
              return prev;
            }
            if (String(prev?.to ?? '') !== String(payload?.to ?? '')) {
              return prev;
            }
            return null;
          });
        });
    }, 30_000);

    return () => clearTimeout(timer);
  }, [incomingCall]);

  const joinAllChatRooms = useCallback(
    async (socket: Socket | null | undefined) => {
      if (!socket?.emit) {
        return;
      }
      try {
        const chats = await getChats?.();
        const chatList = Array.isArray(chats) ? chats : [];
        const chatIds =
          chatList
            ?.map?.((c: any) => Number(c?.id))
            ?.filter?.((id: number) => Number.isFinite(id) && id > 0) ?? [];

        // Avoid spamming re-join if the list hasn't changed.
        const key =
          chatIds?.slice?.()?.sort?.((a, b) => a - b)?.join?.(',') ?? '';
        if (key && key === lastJoinedChatIdsKeyRef.current) {
          socket.emit?.('joinAllChats', chatIds);
          return;
        }

        lastJoinedChatIdsKeyRef.current = key;
        socket.emit?.('joinAllChats', chatIds);
      } catch (e: unknown) {
        // Best-effort: if chats can't be fetched we still keep the socket alive.
        const msg = e instanceof Error ? e.message : String(e ?? 'unknown');
        console.warn?.('[ChatSocket] joinAllChatRooms failed:', msg);
      }
    },
    [getChats],
  );

  const dismissIncomingIfCallLog = useCallback(
    (callLogId: number | undefined) => {
      if (callLogId == null) {
        return;
      }
      setIncomingCall(prev => {
        if (prev?.callLogId === callLogId) {
          return null;
        }
        return prev;
      });
    },
    [],
  );

  const refreshAuthTokenPresence = useCallback(async () => {
    const token = await getAccessToken();
    if (token?.length) {
      setHasAuthToken(true);
      return;
    }
    const again = await getAccessToken();
    setHasAuthToken(!!again?.length);
  }, []);

  useEffect(() => {
    refreshAuthTokenPresence().catch(() => { });
    const onAppState = (state: AppStateStatus) => {
      if (state === 'active') {
        refreshAuthTokenPresence().catch(() => { });
      }
    };
    const sub = AppState.addEventListener('change', onAppState);
    return () => {
      sub.remove();
    };
  }, [refreshAuthTokenPresence]);

  useEffect(() => {
    if (userId != null) {
      refreshAuthTokenPresence().catch(() => { });
    }
  }, [userId, refreshAuthTokenPresence]);

  useEffect(() => {
    if (!hasAuthToken) {
      dispatch(clearPresence());
    }
  }, [hasAuthToken, dispatch]);

  /**
   * Global chat socket:
   * - Connects after auth token exists
   * - Joins all chat rooms so web → mobile messages arrive even when ChatScreen isn't open
   * - Re-joins on reconnect
   * - Listens for server 'joinRoom' event (new chat created elsewhere) and joins that room
   */
  useEffect(() => {
    if (!hasAuthToken) {
      chatSocketAttachedRef.current = false;
      lastJoinedChatIdsKeyRef.current = '';
      ChatSocketSingleton.disconnect?.();
      return;
    }

    let cancelled = false;
    let attachedSocket: Socket | null = null;

    const onConnect = () => {
      joinAllChatRooms?.(attachedSocket).catch?.(() => { });
    };

    const onJoinRoom = (payload: any) => {
      const chatId = Number(payload?.chatId);
      if (!Number.isFinite(chatId) || chatId <= 0) {
        return;
      }
      attachedSocket?.emit?.('joinAllChats', [chatId]);
      // Force next full join to include this chatId even if list is cached.
      lastJoinedChatIdsKeyRef.current = '';
      joinAllChatRooms?.(attachedSocket).catch?.(() => { });
    };

    ChatSocketSingleton.connect?.()
      .then((socket) => {
        if (cancelled) return;
        attachedSocket = socket;

        // Ensure rooms are joined even if connect already happened before handlers were attached.
        joinAllChatRooms?.(attachedSocket).catch?.(() => { });

        if (!chatSocketAttachedRef.current) {
          attachedSocket?.on?.('connect', onConnect);
          attachedSocket?.on?.('joinRoom', onJoinRoom);
          chatSocketAttachedRef.current = true;
        }
      })
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : String(e ?? 'unknown');
        console.warn?.('[ChatSocket] App connect failed:', msg);
      });

    return () => {
      cancelled = true;
      const s = attachedSocket ?? ChatSocketSingleton.getInstance?.();
      s?.off?.('connect', onConnect);
      s?.off?.('joinRoom', onJoinRoom);
      chatSocketAttachedRef.current = false;
    };
  }, [hasAuthToken, joinAllChatRooms]);

  /** Login saves the token without an AppState change — poll until we see it. */
  useEffect(() => {
    if (hasAuthToken) {
      return;
    }
    const id = setInterval(() => {
      refreshAuthTokenPresence().catch(() => { });
    }, 1000);
    return () => clearInterval(id);
  }, [hasAuthToken, refreshAuthTokenPresence]);

  useEffect(() => {
    if (!hasAuthToken) {
      if (hadAuthTokenRef.current) {
        clearIncomingModal();
      }
      hadAuthTokenRef.current = false;
      return;
    }
    hadAuthTokenRef.current = true;

    const onReceivingCall = (payload: IncomingCallPayload) => {
      if (!isValidIncomingPayload(payload)) {
        return;
      }
      setIncomingCall(payload);
    };

    const onCallEnded = (data?: { callLogId?: number }) => {
      setIncomingCall(prev => {
        if (!incomingEventMatchesPendingCall(prev, data)) {
          return prev;
        }
        return null;
      });
    };

    const onCallCancelled = (data?: { callLogId?: number }) => {
      setIncomingCall(prev => {
        if (!incomingEventMatchesPendingCall(prev, data)) {
          return prev;
        }
        return null;
      });
    };

    const onRejectCall = (data?: { callLogId?: number }) => {
      setIncomingCall(prev => {
        if (!incomingEventMatchesPendingCall(prev, data)) {
          return prev;
        }
        return null;
      });
    };

    const onAnsweredElsewhere = (data: { callLogId?: number }) => {
      dismissIncomingIfCallLog(data?.callLogId);
    };

    let cancelled = false;
    let attachedSocket: Socket | null = null;

    CallSocketSingleton.connect()
      .then(instance => {
        if (cancelled) {
          return;
        }
        attachedSocket = instance;
        if (instance.connected) {
        } else {
          instance.once?.('connect', () => {
          });
        }
        instance.on?.('receivingCall', onReceivingCall);
        instance.on?.('onCallEnded', onCallEnded);
        instance.on?.('onCallCancelled', onCallCancelled);
        instance.on?.('onRejectCall', onRejectCall);
        instance.on?.('callAnsweredOnAnotherDevice', onAnsweredElsewhere);
      })
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : String(e ?? 'unknown');
        console.warn('[CallSocket] App connect failed:', msg);
      });

    return () => {
      cancelled = true;
      const s = attachedSocket ?? CallSocketSingleton.getInstance();
      if (s) {
        s.off?.('receivingCall', onReceivingCall);
        s.off?.('onCallEnded', onCallEnded);
        s.off?.('onCallCancelled', onCallCancelled);
        s.off?.('onRejectCall', onRejectCall);
        s.off?.('callAnsweredOnAnotherDevice', onAnsweredElsewhere);
      }
    };
  }, [hasAuthToken, clearIncomingModal, dismissIncomingIfCallLog]);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    try {
      cleanup = setupIncomingCallPush(payload => {
        if (isValidIncomingPayload(payload)) {
          setIncomingCall(payload);
        }
      });
    } catch {
      // Native modules require rebuild after adding messaging/notifee.
    }
    return () => {
      cleanup?.();
    };
  }, []);

  const handleDeclineIncoming = useCallback(async () => {
    const payload = incomingCall;
    if (!payload) {
      return;
    }
    try {
      const sock = await CallSocketSingleton.connect();
      sock?.emit?.('rejectCall', incomingCallToRejectPayload(payload));
    } catch {
      // still dismiss UI
    }
    clearIncomingModal();
  }, [incomingCall, clearIncomingModal]);

  const handleAnswerIncoming = useCallback(async () => {
    const payload = incomingCall;
    if (!payload) {
      return;
    }

    const needsVideo = payload?.callType === 'video';
    const okAudio = await ensureAudioPermission();
    if (!okAudio) {
      Alert.alert('Permission', 'Microphone access is required to answer the call.');
      return;
    }
    if (needsVideo) {
      const okVideo = await ensureVideoPermission();
      if (!okVideo) {
        Alert.alert('Permission', 'Camera access is required to answer a video call.');
        return;
      }
    }

    setIncomingCall(null);

    navigationRef.current?.navigate?.('CallScreen', {
      answerIncoming: true,
      callPayload: payload,
    });
  }, [incomingCall]);

  return (
    <>
      {hasAuthToken ? <PresenceSync /> : null}
      <NavigationContainer ref={navigationRef}>
        <AppStack />
        <Toast />
      </NavigationContainer>
      <IncomingCallModal
        visible={incomingCall != null}
        payload={incomingCall}
        onAnswer={handleAnswerIncoming}
        onDecline={handleDeclineIncoming}
      />
    </>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <AppWithCallSocket />
    </Provider>
  );
}

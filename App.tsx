import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState, AppStateStatus } from 'react-native';
import './global.css';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { Provider, useSelector } from 'react-redux';
import AppStack from './src/navigation/AppStack';
import { store, RootState } from './src/store';
import Toast from 'react-native-toast-message';
import CallSocketSingleton from './src/utils/sockets/call-socket';
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

function callAppLog(event: string, data?: unknown) {
  const ts = new Date()?.toISOString?.() ?? '';
  // eslint-disable-next-line no-console
  console.log?.(`[CallApp][${ts}]`, event, data ?? '');
}

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
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList> | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCallPayload | null>(null);
  /** Call socket auth uses the token; id may load later from HomeScreen profile fetch. */
  const [hasAuthToken, setHasAuthToken] = useState(false);
  /** Avoid treating a transient Keychain null as logout (would clear the incoming modal). */
  const hadAuthTokenRef = useRef(false);
  const userId = useSelector((state: RootState) => state.user?.userDetails?.id);

  const clearIncomingModal = useCallback(() => {
    setIncomingCall(null);
  }, []);

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
      callAppLog('on receivingCall', {
        from: payload?.from,
        to: payload?.to,
        roomName: payload?.roomName,
        callLogId: payload?.callLogId,
        callType: payload?.callType,
      });
      if (!isValidIncomingPayload(payload)) {
        callAppLog('receivingCall invalid payload (ignored)', payload);
        return;
      }
      setIncomingCall(payload);
    };

    const onCallEnded = (data?: { callLogId?: number }) => {
      callAppLog('on onCallEnded', data);
      setIncomingCall(prev => {
        if (!incomingEventMatchesPendingCall(prev, data)) {
          return prev;
        }
        return null;
      });
    };

    const onCallCancelled = (data?: { callLogId?: number }) => {
      callAppLog('on onCallCancelled', data);
      setIncomingCall(prev => {
        if (!incomingEventMatchesPendingCall(prev, data)) {
          return prev;
        }
        return null;
      });
    };

    const onRejectCall = (data?: { callLogId?: number }) => {
      callAppLog('on onRejectCall', data);
      setIncomingCall(prev => {
        if (!incomingEventMatchesPendingCall(prev, data)) {
          return prev;
        }
        return null;
      });
    };

    const onAnsweredElsewhere = (data: { callLogId?: number }) => {
      callAppLog('on callAnsweredOnAnotherDevice', data);
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
          callAppLog('CallSocket connected', { id: instance?.id });
        } else {
          instance.once?.('connect', () => {
            callAppLog('CallSocket connected (late)', { id: instance?.id });
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
      callAppLog('emit rejectCall (decline modal)', {
        socketId: sock?.id,
        from: payload?.from,
        to: payload?.to,
        roomName: payload?.roomName,
        callLogId: payload?.callLogId,
      });
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
    callAppLog('answer modal pressed', {
      from: payload?.from,
      to: payload?.to,
      roomName: payload?.roomName,
      callLogId: payload?.callLogId,
      callType: payload?.callType,
    });

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

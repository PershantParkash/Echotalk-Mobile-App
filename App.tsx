import React, { useCallback, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import './global.css';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { Provider, useDispatch, useSelector } from 'react-redux';
import AppStack from './src/navigation/AppStack';
import { store, RootState } from './src/store';
import Toast from 'react-native-toast-message';
import type { RootStackParamList } from './src/navigation/navigation';
import IncomingCallModal from './src/components/call/IncomingCallModal';
import { ensureAudioPermission, ensureVideoPermission } from './src/utils/permissions';
import { setupIncomingCallPush } from './src/utils/incomingCallPush';
import {
  connectAllSockets,
  disconnectAllSockets,
  declineIncomingCall,
  clearIncomingCallModal,
  handleIncomingCallFromPush,
  ensureCallSocketConnected,
} from './src/utils/sockets/socketManager';

function AppWithCallSocket() {
  const dispatch = useDispatch();
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList> | null>(null);

  const isAuthenticated = useSelector(
    (state: RootState) => state?.user?.isAuthenticated,
  );
  const incomingCall = useSelector(
    (state: RootState) => state?.incomingCall?.payload,
  );

  // Connect/disconnect sockets based on auth state
  useEffect(() => {
    if (isAuthenticated) {
      connectAllSockets(dispatch).catch?.((e: unknown) => {
        const msg = e instanceof Error ? e?.message : String(e ?? 'unknown');
        console.warn?.('[App] connectAllSockets failed:', msg);
      });
    } else {
      disconnectAllSockets(dispatch);
    }
  }, [isAuthenticated, dispatch]);

  // FCM push notification handler for incoming calls
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    try {
      cleanup = setupIncomingCallPush((payload) => {
        handleIncomingCallFromPush(payload);
      });
    } catch {
      // Native modules require rebuild after adding messaging/notifee.
    }
    return () => {
      cleanup?.();
    };
  }, []);

  const handleDeclineIncoming = useCallback(async () => {
    if (!incomingCall) return;
    await declineIncomingCall(incomingCall);
  }, [incomingCall]);

  const handleAnswerIncoming = useCallback(async () => {
    if (!incomingCall) return;

    const needsVideo = incomingCall?.callType === 'video';
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

    const socket = await ensureCallSocketConnected();
    if (!socket?.connected) {
      Alert.alert('Call error', 'Call service is not connected. Please try again.');
      return;
    }

    clearIncomingCallModal();

    navigationRef.current?.navigate?.('CallScreen', {
      answerIncoming: true,
      callPayload: incomingCall,
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

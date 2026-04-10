/**
 * FCM **data-only** messages (so JS background handler runs) for incoming calls when
 * the app is backgrounded or killed. Your server must send this in addition to (or
 * instead of when offline) the Socket.IO `receivingCall` event.
 *
 * All values in `data` must be **strings** (FCM requirement). Example:
 *
 * ```json
 * {
 *   "data": {
 *     "type": "incoming_call",
 *     "from": "12",
 *     "to": "34",
 *     "callerName": "Alex",
 *     "callerProfileImage": "",
 *     "calleeName": "",
 *     "calleeProfileImage": "",
 *     "roomName": "12_34",
 *     "callLogId": "99",
 *     "startTime": "2026-04-03T12:00:00.000Z",
 *     "callType": "audio"
 *   }
 * }
 * ```
 *
 * After adding `@react-native-firebase/messaging`, rebuild the app and enable Push in Xcode;
 * on Android ensure `google-services.json` is present.
 */
import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import { AppState } from 'react-native';
import type { IncomingCallPayload } from '../types/incomingCall';

const CHANNEL_ID = 'incoming_calls';

/** Normalize FCM `data` (all string values) into an incoming-call payload. */
export function fcmDataToIncomingPayload(
  data: Record<string, string> | undefined,
): IncomingCallPayload | null {
  if (!data || data.type !== 'incoming_call') {
    return null;
  }
  const callLogIdRaw = data.callLogId;
  return {
    from: data.from ?? '',
    to: data.to ?? '',
    callerName: data.callerName,
    callerProfileImage: data.callerProfileImage,
    calleeName: data.calleeName,
    calleeProfileImage: data.calleeProfileImage,
    roomName: data.roomName,
    callLogId:
      callLogIdRaw != null && String(callLogIdRaw).length > 0
        ? Number(callLogIdRaw)
        : undefined,
    startTime: data.startTime,
    callType: data.callType === 'video' ? 'video' : 'audio',
  };
}

export async function displayIncomingCallNotification(
  data: Record<string, string>,
): Promise<void> {
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: 'Incoming calls',
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibration: true,
  });

  const caller = data.callerName?.trim?.() ?? '';

  await notifee.displayNotification({
    title: caller.length ? `Call from ${caller}` : 'Incoming call',
    body: caller.length ? caller : 'Someone is calling you',
    data,
    android: {
      channelId: CHANNEL_ID,
      importance: AndroidImportance.HIGH,
      pressAction: { id: 'default', launchActivity: 'default' },
      sound: 'default',
      vibrationPattern: [300, 500],
    },
    ios: {
      sound: 'default',
    },
  });
}

/** Run from `index.js` via `setBackgroundMessageHandler` (no React context). */
export async function handleBackgroundIncomingCallMessage(
  remoteMessage: FirebaseMessagingTypes.RemoteMessage,
): Promise<void> {
  const data = remoteMessage?.data as Record<string, string> | undefined;
  if (!data || data.type !== 'incoming_call') {
    return;
  }
  await displayIncomingCallNotification(data);
}

/**
 * Register foreground FCM + notification open handlers. Returns a cleanup function.
 */
export function setupIncomingCallPush(
  onIncomingFromFcm: (payload: IncomingCallPayload) => void,
): () => void {
  const subForeground = messaging().onMessage(async remoteMessage => {
    const data = remoteMessage?.data as Record<string, string> | undefined;
    if (!data || data.type !== 'incoming_call') {
      return;
    }
    const payload = fcmDataToIncomingPayload(data);
    if (payload) {
      onIncomingFromFcm(payload);
    }
    // Tray / heads-up when not active; when active, socket modal usually handles UX.
    if (AppState.currentState !== 'active') {
      await displayIncomingCallNotification(data);
    }
  });

  const subOpen = messaging().onNotificationOpenedApp(remoteMessage => {
    const data = remoteMessage?.data as Record<string, string> | undefined;
    const payload = fcmDataToIncomingPayload(data);
    if (payload) {
      onIncomingFromFcm(payload);
    }
  });

  const unsubNotifeeFg = notifee.onForegroundEvent(({ type, detail }) => {
    if (
      type === EventType.PRESS &&
      detail?.notification?.data?.type === 'incoming_call'
    ) {
      const payload = fcmDataToIncomingPayload(
        detail.notification.data as Record<string, string>,
      );
      if (payload) {
        onIncomingFromFcm(payload);
      }
    }
  });

  (async () => {
    await notifee.requestPermission();
    await messaging().requestPermission();
    const initial = await messaging().getInitialNotification();
    const dataInit = initial?.data as Record<string, string> | undefined;
    const fromFcm = fcmDataToIncomingPayload(dataInit);
    if (fromFcm) {
      onIncomingFromFcm(fromFcm);
    }
    const iniN = await notifee.getInitialNotification();
    const d = iniN?.notification?.data as Record<string, string> | undefined;
    const fromN = fcmDataToIncomingPayload(d);
    if (fromN) {
      onIncomingFromFcm(fromN);
    }
  })().catch(() => {});

  return () => {
    subForeground();
    subOpen();
    unsubNotifeeFg();
  };
}

import { AppState, AppStateStatus } from 'react-native';
import type { Socket } from 'socket.io-client';
import type { AppDispatch } from '../../store';
import ChatSocketSingleton from './chat-socket';
import CallSocketSingleton from './call-socket';
import {
  setChatSocketStatus,
  setCallSocketStatus,
  resetSocketState,
} from '../../store/socket/socketSlice';
import {
  setConversations,
  updateLastMessage,
  clearConversations,
} from '../../store/conversations/conversationsSlice';
import {
  setIncomingCall,
  clearIncomingCall,
  dismissIfMatchingCallLog,
} from '../../store/incomingCall/incomingCallSlice';
import { setUserPresence, clearPresence } from '../../store/presence/presence.actions';
import { fetchAndEmitCallMessage } from '../callMessageBridge';
import { incomingCallToRejectPayload } from '../../types/incomingCall';
import type { IncomingCallPayload } from '../../types/incomingCall';
import axiosClient from '../../services/axiosClient';
import { ChatsEndpointsV1 } from '../../services/chat/constants';

let _dispatch: AppDispatch | null = null;
let _chatSocket: Socket | null = null;
let _callSocket: Socket | null = null;

let _keepaliveInterval: ReturnType<typeof setInterval> | null = null;
let _appStateSubscription: { remove: () => void } | null = null;
let _autoDeclineTimer: ReturnType<typeof setTimeout> | null = null;
let _lastJoinedChatIdsKey = '';
let _isConnecting = false;

const KEEPALIVE_INTERVAL_MS = 25_000;

function isValidIncomingPayload(payload: IncomingCallPayload | undefined): boolean {
  const from = payload?.from;
  const to = payload?.to;
  if (from === undefined || from === null || to === undefined || to === null) {
    return false;
  }
  return String(from).length > 0 && String(to).length > 0;
}

// ── Chat Socket Event Handlers ──────────────────────────────────────────

function attachChatSocketListeners(socket: Socket) {
  socket?.off?.('connect', onChatConnect);
  socket?.off?.('disconnect', onChatDisconnect);
  socket?.off?.('connect_error', onChatConnectError);
  socket?.off?.('newMessage', onGlobalNewMessage);
  socket?.off?.('joinRoom', onJoinRoom);

  socket?.on?.('connect', onChatConnect);
  socket?.on?.('disconnect', onChatDisconnect);
  socket?.on?.('connect_error', onChatConnectError);
  socket?.on?.('newMessage', onGlobalNewMessage);
  socket?.on?.('joinRoom', onJoinRoom);
}

function onChatConnect() {
  _dispatch?.(
    setChatSocketStatus({ isConnected: true, isConnecting: false, error: null }),
  );
  joinAllChatRooms().catch?.(() => {});
}

function onChatDisconnect() {
  _dispatch?.(setChatSocketStatus({ isConnected: false, isConnecting: false }));
}

function onChatConnectError(err: any) {
  const message = err instanceof Error ? err?.message : String(err ?? '');
  _dispatch?.(
    setChatSocketStatus({ isConnected: false, isConnecting: false, error: message }),
  );
}

function onGlobalNewMessage(data: any) {
  const chatId = Number(data?.chat?.id ?? data?.chatId ?? 0);
  const messageId = Number(data?.id ?? 0);
  if (!chatId || !messageId) return;

  const lastMessage = {
    id: messageId,
    content: data?.content ?? '',
    createdAt: data?.createdAt ?? new Date().toISOString(),
    sender: {
      id: Number(data?.sender?.id ?? data?.senderId ?? 0),
      fullName: data?.sender?.fullName ?? data?.senderName ?? null,
    },
  };

  _dispatch?.(
    updateLastMessage({ chatId, message: lastMessage }),
  );
}

function onJoinRoom(payload: any) {
  const chatId = Number(payload?.chatId);
  if (!Number.isFinite(chatId) || chatId <= 0) return;

  _chatSocket?.emit?.('joinAllChats', [chatId]);
  _lastJoinedChatIdsKey = '';
  joinAllChatRooms().catch?.(() => {});
}

// ── Call Socket Event Handlers ──────────────────────────────────────────

function attachCallSocketListeners(socket: Socket) {
  socket?.off?.('connect', onCallConnect);
  socket?.off?.('disconnect', onCallDisconnect);
  socket?.off?.('connect_error', onCallConnectError);
  socket?.off?.('receivingCall', onReceivingCall);
  socket?.off?.('onCallEnded', onCallEnded);
  socket?.off?.('onCallCancelled', onCallCancelled);
  socket?.off?.('onRejectCall', onRejectCall);
  socket?.off?.('callAnsweredOnAnotherDevice', onAnsweredElsewhere);
  socket?.off?.('userStatusChanged', onUserStatusChanged);

  socket?.on?.('connect', onCallConnect);
  socket?.on?.('disconnect', onCallDisconnect);
  socket?.on?.('connect_error', onCallConnectError);
  socket?.on?.('receivingCall', onReceivingCall);
  socket?.on?.('onCallEnded', onCallEnded);
  socket?.on?.('onCallCancelled', onCallCancelled);
  socket?.on?.('onRejectCall', onRejectCall);
  socket?.on?.('callAnsweredOnAnotherDevice', onAnsweredElsewhere);
  socket?.on?.('userStatusChanged', onUserStatusChanged);
}

function onCallConnect() {
  _dispatch?.(
    setCallSocketStatus({ isConnected: true, isConnecting: false, error: null }),
  );
}

function onCallDisconnect() {
  _dispatch?.(setCallSocketStatus({ isConnected: false, isConnecting: false }));
}

function onCallConnectError(err: any) {
  const message = err instanceof Error ? err?.message : String(err ?? '');
  _dispatch?.(
    setCallSocketStatus({ isConnected: false, isConnecting: false, error: message }),
  );
}

function onReceivingCall(payload: IncomingCallPayload) {
  if (!isValidIncomingPayload(payload)) return;
  _dispatch?.(setIncomingCall(payload));
  startAutoDeclineTimer(payload);
}

function onCallEnded(_data?: { callLogId?: number }) {
  _dispatch?.(clearIncomingCall());
  clearAutoDeclineTimer();
}

function onCallCancelled(_data?: { callLogId?: number }) {
  _dispatch?.(clearIncomingCall());
  clearAutoDeclineTimer();
}

function onRejectCall(_data?: { callLogId?: number }) {
  _dispatch?.(clearIncomingCall());
  clearAutoDeclineTimer();
}

function onAnsweredElsewhere(data: { callLogId?: number }) {
  if (data?.callLogId != null) {
    _dispatch?.(dismissIfMatchingCallLog(Number(data.callLogId)));
  }
  clearAutoDeclineTimer();
}

function onUserStatusChanged(data: {
  userId?: string;
  isOnline?: boolean;
  timestamp?: string;
}) {
  const rawId = data?.userId;
  const userId =
    typeof rawId === 'string' ? parseInt(rawId, 10) : Number(rawId);
  if (!Number.isFinite(userId)) return;

  _dispatch?.(
    setUserPresence({
      userId,
      isOnline: Boolean(data?.isOnline),
      lastSeenAt: data?.isOnline ? undefined : data?.timestamp,
    }),
  );
}

// ── Auto-Decline Timer ──────────────────────────────────────────────────

function startAutoDeclineTimer(payload: IncomingCallPayload) {
  clearAutoDeclineTimer();

  _autoDeclineTimer = setTimeout(() => {
    const callerId = payload?.from;
    const callerInfo = {
      fullName: payload?.callerName ?? null,
      profileImage: payload?.callerProfileImage
        ? String(payload.callerProfileImage)
        : null,
    };

    const socket = getCallSocket();
    socket?.emit?.('rejectCall', incomingCallToRejectPayload(payload));
    _dispatch?.(clearIncomingCall());

    if (callerId) {
      setTimeout(() => fetchAndEmitCallMessage(String(callerId), callerInfo), 800);
    }
  }, 30_000);
}

function clearAutoDeclineTimer() {
  if (_autoDeclineTimer) {
    clearTimeout(_autoDeclineTimer);
    _autoDeclineTimer = null;
  }
}

// ── Keepalive & AppState ────────────────────────────────────────────────

function startKeepalive() {
  stopKeepalive();

  _keepaliveInterval = setInterval(() => {
    if (_chatSocket?.connected) {
      _chatSocket?.emit?.('ping');
    }
    if (_callSocket?.connected) {
      _callSocket?.emit?.('ping');
    }
  }, KEEPALIVE_INTERVAL_MS);
}

function stopKeepalive() {
  if (_keepaliveInterval) {
    clearInterval(_keepaliveInterval);
    _keepaliveInterval = null;
  }
}

function startAppStateListener() {
  stopAppStateListener();

  _appStateSubscription = AppState.addEventListener(
    'change',
    (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        if (_chatSocket && !_chatSocket?.connected) {
          _chatSocket?.connect?.();
        }
        if (_callSocket && !_callSocket?.connected) {
          _callSocket?.connect?.();
        }
      }
    },
  );
}

function stopAppStateListener() {
  _appStateSubscription?.remove?.();
  _appStateSubscription = null;
}

// ── Room Joining ────────────────────────────────────────────────────────

async function fetchChatsFromAPI(): Promise<any[]> {
  try {
    const response = await axiosClient?.get?.(ChatsEndpointsV1?.getChats);
    return Array.isArray(response?.data) ? response.data : [];
  } catch {
    return [];
  }
}

export async function joinAllChatRooms(): Promise<void> {
  const socket = _chatSocket;
  if (!socket?.emit) return;

  try {
    const chats = await fetchChatsFromAPI();

    _dispatch?.(setConversations(chats));

    const chatIds =
      chats
        ?.map?.((c: any) => Number(c?.id))
        ?.filter?.((id: number) => Number.isFinite(id) && id > 0) ?? [];

    const key = chatIds?.slice?.()?.sort?.((a: number, b: number) => a - b)?.join?.(',') ?? '';
    if (key && key === _lastJoinedChatIdsKey) {
      socket?.emit?.('joinAllChats', chatIds);
      return;
    }

    _lastJoinedChatIdsKey = key;
    socket?.emit?.('joinAllChats', chatIds);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e?.message : String(e ?? 'unknown');
    console.warn?.('[SocketManager] joinAllChatRooms failed:', msg);
  }
}

// ── Public API ──────────────────────────────────────────────────────────

export function getChatSocket(): Socket | null {
  return _chatSocket;
}

export function getCallSocket(): Socket | null {
  return _callSocket;
}

export async function ensureCallSocketConnected(): Promise<Socket | null> {
  const existingSocket = _callSocket ?? CallSocketSingleton?.getInstance?.();
  if (existingSocket?.connected) {
    if (_callSocket !== existingSocket) {
      _callSocket = existingSocket;
      attachCallSocketListeners(_callSocket);
    }
    _dispatch?.(
      setCallSocketStatus({ isConnected: true, isConnecting: false, error: null }),
    );
    return existingSocket;
  }

  _dispatch?.(setCallSocketStatus({ isConnecting: true, error: null }));

  try {
    const socket = await CallSocketSingleton?.connect?.();
    _callSocket = socket;
    attachCallSocketListeners(_callSocket);
    _dispatch?.(
      setCallSocketStatus({
        isConnected: _callSocket?.connected ?? false,
        isConnecting: false,
        error: null,
      }),
    );
    startKeepalive();
    startAppStateListener();
    return _callSocket;
  } catch (e: unknown) {
    const errMsg = e instanceof Error ? e?.message : String(e ?? 'Call socket connection failed');
    _dispatch?.(
      setCallSocketStatus({ isConnected: false, isConnecting: false, error: errMsg }),
    );
    return null;
  }
}

export async function connectAllSockets(dispatch: AppDispatch): Promise<void> {
  if (_isConnecting) return;
  _isConnecting = true;
  _dispatch = dispatch;

  try {
    dispatch(setChatSocketStatus({ isConnecting: true }));
    dispatch(setCallSocketStatus({ isConnecting: true }));

    const [chatSocket, callSocket] = await Promise.allSettled([
      ChatSocketSingleton?.connect?.(),
      CallSocketSingleton?.connect?.(),
    ]);

    if (chatSocket?.status === 'fulfilled') {
      _chatSocket = chatSocket.value;
      attachChatSocketListeners(_chatSocket);
      dispatch(
        setChatSocketStatus({
          isConnected: _chatSocket?.connected ?? false,
          isConnecting: false,
          error: null,
        }),
      );
      await joinAllChatRooms();
    } else {
      const errMsg =
        chatSocket?.status === 'rejected'
          ? String(chatSocket.reason ?? 'Chat socket connection failed')
          : 'Chat socket connection failed';
      console.warn?.('[SocketManager] Chat socket failed:', errMsg);
      dispatch(
        setChatSocketStatus({ isConnected: false, isConnecting: false, error: errMsg }),
      );
    }

    if (callSocket?.status === 'fulfilled') {
      _callSocket = callSocket.value;
      attachCallSocketListeners(_callSocket);
      dispatch(
        setCallSocketStatus({
          isConnected: _callSocket?.connected ?? false,
          isConnecting: false,
          error: null,
        }),
      );
    } else {
      const errMsg =
        callSocket?.status === 'rejected'
          ? String(callSocket.reason ?? 'Call socket connection failed')
          : 'Call socket connection failed';
      console.warn?.('[SocketManager] Call socket failed:', errMsg);
      dispatch(
        setCallSocketStatus({ isConnected: false, isConnecting: false, error: errMsg }),
      );
    }

    startKeepalive();
    startAppStateListener();
  } finally {
    _isConnecting = false;
  }
}

export function disconnectAllSockets(dispatch: AppDispatch): void {
  _dispatch = dispatch;

  clearAutoDeclineTimer();
  stopKeepalive();
  stopAppStateListener();

  if (_chatSocket) {
    _chatSocket?.removeAllListeners?.();
    _chatSocket = null;
  }
  ChatSocketSingleton?.disconnect?.();

  if (_callSocket) {
    _callSocket?.removeAllListeners?.();
    _callSocket = null;
  }
  CallSocketSingleton?.disconnect?.();

  _lastJoinedChatIdsKey = '';
  _isConnecting = false;

  dispatch(resetSocketState());
  dispatch(clearConversations());
  dispatch(clearIncomingCall());
  dispatch(clearPresence());
}

export function handleIncomingCallFromPush(
  payload: IncomingCallPayload,
): void {
  if (isValidIncomingPayload(payload)) {
    _dispatch?.(setIncomingCall(payload));
    startAutoDeclineTimer(payload);
  }
}

export async function declineIncomingCall(
  payload: IncomingCallPayload,
): Promise<void> {
  const callerId = payload?.from;
  const callerInfo = {
    fullName: payload?.callerName ?? null,
    profileImage: payload?.callerProfileImage
      ? String(payload.callerProfileImage)
      : null,
  };

  try {
    const socket = getCallSocket();
    socket?.emit?.('rejectCall', incomingCallToRejectPayload(payload));
  } catch {
    // still dismiss UI
  }

  clearAutoDeclineTimer();
  _dispatch?.(clearIncomingCall());

  if (callerId) {
    setTimeout(() => fetchAndEmitCallMessage(String(callerId), callerInfo), 800);
  }
}

export function clearIncomingCallModal(): void {
  clearAutoDeclineTimer();
  _dispatch?.(clearIncomingCall());
}

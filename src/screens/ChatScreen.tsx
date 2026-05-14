import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import audioRecorderPlayer from '../utils/audioRecorderPlayer';
import {
  View,
  Text,
  ScrollView,
  Image,
  Modal,
  TouchableOpacity,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  StyleSheet,
  DeviceEventEmitter,
} from 'react-native';
import { Video, Phone, X } from 'lucide-react-native';
import useChatsService from '../services/chat';
// import SocketDebugOverlay from '../components/SocketDebugOverlay';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { useChatSocket, useCallSocket } from '../hooks/useSocket';
import { mergeUserWithPresence } from '../utils/presenceMerge';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import ChatMessageBar, {
  recordingElapsedSecFromClock,
  type VoiceRecordingClock,
} from '../components/chat/ChatMessageBar';
import CallMessageCard from '../components/chat/CallMessageCard';
import VoiceMessageBubble from '../components/chat/VoiceMessageBubble';
import useS3Upload from '../hooks/useS3Upload';
import { pickChatImageAsset } from '../utils/chatImagePicker';
import type { Asset } from 'react-native-image-picker';
import {
  getChatAudioDisplayUrl,
  getChatImageDisplayUrl,
  mergeIncomingSocketMessage,
} from '../utils/chatMessages';
import { voiceRecordingAudioSet } from '../utils/voiceRecordingConfig';
import { ensureAudioPermission, ensureVideoPermission } from '../utils/permissions';
import OutgoingCallConsentModal from '../components/call/OutgoingCallConsentModal';
import { CALL_MESSAGE_EVENT, type CallMessagePayload } from '../utils/callMessageBridge';
import { ensureCallSocketConnected } from '../utils/sockets/socketManager';

interface Message {
  id: number;
  content: string;
  createdAt: string;
  sender: {
    id: number;
    fullName: string | null;
    profileImage: string | null;
  };
  isCallMessage?: boolean;
  callStatus?: string | null;
  callDuration?: number | null;
  callSummary?: string | null;
  /** Client-only hint for optimistic voice bubbles */
  voiceDurationSec?: number | null;
}

interface ChatUser {
  id: number;
  fullName: string | null;
  phoneNumber: string;
  profileImage: string | null;
  isOnline: boolean;
  lastSeenAt?: string;
}

interface Chat {
  id: number;
  type: string;
  users: ChatUser[];
}

interface ChatScreenProps {
  route: {
    params: {
      chatId: number;
      chat: Chat;
      currentUserId?: number;
      initialMessages?: Message[];
    };
  };
  navigation: any;
}

const ChatScreen: React.FC<ChatScreenProps> = ({
  route,
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const {
    chatId,
    chat,
    currentUserId: routeCurrentUserId,
    initialMessages = [],
  } = route?.params ?? {};
  const { userDetails } = useSelector((state: RootState) => state.user);
  const currentUserId = routeCurrentUserId ?? userDetails?.id;
  const [messages, setMessages] = useState<Message[]>(initialMessages ?? []);
  const [newMessage, setNewMessage] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [pendingImageAsset, setPendingImageAsset] = useState<Asset | null>(null);
  const [imageAspectRatios, setImageAspectRatios] = useState<Record<string, number>>(
    {},
  );
  const [imageViewer, setImageViewer] = useState<{
    visible: boolean;
    uri: string | null;
  }>({ visible: false, uri: null });
  const [headerHeight, setHeaderHeight] = useState(0);
  const [androidKeyboardHeight, setAndroidKeyboardHeight] = useState(0);
  const [applyAndroidKeyboardOffset, setApplyAndroidKeyboardOffset] =
    useState(false);
  const rootLayoutHeightRef = useRef<number | null>(null);
  const lastPreKeyboardRootHeightRef = useRef<number | null>(null);
  const keyboardVisibleRef = useRef(false);

  type VoiceUiPhase = 'idle' | 'recording' | 'paused' | 'preview';
  const [voiceUiPhase, setVoiceUiPhase] = useState<VoiceUiPhase>('idle');
  const [voiceRecordingClock, setVoiceRecordingClock] =
    useState<VoiceRecordingClock | null>(null);
  const [voicePreviewDurationSec, setVoicePreviewDurationSec] = useState(0);
  const [voiceFilePath, setVoiceFilePath] = useState<string | null>(null);
  const [recordingUsers, setRecordingUsers] = useState<
    { userId: number; fullName: string }[]
  >([]);
  const voicePathRef = useRef<string | null>(null);
  const voiceElapsedRef = useRef(0);
  const voiceUiPhaseRef = useRef<VoiceUiPhase>('idle');

  const { uploadImageFromUri, loading: imageUploading } = useS3Upload();

  const scrollViewRef = useRef<ScrollView>(null);
  const loadingRef = useRef(false);
  const isLoadingOlderRef = useRef(false);
  const contentHeightRef = useRef(0);
  const scrollOffsetRef = useRef(0);
  const viewportHeightRef = useRef(0);
  const initializedChatIdRef = useRef<number | null>(null);

  const chatSocket = useChatSocket();
  const callSocket = useCallSocket();
  const chatSocketRef = useRef(chatSocket);
  chatSocketRef.current = chatSocket;

  const { getMessages, sendMessage } = useChatsService();

  const emitRecordingStatus = useCallback(
    (isRecording: boolean) => {
      const socket = chatSocketRef.current;
      const uid =
        typeof currentUserId === 'number'
          ? currentUserId
          : userDetails?.id;
      if (!socket?.emit || typeof uid !== 'number') {
        return;
      }
      socket.emit('recording', {
        chatId,
        userId: uid,
        fullName: userDetails?.fullName ?? 'Someone',
        isRecording,
      });
    },
    [chatId, currentUserId, userDetails?.fullName, userDetails?.id],
  );

  const resetVoiceSession = useCallback(
    async (emitStop: boolean) => {
      try {
        await audioRecorderPlayer.stopRecorder();
      } catch {
        /* not recording */
      }
      audioRecorderPlayer.removeRecordBackListener();
      audioRecorderPlayer.removePlayBackListener();
      try {
        await audioRecorderPlayer.stopPlayer();
      } catch {
        /* idle */
      }
      voicePathRef.current = null;
      setVoiceFilePath(null);
      voiceElapsedRef.current = 0;
      setVoiceRecordingClock(null);
      setVoicePreviewDurationSec(0);
      setVoiceUiPhase('idle');
      if (emitStop) {
        emitRecordingStatus(false);
      }
    },
    [emitRecordingStatus],
  );

  // Get the other user in the conversation
  const otherUser =
    typeof currentUserId === 'number'
      ? chat?.users?.find?.(user => user?.id !== currentUserId)
      : chat?.users?.length === 1
        ? chat?.users?.[0]
        : undefined;

  const presenceByUserId = useSelector(
    (state: RootState) => state.presence?.byUserId,
  );

  const otherUserLive = useMemo(
    () => mergeUserWithPresence(otherUser, presenceByUserId) ?? otherUser,
    [otherUser, presenceByUserId],
  );

  // Screen-specific socket listeners (socket is managed globally by socketManager)
  useEffect(() => {
    if (!chatSocket) return;

    chatSocket?.emit?.('joinAllChats', [chatId]);

    const onNewMessage = (message: any) => {
      console.log('message received', message)
      if (message?.chat?.id !== chatId) return;
      setMessages(prev =>
        mergeIncomingSocketMessage<Message>(prev, message),
      );
      setTimeout(() => scrollToBottom(), 100);
    };

    const onUserRecording = (payload: any) => {
      if (payload?.chatId !== chatId) return;
      const uid = payload?.userId;
      const myId =
        typeof currentUserId === 'number'
          ? currentUserId
          : userDetails?.id;
      if (uid === myId) return;
      const isRec = Boolean(payload?.isRecording);
      const name =
        typeof payload?.fullName === 'string'
          ? payload.fullName
          : 'Someone';
      setRecordingUsers(prev => {
        if (isRec) {
          if (prev.some(u => u.userId === uid)) return prev;
          return [...prev, { userId: uid, fullName: name }];
        }
        return prev.filter(u => u.userId !== uid);
      });
    };

    const onReconnect = () => {
      chatSocket?.emit?.('joinAllChats', [chatId]);
    };

    chatSocket?.on?.('newMessage', onNewMessage);
    chatSocket?.on?.('userRecording', onUserRecording);
    chatSocket?.on?.('connect', onReconnect);

    return () => {
      chatSocket?.off?.('newMessage', onNewMessage);
      chatSocket?.off?.('userRecording', onUserRecording);
      chatSocket?.off?.('connect', onReconnect);
    };
  }, [chatSocket, chatId, currentUserId, userDetails?.id]);

  useEffect(() => {
    const chatUserIds = chat?.users?.map((u: ChatUser) => u?.id) ?? [];
    const subscription = DeviceEventEmitter.addListener(
      CALL_MESSAGE_EVENT,
      (payload: CallMessagePayload) => {
        if (payload?.callerId && chatUserIds?.includes(payload.callerId)) {
          setMessages(prev =>
            mergeIncomingSocketMessage<Message>(prev, payload.message),
          );
          setTimeout(() => scrollToBottom(), 100);
        }
      },
    );
    return () => subscription?.remove();
  }, [chatId, chat?.users]);

  /** Only run voice cleanup when `chatId` changes — not when `userDetails` updates (that was stopping the recorder mid-session). */
  const resetVoiceRef = useRef(resetVoiceSession);
  resetVoiceRef.current = resetVoiceSession;
  useEffect(() => {
    return () => {
      resetVoiceRef.current(true).catch(() => { });
    };
  }, [chatId]);

  useEffect(() => {
    setRecordingUsers([]);
  }, [chatId]);

  useEffect(() => {
    voiceUiPhaseRef.current = voiceUiPhase;
  }, [voiceUiPhase]);

  /**
   * Android keyboard handling across OS versions:
   * - Many devices honor `windowSoftInputMode="adjustResize"` → root height shrinks; no extra offset needed.
   * - Some newer/edge-to-edge setups don't resize reliably → message bar can end up behind keyboard.
   *
   * We detect whether the root layout height actually shrinks when the keyboard shows.
   * If it doesn't, we apply an extra bottom padding equal to the keyboard height.
   */
  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    const showSub = Keyboard.addListener('keyboardDidShow', e => {
      keyboardVisibleRef.current = true;
      lastPreKeyboardRootHeightRef.current = rootLayoutHeightRef.current;
      const h = e?.endCoordinates?.height ?? 0;
      setAndroidKeyboardHeight(Number.isFinite(h) && h > 0 ? h : 0);

      // If `adjustResize` works, an onLayout will fire and update rootLayoutHeightRef.
      // Give the layout a moment, then decide if we need a manual offset.
      requestAnimationFrame(() => {
        setTimeout(() => {
          const before = lastPreKeyboardRootHeightRef.current;
          const after = rootLayoutHeightRef.current;
          if (typeof before !== 'number' || typeof after !== 'number') {
            setApplyAndroidKeyboardOffset(true);
            return;
          }

          const shrink = Math.max(0, before - after);
          // If the view didn't meaningfully shrink, keyboard likely overlays the UI.
          setApplyAndroidKeyboardOffset(shrink < 24);
        }, 60);
      });
    });

    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      keyboardVisibleRef.current = false;
      setAndroidKeyboardHeight(0);
      setApplyAndroidKeyboardOffset(false);
      lastPreKeyboardRootHeightRef.current = null;
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleMicPress = useCallback(async () => {
    if (voiceUiPhase !== 'idle') {
      return;
    }
    if (pendingImageAsset?.uri != null) {
      Alert.alert(
        'Voice message',
        'Send or remove the image before recording audio.',
      );
      return;
    }
    if (sending || imageUploading) {
      return;
    }
    const ok = await ensureAudioPermission();
    if (!ok) {
      Alert.alert(
        'Permission needed',
        'Microphone access is required to record voice messages.',
      );
      return;
    }
    try {
      await audioRecorderPlayer.stopPlayer().catch(() => { });
      await audioRecorderPlayer.setSubscriptionDuration(0.08);
      audioRecorderPlayer.removeRecordBackListener();
      audioRecorderPlayer.addRecordBackListener(e => {
        const ms = e?.currentPosition ?? 0;
        const sec = Math.max(0, Math.floor(ms / 1000));
        if (sec > voiceElapsedRef.current) {
          voiceElapsedRef.current = sec;
        }
      });
      const path = await audioRecorderPlayer.startRecorder(
        undefined,
        voiceRecordingAudioSet,
        true,
      );
      const p = path?.trim?.() ?? '';
      voicePathRef.current = p?.length ? p : voicePathRef.current;
      if (p?.length) {
        setVoiceFilePath(p);
      }
      voiceElapsedRef.current = 0;
      setVoiceRecordingClock({
        startEpochMs: Date.now(),
        pausedTotalMs: 0,
        pauseEpochMs: null,
      });
      setVoiceUiPhase('recording');
      emitRecordingStatus(true);
    } catch {
      audioRecorderPlayer.removeRecordBackListener();
      setVoiceUiPhase('idle');
      setVoiceRecordingClock(null);
      emitRecordingStatus(false);
      Alert.alert(
        'Microphone',
        'Could not start recording. Check microphone permissions in Settings.',
      );
    }
  }, [
    voiceUiPhase,
    pendingImageAsset?.uri,
    sending,
    imageUploading,
    emitRecordingStatus,
  ]);

  const handleVoicePause = useCallback(() => {
    setVoiceRecordingClock(prev =>
      prev ? { ...prev, pauseEpochMs: Date.now() } : prev,
    );
    setVoiceUiPhase('paused');
    emitRecordingStatus(false);
    audioRecorderPlayer.pauseRecorder().catch(() => {
      Alert.alert('Recording', 'Could not pause recording.');
      setVoiceRecordingClock(prev =>
        prev?.pauseEpochMs != null
          ? { ...prev, pauseEpochMs: null }
          : prev,
      );
      setVoiceUiPhase('recording');
      emitRecordingStatus(true);
    });
  }, [emitRecordingStatus]);

  const handleVoiceResume = useCallback(() => {
    setVoiceRecordingClock(prev => {
      const pauseAt = prev?.pauseEpochMs;
      if (prev == null || pauseAt == null) {
        return prev;
      }
      return {
        startEpochMs: prev.startEpochMs,
        pausedTotalMs: prev.pausedTotalMs + Math.max(0, Date.now() - pauseAt),
        pauseEpochMs: null,
      };
    });
    setVoiceUiPhase('recording');
    emitRecordingStatus(true);
    audioRecorderPlayer.resumeRecorder().catch(() => {
      Alert.alert('Recording', 'Could not resume recording.');
    });
  }, [emitRecordingStatus]);

  const handleVoiceStopToPreview = useCallback(() => {
    const wallClockSec = Math.floor(
      recordingElapsedSecFromClock(voiceRecordingClock),
    );
    const durFromRefs = Math.max(1, voiceElapsedRef.current ?? 1, wallClockSec);

    audioRecorderPlayer.removeRecordBackListener();
    setVoiceRecordingClock(null);
    setVoicePreviewDurationSec(durFromRefs);
    setVoiceUiPhase('preview');
    emitRecordingStatus(false);

    (async () => {
      try {
        const path = await audioRecorderPlayer.stopRecorder();
        const finalPath =
          path?.trim?.() ||
          voicePathRef.current?.trim?.() ||
          voiceFilePath?.trim?.() ||
          '';
        if (finalPath?.length) {
          voicePathRef.current = finalPath;
          setVoiceFilePath(finalPath);
        }
        const nativeDur = Math.max(1, voiceElapsedRef.current ?? 1);
        setVoicePreviewDurationSec(prev =>
          Math.max(prev ?? 1, nativeDur, wallClockSec),
        );
      } catch {
        Alert.alert('Recording', 'Could not finish recording.');
        await resetVoiceSession(false);
      }
    })();
  }, [
    emitRecordingStatus,
    voiceFilePath,
    voiceRecordingClock,
    resetVoiceSession,
  ]);

  const handleDiscardVoicePreview = useCallback(async () => {
    await audioRecorderPlayer.stopPlayer().catch(() => { });
    audioRecorderPlayer.removeRecordBackListener();
    voicePathRef.current = null;
    setVoiceFilePath(null);
    setVoicePreviewDurationSec(0);
    setVoiceUiPhase('idle');
  }, []);

  const handleSendVoiceMessage = useCallback(async () => {
    const path =
      voicePathRef.current?.trim?.() ?? voiceFilePath?.trim?.() ?? '';
    if (!path?.length) {
      setVoiceUiPhase('idle');
      return;
    }
    const dur = Math.max(1, voicePreviewDurationSec || voiceElapsedRef.current || 1);
    const tempId = -Math.abs(Date.now());
    const optimisticMessage: Message = {
      id: tempId,
      content: path,
      createdAt: new Date().toISOString(),
      voiceDurationSec: dur,
      sender: {
        id: typeof currentUserId === 'number' ? currentUserId : 0,
        fullName: userDetails?.fullName ?? 'You',
        profileImage: userDetails?.profileImage ?? null,
      },
    };

    try {
      setSending(true);
      setVoiceUiPhase('idle');
      setVoiceFilePath(null);
      voicePathRef.current = null;
      setVoicePreviewDurationSec(0);
      setMessages(prev => [...prev, optimisticMessage]);
      setTimeout(() => scrollToBottom(), 100);

      const audioUrl = await uploadImageFromUri({
        uri: path,
        fileName: `voice-${Date.now()}.m4a`,
        mimeType: 'audio/mp4',
        kind: 'voice',
      });

      const response = await sendMessage(chatId, audioUrl);

      setMessages(prev => {
        const optimistic = prev.find(msg => msg.id === tempId);
        const filtered = prev.filter(msg => msg.id !== tempId);
        const responseExists = filtered.some(msg => msg.id === response?.id);
        if (!responseExists && response) {
          const merged = {
            ...response,
            voiceDurationSec:
              response?.voiceDurationSec ?? optimistic?.voiceDurationSec ?? dur,
          };
          return [...filtered, merged];
        }
        return filtered;
      });
    } catch (e: unknown) {
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      const msg =
        e instanceof Error ? e.message : 'Could not send voice message.';
      Alert.alert('Voice message', msg);
    } finally {
      setSending(false);
    }
  }, [
    voiceFilePath,
    voicePreviewDurationSec,
    currentUserId,
    userDetails?.fullName,
    userDetails?.profileImage,
    uploadImageFromUri,
    sendMessage,
    chatId,
  ]);

  const fetchMessages = useCallback(
    async (pageNum = 1) => {
      if (loadingRef.current) return;

      try {
        loadingRef.current = true;
        setLoading(true);

        const response = await getMessages(chatId, pageNum, 20);

        if (response && response.data) {
          const sortedMessages = response.data.reverse();

          if (pageNum === 1) {
            setMessages(sortedMessages);
            // Scroll after layout
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                scrollViewRef.current?.scrollToEnd?.({
                  animated: true,
                });
              });
            });
          } else {
            setMessages(prev => {
              const existingIds = new Set(prev.map(m => m?.id));
              const unique = sortedMessages.filter(
                (m: Message) => !existingIds.has(m?.id),
              );
              return [...unique, ...prev];
            });
          }

          setHasMore(response.data.length === 20);
        }
      } catch {
        Alert.alert('Error', 'Failed to load messages. Please try again.');
      } finally {
        setLoading(false);
        loadingRef.current = false;
        if (pageNum > 1) {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              isLoadingOlderRef.current = false;
            });
          });
        }
      }
    },
    [chatId, getMessages],
  );

  // Fetch initial messages
  useEffect(() => {
    if (initializedChatIdRef.current === chatId) return;
    initializedChatIdRef.current = chatId;

    const initialCount = initialMessages?.length ?? 0;

    // Reset pagination when chat changes
    setPage(1);

    if (initialCount > 0) {
      setMessages(initialMessages ?? []);
      setHasMore(initialCount === 20);

      // Let layout happen before scrolling
      requestAnimationFrame(() => {
        requestAnimationFrame(() => scrollToBottom?.());
      });
      return;
    }

    setMessages([]);
    setHasMore(true);
    fetchMessages(1);
  }, [chatId, initialMessages, fetchMessages]);

  // If `initialMessages` becomes available after mount, hydrate only when empty.
  useEffect(() => {
    const initialCount = initialMessages?.length ?? 0;
    if (initializedChatIdRef.current !== chatId) return;
    if (initialCount <= 0) return;
    if ((messages?.length ?? 0) > 0) return;

    setMessages(initialMessages ?? []);
    setHasMore(initialCount === 20);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => scrollToBottom?.());
    });
  }, [chatId, initialMessages, messages?.length]);

  const handleSendMessage = async () => {
    const messageContent = newMessage.trim();

    if (messageContent === '') {
      return;
    }

    if (sending) {
      return;
    }

    let optimisticId: number | null = null;

    try {
      setSending(true);
      setNewMessage('');

      optimisticId = -Math.abs(Date.now());
      const optimisticMessage: Message = {
        id: optimisticId,
        content: messageContent,
        createdAt: new Date().toISOString(),
        sender: {
          id: typeof currentUserId === 'number' ? currentUserId : 0,
          fullName: userDetails?.fullName ?? 'You',
          profileImage: userDetails?.profileImage ?? null,
        },
      };

      setMessages(prev => [...prev, optimisticMessage]);
      setTimeout(() => scrollToBottom(), 100);

      const response = await sendMessage(chatId, messageContent);

      setMessages(prev => {
        const filtered = prev.filter(msg => msg.id !== optimisticId);
        const responseExists = filtered.some(msg => msg.id === response?.id);
        if (!responseExists && response) {
          return [...filtered, response];
        }
        return filtered;
      });
    } catch {
      setNewMessage(messageContent);

      if (optimisticId != null) {
        setMessages(prev => prev.filter(msg => msg.id !== optimisticId));
      }

      Alert.alert('Error', 'Failed to send message. Please try again.', [
        { text: 'OK' },
      ]);
    } finally {
      setSending(false);
    }
  };

  /** Pick image and stage it for preview (no upload yet). */
  const handlePickImageForPreview = async () => {
    if (sending || imageUploading) {
      return;
    }
    if (voiceUiPhase !== 'idle') {
      Alert.alert(
        'Image',
        'Finish or cancel the voice recording before attaching an image.',
      );
      return;
    }

    const { asset, error } = await pickChatImageAsset();
    if (error) {
      Alert.alert('Image', error);
      return;
    }

    const uri = asset?.uri;
    if (!uri) {
      return;
    }

    const fileSize = asset?.fileSize ?? null;
    if (typeof fileSize === 'number' && fileSize > 5 * 1024 * 1024) {
      Alert.alert('Image too large', 'Please choose an image under 5MB.');
      return;
    }

    setPendingImageAsset(asset);
  };

  const handleCancelPendingImage = () => {
    setPendingImageAsset(null);
  };

  /** Upload staged image → sendMessage(chatId, public URL). */
  const handleSendPendingImage = async () => {
    const asset = pendingImageAsset;
    const uri = asset?.uri;
    if (!uri) {
      setPendingImageAsset(null);
      return;
    }

    const tempId = -Math.abs(Date.now());
    const optimisticMessage: Message = {
      id: tempId,
      content: uri,
      createdAt: new Date().toISOString(),
      sender: {
        id: typeof currentUserId === 'number' ? currentUserId : 0,
        fullName: userDetails?.fullName ?? 'You',
        profileImage: userDetails?.profileImage ?? null,
      },
    };

    try {
      setSending(true);
      setPendingImageAsset(null);
      setMessages(prev => [...prev, optimisticMessage]);
      setTimeout(() => scrollToBottom(), 100);

      const imageUrl = await uploadImageFromUri({
        uri,
        base64: asset?.base64,
        fileName: asset?.fileName,
        mimeType: asset?.type,
        fileSize: asset?.fileSize ?? null,
      });

      const response = await sendMessage(chatId, imageUrl);

      setMessages(prev => {
        const filtered = prev.filter(msg => msg.id !== tempId);
        const responseExists = filtered.some(msg => msg.id === response?.id);
        if (!responseExists && response) {
          return [...filtered, response];
        }
        return filtered;
      });
    } catch (e: unknown) {
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      const msg =
        e instanceof Error ? e.message : 'Could not send image. Try again.';
      Alert.alert('Image', msg);
    } finally {
      setSending(false);
    }
  };

  const handleSendFromBar = async () => {
    const hasPendingImage = pendingImageAsset?.uri != null;
    const hasText = (newMessage?.trim?.() ?? '').length > 0;

    if (sending || imageUploading) {
      return;
    }

    if (hasPendingImage) {
      await handleSendPendingImage();
    }

    if (hasText) {
      await handleSendMessage();
    }
  };

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  const handleLoadMore = () => {
    if (hasMore && !loading && !loadingRef.current) {
      isLoadingOlderRef.current = true;
      const nextPage = page + 1;
      setPage(nextPage);
      fetchMessages(nextPage);
    }
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getLastSeenText = (): string => {
    if (otherUserLive?.isOnline) {
      return 'Active now';
    }

    if (otherUserLive?.lastSeenAt) {
      const lastSeen = new Date(otherUserLive.lastSeenAt);
      const now = new Date();
      const diffInMinutes = Math.floor(
        (now.getTime() - lastSeen.getTime()) / 60000,
      );

      if (diffInMinutes < 1) return 'Active now';
      if (diffInMinutes < 60) return `Active ${diffInMinutes}m ago`;

      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) return `Active ${diffInHours}h ago`;

      const diffInDays = Math.floor(diffInHours / 24);
      return `Active ${diffInDays}d ago`;
    }

    return 'Offline';
  };

  const getProfileImage = (user: {
    profileImage: string | null;
    id: number;
  }): string => {
    if (user.profileImage) return user.profileImage;
    return `https://i.pravatar.cc/150?img=${user.id + 10}`;
  };

  const groupMessagesByDate = () => {
    const grouped: { [key: string]: Message[] } = {};
    const seen = new Set<number>();

    messages.forEach(message => {
      if (seen.has(message?.id)) return;
      seen.add(message?.id);
      const date = new Date(message.createdAt);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let dateKey: string;
      if (date.toDateString() === today.toDateString()) {
        dateKey = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        dateKey = 'Yesterday';
      } else {
        dateKey = date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      }

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(message);
    });

    return grouped;
  };

  const openImageViewer = useCallback((uri: string | null) => {
    const safeUri = uri?.trim?.() ?? '';
    if (!safeUri?.length) {
      return;
    }
    setImageViewer({ visible: true, uri: safeUri });
  }, []);

  const closeImageViewer = useCallback(() => {
    setImageViewer(prev => ({ ...prev, visible: false }));
  }, []);

  const renderMessage = (message: Message) => {
    const isMyMessage =
      typeof currentUserId === 'number' && message?.sender?.id === currentUserId;

    if (message?.isCallMessage) {
      return (
        <View
          key={message.id}
          className={`mb-4 ${isMyMessage ? 'items-end' : 'items-start'}`}
        >
          {!isMyMessage && (
            <View className="flex-row items-start mb-2">
              <Image
                source={{ uri: getProfileImage(message.sender) }}
                className="w-10 h-10 rounded-full mr-2"
              />
              <View className="flex-1 min-w-0 max-w-[92%]">
                <Text className="text-sm font-semibold mb-1 text-gray-900">
                  {message.sender.fullName || 'Unknown'}
                </Text>
                <CallMessageCard
                  message={message}
                  formatMessageTime={formatTime}
                />
              </View>
            </View>
          )}
          {isMyMessage && (
            <View className="flex-row items-start mb-2 justify-end">
              <View className="flex-1 min-w-0 max-w-[92%] items-end">
                <Text className="text-sm font-semibold mb-1 text-gray-900">
                  {message?.sender?.fullName || 'You'}
                </Text>
                <CallMessageCard
                  message={message}
                  formatMessageTime={formatTime}
                />
              </View>
              <Image
                source={{ uri: getProfileImage(message.sender) }}
                className="w-10 h-10 rounded-full ml-2"
              />
            </View>
          )}
        </View>
      );
    }

    const audioUri = getChatAudioDisplayUrl(message?.content);
    if (audioUri) {
      return (
        <View
          key={message.id}
          className={`mb-4 ${isMyMessage ? 'items-end' : 'items-start'}`}
        >
          {!isMyMessage && (
            <View className="flex-row items-start mb-2">
              <Image
                source={{ uri: getProfileImage(message.sender) }}
                className="w-10 h-10 rounded-full mr-2"
              />
              <View className="flex-1 min-w-0 max-w-[92%]">
                <Text className="text-sm font-semibold mb-1 text-gray-900">
                  {message.sender.fullName || 'Unknown'}
                </Text>
                <VoiceMessageBubble
                  audioUri={audioUri}
                  isMyMessage={false}
                  messageId={message.id}
                  initialDurationSec={message.voiceDurationSec ?? null}
                />
                <Text className="text-xs text-gray-400 mt-1">
                  {formatTime(message.createdAt)}
                </Text>
              </View>
            </View>
          )}
          {isMyMessage && (
            <View className="flex-row items-start mb-2 justify-end">
              <View className="flex-1 min-w-0 max-w-[92%] items-end">
                <Text className="text-sm font-semibold mb-1 text-gray-900">
                  {message?.sender?.fullName || 'You'}
                </Text>
                <VoiceMessageBubble
                  audioUri={audioUri}
                  isMyMessage
                  messageId={message.id}
                  initialDurationSec={message.voiceDurationSec ?? null}
                />
                <Text className="text-xs text-gray-400 mt-1">
                  {formatTime(message.createdAt)}
                </Text>
              </View>
              <Image
                source={{ uri: getProfileImage(message.sender) }}
                className="w-10 h-10 rounded-full ml-2"
              />
            </View>
          )}
        </View>
      );
    }

    const imageDisplayUrl = getChatImageDisplayUrl(message?.content);
    const showImage = imageDisplayUrl != null;
    const imageAspectRatio = showImage
      ? imageAspectRatios?.[imageDisplayUrl ?? '']
      : undefined;

    const bubbleContent = showImage ? (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => openImageViewer(imageDisplayUrl ?? null)}
      >
        <Image
          source={{ uri: imageDisplayUrl ?? '' }}
          className="rounded-xl"
          style={[styles.chatImage, { aspectRatio: imageAspectRatio ?? 1 }]}
          resizeMode="contain"
          onLoad={e => {
            const w = e?.nativeEvent?.source?.width;
            const h = e?.nativeEvent?.source?.height;
            if (!w || !h) {
              return;
            }
            const ratio = w / h;
            if (!Number.isFinite(ratio) || ratio <= 0) {
              return;
            }
            setImageAspectRatios(prev => {
              const key = imageDisplayUrl ?? '';
              if (!key) {
                return prev;
              }
              if (prev?.[key] === ratio) {
                return prev;
              }
              return { ...prev, [key]: ratio };
            });
          }}
        />
      </TouchableOpacity>
    ) : (
      <Text
        className={isMyMessage ? 'text-white' : 'text-gray-800'}
        selectable
      >
        {message.content}
      </Text>
    );

    return (
      <View
        key={message.id}
        className={`mb-4 ${isMyMessage ? 'items-end' : 'items-start'}`}
      >
        {!isMyMessage && (
          <View className="flex-row items-start mb-2">
            <Image
              source={{ uri: getProfileImage(message.sender) }}
              className="w-10 h-10 rounded-full mr-2"
            />
            <View>
              <Text className="text-sm font-semibold mb-1 text-gray-900">
                {message.sender.fullName || 'Unknown'}
              </Text>
              <View
                className={`bg-gray-100 rounded-2xl rounded-tl-sm max-w-[280px] ${showImage ? 'p-1 overflow-hidden' : 'px-4 py-3'
                  }`}
              >
                {bubbleContent}
              </View>
              <Text className="text-xs text-gray-400 mt-1">
                {formatTime(message.createdAt)}
              </Text>
            </View>
          </View>
        )}

        {isMyMessage && (
          <View className="flex-row items-start mb-2 justify-end">
            <View className="items-end">
              <Text className="text-sm font-semibold mb-1 text-gray-900">
                {message?.sender?.fullName || 'You'}
              </Text>
              <View
                className={`bg-purple-600 rounded-2xl rounded-tr-sm max-w-[280px] ${showImage ? 'p-1 overflow-hidden' : 'px-4 py-3'
                  }`}
              >
                {bubbleContent}
              </View>
              <Text className="text-xs text-gray-400 mt-1">
                {formatTime(message.createdAt)}
              </Text>
            </View>
            <Image
              source={{ uri: getProfileImage(message.sender) }}
              className="w-10 h-10 rounded-full ml-2"
            />
          </View>
        )}
      </View>
    );
  };

  const renderDateSeparator = (date: string) => (
    <View key={`date-${date}`} className="items-center my-4">
      <View className="bg-gray-200 rounded-full px-4 py-2">
        <Text className="text-xs text-gray-600 font-medium">{date}</Text>
      </View>
    </View>
  );

  const renderMessagesWithDates = () => {
    const grouped = groupMessagesByDate();
    const elements: React.ReactElement[] = [];

    Object.keys(grouped).forEach(date => {
      elements.push(renderDateSeparator(date));
      grouped[date].forEach(message => {
        elements.push(renderMessage(message));
      });
    });

    return elements;
  };

  const generateRoomName = (fromId: number, toId: number): string => {
    const a = Number(fromId);
    const b = Number(toId);
    return a < b ? `${a}_${b}` : `${b}_${a}`;
  };

  const startCall = async (callType: 'audio' | 'video') => {
    if (typeof currentUserId !== 'number' || !otherUser || !userDetails) {
      return;
    }

    try {
      // Check if the user has the required audio permissions
      const hasAudio = await ensureAudioPermission();
      // If the user doesn't have the required audio permissions, show an alert and return
      if (!hasAudio) {
        Alert.alert('Permission', 'Microphone permission is required for calls.');
        return;
      }

      // If the call type is video, check if the user has the required video permissions
      if (callType === 'video') {
        const hasVideo = await ensureVideoPermission();
        // If the user doesn't have the required video permissions, show an alert and return
        if (!hasVideo) {
          Alert.alert('Permission', 'Camera permission is required for video calls.');
          return;
        }
      }

      const socket = callSocket ?? (await ensureCallSocketConnected());
      if (!socket?.connected) {
        Alert.alert('Call error', 'Call service is not connected. Please try again.');
        return;
      }
      const fromId = currentUserId;
      const toId = otherUser.id;
      if (!fromId || !toId) {
        Alert.alert('Call error', 'Unable to start call: missing user info.');
        return;
      }
      const roomName = generateRoomName(fromId, toId);
      const callerName = userDetails.fullName ?? '';
      const callerProfileImage = userDetails.profileImage ?? '';
      const calleeName = otherUser.fullName ?? otherUser.phoneNumber;
      const calleeProfileImage = otherUser.profileImage ?? '';

      socket.emit?.('callUser', {
        from: String(fromId),
        to: String(toId),
        callerName,
        callerProfileImage,
        calleeProfileImage,
        calleeName,
        roomName,
        startTime: new Date(),
        callLogId: null,
        callType,
      });

      navigation?.navigate?.('CallScreen', {
        callPayload: {
          from: String(fromId ?? ''),
          to: String(toId ?? ''),
          callerName,
          callerProfileImage,
          calleeName,
          calleeProfileImage,
          roomName,
          startTime: new Date(),
          callLogId: null,
          callType,
        },
        answerIncoming: false,
      });
    } catch {
      Alert.alert(
        'Call error',
        'Unable to start the call right now. Please try again.',
      );
    }
  };

  const [outgoingConsentVisible, setOutgoingConsentVisible] = useState(false);
  const [outgoingConsentType, setOutgoingConsentType] = useState<
    'audio' | 'video' | null
  >(null);

  const requestStartCall = (type: 'audio' | 'video') => {
    setOutgoingConsentType(type);
    setOutgoingConsentVisible(true);
  };

  const declineOutgoingConsent = () => {
    setOutgoingConsentVisible(false);
    setOutgoingConsentType(null);
  };

  const acceptOutgoingConsent = async () => {
    const type = outgoingConsentType ?? 'audio';
    setOutgoingConsentVisible(false);
    setOutgoingConsentType(null);
    await startCall(type);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1 bg-white"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={
          Platform.OS === 'ios'
            ? Math.max(0, headerHeight + (insets?.top ?? 0))
            : 0
        }
        onLayout={e => {
          const h = e?.nativeEvent?.layout?.height ?? 0;
          if (Number.isFinite(h) && h > 0) {
            rootLayoutHeightRef.current = h;
          }
        }}
      >
        {/* Header */}
        <View
          className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-100"
          onLayout={e => {
            const h = e?.nativeEvent?.layout?.height ?? 0;
            if (Number.isFinite(h) && h > 0 && h !== headerHeight) {
              setHeaderHeight(h);
            }
          }}
        >
          <View className="flex-row items-center flex-1">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.goBack()}
            >
              <Image
                source={require('../assets/Badges Arrow.png')}
                className="w-10 h-10"
                resizeMode="contain"
              />
            </TouchableOpacity>

            <View className="relative">
              <Image
                source={{
                  uri: getProfileImage(
                    otherUserLive || { profileImage: null, id: 0 },
                  ),
                }}
                className="w-12 h-12 rounded-full mr-3"
              />
              {otherUserLive?.isOnline && (
                <View className="absolute right-3 bottom-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
              )}
            </View>

            <View className="flex-1">
              <Text className="text-lg font-bold">
                {otherUserLive?.fullName ||
                  otherUserLive?.phoneNumber ||
                  'Unknown'}
              </Text>
              <Text className="text-sm text-gray-500">{getLastSeenText()}</Text>
            </View>
          </View>

          <View className="flex-row">
            <TouchableOpacity
              className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mr-2"
              onPress={() => requestStartCall('video')}
            >
              <Video size={20} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity
              className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
              onPress={() => requestStartCall('audio')}
            >
              <Phone size={20} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        {(recordingUsers?.length ?? 0) > 0 && (
          <View className="bg-violet-50 px-4 py-2 border-b border-violet-100">
            <Text className="text-sm text-violet-900">
              {recordingUsers.map(u => u?.fullName ?? 'Someone').join(', ')}
              {(recordingUsers?.length ?? 0) === 1
                ? ' is recording…'
                : ' are recording…'}
            </Text>
          </View>
        )}

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 px-4 py-4 mb-1"
          showsVerticalScrollIndicator={false}
          onContentSizeChange={(_w, h) => {
            if (isLoadingOlderRef.current) {
              const delta = h - contentHeightRef.current;
              contentHeightRef.current = h;
              if (delta > 0) {
                scrollOffsetRef.current += delta;
                scrollViewRef.current?.scrollTo({
                  y: scrollOffsetRef.current,
                  animated: false,
                });
              }
              return;
            }
            const prevHeight = contentHeightRef.current;
            contentHeightRef.current = h;
            const phase = voiceUiPhaseRef.current;
            if (phase === 'recording' || phase === 'paused') {
              return;
            }
            const distanceFromBottom =
              prevHeight - scrollOffsetRef.current - viewportHeightRef.current;
            if (prevHeight === 0 || distanceFromBottom < 150) {
              scrollToBottom();
            }
          }}
          onScroll={(e) => {
            scrollOffsetRef.current = e?.nativeEvent?.contentOffset?.y ?? 0;
          }}
          onLayout={(e) => {
            viewportHeightRef.current = e?.nativeEvent?.layout?.height ?? 0;
          }}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
        >
          {loading && page === 1 ? (
            <View className="flex-1 items-center justify-center py-8">
              <ActivityIndicator size="large" color="#9333ea" />
            </View>
          ) : (
            <>
              {hasMore && (
                <TouchableOpacity
                  onPress={handleLoadMore}
                  className="items-center py-2 mb-4"
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#9333ea" />
                  ) : (
                    <Text className="text-purple-600 text-sm">
                      Load more messages
                    </Text>
                  )}
                </TouchableOpacity>
              )}
              {(messages?.length ?? 0) === 0 ? (
                <View className="flex-1 items-center justify-center py-12">
                  <Text className="text-[#092724] text-xl font-semibold">
                    No messages yet
                  </Text>
                  <Text className="text-gray-400 text-sm mt-2 text-center">
                    Send a message to start the conversation.
                  </Text>
                </View>
              ) : (
                renderMessagesWithDates()
              )}
            </>
          )}
        </ScrollView>

        <Modal
          visible={imageViewer?.visible ?? false}
          transparent
          animationType="fade"
          onRequestClose={closeImageViewer}
        >
          <View style={styles.viewerBackdrop}>
            <TouchableOpacity
              activeOpacity={1}
              style={styles.viewerBackdropPressable}
              onPress={closeImageViewer}
            />

            <View style={styles.viewerContent}>
              <TouchableOpacity
                onPress={closeImageViewer}
                activeOpacity={0.8}
                style={styles.viewerCloseButton}
              >
                <X size={24} color="#fff" />
              </TouchableOpacity>

              <Image
                source={{ uri: imageViewer?.uri ?? '' }}
                style={styles.viewerImage}
                resizeMode="contain"
              />
            </View>
          </View>
        </Modal>

        <View
          style={{
            paddingBottom:
              Math.max(0, (insets?.bottom ?? 0) - 16) +
              (Platform.OS === 'android' && applyAndroidKeyboardOffset
                ? androidKeyboardHeight
                : 0),
          }}
        >
          <ChatMessageBar
            value={newMessage}
            onChangeText={setNewMessage}
            onSend={handleSendFromBar}
            sending={sending}
            imageUploading={imageUploading}
            onImagePress={handlePickImageForPreview}
            pendingImageUri={pendingImageAsset?.uri ?? null}
            onCancelImage={handleCancelPendingImage}
            onMicPress={handleMicPress}
            micDisabled={sending || imageUploading}
            voiceMode={
              voiceUiPhase === 'preview'
                ? 'preview'
                : voiceUiPhase === 'paused'
                  ? 'paused'
                  : voiceUiPhase === 'recording'
                    ? 'recording'
                    : 'none'
            }
            voiceRecordingClock={voiceRecordingClock}
            voicePreviewDurationSec={voicePreviewDurationSec}
            onVoicePause={handleVoicePause}
            onVoiceResume={handleVoiceResume}
            onVoiceStop={handleVoiceStopToPreview}
            onVoiceDiscardPreview={handleDiscardVoicePreview}
            onVoiceSendPreview={handleSendVoiceMessage}
            scrollToBottom={scrollToBottom}
          />
        </View>

        <OutgoingCallConsentModal
          visible={outgoingConsentVisible}
          callType={outgoingConsentType ?? 'audio'}
          calleeName={
            otherUserLive?.fullName?.trim?.() ||
            otherUserLive?.phoneNumber?.trim?.() ||
            otherUser?.fullName?.trim?.() ||
            otherUser?.phoneNumber?.trim?.() ||
            'Contact'
          }
          calleeProfileImage={
            otherUserLive?.profileImage ?? otherUser?.profileImage ?? null
          }
          onAccept={acceptOutgoingConsent}
          onDecline={declineOutgoingConsent}
        />
        {/* <SocketDebugOverlay chatId={chatId} /> */}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  chatImage: {
    width: 260,
    maxWidth: '100%',
    maxHeight: 320,
    backgroundColor: '#f3f4f6',
  },
  viewerBackdrop: {
    flex: 1,
    backgroundColor: '#000',
  },
  viewerBackdropPressable: {
    ...StyleSheet.absoluteFillObject,
  },
  viewerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  viewerImage: {
    width: '100%',
    height: '100%',
  },
});

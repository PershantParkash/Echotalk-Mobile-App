import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  Modal,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { Video, Phone, X } from 'lucide-react-native';
import useChatsService from '../services/chat';
import ChatSocketSingleton from '../utils/sockets/chat-socket';
// import SocketDebugOverlay from '../components/SocketDebugOverlay';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { SafeAreaView } from 'react-native-safe-area-context';
import ChatMessageBar from '../components/chat/ChatMessageBar';
import useS3Upload from '../hooks/useS3Upload';
import { pickChatImageAsset } from '../utils/chatImagePicker';
import type { Asset } from 'react-native-image-picker';
import {
  getChatImageDisplayUrl,
  mergeIncomingSocketMessage,
} from '../utils/chatMessages';

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

  const { uploadImageFromUri, loading: imageUploading } = useS3Upload();

  const scrollViewRef = useRef<ScrollView>(null);
  const loadingRef = useRef(false);
  const socketRef = useRef<any>(null);
  const initializedChatIdRef = useRef<number | null>(null);

  const { getMessages, sendMessage } = useChatsService();

  // Get the other user in the conversation
  const otherUser =
    typeof currentUserId === 'number'
      ? chat?.users?.find?.(user => user?.id !== currentUserId)
      : chat?.users?.length === 1
        ? chat?.users?.[0]
        : undefined;

  // WebSocket connection effect
  // WebSocket connection effect
  useEffect(() => {
    // console.log('🔌 Setting up WebSocket connection for chat:', chatId);

    const initializeSocket = async () => {
      try {
        const socket = await ChatSocketSingleton.connect();
        socketRef.current = socket;

        socket.on('connect', () => {
          // console.log('✅ Mobile chat connected:', socket.id);
          // Join this specific chat room
          socket.emit('joinAllChats', [chatId]);
        });

        // Listen for new messages (same server event as web chat-and-talk-frontend)
        socket.on('newMessage', (message: any) => {
          if (message?.chat?.id !== chatId) {
            return;
          }
          setMessages(prev =>
            mergeIncomingSocketMessage<Message>(prev, message),
          );
          setTimeout(() => scrollToBottom(), 100);
        });

        socket.on('disconnect', () => {
          // console.log('❌ Socket disconnected');
        });

        socket.on('error', (_error: any) => {
          // console.error('❌ Socket error:', error);
        });
      } catch {
        // console.error('Failed to initialize socket:', error);
        Alert.alert(
          'Connection Error',
          'Failed to connect to chat. Please try again.',
        );
      }
    };

    initializeSocket();

    // Cleanup on unmount
    return () => {
      // console.log('🔌 Cleaning up socket connection');
      if (socketRef.current) {
        socketRef.current.off('newMessage');
        socketRef.current.off('connect');
        socketRef.current.off('disconnect');
        socketRef.current.off('error');
      }
      ChatSocketSingleton.disconnect();
    };
  }, [chatId, currentUserId]);

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
            setMessages(prev => [...sortedMessages, ...prev]);
          }

          setHasMore(response.data.length === 20);
        }
      } catch {
        Alert.alert('Error', 'Failed to load messages. Please try again.');
      } finally {
        setLoading(false);
        loadingRef.current = false;
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
      // console.log('Message is empty, not sending');
      return;
    }

    if (sending) {
      // console.log('Already sending a message');
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
    if (otherUser?.isOnline) {
      return 'Active now';
    }

    if (otherUser?.lastSeenAt) {
      const lastSeen = new Date(otherUser.lastSeenAt);
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

    messages.forEach(message => {
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
              <Text className="text-sm font-semibold mb-1">
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
          <View className="items-end">
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

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1 bg-white"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
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
                    otherUser || { profileImage: null, id: 0 },
                  ),
                }}
                className="w-12 h-12 rounded-full mr-3"
              />
              {otherUser?.isOnline && (
                <View className="absolute right-3 bottom-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
              )}
            </View>

            <View className="flex-1">
              <Text className="text-lg font-bold">
                {otherUser?.fullName || otherUser?.phoneNumber || 'Unknown'}
              </Text>
              <Text className="text-sm text-gray-500">{getLastSeenText()}</Text>
            </View>
          </View>

          <View className="flex-row">
            <TouchableOpacity className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mr-2">
              <Video size={20} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center">
              <Phone size={20} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 px-4 py-4"
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollToBottom()}
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

        <ChatMessageBar
          value={newMessage}
          onChangeText={setNewMessage}
          onSend={handleSendFromBar}
          sending={sending}
          imageUploading={imageUploading}
          onImagePress={handlePickImageForPreview}
          pendingImageUri={pendingImageAsset?.uri ?? null}
          onCancelImage={handleCancelPendingImage}
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

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  ChevronLeft,
  Video,
  Phone,
  Paperclip,
  Camera,
  Mic,
  Send,
} from 'lucide-react-native';
import useChatsService from '../services/chat';
import ChatSocketSingleton from '../utils/sockets/chat-socket';
import SocketDebugOverlay from '../components/SocketDebugOverlay';

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
    };
  };
  navigation: any;
  currentUserId?: number;
}

const ChatScreen: React.FC<ChatScreenProps> = ({
  route,
  navigation,
  currentUserId = 1,
}) => {
  const { chatId, chat } = route.params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const loadingRef = useRef(false);
  const socketRef = useRef<any>(null);

  const { getMessages, sendMessage } = useChatsService();

  // Get the other user in the conversation
  const otherUser = chat.users.find(user => user.id !== currentUserId);

  // WebSocket connection effect
  // WebSocket connection effect
  useEffect(() => {
    console.log('🔌 Setting up WebSocket connection for chat:', chatId);

    const initializeSocket = async () => {
      try {
        const socket = await ChatSocketSingleton.connect();
        socketRef.current = socket;

        socket.on('connect', () => {
          console.log('✅ Mobile chat connected:', socket.id);
          // Join this specific chat room
          socket.emit('joinAllChats', [chatId]);
        });

        // Listen for new messages
        socket.on('newMessage', (message: any) => {
          console.log('📨 New message received:', message);

          // Only update if the message is for this chat
          if (message.chat.id === chatId) {
            // Don't add if it's from current user (already added optimistically)
            if (message.sender.id !== currentUserId) {
              setMessages(prev => {
                // Check if message already exists to prevent duplicates
                const messageExists = prev.some(msg => msg.id === message.id);
                if (messageExists) {
                  return prev;
                }
                return [...prev, message];
              });
              setTimeout(() => scrollToBottom(), 100);
            }
          }
        });

        socket.on('disconnect', () => {
          console.log('❌ Socket disconnected');
        });

        socket.on('error', (error: any) => {
          console.error('❌ Socket error:', error);
        });
      } catch (error) {
        console.error('Failed to initialize socket:', error);
        Alert.alert(
          'Connection Error',
          'Failed to connect to chat. Please try again.',
        );
      }
    };

    initializeSocket();

    // Cleanup on unmount
    return () => {
      console.log('🔌 Cleaning up socket connection');
      if (socketRef.current) {
        socketRef.current.off('newMessage');
        socketRef.current.off('connect');
        socketRef.current.off('disconnect');
        socketRef.current.off('error');
      }
      ChatSocketSingleton.disconnect();
    };
  }, [chatId, currentUserId]);

  // Fetch initial messages
  useEffect(() => {
    fetchMessages();
  }, [chatId]);

  const fetchMessages = async (pageNum = 1) => {
    if (loadingRef.current) return;

    try {
      loadingRef.current = true;
      setLoading(true);

      console.log('Fetching messages for chat:', chatId, 'page:', pageNum);
      const response = await getMessages(chatId, pageNum, 20);

      console.log('Messages response:', response);

      if (response && response.data) {
        const sortedMessages = response.data.reverse();

        if (pageNum === 1) {
          setMessages(sortedMessages);
          setTimeout(() => scrollToBottom(), 100);
        } else {
          setMessages(prev => [...sortedMessages, ...prev]);
        }

        setHasMore(response.data.length === 20);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      Alert.alert('Error', 'Failed to load messages. Please try again.');
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  const handleSendMessage = async () => {
    const messageContent = newMessage.trim();

    if (messageContent === '') {
      console.log('Message is empty, not sending');
      return;
    }

    if (sending) {
      console.log('Already sending a message');
      return;
    }

    try {
      setSending(true);
      console.log('Sending message:', messageContent);

      // Clear input immediately for better UX
      setNewMessage('');

      // Optimistically add message to UI
      const optimisticMessage: Message = {
        id: Date.now(),
        content: messageContent,
        createdAt: new Date().toISOString(),
        sender: {
          id: currentUserId,
          fullName: 'You',
          profileImage: null,
        },
      };

      setMessages(prev => [...prev, optimisticMessage]);
      setTimeout(() => scrollToBottom(), 100);

      // Send message to server
      const response = await sendMessage(chatId, messageContent);
      console.log('Send message response:', response);

      // Remove optimistic message and add the real one from server
      setMessages(prev => {
        const filtered = prev.filter(msg => msg.id !== optimisticMessage.id);
        // Check if the response message is already in the list
        const responseExists = filtered.some(msg => msg.id === response.id);
        if (!responseExists && response) {
          return [...filtered, response];
        }
        return filtered;
      });
    } catch (error) {
      console.error('Error sending message:', error);

      // Restore the message to input on error
      setNewMessage(messageContent);

      // Remove optimistic message
      setMessages(prev => prev.filter(msg => msg.id !== Date.now()));

      Alert.alert('Error', 'Failed to send message. Please try again.', [
        { text: 'OK' },
      ]);
    } finally {
      setSending(false);
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

  const renderMessage = (message: Message) => {
    const isMyMessage = message.sender.id === currentUserId;

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
              <View className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[280px]">
                <Text className="text-gray-800">{message.content}</Text>
              </View>
              <Text className="text-xs text-gray-400 mt-1">
                {formatTime(message.createdAt)}
              </Text>
            </View>
          </View>
        )}

        {isMyMessage && (
          <View className="items-end">
            <View className="bg-purple-600 rounded-2xl rounded-tr-sm px-4 py-3 max-w-[280px]">
              <Text className="text-white">{message.content}</Text>
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
    const elements: JSX.Element[] = [];

    Object.keys(grouped).forEach(date => {
      elements.push(renderDateSeparator(date));
      grouped[date].forEach(message => {
        elements.push(renderMessage(message));
      });
    });

    return elements;
  };

  return (
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
            {renderMessagesWithDates()}
          </>
        )}
      </ScrollView>

      {/* Input Area */}
      <View className="px-4 pb-4 pt-2 bg-white border-t border-gray-100">
        <View className="flex-row items-center bg-gray-50 rounded-full px-4 py-2">
          <TouchableOpacity className="mr-3">
            <Paperclip size={22} color="#6b7280" />
          </TouchableOpacity>

          <TextInput
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Write your message"
            placeholderTextColor="#9ca3af"
            className="flex-1 text-base py-2"
            multiline
            maxLength={1000}
            onSubmitEditing={handleSendMessage}
            editable={!sending}
            returnKeyType="send"
            blurOnSubmit={false}
          />

          <TouchableOpacity className="mx-3">
            <Camera size={22} color="#6b7280" />
          </TouchableOpacity>

          {newMessage.trim() ? (
            <TouchableOpacity
              onPress={handleSendMessage}
              className="w-10 h-10 bg-purple-600 rounded-full items-center justify-center"
              disabled={sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Send size={18} color="#fff" />
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity className="w-10 h-10 bg-purple-600 rounded-full items-center justify-center">
              <Mic size={18} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      <SocketDebugOverlay chatId={chatId} />
    </KeyboardAvoidingView>
  );
};

export default ChatScreen;

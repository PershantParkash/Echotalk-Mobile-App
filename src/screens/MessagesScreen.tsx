import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ChevronLeft, UserPlus } from 'lucide-react-native';
import useChatsService from "../services/chat";

interface ChatUser {
  id: number;
  fullName: string | null;
  email: string | null;
  phoneNumber: string;
  profileImage: string | null;
  contactName: { name: string } | null;
  isOnline: boolean;
}

interface LastMessage {
  id: number;
  content: string;
  createdAt: string;
  sender: {
    id: number;
    fullName: string | null;
  };
}

interface Chat {
  id: number;
  type: string;
  createdAt: string;
  updatedAt: string;
  lastMessage: LastMessage | null;
  users: ChatUser[];
}

interface MessagesScreenProps {
  navigation?: any;
  currentUserId?: number;
}

const MessagesScreen: React.FC<MessagesScreenProps> = ({ 
  navigation, 
  currentUserId = 1 
}) => {
  // All hooks must be at the top level - this is critical!
  const [conversations, setConversations] = useState<Chat[]>([]);
  const [onlineContacts, setOnlineContacts] = useState<ChatUser[]>([]);

  const {
    getChats,
    loading: chatsLoading,
  } = useChatsService();

  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    try {
      const chats = await getChats();
      setConversations(chats);

      // Extract online contacts from all chats (excluding current user)
      const allUsers = chats.flatMap((chat: Chat) => chat.users);
      const uniqueOnlineUsers = allUsers
        .filter((user: ChatUser) => user.id !== currentUserId && user.isOnline)
        .filter((user: ChatUser, index: number, self: ChatUser[]) => 
          self.findIndex(u => u.id === user.id) === index
        )
        .slice(0, 5); // Limit to 5 contacts
      
      setOnlineContacts(uniqueOnlineUsers);
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  };

  // Helper function to get the other user in a conversation
  const getOtherUser = (chat: Chat): ChatUser | null => {
    return chat.users.find(user => user.id !== currentUserId) || null;
  };

  // Helper function to format time
  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      // Show time for messages from today
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else if (diffInHours < 168) {
      // Show day of week for messages within a week
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      // Show date for older messages
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  // Helper function to get display name
  const getDisplayName = (user: ChatUser): string => {
    if (user.contactName?.name) return user.contactName.name;
    if (user.fullName) return user.fullName;
    return user.phoneNumber;
  };

  // Helper function to get profile image
  const getProfileImage = (user: ChatUser): string => {
    if (user.profileImage) return user.profileImage;
    // Generate a random avatar based on user ID
    return `https://i.pravatar.cc/150?img=${user.id + 10}`;
  };

  const handleChatPress = (chat: Chat) => {
    // Navigate to chat detail screen
    if (navigation?.navigate) {
      navigation.navigate('ChatScreen', { 
        chatId: chat.id,
        chat: chat 
      });
    }
    console.log('Selected chat:', chat.id);
  };

  const handleContactPress = (contact: ChatUser) => {
    // Navigate to or create chat with this contact
    console.log('Selected contact:', contact.id);
  };

  if (chatsLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row justify-between items-center px-6 py-4">
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
        <Text className="text-3xl font-bold">Messages</Text>
        <TouchableOpacity className="w-12 h-12 rounded-full bg-gray-100 items-center justify-center">
          <UserPlus size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Online Contacts Section */}
        {onlineContacts.length > 0 && (
          <View className="px-6 py-4">
            <Text className="text-2xl font-bold mb-4">Online Contacts</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-2">
              {onlineContacts.map((contact) => (
                <TouchableOpacity 
                  key={contact.id} 
                  className="items-center mx-2"
                  onPress={() => handleContactPress(contact)}
                >
                  <View className="relative">
                    <Image
                      source={{ uri: getProfileImage(contact) }}
                      className="w-16 h-16 rounded-full"
                    />
                    <View className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                  </View>
                  <Text className="text-sm mt-2 font-medium" numberOfLines={1}>
                    {getDisplayName(contact).split(' ')[0]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Messages List */}
        <View className="px-6 py-2">
          {conversations.length === 0 ? (
            <View className="items-center justify-center py-12">
              <Text className="text-gray-400 text-lg">No conversations yet</Text>
              <Text className="text-gray-400 text-sm mt-2">Start chatting with your contacts</Text>
            </View>
          ) : (
            conversations.map((chat) => {
              const otherUser = getOtherUser(chat);
              if (!otherUser) return null;

              return (
                <TouchableOpacity
                  key={chat.id}
                  className="flex-row items-center py-4 border-b border-gray-100"
                  onPress={() => handleChatPress(chat)}
                >
                  <View className="relative mr-4">
                    <Image
                      source={{ uri: getProfileImage(otherUser) }}
                      className="w-16 h-16 rounded-full"
                    />
                    {otherUser.isOnline && (
                      <View className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                    )}
                  </View>
                  <View className="flex-1">
                    <View className="flex-row justify-between items-start mb-1">
                      <Text className="text-lg font-bold" numberOfLines={1}>
                        {getDisplayName(otherUser)}
                      </Text>
                      {chat.lastMessage && (
                        <Text className="text-sm text-gray-500">
                          {formatTime(chat.lastMessage.createdAt)}
                        </Text>
                      )}
                    </View>
                    <Text className="text-gray-500 text-base" numberOfLines={1}>
                      {chat.lastMessage?.content || 'No messages yet'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default MessagesScreen;
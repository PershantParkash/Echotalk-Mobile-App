import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
  Animated,
  Dimensions,
  StyleSheet,
  RefreshControl,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import useChatsService from "../services/chat";
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import Contacts from 'react-native-contacts';
import NewContactModal from '../components/chat/NewContactModal';
import ContactsDrawer from '../components/chat/ContactsDrawer';
import useContactsService from '../services/contacts';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

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
}

type ContactsPermissionStatus =
  | 'authorized'
  | 'denied'
  | 'limited'
  | 'undefined'
  | 'unavailable';

type PhoneContactItem = {
  recordID: string;
  name: string;
  phoneNumber: string | null;
  userId?: string | number | null;
};

const normalizeChatMessages = (messages: unknown): any[] => {
  const rawList = Array.isArray(messages) ? messages : [];
  return rawList?.slice?.()?.reverse?.() ?? [];
};

const findExistingConversation = <T extends { users?: { id?: any }[] | null }>(
  chats: T[],
  contactId: string | number,
): T | undefined => {
  return chats?.find?.((conversation) =>
    conversation?.users?.some?.(
      (user) => String(user?.id ?? '') === String(contactId ?? ''),
    ),
  );
};

const shouldInitiateChatFromContact = (contact: PhoneContactItem): boolean => {
  return Boolean(contact?.userId != null && `${contact?.userId}`?.trim?.() !== '');
};

const shouldBlockDuplicateInitiation = (isInitiating: boolean): boolean => {
  return Boolean(isInitiating);
};

const MessagesScreen: React.FC<MessagesScreenProps> = ({
  navigation,
}) => {
  // All hooks must be at the top level - this is critical!
  const [conversations, setConversations] = useState<Chat[]>([]);
  const [onlineContacts, setOnlineContacts] = useState<ChatUser[]>([]);
  const [isInitiatingChat, setIsInitiatingChat] = useState(false);
  const latestInitiationTokenRef = useRef(0);
  const [refreshingConversations, setRefreshingConversations] = useState(false);
  const [initialChatsLoadDone, setInitialChatsLoadDone] = useState(false);
  const wasPullingPastBottomRef = useRef(false);
  const lastBottomRefreshAtRef = useRef(0);

  const [contactsDeniedOnce, setContactsDeniedOnce] = useState(false);
  const [phoneContacts, setPhoneContacts] = useState<PhoneContactItem[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [isContactsDrawerVisible, setIsContactsDrawerVisible] = useState(false);
  const [savedContactsRefreshToken, setSavedContactsRefreshToken] = useState(0);
  const { createContact } = useContactsService();

  const [contactsSearchQuery, setContactsSearchQuery] = useState('');
  const [isAddContactModalVisible, setIsAddContactModalVisible] = useState(false);
  const [newContactFirstName, setNewContactFirstName] = useState('');
  const [newContactLastName, setNewContactLastName] = useState('');
  const [newContactCountryCode, setNewContactCountryCode] = useState('');
  const [newContactPhoneNumber, setNewContactPhoneNumber] = useState('');

  const drawerHeight = useMemo(
    () => Math.round(Dimensions.get('window')?.height * 0.8),
    []
  );
  const drawerTranslateY = useRef(new Animated.Value(drawerHeight)).current;
  const filteredPhoneContacts = (() => {
    const query = contactsSearchQuery?.trim?.()?.toLowerCase?.() ?? '';
    if (!query) return phoneContacts ?? [];

    return (
      phoneContacts?.filter((c) => {
        const name = c?.name?.toLowerCase?.() ?? '';
        const phone = c?.phoneNumber?.toLowerCase?.() ?? '';
        return name?.includes?.(query) || phone?.includes?.(query);
      }) ?? []
    );
  })();

  const {
    getChats,
    createIndividualChat,
    getMessages,
    loading: chatsLoading,
  } = useChatsService();
  const { userDetails } = useSelector((state: RootState) => state.user);
  const currentUserId = userDetails?.id;

  useEffect(() => {
    fetchChats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchChats = async () => {
    try {
      const chats = await getChats();
      setConversations(chats ?? []);

      // Extract online contacts from all chats (excluding current user)
      const allUsers = (chats ?? [])?.flatMap?.((chat: Chat) => chat?.users ?? []) ?? [];
      const uniqueOnlineUsers = allUsers
        .filter((user: ChatUser) => {
          if (typeof currentUserId === 'number') {
            return user?.id !== currentUserId && user?.isOnline;
          }
          return user?.isOnline;
        })
        .filter((user: ChatUser, index: number, self: ChatUser[]) =>
          self.findIndex(u => u.id === user.id) === index
        )
        .slice(0, 5); // Limit to 5 contacts

      setOnlineContacts(uniqueOnlineUsers);
    } catch {
      // console.error('Error fetching chats:', error);
    } finally {
      setInitialChatsLoadDone(true);
    }
  };

  const onPullDownRefresh = async () => {
    setRefreshingConversations(true);
    try {
      await fetchChats?.();
    } finally {
      setRefreshingConversations(false);
    }
  };

  const handleScrollBottomReload = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    const { contentOffset, contentSize, layoutMeasurement } =
      event?.nativeEvent ?? {};
    const layoutH = layoutMeasurement?.height ?? 0;
    const offsetY = contentOffset?.y ?? 0;
    const contentH = contentSize?.height ?? 0;
    if (layoutH <= 0 || contentH <= 0) return;

    const maxY = Math.max(0, contentH - layoutH);
    const pullPastBottom = offsetY - maxY;
    const overscrollThreshold = 56;
    const pullingPastBottom = pullPastBottom > overscrollThreshold;

    if (
      pullingPastBottom &&
      !wasPullingPastBottomRef.current &&
      !refreshingConversations &&
      !chatsLoading
    ) {
      const now = Date.now?.() ?? 0;
      if (now - (lastBottomRefreshAtRef.current ?? 0) > 1500) {
        lastBottomRefreshAtRef.current = now;
        void onPullDownRefresh?.();
      }
    }
    wasPullingPastBottomRef.current = pullingPastBottom;
  };

  // Helper function to get the other user in a conversation
  const getOtherUser = (chat: Chat): ChatUser | null => {
    if (typeof currentUserId === 'number') {
      return chat?.users?.find?.(user => user?.id !== currentUserId) || null;
    }

    return chat?.users?.length === 1 ? (chat?.users?.[0] ?? null) : null;
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
        chat: chat,
        currentUserId,
      });
    }
    // console.log('Selected chat:', chat.id);
  };

  const openSelectedChat = (chat: Chat, initialMessages: any[]) => {
    navigation?.navigate?.('ChatScreen', {
      chatId: chat?.id,
      chat,
      currentUserId,
      initialMessages,
    });
  };

  const handleSelectContact = async (contactId: string | number) => {
    if (shouldBlockDuplicateInitiation(isInitiatingChat)) return;

    setIsInitiatingChat(true);
    const requestToken = Date.now();
    latestInitiationTokenRef.current = requestToken;

    try {
      const normalizedContactId = String(contactId ?? '');
      const availableChats = conversations?.length
        ? conversations
        : ((await getChats?.()) ?? []);
      const existingConversation = findExistingConversation<Chat>(
        availableChats as Chat[],
        normalizedContactId,
      );

      if (existingConversation?.id != null) {
        const existingMessagesResponse = await getMessages?.(
          Number(existingConversation?.id),
          1,
          20,
        );

        if (latestInitiationTokenRef.current !== requestToken) return;

        const existingMessages = normalizeChatMessages(existingMessagesResponse?.data ?? []);
        closeContactsDrawer?.();
        openSelectedChat(existingConversation, existingMessages);
        return;
      }

      const createdChatResponse = await createIndividualChat?.(
        Number(normalizedContactId),
      );

      if (latestInitiationTokenRef.current !== requestToken) return;

      const createdChat = (createdChatResponse?.chat ?? createdChatResponse) as Chat;
      if (createdChat?.id == null) {
        throw new Error('Unable to create chat');
      }

      setConversations((prev) => {
        const list = prev ?? [];
        const hasCreatedChat = list?.some?.(
          (chat) => String(chat?.id ?? '') === String(createdChat?.id ?? ''),
        );
        if (hasCreatedChat) return list;
        return [createdChat, ...list];
      });

      const createdMessagesResponse = await getMessages?.(
        Number(createdChat?.id),
        1,
        20,
      );

      if (latestInitiationTokenRef.current !== requestToken) return;

      const createdMessages = normalizeChatMessages(createdMessagesResponse?.data ?? []);
      closeContactsDrawer?.();
      openSelectedChat(createdChat, createdMessages);
    } catch (e: any) {
      Toast.show?.({
        type: 'error',
        text1: 'Unable to start chat',
        text2: e?.message ?? 'Please try again',
      });
    } finally {
      if (latestInitiationTokenRef.current === requestToken) {
        setIsInitiatingChat(false);
      }
    }
  };

  const handleInitiateChat = async (contact: PhoneContactItem) => {
    if (!shouldInitiateChatFromContact(contact)) {
      Toast.show?.({
        type: 'info',
        text1: 'This person has not joined the app yet',
      });
      return;
    }

    await handleSelectContact(String(contact?.userId ?? ''));
  };

  const handleContactPress = async (contact: ChatUser) => {
    await handleSelectContact(String(contact?.id ?? ''));
  };

  const requestContactsPermissionIfNeeded = async (): Promise<ContactsPermissionStatus> => {
    try {
      if (typeof (Contacts as any)?.checkPermission !== 'function') {
        return 'unavailable';
      }

      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid?.request?.(
          PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
          {
            title: 'Contacts permission',
            message: 'We need access to your contacts to help you start chats.',
            buttonPositive: 'Allow',
            buttonNegative: 'Deny',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED ? 'authorized' : 'denied';
      }

      const current = await Contacts.checkPermission();
      if (current === 'authorized') return 'authorized';

      // iOS can return "limited" (still usable for reading contacts)
      if (current === 'limited') return 'authorized';

      // If it's undefined or denied, we should request on user action.
      if (current === 'undefined' || current === 'denied') {
        const requested = await Contacts.requestPermission();
        if (requested === 'limited') return 'authorized';
        return requested ?? 'denied';
      }

      const requested = await Contacts.requestPermission();
      if (requested === 'limited') return 'authorized';
      return requested ?? 'denied';
    } catch {
      // console.error('Contacts permission error:', error);
      return 'denied';
    }
  };

  const loadPhoneContacts = async () => {
    setContactsLoading(true);
    try {
      const contacts = await Contacts.getAll();
      const mapped: PhoneContactItem[] =
        contacts
          ?.map((c) => {
            const givenName = c?.givenName?.trim?.() ?? '';
            const familyName = c?.familyName?.trim?.() ?? '';
            const fullName = `${givenName} ${familyName}`.trim();
            const phoneNumber = c?.phoneNumbers?.[0]?.number?.trim?.() ?? null;

            return {
              recordID: c?.recordID ?? `${fullName}-${phoneNumber ?? ''}`,
              name: fullName || 'Unknown',
              phoneNumber,
            };
          })
          ?.sort((a, b) => a?.name?.localeCompare?.(b?.name ?? '') ?? 0) ?? [];

      setPhoneContacts(mapped);
      if (!mapped?.length) {
        Toast.show({
          type: 'info',
          text1: 'No contacts found',
          text2:
            Platform.OS === 'android'
              ? 'Add contacts to the emulator, then try again.'
              : 'No contacts available on this device.',
        });
      }
    } catch {
      // console.error('Error fetching contacts:', error);
    } finally {
      setContactsLoading(false);
    }
  };

  const openContactsDrawer = () => {
    setIsContactsDrawerVisible(true);
    requestAnimationFrame(() => {
      Animated.timing(drawerTranslateY, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });
  };

  const closeContactsDrawer = () => {
    Animated.timing(drawerTranslateY, {
      toValue: drawerHeight,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setIsContactsDrawerVisible(false);
    });
  };

  const handleStartChat = async () => {
    try {
      if (contactsLoading) return;

      if (typeof (Contacts as any)?.checkPermission !== 'function') {
        Toast.show({
          type: 'error',
          text1: 'Contacts not available',
          text2: 'Please rebuild the app (native module not loaded).',
        });
        return;
      }

      if (contactsDeniedOnce) {
        if (Platform.OS === 'android') {
          const hasPermission = await PermissionsAndroid?.check?.(
            PermissionsAndroid.PERMISSIONS.READ_CONTACTS
          );
          if (!hasPermission) {
            Toast.show({
              type: 'error',
              text1: 'Need contacts permission',
            });
            return;
          }
        } else {
          const current = await Contacts.checkPermission();
          if (current !== 'authorized' && current !== 'limited') {
            Toast.show({
              type: 'error',
              text1: 'Need contacts permission',
            });
            return;
          }
        }
      }

      const status = await requestContactsPermissionIfNeeded();
      if (status !== 'authorized') {
        setContactsDeniedOnce(true);
        return;
      }

      setContactsDeniedOnce(false);
      await loadPhoneContacts();
      setContactsSearchQuery('');
      openContactsDrawer();
    } catch {
      // console.log('Start chat error:', error);
    }
  };

  const openAddContactModal = () => {
    setNewContactFirstName('');
    setNewContactLastName('');
    setNewContactCountryCode('');
    setNewContactPhoneNumber('');
    setIsAddContactModalVisible(true);
  };

  const closeAddContactModal = () => {
    setIsAddContactModalVisible(false);
  };

  const handleContinueAddContact = async () => {
    // console.log('Add new contact:', {
    //   firstName: newContactFirstName?.trim?.(),
    //   lastName: newContactLastName?.trim?.(),
    //   countryCode: newContactCountryCode?.trim?.(),
    //   phoneNumber: newContactPhoneNumber?.trim?.(),
    //   fullPhoneNumber: `+${newContactCountryCode?.trim?.() ?? ''}${newContactPhoneNumber?.trim?.() ?? ''}`,
    // });
    const first = newContactFirstName?.trim?.() ?? '';
    const last = newContactLastName?.trim?.() ?? '';
    const ccRaw = newContactCountryCode?.trim?.() ?? '';
    const phoneRaw = newContactPhoneNumber?.trim?.() ?? '';

    const fullName = `${first} ${last}`?.trim?.() ?? '';
    const cc = ccRaw?.startsWith?.('+') ? ccRaw : `+${ccRaw}`;
    const phoneNumber = `${cc}${phoneRaw}`;

    try {
      const response = await createContact?.({
        name: fullName,
        phoneNumber,
      });

      Toast.show?.({
        type: 'success',
        text1: response?.contact?.message ?? 'Contact created',
      });

      closeAddContactModal?.();
      setSavedContactsRefreshToken((v) => (typeof v === 'number' ? v + 1 : 1));
    } catch (e: any) {
      Toast.show?.({
        type: 'error',
        text1: 'Failed to create contact',
        text2: e?.message ?? 'Please try again',
      });
    }
  };

  if (chatsLoading && !initialChatsLoadDone) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row justify-between items-center px-6 py-4">
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerIconButton}
          >
            <Image
              source={require('../assets/left-arrow-black.png')}
              className="w-[24px] h-[24px]"
              resizeMode="contain"
            />
          </TouchableOpacity>
          <Text className="text-[16px] font-semibold text-[#092724]">Messages</Text>
        </View>
        <TouchableOpacity
          onPress={handleStartChat}
          style={styles.headerIconButton}
        >
          <Image
            source={require('../assets/add-person.png')}
            className="w-[24px] h-[24px]"
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollViewContentContainer}
        scrollEventThrottle={16}
        onScroll={handleScrollBottomReload}
        refreshControl={
          <RefreshControl
            refreshing={refreshingConversations}
            onRefresh={() => void onPullDownRefresh?.()}
            tintColor="#5B2EC4"
            colors={['#5B2EC4']}
          />
        }
        bounces
        overScrollMode="always"
      >
        {/* Online Contacts Section */}
        {onlineContacts?.length > 0 && (
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
        <View className="px-6 py-2 flex-1">
          {conversations.length === 0 ? (
            <View className="flex-1 items-center justify-center py-12">
              <Text className="text-[#092724] text-xl font-semibold">
                No conversations yet
              </Text>
              <Text className="text-gray-400 text-sm mt-2 text-center">
                Start a chat with your contacts and keep in touch.
              </Text>

              <TouchableOpacity
                activeOpacity={0.85}
                className="mt-6 bg-[#5B2EC4] px-6 py-3 rounded-2xl"
                onPress={handleStartChat}
              >
                <Text className="text-white font-semibold text-base">
                  Start Chat
                </Text>
              </TouchableOpacity>
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

      <ContactsDrawer
        isVisible={isContactsDrawerVisible}
        onClose={closeContactsDrawer}
        drawerHeight={drawerHeight}
        drawerTranslateY={drawerTranslateY}
        contactsLoading={contactsLoading}
        onPressAddNewContact={openAddContactModal}
        savedContactsRefreshToken={savedContactsRefreshToken}
        contactsSearchQuery={contactsSearchQuery}
        setContactsSearchQuery={setContactsSearchQuery}
        filteredPhoneContacts={filteredPhoneContacts}
        onPressChatContact={handleInitiateChat}
        isInitiatingChat={isInitiatingChat}
      />

      <NewContactModal
        isAddContactModalVisible={isAddContactModalVisible}
        closeAddContactModal={closeAddContactModal}
        firstName={newContactFirstName}
        setFirstName={setNewContactFirstName}
        lastName={newContactLastName}
        setLastName={setNewContactLastName}
        countryCode={newContactCountryCode}
        setCountryCode={setNewContactCountryCode}
        phoneNumber={newContactPhoneNumber}
        setPhoneNumber={setNewContactPhoneNumber}
        onContinue={handleContinueAddContact}
      />
    </SafeAreaView>
  );
};

export default MessagesScreen;

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerIconButton: {
    width: 42,
    height: 42,
    borderWidth: 1,
    borderColor: '#F4F4F4',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollViewContentContainer: {
    flexGrow: 1,
  },
});
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Modal,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useUsersService from '../../services/user';
import { SendHorizontal } from 'lucide-react-native';
import useContactsService from '../../services/contacts';

export type PhoneContactItem = {
  recordID: string;
  name: string;
  phoneNumber: string | null;
  userId?: string | number | null;
};

type SavedContactItem = {
  id?: string | number;
  _id?: string | number;
  recordID?: string;
  name?: string;
  fullName?: string;
  phoneNumber?: string | null;
  phone?: string | null;
  userId?: string | number | null;
};

type ContactsDrawerProps = {
  isVisible: boolean;
  onClose: () => void;
  drawerHeight: number;
  drawerTranslateY: Animated.Value;
  contactsLoading: boolean;
  onPressAddNewContact: () => void;
  savedContactsRefreshToken?: number;
  contactsSearchQuery: string;
  setContactsSearchQuery: (v: string) => void;
  filteredPhoneContacts: PhoneContactItem[];
  onPressChatContact: (item: PhoneContactItem) => void;
  isInitiatingChat?: boolean;
};

export default function ContactsDrawer({
  isVisible,
  onClose,
  drawerHeight,
  drawerTranslateY,
  contactsLoading,
  onPressAddNewContact,
  savedContactsRefreshToken,
  contactsSearchQuery,
  setContactsSearchQuery,
  filteredPhoneContacts,
  onPressChatContact,
  isInitiatingChat = false,
}: ContactsDrawerProps) {
  const insets = useSafeAreaInsets();
  const [allUsersPhoneNumbers, setAllUsersPhoneNumbers] = useState<any>([]);
  const [userIdByNormalizedPhone, setUserIdByNormalizedPhone] = useState<
    Record<string, string | number>
  >({});
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [activeTab, setActiveTab] = useState<'saved' | 'device'>('saved');
  const [allSavedContacts, setAllSavedContacts] = useState<any>({
    isLoading: false,
    data: [],
  });

  const { getAllUsers } = useUsersService();
  const { getAllContacts } = useContactsService();

  const normalizePhone = (phone: string | null | undefined): string => {
    return String(phone ?? '')
      ?.replaceAll?.(' ', '')
      ?.trim?.() ?? '';
  };

  useEffect(() => {
    if (isVisible) {
      fetchAllUsers()
      fetchAllContacts()
    }
    return () => { }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, savedContactsRefreshToken])

  const fetchAllContacts = async () => {
    setAllSavedContacts({
      isLoading: true,
      data: [],
    })
    const allContacts = await getAllContacts();
    setAllSavedContacts({
      isLoading: false,
      data: allContacts,
    })
  }

  const fetchAllUsers = async () => {
    setLoadingUsers(true);
    const allUsers = await getAllUsers();
    setLoadingUsers(false);
    const normalizedUsers =
      (allUsers ?? [])
        ?.map?.((user: any) => {
          const normalizedPhone = normalizePhone(user?.phoneNumber);
          const id = user?.id ?? user?._id ?? user?.userId ?? null;
          return { normalizedPhone, id };
        })
        ?.filter?.((u: any) => u?.normalizedPhone && u?.id != null) ?? [];

    setAllUsersPhoneNumbers(normalizedUsers?.map?.((u: any) => u?.normalizedPhone) ?? []);
    setUserIdByNormalizedPhone(
      normalizedUsers?.reduce?.((acc: Record<string, string | number>, u: any) => {
        acc[String(u?.normalizedPhone)] = u?.id as any;
        return acc;
      }, {}) ?? {}
    );
  }

  const handleContact = (item: PhoneContactItem) => {
    const normalized = normalizePhone(item?.phoneNumber);
    if (allUsersPhoneNumbers?.includes?.(normalized)) {
      const userId = userIdByNormalizedPhone?.[normalized] ?? null;
      onPressChatContact?.({
        ...item,
        userId: item?.userId ?? userId,
      })
    } else {
      Share?.share?.({
        title: 'Invite to EchoTalk',
        message:
          `Hi ${item?.name}, Join me on EchoTalk. Download the app and let’s chat!`,
      })?.catch?.((_e) => {
      });
    }
  }

  const savedContactsData = (allSavedContacts?.data ?? []) as SavedContactItem[];

  const savedContactsFiltered = (savedContactsData ?? []).filter((c) => {
    const q = contactsSearchQuery?.trim?.()?.toLowerCase?.() ?? '';
    if (!q) return true;

    const name = (c?.name ?? c?.fullName ?? '')?.toLowerCase?.() ?? '';
    const phone = (c?.phoneNumber ?? c?.phone ?? '')?.toLowerCase?.() ?? '';
    return name?.includes?.(q) || phone?.includes?.(q);
  });

  const getSavedContactDisplayName = (c: SavedContactItem) => {
    return c?.name ?? c?.fullName ?? 'Unknown';
  };

  const getSavedContactPhone = (c: SavedContactItem) => {
    return c?.phoneNumber ?? c?.phone ?? null;
  };

  const toPhoneContactItem = (c: SavedContactItem): PhoneContactItem => {
    const recordID =
      (c?.recordID ??
        (c?.id != null ? String(c?.id) : undefined) ??
        (c?._id != null ? String(c?._id) : undefined) ??
        `${getSavedContactDisplayName(c)}-${getSavedContactPhone(c) ?? 'no-phone'}`) as string;

    return {
      recordID,
      name: getSavedContactDisplayName(c),
      phoneNumber: getSavedContactPhone(c),
      userId: c?.userId ?? null,
    };
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
      statusBarTranslucent
    >
      <Pressable
        onPress={onClose}
        className="flex-1"
        style={styles.backdrop}
      >
        <Pressable onPress={() => { }} className="flex-1 justify-end">
          <Animated.View
            style={[
              { height: drawerHeight },
              styles.drawerShadow,
              { transform: [{ translateY: drawerTranslateY }] },
              // Extend drawer background to the very bottom (covers home indicator area)
              { paddingBottom: insets?.bottom ?? 0 },
            ]}
            className="bg-white rounded-t-[18px] px-[18] pt-[14]"
          >
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-[16px] font-semibold text-[#092724]">
                Contacts
              </Text>
              <TouchableOpacity onPress={onClose} activeOpacity={0.8}>
                <Text className="text-[#5B2EC4] font-semibold">Close</Text>
              </TouchableOpacity>
            </View>

            {contactsLoading ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color="#5B2EC4" />
              </View>
            ) : (
              <View className="flex-1">
                <View className="flex-row mb-3">
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => setActiveTab('saved')}
                    className={`flex-1 h-[42px] rounded-2xl justify-center items-center border ${activeTab === 'saved'
                      ? 'bg-[#5B2EC4] border-[#5B2EC4]'
                      : 'bg-white border-gray-200'
                      }`}
                  >
                    <Text
                      className={`font-semibold text-[14px] ${activeTab === 'saved' ? 'text-white' : 'text-[#092724]'
                        }`}
                    >
                      Saved Contacts
                    </Text>
                  </TouchableOpacity>

                  <View className="w-3" />

                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => setActiveTab('device')}
                    className={`flex-1 h-[42px] rounded-2xl justify-center items-center border ${activeTab === 'device'
                      ? 'bg-[#5B2EC4] border-[#5B2EC4]'
                      : 'bg-white border-gray-200'
                      }`}
                  >
                    <Text
                      className={`font-semibold text-[14px] ${activeTab === 'device' ? 'text-white' : 'text-[#092724]'
                        }`}
                    >
                      Device Contacts
                    </Text>
                  </TouchableOpacity>
                </View>

                <View className="border border-gray-200 rounded-2xl px-4 h-[45px] mb-3">
                  <TextInput
                    value={contactsSearchQuery}
                    onChangeText={(t) => setContactsSearchQuery(t ?? '')}
                    placeholder="Search contacts"
                    placeholderTextColor="#9CA3AF"
                    autoCorrect={false}
                    autoCapitalize="none"
                    clearButtonMode="while-editing"
                    className="text-[14px] text-[#092724]"
                  />
                </View>

                {activeTab === 'saved' ? (
                  allSavedContacts?.isLoading ? (
                    <View className="flex-1 items-center justify-center">
                      <ActivityIndicator size="large" color="#5B2EC4" />
                    </View>
                  ) : (
                    <FlatList
                      data={savedContactsFiltered ?? []}
                      keyExtractor={(item, idx) =>
                        (item?.recordID ??
                          (item?.id != null ? String(item?.id) : undefined) ??
                          (item?._id != null ? String(item?._id) : undefined) ??
                          `saved-${idx}`) as string
                      }
                      showsVerticalScrollIndicator={false}
                      contentContainerStyle={styles.flatListContentContainer}
                      className="flex-1"
                      renderItem={({ item }) => {
                        const phoneContactItem = toPhoneContactItem(item);
                        return (
                          <View className="py-3 border-b border-gray-100 flex-row items-center">
                            <View className="flex-1 pr-3">
                              <Text className="text-[15px] font-semibold text-[#092724]">
                                {getSavedContactDisplayName(item)}
                              </Text>
                              <Text className="text-[13px] text-gray-500 mt-1">
                                {getSavedContactPhone(item) ?? 'No phone number'}
                              </Text>
                            </View>

                            {!loadingUsers ? (
                              allUsersPhoneNumbers?.includes?.(
                                normalizePhone(phoneContactItem?.phoneNumber)
                              ) ? (
                                <TouchableOpacity
                                  activeOpacity={0.85}
                                  onPress={() => handleContact(phoneContactItem)}
                                  disabled={isInitiatingChat}
                                  className={`w-[60px] py-2 rounded-xl bg-[#5B2EC4] border border-[#5B2EC4] justify-center items-center`}
                                >
                                  <SendHorizontal size={18} color="#ffffff" />
                                </TouchableOpacity>
                              ) : (
                                <TouchableOpacity
                                  activeOpacity={0.85}
                                  onPress={() => handleContact(phoneContactItem)}
                                  disabled={isInitiatingChat}
                                  className={`w-[60px] py-2 rounded-xl border border-[#5B2EC4] justify-center items-center`}
                                >
                                  <Text className="text-[#5B2EC4] font-semibold text-[13px]">
                                    Invite
                                  </Text>
                                </TouchableOpacity>
                              )
                            ) : (
                              <View className={`w-[60px] justify-center items-center`}>
                                <ActivityIndicator size="small" color="#5B2EC4" />
                              </View>
                            )}
                          </View>
                        );
                      }}
                      ListEmptyComponent={
                        <View className="py-10 items-center justify-center">
                          <Text className="text-gray-500">No saved contacts found</Text>
                        </View>
                      }
                    />
                  )
                ) : (
                  <FlatList
                    data={filteredPhoneContacts ?? []}
                    keyExtractor={(item) => item?.recordID}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.flatListContentContainer}
                    className="flex-1"
                    renderItem={({ item }) => (
                      <View className="py-3 border-b border-gray-100 flex-row items-center">
                        <View className="flex-1 pr-3">
                          <Text className="text-[15px] font-semibold text-[#092724]">
                            {item?.name}
                          </Text>
                          <Text className="text-[13px] text-gray-500 mt-1">
                            {item?.phoneNumber ?? 'No phone number'}
                          </Text>
                        </View>
                        {!loadingUsers ? (
                          allUsersPhoneNumbers?.includes?.(
                            normalizePhone(item?.phoneNumber)
                          ) ? (
                            <TouchableOpacity
                              activeOpacity={0.85}
                              onPress={() => handleContact(item)}
                              disabled={isInitiatingChat}
                              className={`w-[60px] py-2 rounded-xl bg-[#5B2EC4] border border-[#5B2EC4] justify-center items-center`}
                            >
                              <SendHorizontal size={18} color="#ffffff" />
                            </TouchableOpacity>
                          ) : (
                            <TouchableOpacity
                              activeOpacity={0.85}
                              onPress={() => handleContact(item)}
                              disabled={isInitiatingChat}
                              className={`w-[60px] py-2 rounded-xl border border-[#5B2EC4] justify-center items-center`}
                            >
                              <Text className="text-[#5B2EC4] font-semibold text-[13px]">
                                Invite
                              </Text>
                            </TouchableOpacity>
                          )
                        ) : (
                          <View className={`w-[60px] justify-center items-center`}>
                            <ActivityIndicator size="small" color="#5B2EC4" />
                          </View>
                        )}
                      </View>
                    )}
                    ListEmptyComponent={
                      <View className="py-10 items-center justify-center">
                        <Text className="text-gray-500">No contacts found</Text>
                      </View>
                    }
                  />
                )}

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={onPressAddNewContact}
                  className="bg-[#5B2EC4] rounded-2xl h-[45px] justify-center items-center mt-3"
                >
                  <Text className="text-white font-semibold text-[15px]">
                    Add new contact
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  drawerShadow: {
    shadowColor: '#000',
    shadowOpacity: 1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: -6 },
    elevation: 18,
  },
  flatListContentContainer: {
    paddingBottom: 0,
  },
});
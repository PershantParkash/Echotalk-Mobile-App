import { NavigatorScreenParams } from '@react-navigation/native';

// Define the Chat type
export interface Chat {
  id: number;
  type: string;
  users: ChatUser[];
}

export interface ChatUser {
  id: number;
  fullName: string | null;
  phoneNumber: string;
  profileImage: string | null;
  isOnline: boolean;
  lastSeenAt?: string;
}

// Tab Navigator Types
export type TabParamList = {
  HomeTab: undefined;
  ChatTab: undefined;
};

// Stack Navigator Types
export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Login: undefined;
  Register: undefined;
  MainTabs: NavigatorScreenParams<TabParamList>;
  ChatScreen: {
    chatId: number;
    chat: Chat;
  };
};
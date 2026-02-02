import { NavigatorScreenParams } from '@react-navigation/native';

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
};
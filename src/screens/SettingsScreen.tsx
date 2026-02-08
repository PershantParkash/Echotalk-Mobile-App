import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import {
  ChevronLeft,
  MoreVertical,
  Lock,
  HelpCircle,
  Shield,
  Bell,
  Moon,
  LogOut,
  Image,
} from 'lucide-react-native';
import { RootStackParamList } from '../navigation/navigation';
import { clearAllTokens } from '../utils/storage';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

const SettingsScreen = () => {
  const [appNotification, setAppNotification] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

  const navigation = useNavigation<NavigationProp>();

  const handleLogout = async () => {
    try {
      await clearAllTokens();

      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const MenuItem = ({
    icon: Icon,
    title,
    onPress,
    showChevron = true,
  }: {
    icon: any;
    title: string;
    onPress?: () => void;
    showChevron?: boolean;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center px-5 py-4 bg-white"
      activeOpacity={0.7}
    >
      <View className="w-10 h-10 rounded-full bg-purple-50 items-center justify-center mr-4">
        <Icon size={20} color="#9333ea" />
      </View>
      <Text className="flex-1 text-base text-gray-800">{title}</Text>
      {showChevron && (
        <ChevronLeft size={20} color="#9ca3af" className="rotate-180" />
      )}
    </TouchableOpacity>
  );

  const ToggleMenuItem = ({
    icon: Icon,
    title,
    value,
    onValueChange,
  }: {
    icon: any;
    title: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
  }) => (
    <View className="flex-row items-center px-5 py-4 bg-white">
      <View className="w-10 h-10 rounded-full bg-purple-50 items-center justify-center mr-4">
        <Icon size={20} color="#9333ea" />
      </View>
      <Text className="flex-1 text-base text-gray-800">{title}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#e5e7eb', true: '#c4b5fd' }}
        thumbColor={value ? '#9333ea' : '#f3f4f6'}
      />
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />

      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-4 bg-white">
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
        ></TouchableOpacity>
        <Text className="text-xl font-semibold text-gray-900">Setting</Text>
        <TouchableOpacity onPress={() => console.log('More options')}>
          <MoreVertical size={24} color="#1f2937" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View className="flex-1">
        {/* About Section */}
        <View className="mt-4">
          <Text className="px-5 py-2 text-sm font-medium text-gray-600">
            About
          </Text>
          <View className="bg-white">
            <MenuItem
              icon={Lock}
              title="Change Password"
              onPress={() => console.log('Change Password')}
            />
            <View className="h-px bg-gray-100 ml-16" />
            <MenuItem
              icon={HelpCircle}
              title="FAQ"
              onPress={() => console.log('FAQ')}
            />
            <View className="h-px bg-gray-100 ml-16" />
            <MenuItem
              icon={Shield}
              title="Privacy & Policy"
              onPress={() => console.log('Privacy & Policy')}
            />
          </View>
        </View>

        {/* Notification Section */}
        <View className="mt-6">
          <Text className="px-5 py-2 text-sm font-medium text-gray-600">
            Notification
          </Text>
          <View className="bg-white">
            <ToggleMenuItem
              icon={Bell}
              title="App Notification"
              value={appNotification}
              onValueChange={setAppNotification}
            />
            <View className="h-px bg-gray-100 ml-16" />
            <ToggleMenuItem
              icon={Moon}
              title="Dark Mode"
              value={darkMode}
              onValueChange={setDarkMode}
            />
          </View>
        </View>

        {/* Logout Button */}
        <View className="mt-auto mb-8">
          <TouchableOpacity
            onPress={handleLogout}
            className="flex-row items-center px-5 py-4 mx-5 bg-white rounded-2xl"
            activeOpacity={0.7}
          >
            <View className="w-10 h-10 rounded-full bg-red-50 items-center justify-center mr-4">
              <LogOut size={20} color="#ef4444" />
            </View>
            <Text className="text-base text-red-500 font-medium">Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default SettingsScreen;

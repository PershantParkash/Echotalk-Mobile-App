import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { ChevronRight, User, CreditCard, Star, Award, Settings, MoreVertical } from 'lucide-react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/navigation';

interface MenuItem {
  id: string;
  icon: React.ComponentType<any>;
  label: string;
  onPress?: () => void;
}
type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Props {
  navigation: ProfileScreenNavigationProp;
}

const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const generalMenuItems: MenuItem[] = [
    { id: '1', icon: User, label: 'Personal Data' },
    { id: '2', icon: CreditCard, label: 'Payments' },
    { id: '3', icon: Star, label: 'Reviews' },
    { id: '4', icon: Award, label: 'Certificate' },
  ];

  const otherMenuItems: MenuItem[] = [
    { id: '5', icon: Settings, label: 'Settings' },
  ];

   const handleMenuPress = (label: string) => {
    if (label === 'Settings') {
      navigation.navigate('Settings');
    } else {
      console.log(`${label} pressed`);
    }
  };


  const renderMenuItem = (item: MenuItem) => {
    const IconComponent = item.icon;
    return (
      <TouchableOpacity
        key={item.id}
        onPress={() => handleMenuPress(item.label)}
        className="flex-row items-center justify-between py-4 px-5 bg-white mb-2 rounded-2xl active:opacity-70"
        activeOpacity={0.7}
      >
        <View className="flex-row items-center">
          <View className="w-10 h-10 rounded-full bg-purple-100 items-center justify-center">
            <IconComponent size={20} color="#7c3aed" />
          </View>
          <Text className="ml-4 text-base font-medium text-gray-800">
            {item.label}
          </Text>
        </View>
        <ChevronRight size={20} color="#9ca3af" />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="light-content" />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header Section with Gradient */}
        <View className="bg-[#5B2EC4] pb-8 pt-4 px-5 rounded-b-[40px] shadow-lg">
              <Image
        source={require('../assets/decorator1.png')}
        className="absolute right-0"
      />
      <Image
        source={require('../assets/decorator2.png')}
        className="absolute left-0 bottom-0"
      />
          <View className="flex-row justify-between items-center mb-8">
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
            <Text className="text-2xl font-bold text-white">My Profile</Text>
            <TouchableOpacity
              className="w-10 h-10 rounded-full bg-white/20 items-center justify-center active:opacity-70"
              activeOpacity={0.7}
            >
              <MoreVertical size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* Profile Image and Info */}
          <View className="items-center">
            <View className="w-28 h-28 rounded-full bg-white p-1.5 shadow-xl mb-4">
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400' }}
                className="w-full h-full rounded-full"
                resizeMode="cover"
              />
            </View>
            <Text className="text-xl font-bold text-white mb-1">
              Justin Hafidzaki
            </Text>
            <Text className="text-sm text-purple-100">
              hafidzaki@gmail.com
            </Text>
          </View>
        </View>

        {/* Menu Sections */}
        <View className="px-5 mt-6">
          {/* General Section */}
          <Text className="text-base font-semibold text-gray-900 mb-3">
            General
          </Text>
          <View className="mb-6">
            {generalMenuItems.map(renderMenuItem)}
          </View>

          {/* Others Section */}
          <Text className="text-base font-semibold text-gray-900 mb-3">
            Others
          </Text>
          <View className="mb-6">
            {otherMenuItems.map(renderMenuItem)}
          </View>
        </View>

        {/* Bottom Spacing */}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;
import { Text, View, Image } from 'react-native';
import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from '../navigation/navigation';

type SplashScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Home'
>;

export default function SplashComponent() {
  const navigation = useNavigation<SplashScreenNavigationProp>();

  useEffect(() => {
    const checkFirstTimeUser = async () => {
      try {
        const hasLaunched = await AsyncStorage.getItem('hasLaunched');

        if (hasLaunched === null) {
          // First time user
          await AsyncStorage.setItem('hasLaunched', 'true');
          navigation.replace('Onboarding'); // Send to onboarding
        } else {
          // Returning user
          navigation.replace('Login'); // Send to login
        }
      } catch (error) {
        console.error('Error checking first time user', error);
        navigation.replace('Login'); // fallback
      }
    };

    const timer = setTimeout(checkFirstTimeUser, 2000); // keep splash for 2s

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View className="flex-1 items-center justify-center bg-[#5B2EC4]">
      <Image source={require('../assets/logo.png')} />
      <Text className="text-xl font-bold text-white mt-2">EchoTalk</Text>
      <Image
        source={require('../assets/decorator1.png')}
        className="absolute right-0"
      />
      <Image
        source={require('../assets/decorator2.png')}
        className="absolute left-0 bottom-0"
      />
      <Image
        source={require('../assets/decorator3.png')}
        className="absolute left-0 top-0"
      />
    </View>
  );
}

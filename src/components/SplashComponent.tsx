import { Text, View, Image } from 'react-native';
import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/navigation';

type SplashScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Home'
>;

export default function SplashComponent() {
  const navigation = useNavigation<SplashScreenNavigationProp>();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.navigate('Onboarding');
    }, 2000);

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
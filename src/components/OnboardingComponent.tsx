import { useState } from 'react';
import {
  Text,
  View,
  Image,
  ImageBackground,
  TouchableOpacity,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/navigation';

type OnboardingNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Onboarding'
>;

export default function OnboardingComponent() {
  const [activeOnboardingPage, setActiveOnboardingPage] = useState<number>(0);
  const navigation = useNavigation<OnboardingNavigationProp>();

  const onboardingData = [
    {
      heading: 'Where Communication Meets Accessibility for Everyone.',
      paragraph:
        'Breaking Barriers Through Accessible Communication and Services',
      image: require('../assets/onboarding1bg.png'),
    },
    {
      heading: 'Experience Seamless Communication',
      paragraph:
        'Breaking Barriers Through Accessible Communication and Services',
      image: require('../assets/onboarding2bg.png'),
    },
    {
      heading: 'Get Started',
      paragraph: 'Connecting You to What Matters Most Seamlessly.',
      image: require('../assets/onboarding3bg.png'),
    },
  ];

  // Function to mark first launch done and navigate to Login
  const finishOnboarding = async () => {
    try {
      await AsyncStorage.setItem('hasLaunched', 'true');
      navigation.replace('Login'); // replace so user can't go back
    } catch (error) {
      console.error('Error finishing onboarding', error);
      navigation.replace('Login');
    }
  };

  const handleNext = () => {
    if (activeOnboardingPage < onboardingData.length - 1) {
      setActiveOnboardingPage(activeOnboardingPage + 1);
    } else {
      // Last page -> finish onboarding
      finishOnboarding();
    }
  };

  const handleSkip = () => {
    finishOnboarding(); // skip to login
  };

  return (
    <ImageBackground
      source={onboardingData[activeOnboardingPage].image}
      className="flex-1"
      resizeMode="cover"
    >
      <LinearGradient
        colors={[
          'rgba(91, 46, 196, 1)',
          'rgba(91, 46, 196, 0.4)',
          'rgba(91, 46, 196, 1)',
        ]}
        locations={[0, 0.5, 1]}
        className="flex-1 justify-center items-center"
      >
        <Image
          source={require('../assets/logo.png')}
          className="absolute top-8 left-8"
        />
        <View className="px-6 absolute bottom-16 w-full">
          <Text className="text-white text-3xl font-bold mt-2 text-center">
            {onboardingData[activeOnboardingPage].heading}
          </Text>

          <Text className="text-white mt-2 text-center text-lg">
            {onboardingData[activeOnboardingPage].paragraph}
          </Text>

          <View className="flex-row justify-between mt-6 items-center">
            {/* Skip Button */}
            <TouchableOpacity onPress={handleSkip}>
              <Text className="text-md text-white font-semibold">Skip</Text>
            </TouchableOpacity>

            {/* Pagination Dots */}
            <View className="flex-row justify-between mt-3 gap-2">
              {onboardingData.map((_, index) => (
                <View
                  key={index}
                  className={
                    activeOnboardingPage === index
                      ? 'bg-white w-7 h-2 rounded-full'
                      : 'bg-gray-500 w-2 h-2 rounded-full'
                  }
                />
              ))}
            </View>

            {/* Next Button */}
            <TouchableOpacity onPress={handleNext}>
              <Text className="text-md text-white font-semibold">
                {activeOnboardingPage === onboardingData.length - 1
                  ? 'Start'
                  : 'Next'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </ImageBackground>
  );
}

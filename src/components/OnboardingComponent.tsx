import { useState } from 'react';
import {
  Text,
  View,
  Image,
  ImageBackground,
  TouchableOpacity,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

export default function OnboardingComponent() {
  const [activeOnboardingPage, setActiveOnboardingPage] = useState<number>(0);
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

  const handleNext = () => {
    if (activeOnboardingPage < onboardingData.length - 1) {
      setActiveOnboardingPage(activeOnboardingPage + 1);
    }
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
        <View className="px-6 absolute bottom-16">
          <Text className="text-white text-3xl font-bold mt-2 text-center ">
            {onboardingData[activeOnboardingPage].heading}
          </Text>

          <Text className="text-white mt-2 text-center text-lg">
            {onboardingData[activeOnboardingPage].paragraph}
          </Text>

          <View className="flex-row justify-between mt-2">
            <Text className="text-md text-white">skip</Text>

            <View className="flex-row justify-between mt-3 gap-2">
              <View
                className={
                  activeOnboardingPage === 0
                    ? ' bg-white w-7 h-2 rounded-full'
                    : 'bg-gray-500 w-2 h-2 rounded-full'
                }
              />
              <View
                className={
                  activeOnboardingPage === 1
                    ? ' bg-white w-7 h-2 rounded-full'
                    : 'bg-gray-500 w-2 h-2 rounded-full'
                }
              />
              <View
                className={
                  activeOnboardingPage === 2
                    ? ' bg-white w-7 h-2 rounded-full'
                    : 'bg-gray-500 w-2 h-2 rounded-full'
                }
              />
            </View>

            <TouchableOpacity onPress={handleNext}>
              <Text className="text-md text-white font-semibold">Next</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </ImageBackground>
  );
}
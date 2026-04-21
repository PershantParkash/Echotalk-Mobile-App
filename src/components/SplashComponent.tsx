import { Text, View, Image } from 'react-native';
import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from '../navigation/navigation';
import { getAccessToken } from '../utils/storage';
import useUsersService from '../services/user';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import {
  setCurrentStep,
  setForceCompleteProfile,
  setUpdateAppUser,
  setUserDetails,
} from '../store/user/user.actions';
import { RegisterSteps } from '../store/user/user.types';

export default function SplashComponent() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { getUserDetails } = useUsersService();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.user);

  const isProfileComplete = (d: any): boolean => {
    const fullName = d?.fullName?.trim?.() ?? '';
    const parts = fullName.split(' ').filter(Boolean);
    const firstName = parts?.[0]?.trim?.() ?? '';
    const lastName = parts?.slice?.(1)?.join?.(' ')?.trim?.() ?? '';
    const email = d?.email?.trim?.() ?? '';
    const image = d?.profileImage?.trim?.() ?? '';
    return !!(firstName && lastName && email && image);
  };

  useEffect(() => {
    const checkFirstTimeUser = async () => {
      try {
        const hasLaunched = await AsyncStorage.getItem('hasLaunched');

        if (hasLaunched === null) {
          // First time user
          await AsyncStorage.setItem('hasLaunched', 'true');
          navigation.replace('Onboarding'); // Send to onboarding
        } else {
          // Returning user: decide based on token presence
          const token = await getAccessToken();

          if (token?.trim()) {
            try {
              const details = await getUserDetails();
              dispatch(setUserDetails(details));

              const fullName = details?.fullName?.trim?.() ?? '';
              const parts = fullName.split(' ').filter(Boolean);
              const firstName = parts?.[0] ?? '';
              const lastName = parts?.slice?.(1)?.join?.(' ') ?? '';

              dispatch(
                setUpdateAppUser({
                  ...user,
                  firstName: user?.firstName?.trim?.()?.length ? user.firstName : firstName,
                  lastName: user?.lastName?.trim?.()?.length ? user.lastName : lastName,
                  email: user?.email?.trim?.()?.length ? user.email : (details?.email?.trim?.() ?? ''),
                  image: user?.image?.trim?.()?.length
                    ? user.image
                    : (details?.profileImage?.trim?.() ?? ''),
                }),
              );

              if (!isProfileComplete(details)) {
                dispatch(setForceCompleteProfile(true));
                dispatch(setCurrentStep(RegisterSteps.PersonalDetails));
                navigation.replace('Register');
                return;
              }

              dispatch(setForceCompleteProfile(false));
              navigation.replace('MainTabs', { screen: 'HomeTab' });
            } catch {
              // If token exists but profile fetch fails, fall back to tabs.
              navigation.replace('MainTabs', { screen: 'HomeTab' });
            }
          } else {
            navigation.replace('Login');
          }
        }
      } catch {
        // console.error('Error checking first time user', error);
        navigation.replace('Login'); // fallback
      }
    };

    const timer = setTimeout(checkFirstTimeUser, 2000); // keep splash for 2s

    return () => clearTimeout(timer);
  }, [dispatch, getUserDetails, navigation, user]);

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

import React, { useState } from 'react';
import {
  Text,
  View,
  Image,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import useAuthService from '../../services/auth';
import Toast from 'react-native-toast-message';
import { saveTokens } from '../../utils/storage';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/navigation';
import Feather from 'react-native-vector-icons/Feather';
import { PhoneInputWithCountry } from '../ui/PhoneInputWithCountry';
import useUsersService from '../../services/user';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
  setCurrentStep,
  setForceCompleteProfile,
  setUpdateAppUser,
  setUserDetails,
} from '../../store/user/user.actions';
import { RegisterSteps } from '../../store/user/user.types';

type LoginScreenProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export default function LoginComponent() {
  const [countryCode, setCountryCode] = useState('92');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{
    phoneNumber?: string;
    password?: string;
  }>({});

  const { signin, loading } = useAuthService();
  const { getUserDetails } = useUsersService();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.user);
  const navigation = useNavigation<LoginScreenProp>();

  const isProfileComplete = (d: any): boolean => {
    const fullName = d?.fullName?.trim?.() ?? '';
    const parts = fullName.split(' ').filter(Boolean);
    const firstName = parts?.[0]?.trim?.() ?? '';
    const lastName = parts?.slice?.(1)?.join?.(' ')?.trim?.() ?? '';
    const email = d?.email?.trim?.() ?? '';
    const image = d?.profileImage?.trim?.() ?? '';
    return !!(firstName && lastName && email && image);
  };

  const validate = () => {
    let tempErrors: { phoneNumber?: string; password?: string } = {};

    if (!countryCode?.trim()) {
      tempErrors.phoneNumber = 'Please select a country';
    } else if (!phoneNumber?.trim()) {
      tempErrors.phoneNumber = 'Phone number is required';
    } else if (!/^\d{10,15}$/.test(phoneNumber)) {
      tempErrors.phoneNumber = 'Enter a valid phone number (10-15 digits)';
    }

    if (!password) {
      tempErrors.password = 'Password is required';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    try {
      const response = await signin({
        phoneNumber: `+${countryCode}${phoneNumber}`,
        password,
      });
      console.log('response', response)
      if (response) {
        await saveTokens(response.accessToken, response.refreshToken);

        Toast.show({
          type: 'success',
          text1: 'Login successful',
          text2: 'Welcome back! 🎉',
        });

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
          // If profile fetch fails, still allow login into the app.
          navigation.replace('MainTabs', { screen: 'HomeTab' });
        }
      } else {
        Toast.show({
          type: 'error',
          text1: 'Login Failed',
          text2: 'Invalid phone number or password',
        });
      }
    } catch (err: any) {

      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: err.message || 'Invalid phone number or password',
      });
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 items-center justify-center bg-[#5B2EC4]">
          <Image
            source={require('../../assets/decorator1.png')}
            className="absolute right-0 top-20"
            resizeMode="contain"
          />
          <Image
            source={require('../../assets/decorator2.png')}
            className="absolute left-0 bottom-0"
            resizeMode="contain"
          />
          <Image
            source={require('../../assets/decorator3.png')}
            className="absolute left-0 top-0"
            resizeMode="contain"
          />

          <View className="absolute top-0 w-full h-[40%] items-center justify-center">
            <Image
              source={require('../../assets/AuthPerson.png')}
              className="w-[220px] h-[220px] absolute bottom-0"
            />
          </View>

          <View className="absolute bottom-0 w-full h-[60%] bg-white rounded-t-3xl px-6 pt-8 pb-10">
            <Text className="text-[30px] font-semibold text-[#092724] mb-2">Login</Text>
            <Text className="text-base text-gray-600 mb-6">
              Welcome back, we missed you!
            </Text>

            <PhoneInputWithCountry
              label="Phone Number"
              countryCode={countryCode}
              phoneNumber={phoneNumber}
              onCountryChange={code => {
                setCountryCode(code);
                if (errors?.phoneNumber) setErrors({ ...errors, phoneNumber: '' });
              }}
              onPhoneChange={text => {
                setPhoneNumber(text);
                if (errors?.phoneNumber) setErrors({ ...errors, phoneNumber: '' });
              }}
              error={errors?.phoneNumber}
              editable={!loading}
              placeholder="000-0000000"
              containerClassName="mb-4"
              inputClassName="bg-gray-50"
            />

            <View className="mb-2">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Password
              </Text>
              <View className="relative">
                <TextInput
                  className={`w-full p-4 text-[#000000] bg-gray-50 rounded-lg border ${errors.password ? 'border-red-500' : 'border-gray-200'
                    } pr-12`}
                  placeholder="Enter your password"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={text => {
                    setPassword(text);
                    if (errors.password) setErrors({ ...errors, password: '' });
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="password"
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-4"
                  disabled={loading}
                >
                  <Feather
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color="gray"
                  />
                </TouchableOpacity>
              </View>
              {errors.password ? (
                <Text className="text-red-500 text-xs mt-1">
                  {errors.password}
                </Text>
              ) : null}
            </View>

            <TouchableOpacity
              className="self-end mb-6"
              disabled={loading}
            >
              <Text className="text-[#5B2EC4] font-medium text-sm">
                Forgot Password?
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`p-4 rounded-lg mb-6 ${loading ? 'bg-[#5B2EC4]/70' : 'bg-[#5B2EC4]'
                }`}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white text-center font-semibold text-base">
                  Login
                </Text>
              )}
            </TouchableOpacity>

            <View className="flex-row justify-center items-center">
              <Text className="text-gray-600 text-sm">
                Don't have an account?{' '}
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Register')}
                disabled={loading}
              >
                <Text className="text-[#5B2EC4] font-semibold text-sm">
                  Register
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

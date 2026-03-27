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

type LoginScreenProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export default function LoginComponent() {
  const [countryCode, setCountryCode] = useState('92');
  const [phoneNumber, setPhoneNumber] = useState('3234836348');
  const [password, setPassword] = useState('faraz123');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{
    phoneNumber?: string;
    password?: string;
  }>({});

  const { signin, loading } = useAuthService();
  const navigation = useNavigation<LoginScreenProp>();

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
      if (response) {
        await saveTokens(response.accessToken, response.refreshToken);

        Toast.show({
          type: 'success',
          text1: 'Login successful',
          text2: 'Welcome back! 🎉',
        });

        navigation.replace('MainTabs', { screen: 'HomeTab' });
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
            <Text className="text-[30px] font-semibold text-[#092724] mb-2">Create</Text>
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

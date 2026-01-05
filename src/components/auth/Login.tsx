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
  Alert,
} from 'react-native';
import useAuthService from '../../services/auth';
import Toast from 'react-native-toast-message';


export default function LoginComponent() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{
    phoneNumber?: string;
    password?: string;
  }>({});
  const { signin, loading } = useAuthService();

  const validate = () => {
    let tempErrors: { phoneNumber?: string; password?: string } = {};

    if (!phoneNumber) {
      tempErrors.phoneNumber = 'Phone number is required';
    } else if (!/^\d{10,15}$/.test(phoneNumber)) {
      tempErrors.phoneNumber = 'Enter a valid phone number';
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
        phoneNumber: `+${phoneNumber}`,
        password,
      });
      console.log('APP STARTED2');

      if (response) {
        // saveAccessTokenInLocalStorage(response.accessToken);
        // saveRefreshTokenInCookie(response.refreshToken);
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Your profile was updated 👌',
        });
        // const decodedToken: any = jwtDecode(response.accessToken);
        // if (decodedToken?.isTrainer) {
        //   router.replace("/trainer");
        // } else {
        //   router.replace("/");
        // }
        // toast.success("Login successful");
      } else {
        // toast.error("Invalid phone number or password.");
        Toast.show({
          type: 'error',
          text1: 'error',
          text2: 'not logged in',
        });
      }
    } catch (err: any) {
      // toast.error("Invalid phone number or password.");
      Toast.show({
        type: 'error',
        text1: 'error',
        text2: 'Your profile was updated 👌',
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
            <Text className="text-3xl font-bold text-gray-800 mb-2">Login</Text>
            <Text className="text-base text-gray-600 mb-6">
              Welcome back, we missed you!
            </Text>

            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </Text>
              <TextInput
                className={`w-full p-4 bg-gray-50 rounded-lg border ${
                  errors.phoneNumber ? 'border-red-500' : 'border-gray-200'
                }`}
                placeholder="Enter your phone number"
                placeholderTextColor="#9CA3AF"
                value={phoneNumber}
                onChangeText={text => {
                  setPhoneNumber(text);
                  if (errors.phoneNumber)
                    setErrors({ ...errors, phoneNumber: '' });
                }}
                keyboardType="phone-pad"
                autoComplete="tel"
                editable={!isLoading}
              />
              {errors.phoneNumber ? (
                <Text className="text-red-500 text-xs mt-1">
                  {errors.phoneNumber}
                </Text>
              ) : null}
            </View>

            <View className="mb-2">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Password
              </Text>
              <View className="relative">
                <TextInput
                  className={`w-full p-4 bg-gray-50 rounded-lg border ${
                    errors.password ? 'border-red-500' : 'border-gray-200'
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
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-4"
                  disabled={isLoading}
                >
                  <Text className="text-[#5B2EC4] font-medium">
                    {showPassword ? 'Hide' : 'Show'}
                  </Text>
                </TouchableOpacity>
              </View>
              {errors.password ? (
                <Text className="text-red-500 text-xs mt-1">
                  {errors.password}
                </Text>
              ) : null}
            </View>

            <TouchableOpacity
              // onPress={onForgotPassword}
              className="self-end mb-6"
              disabled={isLoading}
            >
              <Text className="text-[#5B2EC4] font-medium text-sm">
                Forgot Password?
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`p-4 rounded-lg mb-6 ${
                isLoading ? 'bg-[#5B2EC4]/70' : 'bg-[#5B2EC4]'
              }`}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
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
                // onPress={onNavigateToRegister}
                disabled={isLoading}
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

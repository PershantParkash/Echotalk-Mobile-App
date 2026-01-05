import { useState } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import {
  setCurrentStep,
  setOtpVerificationId,
  setUpdateAppUser,
} from '../../store/user/user.actions';
import { RegisterSteps } from '../../store/user/user.types';
import useAuthService from '../../services/auth';
import auth from '@react-native-firebase/auth';
// import { Ionicons } from '@expo/vector-icons';

const PhoneAndPassword = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    phoneNumber?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const { checkPhoneNumber } = useAuthService();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.user);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const validate = () => {
    let tempErrors: {
      phoneNumber?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!user.phoneNumber.trim()) {
      tempErrors.phoneNumber = 'Phone number is required';
    } else if (!/^\d+$/.test(user.phoneNumber)) {
      tempErrors.phoneNumber = 'Invalid phone number (only digits allowed)';
    } else if (!/^\d{10,15}$/.test(user.phoneNumber)) {
      tempErrors.phoneNumber = 'Enter a valid phone number';
    }

    if (!user.password.trim()) {
      tempErrors.password = 'Password is required';
    } else if (user.password.length < 6) {
      tempErrors.password = 'Password must be at least 6 characters';
    } else if (!/[a-zA-Z]/.test(user.password)) {
      tempErrors.password = 'Password must contain at least one letter';
    } else if (!/[0-9]/.test(user.password)) {
      tempErrors.password = 'Password must contain at least one number';
    }

    if (!user.confirmPassword.trim()) {
      tempErrors.confirmPassword = 'Confirm password is required';
    } else if (user.confirmPassword !== user.password) {
      tempErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const showAlert = (title: string, message: string) => {
    Alert.alert(title, message, [{ text: 'OK' }]);
  };

  const handleContinue = async () => {
    if (!validate()) return;
    setLoading(true);

    try {
      await checkPhoneNumber(`+${user.phoneNumber}`);
    } catch (e: any) {
      if (e == 'Error: Phone number already exists') {
        showAlert(
          'Phone Already Registered',
          'This phone number is already registered. Please log in or use a different number.',
        );
      } else {
        showAlert(
          'Error',
          'An unexpected error occurred. Please contact support if the issue persists.',
        );
      }
      setLoading(false);
      return;
    }

    try {
      // For React Native Firebase
      const confirmationResult = await auth().signInWithPhoneNumber(
        `+${user.phoneNumber}`,
      );
      if (!confirmationResult.verificationId) {
        throw new Error('No verification ID received');
      }
      showAlert('OTP Sent', 'Enter the code to verify your phone number.');
      dispatch(setOtpVerificationId(confirmationResult.verificationId));
      dispatch(setCurrentStep(RegisterSteps.PhoneVerification));
    } catch (error: any) {
      console.log('Error:', error);

      if (error?.code === 'auth/invalid-phone-number') {
        showAlert('Invalid Phone', 'Phone number is not valid.');
      } else if (error?.code === 'auth/missing-phone-number') {
        showAlert('Missing Phone', 'Phone number is required.');
      } else if (error?.code === 'auth/too-many-requests') {
        showAlert(
          'Too Many Attempts',
          'Too many requests. Please try again later.',
        );
      } else {
        console.error('Error during sign-in with phone number:', error);
        showAlert(
          'Error',
          'An unexpected error occurred. Please contact support if the issue persists.',
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <ScrollView
        contentContainerClassName="flex-grow p-6"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full">
          <Text className="text-4xl font-semibold mb-2">Create an account</Text>
          <Text className="text-base text-gray-600 mb-6">
            Create an account to continue
          </Text>

          {/* Phone Number Field */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">
              Phone number
            </Text>
            <TextInput
              className={`w-full px-4 py-3 bg-white rounded-lg border ${
                errors.phoneNumber ? 'border-[#C82929]' : 'border-[#C4C4C4]'
              }`}
              placeholder="Enter your phone number"
              placeholderTextColor="#9CA3AF"
              value={user.phoneNumber}
              onChangeText={text =>
                dispatch(setUpdateAppUser({ ...user, phoneNumber: text }))
              }
              keyboardType="phone-pad"
              autoComplete="tel"
              editable={!loading}
            />
            {errors.phoneNumber ? (
              <Text className="text-[#C82929] text-xs mt-1">
                {errors.phoneNumber}
              </Text>
            ) : null}
          </View>

          {/* Password Field */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">
              Password
            </Text>
            <View className="relative">
              <TextInput
                className={`w-full px-4 py-3 bg-white rounded-lg border ${
                  errors.password ? 'border-[#C82929]' : 'border-[#C4C4C4]'
                } pr-12`}
                placeholder="Password"
                placeholderTextColor="rgba(0, 0, 0, 0.6)"
                value={user.password}
                onChangeText={text =>
                  dispatch(setUpdateAppUser({ ...user, password: text }))
                }
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="password"
                editable={!loading}
              />
              <TouchableOpacity
                onPress={togglePasswordVisibility}
                className="absolute right-4 top-3"
                disabled={loading}
              >
                {/* <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color="#666"
                /> */}
              </TouchableOpacity>
            </View>
            {errors.password ? (
              <Text className="text-[#C82929] text-xs mt-1">
                {errors.password}
              </Text>
            ) : null}
          </View>

          {/* Confirm Password Field */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">
              Confirm password
            </Text>
            <View className="relative">
              <TextInput
                className={`w-full px-4 py-3 bg-white rounded-lg border ${
                  errors.confirmPassword
                    ? 'border-[#C82929]'
                    : 'border-[#C4C4C4]'
                } pr-12`}
                placeholder="Confirm password"
                placeholderTextColor="rgba(0, 0, 0, 0.6)"
                value={user.confirmPassword}
                onChangeText={text =>
                  dispatch(setUpdateAppUser({ ...user, confirmPassword: text }))
                }
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoComplete="password"
                editable={!loading}
              />
              <TouchableOpacity
                onPress={toggleConfirmPasswordVisibility}
                className="absolute right-4 top-3"
                disabled={loading}
              >
                {/* <Ionicons
                  name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color="#666"
                /> */}
              </TouchableOpacity>
            </View>
            {errors.confirmPassword ? (
              <Text className="text-[#C82929] text-xs mt-1">
                {errors.confirmPassword}
              </Text>
            ) : null}
          </View>

          {/* Continue Button */}
          <TouchableOpacity
            onPress={handleContinue}
            className={`mt-2 h-12 rounded-lg justify-center items-center ${
              loading ? 'bg-gray-400' : 'bg-[#5B2EC4]'
            }`}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-white text-base font-semibold">Next</Text>
            )}
          </TouchableOpacity>

          {/* Login Link */}
          <View className="mt-4 flex-row justify-center">
            <Text className="text-sm text-gray-700">
              Already have an account?{' '}
            </Text>
            <TouchableOpacity
              onPress={() => {
                // Navigate to login screen
                // navigation.navigate('Login');
              }}
            >
              <Text className="text-sm text-gray-700 underline">
                Login here
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default PhoneAndPassword;

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
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/navigation';
import Toast from 'react-native-toast-message';


type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Register'>;

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
  const navigation = useNavigation<NavigationProp>();

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () =>
    setShowConfirmPassword(!showConfirmPassword);

  const validate = () => {
    let tempErrors: {
      phoneNumber?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!user.phoneNumber.trim()) {
      tempErrors.phoneNumber = 'Phone number is required';
    } else if (!/^\d+$/.test(user.phoneNumber)) {
      tempErrors.phoneNumber = 'Invalid phone number (digits only)';
    } else if (!/^\d{10,15}$/.test(user.phoneNumber)) {
      tempErrors.phoneNumber = 'Enter a valid phone number';
    }

    if (!user.password.trim()) {
      tempErrors.password = 'Password is required';
    } else if (user.password.length < 6) {
      tempErrors.password = 'Password must be at least 6 characters';
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
      // const formattedPhone = `+${user.phoneNumber.replace(/\s/g, '')}`;
      // await checkPhoneNumber(formattedPhone);

      // const confirmation = await auth().signInWithPhoneNumber(formattedPhone);

      // if (!confirmation?.verificationId)
      //   throw new Error('No verification ID received');

      Toast.show({
  type: 'success', 
  text1: 'OTP Sent',
  text2: 'Enter the code to verify your phone number.',
});
      // dispatch(setOtpVerificationId(confirmation.verificationId));
      dispatch(setCurrentStep(RegisterSteps.PhoneVerification));
    } catch (e: any) {
      showAlert('Error', e?.message || 'Failed to send OTP');
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
        contentContainerStyle={{ flexGrow: 1, padding: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-4xl font-semibold mb-2">Create an account</Text>
        <Text className="text-base text-gray-600 mb-6">
          Create an account to continue
        </Text>

        {/* Phone */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1">
            Phone number
          </Text>
          <TextInput
            className={`w-full px-4 py-3 rounded-lg border ${
              errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter your phone number"
            placeholderTextColor="#9CA3AF"
            value={user.phoneNumber}
            onChangeText={text =>
              dispatch(setUpdateAppUser({ ...user, phoneNumber: text }))
            }
            keyboardType="phone-pad"
            editable={!loading}
          />
          {errors.phoneNumber && (
            <Text className="text-red-500 text-xs mt-1">
              {errors.phoneNumber}
            </Text>
          )}
        </View>

        {/* Password */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1">
            Password
          </Text>
          <View className="relative">
            <TextInput
              className={`w-full px-4 py-3 rounded-lg border ${
                errors.password ? 'border-red-500' : 'border-gray-300'
              } pr-12`}
              placeholder="Password"
              value={user.password}
              onChangeText={text =>
                dispatch(setUpdateAppUser({ ...user, password: text }))
              }
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              editable={!loading}
            />
            <TouchableOpacity
              onPress={togglePasswordVisibility}
              className="absolute right-3 top-3"
            >
              <Feather
                name={showPassword ? 'eye-off' : 'eye'}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          </View>
          {errors.password && (
            <Text className="text-red-500 text-xs mt-1">{errors.password}</Text>
          )}
        </View>

        {/* Confirm Password */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1">
            Confirm password
          </Text>
          <View className="relative">
            <TextInput
              className={`w-full px-4 py-3 rounded-lg border ${
                errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
              } pr-12`}
              placeholder="Confirm password"
              value={user.confirmPassword}
              onChangeText={text =>
                dispatch(setUpdateAppUser({ ...user, confirmPassword: text }))
              }
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              editable={!loading}
            />
            <TouchableOpacity
              onPress={toggleConfirmPasswordVisibility}
              className="absolute right-3 top-3"
            >
              <Feather
                name={showConfirmPassword ? 'eye-off' : 'eye'}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          </View>
          {errors.confirmPassword && (
            <Text className="text-red-500 text-xs mt-1">
              {errors.confirmPassword}
            </Text>
          )}
        </View>

        {/* Continue */}
        <TouchableOpacity
          onPress={handleContinue}
          className={`mt-2 h-12 rounded-lg justify-center items-center ${
            loading ? 'bg-gray-400' : 'bg-[#5B2EC4]'
          }`}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-white text-base font-semibold">Next</Text>
          )}
        </TouchableOpacity>

        {/* Login link */}
        <View className="mt-4 flex-row justify-center">
          <Text className="text-sm text-gray-700">Already have an account? </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
          >
            <Text className="text-sm text-[#5B2EC4] underline">Login here</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default PhoneAndPassword;

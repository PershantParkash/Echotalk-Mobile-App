import { useState } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import * as Types from '../../store/user/user.types';

const PhoneAndPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{
    phoneNumber?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.user);

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

  const handleNext = () => {
    if (validate()) {
      console.log('Validation passed');
    }
  };

  const updateUser = (field: keyof typeof user, value: string) => {
    dispatch({
      type: Types.SET_UPDATE_APP_USER,
      payload: {
        ...user,
        [field]: value,
      },
    });
  };

  return (
    <View className="flex-1 items-center p-6 bg-white">
      <View className="w-full max-w-[400px]">
        <Text className="text-4xl font-semibold mb-2 text-center">
          Create Account
        </Text>
        <Text className="text-base text-gray-600 mb-6 text-left">
          Enjoy the various best courses we have, choose the category according
          to your wishes.
        </Text>

        {/* Phone Number Field */}
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
            value={user.phoneNumber}
            onChangeText={text => {
              updateUser('phoneNumber', text);
              if (errors.phoneNumber) setErrors({ ...errors, phoneNumber: '' });
            }}
            keyboardType="phone-pad"
            autoComplete="tel"
            editable={!isLoading}
          />
          {errors.phoneNumber ? (
            <Text className="text-red-500 text-xs mt-1">{errors.phoneNumber}</Text>
          ) : null}
        </View>

        {/* Password Field */}
        <View className="mb-4">
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
              value={user.password}
              onChangeText={text => {
                updateUser('password', text);
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
            <Text className="text-red-500 text-xs mt-1">{errors.password}</Text>
          ) : null}
        </View>

        {/* Confirm Password Field */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Confirm Password
          </Text>
          <View className="relative">
            <TextInput
              className={`w-full p-4 bg-gray-50 rounded-lg border ${
                errors.confirmPassword ? 'border-red-500' : 'border-gray-200'
              } pr-12`}
              placeholder="Confirm your password"
              placeholderTextColor="#9CA3AF"
              value={user.confirmPassword}
              onChangeText={text => {
                updateUser('confirmPassword', text);
                if (errors.confirmPassword)
                  setErrors({ ...errors, confirmPassword: '' });
              }}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoComplete="password"
              editable={!isLoading}
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-4"
              disabled={isLoading}
            >
              <Text className="text-[#5B2EC4] font-medium">
                {showConfirmPassword ? 'Hide' : 'Show'}
              </Text>
            </TouchableOpacity>
          </View>
          {errors.confirmPassword ? (
            <Text className="text-red-500 text-xs mt-1">
              {errors.confirmPassword}
            </Text>
          ) : null}
        </View>

        <TouchableOpacity
          onPress={handleNext}
          style={{
            marginTop: 16,
            height: 48,
            borderRadius: 8,
            backgroundColor: '#5B2EC4',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          disabled={isLoading}
        >
          <Text className="text-white text-base font-semibold">Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default PhoneAndPassword;
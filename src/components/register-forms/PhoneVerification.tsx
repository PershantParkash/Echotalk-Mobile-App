import { useState } from 'react';
import { Text, View, TouchableOpacity, Dimensions, TextInput } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {
  setCurrentStep,
  setUpdateAppUser,
} from '../../store/user/user.actions';
import { RootState } from '../../store';
import { AccountType, RegisterSteps } from '../../store/user/user.types';
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons';
import Feather from 'react-native-vector-icons/Feather';

const PhoneVerification = () => {
  const { user } = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch();
  const handleNext = () => {
    dispatch(setCurrentStep(RegisterSteps.UserType));
  };

  return (
     <View className="flex-1 justify-center items-center px-6 bg-white">
      <View className="w-full max-w-[400px]">
        <View className="mt-4 h-22 justify-center">
          <MaterialIcons
            name="arrow-back-ios"
            size={24}
            color="#000"
            className="absolute left-4"
          />

          <Text className="text-4xl font-semibold text-center">
            Phone Number Verification
          </Text>
        </View>

        <Text className="text-base text-gray-600 mt-4 mb-4 text-center">
         OTP verification code has been sent to your provide mobile number +44******0074
        </Text>
 <Text className="text-base font-medium text-gray-700 mb-2">
              Enter OTP
            </Text>
        <TextInput
        placeholder="Enter your OTP"
        className='bg-gray-100 py-4 px-4'
        />
 <Text className="text-xs font-medium text-gray-700 mt-1">
              Resend Code
            </Text>

        <TouchableOpacity
          onPress={handleNext}
          disabled={!user.accountType}
          className={`mt-4 h-12 rounded-lg justify-center items-center ${
            user.accountType ? 'bg-[#5B2EC4]' : 'bg-gray-300'
          }`}
        >
          <Text className="text-white text-base font-semibold">Verify</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default PhoneVerification;

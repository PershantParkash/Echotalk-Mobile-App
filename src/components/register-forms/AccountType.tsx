import { useState } from 'react';
import { Text, View, TouchableOpacity, Dimensions } from 'react-native';
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

const AccountTypeForm = () => {
  const { user } = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch();
  const handleNext = () => {
    dispatch(setCurrentStep(RegisterSteps.UserType));
  };

  return (
     <View className="flex-1 justify-center items-center px-6 bg-white">
      <View className="w-full max-w-[400px]">
        <View className="mt-4 h-12 justify-center">
          <MaterialIcons
            name="arrow-back-ios"
            size={24}
            color="#000"
            className="absolute left-4"
          />

          <Text className="text-4xl font-semibold text-center">
            Account type
          </Text>
        </View>

        <Text className="text-base text-gray-600 mb-6 text-center">
          Choose an account type to proceed
        </Text>

        <TouchableOpacity
          onPress={() =>
            dispatch(
              setUpdateAppUser({
                ...user,
                accountType: AccountType.Individual,
              }),
            )
          }
          className={`mb-4 h-[108px] rounded-lg p-5 flex-row items-center bg-white shadow-sm ${
            user.accountType === AccountType.Individual ? 'border border-[#5B2EC4]' : ''
          }`}
        >
          <View className="w-11 h-11 rounded-full justify-center items-center mr-3">
            <SimpleLineIcons name="user" size={24}  color={user.accountType === AccountType.Individual ? '#5B2EC4' : '#666666'} />
          </View>
          
          <View className="flex-1">
            <Text
              className="text-lg font-semibold mb-1"
              style={{
                color: user.accountType === AccountType.Individual ? '#5B2EC4': '#666666',
              }}
            >
              Individual
            </Text>
            <Text
              className="text-sm"
              style={{
                color:  user.accountType === AccountType.Individual  ? '#5B2EC4' : '#666666',
              }}
            >
              Offer or avail services
            </Text>
          </View>
        </TouchableOpacity>

        <View className="h-[108px] rounded-lg p-5 flex-row items-center bg-gray-100 shadow-sm opacity-60 relative">
          <View className="w-11 h-11 rounded-full justify-center items-center mr-3">
            <Feather name="users" size={26} color="#4B5563" />
          </View>
          <View className="flex-1">
            <View className="flex-row justify-between items-start mb-1">
              <Text className="text-lg font-semibold text-gray-800">
                Organization
              </Text>
              <View className="bg-[#FF4444] px-2 py-1 rounded-xl">
                <Text className="text-xs text-white font-medium">
                  Coming soon
                </Text>
              </View>
            </View>
            <Text className="text-sm text-gray-600">
              Add and manage team members
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleNext}
          disabled={!user.accountType}
          className={`mt-4 h-12 rounded-lg justify-center items-center ${
            user.accountType ? 'bg-[#5B2EC4]' : 'bg-gray-300'
          }`}
        >
          <Text className="text-white text-base font-semibold">Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default AccountTypeForm;

import { useState } from 'react';
import { Text, View, TouchableOpacity, Dimensions, Image } from 'react-native';
import { RegisterSteps, UserType } from '../../store/user/user.types';
import { useSelector, useDispatch } from 'react-redux';
import {
  setCurrentStep,
  setUpdateAppUser,
} from '../../store/user/user.actions';
import { RootState } from '../../store';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons';
import TrainerIcon from '../../assets/TrainerIcon.svg';
import TrainerIconSelected from '../../assets/TrainerIconSelected.svg';

const UserTypeForm = () => {
  const { user } = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch();
  const handleNext = () => {
    dispatch(setCurrentStep(RegisterSteps.PhonePassword));
  };

  const handleBack = () => {
    dispatch(setCurrentStep(RegisterSteps.AccountType));
  };

  return (
    <View className="flex-1 justify-center items-center px-6 bg-white">
      <View className="w-full max-w-[400px]">
        <View className="mt-4 h-12 justify-center">
          <TouchableOpacity
            onPress={handleBack}
            className="absolute  top-1/2 -translate-y-1/2 p-3 z-50"
            activeOpacity={0.7}
          >
            <Image
              source={require('../../assets/Badges Arrow.png')}
              className="w-10 h-10"
              resizeMode="contain"
            />
          </TouchableOpacity>

          <Text className="text-4xl font-semibold text-center">User Type</Text>
        </View>
        <Text className="text-base text-gray-600 mb-6 text-center">
          Choose an account type to proceed
        </Text>

        <TouchableOpacity
          onPress={() =>
            dispatch(setUpdateAppUser({ ...user, userType: UserType.Regular }))
          }
          className={`mb-4 h-[108px] rounded-lg p-5 flex-row items-center bg-white shadow-sm ${
            user.userType === UserType.Regular ? 'border border-[#5B2EC4]' : ''
          }`}
        >
          <View className="w-11 h-11 rounded-full justify-center items-center mr-3">
            <SimpleLineIcons
              name="user"
              size={24}
              color={user.userType === UserType.Regular ? '#5B2EC4' : '#666666'}
            />
          </View>
          <View className="flex-1">
            <Text
              className="text-lg font-semibold mb-1"
              style={{
                color:
                  user.userType === UserType.Regular ? '#5B2EC4' : '#000000',
              }}
            >
              User
            </Text>
            <Text
              className="text-sm"
              style={{
                color:
                  user.userType === UserType.Regular ? '#5B2EC4' : '#666666',
              }}
            >
              Explore courses and speak sign language
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() =>
            dispatch(setUpdateAppUser({ ...user, userType: UserType.Trainer }))
          }
          className={`mb-4 h-[108px] rounded-lg p-5 flex-row items-center bg-white shadow-sm ${
            user.userType === UserType.Trainer ? 'border border-[#5B2EC4]' : ''
          }`}
        >
          <View
            className={`w-11 h-11 rounded-full justify-center items-center mr-3 `}
          >
            {user.userType === UserType.Trainer ? (
              <TrainerIconSelected width={26} height={26} />
            ) : (
              <TrainerIcon width={26} height={26} />
            )}
          </View>
          <View className="flex-1">
            <Text
              className="text-lg font-semibold mb-1"
              style={{
                color:
                  user.userType === UserType.Trainer ? '#5B2EC4' : '#000000',
              }}
            >
              Trainer
            </Text>
            <Text
              className="text-sm"
              style={{
                color:
                  user.userType === UserType.Trainer ? '#5B2EC4' : '#666666',
              }}
            >
              Create and teach courses to help other learn.
            </Text>
          </View>
        </TouchableOpacity>

        {/* Next Button */}
        <TouchableOpacity
          onPress={handleNext}
          disabled={!user.userType}
          className={`mt-4 h-12 rounded-lg justify-center items-center ${
            user.userType ? 'bg-[#5B2EC4]' : 'bg-gray-300'
          }`}
        >
          <Text className="text-white text-base font-semibold">Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default UserTypeForm;

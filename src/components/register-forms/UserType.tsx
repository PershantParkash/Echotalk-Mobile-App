import { useState } from 'react';
import { Text, View, TouchableOpacity, Dimensions } from 'react-native';
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

  return (
    //     <View className="flex-1 justify-center items-center px-6 bg-white">
    //       <View className="w-full max-w-[400px]">
    //         <View className="mt-4 h-12 justify-center">
    //           <MaterialIcons
    //             name="arrow-back-ios"
    //             size={24}
    //             color="#000"
    //             className="absolute left-4"
    //           />

    //           <Text className="text-4xl font-semibold text-center">User Type</Text>
    //         </View>
    //         <Text className={`text-base text-gray-600 mb-6 text-center`}>
    //           Choose an account type to proceed
    //         </Text>

    //         <TouchableOpacity
    //           onPress={() =>
    //             dispatch(setUpdateAppUser({ ...user, userType: UserType.Regular }))
    //           }
    //           className="mb-4"
    //           style={{
    //             height: 108,
    //             borderRadius: 8,
    //             padding: 20,
    //             flexDirection: 'row',
    //             alignItems: 'center',
    //             borderWidth: user.userType === UserType.Regular ? 1 : 0,
    //             borderColor:
    //               user.userType === UserType.Regular ? '#5B2EC4' : 'transparent',
    //             backgroundColor: '#FFFFFF',
    //             shadowColor: '#000',
    //             shadowOffset: { width: 1, height: 1 },
    //             shadowOpacity: 0.1,
    //             shadowRadius: 10,
    //             elevation: 3,
    //           }}
    //         >
    //           <View
    //             style={{
    //               width: 44,
    //               height: 44,
    //               borderRadius: 22,
    //               justifyContent: 'center',
    //               alignItems: 'center',
    //               marginRight: 12,

    //             }}
    //           >
    //            <SimpleLineIcons name="user" size={24}  color={user.userType === UserType.Regular ? '#5B2EC4' : '#666666'} />
    //           </View>
    //           <View className="flex-1">
    //             <Text
    //               className="text-lg font-semibold mb-1"
    //               style={{
    //                 color: user.userType === 'User' ? '#5B2EC4' : '#000000',
    //               }}
    //             >
    //               User
    //             </Text>
    //             <Text
    //               className="text-sm"
    //               style={{
    //                 color: user.userType === 'User' ? '#5B2EC4' : '#666666',
    //               }}
    //             >
    //               Explore courses and speak sign language
    //             </Text>
    //           </View>
    //         </TouchableOpacity>

    //         <TouchableOpacity
    //           onPress={() =>
    //             dispatch(setUpdateAppUser({ ...user, userType: UserType.Trainer }))
    //           }
    //           className="mb-4"
    //           style={{
    //             height: 108,
    //             borderRadius: 8,
    //             padding: 20,
    //             flexDirection: 'row',
    //             alignItems: 'center',
    //             borderWidth: user.userType === 'Trainer' ? 1 : 0,
    //             borderColor:
    //               user.userType === 'Trainer' ? '#5B2EC4' : 'transparent',
    //             backgroundColor: '#FFFFFF',
    //             shadowColor: '#000',
    //             shadowOffset: { width: 1, height: 1 },
    //             shadowOpacity: 0.1,
    //             shadowRadius: 10,
    //             elevation: 3,
    //           }}
    //         >
    //           <View
    //             style={{
    //               width: 44,
    //               height: 44,
    //               borderRadius: 22,
    //               justifyContent: 'center',
    //               alignItems: 'center',
    //               marginRight: 12,
    //               borderWidth: 1,
    //               borderColor: user.userType === 'Trainer' ? '#5B2EC4' : '#00A896',
    //               // backgroundColor: selectedType === 'User'
    //               //   ? '#00A896'
    //               //   : '#FFFFFF',
    //             }}
    //           >
    //            <TrainerIcon
    //   width={24}
    //   height={24}
    //   // fill={user.userType === UserType.Trainer ? '#5B2EC4' : '#666666'}
    // />
    //           </View>
    //           <View className="flex-1">
    //             <Text
    //               className="text-lg font-semibold mb-1"
    //               style={{
    //                 color: user.userType === 'Trainer' ? '#5B2EC4' : '#000000',
    //               }}
    //             >
    //               Trainer
    //             </Text>
    //             <Text
    //               className="text-sm"
    //               style={{
    //                 color: user.userType === 'Trainer' ? '#5B2EC4' : '#666666',
    //               }}
    //             >
    //               Create and teach courses to help other learn.
    //             </Text>
    //           </View>
    //         </TouchableOpacity>

    //         {/* Next Button */}
    //         <TouchableOpacity
    //           onPress={handleNext}
    //           disabled={!user.userType}
    //           style={{
    //             marginTop: 16,
    //             height: 48,
    //             borderRadius: 8,
    //             backgroundColor: user.userType ? '#5B2EC4' : '#CCCCCC',
    //             justifyContent: 'center',
    //             alignItems: 'center',
    //           }}
    //         >
    //           <Text className="text-white text-base font-semibold">Continue</Text>
    //         </TouchableOpacity>
    //       </View>
    //     </View>
    <View className="flex-1 justify-center items-center px-6 bg-white">
      <View className="w-full max-w-[400px]">
        <View className="mt-4 h-12 justify-center">
          <MaterialIcons
            name="arrow-back-ios"
            size={24}
            color="#000"
            style={{ position: 'absolute', left: 16 }}
          />

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

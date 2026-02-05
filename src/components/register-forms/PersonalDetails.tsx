import { useState } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  PermissionsAndroid,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import {
  setCurrentStep,
  setUpdateAppUser,
} from '../../store/user/user.actions';
import { RegisterSteps, UserType } from '../../store/user/user.types';
import useUsersService from '../../services/user';
import Toast from 'react-native-toast-message';
import ImagePicker from 'react-native-image-crop-picker'; // Add this import
import Feather from 'react-native-vector-icons/Feather';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/navigation';
import { useNavigation } from '@react-navigation/native';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;

const PersonalDetails = () => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    profileImage?: string;
  }>({});

  const { user } = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch();
  const { updateUser } = useUsersService();
  const navigation = useNavigation<NavigationProp>();
  const handleImagePick = async () => {
    try {
      const image = await ImagePicker.openPicker({
        width: 400,
        height: 400,
        cropping: true,
        cropperCircleOverlay: true,
        compressImageQuality: 0.8,
        mediaType: 'photo',
      });

      Toast.show({
        type: 'info',
        text1: 'Uploading...',
        text2: 'Please wait while we upload your image.',
      });

      // TODO: Replace with your actual upload logic
      // const uploadedUrl = await uploadToS3(image);
      
      dispatch(setUpdateAppUser({ ...user, image: image.path }));
      
      Toast.show({
        type: 'success',
        text1: 'Image Selected',
        text2: 'Profile image uploaded successfully.',
      });
    } catch (error: any) {
      if (error.code !== 'E_PICKER_CANCELLED') {
        console.error('ImagePicker Error: ', error);
        Toast.show({
          type: 'error',
          text1: 'Upload Failed',
          text2: 'Failed to select image.',
        });
      }
    }
  };

  const validate = () => {
    let tempErrors: {
      firstName?: string;
      lastName?: string;
      email?: string;
      profileImage?: string;
    } = {};

    if (!user.firstName?.trim()) {
      tempErrors.firstName = 'First name is required';
    }

    if (!user.lastName?.trim()) {
      tempErrors.lastName = 'Last name is required';
    }

    if (!user.email?.trim()) {
      tempErrors.email = 'Email is required';
    } else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(user.email)) {
      tempErrors.email = 'Enter a valid email address';
    }

    if (!user.image) {
      tempErrors.profileImage = 'Profile image is required';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);

    try {
      const updateUserData = {
        fullName: `${user.firstName} ${user.lastName}`,
        email: user.email,
        profileImage: user.image || '',
      };

      const updatedUser = await updateUser(updateUserData);

      Toast.show({
        type: 'success',
        text1: 'Profile Updated',
        text2: 'Your profile details have been saved successfully.',
      });

      if (user.userType === UserType.Trainer) {
        dispatch(setCurrentStep(RegisterSteps.Education));
      } else {
         navigation.replace('MainTabs', { screen: 'HomeTab' });
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: error?.message || 'Profile update failed. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    dispatch(setCurrentStep(RegisterSteps.PhoneVerification));
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="mt-4 h-12 justify-center">
          <TouchableOpacity
            onPress={handleBack}
            className="absolute top-1/2 -translate-y-1/2 p-3 z-50"
            activeOpacity={0.7}
          >
            <Image
              source={require('../../assets/Badges Arrow.png')}
              className="w-10 h-10"
              resizeMode="contain"
            />
          </TouchableOpacity>

          <Text className="text-4xl font-semibold text-center">
            Personal Details
          </Text>
        </View>

        <Text className="text-base text-gray-600 mb-6 px-6 text-center">
          Add Personal Details To Continue
        </Text>

        {/* Profile Image */}
        <View className="items-center mb-6">
          <TouchableOpacity
            onPress={handleImagePick}
            activeOpacity={0.7}
            className="relative"
          >
            <View
              className={`w-32 h-32 rounded-full bg-gray-300 items-center justify-center ${
                errors.profileImage ? 'border-2 border-red-500' : ''
              }`}
            >
              {user.image ? (
                <Image
                  source={{ uri: user.image }}
                  className="w-full h-full rounded-full"
                  resizeMode="cover"
                />
              ) : (
                <Feather name="user" size={48} color="#9CA3AF" />
              )}
            </View>

            {/* Camera Icon */}
            <View className="absolute bottom-0 right-0 bg-[#5B2EC4] w-10 h-10 rounded-full items-center justify-center border-2 border-white">
              <Feather name="camera" size={20} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          {errors.profileImage && (
            <Text className="text-red-500 text-xs mt-2">
              {errors.profileImage}
            </Text>
          )}
        </View>

        {/* First Name */}
        <View className="mb-4 px-6">
          <Text className="text-sm font-medium text-gray-700 mb-1">
            First Name
          </Text>
          <View className="relative">
            <View className="absolute left-4 top-3 z-10">
              <Feather name="user" size={20} color="#9CA3AF" />
            </View>
            <TextInput
              className={`w-full pl-12 pr-4 py-3 rounded-lg border ${
                errors.firstName ? 'border-red-500' : 'border-gray-300'
              } bg-gray-50`}
              placeholder="Madhinn"
              placeholderTextColor="#9CA3AF"
              value={user.firstName}
              onChangeText={(text) =>
                dispatch(setUpdateAppUser({ ...user, firstName: text }))
              }
              editable={!loading}
            />
          </View>
          {errors.firstName && (
            <Text className="text-red-500 text-xs mt-1">
              {errors.firstName}
            </Text>
          )}
        </View>

        {/* Last Name */}
        <View className="mb-4 px-6">
          <Text className="text-sm font-medium text-gray-700 mb-1">
            Last Name
          </Text>
          <View className="relative">
            <View className="absolute left-4 top-3 z-10">
              <Feather name="user" size={20} color="#9CA3AF" />
            </View>
            <TextInput
              className={`w-full pl-12 pr-4 py-3 rounded-lg border ${
                errors.lastName ? 'border-red-500' : 'border-gray-300'
              } bg-gray-50`}
              placeholder="Asghar"
              placeholderTextColor="#9CA3AF"
              value={user.lastName}
              onChangeText={(text) =>
                dispatch(setUpdateAppUser({ ...user, lastName: text }))
              }
              editable={!loading}
            />
          </View>
          {errors.lastName && (
            <Text className="text-red-500 text-xs mt-1">
              {errors.lastName}
            </Text>
          )}
        </View>

        {/* Email */}
        <View className="mb-4 px-6">
          <Text className="text-sm font-medium text-gray-700 mb-1">Email</Text>
          <View className="relative">
            <View className="absolute left-4 top-3 z-10">
              <Feather name="mail" size={20} color="#9CA3AF" />
            </View>
            <TextInput
              className={`w-full pl-12 pr-12 py-3 rounded-lg border ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              } bg-gray-50`}
              placeholder="Madhinnasrghar@gmail.com"
              placeholderTextColor="#9CA3AF"
              value={user.email}
              onChangeText={(text) =>
                dispatch(setUpdateAppUser({ ...user, email: text }))
              }
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
            {user.email && !errors.email && (
              <View className="absolute right-4 top-3">
                <Feather name="check" size={20} color="#5B2EC4" />
              </View>
            )}
          </View>
          {errors.email && (
            <Text className="text-red-500 text-xs mt-1">{errors.email}</Text>
          )}
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          className={`mt-6 h-12 rounded-lg justify-center items-center mx-6 ${
            loading ? 'bg-gray-400' : 'bg-[#5B2EC4]'
          }`}
          disabled={loading}
          activeOpacity={0.7}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-white text-base font-semibold">
              Continue
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default PersonalDetails;
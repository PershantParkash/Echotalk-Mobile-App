import { useState } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  PermissionsAndroid,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import {
  clearUser,
  setCurrentStep,
  setForceCompleteProfile,
  setOtpVerificationId,
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
import useS3Upload from '../../hooks/useS3Upload';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;

type PersonalDetailsProps = {
  /** When true, user must complete profile; disable back navigation to earlier steps. */
  forceComplete?: boolean;
};

const PersonalDetails = ({ forceComplete = false }: PersonalDetailsProps) => {
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [pendingProfileImage, setPendingProfileImage] = useState<{
    uri: string;
    fileName: string;
    mimeType: string;
    fileSize: number | null;
  } | null>(null);
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
  const { uploadImageFromUri } = useS3Upload();

  const resetRegistrationState = () => {
    dispatch(clearUser());
    dispatch(setOtpVerificationId(''));
    dispatch(setCurrentStep(RegisterSteps.AccountType));
    dispatch(setForceCompleteProfile(false));
  };

  const ensureAndroidGalleryPermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;
    try {
      const perms = PermissionsAndroid?.PERMISSIONS;
      const readMediaImages = perms?.READ_MEDIA_IMAGES as unknown as
        | string
        | undefined;
      const readExternalStorage = perms?.READ_EXTERNAL_STORAGE as unknown as
        | string
        | undefined;

      // Android 13+ uses READ_MEDIA_IMAGES, older uses READ_EXTERNAL_STORAGE.
      // Some RN versions don't expose READ_MEDIA_IMAGES; in that case we fall back,
      // and if nothing is available we don't block the picker.
      const permission =
        Platform.Version >= 33
          ? readMediaImages ?? readExternalStorage
          : readExternalStorage ?? readMediaImages;

      if (!permission?.length) return true;

      const has = await PermissionsAndroid.check(permission as any);
      if (has) return true;

      const status = await PermissionsAndroid.request(permission as any);
      // Note: Android may return RESULTS.GRANTED / DENIED / NEVER_ASK_AGAIN.
      // Some OEM builds (and iOS terminology) may surface 'limited' style values;
      // treat any non-denied truthy status conservatively.
      if (status === PermissionsAndroid.RESULTS.GRANTED) return true;
      if (status === PermissionsAndroid.RESULTS.DENIED) return false;
      if (status === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) return false;
      return !!status;
    } catch {
      return false;
    }
  };

  const handleImagePick = async () => {
    try {
      const ok = await ensureAndroidGalleryPermission();
      if (!ok) {
        Toast.show({
          type: 'error',
          text1: 'Permission required',
          text2: 'Please allow photo access to upload a profile image.',
        });
        return;
      }

      const image = await ImagePicker.openPicker({
        width: 400,
        height: 400,
        cropping: true,
        cropperCircleOverlay: true,
        compressImageQuality: 0.8,
        mediaType: 'photo',
      });

      // console.log('image', image)

      const localUri = image?.path?.trim?.() ?? '';
      if (!localUri?.length) {
        throw new Error('Could not read selected image path.');
      }

      // Show immediate preview; upload happens when user presses Continue.
      setErrors(prev => ({ ...prev, profileImage: undefined }));
      setPendingProfileImage({
        uri: localUri,
        fileName:
          image?.filename?.trim?.() ??
          image?.path?.split?.('/')?.pop?.() ??
          'profile.jpg',
        mimeType: image?.mime?.trim?.() ?? 'image/jpeg',
        fileSize: typeof image?.size === 'number' ? image.size : null,
      });
    } catch (error: any) {
      const code = error?.code ?? '';
      if (code === 'E_PICKER_CANCELLED') return;

      const message =
        error instanceof Error
          ? error.message
          : error?.message?.toString?.() || 'Failed to upload image. Try again.';

      Toast.show({
        type: 'error',
        text1: 'Image selection failed',
        text2: message,
      });
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

    const hasImage = !!pendingProfileImage?.uri?.length || !!user.image?.length;
    if (!hasImage) {
      tempErrors.profileImage = 'Profile image is required';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);

    try {
      let profileImageUrl = user.image?.trim?.() ?? '';

      if (pendingProfileImage?.uri?.trim?.()?.length) {
        setUploadingImage(true);
        Toast.show({
          type: 'info',
          text1: 'Uploading image...',
          text2: 'Please wait while we upload your profile picture.',
        });

        profileImageUrl = await uploadImageFromUri({
          uri: pendingProfileImage.uri,
          fileName: pendingProfileImage.fileName,
          mimeType: pendingProfileImage.mimeType,
          fileSize: pendingProfileImage.fileSize,
          kind: 'image',
        });

        dispatch(setUpdateAppUser({ ...user, image: profileImageUrl }));
        setPendingProfileImage(null);
      }

      const updateUserData = {
        fullName: `${user.firstName} ${user.lastName}`,
        email: user.email,
        profileImage: profileImageUrl || '',
      };

      await updateUser(updateUserData);

      Toast.show({
        type: 'success',
        text1: 'Profile Updated',
        text2: 'Your profile details have been saved successfully.',
      });

      if (forceComplete) {
        resetRegistrationState();
        dispatch(setForceCompleteProfile(false));
        navigation.replace('MainTabs', { screen: 'HomeTab' });
        return;
      }

      if (user.userType === UserType.Trainer) {
        dispatch(setCurrentStep(RegisterSteps.Education));
      } else {
        resetRegistrationState();
        navigation.replace('MainTabs', { screen: 'HomeTab' });
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: error?.message || 'Profile update failed. Please try again.',
      });
    } finally {
      setUploadingImage(false);
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (forceComplete) return;
    dispatch(setCurrentStep(RegisterSteps.PhoneVerification));
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        enableOnAndroid
        extraScrollHeight={20}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="mt-4 h-12 justify-center">
          {!forceComplete && (
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
          )}

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
            disabled={uploadingImage || loading}
            className="relative"
          >
            <View
              className={`w-32 h-32 rounded-full bg-gray-300 items-center justify-center ${errors.profileImage ? 'border-2 border-red-500' : ''
                }`}
            >
              {pendingProfileImage?.uri?.length || user.image ? (
                <Image
                  source={{ uri: pendingProfileImage?.uri ?? user.image }}
                  className="w-full h-full rounded-full"
                  resizeMode="cover"
                />
              ) : (
                <Feather name="user" size={48} color="#9CA3AF" />
              )}
            </View>

            {/* Camera Icon */}
            <View className="absolute bottom-0 right-0 bg-[#5B2EC4] w-10 h-10 rounded-full items-center justify-center border-2 border-white">
              {uploadingImage ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Feather name="camera" size={20} color="#FFFFFF" />
              )}
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
              className={`w-full pl-12 pr-4 py-3 rounded-lg border ${errors.firstName ? 'border-red-500' : 'border-gray-300'
                } bg-gray-50`}
              placeholder="First Name"
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
              className={`w-full pl-12 pr-4 py-3 rounded-lg border ${errors.lastName ? 'border-red-500' : 'border-gray-300'
                } bg-gray-50`}
              placeholder="Last Name"
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
              className={`w-full pl-12 pr-12 py-3 rounded-lg border ${errors.email ? 'border-red-500' : 'border-gray-300'
                } bg-gray-50`}
              placeholder="Email"
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
          className={`mt-6 h-12 rounded-lg justify-center items-center mx-6 ${loading ? 'bg-gray-400' : 'bg-[#5B2EC4]'
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
      </KeyboardAwareScrollView>
    </KeyboardAvoidingView>
  );
};

export default PersonalDetails;
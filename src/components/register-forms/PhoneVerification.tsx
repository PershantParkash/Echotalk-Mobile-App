// // import { useState } from 'react';
// // import {
// //   Text,
// //   View,
// //   TouchableOpacity,
// //   Dimensions,
// //   TextInput,
// //   Image,
// // } from 'react-native';
// // import { useSelector, useDispatch } from 'react-redux';
// // import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
// // import {
// //   setCurrentStep,
// //   setUpdateAppUser,
// // } from '../../store/user/user.actions';
// // import { RootState } from '../../store';
// // import { AccountType, RegisterSteps } from '../../store/user/user.types';
// // import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons';
// // import Feather from 'react-native-vector-icons/Feather';

// // const PhoneVerification = () => {
// //   const { user } = useSelector((state: RootState) => state.user);
// //   const dispatch = useDispatch();

// //     const validate = () => {
// //     let tempErrors: { otp?: string } = {};

// //     if (!user.otp) {
// //       tempErrors.otp =
// //         "OTP is required. Please enter the OTP sent to your phone.";
// //     } else if (user.otp?.length !== 6) {
// //       tempErrors.otp = "OTP must be exactly 6 digits.";
// //     }

// //     setErrors(tempErrors);
// //     return Object.keys(tempErrors)?.length === 0;
// //   };


// //    const handleVerifyOtp = async () => {
// //     if (!validate()) return;
// //     const credential = PhoneAuthProvider.credential(
// //       firebaseOtpVerificationId,
// //       user.otp
// //     );
// //     try {
// //       setLoading(true);
// //       await signInWithCredential(auth, credential);
// //       const response = await signup({
// //         phoneNumber: `+${user.phoneNumber}`,
// //         password: user.password,
// //         isTrainer: user.userType === UserType.Trainer,
// //       });
// //       dispatch(setUpdateAppUser({ ...user, otp: "" }));
// //       saveAccessTokenInLocalStorage(response.accessToken);
// //       saveRefreshTokenInCookie(response.refreshToken)
// //       dispatch(setCurrentStep(RegisterSteps.PersonalDetails));
// //     } catch (error: any) {
// //       toast.error("Invalid OTP. Please enter a valid 6-digit OTP.");
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   const handleBack = () => {
// //     dispatch(setCurrentStep(RegisterSteps.PhonePassword));
// //   };

// //   return (
// //     <View className="flex-1 justify-center items-center px-6 bg-white">
// //       <View className="w-full max-w-[400px]">
// //         <View className="mt-4 h-22 ">
// //           <TouchableOpacity onPress={handleBack} className="absolute ">
// //             <Image
// //               source={require('../../assets/Badges Arrow.png')}
// //               className="w-10 h-10 mr-8"
// //               resizeMode="contain"
// //             />
// //           </TouchableOpacity>

// //           <Text className="text-4xl font-semibold text-center">
// //             Phone Number Verification
// //           </Text>
// //         </View>

// //         <Text className="text-base text-gray-600 mt-4 mb-4 text-center">
// //           OTP verification code has been sent to your provide mobile number
// //           {user.phoneNumber}
// //         </Text>
// //         <Text className="text-base font-medium text-gray-700 mb-2">
// //           Enter OTP
// //         </Text>
// //         <TextInput
// //           placeholder="Enter your OTP"
// //           className="bg-gray-100 py-4 px-4"
// //         />
// //         <Text className="text-xs font-medium text-gray-700 mt-1">
// //           Resend Code
// //         </Text>

// //         <TouchableOpacity
// //           onPress={handleNext}
// //           disabled={!user.accountType}
// //           className={`mt-4 h-12 rounded-lg justify-center items-center ${
// //             user.accountType ? 'bg-[#5B2EC4]' : 'bg-gray-300'
// //           }`}
// //         >
// //           <Text className="text-white text-base font-semibold">Verify</Text>
// //         </TouchableOpacity>
// //       </View>
// //     </View>
// //   );
// // };

// // export default PhoneVerification;

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
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import {
  setCurrentStep,
  setUpdateAppUser,
  setOtpVerificationId,
} from '../../store/user/user.actions';
import { RegisterSteps, AccountType, UserType } from '../../store/user/user.types';
import useAuthService from '../../services/auth';
import auth from '@react-native-firebase/auth';
import Toast from 'react-native-toast-message';
import { saveTokens } from '../../utils/storage';

const PhoneVerification = () => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ otp?: string }>({});

const { user, firebaseOtpVerificationId } = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch();
  const { signup } = useAuthService();

  const validate = () => {
    let tempErrors: { otp?: string } = {};

    if (!user.otp?.trim()) {
      tempErrors.otp = 'OTP is required. Please enter the OTP sent to your phone.';
    } else if (!/^\d{6}$/.test(user.otp)) {
      tempErrors.otp = 'OTP must be exactly 6 digits.';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleVerifyOtp = async () => {
    if (!validate()) return;

    setLoading(true);

    try {
      if (!firebaseOtpVerificationId) {
        throw new Error('Verification ID not found. Please request OTP again.');
      }
      
      // Create credential using React Native Firebase
      const credential = auth.PhoneAuthProvider.credential(
        firebaseOtpVerificationId,
        user.otp
      );

      await auth().signInWithCredential(credential);
      

      const response = await signup({
        phoneNumber: `+${user.phoneNumber}`,
        password: user.password,
        isTrainer: user.userType === UserType.Trainer,
      });

      await saveTokens(response.accessToken, response.refreshToken);

      dispatch(setUpdateAppUser({ ...user, otp: '' }));
      dispatch(setCurrentStep(RegisterSteps.PersonalDetails));

      Toast.show({
        type: 'success',
        text1: 'Phone Verified',
        text2: 'Your phone number has been verified successfully.',
      });

    } catch (error: any) {
      console.error('OTP verification error:', error);

      if (error?.code === 'auth/invalid-verification-code') {
        Toast.show({
          type: 'error',
          text1: 'Invalid OTP',
          text2: 'Please enter a valid 6-digit OTP.',
        });
        setErrors({ otp: 'Invalid OTP code' });
      } else if (error?.code === 'auth/code-expired') {
        Toast.show({
          type: 'error',
          text1: 'OTP Expired',
          text2: 'The OTP has expired. Please request a new one.',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Verification Failed',
          text2: error?.message || 'An unexpected error occurred.',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setLoading(true);
      const formattedPhone = `+${user.phoneNumber.replace(/\s/g, '')}`;
      
      console.log('Resending OTP...');
      const confirmation = await auth().signInWithPhoneNumber(formattedPhone);

      if (!confirmation?.verificationId) {
        throw new Error('No verification ID received');
      }

      // Update verification ID in store and clear OTP
      dispatch(setOtpVerificationId(confirmation.verificationId));
      dispatch(setUpdateAppUser({ ...user, otp: '' }));

      Toast.show({
        type: 'success',
        text1: 'OTP Resent',
        text2: 'A new OTP has been sent to your phone.',
      });

    } catch (error: any) {
      console.error('Resend OTP error:', error);
      Toast.show({
        type: 'error',
        text1: 'Resend Failed',
        text2: error?.message || 'Failed to resend OTP.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    dispatch(setCurrentStep(RegisterSteps.PhonePassword));
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
            Phone Verification
          </Text>
        </View>

        <Text className="text-base text-gray-600 mb-6 px-6 text-center">
          OTP verification code has been sent to your provided mobile number{' '}
          <Text className="font-semibold">+{user.phoneNumber}</Text>
        </Text>

        {/* OTP Input */}
        <View className="mb-4 px-6">
          <Text className="text-sm font-medium text-gray-700 mb-1">
            Enter OTP
          </Text>
          <TextInput
            className={`w-full px-4 py-3 rounded-lg border ${
              errors.otp ? 'border-red-500' : 'border-gray-300'
            } text-center text-lg tracking-widest`}
            placeholder="000000"
            placeholderTextColor="#9CA3AF"
            value={user.otp}
            onChangeText={text =>
              dispatch(setUpdateAppUser({ ...user, otp: text }))
            }
            keyboardType="number-pad"
            maxLength={6}
            editable={!loading}
          />
          {errors.otp && (
            <Text className="text-red-500 text-xs mt-1">{errors.otp}</Text>
          )}
        </View>

        {/* Resend Code */}
        <View className="mb-6 px-6 flex-row justify-center">
          <Text className="text-sm text-gray-600">Didn't receive code? </Text>
          <TouchableOpacity onPress={handleResendOtp} disabled={loading}>
            <Text className="text-sm text-[#5B2EC4] font-semibold">
              Resend Code
            </Text>
          </TouchableOpacity>
        </View>

        {/* Verify Button */}
        <TouchableOpacity
          onPress={handleVerifyOtp}
          className={`mt-2 h-12 rounded-lg justify-center items-center mx-6 ${
            loading ? 'bg-gray-400' : 'bg-[#5B2EC4]'
          }`}
          disabled={loading}
          activeOpacity={0.7}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-white text-base font-semibold">Verify</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default PhoneVerification;


// import { useState } from 'react';
// import {
//   Text,
//   View,
//   TouchableOpacity,
//   TextInput,
//   ActivityIndicator,
//   KeyboardAvoidingView,
//   Platform,
//   ScrollView,
//   Image,
// } from 'react-native';
// import { useSelector, useDispatch } from 'react-redux';
// import { RootState } from '../../store';
// import {
//   setCurrentStep,
//   setOtpVerificationId,
//   setUpdateAppUser,
// } from '../../store/user/user.actions';
// import { RegisterSteps } from '../../store/user/user.types';
// import useAuthService from '../../services/auth';
// // REMOVED: import auth from '@react-native-firebase/auth';
// import Feather from 'react-native-vector-icons/Feather';
// import { useNavigation } from '@react-navigation/native';
// import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
// import { RootStackParamList } from '../../navigation/navigation';
// import Toast from 'react-native-toast-message';

// type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Register'>;

// const PhoneAndPassword = () => {
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [errors, setErrors] = useState<{
//     phoneNumber?: string;
//     password?: string;
//     confirmPassword?: string;
//   }>({});

//   const { checkPhoneNumber } = useAuthService();
//   const dispatch = useDispatch();
//   const { user } = useSelector((state: RootState) => state.user);
//   const navigation = useNavigation<NavigationProp>();

//   const togglePasswordVisibility = () => setShowPassword(!showPassword);
//   const toggleConfirmPasswordVisibility = () =>
//     setShowConfirmPassword(!showConfirmPassword);

//   const validate = () => {
//     let tempErrors: {
//       phoneNumber?: string;
//       password?: string;
//       confirmPassword?: string;
//     } = {};

//     if (!user.phoneNumber.trim()) {
//       tempErrors.phoneNumber = 'Phone number is required';
//     } else if (!/^\d+$/.test(user.phoneNumber)) {
//       tempErrors.phoneNumber = 'Invalid phone number (only digits allowed)';
//     } else if (!/^\d{10,15}$/.test(user.phoneNumber)) {
//       tempErrors.phoneNumber = 'Enter a valid phone number';
//     }

//     if (!user.password.trim()) {
//       tempErrors.password = 'Password is required';
//     } else if (user.password.length < 6) {
//       tempErrors.password = 'Password must be at least 6 characters';
//     } else if (!/[a-zA-Z]/.test(user.password)) {
//       tempErrors.password = 'Password must contain at least one letter';
//     } else if (!/[0-9]/.test(user.password)) {
//       tempErrors.password = 'Password must contain at least one number';
//     }

//     if (!user.confirmPassword.trim()) {
//       tempErrors.confirmPassword = 'Confirm password is required';
//     } else if (user.confirmPassword !== user.password) {
//       tempErrors.confirmPassword = 'Passwords do not match';
//     }

//     setErrors(tempErrors);
//     return Object.keys(tempErrors).length === 0;
//   };

//   const handleContinue = async () => {
//     if (!validate()) return;
//     setLoading(true);

//     try {
//       const formattedPhone = `+${user.phoneNumber.replace(/\s/g, '')}`;
      
//       console.log('===== REGISTRATION DEBUG =====');
//       console.log('Formatted phone:', formattedPhone);
//       console.log('Checking if phone exists...');
      
//       // Check if phone number already exists
//       await checkPhoneNumber(formattedPhone);
      
//       console.log('Phone check passed, phone is available');

//       // TODO: Replace this with actual Firebase/Backend OTP implementation
//       // For now, simulate OTP sent (remove this in production)
//       console.log('TEMPORARY: Simulating OTP send...');
      
//       // Generate a mock verification ID (TEMPORARY)
//       const mockVerificationId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
//       Toast.show({
//         type: 'success',
//         text1: 'OTP Sent',
//         text2: 'Enter the code to verify your phone number.',
//       });

//       console.log('Mock verification ID:', mockVerificationId);
      
//       dispatch(setOtpVerificationId(mockVerificationId));
//       dispatch(setCurrentStep(RegisterSteps.PhoneVerification));
      
//       console.log('===== END DEBUG =====');

//       /* 
//       // UNCOMMENT THIS WHEN FIREBASE IS INSTALLED:
      
//       const confirmation = await auth().signInWithPhoneNumber(formattedPhone);

//       if (!confirmation?.verificationId) {
//         throw new Error('No verification ID received');
//       }

//       Toast.show({
//         type: 'success',
//         text1: 'OTP Sent',
//         text2: 'Enter the code to verify your phone number.',
//       });

//       dispatch(setOtpVerificationId(confirmation.verificationId));
//       dispatch(setCurrentStep(RegisterSteps.PhoneVerification));
//       */

//     } catch (e: any) {
//       console.error('===== REGISTRATION ERROR =====');
//       console.error('Error:', e);
//       console.error('Error message:', e?.message);
//       console.error('Error code:', e?.code);
//       console.error('===== END ERROR =====');

//       // Handle specific errors
//       if (e?.message?.includes('already exists') || e === 'Error: Phone number already exists') {
//         Toast.show({
//           type: 'error',
//           text1: 'Phone Already Registered',
//           text2: 'Please log in or use a different number.',
//         });
//       } else if (e?.code === 'auth/invalid-phone-number') {
//         Toast.show({
//           type: 'error',
//           text1: 'Invalid Phone Number',
//           text2: 'Please enter a valid phone number.',
//         });
//       } else if (e?.code === 'auth/missing-phone-number') {
//         Toast.show({
//           type: 'error',
//           text1: 'Phone Number Required',
//           text2: 'Please enter your phone number.',
//         });
//       } else if (e?.code === 'auth/too-many-requests') {
//         Toast.show({
//           type: 'error',
//           text1: 'Too Many Attempts',
//           text2: 'Please try again later.',
//         });
//       } else {
//         Toast.show({
//           type: 'error',
//           text1: 'Error',
//           text2: e?.message || 'An unexpected error occurred. Please contact support.',
//         });
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleBack = () => {
//     dispatch(setCurrentStep(RegisterSteps.UserType));
//   };

//   return (
//     <KeyboardAvoidingView
//       behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//       className="flex-1 bg-white"
//     >
//       <ScrollView
//         contentContainerStyle={{ flexGrow: 1 }}
//         keyboardShouldPersistTaps="handled"
//       >
//         {/* Header with back button */}
//         <View className="mt-4 h-12 justify-center">
//           <TouchableOpacity
//             onPress={handleBack}
//             className="absolute top-1/2 -translate-y-1/2 p-3 z-50"
//             activeOpacity={0.7}
//           >
//             <Image
//               source={require('../../assets/Badges Arrow.png')}
//               className="w-10 h-10"
//               resizeMode="contain"
//             />
//           </TouchableOpacity>

//           <Text className="text-4xl font-semibold text-center">
//             Create account
//           </Text>
//         </View>

//         <Text className="text-base text-gray-600 mb-6 px-6 text-center">
//           Create an account to continue
//         </Text>

//         {/* Phone Number Input */}
//         <View className="mb-4 px-6">
//           <Text className="text-sm font-medium text-gray-700 mb-1">
//             Phone number
//           </Text>
//           <TextInput
//             className={`w-full px-4 py-3 rounded-lg border ${
//               errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
//             }`}
//             placeholder="Enter your phone number"
//             placeholderTextColor="#9CA3AF"
//             value={user.phoneNumber}
//             onChangeText={text =>
//               dispatch(setUpdateAppUser({ ...user, phoneNumber: text }))
//             }
//             keyboardType="phone-pad"
//             editable={!loading}
//           />
//           {errors.phoneNumber && (
//             <Text className="text-red-500 text-xs mt-1">
//               {errors.phoneNumber}
//             </Text>
//           )}
//         </View>

//         {/* Password Input */}
//         <View className="mb-4 px-6">
//           <Text className="text-sm font-medium text-gray-700 mb-1">
//             Password
//           </Text>
//           <View className="relative">
//             <TextInput
//               className={`w-full px-4 py-3 rounded-lg border ${
//                 errors.password ? 'border-red-500' : 'border-gray-300'
//               } pr-12`}
//               placeholder="Password"
//               placeholderTextColor="#9CA3AF"
//               value={user.password}
//               onChangeText={text =>
//                 dispatch(setUpdateAppUser({ ...user, password: text }))
//               }
//               secureTextEntry={!showPassword}
//               autoCapitalize="none"
//               editable={!loading}
//             />
//             <TouchableOpacity
//               onPress={togglePasswordVisibility}
//               className="absolute right-3 top-3"
//             >
//               <Feather
//                 name={showPassword ? 'eye' : 'eye-off'}
//                 size={20}
//                 color="#666"
//               />
//             </TouchableOpacity>
//           </View>
//           {errors.password && (
//             <Text className="text-red-500 text-xs mt-1">
//               {errors.password}
//             </Text>
//           )}
//         </View>

//         {/* Confirm Password Input */}
//         <View className="mb-4 px-6">
//           <Text className="text-sm font-medium text-gray-700 mb-1">
//             Confirm password
//           </Text>
//           <View className="relative">
//             <TextInput
//               className={`w-full px-4 py-3 rounded-lg border ${
//                 errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
//               } pr-12`}
//               placeholder="Confirm password"
//               placeholderTextColor="#9CA3AF"
//               value={user.confirmPassword}
//               onChangeText={text =>
//                 dispatch(setUpdateAppUser({ ...user, confirmPassword: text }))
//               }
//               secureTextEntry={!showConfirmPassword}
//               autoCapitalize="none"
//               editable={!loading}
//             />
//             <TouchableOpacity
//               onPress={toggleConfirmPasswordVisibility}
//               className="absolute right-3 top-3"
//             >
//               <Feather
//                 name={showConfirmPassword ? 'eye' : 'eye-off'}
//                 size={20}
//                 color="#666"
//               />
//             </TouchableOpacity>
//           </View>
//           {errors.confirmPassword && (
//             <Text className="text-red-500 text-xs mt-1">
//               {errors.confirmPassword}
//             </Text>
//           )}
//         </View>

//         {/* Continue Button */}
//         <TouchableOpacity
//           onPress={handleContinue}
//           className={`mt-2 h-12 rounded-lg justify-center items-center mx-6 ${
//             loading ? 'bg-gray-400' : 'bg-[#5B2EC4]'
//           }`}
//           disabled={loading}
//           activeOpacity={0.7}
//         >
//           {loading ? (
//             <ActivityIndicator color="#FFFFFF" />
//           ) : (
//             <Text className="text-white text-base font-semibold">Next</Text>
//           )}
//         </TouchableOpacity>

//         {/* Login Link */}
//         <View className="mt-4 flex-row justify-center">
//           <Text className="text-sm text-gray-700">
//             Already have an account?{' '}
//           </Text>
//           <TouchableOpacity onPress={() => navigation.navigate('Login')}>
//             <Text className="text-sm text-[#5B2EC4] font-semibold">
//               Login here
//             </Text>
//           </TouchableOpacity>
//         </View>
//       </ScrollView>
//     </KeyboardAvoidingView>
//   );
// };

// export default PhoneAndPassword;

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
  setOtpVerificationId,
  setUpdateAppUser,
} from '../../store/user/user.actions';
import { RegisterSteps } from '../../store/user/user.types';
import useAuthService from '../../services/auth';
import auth from '@react-native-firebase/auth';  // ← React Native Firebase
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

  const handleContinue = async () => {
    if (!validate()) return;
    setLoading(true);

    try {
      const formattedPhone = `+${user.phoneNumber.replace(/\s/g, '')}`;
      
      console.log('Checking if phone exists...');
      await checkPhoneNumber(formattedPhone);
      console.log('Phone check passed');

      console.log('Sending OTP via Firebase...');
      // THIS IS THE CORRECT WAY FOR REACT NATIVE
      const confirmation = await auth().signInWithPhoneNumber(formattedPhone);

      if (!confirmation?.verificationId) {
        throw new Error('No verification ID received');
      }

      console.log('OTP sent successfully!');
      
      Toast.show({
        type: 'success',
        text1: 'OTP Sent',
        text2: 'Enter the code to verify your phone number.',
      });

      dispatch(setOtpVerificationId(confirmation.verificationId));
      dispatch(setCurrentStep(RegisterSteps.PhoneVerification));

    } catch (e: any) {
      console.error('Registration error:', e);

      if (e?.message?.includes('already exists') || e === 'Error: Phone number already exists') {
        Toast.show({
          type: 'error',
          text1: 'Phone Already Registered',
          text2: 'Please log in or use a different number.',
        });
      } else if (e?.code === 'auth/invalid-phone-number') {
        Toast.show({
          type: 'error',
          text1: 'Invalid Phone Number',
          text2: 'Please enter a valid phone number.',
        });
      } else if (e?.code === 'auth/too-many-requests') {
        Toast.show({
          type: 'error',
          text1: 'Too Many Attempts',
          text2: 'Please try again later.',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: e?.message || 'An unexpected error occurred.',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    dispatch(setCurrentStep(RegisterSteps.UserType));
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
            Create account
          </Text>
        </View>

        <Text className="text-base text-gray-600 mb-6 px-6 text-center">
          Create an account to continue
        </Text>

        {/* Phone Number */}
        <View className="mb-4 px-6">
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
        <View className="mb-4 px-6">
          <Text className="text-sm font-medium text-gray-700 mb-1">
            Password
          </Text>
          <View className="relative">
            <TextInput
              className={`w-full px-4 py-3 rounded-lg border ${
                errors.password ? 'border-red-500' : 'border-gray-300'
              } pr-12`}
              placeholder="Password"
              placeholderTextColor="#9CA3AF"
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
                name={showPassword ? 'eye' : 'eye-off'}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          </View>
          {errors.password && (
            <Text className="text-red-500 text-xs mt-1">
              {errors.password}
            </Text>
          )}
        </View>

        {/* Confirm Password */}
        <View className="mb-4 px-6">
          <Text className="text-sm font-medium text-gray-700 mb-1">
            Confirm password
          </Text>
          <View className="relative">
            <TextInput
              className={`w-full px-4 py-3 rounded-lg border ${
                errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
              } pr-12`}
              placeholder="Confirm password"
              placeholderTextColor="#9CA3AF"
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
                name={showConfirmPassword ? 'eye' : 'eye-off'}
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

        {/* Continue Button */}
        <TouchableOpacity
          onPress={handleContinue}
          className={`mt-2 h-12 rounded-lg justify-center items-center mx-6 ${
            loading ? 'bg-gray-400' : 'bg-[#5B2EC4]'
          }`}
          disabled={loading}
          activeOpacity={0.7}
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
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text className="text-sm text-[#5B2EC4] font-semibold">
              Login here
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default PhoneAndPassword
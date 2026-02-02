import React, { useState } from 'react';
import {
  Text,
  View,
  Image,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import useAuthService from '../../services/auth';
import Toast from 'react-native-toast-message';
import { saveTokens } from '../../utils/storage';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/navigation';
import Feather from 'react-native-vector-icons/Feather';

type LoginScreenProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export default function LoginComponent() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{
    phoneNumber?: string;
    password?: string;
  }>({});

  const { signin, loading } = useAuthService();
  const navigation = useNavigation<LoginScreenProp>();

  const validate = () => {
    let tempErrors: { phoneNumber?: string; password?: string } = {};

    if (!phoneNumber) {
      tempErrors.phoneNumber = 'Phone number is required';
    } else if (!/^\d{10,15}$/.test(phoneNumber)) {
      tempErrors.phoneNumber = 'Enter a valid phone number (10-15 digits)';
    }

    if (!password) {
      tempErrors.password = 'Password is required';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    try {
      const response = await signin({
        phoneNumber: `+${phoneNumber}`,
        password,
      });

      if (response) {
        await saveTokens(response.accessToken, response.refreshToken);
        
        Toast.show({
          type: 'success',
          text1: 'Login successful',
          text2: 'Welcome back! 🎉',
        });

       navigation.replace('MainTabs', { screen: 'HomeTab' });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Login Failed',
          text2: 'Invalid phone number or password',
        });
      }
    } catch (err: any) {
      console.error('Login error:', err);
      
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: err.message || 'Invalid phone number or password',
      });
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 items-center justify-center bg-[#5B2EC4]">
          <Image
            source={require('../../assets/decorator1.png')}
            className="absolute right-0 top-20"
            resizeMode="contain"
          />
          <Image
            source={require('../../assets/decorator2.png')}
            className="absolute left-0 bottom-0"
            resizeMode="contain"
          />
          <Image
            source={require('../../assets/decorator3.png')}
            className="absolute left-0 top-0"
            resizeMode="contain"
          />

          <View className="absolute top-0 w-full h-[40%] items-center justify-center">
            <Image
              source={require('../../assets/AuthPerson.png')}
              className="w-[220px] h-[220px] absolute bottom-0"
            />
          </View>

          <View className="absolute bottom-0 w-full h-[60%] bg-white rounded-t-3xl px-6 pt-8 pb-10">
            <Text className="text-3xl font-bold text-gray-800 mb-2">Login</Text>
            <Text className="text-base text-gray-600 mb-6">
              Welcome back, we missed you!
            </Text>

            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </Text>
              <TextInput
                className={`w-full p-4 bg-gray-50 rounded-lg border ${
                  errors.phoneNumber ? 'border-red-500' : 'border-gray-200'
                }`}
                placeholder="Enter your phone number (e.g., 1234567890)"
                placeholderTextColor="#9CA3AF"
                value={phoneNumber}
                onChangeText={text => {
                  // Only allow digits
                  const cleaned = text.replace(/\D/g, '');
                  setPhoneNumber(cleaned);
                  if (errors.phoneNumber) setErrors({ ...errors, phoneNumber: '' });
                }}
                keyboardType="phone-pad"
                autoComplete="tel"
                editable={!loading}
              />
              {errors.phoneNumber ? (
                <Text className="text-red-500 text-xs mt-1">
                  {errors.phoneNumber}
                </Text>
              ) : null}
            </View>

            <View className="mb-2">
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
                  value={password}
                  onChangeText={text => {
                    setPassword(text);
                    if (errors.password) setErrors({ ...errors, password: '' });
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="password"
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-4"
                  disabled={loading}
                >
                  <Feather
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color="gray"
                  />
                </TouchableOpacity>
              </View>
              {errors.password ? (
                <Text className="text-red-500 text-xs mt-1">
                  {errors.password}
                </Text>
              ) : null}
            </View>

            <TouchableOpacity
              className="self-end mb-6"
              disabled={loading}
            >
              <Text className="text-[#5B2EC4] font-medium text-sm">
                Forgot Password?
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`p-4 rounded-lg mb-6 ${
                loading ? 'bg-[#5B2EC4]/70' : 'bg-[#5B2EC4]'
              }`}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white text-center font-semibold text-base">
                  Login
                </Text>
              )}
            </TouchableOpacity>

            <View className="flex-row justify-center items-center">
              <Text className="text-gray-600 text-sm">
                Don't have an account?{' '}
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Register')}
                disabled={loading}
              >
                <Text className="text-[#5B2EC4] font-semibold text-sm">
                  Register
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
// import React, { useState, useRef } from 'react';
// import {
//   Text,
//   View,
//   Image,
//   TextInput,
//   TouchableOpacity,
//   KeyboardAvoidingView,
//   Platform,
//   ScrollView,
//   ActivityIndicator,
//   Alert,
// } from 'react-native';
// import PhoneInput from 'react-native-phone-number-input';
// import useAuthService from '../../services/auth';
// import Toast from 'react-native-toast-message';
// import { saveTokens } from '../../utils/storage';

// import { useNavigation } from '@react-navigation/native';
// import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
// import { RootStackParamList } from '../../navigation/navigation';
// import Feather from 'react-native-vector-icons/Feather';

// type LoginScreenProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

// export default function LoginComponent() {
//   const [phoneNumber, setPhoneNumber] = useState('');
//   const [formattedValue, setFormattedValue] = useState('');
//   const [password, setPassword] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
//   const [showPassword, setShowPassword] = useState(false);
//   const [errors, setErrors] = useState<{
//     phoneNumber?: string;
//     password?: string;
//   }>({});
//   const { signin, loading } = useAuthService();
//   const navigation = useNavigation<LoginScreenProp>();
//   const phoneInput = useRef<PhoneInput>(null);

//   const validate = () => {
//     let tempErrors: { phoneNumber?: string; password?: string } = {};

//     if (!phoneNumber) {
//       tempErrors.phoneNumber = 'Phone number is required';
//     } 
//     // else if (!/^\d{10,15}$/.test(phoneNumber.replace(/\D/g, ''))) {
//     //   tempErrors.phoneNumber = 'Enter a valid phone number';
//     // }

//     if (!password) {
//       tempErrors.password = 'Password is required';
//     }

//     setErrors(tempErrors);
//     return Object.keys(tempErrors).length === 0;
//   };

//   const handleLogin = async () => {
//     if (!validate()) return;
// //  Toast.show({
// //           type: 'success',
// //           text1: formattedValue,
// //           text2:password,
// //         });
//     try {
//       // Use the formatted value which includes country code
//       const response = await signin({
//         phoneNumber: formattedValue || `+${phoneNumber}`,
//         password,
//       });
//       console.log('APP STARTED2');

//       if (response) {
//         saveTokens(response.accessToken, response.refreshToken);
//         Toast.show({
//           type: 'success',
//           text1: 'Login successful',
//           text2: 'Welcome back! 🎉',
//         });
//         navigation.replace('Home');
//       } else {
//         Toast.show({
//           type: 'error',
//           text1: 'Error',
//           text2: 'Not logged in',
//         });
//       }
//     } catch (err: any) {
//       Toast.show({
//         type: 'error',
//         text1: 'Error',
//         text2: 'Invalid phone number or password',
//       });
//     }
//   };

//   return (
//     <KeyboardAvoidingView
//       behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//       className="flex-1"
//     >
//       <ScrollView
//         contentContainerStyle={{ flexGrow: 1 }}
//         keyboardShouldPersistTaps="handled"
//         showsVerticalScrollIndicator={false}
//       >
//         <View className="flex-1 items-center justify-center bg-[#5B2EC4]">
//           <Image
//             source={require('../../assets/decorator1.png')}
//             className="absolute right-0 top-20"
//             resizeMode="contain"
//           />
//           <Image
//             source={require('../../assets/decorator2.png')}
//             className="absolute left-0 bottom-0"
//             resizeMode="contain"
//           />
//           <Image
//             source={require('../../assets/decorator3.png')}
//             className="absolute left-0 top-0"
//             resizeMode="contain"
//           />

//           <View className="absolute top-0 w-full h-[40%] items-center justify-center">
//             <Image
//               source={require('../../assets/AuthPerson.png')}
//               className="w-[220px] h-[220px] absolute bottom-0"
//             />
//           </View>

//           <View className="absolute bottom-0 w-full h-[60%] bg-white rounded-t-3xl px-6 pt-8 pb-10">
//             <Text className="text-3xl font-bold text-gray-800 mb-2">Login</Text>
//             <Text className="text-base text-gray-600 mb-6">
//               Welcome back, we missed you!
//             </Text>

//             <View className="mb-4">
//               <Text className="text-sm font-medium text-gray-700 mb-2">
//                 Phone Number
//               </Text>
//               <PhoneInput
//                 ref={phoneInput}
//                 defaultValue={phoneNumber}
//                 defaultCode="US"
//                 layout="first"
//                 onChangeText={(text) => {
//                   setPhoneNumber(text);
//                   if (errors.phoneNumber)
//                     setErrors({ ...errors, phoneNumber: '' });
//                 }}
//                 onChangeFormattedText={(text) => {
//                   setFormattedValue(text);
//                 }}
//                 containerStyle={{
//                   width: '100%',
//                   backgroundColor: '#F9FAFB',
//                   borderRadius: 8,
//                   borderWidth: 1,
//                   borderColor: errors.phoneNumber ? '#EF4444' : '#E5E7EB',
//                 }}
//                 textContainerStyle={{
//                   backgroundColor: '#F9FAFB',
//                   borderRadius: 8,
//                   paddingVertical: 0,
//                 }}
//                 textInputStyle={{
//                   fontSize: 16,
//                   color: '#1F2937',
//                 }}
//                 codeTextStyle={{
//                   fontSize: 16,
//                   color: '#1F2937',
//                 }}
//                 flagButtonStyle={{
//                   width: 60,
//                 }}
//                 countryPickerButtonStyle={{
//                   paddingLeft: 8,
//                 }}
//                 textInputProps={{
//                   placeholderTextColor: '#9CA3AF',
//                   editable: !isLoading,
//                 }}
//                 disabled={isLoading}
//               />
//               {errors.phoneNumber ? (
//                 <Text className="text-red-500 text-xs mt-1">
//                   {errors.phoneNumber}
//                 </Text>
//               ) : null}
//             </View>

//             <View className="mb-2">
//               <Text className="text-sm font-medium text-gray-700 mb-2">
//                 Password
//               </Text>
//               <View className="relative">
//                 <TextInput
//                   className={`w-full p-4 bg-gray-50 rounded-lg border ${
//                     errors.password ? 'border-red-500' : 'border-gray-200'
//                   } pr-12`}
//                   placeholder="Enter your password"
//                   placeholderTextColor="#9CA3AF"
//                   value={password}
//                   onChangeText={text => {
//                     setPassword(text);
//                     if (errors.password) setErrors({ ...errors, password: '' });
//                   }}
//                   secureTextEntry={!showPassword}
//                   autoCapitalize="none"
//                   autoComplete="password"
//                   editable={!isLoading}
//                 />

//                 <TouchableOpacity
//                   onPress={() => setShowPassword(!showPassword)}
//                   className="absolute right-4 top-4"
//                   disabled={isLoading}
//                 >
//                   <Feather
//                     name={showPassword ? 'eye-off' : 'eye'}
//                     size={20}
//                     color="gray"
//                   />
//                 </TouchableOpacity>
//               </View>
//               {errors.password ? (
//                 <Text className="text-red-500 text-xs mt-1">
//                   {errors.password}
//                 </Text>
//               ) : null}
//             </View>

//             <TouchableOpacity
//               className="self-end mb-6"
//               disabled={isLoading}
//             >
//               <Text className="text-[#5B2EC4] font-medium text-sm">
//                 Forgot Password?
//               </Text>
//             </TouchableOpacity>

//             <TouchableOpacity
//               className={`p-4 rounded-lg mb-6 ${
//                 isLoading ? 'bg-[#5B2EC4]/70' : 'bg-[#5B2EC4]'
//               }`}
//               onPress={handleLogin}
//               disabled={isLoading}
//               activeOpacity={0.8}
//             >
//               {isLoading ? (
//                 <ActivityIndicator color="#ffffff" />
//               ) : (
//                 <Text className="text-white text-center font-semibold text-base">
//                   Login
//                 </Text>
//               )}
//             </TouchableOpacity>

//             <View className="flex-row justify-center items-center">
//               <Text className="text-gray-600 text-sm">
//                 Don't have an account?{' '}
//               </Text>
//               <TouchableOpacity
//                 onPress={() => navigation.navigate('Register')}
//                 disabled={isLoading}
//               >
//                 <Text className="text-[#5B2EC4] font-semibold text-sm">
//                   Register
//                 </Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </ScrollView>
//     </KeyboardAvoidingView>
//   );
// }
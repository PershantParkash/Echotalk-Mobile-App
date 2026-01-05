import { useState, useRef, useEffect } from 'react';
import { Text, View, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {
  setCurrentStep,
} from '../../store/user/user.actions';
import { RootState } from '../../store';
import { RegisterSteps } from '../../store/user/user.types';

const PersonalDetails = () => {
  const { user } = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch();
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    // Start countdown timer
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  const handleOtpChange = (value: string, index: number) => {
    // Only allow numbers
    if (value && !/^\d+$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    // Handle backspace to go to previous input
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = () => {
    if (canResend) {
      // Add your resend OTP logic here
      Alert.alert('Success', 'OTP has been resent to your phone number');
      setResendTimer(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleVerify = () => {
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      Alert.alert('Error', 'Please enter complete OTP');
      return;
    }
    
    // Add your OTP verification logic here
    // For now, just move to next step
    dispatch(setCurrentStep(RegisterSteps.UserType));
  };

  const handleBack = () => {
    // Add navigation back logic
  };

  const isOtpComplete = otp.every(digit => digit !== '');

  return (
    <View className="flex-1 justify-center items-center px-6 bg-white">
      <View className="w-full max-w-[400px]">
        <View className="mt-4 mb-8">
          <TouchableOpacity
            onPress={handleBack}
            className="absolute left-0 top-0 p-2"
          >
            <MaterialIcons name="arrow-back-ios" size={24} color="#000" />
          </TouchableOpacity>

          <Text className="text-3xl font-semibold text-center mt-2">
            Phone Number Verification
          </Text>
        </View>

        <Text className="text-sm text-gray-600 mb-8 text-center">
          OTP verification code has been sent to your provided mobile number +44******0074
        </Text>

        <Text className="text-base font-medium text-gray-700 mb-3">
          Enter OTP
        </Text>

        {/* OTP Input Boxes */}
        <View className="flex-row justify-between mb-4">
          {otp.map((digit, index) => (
            <TextInput
              key={index}
            //   ref={(ref) => (inputRefs.current[index] = ref)}
              value={digit}
              onChangeText={(value) => handleOtpChange(value, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              className="w-12 h-14 bg-gray-100 rounded-lg text-center text-xl font-semibold"
              autoFocus={index === 0}
            />
          ))}
        </View>

        {/* Resend Code */}
        <View className="flex-row items-center justify-center mb-6">
          <Text className="text-sm text-gray-600">Didn't receive code? </Text>
          <TouchableOpacity
            onPress={handleResend}
            disabled={!canResend}
          >
            <Text
              className={`text-sm font-medium ${
                canResend ? 'text-[#5B2EC4]' : 'text-gray-400'
              }`}
            >
              {canResend ? 'Resend Code' : `Resend in ${resendTimer}s`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Verify Button */}
        <TouchableOpacity
          onPress={handleVerify}
          disabled={!isOtpComplete}
          className={`h-12 rounded-lg justify-center items-center ${
            isOtpComplete ? 'bg-[#5B2EC4]' : 'bg-gray-300'
          }`}
        >
          <Text className="text-white text-base font-semibold">Verify</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default PersonalDetails;

import { View } from 'react-native';
import LoginComponent from '../components/auth/Login';

export default function LoginScreen() {
  return (
    <View className="flex-1">
      <LoginComponent
  // onLogin={async (phoneNumber, password) => {
    // phoneNumber will be like: +923001234567
    // const response = await signin({ phoneNumber, password });
    // Handle response
  // }}
//   onNavigateToRegister={() => navigation.navigate('Register')}
//   onForgotPassword={() => navigation.navigate('ForgotPassword')}
/>
    </View>
  );
}
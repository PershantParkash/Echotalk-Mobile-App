import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import OnboardingScreen from '../screens/Onboarding';
import SplashScreen from '../screens/SplashScreen';
import { RootStackParamList } from './navigation';
import Login from '../components/auth/Login';
import Register from '../components/auth/RegisterMain'
const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppStack() {
  return (
    <Stack.Navigator
      initialRouteName="Register"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Home" component={SplashScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Register" component={Register} />
    </Stack.Navigator>
  ); 
}
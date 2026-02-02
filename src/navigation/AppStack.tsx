// import React from 'react';
// import { createNativeStackNavigator } from '@react-navigation/native-stack';
// import OnboardingScreen from '../screens/Onboarding';
// import SplashScreen from '../screens/SplashScreen';
// import { RootStackParamList } from './navigation';
// import Login from '../components/auth/Login';
// import Register from '../components/auth/RegisterMain'
// import HomeScreen from '../screens/HomeScreen';
// import ChatScreen from '../screens/ChatScreen'
// // import ChatScreen from '../screens/ChatScreen'

// const Stack = createNativeStackNavigator<RootStackParamList>();

// export default function AppStack() {
//   return (
//     <Stack.Navigator
//       initialRouteName="Chat"
//       screenOptions={{ headerShown: false }}
//     >
//       <Stack.Screen name="Splash" component={SplashScreen} />
//       <Stack.Screen name="Chat" component={ChatScreen} />
//       <Stack.Screen name="Onboarding" component={OnboardingScreen} />
//       <Stack.Screen name="Login" component={Login} />
//       <Stack.Screen name="Register" component={Register} />
//       <Stack.Screen name="Home" component={HomeScreen} />
//       {/* <Stack.Screen name="Chat" component={ChatScreen} /> */}
//     </Stack.Navigator>
//   ); 
// }

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import OnboardingScreen from '../screens/Onboarding';
import SplashScreen from '../screens/SplashScreen';
import { RootStackParamList } from './navigation';
import Login from '../components/auth/Login';
import Register from '../components/auth/RegisterMain';
import TabNavigator from './TabNavigator';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppStack() {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Register" component={Register} />
      <Stack.Screen name="MainTabs" component={TabNavigator} />
    </Stack.Navigator>
  ); 
}
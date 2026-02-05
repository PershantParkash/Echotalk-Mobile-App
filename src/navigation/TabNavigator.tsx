// import React from 'react';
// import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// import HomeScreen from '../screens/HomeScreen';
// import MessageScreen from '../screens/MessagesScreen';
// import { TabParamList } from './navigation';

// const Tab = createBottomTabNavigator<TabParamList>();

// export default function TabNavigator() {
//   return (
//     <Tab.Navigator
//       screenOptions={{
//         headerShown: false,
//         tabBarActiveTintColor: '#007AFF',
//         tabBarInactiveTintColor: '#8E8E93',
//       }}
//     >
//          <Tab.Screen 
//         name="ChatTab" 
//         component={MessageScreen}
//         options={{
//           tabBarLabel: 'Chat',
//           // tabBarIcon: ({ color, size }) => (
//           //   <Icon name="chat" size={size} color={color} />
//           // ),
//         }}
//       />
//       <Tab.Screen 
//         name="HomeTab" 
//         component={HomeScreen}
//         options={{
//           tabBarLabel: 'Home',
//           // tabBarIcon: ({ color, size }) => (
//           //   <Icon name="home" size={size} color={color} />
//           // ),
//         }}
//       />
     
//     </Tab.Navigator>
//   );
// }

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';

import HomeScreen from '../screens/HomeScreen';
import MessageScreen from '../screens/MessagesScreen';
import { TabParamList } from './navigation';

const Tab = createBottomTabNavigator<TabParamList>();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ChatTab"
        component={MessageScreen}
        options={{
          tabBarLabel: 'Chat',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-outline" size={size} color={color} />
          ),
        }}
      />

      
    </Tab.Navigator>
  );
}

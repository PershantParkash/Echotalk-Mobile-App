import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import ChatScreen from '../screens/ChatScreen';
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
        name="ChatTab" 
        component={ChatScreen}
        options={{
          tabBarLabel: 'Chat',
          // tabBarIcon: ({ color, size }) => (
          //   <Icon name="chat" size={size} color={color} />
          // ),
        }}
      />
      <Tab.Screen 
        name="HomeTab" 
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          // You can add icons here if you have them
          // tabBarIcon: ({ color, size }) => (
          //   <Icon name="home" size={size} color={color} />
          // ),
        }}
      />
     
    </Tab.Navigator>
  );
}
import React from 'react';
import './global.css';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import AppStack from './src/navigation/AppStack';
import { store } from './src/store';
import Toast from 'react-native-toast-message';

export default function App() {
  return (
    <Provider store={store}>
      <NavigationContainer>
        <AppStack />
        <Toast />
      </NavigationContainer>
    </Provider>
  );
}
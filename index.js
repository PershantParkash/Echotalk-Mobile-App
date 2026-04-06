import 'react-native-get-random-values';
import messaging from '@react-native-firebase/messaging';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import { handleBackgroundIncomingCallMessage } from './src/utils/incomingCallPush';

global.Buffer = global.Buffer || require('buffer').Buffer;

messaging().setBackgroundMessageHandler(handleBackgroundIncomingCallMessage);

AppRegistry.registerComponent(appName, () => App);

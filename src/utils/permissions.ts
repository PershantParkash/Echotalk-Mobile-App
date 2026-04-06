import { PermissionsAndroid, Platform } from "react-native";

export const ensureAudioPermission = async (): Promise<boolean> => {
  if (Platform.OS !== "android") {
    return true;
  }

  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
  );

  return granted === PermissionsAndroid.RESULTS.GRANTED;
};

export const ensureVideoPermission = async (): Promise<boolean> => {
  if (Platform.OS !== "android") {
    return true;
  }

  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.CAMERA,
  );

  return granted === PermissionsAndroid.RESULTS.GRANTED;
};


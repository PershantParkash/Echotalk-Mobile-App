import { PermissionsAndroid, Platform } from "react-native";

/**
 * Voice notes are written to the app cache; only RECORD_AUDIO is required.
 * (Requiring WRITE_EXTERNAL_STORAGE caused false failures when users granted mic but denied storage.)
 */
export const ensureAudioPermission = async (): Promise<boolean> => {
  if (Platform.OS !== "android") {
    return true;
  }

  const perm = PermissionsAndroid.PERMISSIONS.RECORD_AUDIO;
  const already = await PermissionsAndroid.check(perm);
  if (already) {
    return true;
  }

  const result = await PermissionsAndroid.request(perm);
  return result === PermissionsAndroid.RESULTS.GRANTED;
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

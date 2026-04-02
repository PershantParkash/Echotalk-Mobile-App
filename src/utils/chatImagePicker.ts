import { PermissionsAndroid, Platform } from 'react-native';
import {
  launchImageLibrary,
  type Asset,
} from 'react-native-image-picker';

type PickChatImageResult = {
  asset: Asset | null;
  error: string | null;
};

const requestAndroidReadPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return true;
  }
  try {
    const sdk = Platform.Version;
    if (typeof sdk === 'number' && sdk >= 33) {
      return true;
    }
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
};

/**
 * Opens the system photo picker (photos library on iOS, photo picker on Android).
 */
const isAllowedChatImageAsset = (asset: Asset | null | undefined): boolean => {
  const mime = (asset?.type ?? '').toLowerCase();
  if (mime === 'image/png' || mime === 'image/jpeg') {
    return true;
  }

  const nameOrUri = (asset?.fileName ?? asset?.uri ?? '').toLowerCase();
  return (
    nameOrUri.endsWith('.png') ||
    nameOrUri.endsWith('.jpg') ||
    nameOrUri.endsWith('.jpeg')
  );
};

export const pickChatImageAsset = async (): Promise<PickChatImageResult> => {
  const canRead = await requestAndroidReadPermission();
  if (!canRead) {
    return { asset: null, error: 'Permission denied.' };
  }

  const result = await launchImageLibrary({
    mediaType: 'photo',
    selectionLimit: 1,
    quality: 0.8,
    includeBase64: true,
    maxWidth: 2048,
    maxHeight: 2048,
  });

  if (result?.didCancel) {
    return { asset: null, error: null };
  }
  if (result?.errorCode) {
    return { asset: null, error: 'Could not open photo library.' };
  }

  const asset = result?.assets?.[0] ?? null;
  if (!isAllowedChatImageAsset(asset)) {
    return {
      asset: null,
      error: 'Only .png, .jpg, and .jpeg images are allowed.',
    };
  }

  return { asset, error: null };
};

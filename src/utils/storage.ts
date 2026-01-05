import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

export const getAccessToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
};

export const saveAccessToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(ACCESS_TOKEN_KEY, token);
  } catch (error) {
    console.error('Error saving access token:', error);
  }
};

export const clearAccessToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
  } catch (error) {
    console.error('Error clearing access token:', error);
  }
};

export const getRefreshToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('Error getting refresh token:', error);
    return null;
  }
};

export const saveRefreshToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, token);
  } catch (error) {
    console.error('Error saving refresh token:', error);
  }
};

export const clearRefreshToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('Error clearing refresh token:', error);
  }
};

export const clearAllTokens = async (): Promise<void> => {
  await clearAccessToken();
  await clearRefreshToken();
};
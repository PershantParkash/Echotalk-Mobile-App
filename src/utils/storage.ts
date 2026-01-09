import * as Keychain from 'react-native-keychain';

type Tokens = {
  accessToken: string;
  refreshToken: string;
};

const SERVICE_NAME = 'authTokens';

/**
 * Save both tokens securely
 */
export const saveTokens = async (
  accessToken: string,
  refreshToken: string
): Promise<void> => {
  try {
    await Keychain.setGenericPassword(
      SERVICE_NAME,
      JSON.stringify({ accessToken, refreshToken }),
      {
        service: SERVICE_NAME,
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
      }
    );
  } catch (error) {
    console.error('Error saving tokens:', error);
  }
};

/**
 * Get access token
 */
export const getAccessToken = async (): Promise<string | null> => {
  try {
    const credentials = await Keychain.getGenericPassword({
      service: SERVICE_NAME,
    });

    if (!credentials) return null;

    const tokens: Tokens = JSON.parse(credentials.password);
    return tokens.accessToken;
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
};

/**
 * Get refresh token
 */
export const getRefreshToken = async (): Promise<string | null> => {
  try {
    const credentials = await Keychain.getGenericPassword({
      service: SERVICE_NAME,
    });

    if (!credentials) return null;

    const tokens: Tokens = JSON.parse(credentials.password);
    return tokens.refreshToken;
  } catch (error) {
    console.error('Error getting refresh token:', error);
    return null;
  }
};

/**
 * Clear all tokens (logout)
 */
export const clearAllTokens = async (): Promise<void> => {
  try {
    await Keychain.resetGenericPassword({ service: SERVICE_NAME });
  } catch (error) {
    console.error('Error clearing tokens:', error);
  }
};

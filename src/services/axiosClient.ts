import axios from 'axios';
import { getAccessToken, getRefreshToken, saveTokens } from '../utils/storage';
import { NEXT_PUBLIC_API_URL } from '@env';

console.log('Base URL:', NEXT_PUBLIC_API_URL);

const axiosClient = axios.create({
  baseURL: NEXT_PUBLIC_API_URL, 
  timeout: 10000,
});

axiosClient.interceptors.request.use(
  async (config) => {
    const accessToken = await getAccessToken();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await getRefreshToken();
        if (!refreshToken) {
          throw error;
        }

        const response = await axios.post(`${NEXT_PUBLIC_API_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;
        
        // Save new tokens
        await saveTokens(accessToken, newRefreshToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return axiosClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, user needs to login again
        // You might want to trigger a logout/redirect here
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
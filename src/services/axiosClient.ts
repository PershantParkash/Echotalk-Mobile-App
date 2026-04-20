import axios from 'axios';
import { getAccessToken, getRefreshToken, saveTokens } from '../utils/storage';
import { NEXT_PUBLIC_API_URL } from '@env';
import { AuthEndpointsV1 } from './auth/constants';

const axiosClient = axios.create({
  baseURL: NEXT_PUBLIC_API_URL,
  timeout: 10000,
});


// Dedicated client for refreshing tokens (must NOT use axiosClient to avoid interceptor loops)
const refreshClient = axios.create({
  baseURL: NEXT_PUBLIC_API_URL,
  timeout: 10000,
});

let isRefreshing = false;
let refreshSubscribers: Array<(token: string | null) => void> = [];

const notifyRefreshSubscribers = (token: string | null) => {
  refreshSubscribers.forEach((cb) => cb?.(token));
  refreshSubscribers = [];
};

axiosClient.interceptors.request.use(
  async (config) => {
    const accessToken = await getAccessToken();
    if (accessToken) {
      config.headers = config.headers ?? {};
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
        if (!refreshToken) throw error;

        // If a refresh is already in flight, wait for it and then retry.
        if (isRefreshing) {
          return await new Promise((resolve, reject) => {
            refreshSubscribers.push((token) => {
              if (!token) {
                reject(error);
                return;
              }
              originalRequest.headers = originalRequest.headers ?? {};
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(axiosClient(originalRequest));
            });
          });
        }

        isRefreshing = true;

        const response = await refreshClient.post(AuthEndpointsV1.refreshAccessToken, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;

        // Save new tokens
        await saveTokens(accessToken, newRefreshToken);
        notifyRefreshSubscribers(accessToken);
        isRefreshing = false;

        // Retry original request with new token
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return axiosClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, user needs to login again
        // You might want to trigger a logout/redirect here
        notifyRefreshSubscribers(null);
        isRefreshing = false;
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
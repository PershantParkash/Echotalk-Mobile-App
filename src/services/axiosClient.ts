import axios, { AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { 
  getAccessToken, 
  saveAccessToken, 
  clearAccessToken,
  getRefreshToken,
  clearRefreshToken,
  clearAllTokens
} from '../utils/storage';
import { NEXT_PUBLIC_API_URL } from '@env';

interface RefreshTokenResponse {
  accessToken: string;
  refreshToken?: string;
}

interface QueuedRequest {
  resolve: (token: string) => void;
  reject: (error: any) => void;
}

const API_URL =  NEXT_PUBLIC_API_URL;

const axiosClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let requestsQueue: QueuedRequest[] = [];

const processQueue = (error: any, token: string | null = null) => {
  requestsQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token!);
    }
  });
  requestsQueue = [];
};

const refreshAccessToken = async (): Promise<RefreshTokenResponse> => {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }
  
  const response = await axios.post<RefreshTokenResponse>(
    `${API_URL}/v1/auth/refresh-accessToken`, 
    { refreshToken }
  );
  
  return response.data;
};

// Request Interceptor
axiosClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
     console.log(config.baseURL)
     console.log(config.url)
    const token = await getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response Interceptor
axiosClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error?.response?.status === 401 || error?.response?.status === 403) {
      
      if (!isRefreshing) {
        isRefreshing = true;
        const refreshToken = await getRefreshToken();

        if (!refreshToken) {
          await clearAllTokens();
          // Navigate to login - you'll need to set this up
          // navigationRef.current?.navigate('Login');
          return Promise.reject(error);
        }

        try {
          const res = await refreshAccessToken();
          if (res?.accessToken) {
            await saveAccessToken(res.accessToken);
            axiosClient.defaults.headers.Authorization = `Bearer ${res.accessToken}`;
            
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${res.accessToken}`;
            }
            
            processQueue(null, res.accessToken);
            console.log('Token refreshed successfully');
    
            return axiosClient(originalRequest);
          } else {
            throw new Error('No access token in refresh response');
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          
          await clearAllTokens();
          processQueue(refreshError, null);
          // Navigate to login
          // navigationRef.current?.navigate('Login');
          
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return new Promise((resolve, reject) => {
        requestsQueue.push({
          resolve: (token: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            resolve(axiosClient(originalRequest));
          },
          reject: (err: any) => {
            reject(err);
          },
        });
      });
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
import { useState, useCallback } from "react";
import axios, { AxiosRequestConfig } from "axios";
import axiosClient from "../services/axiosClient";

const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callApi = useCallback(async (config: AxiosRequestConfig) => {
    setLoading(true);
    setError(null);

    try {
      console.log('API Request:', {
        method: config.method,
        url: config.url,
        baseURL: axiosClient.defaults.baseURL,
        fullURL: `${axiosClient.defaults.baseURL}${config.url}`,
      });

      const response = await axiosClient(config);
      
      // console.log('API Response:', {
      //   status: response.status,
      //   data: response.data,
      // });
      
      return response.data;
    } catch (err) {
      let errorMessage = "Something went wrong";

      if (axios.isAxiosError(err)) {
        // console.error('Axios Error Details:', {
        //   message: err.message,
        //   response: err.response?.data,
        //   status: err.response?.status,
        //   config: {
        //     url: err.config?.url,
        //     baseURL: err.config?.baseURL,
        //     method: err.config?.method,
        //   },
        // });

        // Better error messages based on status code
        if (err.response?.status === 401) {
          errorMessage = "Invalid phone number or password";
        } else if (err.response?.status === 404) {
          errorMessage = "Service not found. Please check your connection.";
        } else if (err.response?.status === 500) {
          errorMessage = "Server error. Please try again later.";
        } else if (err.code === 'ECONNABORTED') {
          errorMessage = "Request timeout. Please check your connection.";
        } else if (err.code === 'ERR_NETWORK') {
          errorMessage = "Network error. Cannot reach server.";
        } else {
          errorMessage = err.response?.data?.message || err.message || errorMessage;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return { callApi, loading, error };
};

export default useApi;
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
      const response = await axiosClient(config);
      return response.data;
    } catch (err) {
      let errorMessage = "Something went wrong";

      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.message || err.message || errorMessage;
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
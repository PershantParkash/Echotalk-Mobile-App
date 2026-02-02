import useApi from "../../hooks/useApi";
import { AuthEndpointsV1 } from "./constants";
import { ResetPasswordUser, SigninUser, SignupUser } from "./types";

const useAuthService = () => {
  const { callApi, loading, error } = useApi();

  const signup = async (user: SignupUser) => {
    return await callApi({
      method: "post",
      url: AuthEndpointsV1.signup,
      data: user,
    });
  };

  const signin = async (user: SigninUser) => {
    return await callApi({
      method: "post",
      url: AuthEndpointsV1.signin,
      data: user,
    });
  };

  const checkPhoneNumber = async (phoneNumber: string) => {
    return await callApi({
      method: "post",
      url: AuthEndpointsV1.checkPhone,
      data: { phoneNumber },
    });
  };

  const resetPassword = async (user: ResetPasswordUser) => {
    return await callApi({
      method: "post",
      url: AuthEndpointsV1.resetPassword,
      data: user,
    });
  };

  const forgotPassword = async (phoneNumber: string) => {
    return await callApi({
      method: "post",
      url: AuthEndpointsV1.forgotPassword,
      data: { phoneNumber },
    });
  };

  return {
    signup,
    signin,
    checkPhoneNumber,
    resetPassword,
    forgotPassword,
    loading,
    error,
  };
};

export default useAuthService;
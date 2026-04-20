import useApi from "../../hooks/useApi";
import { UsersEndpointsV1 } from "./constants";
import { UpdateUser } from "./types";

const useUsersService = () => {
  const { callApi, loading, error } = useApi();

  // Get all users
  const getAllUsers = async () => {
    return await callApi({
      method: "get",
      url: UsersEndpointsV1.getAllUsers,
    });
  };

  const updateUser = async (user: UpdateUser) => {
    return await callApi({
      method: "put",
      url: UsersEndpointsV1.updateUser,
      data: user,
    });
  };

  const getPurchasedCourses = async () => {
    return await callApi({
      method: "get",
      url: UsersEndpointsV1.getPurchasedCourses,
    });
  };

  const getUserDetails = async () => {
    console.log('getUserDetails', UsersEndpointsV1.getUserDetails)
    return await callApi({
      method: "get",
      url: UsersEndpointsV1.getUserDetails,
    });
  };

  const switchToTrainer = async () => {
    return await callApi({
      method: "put",
      url: UsersEndpointsV1.switchtoTrainer,
    });
  };

  return {
    getAllUsers,
    updateUser,
    getPurchasedCourses,
    getUserDetails,
    switchToTrainer,
    loading,
    error,
  };
};

export default useUsersService;

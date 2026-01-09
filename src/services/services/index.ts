import useApi from "../../hooks/useApi";
import { ServicesEndpointsV1 } from "./constants";
import {
  CreateServiceDto,
  UpdateServiceDto,
  UpdateServiceSlotsDto,
  CreateCourseCheckoutRequest,
  CreateServiceCheckoutRequest,
  CheckoutSessionResponse,
  VerifySessionResponse,
} from "./types";

const useServicesService = () => {
  const { callApi, loading, error } = useApi();

  const createService = async (payload: CreateServiceDto) => {
    return await callApi({
      method: "post",
      url: ServicesEndpointsV1.createService,
      data: payload,
    });
  };

  const updateService = async (payload: UpdateServiceDto) => {
    return await callApi({
      method: "put",
      url: `${ServicesEndpointsV1.updateService}/${payload.id}`,
      data: payload,
    });
  };

  const getTrainerServices = async (
    page: number = 1,
    limit: number = 10,
    sortBy: string = "createdAt",
    sortDirection: string = "DESC",
    search?: string
  ) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sortBy,
      sortDirection,
    });

    if (search) {
      params.append("search", search);
    }

    return await callApi({
      method: "get",
      url: `${ServicesEndpointsV1.getTrainerServices}?${params.toString()}`,
    });
  };

  const getAllServices = async (
    page: number,
    limit: number,
    sortBy: string,
    sortDirection: string,
    search?: string
  ) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sortBy,
      sortDirection,
    });

    if (search) {
      params.append("search", search);
    }
    return await callApi({
      method: "get",
      url: `${ServicesEndpointsV1.getAllServices}?${params.toString()}`,
    });
  };

  const getAllBookedServicesUser = async () => {
    return await callApi({
      method: "get",
      url: ServicesEndpointsV1.getAllBookedServiceUser,
    });
  };

  const getAllBookedServicesTrainer = async () => {
    return await callApi({
      method: "get",
      url: ServicesEndpointsV1.getAllBookedServiceTrainer,
    });
  };

  const getServiceDetails = async (serviceId: number) => {
    return await callApi({
      method: "get",
      url: `${ServicesEndpointsV1.getServiceDetails}/${serviceId}`,
    });
  };

  const deleteService = async (serviceId: number) => {
    return await callApi({
      method: "delete",
      url: `${ServicesEndpointsV1.deleteService}/${serviceId}`,
    });
  };

  const getServiceSlots = async (serviceId: number) => {
    return await callApi({
      method: "get",
      url: ServicesEndpointsV1.getServiceSlots(serviceId),
    });
  };

  const updateServiceSlots = async (
    serviceId: number,
    payload: UpdateServiceSlotsDto
  ) => {
    return await callApi({
      method: "put",
      url: `${ServicesEndpointsV1.updateServiceSlots(serviceId)}`,
      data: { slots: payload },
    });
  };

  const bookServiceSlot = async (slotId: number) => {
    return await callApi({
      method: "post",
      url: `${ServicesEndpointsV1.bookServiceSlot(slotId)}`,
    });
  };

  const getMeetingDetails = async (meetingLink: string) => {
    return await callApi({
      method: "get",
      url: `${ServicesEndpointsV1.getMeetingDetails}/${meetingLink}`,
    });
  };

  const createCourseCheckout = async (
    courseIds: number[]
  ): Promise<CheckoutSessionResponse> => {
    return await callApi({
      method: "post",
      url: ServicesEndpointsV1.createCourseCheckout,
      data: {
        courseIds,
      } as CreateCourseCheckoutRequest,
    });
  };

  const createServiceCheckout = async (
    serviceId: number,
    slotId: number
  ): Promise<CheckoutSessionResponse> => {
    return await callApi({
      method: "post",
      url: ServicesEndpointsV1.createServiceCheckout,
      data: {
        serviceId,
        slotId,
      } as CreateServiceCheckoutRequest,
    });
  };
  const verifySession = async (
    sessionId: string
  ): Promise<VerifySessionResponse> => {
    return await callApi({
      method: "get",
      url: ServicesEndpointsV1.verifySession,
      params: {
        session_id: sessionId,
      },
    });
  };

  return {
    createService,
    updateService,
    getTrainerServices,
    getAllServices,
    getAllBookedServicesUser,
    deleteService,
    getServiceDetails,
    getServiceSlots,
    updateServiceSlots,
    bookServiceSlot,
    getMeetingDetails,
    getAllBookedServicesTrainer,
    createCourseCheckout,
    createServiceCheckout,
    verifySession,
    loading,
    error,
  };
};

export default useServicesService;

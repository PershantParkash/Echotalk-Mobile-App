import useApi from "../../hooks/useApi";
import { ContactsEndpointsV1 } from "./constants";

export type CreateContactPayload = {
  name: string;
  phoneNumber: string;
};

const useContactsService = () => {
  const { callApi, loading, error } = useApi();

  const getAllContacts = async () => {
    return await callApi({
      method: "get",
      url: ContactsEndpointsV1.getAllContacts,
    });
  };

  const createContact = async (payload: CreateContactPayload) => {
    return await callApi({
      method: "post",
      url: ContactsEndpointsV1.createContact,
      data: payload,
    });
  };

  return {
    getAllContacts,
    createContact,
    loading,
    error,
  };
};

export default useContactsService;


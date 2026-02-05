import useApi from '../../hooks/useApi';
import { ChatsEndpointsV1 } from './constants';

const useChatsService = () => {
  const { callApi, loading, error } = useApi();

  const getChats = async () => {
    return await callApi({
      method: 'get',
      url: ChatsEndpointsV1.getChats,
    });
  };

  const createIndividualChat = async (contactId: number) => {
    return await callApi({
      method: 'post',
      url: ChatsEndpointsV1.createIndividualChat,
      data: { contactId },
    });
  };

  const createGroupChat = async (contactIds: number[]) => {
    return await callApi({
      method: 'post',
      url: ChatsEndpointsV1.createGroupChat,
      data: { contactIds },
    });
  };

  const getMessages = async (chatId: number, page = 1, pageSize = 20) => {
    return await callApi({
      method: 'get',
      url: ChatsEndpointsV1.getMessages(chatId),
      params: { page, pageSize },
    });
  };

  const getMessageBySenderId = async (callLogId: number) => {
    return await callApi({
      method: 'get',
      url: ChatsEndpointsV1.getMessageBySenderId(callLogId),
    });
  };

  const sendMessage = async (chatId: number, content: string) => {
    return await callApi({
      method: 'post',
      url: ChatsEndpointsV1.sendMessage(chatId),
      data: { content },
    });
  };

  return {
    getChats,
    createIndividualChat,
    createGroupChat,
    getMessages,
    getMessageBySenderId,
    sendMessage,
    loading,
    error,
  };
};

export default useChatsService;

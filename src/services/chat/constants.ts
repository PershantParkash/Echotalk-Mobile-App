export const ChatsEndpointsV1 = {
    getChats: '/v1/chats',
    createIndividualChat: '/v1/chats/individual',
    createGroupChat: '/v1/chats/group',
    getMessages: (chatId: number) => `/v1/chats/${chatId}/messages`,
    getMessageBySenderId: (senderId: number) => `/v1/chats/${senderId}/call-message`,
    sendMessage: (chatId: number) => `/v1/chats/${chatId}/messages`,
  };
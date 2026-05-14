import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ChatUser {
  id: number;
  fullName: string | null;
  email: string | null;
  phoneNumber: string;
  profileImage: string | null;
  contactName: { name: string } | null;
  isOnline: boolean;
  lastSeenAt?: string;
}

export interface LastMessage {
  id: number;
  content: string;
  createdAt: string;
  sender: {
    id: number;
    fullName: string | null;
  };
}

export interface Conversation {
  id: number;
  type: string;
  createdAt: string;
  updatedAt: string;
  lastMessage: LastMessage | null;
  users: ChatUser[];
}

type ConversationsState = {
  list: Conversation[];
  isLoading: boolean;
  error: string | null;
};

const initialState: ConversationsState = {
  list: [],
  isLoading: false,
  error: null,
};

const sortByLatestMessage = (conversations: Conversation[]): Conversation[] => {
  return [...conversations].sort((a, b) => {
    const aTime = a?.lastMessage?.createdAt
      ? new Date(a.lastMessage.createdAt).getTime()
      : new Date(a?.updatedAt ?? a?.createdAt ?? 0).getTime();
    const bTime = b?.lastMessage?.createdAt
      ? new Date(b.lastMessage.createdAt).getTime()
      : new Date(b?.updatedAt ?? b?.createdAt ?? 0).getTime();
    return bTime - aTime;
  });
};

const conversationsSlice = createSlice({
  name: 'conversations',
  initialState,
  reducers: {
    setConversations(state, action: PayloadAction<Conversation[]>) {
      state.list = sortByLatestMessage(action.payload ?? []);
      state.isLoading = false;
      state.error = null;
    },
    setConversationsLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setConversationsError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
      state.isLoading = false;
    },
    updateLastMessage(
      state,
      action: PayloadAction<{ chatId: number; message: LastMessage }>,
    ) {
      const { chatId, message } = action.payload;
      const index = state.list.findIndex(
        (c) => Number(c?.id) === Number(chatId),
      );
      if (index !== -1) {
        state.list[index] = {
          ...state.list[index],
          lastMessage: message,
          updatedAt: message?.createdAt ?? state.list[index]?.updatedAt,
        };
        state.list = sortByLatestMessage(state.list);
      }
    },
    addConversation(state, action: PayloadAction<Conversation>) {
      const exists = state.list.some(
        (c) => Number(c?.id) === Number(action.payload?.id),
      );
      if (!exists) {
        state.list = sortByLatestMessage([action.payload, ...state.list]);
      }
    },
    clearConversations() {
      return { ...initialState };
    },
  },
});

export const {
  setConversations,
  setConversationsLoading,
  setConversationsError,
  updateLastMessage,
  addConversation,
  clearConversations,
} = conversationsSlice.actions;

export default conversationsSlice.reducer;

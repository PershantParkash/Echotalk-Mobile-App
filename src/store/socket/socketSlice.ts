import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type SocketConnectionState = {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
};

type SocketState = {
  chatSocket: SocketConnectionState;
  callSocket: SocketConnectionState;
};

const initialConnectionState: SocketConnectionState = {
  isConnected: false,
  isConnecting: false,
  error: null,
};

const initialState: SocketState = {
  chatSocket: { ...initialConnectionState },
  callSocket: { ...initialConnectionState },
};

const socketSlice = createSlice({
  name: 'socket',
  initialState,
  reducers: {
    setChatSocketStatus(
      state,
      action: PayloadAction<Partial<SocketConnectionState>>,
    ) {
      state.chatSocket = { ...state.chatSocket, ...action.payload };
    },
    setCallSocketStatus(
      state,
      action: PayloadAction<Partial<SocketConnectionState>>,
    ) {
      state.callSocket = { ...state.callSocket, ...action.payload };
    },
    resetSocketState() {
      return { ...initialState };
    },
  },
});

export const { setChatSocketStatus, setCallSocketStatus, resetSocketState } =
  socketSlice.actions;

export default socketSlice.reducer;

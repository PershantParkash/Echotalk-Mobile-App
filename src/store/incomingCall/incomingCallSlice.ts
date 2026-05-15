import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { IncomingCallPayload } from '../../types/incomingCall';

type IncomingCallState = {
  payload: IncomingCallPayload | null;
};

const initialState: IncomingCallState = {
  payload: null,
};

const incomingCallSlice = createSlice({
  name: 'incomingCall',
  initialState,
  reducers: {
    setIncomingCall(state, action: PayloadAction<IncomingCallPayload | null>) {
      state.payload = action.payload;
    },
    clearIncomingCall(state) {
      state.payload = null;
    },
    dismissIfMatchingCallLog(state, action: PayloadAction<number>) {
      if (
        state.payload?.callLogId != null &&
        Number(state.payload.callLogId) === Number(action.payload)
      ) {
        state.payload = null;
      }
    },
  },
});

export const { setIncomingCall, clearIncomingCall, dismissIfMatchingCallLog } =
  incomingCallSlice.actions;

export default incomingCallSlice.reducer;

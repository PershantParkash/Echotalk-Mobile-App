import { configureStore } from '@reduxjs/toolkit';
import { userReducer } from './user/user.reducer';
import { presenceReducer } from './presence/presence.reducer';
import socketReducer from './socket/socketSlice';
import conversationsReducer from './conversations/conversationsSlice';
import incomingCallReducer from './incomingCall/incomingCallSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    presence: presenceReducer,
    socket: socketReducer,
    conversations: conversationsReducer,
    incomingCall: incomingCallReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

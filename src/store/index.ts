import { createStore, combineReducers } from 'redux';
import { userReducer } from './user/user.reducer';
import { presenceReducer } from './presence/presence.reducer';

const rootReducer = combineReducers({
  user: userReducer,
  presence: presenceReducer,
});

export const store = createStore(rootReducer);

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
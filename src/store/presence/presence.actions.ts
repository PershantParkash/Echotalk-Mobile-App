import * as Types from './presence.types';

export const setUserPresence = (payload: Types.SetUserPresencePayload) => ({
  type: Types.SET_USER_PRESENCE,
  payload,
});

export const clearPresence = () => ({
  type: Types.CLEAR_PRESENCE,
});

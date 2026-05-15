import * as Types from './presence.types';

const initialState: Types.PresenceState = {
  byUserId: {},
};

export const presenceReducer = (
  state = initialState,
  action: Types.PresenceAction,
): Types.PresenceState => {
  switch (action.type) {
    case Types.SET_USER_PRESENCE: {
      const { userId, isOnline, lastSeenAt } = action.payload;
      const prev = state.byUserId[userId];
      return {
        ...state,
        byUserId: {
          ...state.byUserId,
          [userId]: {
            isOnline,
            lastSeenAt: isOnline
              ? prev?.lastSeenAt
              : (lastSeenAt ?? prev?.lastSeenAt),
          },
        },
      };
    }
    case Types.CLEAR_PRESENCE:
      return { byUserId: {} };
    default:
      return state;
  }
};

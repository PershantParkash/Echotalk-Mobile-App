export const SET_USER_PRESENCE = 'presence/SET_USER_PRESENCE';
export const CLEAR_PRESENCE = 'presence/CLEAR_PRESENCE';

export type UserPresence = {
  isOnline: boolean;
  lastSeenAt?: string;
};

export type PresenceState = {
  byUserId: Record<number, UserPresence>;
};

export type SetUserPresencePayload = {
  userId: number;
  isOnline: boolean;
  lastSeenAt?: string;
};

export type PresenceAction =
  | { type: typeof SET_USER_PRESENCE; payload: SetUserPresencePayload }
  | { type: typeof CLEAR_PRESENCE };

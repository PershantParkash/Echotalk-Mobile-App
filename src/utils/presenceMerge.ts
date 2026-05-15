import type { UserPresence } from '../store/presence/presence.types';

/**
 * Overlay live `/call` presence onto a user row from REST (same idea as web StatusSync).
 */
export function mergeUserWithPresence<
  T extends { id?: number; isOnline?: boolean; lastSeenAt?: string },
>(user: T | null | undefined, byUserId: Record<number, UserPresence> | undefined): T | null {
  if (user == null) {
    return null;
  }
  const uid = user?.id;
  if (typeof uid !== 'number' || !Number.isFinite(uid)) {
    return user;
  }
  const p = byUserId?.[uid];
  if (!p) {
    return user;
  }
  const nextOnline = p?.isOnline ?? user?.isOnline;
  return {
    ...user,
    isOnline: nextOnline,
    lastSeenAt: nextOnline
      ? user?.lastSeenAt
      : (p?.lastSeenAt ?? user?.lastSeenAt),
  };
}

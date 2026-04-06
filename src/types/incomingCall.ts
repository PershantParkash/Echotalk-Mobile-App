/**
 * Payload emitted by the `/call` socket as `receivingCall`
 * (see backend `call.gateway.ts`).
 */
export type IncomingCallPayload = {
  from: string;
  to: string;
  callerName?: string;
  callerProfileImage?: string;
  calleeName?: string;
  calleeProfileImage?: string;
  roomName?: string;
  callLogId?: number;
  startTime?: string | Date;
  callType?: 'audio' | 'video';
};

function coerceStartTime(start: IncomingCallPayload['startTime']) {
  if (start instanceof Date) {
    return start;
  }
  if (start != null && String(start).length > 0) {
    return new Date(start as string);
  }
  return new Date();
}

/** Body for `answerCall` socket event (matches web `CallingPayload`). */
export function incomingCallToAnswerPayload(p: IncomingCallPayload) {
  return {
    from: String(p?.from ?? ''),
    to: String(p?.to ?? ''),
    callerName: p?.callerName ?? '',
    callerProfileImage: p?.callerProfileImage ?? '',
    calleeProfileImage: p?.calleeProfileImage ?? '',
    calleeName: p?.calleeName ?? '',
    roomName: String(p?.roomName ?? ''),
    callLogId: Number(p?.callLogId ?? 0),
    startTime: coerceStartTime(p?.startTime),
    callType: p?.callType,
  };
}

/** Body for `rejectCall` socket event. */
export function incomingCallToRejectPayload(p: IncomingCallPayload) {
  return {
    to: String(p?.to ?? ''),
    from: String(p?.from ?? ''),
    callerName: p?.callerName ?? '',
    callerProfileImage: p?.callerProfileImage ?? '',
    calleeProfileImage: p?.calleeProfileImage ?? '',
    calleeName: p?.calleeName ?? '',
    roomName: String(p?.roomName ?? ''),
    callLogId: Number(p?.callLogId ?? 0),
    startTime: coerceStartTime(p?.startTime),
    callType: p?.callType,
  };
}

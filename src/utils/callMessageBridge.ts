import { DeviceEventEmitter } from 'react-native';
import axiosClient from '../services/axiosClient';

export const CALL_MESSAGE_EVENT = 'callMessageReceived';

export interface CallMessagePayload {
  callerId: number;
  message: any;
}

export interface CallerInfo {
  fullName?: string | null;
  profileImage?: string | null;
}

export const fetchAndEmitCallMessage = async (
  callerId: string | number,
  callerInfo?: CallerInfo,
) => {
  try {
    const numericId = Number(callerId);
    const res = await axiosClient.get(
      `/v1/chats/${numericId}/call-message`,
    );
    const message = res?.data?.data;
    if (message) {
      const payload: CallMessagePayload = {
        callerId: numericId,
        message: {
          ...message,
          sender: {
            id: numericId,
            fullName: message?.sender?.fullName ?? callerInfo?.fullName ?? null,
            profileImage: message?.sender?.profileImage ?? callerInfo?.profileImage ?? null,
          },
        },
      };
      DeviceEventEmitter.emit(CALL_MESSAGE_EVENT, payload);
    }
  } catch {
    // Silently fail — the message will still appear on next chat load
  }
};

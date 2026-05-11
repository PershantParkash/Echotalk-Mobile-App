import { DeviceEventEmitter } from 'react-native';
import axiosClient from '../services/axiosClient';

export const CALL_MESSAGE_EVENT = 'callMessageReceived';

export interface CallMessagePayload {
  callerId: number;
  message: any;
}

export const fetchAndEmitCallMessage = async (callerId: string | number) => {
  try {
    const numericId = Number(callerId);
    const res = await axiosClient.get(
      `/v1/chats/${numericId}/call-message`,
    );
    const message = res?.data?.data;
    if (message) {
      const payload: CallMessagePayload = {
        callerId: numericId,
        message: { ...message, sender: { id: numericId, ...message?.sender } },
      };
      DeviceEventEmitter.emit(CALL_MESSAGE_EVENT, payload);
    }
  } catch {
    // Silently fail — the message will still appear on next chat load
  }
};

import React from 'react';
import { View, Text } from 'react-native';

type Props = {
  visible: boolean;
  connected: boolean;
  lastMessage: unknown;
};

function pretty(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export default function SignAiOverlay({ visible, connected, lastMessage }: Props) {
  if (!visible) return null;

  const text = pretty(lastMessage);

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: 12,
        right: 12,
        top: 76,
        backgroundColor: 'rgba(0,0,0,0.65)',
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.18)',
      }}
    >
      <Text style={{ color: 'white', fontWeight: '700', marginBottom: 4 }}>
        Sign AI {connected ? '• Connected' : '• Connecting…'}
      </Text>
      <Text style={{ color: '#d1d5db', fontSize: 12 }} numberOfLines={8}>
        {text || 'Waiting for server response…'}
      </Text>
    </View>
  );
}


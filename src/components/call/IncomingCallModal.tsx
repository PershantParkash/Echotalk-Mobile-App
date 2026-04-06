import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Phone, PhoneOff, Video } from 'lucide-react-native';
import type { IncomingCallPayload } from '../../types/incomingCall';

export interface IncomingCallModalProps {
  visible: boolean;
  payload: IncomingCallPayload | null;
  onAnswer: () => void;
  onDecline: () => void;
}

const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  visible,
  payload,
  onAnswer,
  onDecline,
}) => {
  const callerName =
    payload?.callerName?.trim?.()?.length && payload?.callerName != null
      ? payload.callerName
      : 'Incoming call';
  const isVideo = payload?.callType === 'video';
  const avatarUri = payload?.callerProfileImage?.trim?.() ?? '';

  return (
    <Modal
      visible={visible && payload != null}
      animationType="slide"
      {...(Platform.OS === 'ios'
        ? { presentationStyle: 'fullScreen' as const }
        : {})}
      statusBarTranslucent
      onRequestClose={onDecline}
    >
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.inner}>
          <Text style={styles.label}>Incoming {isVideo ? 'video' : 'voice'} call</Text>

          <View style={styles.avatarWrap}>
            {avatarUri?.length > 0 ? (
              <Image
                source={{ uri: avatarUri }}
                style={styles.avatar}
                accessibilityLabel="Caller profile"
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarLetter}>
                  {callerName?.[0]?.toUpperCase?.() ?? '?'}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.name} numberOfLines={2}>
            {callerName}
          </Text>

          <View style={styles.actions}>
            <TouchableOpacity
              accessibilityLabel="Decline call"
              style={[styles.circleBtn, styles.decline]}
              onPress={onDecline}
              activeOpacity={0.85}
            >
              <PhoneOff color="#fff" size={32} strokeWidth={2.2} />
            </TouchableOpacity>

            <TouchableOpacity
              accessibilityLabel="Answer call"
              style={[styles.circleBtn, styles.answer]}
              onPress={onAnswer}
              activeOpacity={0.85}
            >
              {isVideo ? (
                <Video color="#fff" size={30} strokeWidth={2.2} />
              ) : (
                <Phone color="#fff" size={30} strokeWidth={2.2} />
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.hint}>
            {Platform.OS === 'android'
              ? 'You may also get a system notification when the app is in the background.'
              : 'Allow notifications for calls when the app is not open.'}
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  label: {
    color: '#94a3b8',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 32,
    textTransform: 'capitalize',
  },
  avatarWrap: {
    marginBottom: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#334155',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#f8fafc',
    fontSize: 44,
    fontWeight: '700',
  },
  name: {
    color: '#f8fafc',
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 56,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 48,
    marginBottom: 40,
  },
  circleBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  decline: {
    backgroundColor: '#ef4444',
  },
  answer: {
    backgroundColor: '#22c55e',
  },
  hint: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 300,
  },
});

export default IncomingCallModal;

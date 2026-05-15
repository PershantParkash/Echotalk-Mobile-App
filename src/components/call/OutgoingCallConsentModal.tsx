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
import { ShieldCheck, Video, Phone, X, CircleAlert } from 'lucide-react-native';

export interface OutgoingCallConsentModalProps {
  visible: boolean;
  calleeName: string;
  calleeProfileImage?: string | null;
  callType: 'audio' | 'video';
  onAccept: () => void;
  onDecline: () => void;
}

const OutgoingCallConsentModal: React.FC<OutgoingCallConsentModalProps> = ({
  visible,
  calleeName,
  calleeProfileImage,
  callType,
  onAccept,
  onDecline,
}) => {
  const safeName = calleeName?.trim?.() || 'Contact';
  const avatarUri = calleeProfileImage?.trim?.() ?? '';
  const isVideo = callType === 'video';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      {...(Platform.OS === 'ios'
        ? { presentationStyle: 'pageSheet' as const }
        : {})}
      statusBarTranslucent
      onRequestClose={onDecline}
    >
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Before you start</Text>
          <TouchableOpacity
            accessibilityLabel="Close"
            onPress={onDecline}
            activeOpacity={0.85}
            style={styles.closeBtn}
          >
            <X color="#e2e8f0" size={22} strokeWidth={2.4} />
          </TouchableOpacity>
        </View>

        <View style={styles.inner}>
          <View style={styles.avatarWrap}>
            {avatarUri?.length > 0 ? (
              <Image
                source={{ uri: avatarUri }}
                style={styles.avatar}
                accessibilityLabel="Callee profile"
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarLetter}>
                  {safeName?.[0]?.toUpperCase?.() ?? '?'}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.titleRow}>
            {isVideo ? (
              <Video color="#c4b5fd" size={20} strokeWidth={2.2} />
            ) : (
              <Phone color="#c4b5fd" size={20} strokeWidth={2.2} />
            )}
            <Text style={styles.title}>
              {isVideo ? 'Video call' : 'Call'} {safeName}
            </Text>
          </View>

          <View style={styles.warningBox}>
            <CircleAlert color="#fff" size={20} strokeWidth={2.2} />
            <Text style={styles.warningText}>
              This {isVideo ? 'video ' : ''}call will be recorded
            </Text>
          </View>

          <View style={styles.reasonWrap}>
            <Text style={styles.reasonHeader}>Why this call will be recorded</Text>
            <View style={styles.reasonRow}>
              <ShieldCheck color="#22c55e" size={18} strokeWidth={2.4} />
              <Text style={styles.reasonText}>
                Generate automatic call summaries for both parties
              </Text>
            </View>
            <View style={styles.reasonRow}>
              <ShieldCheck color="#22c55e" size={18} strokeWidth={2.4} />
              <Text style={styles.reasonText}>
                Help you keep track of important conversation points
              </Text>
            </View>
            <View style={styles.reasonRow}>
              <ShieldCheck color="#22c55e" size={18} strokeWidth={2.4} />
              <Text style={styles.reasonText}>
                Improve call quality and user experience
              </Text>
            </View>
          </View>

          <View style={styles.privacyBox}>
            <Text style={styles.privacyText}>
              <Text style={styles.privacyBold}>Privacy Notice: </Text>
              Your call recordings are securely stored and used only for summary generation.
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            accessibilityLabel="Decline"
            style={[styles.actionBtn, styles.declineBtn]}
            onPress={onDecline}
            activeOpacity={0.9}
          >
            <Text style={[styles.actionText, styles.declineText]}>Decline</Text>
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityLabel={isVideo ? 'Accept and start video call' : 'Accept and start call'}
            style={[styles.actionBtn, styles.acceptBtn]}
            onPress={onAccept}
            activeOpacity={0.9}
          >
            <Text style={[styles.actionText, styles.acceptText]}>
              Accept &amp; {isVideo ? 'Video Call' : 'Call'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0b1220',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#e2e8f0',
    fontSize: 15,
    fontWeight: '700',
  },
  closeBtn: {
    position: 'absolute',
    right: 12,
    top: 8,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  inner: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: 12,
  },
  avatarWrap: {
    marginTop: 8,
    marginBottom: 18,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: 'rgba(226,232,240,0.18)',
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(226,232,240,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#f8fafc',
    fontSize: 36,
    fontWeight: '800',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  title: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '800',
  },
  warningBox: {
    width: '100%',
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#a855f7',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    marginBottom: 18,
  },
  warningText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  reasonWrap: {
    width: '100%',
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(226,232,240,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.10)',
    marginBottom: 12,
  },
  reasonHeader: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 8,
  },
  reasonText: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  privacyBox: {
    width: '100%',
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(226,232,240,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.10)',
  },
  privacyText: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 17,
  },
  privacyBold: {
    color: '#cbd5e1',
    fontWeight: '800',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingTop: 10,
  },
  actionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.22)',
  },
  acceptBtn: {
    backgroundColor: '#8b5cf6',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '800',
  },
  declineText: {
    color: '#e2e8f0',
  },
  acceptText: {
    color: '#ffffff',
  },
});

export default OutgoingCallConsentModal;


import React, { useEffect, useRef, useState, memo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  StyleSheet,
  Animated,
} from 'react-native';
import {
  Image as ImageIcon,
  Mic,
  Send,
  X,
  Pause,
  Play,
  Trash2,
} from 'lucide-react-native';
import { VOICE_MESSAGE_PURPLE } from '../../utils/voiceRecordingConfig';

export type ChatVoiceMode = 'none' | 'recording' | 'paused' | 'preview';

/** Wall-clock recording timer; ticked locally in this bar so ChatScreen re-renders do not delay the UI. */
export type VoiceRecordingClock = {
  startEpochMs: number;
  pausedTotalMs: number;
  pauseEpochMs: number | null;
};

export interface ChatMessageBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  sending?: boolean;
  imageUploading?: boolean;
  placeholder?: string;
  maxLength?: number;
  onImagePress?: () => void;
  pendingImageUri?: string | null;
  onCancelImage?: () => void;
  onMicPress?: () => void;
  micDisabled?: boolean;
  /** In-bar voice recording / preview */
  voiceMode?: ChatVoiceMode;
  voiceRecordingClock?: VoiceRecordingClock | null;
  voicePreviewDurationSec?: number;
  onVoicePause?: () => void;
  onVoiceResume?: () => void;
  onVoiceStop?: () => void;
  onVoiceDiscardPreview?: () => void;
  onVoiceSendPreview?: () => void;
}

const WAVE_BARS = 12;

const formatMmSs = (sec: number) => {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
};

export const recordingElapsedSecFromClock = (
  clock: VoiceRecordingClock | null | undefined,
) => {
  const start = clock?.startEpochMs;
  if (start == null) {
    return 0;
  }
  const pausedTotal = clock?.pausedTotalMs ?? 0;
  const pauseAt = clock?.pauseEpochMs;
  const now = Date.now();
  const endMs = pauseAt != null ? pauseAt : now;
  const ms = Math.max(0, endMs - start - pausedTotal);
  return ms / 1000;
};

/** One native-driver opacity pulse instead of 12 per-bar height animations (avoids JS-thread load). */
const BarWaveform: React.FC<{ active: boolean }> = ({ active }) => {
  const pulse = useRef(new Animated.Value(0.82)).current;
  const heightsRef = useRef<number[] | null>(null);
  if (heightsRef.current == null) {
    heightsRef.current = Array.from({ length: WAVE_BARS }, (_, i) => 6 + ((i * 7) % 16));
  }
  const heights = heightsRef.current;

  useEffect(() => {
    if (!active) {
      pulse.setValue(0.82);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 520,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.68,
          duration: 520,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, pulse]);

  const content = (
    <>
      {heights.map((h, i) => (
        <View
          key={i}
          style={[
            waveStyles.bar,
            { height: h, backgroundColor: VOICE_MESSAGE_PURPLE },
          ]}
        />
      ))}
    </>
  );

  return active ? (
    <Animated.View style={[waveStyles.row, { opacity: pulse }]}>
      {content}
    </Animated.View>
  ) : (
    <View style={waveStyles.row}>{content}</View>
  );
};

const waveStyles = StyleSheet.create({
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: 26,
    marginHorizontal: 6,
    minWidth: 0,
  },
  bar: {
    width: 3,
    marginHorizontal: 1,
    borderRadius: 2,
    opacity: 0.9,
  },
});

const ChatMessageBarInner: React.FC<ChatMessageBarProps> = ({
  value,
  onChangeText,
  onSend,
  sending = false,
  imageUploading = false,
  placeholder = 'Write your message',
  maxLength = 1000,
  onImagePress,
  pendingImageUri = null,
  onCancelImage,
  onMicPress,
  micDisabled = false,
  voiceMode = 'none',
  voiceRecordingClock = null,
  voicePreviewDurationSec = 0,
  onVoicePause,
  onVoiceResume,
  onVoiceStop,
  onVoiceDiscardPreview,
  onVoiceSendPreview,
}) => {
  const hasText = (value?.trim?.() ?? '').length > 0;
  const hasPendingImage = (pendingImageUri?.trim?.() ?? '').length > 0;
  const disableAttachments = sending || imageUploading;
  const canSend = hasText || hasPendingImage;
  const micBlocked = disableAttachments || micDisabled;
  const inVoice = voiceMode !== 'none';

  const [recordingTick, setRecordingTick] = useState(0);
  useEffect(() => {
    const needsTick =
      (voiceMode === 'recording' || voiceMode === 'paused') &&
      voiceRecordingClock != null;
    if (!needsTick) {
      return;
    }
    const id = setInterval(() => setRecordingTick(t => t + 1), 100);
    return () => clearInterval(id);
  }, [voiceMode, voiceRecordingClock]);

  const recordingElapsedSec =
    recordingElapsedSecFromClock(voiceRecordingClock) +
    (recordingTick - recordingTick);

  return (
    <View className="px-4 pb-4 pt-2 bg-white border-t border-gray-100">
      {hasPendingImage && !inVoice && (
        <View className="mb-3 self-start">
          <View className="relative">
            <Image
              source={{ uri: pendingImageUri ?? '' }}
              className="w-20 h-20 rounded-xl bg-gray-100"
              resizeMode="cover"
            />
            <TouchableOpacity
              className="absolute -right-2 -top-2 w-7 h-7 rounded-full bg-black/70 items-center justify-center"
              onPress={() => onCancelImage?.()}
              activeOpacity={0.8}
              disabled={sending}
            >
              <X size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View className="flex-row items-center bg-gray-50 rounded-full px-3 py-2 min-h-[48px]">
        {voiceMode === 'none' && (
          <TouchableOpacity
            className="mr-2"
            onPress={() => onImagePress?.()}
            activeOpacity={0.7}
            disabled={disableAttachments}
          >
            {imageUploading ? (
              <ActivityIndicator size="small" color="#9333ea" />
            ) : (
              <ImageIcon size={22} color="#6b7280" />
            )}
          </TouchableOpacity>
        )}

        {voiceMode === 'recording' || voiceMode === 'paused' ? (
          <>
            <Text
              style={styles.timeLeft}
              numberOfLines={1}
              selectable={false}
            >
              {formatMmSs(recordingElapsedSec)}
            </Text>
            <BarWaveform active={voiceMode === 'recording'} />
            <View style={styles.voiceActions}>
              {voiceMode === 'recording' ? (
                <TouchableOpacity
                  style={styles.iconCircle}
                  onPress={() => onVoicePause?.()}
                  disabled={sending}
                  activeOpacity={0.85}
                >
                  <Pause size={18} color={VOICE_MESSAGE_PURPLE} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.iconCircle}
                  onPress={() => onVoiceResume?.()}
                  disabled={sending}
                  activeOpacity={0.85}
                >
                  <Play
                    size={18}
                    color={VOICE_MESSAGE_PURPLE}
                    style={styles.playNudge}
                  />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.stopCircle}
                onPress={() => onVoiceStop?.()}
                disabled={sending}
                activeOpacity={0.85}
              >
                <View style={styles.stopSquare} />
              </TouchableOpacity>
            </View>
          </>
        ) : null}

        {voiceMode === 'preview' ? (
          <>
            <Text
              style={styles.timeLeft}
              numberOfLines={1}
              selectable={false}
            >
              {formatMmSs(voicePreviewDurationSec)}
            </Text>
            <View style={styles.previewMiddle}>
              <Text style={styles.previewLabel} numberOfLines={1}>
                Voice message
              </Text>
            </View>
            <View style={styles.voiceActions}>
              <TouchableOpacity
                style={styles.discardCircle}
                onPress={() => onVoiceDiscardPreview?.()}
                disabled={sending}
                activeOpacity={0.85}
              >
                <Trash2 size={18} color="#b91c1c" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sendCircle}
                onPress={() => onVoiceSendPreview?.()}
                disabled={sending}
                activeOpacity={0.85}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Send size={18} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          </>
        ) : null}

        {voiceMode === 'none' && (
          <>
            <TextInput
              value={value}
              onChangeText={onChangeText}
              placeholder={placeholder}
              placeholderTextColor="#9ca3af"
              className="flex-1 text-base py-2"
              multiline
              maxLength={maxLength}
              onSubmitEditing={onSend}
              editable={!sending}
              returnKeyType="send"
              blurOnSubmit={false}
            />

            {canSend ? (
              <TouchableOpacity
                onPress={onSend}
                className="w-10 h-10 bg-purple-600 rounded-full items-center justify-center ml-1"
                disabled={sending}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Send size={18} color="#fff" />
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                className="w-10 h-10 bg-purple-600 rounded-full items-center justify-center ml-1"
                onPress={() => onMicPress?.()}
                disabled={micBlocked}
                activeOpacity={0.85}
              >
                <Mic size={18} color="#fff" />
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  timeLeft: {
    fontSize: 15,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    color: VOICE_MESSAGE_PURPLE,
    minWidth: 52,
    marginRight: 4,
  },
  voiceActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: VOICE_MESSAGE_PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playNudge: {
    marginLeft: 2,
  },
  stopCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  stopSquare: {
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: '#fff',
  },
  previewMiddle: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
    paddingHorizontal: 4,
  },
  previewLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    textAlign: 'center',
  },
  discardCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fecaca',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: VOICE_MESSAGE_PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});

const ChatMessageBar = memo(ChatMessageBarInner);

export default ChatMessageBar;

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import audioRecorderPlayer from '../../utils/audioRecorderPlayer';
import { Play, Pause } from 'lucide-react-native';
import { VOICE_MESSAGE_PURPLE } from '../../utils/voiceRecordingConfig';

const BAR_COUNT = 18;

const formatMmSs = (sec: number) => {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
};

const hashSeed = (n: number) => {
  const base = Math.floor(Math.abs(Number(n))) + 1;
  const x = (base * 9301 + 49297) % 233280;
  return x / 233280;
};

const barHeightsForMessage = (messageId: number): number[] =>
  Array.from({ length: BAR_COUNT }, (_, i) => {
    const t = hashSeed(messageId * 31 + i);
    return 6 + t * 22;
  });

export interface VoiceMessageBubbleProps {
  audioUri: string;
  isMyMessage: boolean;
  messageId: number;
  /** Known duration (e.g. optimistic) before metadata loads */
  initialDurationSec?: number | null;
}

const VoiceMessageBubble: React.FC<VoiceMessageBubbleProps> = ({
  audioUri,
  isMyMessage,
  messageId,
  initialDurationSec,
}) => {
  const [playing, setPlaying] = useState(false);
  const [pausedMid, setPausedMid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(
    () =>
      typeof initialDurationSec === 'number' && initialDurationSec > 0
        ? Math.round(initialDurationSec * 1000)
        : 0,
  );
  const uriRef = useRef(audioUri);
  uriRef.current = audioUri;

  const barHeights = useMemo(
    () => barHeightsForMessage(messageId),
    [messageId],
  );

  const stopLocal = useCallback(async () => {
    try {
      await audioRecorderPlayer.stopPlayer();
    } catch {
      /* already stopped */
    }
    audioRecorderPlayer.removePlayBackListener();
    setPlaying(false);
    setPausedMid(false);
    setPositionMs(0);
  }, []);

  const togglePlay = useCallback(async () => {
    const uri = uriRef.current?.trim?.() ?? '';
    if (!uri?.length) {
      return;
    }

    if (playing) {
      try {
        await audioRecorderPlayer.pausePlayer();
      } catch {
        await stopLocal();
        return;
      }
      setPlaying(false);
      setPausedMid(true);
      return;
    }

    if (pausedMid && positionMs > 0) {
      try {
        setLoading(true);
        await audioRecorderPlayer.resumePlayer();
        setPlaying(true);
        setPausedMid(false);
      } catch {
        await stopLocal();
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      setLoading(true);
      await audioRecorderPlayer.stopPlayer().catch(() => {});
      audioRecorderPlayer.removePlayBackListener();

      await audioRecorderPlayer.setSubscriptionDuration(0.08).catch(() => {});
      audioRecorderPlayer.addPlayBackListener(e => {
        const d = e?.duration ?? 0;
        const p = e?.currentPosition ?? 0;
        if (d > 0) {
          setDurationMs(d);
        }
        setPositionMs(p);
        if (d > 0 && p >= d - 120) {
          setPlaying(false);
          setPausedMid(false);
        }
      });

      await audioRecorderPlayer.startPlayer(uri);
      setPlaying(true);
      setPausedMid(false);
    } catch {
      await stopLocal();
    } finally {
      setLoading(false);
    }
  }, [playing, pausedMid, positionMs, stopLocal]);

  useEffect(() => {
    return () => {
      stopLocal().catch(() => {});
    };
  }, [stopLocal]);

  const totalMs = durationMs > 0 ? durationMs : 1;
  const progress = Math.min(1, Math.max(0, positionMs / totalMs));
  const filledBars = Math.round(progress * BAR_COUNT);

  const bubbleBg = isMyMessage ? VOICE_MESSAGE_PURPLE : '#E8DEF9';
  const barOn = isMyMessage ? '#ffffff' : VOICE_MESSAGE_PURPLE;
  const barOff = isMyMessage ? 'rgba(255,255,255,0.35)' : 'rgba(99,53,198,0.35)';
  const playCircleBg = '#ffffff';
  const playIconColor = VOICE_MESSAGE_PURPLE;
  const timeColor = isMyMessage ? '#ffffff' : VOICE_MESSAGE_PURPLE;

  const displayTotalSec =
    durationMs > 0
      ? durationMs / 1000
      : typeof initialDurationSec === 'number'
        ? initialDurationSec
        : 0;
  const displayCurrentSec = durationMs > 0 ? positionMs / 1000 : 0;
  const timeLabel =
    playing || positionMs > 0
      ? formatMmSs(displayCurrentSec)
      : formatMmSs(displayTotalSec);

  const radiusStyle = isMyMessage
    ? {
        borderTopLeftRadius: 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        borderTopRightRadius: 4,
      }
    : {
        borderTopRightRadius: 20,
        borderBottomRightRadius: 20,
        borderBottomLeftRadius: 20,
        borderTopLeftRadius: 4,
      };

  return (
    <View style={[styles.bubble, { backgroundColor: bubbleBg }, radiusStyle]}>
      <TouchableOpacity
        onPress={() => {
          togglePlay().catch(() => {});
        }}
        disabled={loading}
        style={[styles.playOuter, { backgroundColor: playCircleBg }]}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator size="small" color={playIconColor} />
        ) : playing ? (
          <Pause size={16} color={playIconColor} />
        ) : (
          <Play size={16} color={playIconColor} style={styles.playIconNudge} />
        )}
      </TouchableOpacity>

      <View style={styles.waveArea}>
        <View style={styles.waveRow}>
          {barHeights.map((h, i) => (
            <View
              key={i}
              style={[
                styles.bar,
                {
                  height: h,
                  backgroundColor: i < filledBars ? barOn : barOff,
                },
              ]}
            />
          ))}
        </View>
      </View>

      <Text style={[styles.time, { color: timeColor }]}>{timeLabel}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    maxWidth: 280,
  },
  playOuter: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  playIconNudge: {
    marginLeft: 2,
  },
  waveArea: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  waveRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 28,
  },
  bar: {
    width: 3,
    borderRadius: 2,
  },
  time: {
    marginLeft: 8,
    fontSize: 12,
    fontVariant: ['tabular-nums'],
    fontWeight: '600',
    minWidth: 44,
    textAlign: 'right',
  },
});

export default VoiceMessageBubble;

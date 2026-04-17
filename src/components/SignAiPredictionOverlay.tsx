import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export type SignAiTopPrediction = { label: string; probability: number };

export type SignAiPrediction = {
  current?: string;
  confidence?: number;
  sentence_text?: string;
  top?: SignAiTopPrediction[];
  frames_seen?: number;
  frames_needed?: number;
  ready?: boolean;
};

type Props = {
  visible: boolean;
  connected: boolean;
  prediction: SignAiPrediction | null;
};

const pct = (p: number) => Math.max(0, Math.min(100, p * 100));

export default function SignAiPredictionOverlay({
  visible,
  connected,
  prediction,
}: Props) {
  if (!visible) return null;

  const current = prediction?.current?.trim?.() || 'unknown';
  const conf = typeof prediction?.confidence === 'number' ? prediction.confidence : 0;
  const built =
    typeof prediction?.sentence_text === 'string' && prediction.sentence_text.trim()
      ? prediction.sentence_text.trim()
      : '—';
  const top = Array.isArray(prediction?.top) ? prediction?.top ?? [] : [];
  const framesSeen = prediction?.frames_seen ?? 0;
  const framesNeeded = prediction?.frames_needed ?? 0;

  return (
    <View pointerEvents="none" style={styles.wrap}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>CURRENT SIGN</Text>
        <Text style={styles.currentSign}>{current}</Text>
        <Text style={styles.muted}>Confidence: {(conf * 100).toFixed(1)}%</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>BUILT SENTENCE</Text>
        <Text style={styles.builtSentence} numberOfLines={3}>
          {built}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Top Predictions</Text>
        {(top?.length ? top : [])?.slice?.(0, 3)?.map((item, idx) => {
          const label = item?.label ?? '';
          const p = typeof item?.probability === 'number' ? item.probability : 0;
          const percent = pct(p);
          return (
            <View key={`${label}-${idx}`} style={styles.probRow}>
              <View style={styles.probHead}>
                <Text style={styles.probLabel}>{label}</Text>
                <Text style={styles.probPct}>{percent.toFixed(1)}%</Text>
              </View>
              <View style={styles.bar}>
                <View style={[styles.barFill, { width: `${percent}%` }]} />
              </View>
            </View>
          );
        })}

        {!top?.length ? (
          <Text style={styles.muted}>Not enough frames yet for prediction.</Text>
        ) : null}
      </View>

      <View style={styles.bottomRow}>
        <View style={[styles.smallCard, styles.smallCardLeft]}>
          <Text style={styles.smallTitle}>FRAMES SEEN</Text>
          <Text style={styles.smallValue}>{String(framesSeen)}</Text>
        </View>
        <View style={styles.smallCard}>
          <Text style={styles.smallTitle}>FRAMES NEEDED</Text>
          <Text style={styles.smallValue}>{String(framesNeeded)}</Text>
        </View>
      </View>

      <Text style={styles.statusLine}>
        Sign AI {connected ? '• Connected' : '• Connecting…'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 12,
    top: 56,
    width: 300,
    zIndex: 50,
  },
  card: {
    backgroundColor: 'rgba(10,14,18,0.72)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    marginBottom: 10,
  },
  cardTitle: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
    letterSpacing: 0.8,
    fontWeight: '700',
    marginBottom: 8,
  },
  currentSign: {
    color: '#4ade80',
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 38,
    marginBottom: 2,
  },
  builtSentence: {
    color: '#fbbf24',
    fontSize: 18,
    fontWeight: '800',
    minHeight: 24,
  },
  muted: {
    color: 'rgba(255,255,255,0.70)',
    fontSize: 12,
  },
  sectionTitle: {
    color: '#8fd3ff',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  probRow: { marginBottom: 10 },
  probHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  probLabel: { color: 'white', fontSize: 14, fontWeight: '600' },
  probPct: { color: 'rgba(255,255,255,0.75)', fontSize: 14, fontWeight: '700' },
  bar: {
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 999,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#22d3ee',
  },
  bottomRow: { flexDirection: 'row', gap: 10 },
  smallCard: {
    flex: 1,
    backgroundColor: 'rgba(10,14,18,0.72)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  smallCardLeft: {},
  smallTitle: {
    color: 'rgba(255,255,255,0.60)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  smallValue: { color: 'white', fontSize: 18, fontWeight: '800' },
  statusLine: {
    marginTop: 8,
    color: 'rgba(255,255,255,0.70)',
    fontSize: 11,
    fontWeight: '600',
  },
});


import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export type DetrDetection = {
  class: string;
  confidence: number;
};

export type DetrPrediction = {
  top?: DetrDetection;
  detections?: DetrDetection[];
};

type Props = {
  visible: boolean;
  connected: boolean;
  prediction: DetrPrediction | null;
  signerName?: string;
  /** Distance from bottom edge (px). Useful to sit above call controls. */
  bottomOffsetPx?: number;
};

export default function DetrPredictionOverlay({
  visible,
  // connected,
  prediction,
  signerName,
  bottomOffsetPx,
}: Props) {
  if (!visible) return null;

  const label = prediction?.top?.class?.trim?.() ?? '';
  // Only show the bar when we have an actual prediction label.
  // This avoids showing "Waiting for prediction…".
  if (!label) return null;
  // const conf =
  //   typeof prediction?.top?.confidence === 'number' ? prediction.top.confidence : null;
  const who = signerName?.trim?.() || 'You';
  const bottom = typeof bottomOffsetPx === 'number' ? bottomOffsetPx : 0;

  return (
    <View pointerEvents="none" style={[styles.wrap, { bottom }]}>
      <View style={styles.bar}>
        <Text style={styles.caption} numberOfLines={1}>
          <Text style={styles.who}>{who}: </Text>
          <Text style={styles.label}>{label}</Text>
        </Text>
        {/* <Text style={styles.status} numberOfLines={1}>
          DETR {connected ? '• Connected' : '• Connecting…'}
          {conf != null ? ` • ${(conf * 100).toFixed(1)}%` : ''}
        </Text> */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 60,
  },
  bar: {
    width: '100%',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'center',
    backgroundColor: 'rgba(10,14,18,0.92)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  caption: {
    width: '100%',
  },
  who: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 16,
    fontWeight: '900',
  },
  status: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.62)',
    fontSize: 11,
    fontWeight: '700',
  },
  label: {
    color: '#4ade80',
    fontSize: 16,
    fontWeight: '900',
  },
});


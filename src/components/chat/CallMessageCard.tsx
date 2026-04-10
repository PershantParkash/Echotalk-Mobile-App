import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { PhoneCall, Video, PhoneMissed } from "lucide-react-native";
import { formatCallDuration } from "../../utils/formatCallDuration";

export type CallMessageCardMessage = {
  id: number;
  content: string;
  createdAt: string;
  callStatus?: string | null;
  callDuration?: number | null;
  callSummary?: string | null;
};

type CallStatusKey = "voicecall" | "videocall" | "missed" | "declined";

const STATUS_LABELS: Record<CallStatusKey, string> = {
  voicecall: "Voice call",
  videocall: "Video call",
  missed: "Missed call",
  declined: "Declined call",
};

const STATUS_COLORS: Record<CallStatusKey, Readonly<string>> = {
  voicecall: "#B0FFBE",
  videocall: "#7ADCFF",
  missed: "#FF8F8F",
  declined: "#FF5252",
};

const NEUTRAL_ICON_BG = "#E5E7EB";

const isCallStatusKey = (s: string | null | undefined): s is CallStatusKey =>
  s === "voicecall" ||
  s === "videocall" ||
  s === "missed" ||
  s === "declined";

export interface CallMessageCardProps {
  message: CallMessageCardMessage;
  /** Chat bubble timestamp formatter (e.g. 02:30 PM) */
  formatMessageTime: (iso: string) => string;
}

const CallMessageCard: React.FC<CallMessageCardProps> = ({
  message,
  formatMessageTime,
}) => {
  const status = isCallStatusKey(message?.callStatus) ? message.callStatus : null;
  const iconBg = status ? STATUS_COLORS[status] : NEUTRAL_ICON_BG;
  const headline = message?.content?.trim?.()?.length
    ? message.content
    : status
      ? STATUS_LABELS[status]
      : "Call";

  const subline =
    status === "missed" || status === "declined"
      ? "No answer"
      : status === "voicecall" || status === "videocall"
        ? formatCallDuration(message?.callDuration ?? 0)
        : null;

  const timeStr = formatMessageTime(message?.createdAt ?? "");

  const renderIcon = () => {
    const color = "#1f2937";
    const size = 20;
    if (status === "videocall") {
      return <Video color={color} size={size} strokeWidth={2.25} />;
    }
    if (status === "missed" || status === "declined") {
      return <PhoneMissed color={color} size={size} strokeWidth={2.25} />;
    }
    return <PhoneCall color={color} size={size} strokeWidth={2.25} />;
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
          {renderIcon()}
        </View>
        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={2}>
            {headline}
          </Text>
          <View style={styles.metaRow}>
            {subline ? (
              <Text style={styles.subline} numberOfLines={2}>
                {subline}
              </Text>
            ) : (
              <View style={styles.sublinePlaceholder} />
            )}
            <Text style={styles.time}>{timeStr}</Text>
          </View>
        </View>
      </View>

      {message?.callSummary?.trim?.()?.length ? (
        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>Call summary</Text>
          <Text style={styles.summaryText}>{message.callSummary}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    maxWidth: 340,
    width: "100%",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  subline: {
    flex: 1,
    fontSize: 13,
    color: "#6b7280",
  },
  sublinePlaceholder: {
    flex: 1,
  },
  time: {
    fontSize: 11,
    color: "#9ca3af",
    marginLeft: 4,
  },
  summaryBox: {
    marginTop: 10,
    backgroundColor: "#7c3aed",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  summaryTitle: {
    textAlign: "center",
    color: "#e9d5ff",
    fontWeight: "600",
    fontSize: 14,
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: "#ffffff",
    lineHeight: 20,
  },
});

export default CallMessageCard;

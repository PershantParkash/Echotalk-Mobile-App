import React from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Pencil, Pin, Trash2 } from 'lucide-react-native';

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

interface MessageActionSheetProps {
  visible: boolean;
  messagePreview?: string | null;
  canEdit?: boolean;
  isPinned?: boolean;
  busy?: boolean;
  onClose?: () => void;
  onEdit?: () => void;
  onTogglePin?: () => void;
  onDelete?: () => void;
  onReact?: (emoji: string) => void;
}

const MessageActionSheet: React.FC<MessageActionSheetProps> = ({
  visible,
  messagePreview = null,
  canEdit = false,
  isPinned = false,
  busy = false,
  onClose,
  onEdit,
  onTogglePin,
  onDelete,
  onReact,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => onClose?.()}
    >
      <View style={styles.backdrop}>
        <TouchableOpacity
          activeOpacity={1}
          style={StyleSheet.absoluteFillObject}
          onPress={() => onClose?.()}
        />

        <View style={styles.sheetCard}>
          <View style={styles.handle} />

          <Text style={styles.sheetTitle}>Message actions</Text>

          {(messagePreview?.trim?.() ?? '').length > 0 && (
            <Text numberOfLines={2} style={styles.previewText}>
              {messagePreview?.trim?.()}
            </Text>
          )}

          <View style={styles.reactionRow}>
            {QUICK_REACTIONS.map(emoji => (
              <TouchableOpacity
                key={emoji}
                activeOpacity={0.8}
                style={styles.reactionButton}
                disabled={busy}
                onPress={() => onReact?.(emoji)}
              >
                <Text style={styles.reactionEmoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {canEdit && (
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.actionRow}
              disabled={busy}
              onPress={() => onEdit?.()}
            >
              <Pencil size={18} color="#4b5563" />
              <Text style={styles.actionText}>Edit message</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.actionRow}
            disabled={busy}
            onPress={() => onTogglePin?.()}
          >
            <Pin size={18} color="#4b5563" />
            <Text style={styles.actionText}>
              {isPinned ? 'Unpin' : 'Pin'} message
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.actionRow}
            disabled={busy}
            onPress={() => onDelete?.()}
          >
            <Trash2 size={18} color="#dc2626" />
            <Text style={styles.deleteText}>Delete message</Text>
          </TouchableOpacity>

          {busy && (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="#5b2ec4" />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.34)',
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  sheetCard: {
    borderRadius: 24,
    backgroundColor: '#fff',
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 18,
  },
  handle: {
    alignSelf: 'center',
    width: 42,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#e5e7eb',
    marginBottom: 14,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  previewText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: '#6b7280',
  },
  reactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 10,
  },
  reactionButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reactionEmoji: {
    fontSize: 22,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  actionText: {
    marginLeft: 12,
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  deleteText: {
    marginLeft: 12,
    fontSize: 15,
    fontWeight: '600',
    color: '#dc2626',
  },
  loadingRow: {
    alignItems: 'center',
    paddingTop: 10,
  },
});

export default MessageActionSheet;

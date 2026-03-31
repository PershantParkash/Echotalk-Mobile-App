import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Image as ImageIcon, Mic, Send, X } from 'lucide-react-native';

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
}

const ChatMessageBar: React.FC<ChatMessageBarProps> = ({
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
}) => {
  const hasText = (value?.trim?.() ?? '').length > 0;
  const hasPendingImage = (pendingImageUri?.trim?.() ?? '').length > 0;
  const disableAttachments = sending || imageUploading;
  const canSend = hasText || hasPendingImage;

  return (
    <View className="px-4 pb-4 pt-2 bg-white border-t border-gray-100">
      {hasPendingImage && (
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

      <View className="flex-row items-center bg-gray-50 rounded-full px-4 py-2">
        <TouchableOpacity
          className="mr-3"
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
            className="w-10 h-10 bg-purple-600 rounded-full items-center justify-center"
            disabled={sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Send size={18} color="#fff" />
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity className="w-10 h-10 bg-purple-600 rounded-full items-center justify-center">
            <Mic size={18} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default ChatMessageBar;

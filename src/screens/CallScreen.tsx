import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { RouteProp } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  PhoneOff,
  Hand,
  Mic,
  MicOff,
  Video,
  VideoOff,
} from 'lucide-react-native';
import { RootStackParamList } from '../navigation/navigation';
import CallSocketSingleton from '../utils/sockets/call-socket';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import createAgoraRtcEngine, {
  ChannelMediaOptions,
  ClientRoleType,
  RenderModeType,
  RtcSurfaceView,
  RtcTextureView,
} from 'react-native-agora';
import { NEXT_PUBLIC_AGORA_APP_ID } from '@env';
import { generateAgoraTokenForCall } from '../utils/agora-token';
import { incomingCallToAnswerPayload } from '../types/incomingCall';
import { startRenderedViewFrameCapture } from '../utils/videoFrameCapture';
import { SignAiFrameStreamer } from '../utils/ai/signAiFrameStreamer';
import SignAiPredictionOverlay, {
  type SignAiPrediction,
} from '../components/SignAiPredictionOverlay';

type CallNav = NativeStackNavigationProp<RootStackParamList, 'CallScreen'>;
type CallRoute = RouteProp<RootStackParamList, 'CallScreen'>;

const CallScreen = () => {
  const navigation = useNavigation<CallNav>();
  const route = useRoute<CallRoute>();
  const { userDetails } = useSelector((state: RootState) => state.user);

  const [muted, setMuted] = useState(false);
  const [videoOn, setVideoOn] = useState(false);
  // const [speakerOn, setSpeakerOn] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [callStatus, setCallStatus] = useState<'calling' | 'receiving' | 'active' | 'ended'>('calling');
  const [calleeName, setCalleeName] = useState<string>('');
  const [roomName, setRoomName] = useState<string>('');
  const [callType, setCallType] = useState<'audio' | 'video'>('audio');
  const [callLogId, setCallLogId] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<string | null>(null);
  const socketRef = useRef<any>(null);
  const engineRef = useRef<any | null>(null);
  const agoraListenersRef = useRef<{
    onUserJoined?: (connection: unknown, uid: number, elapsed: number) => void;
    onUserOffline?: (
      connection: unknown,
      uid: number,
      reason: number,
    ) => void;
  }>({});
  const peerIdsRef = useRef<{ from?: string; to?: string }>({});
  const callTypeRef = useRef<'audio' | 'video'>('audio');
  const [remoteUid, setRemoteUid] = useState<number | null>(null);
  /** True after Agora `joinChannel` succeeds (drives video UI; refs do not re-render). */
  const [mediaReady, setMediaReady] = useState(false);
  const [callSocketReady, setCallSocketReady] = useState(false);
  const answerEmittedRef = useRef(false);
  const localVideoCaptureRef = useRef<any | null>(null);
  const stopFrameCaptureRef = useRef<null | (() => void)>(null);
  const signAiStreamerRef = useRef<SignAiFrameStreamer | null>(null);
  const [_signAiLastMessage, setSignAiLastMessage] = useState<unknown>(null);
  const [signAiConnected, setSignAiConnected] = useState(false);
  const [signAiPrediction, setSignAiPrediction] = useState<SignAiPrediction | null>(null);

  useEffect(() => {
    callTypeRef.current = callType;
  }, [callType]);

  const cleanupAgora = async () => {
    try {
      const engine = engineRef.current;
      const listeners = agoraListenersRef.current;
      if (engine?.removeListener && listeners.onUserJoined) {
        engine.removeListener('onUserJoined', listeners.onUserJoined);
      }
      if (engine?.removeListener && listeners.onUserOffline) {
        engine.removeListener('onUserOffline', listeners.onUserOffline);
      }
      agoraListenersRef.current = {};
      if (engine) {
        engine.leaveChannel?.();
        engine.release?.();
      }
    } catch {
      // ignore cleanup errors
    } finally {
      engineRef.current = null;
      setRemoteUid(null);
      setMediaReady(false);
    }
  };

  const endLocally = useCallback(async () => {
    await cleanupAgora();
    setCallStatus('ended');
    navigation?.goBack?.();
  }, [navigation]);

  useEffect(() => {
    CallSocketSingleton.connect()
      .then(s => {
        socketRef.current = s;
        setCallSocketReady(true);
      })
      .catch(() => {
        Alert.alert('Call error', 'Unable to connect call socket.');
      });
  }, []);

  /** Hydrate from navigation when answering from IncomingCallModal / push. */
  useEffect(() => {
    const p = route.params?.callPayload;
    if (!p?.from || !p?.to) {
      return;
    }
    setRoomName(String(p?.roomName ?? ''));
    setCallLogId(p?.callLogId ?? null);
    const st = p?.startTime;
    setStartTime(
      st instanceof Date
        ? st.toISOString()
        : st != null
          ? String(st)
          : null,
    );
    setCallType(p?.callType === 'video' ? 'video' : 'audio');
    setCalleeName(p?.callerName ?? '');
    setCallStatus('receiving');
    peerIdsRef.current = {
      from: String(p.from),
      to: String(p.to),
    };
  }, [route.params?.callPayload]);

  /** Emit answer once the call socket is connected (after modal Answer). */
  useEffect(() => {
    const should = route.params?.answerIncoming === true;
    const p = route.params?.callPayload;
    if (!should || !p?.from || !p?.to || !callSocketReady || answerEmittedRef.current) {
      return;
    }
    const sock = socketRef.current ?? CallSocketSingleton.getInstance();
    if (!sock?.emit) {
      return;
    }
    answerEmittedRef.current = true;
    sock.emit?.('answerCall', incomingCallToAnswerPayload(p));
  }, [callSocketReady, route.params?.answerIncoming, route.params?.callPayload]);

  useEffect(() => {
    return () => {
      answerEmittedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!callSocketReady) {
      return;
    }
    const socket = socketRef.current ?? CallSocketSingleton.getInstance();
    if (!socket) {
      return;
    }

    const handleCallInitiated = (data: any) => {
      setRoomName(data?.roomName ?? roomName);
      setCallLogId(data?.callLogId ?? null);
      setStartTime(data?.startTime ?? null);
      setCallType((data?.callType as 'audio' | 'video') ?? 'audio');
      setCalleeName(data?.calleeName ?? data?.callerName ?? '');
      setCallStatus('calling');
      peerIdsRef.current = {
        from: data?.from != null ? String(data.from) : peerIdsRef.current.from,
        to: data?.to != null ? String(data.to) : peerIdsRef.current.to,
      };
    };

    const handleReceivingCall = (data: any) => {
      setRoomName(data?.roomName ?? roomName);
      setCallLogId(data?.callLogId ?? null);
      setStartTime(data?.startTime ?? null);
      setCallType((data?.callType as 'audio' | 'video') ?? 'audio');
      setCalleeName(data?.callerName ?? '');
      setCallStatus('receiving');
      peerIdsRef.current = {
        from: data?.from != null ? String(data.from) : peerIdsRef.current.from,
        to: data?.to != null ? String(data.to) : peerIdsRef.current.to,
      };
    };

    const handleCallAccepted = async (data: any) => {
      setRoomName(data?.roomName ?? roomName);
      setCallLogId(data?.callLogId ?? null);
      setStartTime(data?.startTime ?? null);
      setCallStatus('active');
      setRemoteUid(null);
      peerIdsRef.current = {
        from: data?.from != null ? String(data.from) : peerIdsRef.current.from,
        to: data?.to != null ? String(data.to) : peerIdsRef.current.to,
      };

      try {
        const appId = NEXT_PUBLIC_AGORA_APP_ID?.trim?.() ?? '';
        if (!appId) {
          throw new Error('Missing Agora app id (NEXT_PUBLIC_AGORA_APP_ID)');
        }

        await cleanupAgora();

        const engine = createAgoraRtcEngine();
        engineRef.current = engine;

        const initCode = engine.initialize({ appId });
        if (initCode !== 0) {
          throw new Error(
            `Agora initialize failed: ${initCode} — ${engine.getErrorDescription?.(initCode) ?? ''}`,
          );
        }

        engine.enableAudio();
        const wantVideo = callTypeRef.current === 'video';
        if (wantVideo) {
          engine.enableVideo?.();
          engine.enableLocalVideo?.(true);
          // Local preview; must run before/around join so RtcSurfaceView has a capture stream.
          engine.startPreview?.();
          setVideoOn(true);
        }

        const onUserJoined = (_connection: unknown, uid: number) => {
          setRemoteUid(uid);
        };
        const onUserOffline = (_connection: unknown, uid: number) => {
          setRemoteUid((prev) => (prev === uid ? null : prev));
        };
        agoraListenersRef.current = { onUserJoined, onUserOffline };
        engine.addListener?.('onUserJoined', onUserJoined);
        engine.addListener?.('onUserOffline', onUserOffline);

        const resolvedRoom = String(data?.roomName ?? roomName ?? '');
        if (!resolvedRoom?.length) {
          throw new Error('Missing room name for Agora channel');
        }

        const channel = `AgoraRoom_${resolvedRoom}`;
        const token = generateAgoraTokenForCall(channel, userDetails?.id ?? 0);

        const mediaOptions = new ChannelMediaOptions();
        mediaOptions.publishMicrophoneTrack = true;
        mediaOptions.publishCameraTrack = wantVideo;
        mediaOptions.autoSubscribeAudio = true;
        mediaOptions.autoSubscribeVideo = true;
        mediaOptions.clientRoleType = ClientRoleType.ClientRoleBroadcaster;
        mediaOptions.enableAudioRecordingOrPlayout = true;

        // Token is built with uid 0 (same as web); join with 0 so privilege matches.
        const joinCode = engine.joinChannel(token, channel, 0, mediaOptions);
        if (joinCode !== 0) {
          throw new Error(
            `Agora joinChannel failed: ${joinCode} — ${engine.getErrorDescription?.(joinCode) ?? ''}`,
          );
        }
        setMediaReady(true);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e ?? 'Unknown error');
        Alert.alert('Call error', `Unable to join media channel.\n${msg}`);
      }
    };

    const handleEnd = async () => {
      await endLocally();
    };

    const handleAnsweredElsewhere = async () => {
      await endLocally();
    };

    const handleReceivingVideoCallRequest = (data: any) => {
      if (!userDetails?.id) return;
      if (String(data?.requestedTo) !== String(userDetails.id)) {
        return;
      }
      Alert.alert(
        'Video call request',
        `${data?.requesterName ?? 'User'} wants to turn on video.`,
        [
          {
            text: 'Decline',
            style: 'cancel',
            onPress: () => {
              const socketLocal = socketRef.current;
              if (!socketLocal) return;
              socketLocal.emit?.('denyVideoCall', {
                requestedFrom: String(data?.requestedFrom ?? ''),
                requestedTo: String(data?.requestedTo ?? ''),
                requesterName: data?.requesterName ?? '',
                requesteeName: data?.requesteeName ?? '',
                roomName: roomName,
              });
            },
          },
          {
            text: 'Accept',
            onPress: async () => {
              const socketLocal = socketRef.current;
              if (!socketLocal) return;
              socketLocal.emit?.('acceptVideoCall', {
                requestedFrom: String(data?.requestedFrom ?? ''),
                requestedTo: String(data?.requestedTo ?? ''),
                requesterName: data?.requesterName ?? '',
                requesteeName: data?.requesteeName ?? '',
                roomName: roomName,
              });
            },
          },
        ],
      );
    };

    const handleVideoCallAccepted = async () => {
      setCallType('video');
      setVideoOn(true);
      const engine = engineRef.current;
      if (!engine) {
        return;
      }
      try {
        engine.enableVideo?.();
        engine.enableLocalVideo?.(true);
        engine.startPreview?.();
        const opts = new ChannelMediaOptions();
        opts.publishCameraTrack = true;
        engine.updateChannelMediaOptions?.(opts);
      } catch {
        // ignore
      }
    };

    const handleVideoCallDenied = () => {
      setVideoOn(false);
      Alert.alert('Video request', 'Video request was declined.');
    };

    socket.on?.('callInitiated', handleCallInitiated);
    socket.on?.('receivingCall', handleReceivingCall);
    socket.on?.('callAccepted', handleCallAccepted);
    socket.on?.('onCallEnded', handleEnd);
    socket.on?.('onCallCancelled', handleEnd);
    socket.on?.('onRejectCall', handleEnd);
    socket.on?.('callAnsweredOnAnotherDevice', handleAnsweredElsewhere);
    socket.on?.('receivingVideoCallRequest', handleReceivingVideoCallRequest);
    socket.on?.('videoCallAccepted', handleVideoCallAccepted);
    socket.on?.('videoCallDenied', handleVideoCallDenied);

    return () => {
      socket.off?.('callInitiated', handleCallInitiated);
      socket.off?.('receivingCall', handleReceivingCall);
      socket.off?.('callAccepted', handleCallAccepted);
      socket.off?.('onCallEnded', handleEnd);
      socket.off?.('onCallCancelled', handleEnd);
      socket.off?.('onRejectCall', handleEnd);
      socket.off?.('callAnsweredOnAnotherDevice', handleAnsweredElsewhere);
      socket.off?.('receivingVideoCallRequest', handleReceivingVideoCallRequest);
      socket.off?.('videoCallAccepted', handleVideoCallAccepted);
      socket.off?.('videoCallDenied', handleVideoCallDenied);
    };
  }, [callSocketReady, callType, roomName, userDetails?.id, endLocally]);

  const emitEndCall = () => {
    const socket = socketRef.current;
    if (!socket || !roomName || !callLogId || !startTime || !userDetails?.id) {
      return;
    }

    socket.emit?.('endCall', {
      from: String(userDetails.id),
      to: '',
      callerName: userDetails.fullName ?? '',
      callerProfileImage: userDetails.profileImage ?? '',
      calleeProfileImage: '',
      calleeName,
      roomName,
      callLogId,
      startTime,
    });
  };

  const handleEndPress = async () => {
    emitEndCall();
    await endLocally();
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    const engine = engineRef.current;
    engine?.muteLocalAudioStream?.(next);
  };

  const toggleVideo = () => {
    const next = !videoOn;
    const socket = socketRef.current;

    if (!socket || !peerIdsRef.current || !userDetails?.id || !roomName) {
      return;
    }

    const selfId = String(userDetails.id);
    const fromId = peerIdsRef.current.from;
    const toId = peerIdsRef.current.to;

    const otherUserId =
      fromId === selfId
        ? toId
        : toId === selfId
          ? fromId
          : undefined;

    if (!otherUserId) {
      return;
    }

    if (next) {
      socket.emit?.('requestVideoCall', {
        requestedFrom: selfId,
        requestedTo: otherUserId,
        requesterName: userDetails.fullName ?? '',
        requesteeName: calleeName,
        roomName,
      });
    } else {
      socket.emit?.('denyVideoCall', {
        requestedFrom: otherUserId,
        requestedTo: selfId,
        requesterName: '',
        requesteeName: userDetails.fullName ?? '',
        roomName,
      });
      const engine = engineRef.current;
      try {
        engine?.enableLocalVideo?.(false);
        const opts = new ChannelMediaOptions();
        opts.publishCameraTrack = false;
        engine?.updateChannelMediaOptions?.(opts);
      } catch {
        // ignore
      }
      setVideoOn(false);
    }
  };

  // const toggleSpeaker = () => {
  //   // UI-only for now; wire to audio route when available.
  //   setSpeakerOn((s) => !s);
  // };

  const toggleHand = () => {
    setHandRaised((value) => !value);
  };



  const title =
    callStatus === 'receiving'
      ? 'Incoming call'
      : callStatus === 'active'
        ? callType === 'video'
          ? 'In video call'
          : 'In call'
        : 'Calling...';

  const showVideoLayout =
    callStatus === 'active' && callType === 'video' && mediaReady;

  useEffect(() => {
    if (!signAiStreamerRef.current) {
      const streamer = new SignAiFrameStreamer({ debug: true });
      streamer.onServerMessage((msg) => {
        setSignAiLastMessage(msg);
        setSignAiConnected(streamer.isConnected);

        const obj = msg && typeof msg === 'object' ? (msg as any) : null;
        const payload =
          obj?.type === 'prediction' && obj != null ? obj : obj;

        if (payload && typeof payload === 'object') {
          const pred: SignAiPrediction = {
            current: typeof payload?.current === 'string' ? payload.current : undefined,
            confidence:
              typeof payload?.confidence === 'number' ? payload.confidence : undefined,
            sentence_text:
              typeof payload?.sentence_text === 'string' ? payload.sentence_text : undefined,
            frames_seen:
              typeof payload?.frames_seen === 'number' ? payload.frames_seen : undefined,
            frames_needed:
              typeof payload?.frames_needed === 'number' ? payload.frames_needed : undefined,
            ready: typeof payload?.ready === 'boolean' ? payload.ready : undefined,
            top: Array.isArray(payload?.top)
              ? (payload.top ?? [])
                ?.map?.((t: any) => ({
                  label: String(t?.label ?? ''),
                  probability: Number(t?.probability ?? 0),
                }))
                ?.filter?.((t: any) => t?.label)
              : undefined,
          };
          setSignAiPrediction(pred);
        }
      });
      signAiStreamerRef.current = streamer;
    }
    return () => {
      signAiStreamerRef.current?.disconnect?.();
      signAiStreamerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const streamer = signAiStreamerRef.current;
    if (!streamer) return;

    // Connect only while the user has enabled sign-language mode.
    if (handRaised) {
      streamer.start();
      setSignAiConnected(streamer.isConnected);
      return;
    }

    streamer.disconnect();
    setSignAiConnected(false);
    setSignAiLastMessage(null);
    setSignAiPrediction(null);
  }, [handRaised]);

  useEffect(() => {
    // Capture frames only while "hand raised" is active.
    if (!(handRaised && showVideoLayout && videoOn)) {
      stopFrameCaptureRef.current?.();
      stopFrameCaptureRef.current = null;
      return;
    }

    stopFrameCaptureRef.current?.();
    stopFrameCaptureRef.current = startRenderedViewFrameCapture({
      targetRef: localVideoCaptureRef,
      // CRITICAL: stream ~8-9 fps
      intervalMs: 120,
      // Fail-safe: react-native-view-shot can occasionally hang a snapshot call.
      // If that happens, we want to recover and keep sending frames.
      captureTimeoutMs: 1200,
      label: 'hand-raised',
      onFrameBase64: (base64) => {
        // Push frames to AI WS; server responses will populate the overlay.
        signAiStreamerRef.current?.sendJpegBase64?.(base64);
      },
    });

    return () => {
      stopFrameCaptureRef.current?.();
      stopFrameCaptureRef.current = null;
    };
  }, [handRaised, showVideoLayout, videoOn]);

  return (
    <SafeAreaView className="flex-1 bg-neutral-900" edges={['top']}>
      {showVideoLayout ? (
        <View className="flex-1 bg-black">
          <SignAiPredictionOverlay
            visible={handRaised}
            connected={signAiConnected}
            prediction={signAiPrediction}
          />
          {remoteUid != null ? (
            <RtcSurfaceView
              style={styles.remoteVideo}
              canvas={{
                uid: remoteUid,
                renderMode: RenderModeType.RenderModeHidden,
              }}
            />
          ) : (
            <View className="flex-1 items-center justify-center bg-neutral-900 px-6">
              <Text className="text-center text-base text-neutral-400">
                Waiting for peer video…
              </Text>
            </View>
          )}
          {videoOn ? (
            <View
              ref={localVideoCaptureRef}
              collapsable={false}
              style={[
                styles.localPip,
                Platform.OS === 'android' ? styles.localPipAndroid : null,
              ]}
            >
              {Platform.OS === 'android' ? (
                <RtcTextureView
                  style={styles.localVideo}
                  canvas={{
                    renderMode: RenderModeType.RenderModeHidden,
                  }}
                />
              ) : (
                <RtcSurfaceView
                  style={styles.localVideo}
                  zOrderMediaOverlay
                  canvas={{
                    renderMode: RenderModeType.RenderModeHidden,
                  }}
                />
              )}
            </View>
          ) : null}
          <View
            pointerEvents="none"
            className="absolute left-0 right-0 top-3 items-center px-6"
          >
            <Text className="text-center text-lg font-semibold text-white drop-shadow-md">
              {calleeName || 'Call'}
            </Text>
            <Text className="mt-1 text-center text-sm text-neutral-300">
              {title}
            </Text>
          </View>
        </View>
      ) : (
        <View className="flex-1 items-center justify-center px-6">
          <View className="mb-5 h-28 w-28 items-center justify-center rounded-full bg-neutral-700">
            <Text className="text-3xl font-semibold text-white">
              {calleeName?.[0] ?? '?'}
            </Text>
          </View>
          <Text className="text-center text-xl font-semibold text-white">
            {calleeName || 'Call'}
          </Text>
          <Text className="mt-2 text-center text-base text-neutral-400">
            {title}
          </Text>
        </View>
      )}

      <SafeAreaView edges={['bottom']} className="bg-transparent">
        <View
          style={styles.floatingBar}
          className="flex flex-row items-center justify-between"
        >
          {/* Sign Language */}
          <TouchableOpacity
            accessibilityLabel={handRaised ? 'Lower hand' : 'Raise hand'}
            activeOpacity={0.85}
            className={`h-[54px] w-[54px] items-center justify-center rounded-full ${handRaised ? 'bg-green-500' : 'bg-neutral-700'
              }`}
            onPress={toggleHand}
          >
            <Hand color="#ffffff" size={24} strokeWidth={2.2} />
          </TouchableOpacity>

          {/* Video Button */}
          <TouchableOpacity
            accessibilityLabel={videoOn ? 'Turn off video' : 'Turn on video'}
            activeOpacity={0.85}
            className="h-[54px] w-[54px] items-center justify-center rounded-full bg-neutral-700"
            onPress={toggleVideo}
          >
            {videoOn ? (
              <Video color="#ffffff" size={24} strokeWidth={2.2} />
            ) : (
              <VideoOff color="#ffffff" size={24} strokeWidth={2.2} />
            )}
          </TouchableOpacity>

          {/* Loud Speaker Button */}
          {/* <TouchableOpacity
            accessibilityLabel={speakerOn ? 'Speaker off' : 'Speaker on'}
            activeOpacity={0.85}
            className={`h-[54px] w-[54px] items-center justify-center rounded-full ${speakerOn ? 'bg-white' : 'bg-neutral-700'
              }`}
            onPress={toggleSpeaker}
          >
            <Volume2 color="#ffffff" size={24} strokeWidth={2.2} />
          </TouchableOpacity> */}

          {/* Mute Button */}
          <TouchableOpacity
            accessibilityLabel={muted ? 'Unmute' : 'Mute'}
            activeOpacity={0.85}
            className="h-[54px] w-[54px] items-center justify-center rounded-full bg-neutral-700"
            onPress={toggleMute}
          >
            {muted ? (
              <MicOff color="#ffffff" size={24} strokeWidth={2.2} />
            ) : (
              <Mic color="#ffffff" size={24} strokeWidth={2.2} />
            )}
          </TouchableOpacity>

          {/* End Call Button */}
          <TouchableOpacity
            accessibilityLabel="End call"
            activeOpacity={0.85}
            className="h-[54px] w-[54px] items-center justify-center rounded-full bg-red-600"
            onPress={handleEndPress}
          >
            <PhoneOff color="#ffffff" size={24} strokeWidth={2.2} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  remoteVideo: {
    flex: 1,
    width: '100%',
  },
  localPip: {
    position: 'absolute',
    right: 12,
    top: 56,
    width: 112,
    height: 168,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: '#111',
  },
  localPipAndroid: {
    elevation: 4,
  },
  localVideo: {
    flex: 1,
    width: '100%',
  },
  floatingBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    alignItems: 'center',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(23,23,23,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    ...(Platform.OS === 'android'
      ? { elevation: 10 }
      : {
        shadowColor: '#000',
        shadowOpacity: 0.35,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 10 },
      }),
  },
});

export default CallScreen;

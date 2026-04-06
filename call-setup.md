# Call functionality — EchoTalk mobile app

This document describes how **signaling** (Socket.IO) and **media** (Agora RTC) work together in `echotalk-app`, and which files to change for debugging or extensions.

---

## Overview

| Layer | Technology | Role |
|--------|------------|------|
| Signaling | Socket.IO namespace **`/call`** | Ringing, accept/reject, call lifecycle, video upgrade negotiation |
| Media | **react-native-agora** (RTC v4) | Audio/video capture, encode, and rendering |
| Tokens | Pure JS builder in-app (`agora-token.ts`) | RTC access tokens (006), compatible with typical web token format; join with **uid `0`** |

The backend URL is the same REST/API base used elsewhere; the call socket connects to **`${NEXT_PUBLIC_API_BASE}/call`** (trailing slashes on the base are stripped before appending `/call`).

---

## Environment variables

Configure in `.env` (via `react-native-dotenv` / `@env`):

| Variable | Usage |
|----------|--------|
| `NEXT_PUBLIC_API_BASE` | Socket.IO origin; call socket uses `${base}/call`. |
| `NEXT_PUBLIC_AGORA_APP_ID` | Passed to `createAgoraRtcEngine().initialize({ appId })`. |
| `NEXT_PUBLIC_AGORA_APP_CERTIFICATE` | Used only client-side to mint RTC tokens (same pattern as many web demos; **protect the certificate** in production—prefer a server-issued token for production apps). |

---

## Key files

| Path | Responsibility |
|------|----------------|
| `App.tsx` | Connects call socket at startup; on **`receivingCall`** navigates to **`CallScreen`** (with optional `callPayload`); resets duplicate-navigation guard on **`onCallEnded`**, **`onCallCancelled`**, **`onRejectCall`**. |
| `src/utils/sockets/call-socket.ts` | Singleton Socket.IO client for `/call`; JWT in `query.token` and `auth.token`; **`refresh-auth`** on reconnect / token rotation. |
| `src/screens/ChatScreen.tsx` | Outgoing calls: permissions → **`callUser`** emit → **`navigate('CallScreen')`**. |
| `src/screens/CallScreen.tsx` | All socket listeners for call + video upgrade; Agora init, join, **`RtcSurfaceView`**; mute / end / video toggle. |
| `src/utils/agora-token.ts` | `generateAgoraTokenForCall(channelName, userId)` — publisher privileges, **uid `0`** in token payload to match **`joinChannel(..., 0)`**. |
| `src/utils/permissions.ts` | Android: **`RECORD_AUDIO`**, **`CAMERA`**. iOS: currently returns `true` without prompting (ensure **Info.plist** microphone/camera usage strings for App Store). |

---

## Socket connection (`call-socket.ts`)

- **Connect:** `CallSocketSingleton.connect()` — async, reads access token via `getAccessToken()`.
- **URL:** `{NEXT_PUBLIC_API_BASE}/call` (no double slashes).
- **Auth:** `query: { token }`, `auth: { token }`.
- **Transports:** `polling`, `websocket`; reconnection enabled.
- **Token refresh:** On `connect_error`, if stored token changed, updates `socket.auth` and either emits `refresh-auth` or reconnects with new `query`.
- **Public API:** `getInstance()`, `connect()`, `refreshAuth()`, `disconnect()`.

---

## Outgoing call (`ChatScreen`)

1. User taps audio or video in chat header actions.
2. **`ensureAudioPermission()`** (always); **`ensureVideoPermission()`** if `callType === 'video'` (Android runtime prompts).
3. **`CallSocketSingleton.connect()`** then **`socket.emit('callUser', { ... })`** with:
   - `from`, `to` (string user ids)
   - `callerName`, `callerProfileImage`, `calleeName`, `calleeProfileImage`
   - `roomName` — **deterministic** `min(id1,id2)_max(id1,id2)` via `generateRoomName`
   - `startTime` — `new Date()`
   - `callLogId` — `null` from client (server may assign)
   - `callType` — `'audio' | 'video'`
4. **`navigation.navigate('CallScreen')`** — no route params required for state; **CallScreen** syncs from socket events.

---

## Incoming call (`App.tsx`)

1. After `CallSocketSingleton.connect()`, listens for **`receivingCall`**.
2. Uses **`hasNavigatedForCallRef`** so only one navigation happens per incoming ring.
3. **`navigationRef.navigate('CallScreen', { callPayload } as any)`** — payload shape depends on server; **CallScreen** currently drives UI from socket handlers, not from initial params.
4. Guard resets when **`onCallEnded`**, **`onCallCancelled`**, or **`onRejectCall`** fires.

---

## Call screen — Socket events

Registered on the same singleton socket instance (from `getInstance()` or `connect()` in `CallScreen`).

### Lifecycle / metadata

| Event | Handler behavior |
|--------|------------------|
| **`callInitiated`** | Outgoing side: `roomName`, `callLogId`, `startTime`, `callType`, callee/caller names, **`peerIdsRef`** `from`/`to`, status **`calling`**. |
| **`receivingCall`** | Incoming side (also from `App.tsx`): same fields; status **`receiving`**; `calleeName` from `callerName`. |
| **`callAccepted`** | Status **`active`**; runs Agora setup (see below). Clears **`remoteUid`**, then joins channel. |
| **`onCallEnded`**, **`onCallCancelled`**, **`onRejectCall`** | **`endLocally()`** — Agora cleanup, **`goBack()`**. |

### Video upgrade

| Event | Direction | Behavior |
|--------|-----------|----------|
| **`requestVideoCall`** | Client → server | Emitted from toolbar when user turns video **on** mid-call (`requestedFrom`, `requestedTo`, names, `roomName`). |
| **`receivingVideoCallRequest`** | Server → callee | Alert accept/decline; **`acceptVideoCall`** / **`denyVideoCall`** with same identity fields + `roomName`. |
| **`videoCallAccepted`** | Both | **`handleVideoCallAccepted`**: `callType` → `'video'`, `videoOn` → true; `enableVideo`, `enableLocalVideo(true)`, `startPreview`, **`updateChannelMediaOptions({ publishCameraTrack: true })`**. |
| **`videoCallDenied`** | — | Alert; `videoOn` false. |

Decline path from alert uses **`denyVideoCall`** with the server’s expected payload.

Turning **off** video from the toolbar emits **`denyVideoCall`** with a local-oriented payload and runs **`enableLocalVideo(false)`** + **`publishCameraTrack: false`** (stays in channel for audio).

---

## Call screen — Agora flow

### After `callAccepted`

1. **`cleanupAgora()`** — remove `onUserJoined` / `onUserOffline` listeners, `leaveChannel`, `release`, clear **`remoteUid`**, **`mediaReady`**.
2. **`createAgoraRtcEngine()`** (singleton engine instance from the SDK).
3. **`initialize({ appId })`** with **`NEXT_PUBLIC_AGORA_APP_ID`**.
4. **`enableAudio()`** always.
5. If **`callType === 'video'`** (via **`callTypeRef`**): **`enableVideo()`**, **`enableLocalVideo(true)`**, **`startPreview()`**, **`setVideoOn(true)`**.
6. Register **`onUserJoined`** / **`onUserOffline`** → update **`remoteUid`** for remote **`RtcSurfaceView`**.
7. **Channel name:** `AgoraRoom_${roomName}` (same naming as web).
8. **Token:** `generateAgoraTokenForCall(channel, userDetails.id)` — internally built for **uid 0**.
9. **`ChannelMediaOptions`:** `publishMicrophoneTrack: true`, `publishCameraTrack: wantVideo`, `autoSubscribeAudio/Video: true`, **`ClientRoleBroadcaster`**, `enableAudioRecordingOrPlayout: true`.
10. **`joinChannel(token, channel, 0, mediaOptions)`** — **uid 0** must match token.
11. On success: **`setMediaReady(true)`** (drives whether the video layout mounts).

### Video UI

- Shown when **`callStatus === 'active'`** && **`callType === 'video'`** && **`mediaReady`**.
- **Remote:** **`RtcSurfaceView`** with **`canvas: { uid: remoteUid, renderMode: RenderModeHidden }`**.
- **Local PiP:** **`RtcSurfaceView`** with **`zOrderMediaOverlay`** (important on Android), empty **`canvas`** uid → local preview.
- If **`remoteUid`** is still null, shows “Waiting for peer video…”.

### Toolbar

- **End:** **`emitEndCall`** (socket **`endCall`**) then **`endLocally()`**.
- **Mute:** **`muteLocalAudioStream`**.

---

## End call socket payload (`emitEndCall`)

Emitted as **`endCall`** with:

- `from`, `to`, `callerName`, `callerProfileImage`, `calleeProfileImage`, `calleeName`, `roomName`, `callLogId`, `startTime`

**Note:** In the current client, **`to`** is sent as **`''`**. If the backend requires the peer’s user id for **`endCall`**, derive it from **`peerIdsRef`** (same pattern as **`toggleVideo`**) and populate **`to`** accordingly.

---

## Token implementation (`agora-token.ts`)

- **Format:** RTC 006 token, HMAC-SHA256 via **crypto-js**, CRC via **crc-32** / **cuint**, **buffer** for packing.
- **Privileges:** join channel + publish audio/video/data for publisher role.
- **No native crypto:** avoids `react-native-quick-crypto` / NitroModules.
- **`generateAgoraTokenForCall(channelName, _userId)`** always uses **uid `0`** in the token body to align with **`joinChannel(..., 0)`**; Agora then assigns the real uid and signals it via **`onJoinChannelSuccess`** / peer discovery (**`onUserJoined`**).

---

## Permissions

- **Android:** `RECORD_AUDIO` and `CAMERA` (for video) requested before **`callUser`**.
- **iOS:** Confirm **Info.plist** keys exist (`NSMicrophoneUsageDescription`, `NSCameraUsageDescription`). The helper returns `true` on iOS without `PermissionsAndroid`; failing to add usage strings will cause runtime denial when Agora accesses devices.

---

## Navigation types

`RootStackParamList` declares **`CallScreen: undefined`**. `App.tsx` may pass **`callPayload`** when navigating from **`receivingCall`**; typings can be extended if you later read **`route.params`** in **CallScreen**.

---

## Dependencies (call-related)

- **`socket.io-client`** — signaling.
- **`react-native-agora`** — RTC engine and **`RtcSurfaceView`**.
- **`crypto-js`**, **`crc-32`**, **`cuint`**, **`buffer`** — token generation only.

---

## Aligning with the web app

To stay compatible with the existing web client and backend:

- Socket namespace **`/call`** and event names above.
- Agora channel: **`AgoraRoom_${roomName}`** with the same **`roomName`** rule (`min_max` user ids).
- Join/token uid **0** pattern if the web stack uses the same.

---

## Troubleshooting checklist

1. **`NEXT_PUBLIC_API_BASE`** reachable; JWT valid for `/call` namespace.
2. **`NEXT_PUBLIC_AGORA_APP_ID`** (and certificate if using client-derived tokens) match the Agora project.
3. **Permissions** on device (Android granted; iOS plist + user grant).
4. **Video black screen:** ensure **`RtcSurfaceView`** is mounted, **`startPreview`** ran for video, **`remoteUid`** updates on **`onUserJoined`**, **`publishCameraTrack`** true when expecting camera.
5. **Duplicate incoming navigation:** `App.tsx` guard; ensure end/reject/cancel events fire from server.

---

*Last updated to reflect the in-repo implementation. If behavior changes, update this file alongside the code.*

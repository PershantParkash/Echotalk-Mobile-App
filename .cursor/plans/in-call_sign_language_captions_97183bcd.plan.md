---
name: In-call sign language captions
overview: Add an in-call toggle that streams local video frames to your remote AI WebSocket server and overlays returned prediction text on the video call UI.
todos:
  - id: research-agora-frames
    content: Confirm the exact `react-native-agora` APIs used to access `IMediaEngine` / register `IVideoFrameObserver` in this project’s setup.
    status: pending
  - id: ws-client
    content: Create a reusable WebSocket client for the sign-language protocol (send base64 JPEG frames, parse prediction messages, reconnect).
    status: pending
  - id: native-encoder
    content: Add iOS + Android native module to convert Agora I420 frames into base64 JPEG strings fast enough for throttled streaming.
    status: pending
  - id: callscreen-wireup
    content: Replace/enable the CallScreen toggle to start/stop streaming and render returned `sentence_text` overlay during video calls.
    status: pending
  - id: cleanup-and-tests
    content: Ensure proper cleanup on toggle off/end call and verify behavior on both iOS and Android.
    status: pending
isProject: false
---

## Goal

Enable the existing button in `src/screens/CallScreen.tsx` around lines 551–559 to act as a **Sign Language** toggle. When enabled during an active video call, the app should capture local camera frames, send them to a remote AI WebSocket endpoint (same JSON protocol as `src/ai-model/index.html`), receive prediction text, and render that text as an on-screen overlay.

## What we already have

- Video calling uses Agora (`react-native-agora`) with local preview started via `engine.startPreview?.()` and video UI driven by:
  - `showVideoLayout = callStatus === 'active' && callType === 'video' && mediaReady`
  - `RtcSurfaceView` for remote and local PiP in `src/screens/CallScreen.tsx`.
- The current “Sign Language” button is wired to `toggleHand` and only flips `handRaised` (UI-only).
- The AI demo page `src/ai-model/index.html` streams **base64 JPEG** frames via WebSocket and expects `type: "prediction"` messages with fields like `current`, `confidence`, `sentence_text`, `top`, etc.

## Key constraint decisions (from you)

- AI server is **remote/prod reachable**.
- We must **keep the existing protocol** (send base64 JPEG frames over WebSocket).
- Captions are **local-only** (not sent to peer).

## Design

### 1) Frame source: Agora raw frame observer

- Use Agora’s raw video callback path (React Native SDK v4.x supports `registerVideoFrameObserver`).
- Register an `IVideoFrameObserver` on the Agora `IMediaEngine` so we can receive **local camera frames** via `onCaptureVideoFrame` or `onPreEncodeVideoFrame`.
- Only stream frames when:
  - `callStatus === 'active'`
  - `callType === 'video'`
  - `mediaReady === true`
  - `videoOn === true`
  - `signLanguageEnabled === true`

### 2) Convert I420 → JPEG(base64)

Agora frames arrive as **I420** (per Agora docs for iOS/Android). Since the server expects base64 JPEG like the web demo, add a small native module:

- **Android**: Convert I420 → NV21, then use `YuvImage.compressToJpeg(...)`, then Base64 encode.
- **iOS**: Convert I420 → NV12/BGRA (via `libyuv`), then create `CGImage`/`UIImage`, then JPEG encode, then Base64 encode.
- Expose to JS as an async function such as `encodeI420ToJpegBase64(...)`.
- Include **optional chaining** throughout JS/TS integration as a project convention.

### 3) WebSocket client (mirrors `index.html` behavior)

Create a small utility that:

- Connects to a configurable endpoint, e.g. `NEXT_PUBLIC_SIGN_LANGUAGE_WS_URL` (or similar) with `wss://...`.
- Sends `{ frame: <base64jpeg> }` at a throttled rate (default ~120ms) while enabled.
- Parses responses:
  - `type: "ready"` / `type: "error"` / `type: "prediction"`
- Maintains state: connection status + latest `sentence_text` (and optionally `current` + confidence).
- Auto-reconnect with backoff when enabled.

### 4) UI overlay in `CallScreen`

- Replace the existing `handRaised` concept with a dedicated `signLanguageEnabled` state (or repurpose it carefully).
- Add overlay text inside the video layout branch (`showVideoLayout`) as an absolute-positioned banner (top or bottom) that displays the latest `sentence_text`.
- Keep it local-only: do not emit over `CallSocketSingleton`.

## Files to change / add

- Update: `src/screens/CallScreen.tsx`
  - Add `signLanguageEnabled` state and toggle handler.
  - Start/stop the sign-language pipeline based on the gating conditions.
  - Add overlay rendering for returned text.
- Add: `src/utils/ai/sign-language-client.ts`
  - WebSocket connect/send/reconnect + message parsing.
- Add native modules:
  - Android: `android/app/src/main/java/.../SignLanguageFrameEncoderModule.kt` (or Java) + package registration.
  - iOS: `ios/.../SignLanguageFrameEncoder.m/.swift` + bridge.
  - (Exact paths depend on your existing native folder structure; we’ll place them alongside your other RN native modules.)
- Update env docs:
  - `.env` (user-provided) + optionally README note for `NEXT_PUBLIC_SIGN_LANGUAGE_WS_URL`.

## Implementation steps (high-level)

1. Add env var for the AI WS endpoint and a single place to read it.
2. Implement `sign-language-client` with WebSocket lifecycle + JSON protocol matching `src/ai-model/index.html`.
3. Implement native frame encoder (I420 → base64 JPEG) for Android + iOS.
4. Wire Agora raw frame observer registration and throttled sending when toggle is ON.
5. Render overlay text in `CallScreen` and handle cleanup on call end / toggle off.
6. Add basic instrumentation (status string) behind the scenes for debugging (no noisy UI unless you want it).

## Test plan

- Start a video call, enable the sign-language toggle.
- Verify:
  - WebSocket connects to the remote endpoint.
  - Frames are being sent at the configured interval.
  - Predictions update the overlay text.
  - Toggling OFF stops sending and closes the socket.
  - Ending the call cleans up observer + socket (no background streaming).

## Notes / risks

- JPEG encoding is CPU-intensive; we’ll throttle and keep resolution modest (similar to 640×480 in the web demo) to avoid impacting call performance.
- If performance becomes an issue later, the next step would be switching to a binary/raw-frame protocol (but you said to keep JPEG for now).

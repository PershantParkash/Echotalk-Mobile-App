### Required sound files

Place these files in this folder so the mobile app can play them (mirrors the web app’s `/sounds/*` usage):

- `phone_ringing.mp3` (looped while calling / receiving)
- `receive_call.mp3` (played once when the call becomes active)

After adding or changing files, link assets and rebuild:

```bash
cd echotalk-app
npm i
npx react-native-asset
cd ios && pod install && cd ..
npm run ios   # or npm run android
```

import AudioRecorderPlayer from 'react-native-audio-recorder-player';

/**
 * v3.x exports a class — instance methods (startRecorder, startPlayer, etc.)
 * exist only on `new AudioRecorderPlayer()`, not on the constructor.
 */
const audioRecorderPlayer = new AudioRecorderPlayer();

export default audioRecorderPlayer;

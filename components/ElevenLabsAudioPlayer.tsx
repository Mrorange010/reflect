import React from 'react';
import { WebView } from 'react-native-webview';

interface ElevenLabsAudioPlayerProps {
  publicUserId: string;
}

const ElevenLabsAudioPlayer: React.FC<ElevenLabsAudioPlayerProps> = ({ publicUserId }) => {
  const htmlContent = `
    <div id="elevenlabs-audionative-widget" data-publicuserid="${publicUserId}" data-playerurl="https://elevenlabs.io/player/index.html">
      Elevenlabs AudioNative Player
    </div>
    <script src="https://elevenlabs.io/player/audioNativeHelper.js"></script>
  `;

  return (
    <WebView
      originWhitelist={['*']}
      source={{ html: htmlContent }}
      style={{ flex: 1 }}
    />
  );
};

export default ElevenLabsAudioPlayer; 
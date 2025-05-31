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
      originWhitelist={['*']} // Consider restricting this to ['https://elevenlabs.io'] for better security
      source={{ html: htmlContent }}
      style={{ flex: 1, width: '100%', height: 300 }} // Added height for visibility
      javaScriptEnabled={true}
      domStorageEnabled={true}
      mediaPlaybackRequiresUserAction={false} // If you want audio to potentially autoplay
    />
  );
};

export default ElevenLabsAudioPlayer; 
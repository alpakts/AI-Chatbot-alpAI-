import React from 'react';

interface MicrophoneStatusProps {
  isListening: boolean;
  isSpeechDetected: boolean;
}

export const MicrophoneStatus: React.FC<MicrophoneStatusProps> = ({ isListening, isSpeechDetected }) => {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className={`block rounded-full w-3 h-3 ${isListening ? 'bg-red-500 animate-pulse' : 'bg-red-900'}`}>
        <span className="sr-only">{isListening ? 'Listening active' : 'Listening inactive'}</span>
      </span>
      <span className={`block rounded w-full h-2 ${isSpeechDetected ? 'bg-green-500' : 'bg-green-900'}`}>
        <span className="sr-only">{isSpeechDetected ? 'Speech detected' : 'No speech detected'}</span>
      </span>
    </div>
  );
};

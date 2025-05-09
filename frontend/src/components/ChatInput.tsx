import React from 'react';
import { FaMicrophone, FaStop } from 'react-icons/fa';

interface ChatInputProps {
  message: string;
  isLoading: boolean;
  isListening: boolean;
  audioLevel: number;
  microphoneError: string | null;
  browserSupportsSpeechRecognition: boolean;
  onMessageChange: (message: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onStartListening: () => void;
  onStopListening: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  message,
  isLoading,
  isListening,
  audioLevel,
  microphoneError,
  browserSupportsSpeechRecognition,
  onMessageChange,
  onSubmit,
  onStartListening,
  onStopListening,
}) => {
  return (
    <div className="sticky bottom-0 left-0 w-full bg-gradient-to-t from-[#343541] via-[#343541] to-transparent pt-6 pb-8">
      <div className="max-w-3xl mx-auto px-4">
        <form onSubmit={onSubmit} className="flex gap-3">
          <input
            type="text"
            value={message}
            onChange={(e) => onMessageChange(e.target.value)}
            placeholder={isListening ? 'Listening... Speak now' : 'Type your message...'}
            className="flex-1 px-4 py-3 bg-[#40414f] text-white rounded-xl border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
            disabled={isLoading}
          />

          {microphoneError && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-500 text-white px-4 py-2 rounded-md text-center max-w-md">
              {microphoneError}
            </div>
          )}

          {isListening && (
            <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50">
              <div className="bg-[#40414f] rounded-full p-2 flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-blue-500 animate-pulse" 
                     style={{transform: `scale(${1 + (audioLevel / 128)})`,
                            opacity: 0.5 + (audioLevel / 256)}}>
                </div>
                <span className="text-white text-sm">Listening...</span>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={isListening ? onStopListening : onStartListening}
            disabled={!browserSupportsSpeechRecognition || isLoading || !!microphoneError}
            className={`px-4 py-3 rounded-xl font-medium transition-all
              ${isListening 
                ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                : 'bg-blue-500 hover:bg-blue-600'} 
              ${(!browserSupportsSpeechRecognition || isLoading || !!microphoneError) ? 'opacity-50 cursor-not-allowed' : ''} 
              text-white relative group`}
          >
            {isListening ? <FaStop className="w-5 h-5" /> : <FaMicrophone className="w-5 h-5" />}
            <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-black rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {isListening ? 'Stop Listening' : 'Voice Input'}
            </span>
          </button>
          <button
            type="submit"
            className={`px-6 py-3 bg-[#40414f] text-white rounded-xl font-medium transition-all
              ${isLoading
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-[#4a4b57] active:scale-95'
              }`}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-gray-400 border-t-white rounded-full animate-spin" />
                <span>Thinking...</span>
              </div>
            ) : (
              'Send'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

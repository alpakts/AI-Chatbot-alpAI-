'use client';

import { useState, useRef, useEffect } from 'react';
import "regenerator-runtime/runtime";
import { ChatHistory } from '../components/ChatHistory';
import { ChatInput } from '../components/ChatInput';
import { MicrophoneStatus } from '../components/MicrophoneStatus';
import { VoiceSettings } from '../components/VoiceSettings';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';

export default function Home() {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: string; content: string; isTyping?: boolean }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [microphoneError, setMicrophoneError] = useState<string | null>(null);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const previousTranscriptRef = useRef<string>('');
  const lastTranscriptRef = useRef<string>('');
  const transcriptTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const TRANSCRIPT_TIMEOUT = 2000;

  const {
    voices,
    selectedVoice,
    voiceRate,
    voicePitch,
    setSelectedVoice,
    setVoiceRate,
    setVoicePitch,
    speakText
  } = useSpeechSynthesis();

  const {
    isListening,
    isSpeechDetected,
    audioLevel,
    browserSupportsSpeechRecognition,
    startListening,
    stopListening
  } = useSpeechRecognition({
    onTranscriptChange: (transcript) => {
      setMessage(transcript);
      checkTranscriptTimeout(transcript);
    },
    onError: (error) => setMicrophoneError(error),
    isLoading
  });

  const checkTranscriptTimeout = (transcript: string) => {
    if (transcriptTimeoutRef.current) {
      clearTimeout(transcriptTimeoutRef.current);
    }
    lastTranscriptRef.current = transcript;
    transcriptTimeoutRef.current = setTimeout(() => {
      if (transcript === lastTranscriptRef.current && transcript.trim()) {
        submitMessage(transcript);
      }
    }, TRANSCRIPT_TIMEOUT);
  };

  const submitMessage = async (messageToSubmit: string) => {
    const trimmedMessage = messageToSubmit.trim();
    if (!trimmedMessage) return;

    setMessage('');
    stopListening();

    try {
      setIsLoading(true);
      setChatHistory(prev => [...prev, { role: 'user', content: trimmedMessage }]);
      
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: trimmedMessage
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      setChatHistory(prev => [...prev, { role: 'assistant', content: '', isTyping: true }]);

      let accumulatedText = '';
      let lastSpokenText = '';
      let decoder = new TextDecoder();
      let currentSentence = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.error) {
                throw new Error(data.error);
              }

              if (data.finished) {
                if (currentSentence.trim()) {
                  speakText(currentSentence);
                }
                
                setChatHistory(prev =>
                  prev.map((msg, idx) =>
                    idx === prev.length - 1 
                      ? { role: 'assistant', content: accumulatedText, isTyping: false }
                      : msg
                  )
                );
                break;
              }

              if (data.text) {
                accumulatedText += data.text;
                currentSentence += data.text;
                
                const matches = currentSentence.match(/[^.!?]*[.!?]/g);
                if (matches) {
                  matches.forEach(sentence => {
                    if (sentence.trim() && !lastSpokenText.includes(sentence)) {
                      speakText(sentence);
                      lastSpokenText += sentence;
                    }
                  });
                  currentSentence = currentSentence.slice(matches.join('').length);
                }
                
                setChatHistory(prev =>
                  prev.map((msg, idx) =>
                    idx === prev.length - 1 
                      ? { ...msg, content: accumulatedText }
                      : msg
                  )
                );
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, an error occurred. Please try again.', 
        isTyping: false 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitMessage(message);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  return (
    <main className="min-h-screen bg-[#343541] flex flex-col">
      <button
        onClick={() => setIsSettingsOpen(!isSettingsOpen)}
        className="fixed top-4 right-4 z-50 bg-[#40414f] p-2 rounded-lg text-white hover:bg-[#4a4b57] transition-colors"
        title={isSettingsOpen ? "Close Voice Settings" : "Open Voice Settings"}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-6 w-6" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </button>

      <VoiceSettings
        isSettingsOpen={isSettingsOpen}
        voices={voices}
        selectedVoice={selectedVoice}
        voiceRate={voiceRate}
        voicePitch={voicePitch}
        onVoiceChange={setSelectedVoice}
        onRateChange={setVoiceRate}
        onPitchChange={setVoicePitch}
      />
      
      <div className="flex-1 flex flex-col max-w-3xl w-full mx-auto px-4">
        <div className="text-center py-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-transparent bg-clip-text">
            alpAI
          </h1>
          <p className="text-gray-400 mt-2">
            AI Assistant developed by Alper Aktaş
          </p>
          
          <div className="mt-4">
            <MicrophoneStatus
              isListening={isListening}
              isSpeechDetected={isSpeechDetected}
            />
          </div>
        </div>
        
        <div className="flex-1 flex flex-col relative">
          {!browserSupportsSpeechRecognition && (
            <div className="absolute top-0 left-0 right-0 z-50 bg-red-500 text-white px-4 py-2 rounded-md mb-4 text-center">
              Your browser doesn't support speech recognition. Please use Chrome.
            </div>
          )}
          
          <div 
            ref={chatContainerRef}
            className="absolute inset-0 overflow-y-auto space-y-4"
          >
            <ChatHistory
              messages={chatHistory}
              messagesEndRef={messagesEndRef}
            />
          </div>
        </div>
      </div>

      <ChatInput
        message={message}
        isLoading={isLoading}
        isListening={isListening}
        audioLevel={audioLevel}
        microphoneError={microphoneError}
        browserSupportsSpeechRecognition={browserSupportsSpeechRecognition}
        onMessageChange={setMessage}
        onSubmit={handleSubmit}
        onStartListening={startListening}
        onStopListening={stopListening}
      />
    </main>
  );
}

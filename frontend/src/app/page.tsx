'use client';

import { useState, useEffect, useRef } from 'react';
import { FaMicrophone, FaStop } from 'react-icons/fa';
import "regenerator-runtime/runtime";

export default function Home() {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: string; content: string; isTyping?: boolean }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // States for speech recognition
  const recognitionRef = useRef<typeof window.SpeechRecognition | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeechDetected, setIsSpeechDetected] = useState(false);
  const [microphoneError, setMicrophoneError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [browserSupportsSpeechRecognition, setBrowserSupportsSpeechRecognition] = useState(true);

  // States for voice synthesis
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [voiceRate, setVoiceRate] = useState<number>(1);
  const [voicePitch, setVoicePitch] = useState<number>(1);

  // For microphone audio level analysis
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);

  // For continuous listening mode
  const [isContinuousMode, setIsContinuousMode] = useState(false);
  const previousTranscriptRef = useRef<string>('');
  const lastTranscriptRef = useRef<string>('');
  const transcriptTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const TRANSCRIPT_TIMEOUT = 2000; // 2 seconds

  // For audio level analysis
  const analyzeAudio = (stream: MediaStream) => {
    const context = new AudioContext();
    setAudioContext(context);
    setAudioStream(stream);
    const analyser = context.createAnalyser();
    const microphone = context.createMediaStreamSource(stream);
    microphone.connect(analyser);
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const updateAudioLevel = () => {
      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((acc, val) => acc + val, 0) / bufferLength;
      setAudioLevel(average);

      if (isListening) {
        requestAnimationFrame(updateAudioLevel);
      }
    };

    updateAudioLevel();
  };

  // Microphone permissions and error handling
  useEffect(() => {
    const checkMicrophonePermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setMicrophoneError(null);
        analyzeAudio(stream);
      } catch (error) {
        console.error('Microphone access error:', error);
        setMicrophoneError('Microphone access was denied or an error occurred.');
      }
    };

    if (isListening) {
      checkMicrophonePermission();
    }
  }, [isListening]);

  // Ses sentezi için sesleri yükle
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices);
        // Prefer English voices
        const englishVoice = availableVoices.find(voice => 
          voice.lang.includes('en-US') || voice.lang.includes('en-GB')
        );
        // If no English voice, try Microsoft voices or default to first voice
        const microsoftVoice = availableVoices.find(voice => 
          voice.name.includes('Microsoft') && voice.lang.includes('en')
        );
        setSelectedVoice(englishVoice || microsoftVoice || availableVoices[0]);
      }
    };

    loadVoices();
    if ('onvoiceschanged' in window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Tarayıcı desteğini kontrol et
  useEffect(() => {
    const checkBrowserSupport = () => {
      const isSupported = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
      setBrowserSupportsSpeechRecognition(isSupported);
      if (!isSupported) {
        setMicrophoneError('Your browser doesn\'t support speech recognition. Please use Chrome.');
      }
    };
    checkBrowserSupport();
  }, []);

  const checkTranscriptTimeout = (transcript: string) => {
    // Önceki zamanlayıcıyı temizle
    if (transcriptTimeoutRef.current) {
      clearTimeout(transcriptTimeoutRef.current);
    }

    // Yeni transcript'i kaydet
    lastTranscriptRef.current = transcript;

    // 2 saniye bekle ve kontrol et
    transcriptTimeoutRef.current = setTimeout(() => {
      // Eğer transcript 2 saniye boyunca değişmediyse gönder
      if (transcript === lastTranscriptRef.current && transcript.trim()) {
        submitMessage(transcript);
      }
    }, TRANSCRIPT_TIMEOUT);
  };

  const speakText = (text: string) => {
    if (!selectedVoice) return;
    
    window.speechSynthesis.cancel(); // Önceki konuşmayı durdur
    
    // Metni noktalama işaretlerine göre ayır
    const sentences = text
      .split(/[.!?]/)
      .map(sentence => sentence.trim())
      .filter(sentence => sentence.length > 0);

    // Her cümle için yeni bir utterance oluştur
    sentences.forEach((sentence, index) => {
      // Orijinal metinde bu cümlenin sonundaki noktalama işaretini bul
      let punctuation = '.';
      const sentenceIndex = text.indexOf(sentence);
      if (sentenceIndex !== -1) {
        const nextChar = text[sentenceIndex + sentence.length];
        if (nextChar === '!' || nextChar === '?' || nextChar === '.') {
          punctuation = nextChar;
        }
      }

      const utterance = new SpeechSynthesisUtterance(sentence + punctuation);
      utterance.voice = selectedVoice;
      utterance.rate = voiceRate;
      utterance.pitch = voicePitch;
      utterance.volume = 1;

      // Noktalama işaretine göre ses ayarları
      switch (punctuation) {
        case '?':
          // Soru cümlesi: Ton yüksek, hız yavaş
          utterance.pitch = voicePitch * 1.3;
          utterance.rate = voiceRate * 0.9;
          break;
        case '!':
          // Ünlem cümlesi: Ses yüksek, hız hızlı, ton biraz yüksek
          utterance.volume = 1.3;
          utterance.rate = voiceRate * 1.2;
          utterance.pitch = voicePitch * 1.1;
          break;
        default:
          // Normal cümle: Standart ayarlar
          break;
      }

      // Son cümle değilse küçük bir gecikme ekle
      if (index < sentences.length - 1) {
        utterance.onend = () => {
          setTimeout(() => {
            window.speechSynthesis.resume();
          }, 150); // Cümleler arası biraz daha uzun duraklama
        };
      }
      
      window.speechSynthesis.speak(utterance);
    });
  };

  const submitMessage = async (messageToSubmit: string) => {
    const trimmedMessage = messageToSubmit.trim();
    if (!trimmedMessage) return;

    setMessage('');
    cleanup();

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

      // Add assistant's message placeholder
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
                // Son cümleyi de seslendir
                if (currentSentence.trim()) {
                  speakText(currentSentence);
                }
                
                // Update final message
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
                
                // Noktalama işaretlerini kontrol et
                const matches = currentSentence.match(/[^.!?]*[.!?]/g);
                if (matches) {
                  // Tamamlanan cümleleri seslendir
                  matches.forEach(sentence => {
                    if (sentence.trim() && !lastSpokenText.includes(sentence)) {
                      speakText(sentence);
                      lastSpokenText += sentence;
                    }
                  });
                  // Son tamamlanan cümleden sonraki metni sakla
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

  const cleanup = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (audioContext) {
      audioContext.close();
    }
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
    }
    if (transcriptTimeoutRef.current) {
      clearTimeout(transcriptTimeoutRef.current);
    }
    setIsListening(false);
    setIsSpeechDetected(false);
    setAudioLevel(0);
    previousTranscriptRef.current = '';
    lastTranscriptRef.current = '';
  };

  // Component unmount cleanup
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const startListening = async () => {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.lang = 'tr-TR';
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      // Ses filtreleme özelliklerini ayarla
      if ('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          }
        });
        analyzeAudio(stream);
      }

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setIsContinuousMode(true);
        lastTranscriptRef.current = '';
        console.log('Listening started');
      };

      recognitionRef.current.onend = () => {
        if (isContinuousMode && !isLoading) {
          recognitionRef.current?.start();
        } else {
          setIsListening(false);
          setIsSpeechDetected(false);
        }
        console.log('Listening stopped');
      };

      recognitionRef.current.onaudiostart = () => {
        setIsSpeechDetected(true);
      };

      recognitionRef.current.onaudioend = () => {
        setIsSpeechDetected(false);
      };

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        
        // Eğer bilgisayar konuşuyorsa transcript'i güncelleme
        if (!window.speechSynthesis.speaking) {
          setMessage(transcript);
          checkTranscriptTimeout(transcript);
        }
        console.log('Recognized text:', transcript);
      };

      recognitionRef.current.onerror = (error: any) => {
        console.error('Speech recognition error:', error);
        if (error.error === 'no-speech') {
          if (isContinuousMode && !isLoading) {
            recognitionRef.current?.start();
          }
          return;
        }
        setMicrophoneError('An error occurred while recognizing speech: ' + error.message);
        stopListening();
      };

      recognitionRef.current.start();
    } catch (error) {
      console.error('Speech recognition failed to start:', error);
      setMicrophoneError('Speech recognition failed to start. Please check browser support and try again.');
    }
  };

  const stopListening = () => {
    cleanup();
  };

  // Microphone status indicator component
  const MicrophoneStatus = () => (
    <div className="flex items-center gap-3 mb-4">
      <span className={`block rounded-full w-3 h-3 ${isListening ? 'bg-red-500 animate-pulse' : 'bg-red-900'}`}>
        <span className="sr-only">{isListening ? 'Listening active' : 'Listening inactive'}</span>
      </span>
      <span className={`block rounded w-full h-2 ${isSpeechDetected ? 'bg-green-500' : 'bg-green-900'}`}>
        <span className="sr-only">{isSpeechDetected ? 'Speech detected' : 'No speech detected'}</span>
      </span>
    </div>
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const simulateTyping = async (text: string) => {
    const tempMessage = { role: 'assistant', content: '', isTyping: true };
    setChatHistory(prev => [...prev, tempMessage]);

    let currentText = '';
    const words = text.split(' ');

    for (let i = 0; i < words.length; i++) {
      currentText += (i === 0 ? '' : ' ') + words[i];
      setChatHistory(prev => 
        prev.map((msg, idx) => 
          idx === prev.length - 1 ? { ...msg, content: currentText } : msg
        )
      );
      await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 50));
    }

    setChatHistory(prev =>
      prev.map((msg, idx) =>
        idx === prev.length - 1 ? { role: 'assistant', content: text, isTyping: false } : msg
      )
    );

    speakText(text);
  };

  // Ses ayarları komponenti
  const VoiceSettings = () => (
    <div 
      className={`fixed top-16 right-4 bg-[#40414f] p-4 rounded-xl shadow-lg z-50 text-white transition-all duration-300 transform ${
        isSettingsOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <h3 className="text-lg font-semibold mb-3">Voice Settings</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Voice Selection:</label>
          <select
            value={selectedVoice?.name || ''}
            onChange={(e) => {
              const voice = voices.find(v => v.name === e.target.value);
              if (voice) setSelectedVoice(voice);
            }}
            className="w-full bg-[#343541] text-white px-3 py-2 rounded-lg"
          >
            {voices
              .filter(voice => voice.lang.includes('en')) // Only show English voices
              .map(voice => (
                <option key={voice.name} value={voice.name}>
                  {voice.name} ({voice.lang}) {voice.default ? '- Default' : ''}
                </option>
              ))
            }
          </select>
        </div>

        <div className="text-xs text-gray-400 mt-2">
          <p>Selected Voice Info:</p>
          {selectedVoice && (
            <ul className="mt-1 space-y-1">
              <li>Name: {selectedVoice.name}</li>
              <li>Language: {selectedVoice.lang}</li>
              <li>Local: {selectedVoice.localService ? 'Yes' : 'No'}</li>
              <li>Default: {selectedVoice.default ? 'Yes' : 'No'}</li>
            </ul>
          )}
        </div>

        <div>
          <label className="block text-sm mb-1">Speed: {voiceRate}x</label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={voiceRate}
            onChange={(e) => setVoiceRate(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Pitch: {voicePitch}</label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={voicePitch}
            onChange={(e) => setVoicePitch(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#343541] flex flex-col">
      {/* Settings Button */}
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

      <VoiceSettings />
      
      <div className="flex-1 flex flex-col max-w-3xl w-full mx-auto px-4">
        <div className="text-center py-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-transparent bg-clip-text">
            alpAI
          </h1>
          <p className="text-gray-400 mt-2">
            AI Assistant developed by Alper Aktaş
          </p>
          
          <div className="mt-4">
            <MicrophoneStatus />
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
            {chatHistory.length === 0 && (
              <div className="text-center text-gray-400 py-8">
                <p className="text-lg mb-2">Hello! I'm alpAI 👋</p>
                <p>How can I help you today?</p>
                <p className="text-sm mt-4 text-blue-400">
                  Click the microphone button to use voice input (works in Chrome)
                </p>
              </div>
            )}
            {chatHistory.map((msg, index) => (
              <div
                key={index}
                className={`${msg.role === 'user' ? 'bg-[#343541]' : 'bg-[#444654]'} p-8`}
              >
                <div className="max-w-3xl mx-auto flex space-x-6">
                  <div className={`w-8 h-8 rounded-sm flex items-center justify-center text-white
                    ${msg.role === 'user' ? 'bg-blue-500' : 'bg-green-600'}`}>
                    {msg.role === 'user' ? '👤' : '🤖'}
                  </div>
                  <div className="flex-1 text-gray-100 overflow-hidden">
                    <p className="prose prose-invert">
                      {msg.content}
                      {msg.isTyping && (
                        <span className="inline-block animate-pulse">|</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 left-0 w-full bg-gradient-to-t from-[#343541] via-[#343541] to-transparent pt-6 pb-8">
        <div className="max-w-3xl mx-auto px-4">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
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
              onClick={isListening ? stopListening : startListening}
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
    </main>
  );
}

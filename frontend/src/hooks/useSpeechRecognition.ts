import { useState, useRef, useEffect } from 'react';

interface UseSpeechRecognitionProps {
  onTranscriptChange: (transcript: string) => void;
  onError: (error: string) => void;
  isLoading: boolean;
}

export const useSpeechRecognition = ({
  onTranscriptChange,
  onError,
  isLoading
}: UseSpeechRecognitionProps) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeechDetected, setIsSpeechDetected] = useState(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [browserSupportsSpeechRecognition, setBrowserSupportsSpeechRecognition] = useState(true);
  const [isContinuousMode, setIsContinuousMode] = useState(false);
  
  const recognitionRef = useRef<typeof window.SpeechRecognition | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);

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

  useEffect(() => {
    const checkBrowserSupport = () => {
      const isSupported = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
      setBrowserSupportsSpeechRecognition(isSupported);
      if (!isSupported) {
        onError('Your browser doesn\'t support speech recognition. Please use Chrome.');
      }
    };
    checkBrowserSupport();
  }, []);

  const startListening = async () => {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.lang = 'tr-TR';
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

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
      };

      recognitionRef.current.onend = () => {
        if (isContinuousMode && !isLoading) {
          recognitionRef.current?.start();
        } else {
          setIsListening(false);
          setIsSpeechDetected(false);
        }
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
        
        if (!window.speechSynthesis.speaking) {
          onTranscriptChange(transcript);
        }
      };

      recognitionRef.current.onerror = (error: any) => {
        if (error.error === 'no-speech') {
          if (isContinuousMode && !isLoading) {
            recognitionRef.current?.start();
          }
          return;
        }
        onError('An error occurred while recognizing speech: ' + error.message);
        stopListening();
      };

      recognitionRef.current.start();
    } catch (error) {
      console.error('Speech recognition failed to start:', error);
      onError('Speech recognition failed to start. Please check browser support and try again.');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (audioContext) {
      audioContext.close();
    }
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
    }
    setIsListening(false);
    setIsSpeechDetected(false);
    setAudioLevel(0);
    setIsContinuousMode(false);
  };

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, []);

  return {
    isListening,
    isSpeechDetected,
    audioLevel,
    browserSupportsSpeechRecognition,
    startListening,
    stopListening
  };
};
import { useState, useEffect } from 'react';

export const useSpeechSynthesis = () => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [voiceRate, setVoiceRate] = useState<number>(1);
  const [voicePitch, setVoicePitch] = useState<number>(1);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices);
        const englishVoice = availableVoices.find(voice => 
          voice.lang.includes('en-US') || voice.lang.includes('en-GB')
        );
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

  const speakText = (text: string) => {
    if (!selectedVoice) return;
    
    window.speechSynthesis.cancel();
    
    const sentences = text
      .split(/[.!?]/)
      .map(sentence => sentence.trim())
      .filter(sentence => sentence.length > 0);

    sentences.forEach((sentence, index) => {
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

      switch (punctuation) {
        case '?':
          utterance.pitch = voicePitch * 1.3;
          utterance.rate = voiceRate * 0.9;
          break;
        case '!':
          utterance.volume = 1.3;
          utterance.rate = voiceRate * 1.2;
          utterance.pitch = voicePitch * 1.1;
          break;
      }

      if (index < sentences.length - 1) {
        utterance.onend = () => {
          setTimeout(() => {
            window.speechSynthesis.resume();
          }, 150);
        };
      }
      
      window.speechSynthesis.speak(utterance);
    });
  };

  return {
    voices,
    selectedVoice,
    voiceRate,
    voicePitch,
    setSelectedVoice,
    setVoiceRate,
    setVoicePitch,
    speakText
  };
};
import React from 'react';

interface VoiceSettingsProps {
  isSettingsOpen: boolean;
  voices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  voiceRate: number;
  voicePitch: number;
  onVoiceChange: (voice: SpeechSynthesisVoice) => void;
  onRateChange: (rate: number) => void;
  onPitchChange: (pitch: number) => void;
}

export const VoiceSettings: React.FC<VoiceSettingsProps> = ({
  isSettingsOpen,
  voices,
  selectedVoice,
  voiceRate,
  voicePitch,
  onVoiceChange,
  onRateChange,
  onPitchChange,
}) => {
  return (
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
              if (voice) onVoiceChange(voice);
            }}
            className="w-full bg-[#343541] text-white px-3 py-2 rounded-lg"
          >
            {voices
              .filter(voice => voice.lang.includes('en'))
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
            onChange={(e) => onRateChange(parseFloat(e.target.value))}
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
            onChange={(e) => onPitchChange(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};

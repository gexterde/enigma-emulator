import React, { useState } from 'react';
import { EnigmaConfig } from '../types';
import { formatRotorRing } from '../lib/enigmaEngine';
import { playRotorClickSound } from '../lib/audio';
import { HISTORICAL_CODEBOOKS, CodebookEntry } from './CodebookView';

interface CodebookQuickModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateConfig: (newConfig: EnigmaConfig) => void;
  soundEnabled: boolean;
  ringFormat: 'number' | 'letter';
}

export const CodebookQuickModal: React.FC<CodebookQuickModalProps> = ({
  isOpen,
  onClose,
  onUpdateConfig,
  soundEnabled,
  ringFormat
}) => {
  if (!isOpen) return null;

  const [selectedSheetId, setSelectedSheetId] = useState<string>(HISTORICAL_CODEBOOKS[0].id);
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate() || 1);
  const [appliedMsg, setAppliedMsg] = useState<string | null>(null);

  const currentSheet = HISTORICAL_CODEBOOKS.find(s => s.id === selectedSheetId) || HISTORICAL_CODEBOOKS[0];
  const currentEntry = currentSheet.entries.find(e => e.day === selectedDay) || currentSheet.entries[0];

  const handleApply = (entry: CodebookEntry) => {
    playRotorClickSound(soundEnabled);
    const plugboardRecord: Record<string, string> = {};
    entry.plugboardPairs.forEach((pair) => {
      const clean = pair.trim().toUpperCase();
      if (clean.length === 2) {
        plugboardRecord[clean[0]] = clean[1];
        plugboardRecord[clean[1]] = clean[0];
      }
    });

    const isM4 = !!entry.fourthRotor;

    const newEnigmaConfig: EnigmaConfig = {
      leftRotor: {
        type: entry.rotors[0],
        ring: entry.rings[0],
        start: 0,
        current: 0
      },
      middleRotor: {
        type: entry.rotors[1],
        ring: entry.rings[1],
        start: 0,
        current: 0
      },
      rightRotor: {
        type: entry.rotors[2],
        ring: entry.rings[2],
        start: 0,
        current: 0
      },
      fourthRotor: {
        type: entry.fourthRotor || 'I',
        ring: entry.fourthRing || 1,
        start: 0,
        current: 0
      },
     reflector: {
        type: (entry as any).reflectorType || (isM4 ? 'Reflector B Thin' : 'Reflector B'),
        ring: (entry as any).reflectorRing || 1,
        start: 0,
        current: 0
      },
      plugboard: plugboardRecord
    };

    onUpdateConfig(newEnigmaConfig);
    setAppliedMsg(`Key for Day ${entry.day} (${currentSheet.title}) applied!`);
    setTimeout(() => setAppliedMsg(null), 3000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-[#1a150c] border border-[#ebc238]/40 rounded-xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl texture-metal text-[#d1c4b7] relative my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#3b3426]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#ebc238] text-xl">menu_book</span>
            <div>
              <h2 className="font-rotor-label text-[#ebc238] text-base sm:text-lg font-bold leading-tight">
                Codebook & Key Sheet Quick Loader
              </h2>
              <p className="text-[11px] text-[#9e8d78]">Load daily historical Enigma key settings directly into your machine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-[#8c7e6a] hover:text-[#ebc238] bg-[#221c11] rounded-full border border-[#3b3426] transition-colors cursor-pointer"
            title="Close"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        {/* Sheet Selector */}
        <div className="mb-4">
          <label className="text-[11px] font-monospaced-technical text-[#ebc238] uppercase font-bold block mb-1">
            Select Key Sheet (Schlüsseltafel)
          </label>
          <select
            value={selectedSheetId}
            onChange={(e) => {
              setSelectedSheetId(e.target.value);
              setAppliedMsg(null);
            }}
            className="w-full bg-[#201b0f] border border-[#4e453b] rounded px-3 py-2 text-xs text-[#ebc238] font-bold focus:outline-none focus:border-[#ebc238] cursor-pointer"
          >
            {HISTORICAL_CODEBOOKS.map((sheet) => (
              <option key={sheet.id} value={sheet.id}>
                {sheet.title} ({sheet.monthYear})
              </option>
            ))}
          </select>
        </div>

        {/* Day Selector & Key Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          {/* Day selection list */}
          <div className="bg-[#120e04] p-2.5 rounded-lg border border-[#3b3426] flex flex-col h-52">
            <span className="text-[10px] font-monospaced-technical text-[#ebc238] uppercase font-bold block mb-1">
              Select Day (Tag)
            </span>
            <div className="overflow-y-auto flex-1 space-y-1 pr-1 custom-scrollbar">
              {currentSheet.entries.map((e) => (
                <button
                  key={e.day}
                  type="button"
                  onClick={() => {
                    setSelectedDay(e.day);
                    setAppliedMsg(null);
                  }}
                  className={`w-full text-left px-2.5 py-1 text-xs rounded font-monospaced-technical flex items-center justify-between cursor-pointer transition-colors ${
                    selectedDay === e.day
                      ? 'bg-[#ebc238] text-[#1a150c] font-bold'
                      : 'bg-[#1b160e] text-[#d1c4b7] hover:bg-[#2a2215]'
                  }`}
                >
                  <span>Day {e.day < 10 ? `0${e.day}` : e.day}</span>
                  <span className="text-[10px] opacity-80">{e.rotors.join('-')}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Current Entry Details */}
          <div className="sm:col-span-2 bg-[#120e04] p-3 rounded-lg border border-[#3b3426] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-[#3b3426] pb-1.5 mb-2">
                <span className="text-xs font-monospaced-technical text-[#ebc238] font-bold">
                  Day {currentEntry.day} Key Specs
                </span>
                <span className="text-[10px] text-[#9e8d78] font-mono">
                  {currentSheet.classification}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between bg-[#1c170d] p-1.5 rounded border border-[#2d2518]">
                  <span className="text-[11px] text-[#8c7e6a] font-monospaced-technical">Walzenlage (Rotors):</span>
                  <span className="font-bold text-[#ebc238] font-monospaced-technical">
                    {currentEntry.fourthRotor ? `${currentEntry.fourthRotor} - ` : ''}
                    {currentEntry.rotors.join(' - ')}
                  </span>
                </div>

                <div className="flex items-center justify-between bg-[#1c170d] p-1.5 rounded border border-[#2d2518]">
                  <span className="text-[11px] text-[#8c7e6a] font-monospaced-technical">Ringstellung (Rings):</span>
                  <span className="font-bold text-[#ebc238] font-monospaced-technical">
                    {currentEntry.rings.map(r => formatRotorRing(r, ringFormat)).join(' - ')}
                  </span>
                </div>

                <div className="bg-[#1c170d] p-1.5 rounded border border-[#2d2518]">
                  <span className="text-[11px] text-[#8c7e6a] font-monospaced-technical block mb-1">
                    Steckerverbindungen ({currentEntry.plugboardPairs.length} Pairs):
                  </span>
                  <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto custom-scrollbar">
                    {currentEntry.plugboardPairs.map((pair, idx) => (
                      <span key={idx} className="bg-[#2a2215] text-[#ebc238] px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border border-[#ebc238]/30">
                        {pair}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {appliedMsg ? (
              <div className="bg-[#2e7d32]/30 border border-[#4caf50] text-[#a5d6a7] text-xs px-3 py-1.5 rounded text-center font-bold mt-2 animate-fade-in">
                ✓ {appliedMsg}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleApply(currentEntry)}
                className="w-full mt-3 py-2 bg-[#ebc238] hover:bg-[#ffd700] text-[#1a150c] font-bold text-xs rounded transition-colors shadow cursor-pointer font-monospaced-technical uppercase tracking-wider flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">bolt</span>
                <span>Apply Day {currentEntry.day} Key Settings</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-[#3b3426]">
          <span className="text-[10px] text-[#8c7e6a] truncate max-w-[300px]">
            {currentSheet.subtitle}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1.5 text-xs text-[#201b0f] bg-[#ebc238] hover:bg-[#ffd700] rounded font-bold cursor-pointer transition-colors shadow-md"
          >
            Done & Close
          </button>
        </div>
      </div>
    </div>
  );
};

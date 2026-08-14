import React, { useState, useEffect, useRef, useCallback, useMemo, useContext } from 'react';
import { useTheme, getTheme } from '../lib/theme';
//import React, { useState, useEffect } from 'react';
import { EnigmaConfig } from '../types';
import { formatRotorRing } from '../lib/enigmaEngine';
import { playRotorClickSound } from '../lib/audio';
import { HISTORICAL_CODEBOOKS, CodebookEntry, CodebookSheet } from './CodebookView';

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
  const { theme } = useTheme();
  const t = getTheme(theme);
  const [customSheets, setCustomSheets] = useState<CodebookSheet[]>([]);

  useEffect(() => {
    const loadCustom = () => {
      try {
        const saved = localStorage.getItem('enigma_custom_codebooks_v1');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setCustomSheets(
              parsed.map((s: any) => ({
                ...s,
                entries: Array.isArray(s.entries) ? s.entries : []
              }))
            );
          } else {
            setCustomSheets([]);
          }
        } else {
          setCustomSheets([]);
        }
      } catch (e) {
        setCustomSheets([]);
      }
    };

    if (isOpen) {
      loadCustom();
    }

    window.addEventListener('storage', loadCustom);
    window.addEventListener('enigma_codebooks_updated', loadCustom);
    return () => {
      window.removeEventListener('storage', loadCustom);
      window.removeEventListener('enigma_codebooks_updated', loadCustom);
    };
  }, [isOpen]);

  const allSheets = [...HISTORICAL_CODEBOOKS, ...customSheets];

  const [selectedSheetId, setSelectedSheetId] = useState<string>('luftwaffe_2744');
  const [selectedDay, setSelectedDay] = useState<number>(() => new Date().getDate() || 1);
  const [appliedMsg, setAppliedMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const today = new Date().getDate() || 1;
      setSelectedDay(today);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentSheet = allSheets.find(s => s.id === selectedSheetId) || allSheets[0];
  const currentEntry = currentSheet?.entries.find(e => e.day === selectedDay) || currentSheet?.entries[0];

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
    const gs = (entry.grundstellung && entry.grundstellung.length >= 3)
      ? entry.grundstellung
      : [
          ((entry.day * 5 + 3) % 26) + 1,
          ((entry.day * 9 + 11) % 26) + 1,
          ((entry.day * 13 + 17) % 26) + 1,
          ((entry.day * 17 + 23) % 26) + 1
        ];

    const gs0 = (gs[0] || 1) - 1;
    const gs1 = (gs[1] || 1) - 1;
    const gs2 = (gs[2] || 1) - 1;
    const gs3 = (gs[3] || 1) - 1;

    const newEnigmaConfig: EnigmaConfig = {
      leftRotor: {
        type: entry.rotors[0],
        ring: entry.rings[0],
        start: gs0,
        current: gs0
      },
      middleRotor: {
        type: entry.rotors[1],
        ring: entry.rings[1],
        start: gs1,
        current: gs1
      },
      rightRotor: {
        type: entry.rotors[2],
        ring: entry.rings[2],
        start: gs2,
        current: gs2
      },
      fourthRotor: {
        type: entry.fourthRotor || 'I',
        ring: entry.fourthRing || 1,
        start: entry.fourthRotor ? gs3 : 0,
        current: entry.fourthRotor ? gs3 : 0
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
      <div className={`${t.modalBg} border ${t.borderAccent}/40 rounded-xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl ${t.modalTexture} ${t.textMuted} relative my-auto`}>
        {/* Header */}
        <div className={`flex items-center justify-between pb-3 mb-4 border-b ${t.borderBase}`}>
          <div className="flex items-center gap-2">
            <span className={`material-symbols-outlined ${t.textAccent} text-xl`}>menu_book</span>
            <div>
              <h2 className={`${t.fontRotor} ${t.textAccent} text-base sm:text-lg font-bold leading-tight`}>
                Codebook & Key Sheet Quick Loader
              </h2>
              <p className={`text-[11px] ${t.textMutedAlt}`}>Load daily historical Enigma key settings directly into your machine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`w-8 h-8 flex items-center justify-center ${t.textMuted} hover:${t.textAccent} ${t.inputBgAlt} rounded-full border ${t.borderBase} transition-colors cursor-pointer`}
            title="Close"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        {/* Sheet Selector */}
        <div className="mb-4">
          <label className={`text-[11px] ${t.fontMono} ${t.textAccent} uppercase font-bold block mb-1`}>
            Select Key Sheet (Schlüsseltafel)
          </label>
          <select
            value={selectedSheetId}
            onChange={(e) => {
              setSelectedSheetId(e.target.value);
              setAppliedMsg(null);
            }}
            className={`w-full ${t.panelBg} border ${t.borderBase} rounded px-3 py-2 text-xs ${t.textAccent} font-bold focus:outline-none focus:${t.borderAccent} cursor-pointer`}
          >
            <optgroup label="Historical Key Sheets">
              {HISTORICAL_CODEBOOKS.map((sheet) => (
                <option key={sheet.id} value={sheet.id}>
                  {sheet.title} ({sheet.monthYear})
                </option>
              ))}
            </optgroup>
            {customSheets.length > 0 && (
              <optgroup label="Custom & Imported Codebooks">
                {customSheets.map((sheet) => (
                  <option key={sheet.id} value={sheet.id}>
                    ⭐ {sheet.title} ({sheet.monthYear || 'Custom'})
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>

        {/* Day Selector & Key Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          {/* Day selection list */}
          <div className={`${t.panelInner} p-2.5 rounded-lg border ${t.borderBase} flex flex-col h-52`}>
            <span className={`text-[10px] ${t.fontMono} ${t.textAccent} uppercase font-bold block mb-1`}>
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
                  className={`w-full text-left px-2.5 py-1 text-xs rounded ${t.fontMono} flex items-center justify-between cursor-pointer transition-colors ${
                    selectedDay === e.day
                      ? t.tabActive
                      : t.tabInactive
                  }`}
                >
                  <span>Day {e.day < 10 ? `0${e.day}` : e.day}</span>
                  <span className="text-[10px] opacity-80">{e.rotors.join('-')}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Current Entry Details */}
          <div className={`sm:col-span-2 ${t.panelInner} p-3 rounded-lg border ${t.borderBase} flex flex-col justify-between`}>
            <div>
              <div className={`flex items-center justify-between border-b ${t.borderBase} pb-1.5 mb-2`}>
                <span className={`text-xs ${t.fontMono} ${t.textAccent} font-bold`}>
                  Day {currentEntry.day} Key Specs
                </span>
                <span className={`text-[10px] ${t.textMutedAlt} font-mono`}>
                  {currentSheet.classification}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className={`flex items-center justify-between ${t.inputBgAlt} p-1.5 rounded border ${t.borderBase}`}>
                  <span className={`text-[11px] ${t.textMuted} ${t.fontMono}`}>Walzenlage (Rotors):</span>
                  <span className={`font-bold ${t.textAccent} ${t.fontMono}`}>
                    {currentEntry.fourthRotor ? `${currentEntry.fourthRotor} - ` : ''}
                    {currentEntry.rotors.join(' - ')}
                  </span>
                </div>

                <div className={`flex items-center justify-between ${t.inputBgAlt} p-1.5 rounded border ${t.borderBase}`}>
                  <span className={`text-[11px] ${t.textMuted} ${t.fontMono}`}>Ringstellung (Rings):</span>
                  <span className={`font-bold ${t.textAccent} ${t.fontMono}`}>
                    {currentEntry.rings.map(r => formatRotorRing(r, ringFormat)).join(' - ')}
                  </span>
                </div>

                {(() => {
                  const gs = currentEntry.grundstellung && currentEntry.grundstellung.length > 0
                    ? currentEntry.grundstellung
                    : [
                        ((currentEntry.day * 5 + 3) % 26) + 1,
                        ((currentEntry.day * 9 + 11) % 26) + 1,
                        ((currentEntry.day * 13 + 17) % 26) + 1
                      ];
                  const formattedGs = gs
                    .slice(0, currentEntry.fourthRotor ? 4 : 3)
                    .map(g => formatRotorRing(g, ringFormat))
                    .join(' - ');

                  return (
                    <div className={`flex items-center justify-between ${t.inputBgAlt} p-1.5 rounded border ${t.borderBase}`}>
                      <span className={`text-[11px] ${t.textMuted} ${t.fontMono}`}>Grundstellung (Start):</span>
                      <span className={`font-bold ${t.textAccent} ${t.fontMono}`}>
                        {formattedGs}
                      </span>
                    </div>
                  );
                })()}

                <div className={`${t.inputBgAlt} p-1.5 rounded border ${t.borderBase}`}>
                  <span className={`text-[11px] ${t.textMuted} ${t.fontMono} block mb-1`}>
                    Steckerverbindungen ({currentEntry.plugboardPairs.length} Pairs):
                  </span>
                  <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto custom-scrollbar">
                    {currentEntry.plugboardPairs.map((pair, idx) => (
                      <span key={idx} className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${t.codebookHeaderButton}/30`}>
                        {pair}
                      </span>
                    ))}
                  </div>
                </div>

                {currentEntry.kenngruppen && currentEntry.kenngruppen.length > 0 && (
                  <div className={`${t.inputBgAlt} p-1.5 rounded border ${t.borderBase}`}>
                    <span className={`text-[11px] ${t.textMuted} ${t.fontMono} block mb-1`}>
                      Kenngruppen (Indicator Groups):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {currentEntry.kenngruppen.map((kg, idx) => (
                        <span key={idx} className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${t.kenngruppenTag}`}>
                          {kg}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {appliedMsg ? (
              <div className={`border px-3 py-1.5 rounded text-center font-bold mt-2 animate-fade-in ${t.bgSuccessFaint} ${t.textSuccess} text-xs`}>
                ✓ {appliedMsg}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleApply(currentEntry)}
                className={`w-full mt-3 py-2 ${t.buttonHighlight} font-bold text-xs rounded transition-all shadow-md cursor-pointer ${t.fontMono} uppercase tracking-wider flex items-center justify-center gap-1.5`}
              >
                <span className="material-symbols-outlined text-sm">bolt</span>
                <span>Apply Day {currentEntry.day} Key Settings</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-between pt-3 border-t ${t.borderBase}`}>
          <span className={`text-[10px] ${t.textMuted} truncate max-w-[300px]`}>
            {currentSheet.subtitle}
          </span>
          <button
            type="button"
            onClick={onClose}
            className={`px-5 py-1.5 text-xs font-bold cursor-pointer transition-all shadow-md rounded ${t.buttonHighlight}`}
          >
            Done & Close
          </button>
        </div>
      </div>
    </div>
  );
};

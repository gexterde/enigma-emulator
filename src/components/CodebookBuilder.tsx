import React, { useState, useEffect, useRef, useCallback, useMemo, useContext } from 'react';
import { useTheme, getTheme } from '../lib/theme';
//import React, { useState } from 'react';
import { RotorType, ReflectorType } from '../types';
import { generateUniversalEnigmaCodebook, EnigmaGeneratorConfig } from '../lib/codebookGenerator';
import { CodebookSheet, CodebookEntry } from './CodebookView';

interface CodebookBuilderProps {
  onCancel: () => void;
  onCodebookCreated: (sheet: CodebookSheet) => void;
}

export const CodebookBuilder: React.FC<CodebookBuilderProps> = ({ onCancel, onCodebookCreated }) => {
  const { theme } = useTheme();
  const t = getTheme(theme);
  const [builderTitle, setBuilderTitle] = useState<string>('Sonder-Schlüsseltafel Nr. 99');
  const [builderSubtitle, setBuilderSubtitle] = useState<string>('Oberkommando der Wehrmacht (Custom Military Key Table)');
  const [builderClassification, setBuilderClassification] = useState<string>('GEHEIME KOMMANDOSACHE!');
  const [builderMonthYear, setBuilderMonthYear] = useState<string>('Dezember 1944');
  const [builderPruefnummer, setBuilderPruefnummer] = useState<string>('9901 / OKW');
  const [builderGenerateAllDays, setBuilderGenerateAllDays] = useState<boolean>(true);

  // Universal Enigma Generator Parameters (EnigmaGeneratorConfig)
  const [builderDaysInMonth, setBuilderDaysInMonth] = useState<number>(31);
  const [builderRotorsPool, setBuilderRotorsPool] = useState<string[]>(['I', 'II', 'III', 'IV', 'V']);
  const [builderUseTwoDayRule, setBuilderUseTwoDayRule] = useState<boolean>(false);
  const [builderPlugboardPairsCount, setBuilderPlugboardPairsCount] = useState<number>(10);
  const [builderKenngruppenCount, setBuilderKenngruppenCount] = useState<number>(4);
  const [builderKenngruppenLength, setBuilderKenngruppenLength] = useState<number>(3);
  const [builderIsM4, setBuilderIsM4] = useState<boolean>(false);
  const [builderFourthRotorsPool, setBuilderFourthRotorsPool] = useState<string[]>(['Beta', 'Gamma']);
  const [builderUseFixedFourthRing, setBuilderUseFixedFourthRing] = useState<boolean>(true);
  const [builderFixedFourthRing, setBuilderFixedFourthRing] = useState<number>(1);

  // UKW Dual Dynamic Reflector Parameters
  const [builderUseDualReflector, setBuilderUseDualReflector] = useState<boolean>(false);
  const [builderUseFixedReflectorRing, setBuilderUseFixedReflectorRing] = useState<boolean>(false);
  const [builderFixedReflectorRing, setBuilderFixedReflectorRing] = useState<number>(1);
  const [builderUseFixedReflectorStart, setBuilderUseFixedReflectorStart] = useState<boolean>(false);
  const [builderFixedReflectorStart, setBuilderFixedReflectorStart] = useState<number>(1);

  const toggleRotorInPool = (rotor: string) => {
    setBuilderRotorsPool((prev) => {
      if (prev.includes(rotor)) {
        if (prev.length <= 3) return prev; // At least 3 rotors required
        return prev.filter((r) => r !== rotor);
      } else {
        return [...prev, rotor];
      }
    });
  };

  const toggleFourthRotorInPool = (rotor: string) => {
    setBuilderFourthRotorsPool((prev) => {
      if (prev.includes(rotor)) {
        if (prev.length <= 1) return prev; // At least 1 fourth rotor required
        return prev.filter((r) => r !== rotor);
      } else {
        return [...prev, rotor];
      }
    });
  };

  const applyGeneratorPreset = (preset: 'luftwaffe' | 'heer' | 'm3' | 'm4' | 'ukw_dual') => {
    if (preset === 'luftwaffe') {
      setBuilderTitle('Luftwaffen-Maschinen-Schlüssel Nr. 2744');
      setBuilderSubtitle('Oberkommando der Luftwaffe (Air Force Secret Key Sheet)');
      setBuilderClassification('GEHEIME KOMMANDOSACHE!');
      setBuilderDaysInMonth(31);
      setBuilderRotorsPool(['I', 'II', 'III', 'IV', 'V']);
      setBuilderUseTwoDayRule(false);
      setBuilderPlugboardPairsCount(10);
      setBuilderKenngruppenCount(4);
      setBuilderKenngruppenLength(3);
      setBuilderIsM4(false);
      setBuilderUseDualReflector(false);
    } else if (preset === 'heer') {
      setBuilderTitle('Heer/Wehrmacht Tagesschlüssel Nr. 512');
      setBuilderSubtitle('Oberkommando des Heeres (Army Ground Signals Key Table)');
      setBuilderClassification('GEHEIME KOMMANDOSACHE!');
      setBuilderDaysInMonth(30);
      setBuilderRotorsPool(['I', 'II', 'III', 'IV', 'V']);
      setBuilderUseTwoDayRule(false);
      setBuilderPlugboardPairsCount(10);
      setBuilderKenngruppenCount(4);
      setBuilderKenngruppenLength(3);
      setBuilderIsM4(false);
      setBuilderUseDualReflector(false);
    } else if (preset === 'm3') {
      setBuilderTitle('Kriegsmarine Schlüsseltafel M3');
      setBuilderSubtitle('Oberkommando der Marine (Navy M3 Enigma Key Sheet)');
      setBuilderClassification('GEHEIM!');
      setBuilderDaysInMonth(31);
      setBuilderRotorsPool(['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII']);
      setBuilderUseTwoDayRule(true);
      setBuilderPlugboardPairsCount(10);
      setBuilderKenngruppenCount(3);
      setBuilderKenngruppenLength(3);
      setBuilderIsM4(false);
      setBuilderUseDualReflector(false);
    } else if (preset === 'm4') {
      setBuilderTitle('Kriegsmarine M4 Schlüsseltafel (Shark)');
      setBuilderSubtitle('Oberkommando der Marine (4-Rotor M4 Navy Key Sheet)');
      setBuilderClassification('GEHEIM!');
      setBuilderDaysInMonth(31);
      setBuilderRotorsPool(['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII']);
      setBuilderUseTwoDayRule(true);
      setBuilderPlugboardPairsCount(10);
      setBuilderKenngruppenCount(3);
      setBuilderKenngruppenLength(3);
      setBuilderIsM4(true);
      setBuilderFourthRotorsPool(['Beta', 'Gamma']);
      setBuilderUseFixedFourthRing(true);
      setBuilderFixedFourthRing(1);
      setBuilderUseDualReflector(false);
    } else if (preset === 'ukw_dual') {
      setBuilderTitle('Sonder-Schlüsseltafel UKW-Dual (What-If Speculative)');
      setBuilderSubtitle('Oberkommando der Wehrmacht — Experimental Dynamic Reflector Table');
      setBuilderClassification('GEHEIME KOMMANDOSACHE!');
      setBuilderDaysInMonth(31);
      setBuilderRotorsPool(['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII']);
      setBuilderUseTwoDayRule(false);
      setBuilderPlugboardPairsCount(10);
      setBuilderKenngruppenCount(4);
      setBuilderKenngruppenLength(3);
      setBuilderIsM4(false);
      setBuilderUseDualReflector(true);
      setBuilderUseFixedReflectorRing(false);
      setBuilderUseFixedReflectorStart(false);
    }
  };

  const handleCreateCodebookSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newId = `custom_${Date.now()}`;
    let generatedEntries: CodebookEntry[] = [];

    if (builderGenerateAllDays) {
      const config: EnigmaGeneratorConfig = {
        daysInMonth: Math.max(1, Math.min(31, builderDaysInMonth || 31)),
        rotorsPool: builderRotorsPool.length >= 3 ? builderRotorsPool : ['I', 'II', 'III'],
        useTwoDayRule: builderUseTwoDayRule,
        plugboardPairsCount: Math.max(0, Math.min(13, builderPlugboardPairsCount ?? 10)),
        kenngruppenCount: Math.max(1, Math.min(6, builderKenngruppenCount ?? 4)),
        kenngruppenLength: Math.max(2, Math.min(5, builderKenngruppenLength ?? 3)),
        fourthRotorsPool: builderIsM4 ? (builderFourthRotorsPool.length > 0 ? builderFourthRotorsPool : ['Beta']) : undefined,
        fixedFourthRing: (builderIsM4 && builderUseFixedFourthRing) ? builderFixedFourthRing : undefined,
        useDualDynamicReflector: builderUseDualReflector,
        fixedReflectorRing: (builderUseDualReflector && builderUseFixedReflectorRing) ? builderFixedReflectorRing : undefined,
        fixedReflectorStart: (builderUseDualReflector && builderUseFixedReflectorStart) ? builderFixedReflectorStart : undefined
      };

      const universalEntries = generateUniversalEnigmaCodebook(config);
      generatedEntries = universalEntries.map((e) => ({
        day: e.day,
        rotors: [e.rotors[0] as RotorType, e.rotors[1] as RotorType, e.rotors[2] as RotorType],
        rings: [e.rings[0], e.rings[1], e.rings[2]],
        plugboardPairs: e.plugboardPairs,
        kenngruppen: e.kenngruppen,
        fourthRotor: e.fourthRotor as RotorType | undefined,
        fourthRing: e.fourthRing,
        reflectorType: e.reflectorType as ReflectorType | undefined,
        reflectorRing: e.reflectorRing,
        reflectorStart: e.reflectorStart
      }));
    }

    const newSheet: CodebookSheet = {
      id: newId,
      title: builderTitle.trim() || 'Custom Schlüsseltafel',
      subtitle: builderSubtitle.trim() || 'Custom Operations Secret Key Table',
      classification: builderClassification.trim() || 'GEHEIM!',
      monthYear: builderMonthYear.trim() || 'Custom Date',
      pruefnummer: builderPruefnummer.trim() || 'CST-001',
      isHistorical: false,
      entries: generatedEntries
    };

     
     
    onCodebookCreated(newSheet);
  };

  return (
        <div className={`${t.panelBg} border ${t.borderAccent} rounded-xl p-6 sm:p-8 shadow-2xl space-y-6`}>
          <div className={`border-b ${t.borderBase} pb-4 flex justify-between items-start`}>
            <div>
              <h2 className={`text-xl ${t.fontHeader} font-bold ${t.textAccent} uppercase flex items-center gap-2`}>
                <span className="material-symbols-outlined text-2xl">post_add</span>
                Create Custom Enigma Codebook
              </h2>
              <p className={`text-xs ${t.textMuted} mt-1 ${t.fontBody}`}>
                Generate or compose a authentic WWII-style key sheet for your unit or network.
              </p>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className={`text-xs ${t.panelBg} hover:bg-[#4e453b] ${t.textMuted} px-3 py-1.5 rounded flex items-center gap-1`}
            >
              <span className="material-symbols-outlined text-sm">cancel</span>
              Cancel
            </button>
          </div>

          <form onSubmit={handleCreateCodebookSubmit} className="space-y-6 text-sm">
            {/* Historical Presets Banner */}
            <div className={`${t.panelInner} border ${t.borderBase} rounded-lg p-3.5 space-y-2`}>
              <span className={`text-xs font-bold ${t.textAccent} uppercase tracking-wider block`}>
                Quick Branch Presets (Gyors történeti sablonok):
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => applyGeneratorPreset('luftwaffe')}
                  className={`px-2.5 py-1 text-xs ${t.fontHeader} bg-[#2a2418] hover:${t.panelBg} ${t.textSecondary} border ${t.borderBase} rounded flex items-center gap-1 cursor-pointer transition-colors`}
                >
                  <span className="material-symbols-outlined text-xs">flight</span>
                  Luftwaffe (31d, I-V, 4 KG)
                </button>
                <button
                  type="button"
                  onClick={() => applyGeneratorPreset('heer')}
                  className={`px-2.5 py-1 text-xs ${t.fontHeader} bg-[#2a2418] hover:${t.panelBg} ${t.textSecondary} border ${t.borderBase} rounded flex items-center gap-1 cursor-pointer transition-colors`}
                >
                  <span className="material-symbols-outlined text-xs">military_tech</span>
                  Heer / Army (30d, I-V, 4 KG)
                </button>
                <button
                  type="button"
                  onClick={() => applyGeneratorPreset('m3')}
                  className={`px-2.5 py-1 text-xs ${t.fontHeader} bg-[#2a2418] hover:${t.panelBg} ${t.textSecondary} border ${t.borderBase} rounded flex items-center gap-1 cursor-pointer transition-colors`}
                >
                  <span className="material-symbols-outlined text-xs">sailing</span>
                  Kriegsmarine M3 (31d, I-VIII, 2-Day Rule, 3 KG)
                </button>
                <button
                  type="button"
                  onClick={() => applyGeneratorPreset('m4')}
                  className={`px-2.5 py-1 text-xs ${t.fontHeader} bg-[#2a2418] hover:${t.panelBg} ${t.textSecondary} border ${t.borderBase} rounded flex items-center gap-1 cursor-pointer transition-colors`}
                >
                  <span className="material-symbols-outlined text-xs">phishing</span>
                  Kriegsmarine M4 (31d, 4-Rotor Beta/Gamma, Fixed Ring A)
                </button>
                <button
                  type="button"
                  onClick={() => applyGeneratorPreset('ukw_dual')}
                  className={`px-2.5 py-1 text-xs ${t.fontHeader} bg-[#381f0d] hover:bg-[#4d2c14] text-[#f2a879] border border-[#733c19] rounded flex items-center gap-1 cursor-pointer transition-colors`}
                >
                  <span className="material-symbols-outlined text-xs">published_with_changes</span>
                  Speculative UKW-Dual (31d, Dynamic Reflector)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`block text-xs font-bold ${t.textSecondary} mb-1 uppercase tracking-wider`}>
                  Document Title (Titel):
                </label>
                <input
                  type="text"
                  value={builderTitle}
                  onChange={(e) => setBuilderTitle(e.target.value)}
                  placeholder="e.g. Geheime Kommandosache - Tagesschlüssel"
                  className={`w-full ${t.panelInner} border ${t.borderBase} rounded-lg p-2.5 ${t.textPrimary} font-mono text-xs focus:outline-none focus:${t.borderAccent}`}
                  required
                />
              </div>

              <div>
                <label className={`block text-xs font-bold ${t.textSecondary} mb-1 uppercase tracking-wider`}>
                  Subtitle / Unit (Untertitel):
                </label>
                <input
                  type="text"
                  value={builderSubtitle}
                  onChange={(e) => setBuilderSubtitle(e.target.value)}
                  placeholder="e.g. Special Field Forces Secret Key Table"
                  className={`w-full ${t.panelInner} border ${t.borderBase} rounded-lg p-2.5 ${t.textPrimary} font-mono text-xs focus:outline-none focus:${t.borderAccent}`}
                  required
                />
              </div>

              <div>
                <label className={`block text-xs font-bold ${t.textSecondary} mb-1 uppercase tracking-wider`}>
                  Classification Stamp (Klassifizierung):
                </label>
                <select
                  value={builderClassification}
                  onChange={(e) => setBuilderClassification(e.target.value)}
                  className={`w-full ${t.panelInner} border ${t.borderBase} ${t.textAccent} font-bold rounded-lg p-2.5 text-xs focus:outline-none focus:${t.borderAccent}`}
                >
                  <option value="GEHEIME KOMMANDOSACHE!">GEHEIME KOMMANDOSACHE! (Top Secret)</option>
                  <option value="GEHEIM!">GEHEIM! (Secret)</option>
                  <option value="NUR FÜR DIENSTGEBRAUCH">NUR FÜR DIENSTGEBRAUCH (Official Use Only)</option>
                  <option value="STRENG GEHEIM!">STRENG GEHEIM! (Strictly Confidential)</option>
                </select>
              </div>

              <div>
                <label className={`block text-xs font-bold ${t.textSecondary} mb-1 uppercase tracking-wider`}>
                  Month & Year (Monat / Jahr):
                </label>
                <input
                  type="text"
                  value={builderMonthYear}
                  onChange={(e) => setBuilderMonthYear(e.target.value)}
                  placeholder="e.g. Dezember 1944"
                  className={`w-full ${t.panelInner} border ${t.borderBase} rounded-lg p-2.5 ${t.textPrimary} font-mono text-xs focus:outline-none focus:${t.borderAccent}`}
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className={`block text-xs font-bold ${t.textSecondary} mb-1 uppercase tracking-wider`}>
                  Prüfnummer / Serial Number:
                </label>
                <input
                  type="text"
                  value={builderPruefnummer}
                  onChange={(e) => setBuilderPruefnummer(e.target.value)}
                  placeholder="e.g. 9901-C / OKW"
                  className={`w-full ${t.panelInner} border ${t.borderBase} rounded-lg p-2.5 ${t.textPrimary} font-mono text-xs focus:outline-none focus:${t.borderAccent}`}
                  required
                />
              </div>
            </div>

            {/* Checkbox toggle for auto-generation */}
            <div className={`${t.panelInner} border ${t.borderBase} rounded-lg p-3`}>
              <label className={`flex items-center gap-2 cursor-pointer text-xs ${t.textPrimary}`}>
                <input
                  type="checkbox"
                  checked={builderGenerateAllDays}
                  onChange={(e) => setBuilderGenerateAllDays(e.target.checked)}
                  className="accent-[#ebc238] w-4 h-4 cursor-pointer"
                />
                <span className={`font-bold ${t.textAccent} uppercase tracking-wide`}>
                  Generate Days with Universal Enigma Codebook Generator (Általános Generáló)
                </span>
              </label>
            </div>

            {/* Universal Generator Parameters Panel */}
            {builderGenerateAllDays && (
              <div className={`bg-[#171208] border ${t.borderAccent}/60 rounded-xl p-4 sm:p-5 space-y-4 animate-fade-in`}>
                <div className={`flex items-center justify-between border-b ${t.borderBase} pb-2`}>
                  <h3 className={`text-xs ${t.fontHeader} font-bold ${t.textAccent} uppercase tracking-wider flex items-center gap-1.5`}>
                    <span className="material-symbols-outlined text-sm">tune</span>
                    Universal Generator Parameters (EnigmaGeneratorConfig)
                  </h3>
                  <span className={`text-[10px] ${t.textMuted} font-mono`}>
                    Fisher-Yates Safe Randomizer
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {/* Days in Month */}
                  <div>
                    <label className={`block text-xs font-bold ${t.textMuted} mb-1`}>
                      Days in Month (daysInMonth):
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={builderDaysInMonth}
                      onChange={(e) => setBuilderDaysInMonth(parseInt(e.target.value) || 31)}
                      className={`w-full bg-[#0d0a03] border ${t.borderBase} rounded p-2 ${t.textPrimary} font-mono text-xs focus:outline-none focus:${t.borderAccent}`}
                    />
                    <span className={`text-[10px] ${t.textMuted} mt-0.5 block`}>Standard: 30 or 31 days</span>
                  </div>

                  {/* Plugboard Pairs Count */}
                  <div>
                    <label className={`block text-xs font-bold ${t.textMuted} mb-1`}>
                      Plugboard Cable Pairs (plugboardPairsCount):
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={13}
                      value={builderPlugboardPairsCount}
                      onChange={(e) => setBuilderPlugboardPairsCount(parseInt(e.target.value) ?? 10)}
                      className={`w-full bg-[#0d0a03] border ${t.borderBase} rounded p-2 ${t.textPrimary} font-mono text-xs focus:outline-none focus:${t.borderAccent}`}
                    />
                    <span className={`text-[10px] ${t.textMuted} mt-0.5 block`}>Standard: 10 (max 13 cables)</span>
                  </div>

                  {/* Two-Day Rule */}
                  <div>
                    <label className={`block text-xs font-bold ${t.textMuted} mb-1`}>
                      Two-Day Rule (useTwoDayRule):
                    </label>
                    <label className={`flex items-center gap-2 bg-[#0d0a03] border ${t.borderBase} rounded p-2 cursor-pointer text-xs ${t.textPrimary} h-[38px]`}>
                      <input
                        type="checkbox"
                        checked={builderUseTwoDayRule}
                        onChange={(e) => setBuilderUseTwoDayRule(e.target.checked)}
                        className="accent-[#ebc238] w-4 h-4 cursor-pointer"
                      />
                      <span>Inner key changes odd days only</span>
                    </label>
                    <span className={`text-[10px] ${t.textMuted} mt-0.5 block`}>Even days inherit odd day internal key</span>
                  </div>

                  {/* Kenngruppen Count */}
                  <div>
                    <label className={`block text-xs font-bold ${t.textMuted} mb-1`}>
                      Kenngruppen Count (kenngruppenCount):
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={6}
                      value={builderKenngruppenCount}
                      onChange={(e) => setBuilderKenngruppenCount(parseInt(e.target.value) || 1)}
                      className={`w-full bg-[#0d0a03] border ${t.borderBase} rounded p-2 ${t.textPrimary} font-mono text-xs focus:outline-none focus:${t.borderAccent}`}
                    />
                    <span className={`text-[10px] ${t.textMuted} mt-0.5 block`}>Luftwaffe: 4, Kriegsmarine: 3</span>
                  </div>

                  {/* Kenngruppen Length */}
                  <div>
                    <label className={`block text-xs font-bold ${t.textMuted} mb-1`}>
                      Kenngruppen Length (kenngruppenLength):
                    </label>
                    <input
                      type="number"
                      min={2}
                      max={5}
                      value={builderKenngruppenLength}
                      onChange={(e) => setBuilderKenngruppenLength(parseInt(e.target.value) || 3)}
                      className={`w-full bg-[#0d0a03] border ${t.borderBase} rounded p-2 ${t.textPrimary} font-mono text-xs focus:outline-none focus:${t.borderAccent}`}
                    />
                    <span className={`text-[10px] ${t.textMuted} mt-0.5 block`}>Usually 3 (trigram groups)</span>
                  </div>

                  {/* M4 4-Rotor Support */}
                  <div>
                    <label className={`block text-xs font-bold ${t.textMuted} mb-1`}>
                      Enigma M4 4-Rotor Mode:
                    </label>
                    <label className={`flex items-center gap-2 bg-[#0d0a03] border ${t.borderBase} rounded p-2 cursor-pointer text-xs ${t.textPrimary} h-[38px]`}>
                      <input
                        type="checkbox"
                        checked={builderIsM4}
                        onChange={(e) => setBuilderIsM4(e.target.checked)}
                        className="accent-[#ebc238] w-4 h-4 cursor-pointer"
                      />
                      <span>Enable 4th thin rotor</span>
                    </label>
                    <span className={`text-[10px] ${t.textMuted} mt-0.5 block`}>Kriegsmarine Shark key structure</span>
                  </div>
                </div>

                {/* Main Rotors Pool selection */}
                <div>
                  <label className={`block text-xs font-bold ${t.textSecondary} mb-1.5 uppercase tracking-wider`}>
                    Selectable Main Rotors Pool (rotorsPool):
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'].map((r) => {
                      const isSelected = builderRotorsPool.includes(r);
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => toggleRotorInPool(r)}
                          className={`px-3 py-1 rounded text-xs font-mono font-bold transition-colors cursor-pointer border ${
                            isSelected
                              ? 'bg-[#ebc238] text-[#25190b] border-[#ebc238]'
                              : 'bg-[#0d0a03] text-[#83715d] border-[#3b3426] hover:text-[#d1c4b7]'
                          }`}
                        >
                          Rotor {r}
                        </button>
                      );
                    })}
                  </div>
                  <span className={`text-[10px] ${t.textMuted} mt-1 block`}>
                    Pool size: {builderRotorsPool.length} rotors available for 3 main rotor positions.
                  </span>
                </div>

                {/* 4-Rotor Options (M4) */}
                {builderIsM4 && (
                  <div className={`bg-[#0d0a03] border ${t.borderBase} p-3.5 rounded-lg space-y-3`}>
                    <div className={`text-xs font-bold ${t.textAccent} uppercase tracking-wider`}>
                      M4 4th Thin Rotor Parameters (fourthRotorsPool & fixedFourthRing)
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-xs ${t.textMuted} mb-1`}>
                          4th Thin Rotors Pool (fourthRotorsPool):
                        </label>
                        <div className="flex gap-2">
                          {['Beta', 'Gamma'].map((r) => {
                            const isSelected = builderFourthRotorsPool.includes(r);
                            return (
                              <button
                                key={r}
                                type="button"
                                onClick={() => toggleFourthRotorInPool(r)}
                                className={`px-3 py-1 rounded text-xs font-mono font-bold transition-colors cursor-pointer border ${
                                  isSelected
                                    ? 'bg-[#ebc238] text-[#25190b] border-[#ebc238]'
                                    : 'bg-[#171208] text-[#83715d] border-[#3b3426] hover:text-[#d1c4b7]'
                                }`}
                              >
                                {r}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label className={`block text-xs ${t.textMuted} mb-1`}>
                          Fixed 4th Ring Setting (fixedFourthRing):
                        </label>
                        <div className="flex items-center gap-2">
                          <label className={`flex items-center gap-1.5 text-xs ${t.textPrimary} cursor-pointer`}>
                            <input
                              type="checkbox"
                              checked={builderUseFixedFourthRing}
                              onChange={(e) => setBuilderUseFixedFourthRing(e.target.checked)}
                              className="accent-[#ebc238]"
                            />
                            <span>Fixed</span>
                          </label>
                          {builderUseFixedFourthRing && (
                            <select
                              value={builderFixedFourthRing}
                              onChange={(e) => setBuilderFixedFourthRing(parseInt(e.target.value) || 1)}
                              className={`bg-[#171208] border ${t.borderBase} ${t.textAccent} rounded p-1 text-xs font-mono focus:outline-none`}
                            >
                              {Array.from({ length: 26 }, (_, i) => i + 1).map((n) => (
                                <option key={n} value={n}>
                                  {n.toString().padStart(2, '0')} ({String.fromCharCode(64 + n)})
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                        <span className={`text-[10px] ${t.textMuted} mt-0.5 block`}>
                          Historical Kriegsmarine rule strictly fixed ring to 01 (A).
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* UKW-Dual-Dynamic Speculative Reflector Option */}
                <div className={`bg-[#0d0a03] border ${t.borderAccent}/40 p-3.5 rounded-lg space-y-3`}>
                  <div className="flex items-center justify-between">
                    <div className={`text-xs font-bold ${t.textAccent} uppercase tracking-wider flex items-center gap-1.5`}>
                      <span className="material-symbols-outlined text-sm text-[#e06c3a]">published_with_changes</span>
                      UKW-Dual-Dynamic Speculative Reflector (Mit-lett-volna Dinamikus Fordítóhenger)
                    </div>
                    <span className="text-[10px] bg-[#381f0d] text-[#e06c3a] border border-[#733c19] px-2 py-0.5 rounded font-mono font-bold">
                      WHAT-IF MODE
                    </span>
                  </div>

                  <label className={`flex items-center gap-2 cursor-pointer text-xs ${t.textPrimary}`}>
                    <input
                      type="checkbox"
                      checked={builderUseDualReflector}
                      onChange={(e) => setBuilderUseDualReflector(e.target.checked)}
                      className="accent-[#ebc238] w-4 h-4 cursor-pointer"
                    />
                    <span className={`font-bold ${t.textMuted}`}>
                      Enable UKW-Dual-Dynamic Reflector for daily keys (useDualDynamicReflector)
                    </span>
                  </label>

                  {builderUseDualReflector && (
                    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t ${t.borderBase} animate-fade-in`}>
                      {/* Fixed vs Random Reflector Ring */}
                      <div>
                        <label className={`block text-xs ${t.textMuted} mb-1`}>
                          Reflector Ringstellung (fixedReflectorRing):
                        </label>
                        <div className="flex items-center gap-2">
                          <label className={`flex items-center gap-1.5 text-xs ${t.textPrimary} cursor-pointer`}>
                            <input
                              type="checkbox"
                              checked={builderUseFixedReflectorRing}
                              onChange={(e) => setBuilderUseFixedReflectorRing(e.target.checked)}
                              className="accent-[#ebc238]"
                            />
                            <span>Fixed Ring</span>
                          </label>
                          {builderUseFixedReflectorRing && (
                            <select
                              value={builderFixedReflectorRing}
                              onChange={(e) => setBuilderFixedReflectorRing(parseInt(e.target.value) || 1)}
                              className={`bg-[#171208] border ${t.borderBase} ${t.textAccent} rounded p-1 text-xs font-mono focus:outline-none`}
                            >
                              {Array.from({ length: 26 }, (_, i) => i + 1).map((n) => (
                                <option key={n} value={n}>
                                  {n.toString().padStart(2, '0')} ({String.fromCharCode(64 + n)})
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                        <span className={`text-[10px] ${t.textMuted} mt-0.5 block`}>
                          Unchecked: Randomized 01–26 daily per keying rules.
                        </span>
                      </div>

                      {/* Fixed vs Random Reflector Start Position */}
                      <div>
                        <label className={`block text-xs ${t.textMuted} mb-1`}>
                          Reflector Start Position (fixedReflectorStart):
                        </label>
                        <div className="flex items-center gap-2">
                          <label className={`flex items-center gap-1.5 text-xs ${t.textPrimary} cursor-pointer`}>
                            <input
                              type="checkbox"
                              checked={builderUseFixedReflectorStart}
                              onChange={(e) => setBuilderUseFixedReflectorStart(e.target.checked)}
                              className="accent-[#ebc238]"
                            />
                            <span>Fixed Start</span>
                          </label>
                          {builderUseFixedReflectorStart && (
                            <select
                              value={builderFixedReflectorStart}
                              onChange={(e) => setBuilderFixedReflectorStart(parseInt(e.target.value) || 1)}
                              className={`bg-[#171208] border ${t.borderBase} ${t.textAccent} rounded p-1 text-xs font-mono focus:outline-none`}
                            >
                              {Array.from({ length: 26 }, (_, i) => i + 1).map((n) => (
                                <option key={n} value={n}>
                                  {n.toString().padStart(2, '0')} ({String.fromCharCode(64 + n)})
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                        <span className={`text-[10px] ${t.textMuted} mt-0.5 block`}>
                          Unchecked: Randomized initial position per day.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className={`pt-4 border-t ${t.borderBase} flex justify-end gap-3`}>
              <button
                type="button"
                onClick={onCancel}
                className={`px-4 py-2 rounded-lg ${t.panelBg} ${t.textMuted} hover:bg-[#4e453b] ${t.fontHeader} text-xs uppercase font-bold cursor-pointer`}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-6 py-2.5 rounded-lg bg-[#ebc238] text-[#25190b] ${t.fontHeader} text-xs uppercase font-bold hover:bg-[#d4ad2d] shadow flex items-center gap-2 cursor-pointer`}
              >
                <span className="material-symbols-outlined text-base">check_circle</span>
                Generate & Save Codebook
              </button>
            </div>
          </form>
        </div>
  );
};

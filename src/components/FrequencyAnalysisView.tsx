import React, { useState, useEffect, useRef, useCallback, useMemo, useContext } from 'react';
import { useTheme, getTheme } from '../lib/theme';
//import React, { useState, useMemo } from 'react';
import { EnigmaConfig } from '../types';

interface FrequencyAnalysisViewProps {
  config: EnigmaConfig;
  inputTape: string;
  cipherTape: string;
}

// Reference letter frequencies from historical datasets
const GERMAN_FREQS: Record<string, number> = {
  A: 6.51, B: 1.89, C: 3.06, D: 5.08, E: 17.40, F: 1.66, G: 3.01, H: 4.76, I: 7.55, J: 0.27,
  K: 1.21, L: 3.44, M: 2.53, N: 9.78, O: 2.51, P: 0.79, Q: 0.02, R: 7.00, S: 7.27, T: 6.15,
  U: 4.35, V: 0.67, W: 1.89, X: 0.03, Y: 0.04, Z: 1.13
};

const ENGLISH_FREQS: Record<string, number> = {
  A: 8.12, B: 1.49, C: 2.71, D: 4.25, E: 12.70, F: 2.23, G: 2.01, H: 6.09, I: 6.97, J: 0.15,
  K: 0.77, L: 4.03, M: 2.41, N: 6.75, O: 7.51, P: 1.93, Q: 0.10, R: 5.99, S: 6.33, T: 9.06,
  U: 2.76, V: 0.98, W: 2.36, X: 0.15, Y: 1.97, Z: 0.07
};

const UNIFORM_FREQ = 100 / 26; // ~3.85%

export const FrequencyAnalysisView: React.FC<FrequencyAnalysisViewProps> = ({
  config,
  inputTape,
  cipherTape,
}) => {
  const { theme } = useTheme();
  const t = getTheme(theme);
  const [inputText, setInputText] = useState<string>('');
  const [outputText, setOutputText] = useState<string>('');
  const [referenceType, setReferenceType] = useState<'english' | 'german' | 'uniform'>('english');
  const [hoveredLetter, setHoveredLetter] = useState<string | null>(null);

  // Sync with machine tapes on click
  const handleImportTapes = () => {
    setInputText(inputTape);
    setOutputText(cipherTape);
  };

  // Pre-load some interesting demonstration texts if they are empty
  const handleLoadDemo = (type: 'german_plain' | 'german_cipher' | 'lorem') => {
    if (type === 'german_plain') {
      setInputText('DASOBERKOMMANDODERWEHRMACHTGIBTBEKANNTWESTWALLSTREITKRAEFTEINBEREITSCHAFTFLOTTENVERBAENDEAUSGELAUFEN');
      setOutputText('XMKPFYVJUPXQZDUWTLHDPHHQLDSRIDVBLWWZSZGOMTMRCEIDZPMWIEUDRVNEZMRUIVWURTPEPVXQZQWULMDOVPAZOLDKJFPXWNDZ');
    } else if (type === 'lorem') {
      setInputText('THEENIGMAMACHINEWASAPOLYALPHABETICSUBSTITUTIONCIPHERUSEDBYGERMANYFORSECUREMILITARYCOMMUNICATIONS');
      setOutputText('RQXKMKPLBXZYWDZPRDCHODNZMWSLKKEDOAUWIPZMXLVHZEXLGDNZXUHVNEZQWULMKPTYRIHGDNZYWREPLMZNWUSLQHPDZM');
    }
  };

  // Clean and filter letters helper
  const cleanAndCount = (text: string) => {
    const counts: Record<string, number> = {};
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (const char of alphabet) {
      counts[char] = 0;
    }

    let total = 0;
    const cleanText = text.toUpperCase();
    for (let i = 0; i < cleanText.length; i++) {
      const char = cleanText[i];
      if (alphabet.includes(char)) {
        counts[char] = (counts[char] || 0) + 1;
        total++;
      }
    }

    return { counts, total };
  };

  const inputStats = useMemo(() => cleanAndCount(inputText), [inputText]);
  const outputStats = useMemo(() => cleanAndCount(outputText), [outputText]);

  const referenceFreqs = useMemo(() => {
    if (referenceType === 'german') return GERMAN_FREQS;
    if (referenceType === 'english') return ENGLISH_FREQS;
    const uniform: Record<string, number> = {};
    for (const char of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
      uniform[char] = UNIFORM_FREQ;
    }
    return uniform;
  }, [referenceType]);

  // Calculate Index of Coincidence (IC)
  // IC = Sum(f * (f - 1)) / (N * (N - 1))
  const calculateIC = (counts: Record<string, number>, total: number) => {
    if (total <= 1) return 0;
    let sum = 0;
    for (const char in counts) {
      const f = counts[char];
      sum += f * (f - 1);
    }
    return sum / (total * (total - 1));
  };

  const inputIC = useMemo(() => calculateIC(inputStats.counts, inputStats.total), [inputStats]);
  const outputIC = useMemo(() => calculateIC(outputStats.counts, outputStats.total), [outputStats]);

  // Check self-encryption derangement property
  // Enigma can NEVER encrypt a letter to itself
  const selfEncryptionDetails = useMemo(() => {
    const cleanIn = inputText.toUpperCase().replace(/[^A-Z]/g, '');
    const cleanOut = outputText.toUpperCase().replace(/[^A-Z]/g, '');
    const minLength = Math.min(cleanIn.length, cleanOut.length);

    if (minLength === 0) {
      return { matches: 0, rate: 0, totalAnalyzed: 0, hasIssues: false };
    }

    let matches = 0;
    const conflictIndices: number[] = [];
    for (let i = 0; i < minLength; i++) {
      if (cleanIn[i] === cleanOut[i]) {
        matches++;
        conflictIndices.push(i);
      }
    }

    const rate = (matches / minLength) * 100;
    return {
      matches,
      rate,
      totalAnalyzed: minLength,
      conflictIndices,
      // If matches > 0 but it's supposed to be Enigma text, that implies either
      // it wasn't encrypted on Enigma or there is a mismatch. Real Enigma is strictly 0%!
      hasIssues: matches > 0,
    };
  }, [inputText, outputText]);

  // Max percentages for chart scaling
  const maxPercent = useMemo(() => {
    let max = 15; // default floor
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (const char of alphabet) {
      const inPct = inputStats.total > 0 ? (inputStats.counts[char] / inputStats.total) * 100 : 0;
      const outPct = outputStats.total > 0 ? (outputStats.counts[char] / outputStats.total) * 100 : 0;
      const refPct = referenceFreqs[char] || 0;
      max = Math.max(max, inPct, outPct, refPct);
    }
    return Math.min(max + 2, 100);
  }, [inputStats, outputStats, referenceFreqs]);

  // Check which keys are plugged
  const plugboardMap = useMemo(() => {
    return config.plugboard;
  }, [config.plugboard]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className={`border-b ${t.borderBase} pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4`}>
        <div>
          <h1 className={`text-rotor-label ${t.fontRotor} ${t.textAccent} text-xl md:text-2xl flex items-center gap-2`}>
            <span className="material-symbols-outlined text-2xl">analytics</span>
            Frequency Analysis & Cryptanalysis Tool
          </h1>
          <p className={`${t.textMuted} text-xs ${t.fontBody}`}>
            Examine letter distribution profiles, verify the absolute derangement property, and analyze plugboard scrambling.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleImportTapes}
            disabled={!inputTape && !cipherTape}
            className={`text-xs ${t.fontHeader} px-3 py-1.5 rounded border transition-colors cursor-pointer flex items-center gap-1.5 ${
              inputTape || cipherTape
                ? t.buttonHighlight
                : t.buttonMuted + ' cursor-not-allowed opacity-50'
            }`}
          >
            <span className="material-symbols-outlined text-xs">sync_alt</span>
            Import from Machine Tapes
          </button>
          <button
            onClick={() => handleLoadDemo('german_plain')}
            className={`text-xs ${t.fontHeader} ${t.buttonPrimary} px-3 py-1.5 rounded transition-colors cursor-pointer`}
          >
            Load German Demo
          </button>
          <button
            onClick={() => handleLoadDemo('lorem')}
            className={`text-xs ${t.fontHeader} ${t.buttonPrimary} px-3 py-1.5 rounded transition-colors cursor-pointer`}
          >
            Load English Demo
          </button>
        </div>
      </div>

      {/* Main Analysis Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Inputs, Reference Selector & Cryptographic Metrics */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Text Areas */}
          <div className={`${t.panelBg} border ${t.borderBase} rounded-lg p-4 shadow-panel ${t.appTexture} space-y-4`}>
            <h3 className={`text-ui-header ${t.fontHeader} ${t.textSecondary} text-xs uppercase tracking-wider pb-1 border-b ${t.borderBase}`}>
              Interactive Input Data
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className={`text-[10px] ${t.fontMono} ${t.textMuted} uppercase tracking-wider block mb-1`}>
                  Plaintext (Original Message)
                </label>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type or paste plain text here to see frequency changes..."
                  className={`w-full h-24 p-2 ${t.panelInner} border ${t.borderBase} rounded ${t.textPrimary} ${t.fontMono} text-xs focus:outline-none focus:${t.borderAccent} placeholder-current/40 resize-none`}
                />
                <div className={`flex justify-between text-[10px] ${t.fontMono} ${t.textMuted} mt-0.5`}>
                  <span>Letters counted: {inputStats.total}</span>
                  {inputText && (
                    <button onClick={() => setInputText('')} className={`hover:${t.textPrimary} cursor-pointer`}>
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className={`text-[10px] ${t.fontMono} ${t.textMuted} uppercase tracking-wider block mb-1`}>
                  Ciphertext (Enigma Output)
                </label>
                <textarea
                  value={outputText}
                  onChange={(e) => setOutputText(e.target.value)}
                  placeholder="Type or paste cipher text here to analyze distribution flatness..."
                  className={`w-full h-24 p-2 ${t.panelInner} border ${t.borderBase} rounded ${t.textAccent} ${t.fontMono} text-xs focus:outline-none focus:${t.borderAccent} placeholder-current/40 resize-none`}
                />
                <div className={`flex justify-between text-[10px] ${t.fontMono} ${t.textMuted} mt-0.5`}>
                  <span>Letters counted: {outputStats.total}</span>
                  {outputText && (
                    <button onClick={() => setOutputText('')} className={`hover:${t.textPrimary} cursor-pointer`}>
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Reference Distribution Selection */}
          <div className={`${t.panelBg} border ${t.borderBase} rounded-lg p-4 shadow-panel ${t.appTexture} space-y-3`}>
            <h3 className={`text-ui-header ${t.fontHeader} ${t.textSecondary} text-xs uppercase tracking-wider pb-1 border-b ${t.borderBase}`}>
              Reference Baseline
            </h3>
            <p className={`text-[11px] ${t.textMuted}`}>
              Compare your text's frequency characteristics with standard historical profiles:
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setReferenceType('english')}
                className={`py-2 text-xs ${t.fontHeader} rounded border transition-colors cursor-pointer ${
                  referenceType === 'english'
                    ? `${t.buttonHighlight} font-semibold shadow-sm`
                    : `${t.buttonPrimary}`
                }`}
              >
                English
              </button>
              <button
                onClick={() => setReferenceType('german')}
                className={`py-2 text-xs ${t.fontHeader} rounded border transition-colors cursor-pointer ${
                  referenceType === 'german'
                    ? `${t.buttonHighlight} font-semibold shadow-sm`
                    : `${t.buttonPrimary}`
                }`}
              >
                German
              </button>
              <button
                onClick={() => setReferenceType('uniform')}
                className={`py-2 text-xs ${t.fontHeader} rounded border transition-colors cursor-pointer ${
                  referenceType === 'uniform'
                    ? `${t.buttonHighlight} font-semibold shadow-sm`
                    : `${t.buttonPrimary}`
                }`}
              >
                Uniform
              </button>
            </div>
          </div>

          {/* Index of Coincidence Card */}
          <div className={`${t.panelBg} border ${t.borderBase} rounded-lg p-4 shadow-panel ${t.appTexture} space-y-4`}>
            <div className={`flex items-center gap-2 pb-1 border-b ${t.borderBase}`}>
              <span className={`material-symbols-outlined text-sm ${t.textAccent}`}>grid_view</span>
              <h3 className={`text-ui-header ${t.fontHeader} ${t.textSecondary} text-xs uppercase tracking-wider`}>
                Index of Coincidence (I.C.)
              </h3>
            </div>
            
            <p className={`text-[11px] ${t.textMuted} leading-relaxed`}>
              I.C. measures how much a text deviates from a random uniform alphabet (0.0385). High values point to natural language fingerprint.
            </p>

            <div className="space-y-4 pt-1">
              {/* Plaintext I.C. */}
              <div className="space-y-1">
                <div className={`flex justify-between text-xs ${t.fontMono}`}>
                  <span className={`${t.textMuted}`}>Plaintext I.C.</span>
                  <span className={`font-bold ${t.textPrimary}`}>
                    {inputStats.total > 1 ? inputIC.toFixed(4) : '—'}
                  </span>
                </div>
                <div className={`h-2 ${t.panelInner} rounded-full overflow-hidden relative border ${t.borderBase}`}>
                  {inputStats.total > 1 && (
                    <div
                      className={`h-full ${t.progressFill} rounded-full transition-all duration-500`}
                      style={{ width: `${Math.min((inputIC / 0.08) * 100, 100)}%` }}
                    />
                  )}
                  {/* Gauge indicator points */}
                  <div className={`absolute top-0 bottom-0 w-0.5 ${t.borderDanger} left-[48%]`} title="Random Alphabet Floor (0.0385)" />
                  <div className={`absolute top-0 bottom-0 w-0.5 ${t.borderSuccess} left-[83%]`} title="English Language Target (0.0667)" />
                </div>
              </div>

              {/* Ciphertext I.C. */}
              <div className="space-y-1">
                <div className={`flex justify-between text-xs ${t.fontMono}`}>
                  <span className={`${t.textAccent}`}>Ciphertext I.C.</span>
                  <span className={`font-bold ${t.textAccent}`}>
                    {outputStats.total > 1 ? outputIC.toFixed(4) : '—'}
                  </span>
                </div>
                <div className={`h-2 ${t.panelInner} rounded-full overflow-hidden relative border ${t.borderBase}`}>
                  {outputStats.total > 1 && (
                    <div
                      className={`h-full ${t.progressFill} rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(235,194,56,0.6)]`}
                      style={{ width: `${Math.min((outputIC / 0.08) * 100, 100)}%` }}
                    />
                  )}
                  {/* Gauge indicator points */}
                  <div className={`absolute top-0 bottom-0 w-0.5 ${t.borderDanger} left-[48%]`} title="Random Alphabet Floor (0.0385)" />
                  <div className={`absolute top-0 bottom-0 w-0.5 ${t.borderSuccess} left-[83%]`} title="English Language Target (0.0667)" />
                </div>
              </div>
            </div>

            <div className={`flex items-center gap-2 ${t.panelInner} p-2.5 rounded border ${t.borderBase} text-[10px] ${t.textMuted} ${t.fontMono}`}>
              <span className={`material-symbols-outlined text-xs ${t.textAccent}`}>info</span>
              <span>
                Enigma encryption diffuses letters, pushing Ciphertext I.C. down near <strong className={`${t.textAccent}`}>0.0385</strong>. This flattened profile conceals standard letter frequencies.
              </span>
            </div>
          </div>

        </div>

        {/* Right Side: The visual charts & self-encryption & plugboard analyses */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* The Frequency Bar Chart */}
          <div className={`${t.panelBg} border ${t.borderBase} rounded-lg p-5 shadow-panel ${t.appTexture} space-y-4`}>
            <div className={`flex justify-between items-center pb-1 border-b ${t.borderBase}`}>
              <h3 className={`text-ui-header ${t.fontHeader} ${t.textSecondary} text-xs uppercase tracking-wider flex items-center gap-2`}>
                <span className="material-symbols-outlined text-sm">equalizer</span>
                Visual Monographic Frequency Profile (A-Z)
              </h3>
              <div className={`flex gap-4 text-[10px] ${t.fontMono} ${t.textMuted}`}>
                <span className="flex items-center gap-1">
                  <span className={`inline-block w-2.5 h-2.5 ${t.mutedBg} rounded-sm`} />
                  Plaintext
                </span>
                <span className="flex items-center gap-1">
                  <span className={`inline-block w-2.5 h-2.5 ${t.accentSolidBg} rounded-sm shadow-sm`} />
                  Ciphertext
                </span>
                <span className="flex items-center gap-1">
                  <span className={`inline-block w-2.5 h-2.5 border border-dashed ${t.borderAccent} bg-transparent rounded-sm`} />
                  Baseline ({referenceType.toUpperCase()})
                </span>
              </div>
            </div>

            {/* Rendered Chart */}
            <div className="relative pt-2">
              <div className="overflow-x-auto">
                <div className="min-w-[640px] h-72 flex items-end justify-between px-2 pb-6 relative">
                  
                  {/* Grid Y-lines */}
                  <div className={`absolute inset-0 flex flex-col justify-between pointer-events-none text-[9px] ${t.fontMono} ${t.textMuted}/40 pb-6`}>
                    <div className={`border-b ${t.borderBase}/40 w-full pt-1`}><span>{maxPercent.toFixed(0)}%</span></div>
                    <div className={`border-b ${t.borderBase}/40 w-full`}><span>{(maxPercent * 0.75).toFixed(0)}%</span></div>
                    <div className={`border-b ${t.borderBase}/40 w-full`}><span>{(maxPercent * 0.5).toFixed(0)}%</span></div>
                    <div className={`border-b ${t.borderBase}/40 w-full`}><span>{(maxPercent * 0.25).toFixed(0)}%</span></div>
                    <div className="w-full"><span>0%</span></div>
                  </div>

                  {/* Letter Columns */}
                  {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((char) => {
                    const inCount = inputStats.counts[char] || 0;
                    const inPct = inputStats.total > 0 ? (inCount / inputStats.total) * 100 : 0;
                    const outCount = outputStats.counts[char] || 0;
                    const outPct = outputStats.total > 0 ? (outCount / outputStats.total) * 100 : 0;
                    const refPct = referenceFreqs[char] || 0;

                    const inHeight = `${(inPct / maxPercent) * 100}%`;
                    const outHeight = `${(outPct / maxPercent) * 100}%`;
                    const refHeight = `${(refPct / maxPercent) * 100}%`;

                    const isPlugged = plugboardMap[char];
                    const isHovered = hoveredLetter === char;

                    return (
                      <div
                        key={char}
                        className="flex-1 flex flex-col items-center group relative h-full justify-end cursor-pointer px-0.5"
                        onMouseEnter={() => setHoveredLetter(char)}
                        onMouseLeave={() => setHoveredLetter(null)}
                      >
                        {/* Hover Overlay highlight */}
                        {isHovered && (
                          <div className={`absolute inset-x-0 top-0 bottom-6 ${t.accentLightBg} opacity-30 rounded-sm pointer-events-none border-x ${t.borderAccent}/10`} />
                        )}

                        <div className="w-full flex items-end justify-center h-full relative gap-[2px] pb-1 z-10">
                          {/* Reference Bar (Dashed wire behind) */}
                          <div
                            className={`absolute w-full border border-dashed ${t.chartBarBaseline} bg-transparent rounded-t-sm`}
                            style={{ height: refHeight, bottom: 4 }}
                          />

                          {/* Plaintext Bar */}
                          <div
                            className={`w-1/2 ${t.chartBarPlaintext} rounded-t-sm transition-all duration-300`}
                            style={{ height: inHeight }}
                          />

                          {/* Ciphertext Bar */}
                          <div
                            className={`w-1/2 ${t.chartBarCiphertext} rounded-t-sm transition-all duration-300`}
                            style={{ height: outHeight }}
                          />
                        </div>

                        {/* X-axis Label & Steckerbrett Indicator */}
                        <div className="absolute bottom-0 flex flex-col items-center">
                          <span className={`text-xs ${t.fontRotor} font-bold transition-colors duration-200 ${
                            isHovered || isPlugged ? t.textAccent : t.textMuted
                          }`}>
                            {char}
                          </span>
                          {isPlugged && (
                            <span className={`w-1 h-1 rounded-full ${t.bgAccentSolid} mt-0.5`} title={`Plugged to ${isPlugged}`} />
                          )}
                        </div>

                        {/* Interactive Tooltip Card */}
                        {isHovered && (
                          <div className={`absolute bottom-28 ${t.panelBg} border-2 ${t.borderAccent} rounded p-3 w-48 shadow-2xl z-50 text-left ${t.fontMono} text-[10px] leading-tight space-y-1.5 pointer-events-none transform -translate-y-2`}>
                            <div className={`flex justify-between items-center pb-1 border-b ${t.borderBase}`}>
                              <span className={`font-bold text-sm ${t.textAccent} ${t.fontRotor}`}>Letter {char}</span>
                              {isPlugged ? (
                                <span className={`px-1.5 py-0.5 rounded border uppercase font-bold text-[8px] ${t.accentLightBg}`}>
                                  🔌 Plugged to {isPlugged}
                                </span>
                              ) : (
                                <span className={`${t.textMuted} text-[8px]`}>Unplugged</span>
                              )}
                            </div>
                            <div className="flex justify-between">
                              <span className={`${t.textMuted}`}>Plaintext:</span>
                              <span className={`font-bold ${t.textPrimary}`}>{inPct.toFixed(1)}% ({inCount})</span>
                            </div>
                            <div className="flex justify-between">
                              <span className={`${t.textAccent}`}>Ciphertext:</span>
                              <span className={`font-bold ${t.textAccent}`}>{outPct.toFixed(1)}% ({outCount})</span>
                            </div>
                            <div className="flex justify-between">
                              <span className={`${t.textMuted}`}>Baseline ({referenceType.toUpperCase()}):</span>
                              <span className={`font-bold ${t.textMuted}`}>{refPct.toFixed(1)}%</span>
                            </div>
                            <div className={`flex justify-between border-t ${t.borderBase}/50 pt-1`}>
                              <span className={`${t.textMuted}`}>Deviation:</span>
                              <span className={`font-bold ${(outPct - refPct) >= 0 ? t.textSuccess : t.textDanger}`}>
                                {(outPct - refPct) >= 0 ? '+' : ''}{(outPct - refPct).toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Educational Insights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Self-Encryption / Derangement Property Check */}
            <div className={`${t.panelBg} border ${t.borderBase} rounded-lg p-5 shadow-panel ${t.appTexture} space-y-3.5`}>
              <div className={`flex items-center gap-2 pb-1 border-b ${t.borderBase}`}>
                <span className={`material-symbols-outlined text-sm ${t.textDanger}`}>cancel</span>
                <h3 className={`text-ui-header ${t.fontHeader} ${t.textSecondary} text-xs uppercase tracking-wider`}>
                  Self-Encryption Check (Crib Analysis)
                </h3>
              </div>

              <div className={`flex items-center justify-between ${t.panelInner} p-3 rounded border ${t.borderBase}`}>
                <div>
                  <span className={`text-[10px] ${t.fontMono} ${t.textMuted} block uppercase`}>
                    Letters Mapping to Themselves
                  </span>
                  <span className={`${t.fontRotor} text-lg font-bold ${t.textPrimary}`}>
                    {selfEncryptionDetails.matches} / {selfEncryptionDetails.totalAnalyzed} analyzed
                  </span>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] ${t.fontMono} ${t.textMuted} block uppercase`}>
                    Conflict Rate
                  </span>
                  <span className={`${t.fontRotor} text-lg font-bold ${
                    selfEncryptionDetails.hasIssues ? t.textDanger : t.textSuccess
                  }`}>
                    {selfEncryptionDetails.rate.toFixed(1)}%
                  </span>
                </div>
              </div>

              {selfEncryptionDetails.totalAnalyzed === 0 ? (
                <p className={`text-[11px] ${t.textMuted} italic`}>
                  Import text on both sides to run the self-encryption check.
                </p>
              ) : !selfEncryptionDetails.hasIssues ? (
                <div className="space-y-2">
                  <div className={`p-2.5 ${t.successBadge} border rounded flex items-start gap-2 text-[10px] ${t.fontMono} leading-relaxed`}>
                    <span className="material-symbols-outlined text-xs shrink-0 mt-0.5">verified_user</span>
                    <span>
                      <strong>Audit: Perfect Derangement verified!</strong> Zero letters encrypt to themselves. This strict constraint is an inherent mathematical property of the Enigma reflector circuit.
                    </span>
                  </div>
                  <p className={`text-[10px] ${t.textMuted} leading-relaxed`}>
                    <strong>The Cribbing Strategy:</strong> Because Enigma could never encrypt a letter to itself (e.g. "E" to "E"), Allied codebreakers used paper strips to slide guessed plaintexts (like "WETTERVORHERSAGE" - weather forecast) over ciphertext blocks. If any letter matched, they knew that alignment was invalid. When no letters matched, they had a potential 'crib' alignment, saving weeks of rotor configuration search.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className={`p-2.5 ${t.dangerBadge} border rounded flex items-start gap-2 text-[10px] ${t.fontMono} leading-relaxed`}>
                    <span className="material-symbols-outlined text-xs shrink-0 mt-0.5">warning</span>
                    <span>
                      <strong>Warning: Self-Encryption detected!</strong> Some letters map to themselves (e.g. index {selfEncryptionDetails.conflictIndices.slice(0, 3).map((v) => `#${v + 1}`).join(', ')}). This text cannot be a pure Enigma transmission, or the plain and cipher strings are misaligned.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Plugboard Effects Analysis */}
            <div className={`${t.panelBg} border ${t.borderBase} rounded-lg p-5 shadow-panel ${t.appTexture} space-y-3.5`}>
              <div className={`flex items-center gap-2 pb-1 border-b ${t.borderBase}`}>
                <span className={`material-symbols-outlined text-sm ${t.textAccent}`}>power_input</span>
                <h3 className={`text-ui-header ${t.fontHeader} ${t.textSecondary} text-xs uppercase tracking-wider`}>
                  Plugboard (Steckerbrett) Effects
                </h3>
              </div>

              <p className={`text-[10px] ${t.textMuted} leading-relaxed`}>
                The plugboard swaps pairs of letters at the very beginning and end of the electrical current. This changes the monographic frequency profile that enters the rotor scrambler.
              </p>

              <div className="space-y-2">
                <span className={`text-[10px] ${t.fontMono} ${t.textMuted} uppercase tracking-wider block`}>
                  Active Cable Swaps ({Object.keys(plugboardMap).length / 2})
                </span>
                
                {Object.keys(plugboardMap).length === 0 ? (
                  <div className={`p-3 ${t.panelInner} rounded border ${t.borderBase} text-center text-[10px] ${t.textMuted} italic`}>
                    No plugboard connections active. Letters enter the rotor scrambler unmodified.
                  </div>
                ) : (
                  <div className={`flex flex-wrap gap-1.5 max-h-24 overflow-y-auto ${t.panelInner} p-2 rounded border ${t.borderBase}`}>
                    {Object.entries(plugboardMap)
                      .filter(([k, v]) => k < v) // show only one direction pairs
                      .map(([k, v]) => (
                        <div
                          key={k}
                          className={`px-2 py-1 text-[10px] ${t.fontMono} rounded ${t.accentLightBg} border flex items-center gap-1 shadow-inner`}
                        >
                          <span className="font-bold">{k}</span>
                          <span className={`material-symbols-outlined text-[8px] ${t.textAccent}`}>sync_alt</span>
                          <span className="font-bold">{v}</span>
                        </div>
                      ))}
                  </div>
                )}

                <p className={`text-[10px] ${t.textMuted} leading-relaxed pt-1`}>
                  <strong>Frequency Scrambling:</strong> Because high frequency letters (like "E") are plugged to other letters, their natural high-frequency enters the scrambling rotor core through a completely different wire, and vice-versa. This prevents simple single-letter frequency solvers from breaking Enigma without finding the correct rotor paths first.
                </p>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

import React, { useState, useEffect, useRef, useCallback, useMemo, useContext } from 'react';
import { useTheme, getTheme } from '../lib/theme';
//import React, { useState, useMemo } from 'react';
import { EnigmaConfig } from '../types';
import { playRotorClickSound } from '../lib/audio';
import { encryptChar, charToNum, numToChar } from '../lib/enigmaEngine';

interface MessageHeaderPanelProps {
  isCompact: boolean;
  senderCallSign: string;
  setSenderCallSign: (val: string) => void;
  transmissionTime: string;
  setTransmissionTime: (val: string) => void;
  kenngruppe: string;
  setKenngruppe: (val: string) => void;
  localGrundstellung: string;
  handleGrundstellungChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onGrundstellungBlur?: () => void;
  onRandomKey?: () => void;
  soundEnabled: boolean;
  config: EnigmaConfig;
  inputTape: string;
  cipherTape: string;
  headerCollapsed: boolean;
  setHeaderCollapsed: (val: boolean) => void;
  handleStepAllForward: () => void;
  handleResetAllToA: () => void;
  headerCopied: boolean;
  handleCopyHeader: () => void;
  fullMessageCopied: boolean;
  handleCopyFullMessage: () => void;
  setShowImportModal: (val: boolean) => void;
  setShowBroadcastModal: (val: boolean) => void;
  onApplyRotorGrundstellung?: (newGrundstellung: string) => void;
}

export const MessageHeaderPanel: React.FC<MessageHeaderPanelProps> = ({
  isCompact,
  senderCallSign,
  setSenderCallSign,
  transmissionTime,
  setTransmissionTime,
  kenngruppe,
  setKenngruppe,
  localGrundstellung,
  handleGrundstellungChange,
  onGrundstellungBlur,
  onRandomKey,
  soundEnabled,
  config,
  inputTape,
  cipherTape,
  headerCollapsed,
  setHeaderCollapsed,
  handleStepAllForward,
  handleResetAllToA,
  headerCopied,
  handleCopyHeader,
  fullMessageCopied,
  handleCopyFullMessage,
  setShowImportModal,
  setShowBroadcastModal,
  onApplyRotorGrundstellung,
}) => {
  const { theme } = useTheme();
  const t = getTheme(theme);
  const lettersCount = inputTape.replace(/[^A-Z]/gi, '').length;

  // Historical Indicator (Spruchschlüssel) Encryption Assistant Modal state
  const [showIndicatorModal, setShowIndicatorModal] = useState<boolean>(false);
  const [indicatorMode, setIndicatorMode] = useState<'double' | 'single'>('double'); // Pre-May 1940 (Double XQFXQF) vs Post-May 1940 (Single XQF)
  const [messageKeyInput, setMessageKeyInput] = useState<string>('XQF');
  const [encryptedIndicatorResult, setEncryptedIndicatorResult] = useState<string>('');
  const [indicatorStep, setIndicatorStep] = useState<number>(1);

  // Compute active Grundstellung from current config
  const currentDailyGrundstellung = useMemo(() => {
    const isM4Active = config.fourthRotor.type === 'Beta' || config.fourthRotor.type === 'Gamma';
    const isUKWDual = config.reflector?.type === 'UKW-Dual-Dynamic';
    const r1 = numToChar(config.rightRotor.start);
    const r2 = numToChar(config.middleRotor.start);
    const r3 = numToChar(config.leftRotor.start);
    const u = isUKWDual ? numToChar(config.reflector?.start || 0) : '';
    if (isM4Active) {
      const r4 = numToChar(config.fourthRotor.start);
      return `${u}${r4}${r3}${r2}${r1}`;
    }
    return `${u}${r3}${r2}${r1}`;
  }, [config]);

  // Execute procedure calculation
  const handleCalculateIndicator = () => {
    const rawKey = messageKeyInput.toUpperCase().replace(/[^A-Z]/g, '');
    if (!rawKey) return;

    // Set machine rotors to daily Grundstellung
    let workingConfig: EnigmaConfig = JSON.parse(JSON.stringify(config));
    workingConfig.leftRotor.current = workingConfig.leftRotor.start;
    workingConfig.middleRotor.current = workingConfig.middleRotor.start;
    workingConfig.rightRotor.current = workingConfig.rightRotor.start;
    workingConfig.fourthRotor.current = workingConfig.fourthRotor.start;
    if (workingConfig.reflector) workingConfig.reflector.current = workingConfig.reflector.start;

    // Double (XQFXQF) or Single (XQF)
    const pattern = indicatorMode === 'double' ? rawKey + rawKey : rawKey;
    let encrypted = '';

    for (const ch of pattern) {
      const { nextConfig, result } = encryptChar(ch, workingConfig);
      encrypted += result.outputChar;
      workingConfig = nextConfig;
    }

    setEncryptedIndicatorResult(encrypted);
    playRotorClickSound(soundEnabled);
  };

  const handleApplyEncryptedIndicator = (indicatorStr: string) => {
    // Apply encrypted indicator to local Grundstellung field
    if (onApplyRotorGrundstellung) {
      onApplyRotorGrundstellung(indicatorStr);
    }
    setShowIndicatorModal(false);
  };

  const handleApplyMessageKeyToMachine = () => {
    // Receiver sets machine rotors to the decrypted message key position
    const rawKey = messageKeyInput.toUpperCase().replace(/[^A-Z]/g, '');
    if (rawKey && onApplyRotorGrundstellung) {
      onApplyRotorGrundstellung(rawKey);
    }
    setShowIndicatorModal(false);
  };

  return (
    <div
      className={`${
        isCompact
          ? (theme === 'vintage' ? 'bg-[#1b1710]/90 border-[#3d3526]' : 'bg-white/90 border-slate-200') + ' p-3.5 rounded-xl border shadow-lg space-y-3'
          : (theme === 'vintage' ? 'bg-[#17130b] border-[#3b3426]' : 'bg-slate-50 border-slate-200') + ' border p-3.5 rounded-lg space-y-3.5'
      } animate-fade-in`}
    >
      <div className={`flex items-center justify-between border-b ${t.borderBase} pb-1.5`}>
        <div className="flex items-center gap-1.5">
          <span className={`material-symbols-outlined text-[15px] ${t.textAccent}`}>fact_check</span>
          <span className={`text-[10px] ${t.fontMono} ${t.textAccent} uppercase tracking-wider font-bold`}>
            Funktelegramm Header (Message Header)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[9px] ${t.textMuted} font-mono uppercase tracking-widest hidden sm:inline`}>
            M3 / M4 Procedure
          </span>
          <button
            type="button"
            onClick={() => setHeaderCollapsed(!headerCollapsed)}
            className={`text-[10px] ${
              isCompact ? 'sm:text-[11px]' : ''
            } font-ui-header ${theme === 'vintage' ? 'text-[#d1c4b7] hover:text-[#ebc238] border-[#3b3426] bg-[#120e04]' : 'text-slate-600 hover:text-blue-600 border-slate-300 bg-slate-100'} flex items-center gap-0.5 cursor-pointer border px-1.5 py-0.5 rounded`}
            title={headerCollapsed ? 'Show Message Header' : 'Close Message Header'}
          >
            <span className="material-symbols-outlined text-sm">
              {headerCollapsed ? 'expand_more' : 'expand_less'}
            </span>
            <span>{headerCollapsed ? 'Show' : 'Close'}</span>
          </button>
        </div>
      </div>

      {!headerCollapsed && (
        <>
          <div className={`grid grid-cols-1 ${isCompact ? 'sm:grid-cols-3' : 'md:grid-cols-3'} gap-3`}>
            {/* 1. Preamble */}
            <div
              className={`border ${t.borderBase}/60 rounded ${
                isCompact ? 'p-2' : 'p-2.5'
              } ${theme === 'vintage' ? 'bg-[#120e04]/50' : 'bg-white'} flex flex-col justify-between`}
            >
              <div className={`flex items-center justify-between ${isCompact ? 'mb-1' : 'mb-1.5'}`}>
                <span className={`text-[10px] ${t.fontMono} ${t.textMuted} font-bold uppercase`}>
                  1. Preamble (Präambel)
                </span>
                <span className={`text-[9px] ${t.textMuted} font-mono`}>Cleartext</span>
              </div>
              <div className={`grid grid-cols-3 ${isCompact ? 'gap-1' : 'gap-1.5'}`}>
                <div>
                  <label
                    className={`text-[8px] ${t.textMuted} uppercase ${t.fontMono} block mb-0.5`}
                    title="Sender Call Sign"
                  >
                    Sender
                  </label>
                  <input
                    type="text"
                    value={senderCallSign}
                    onChange={(e) =>
                      setSenderCallSign(
                        e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 5)
                      )
                    }
                    placeholder="DFS"
                    className={`w-full ${theme === 'vintage' ? 'bg-[#1b160e] ' + t.textAccent : 'bg-white text-blue-600'} border ${t.borderBase} rounded ${
                      isCompact ? 'px-1 py-0.5' : 'px-1.5 py-1'
                    } text-xs font-monospaced-technical font-bold text-center focus:outline-none ${theme === 'vintage' ? 'focus:border-[#ebc238]' : 'focus:border-blue-500'} transition-colors`}
                    title="Sender identification call sign (Clear text)"
                  />
                </div>
                <div>
                  <label
                    className={`text-[8px] ${t.textMuted} uppercase ${t.fontMono} block mb-0.5 flex justify-between items-center`}
                    title="Time of Transmission"
                  >
                    <span>Time</span>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        const hours = String(d.getHours()).padStart(2, '0');
                        const mins = String(d.getMinutes()).padStart(2, '0');
                        setTransmissionTime(`${hours}${mins}`);
                        playRotorClickSound(soundEnabled);
                      }}
                      className={`text-[8px] ${t.textAccent} hover:underline cursor-pointer font-bold`}
                      title="Set to Current Time"
                    >
                      Now
                    </button>
                  </label>
                  <input
                    type="text"
                    value={transmissionTime}
                    onChange={(e) => setTransmissionTime(e.target.value.replace(/[^0-9]/g, '').substring(0, 4))}
                    placeholder="1200"
                    className={`w-full ${theme === 'vintage' ? 'bg-[#1b160e] ' + t.textAccent : 'bg-white text-blue-600'} border ${t.borderBase} rounded ${
                      isCompact ? 'px-1 py-0.5' : 'px-1.5 py-1'
                    } text-xs font-monospaced-technical font-bold text-center focus:outline-none ${theme === 'vintage' ? 'focus:border-[#ebc238]' : 'focus:border-blue-500'} transition-colors`}
                    title="Time of transmission (HHMM clear text)"
                  />
                </div>
                <div>
                  <label
                    className={`text-[8px] ${t.textMuted} uppercase ${t.fontMono} block mb-0.5`}
                    title="Letter Count"
                  >
                    Letters
                  </label>
                  <div
                    className={`w-full ${theme === 'vintage' ? 'bg-[#1b160e]/50 ' + t.textPrimary : 'bg-slate-50 text-slate-400'} border ${t.borderBase} rounded ${
                      isCompact ? 'py-0.5' : 'py-1'
                    } text-xs font-monospaced-technical font-bold text-center select-none`}
                    title="Automatically computed letter count of ciphertext tape"
                  >
                    {lettersCount}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Key Identifier */}
            <div
              className={`border ${t.borderBase}/60 rounded ${
                isCompact ? 'p-2' : 'p-2.5'
              } ${theme === 'vintage' ? 'bg-[#120e04]/50' : 'bg-white'} flex flex-col justify-between`}
            >
              <div className={`flex items-center justify-between ${isCompact ? 'mb-1' : 'mb-1.5'}`}>
                <span className={`text-[10px] ${t.fontMono} ${t.textMuted} font-bold uppercase`}>
                  2. Kenngruppe (Key ID)
                </span>
                {onRandomKey ? (
                  <button
                    type="button"
                    onClick={onRandomKey}
                    className={`text-[9px] ${t.textAccent} hover:underline cursor-pointer font-bold font-mono`}
                    title="Randomly select indicator group from currently active daily key"
                  >
                    🎲 Random Key
                  </button>
                ) : (
                  <span className={`text-[9px] ${t.textMuted} font-mono`}>3-Letter</span>
                )}
              </div>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={kenngruppe}
                  onChange={(e) => setKenngruppe(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').substring(0, 3))}
                  placeholder="UIO"
                  className={`w-20 ${theme === 'vintage' ? 'bg-[#1b160e] ' + t.textAccent : 'bg-white text-blue-600'} border ${t.borderBase} rounded ${
                    isCompact ? 'px-1 py-0.5' : 'px-1.5 py-1'
                  } text-xs font-monospaced-technical font-bold text-center focus:outline-none ${theme === 'vintage' ? 'focus:border-[#ebc238]' : 'focus:border-blue-500'} transition-colors`}
                  title="3-letter indicator of the daily key sheet being used"
                />
                <div className={`text-[9px] ${t.textMuted} leading-tight flex-1`}>
                  Identifies key day:{' '}
                  <span className={`${t.textAccent} font-bold ${t.fontMono}`}>
                    {kenngruppe || '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Indicators */}
            <div
              className={`border ${t.borderBase}/60 rounded ${
                isCompact ? 'p-2' : 'p-2.5'
              } ${theme === 'vintage' ? 'bg-[#120e04]/50' : 'bg-white'} flex flex-col justify-between`}
            >
              <div className={`flex items-center justify-between ${isCompact ? 'mb-1' : 'mb-1.5'}`}>
                <span className={`text-[10px] ${t.fontMono} ${t.textMuted} font-bold uppercase`}>
                  3. Indicators (Spruchschlüssel)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    handleCalculateIndicator();
                    setShowIndicatorModal(true);
                  }}
                  className={`text-[9px] ${t.textAccent} hover:underline cursor-pointer font-bold font-mono flex items-center gap-1`}
                  title="Open Authentic Message Key Indicator Procedural Assistant"
                >
                  <span className="material-symbols-outlined text-[11px]">key_visualizer</span>
                  <span>Indicator Assistant</span>
                </button>
              </div>
              <div className="flex gap-1.5 items-center">
                <div className="relative flex items-center gap-1 flex-1">
                  <input
                    type="text"
                    value={localGrundstellung}
                    onChange={handleGrundstellungChange}
                    onBlur={onGrundstellungBlur}
                    className={`w-full ${theme === 'vintage' ? 'bg-[#1b160e] ' + t.textAccent : 'bg-white text-blue-600'} border ${t.borderBase} rounded ${
                      isCompact ? 'px-1 py-0.5' : 'px-1.5 py-1'
                    } text-xs font-monospaced-technical font-bold tracking-widest text-center focus:outline-none ${theme === 'vintage' ? 'focus:border-[#ebc238]' : 'focus:border-blue-500'} transition-colors`}
                    placeholder="AAA"
                    title={
                      config.fourthRotor.type === 'Beta' || config.fourthRotor.type === 'Gamma'
                        ? 'Enter 4-letter startup positions (e.g. ABJZ)'
                        : 'Enter 3-letter startup positions (e.g. KDP)'
                    }
                  />
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={handleStepAllForward}
                      className={`${
                        isCompact ? 'text-[7px] px-0.5 py-0.2' : 'text-[8px] px-1 py-0.5'
                      } font-monospaced-technical ${theme === 'vintage' ? 'bg-[#221c11] border-[#4e453b] text-[#ebc238] hover:bg-[#ebc238]/20' : 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200'} border rounded cursor-pointer font-bold`}
                      title="Step all rotors and reflector forward"
                    >
                      +1 ALL
                    </button>
                    <button
                      type="button"
                      onClick={handleResetAllToA}
                      className={`${
                        isCompact ? 'text-[7px] px-0.5 py-0.2' : 'text-[8px] px-1 py-0.5'
                      } font-monospaced-technical ${theme === 'vintage' ? 'bg-[#221c11] border-[#4e453b] text-[#ede1cd] hover:bg-[#ebc238]/20' : 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200'} border rounded cursor-pointer`}
                      title="Reset all rotors and reflector to A"
                    >
                      RESET
                    </button>
                  </div>
                </div>
              </div>
              <div className={`text-[9px] ${t.textMuted} mt-1.5 italic font-mono leading-tight border-t ${t.borderBase}/30 pt-1 flex justify-between items-center`}>
                <span>
                  Start position:{' '}
                  <span className={`${t.textAccent} font-bold ${t.fontMono}`}>
                    {localGrundstellung || '—'}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    handleCalculateIndicator();
                    setShowIndicatorModal(true);
                  }}
                  className={`text-[8px] ${t.textAccent} hover:text-amber-300 underline font-mono cursor-pointer`}
                >
                  Encrypted Indicator Workflow
                </button>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className={`flex ${isCompact ? 'flex-nowrap overflow-x-auto pb-1.5 justify-start' : 'flex-wrap justify-end'} gap-1.5 sm:gap-2 pt-2 border-t ${t.borderBase}/60 scrollbar-none`}>
            <button
              type="button"
              onClick={handleCopyHeader}
              className={`shrink-0 ${
                isCompact ? 'text-[9px] px-2 py-1' : 'text-[10px] px-3 py-1.5'
              } font-monospaced-technical font-bold uppercase rounded border transition-all flex items-center gap-1 cursor-pointer ${
                headerCopied
                  ? 'bg-[#1b5e20] text-[#e8f5e9] border-[#2e7d32]'
                  : (theme === 'vintage' ? 'bg-[#221c11] text-[#ede1cd] border-[#4e453b] hover:bg-[#ebc238]/10 hover:text-[#ebc238] hover:border-[#ebc238]' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-400')
              }`}
              title="Copy the Funktelegramm header/preamble to clipboard"
            >
              <span className="material-symbols-outlined text-[13px]">
                {headerCopied ? 'done' : 'content_copy'}
              </span>
              {headerCopied ? 'Header Copied!' : 'Copy Header'}
            </button>

            <button
              type="button"
              onClick={handleCopyFullMessage}
              disabled={!cipherTape}
              className={`shrink-0 ${
                isCompact ? 'text-[9px] px-2 py-1' : 'text-[10px] px-3 py-1.5'
              } font-monospaced-technical font-bold uppercase rounded border transition-all flex items-center gap-1 cursor-pointer ${
                !cipherTape
                  ? (theme === 'vintage' ? 'opacity-40 cursor-not-allowed bg-[#1c1811] text-[#635848] border-[#2a241a]' : 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-300 border-slate-200')
                  : fullMessageCopied
                  ? 'bg-[#1b5e20] text-[#e8f5e9] border-[#2e7d32]'
                  : (theme === 'vintage' ? 'bg-[#ebc238] text-[#17130b] border-[#ebc238] hover:bg-[#f6d258]' : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-500')
              }`}
              title="Copy full transmission (Header + Ciphertext) to clipboard"
            >
              <span className="material-symbols-outlined text-[13px]">
                {fullMessageCopied ? 'done' : 'forward_to_inbox'}
              </span>
              {fullMessageCopied ? 'Message Copied!' : isCompact ? 'Copy Full' : 'Copy Full Message'}
            </button>

            <button
              type="button"
              onClick={() => setShowImportModal(true)}
              className={`shrink-0 ${
                isCompact ? 'text-[9px] px-2 py-1' : 'text-[10px] px-3 py-1.5'
              } font-monospaced-technical font-bold uppercase rounded border transition-all flex items-center gap-1 cursor-pointer ${theme === 'vintage' ? 'bg-[#221c11] text-[#ede1cd] border-[#4e453b] hover:bg-[#ebc238]/10 hover:text-[#ebc238] hover:border-[#ebc238]' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-400'}`}
              title="Import transmission or message and optional header"
            >
              <span className="material-symbols-outlined text-[13px]">file_upload</span>
              {isCompact ? 'Import Msg' : 'Import Message'}
            </button>

            <button
              type="button"
              onClick={() => setShowBroadcastModal(true)}
              className={`shrink-0 ${
                isCompact ? 'text-[9px] px-2 py-1' : 'text-[10px] px-3 py-1.5'
              } font-monospaced-technical font-bold uppercase rounded border transition-all flex items-center gap-1 cursor-pointer ${theme === 'vintage' ? 'bg-[#221c11] text-[#ede1cd] border-[#4e453b] hover:bg-[#ebc238]/10 hover:text-[#ebc238] hover:border-[#ebc238]' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-400'}`}
              title="Broadcast message via Morse code audio and visual signal"
            >
              <span className="material-symbols-outlined text-[13px]">rss_feed</span>
              {isCompact ? 'Broadcast' : 'Broadcast Message'}
            </button>
          </div>
        </>
      )}

      {/* Indicator Procedure Modal (Spruchschlüssel Double Encryption) */}
      {showIndicatorModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`${theme === 'vintage' ? 'bg-[#1b170e]' : 'bg-white'} border ${t.borderBase} rounded-lg max-w-xl w-full p-6 space-y-4 shadow-2xl relative ${theme === 'vintage' ? 'texture-metal shadow-black/80' : 'shadow-slate-200/50'} max-h-[90vh] overflow-y-auto`}>
            <button
              type="button"
              onClick={() => setShowIndicatorModal(false)}
              className={`absolute top-4 right-4 ${t.textMuted} hover:${t.textPrimary} transition-colors cursor-pointer`}
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className={`flex items-center gap-2 border-b ${t.borderBase} pb-3`}>
              <span className={`material-symbols-outlined ${theme === 'vintage' ? 'text-amber-500' : 'text-blue-600'}`}>key_visualizer</span>
              <h3 className={`text-sm font-bold ${t.textSecondary} ${t.fontHeader} uppercase tracking-wider`}>
                Authentic Indicator Procedure (Spruchschlüssel Workflow)
              </h3>
            </div>

            <p className={`text-xs ${t.textMuted} leading-relaxed ${t.fontMono}`}>
              Historically, transmitting raw Grundstellung settings directly violated security protocols. Operators chose a random message key (<span className={`${theme === 'vintage' ? 'text-amber-400' : 'text-blue-600'} font-bold`}>Spruchschlüssel</span>) and encrypted it at the daily key position before transmitting it in the preamble.
            </p>

            {/* Mode Switcher: Double Encryption (Pre-May 1940) vs Single Encryption (Post-May 1940) */}
            <div className="space-y-1.5">
              <label className={`text-[10px] ${t.textMuted} uppercase ${t.fontMono} block font-bold`}>
                Procedure Variant
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIndicatorMode('double');
                    playRotorClickSound(soundEnabled);
                  }}
                  className={`py-2 px-2 text-[11px] rounded border transition-colors cursor-pointer ${t.fontHeader} flex flex-col items-center gap-0.5 ${
                    indicatorMode === 'double'
                      ? (theme === 'vintage' ? 'bg-[#ebc238]/15 border-[#ebc238] text-[#ede1cd] font-bold' : 'bg-blue-600/10 border-blue-600 text-blue-700 font-bold')
                      : (theme === 'vintage' ? 'bg-[#120e04] border-[#3b3426] text-[#8c7e6a] hover:bg-[#252015]' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100')
                  }`}
                >
                  <span className={`flex items-center gap-1`}>
                    <span className={`material-symbols-outlined text-xs ${theme === 'vintage' ? 'text-amber-400' : 'text-blue-600'} font-bold`}>repeat</span>
                    Double Encryption (Pre-May 1940)
                  </span>
                  <span className="text-[8px] opacity-75 font-mono">Repeat Key: XQFXQF → 6 Letters</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIndicatorMode('single');
                    playRotorClickSound(soundEnabled);
                  }}
                  className={`py-2 px-2 text-[11px] rounded border transition-colors cursor-pointer ${t.fontHeader} flex flex-col items-center gap-0.5 ${
                    indicatorMode === 'single'
                      ? (theme === 'vintage' ? 'bg-[#ebc238]/15 border-[#ebc238] text-[#ede1cd] font-bold' : 'bg-blue-600/10 border-blue-600 text-blue-700 font-bold')
                      : (theme === 'vintage' ? 'bg-[#120e04] border-[#3b3426] text-[#8c7e6a] hover:bg-[#252015]' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100')
                  }`}
                >
                  <span className={`flex items-center gap-1`}>
                    <span className={`material-symbols-outlined text-xs ${theme === 'vintage' ? 'text-amber-400' : 'text-blue-600'} font-bold`}>looks_one</span>
                    Single Encryption (Post-May 1940)
                  </span>
                  <span className="text-[8px] opacity-75 font-mono">Single Key: XQF → 3 Letters</span>
                </button>
              </div>
            </div>

            {/* Interactive Steps Visualizer */}
            <div className={`${t.panelInner} border ${t.borderBase} rounded-lg p-3 space-y-3 ${t.fontMono} text-xs`}>
              <div className={`flex items-center justify-between border-b ${t.borderBase} pb-2`}>
                <span className={`${theme === 'vintage' ? 'text-amber-400' : 'text-blue-600'} font-bold uppercase text-[10px] tracking-wider`}>
                  Step-by-Step Procedure Steps
                </span>
                <span className={`text-[10px] ${t.textMuted}`}>
                  Daily Key: <span className={`${theme === 'vintage' ? 'text-amber-300' : 'text-blue-600'} font-bold`}>{currentDailyGrundstellung}</span>
                </span>
              </div>

              <div className={`space-y-2 ${t.textPrimary}`}>
                <div className="flex items-start gap-2">
                  <span className={`w-5 h-5 rounded-full ${theme === 'vintage' ? 'bg-amber-950 border-amber-600/60 text-amber-400' : 'bg-blue-50 border-blue-200 text-blue-600'} font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5`}>
                    1
                  </span>
                  <div>
                    <span className={`font-bold ${theme === 'vintage' ? 'text-amber-300' : 'text-blue-700'}`}>Set Daily Machine Key:</span> Rotors & Plugboard set per codebook sheet (Grundstellung: <span className={`${theme === 'vintage' ? 'text-amber-400' : 'text-blue-600'} font-bold`}>{currentDailyGrundstellung}</span>).
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className={`w-5 h-5 rounded-full ${theme === 'vintage' ? 'bg-amber-950 border-amber-600/60 text-amber-400' : 'bg-blue-50 border-blue-200 text-blue-600'} font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5`}>
                    2
                  </span>
                  <div className="flex-1 space-y-1">
                    <span className={`font-bold ${theme === 'vintage' ? 'text-amber-300' : 'text-blue-700'}`}>Choose Random Message Key (Spruchschlüssel):</span>
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={messageKeyInput}
                        onChange={(e) => setMessageKeyInput(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').substring(0, 3))}
                        className={`w-24 ${theme === 'vintage' ? 'bg-[#1b160e] text-amber-400 border-' + t.borderBase : 'bg-white text-blue-600 border-slate-300'} border rounded px-2 py-1 text-center font-bold tracking-widest focus:outline-none ${theme === 'vintage' ? 'focus:border-amber-400' : 'focus:border-blue-500'}`}
                        placeholder="XQF"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                          let rnd = '';
                          for (let i = 0; i < 3; i++) rnd += letters[Math.floor(Math.random() * 26)];
                          setMessageKeyInput(rnd);
                          playRotorClickSound(soundEnabled);
                        }}
                        className={`px-2 py-1 ${theme === 'vintage' ? 'bg-[#221c11] hover:bg-amber-600/20 text-amber-400' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'} border ${t.borderBase} rounded text-[10px] font-bold cursor-pointer`}
                      >
                        🎲 Random Key
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className={`w-5 h-5 rounded-full ${theme === 'vintage' ? 'bg-amber-950 border-amber-600/60 text-amber-400' : 'bg-blue-50 border-blue-200 text-blue-600'} font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5`}>
                    3
                  </span>
                  <div className="flex-1 space-y-1">
                    <span className={`font-bold ${theme === 'vintage' ? 'text-amber-300' : 'text-blue-700'}`}>Encrypt Message Key via Machine:</span>
                    <div className={`flex items-center justify-between ${theme === 'vintage' ? 'bg-[#1b170e]' : 'bg-slate-50'} p-2 rounded border ${t.borderBase} text-xs`}>
                      <span>Pattern: <span className={`font-bold ${theme === 'vintage' ? 'text-amber-300' : 'text-blue-700'}`}>{indicatorMode === 'double' ? `${messageKeyInput}${messageKeyInput}` : messageKeyInput}</span></span>
                      <button
                        type="button"
                        onClick={handleCalculateIndicator}
                        className={`px-2 py-0.5 ${theme === 'vintage' ? 'bg-amber-600 hover:bg-amber-500' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'} text-white rounded text-[10px] font-bold cursor-pointer transition-all`}
                      >
                        Calculate Encrypted Indicator
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className={`w-5 h-5 rounded-full ${theme === 'vintage' ? 'bg-amber-950 border-amber-600/60 text-amber-400' : 'bg-blue-50 border-blue-200 text-blue-600'} font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5`}>
                    4
                  </span>
                  <div className="flex-1 space-y-1">
                    <span className={`font-bold ${theme === 'vintage' ? 'text-amber-300' : 'text-blue-700'}`}>Encrypted Indicator Output (transmitted in header):</span>
                    <div className={`${theme === 'vintage' ? 'bg-[#1b170e] border-amber-600/50' : 'bg-blue-50 border-blue-200'} p-2 rounded border flex items-center justify-between`}>
                      <span className={`font-bold ${theme === 'vintage' ? 'text-amber-400' : 'text-blue-700'} tracking-widest text-sm`}>
                        {encryptedIndicatorResult || '—'}
                      </span>
                      {encryptedIndicatorResult && (
                        <button
                          type="button"
                          onClick={() => handleApplyEncryptedIndicator(encryptedIndicatorResult)}
                          className={`px-2 py-1 ${theme === 'vintage' ? 'bg-amber-600/30 hover:bg-amber-600 text-amber-300 hover:text-white border-amber-600/50' : 'bg-blue-600/10 hover:bg-blue-600 text-blue-600 hover:text-white border-blue-600/50'} border rounded text-[10px] font-bold cursor-pointer transition-colors`}
                        >
                          Use in Funktelegramm Header
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className={`w-5 h-5 rounded-full ${theme === 'vintage' ? 'bg-amber-950 border-amber-600/60 text-amber-400' : 'bg-blue-50 border-blue-200 text-blue-600'} font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5`}>
                    5
                  </span>
                  <div>
                    <span className={`font-bold ${theme === 'vintage' ? 'text-amber-300' : 'text-blue-700'}`}>Decrypt & Set Rotors for Message Body:</span>
                    <p className={`text-[10px] ${t.textMuted} mt-0.5 leading-snug`}>
                      Receiver decrypts <span className={`${theme === 'vintage' ? 'text-amber-300' : 'text-blue-600'}`}>{encryptedIndicatorResult || 'indicator'}</span> at daily key position back to secret key <span className={`${theme === 'vintage' ? 'text-amber-300' : 'text-blue-600'}`}>{messageKeyInput}</span>, then resets machine rotors to <span className={`${theme === 'vintage' ? 'text-amber-400' : 'text-blue-700'} font-bold`}>{messageKeyInput}</span> to encipher/decipher the actual message text!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={handleApplyMessageKeyToMachine}
                className={`px-3 py-1.5 ${theme === 'vintage' ? 'bg-[#221c11] hover:bg-amber-600/20 text-amber-400 border-' + t.borderBase + ' hover:border-amber-600/60' : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-300 hover:border-slate-400'} border rounded text-xs font-bold ${t.fontHeader} cursor-pointer flex items-center gap-1`}
                title="Set machine rotors to secret message key position"
              >
                <span className="material-symbols-outlined text-sm">precision_manufacturing</span>
                <span>Set Machine Rotors to Message Key ({messageKeyInput})</span>
              </button>

              <button
                type="button"
                onClick={() => setShowIndicatorModal(false)}
                className={`px-4 py-2 ${theme === 'vintage' ? 'bg-amber-600 hover:bg-amber-500' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'} text-white rounded text-xs font-bold ${t.fontHeader} cursor-pointer transition-all`}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { EnigmaConfig } from '../types';
import { playRotorClickSound } from '../lib/audio';

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
}) => {
  const lettersCount = inputTape.replace(/[^A-Z]/gi, '').length;

  return (
    <div
      className={`${
        isCompact
          ? 'bg-[#1b1710]/90 p-3.5 rounded-xl border border-[#3d3526] shadow-lg space-y-3'
          : 'bg-[#17130b] border border-[#3b3426] p-3.5 rounded-lg space-y-3.5'
      } animate-fade-in`}
    >
      <div className="flex items-center justify-between border-b border-[#3b3426] pb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[15px] text-[#ebc238]">fact_check</span>
          <span className="text-[10px] font-monospaced-technical text-[#ebc238] uppercase tracking-wider font-bold">
            Funktelegramm Header (Message Header)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-[#8c7e6a] font-mono uppercase tracking-widest hidden sm:inline">
            M3 / M4 Procedure
          </span>
          <button
            type="button"
            onClick={() => setHeaderCollapsed(!headerCollapsed)}
            className={`text-[10px] ${
              isCompact ? 'sm:text-[11px]' : ''
            } font-ui-header text-[#d1c4b7] hover:text-[#ebc238] flex items-center gap-0.5 cursor-pointer border border-[#3b3426] px-1.5 py-0.5 rounded bg-[#120e04]`}
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
              className={`border border-[#4e453b]/60 rounded ${
                isCompact ? 'p-2' : 'p-2.5'
              } bg-[#120e04]/50 flex flex-col justify-between`}
            >
              <div className={`flex items-center justify-between ${isCompact ? 'mb-1' : 'mb-1.5'}`}>
                <span className="text-[10px] font-monospaced-technical text-[#d1c4b7] font-bold uppercase">
                  1. Preamble (Präambel)
                </span>
                <span className="text-[9px] text-[#8c7e6a] font-mono">Cleartext</span>
              </div>
              <div className={`grid grid-cols-3 ${isCompact ? 'gap-1' : 'gap-1.5'}`}>
                <div>
                  <label
                    className="text-[8px] text-[#8c7e6a] uppercase font-monospaced-technical block mb-0.5"
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
                    className={`w-full bg-[#1b160e] text-[#ebc238] border border-[#4e453b] rounded ${
                      isCompact ? 'px-1 py-0.5' : 'px-1.5 py-1'
                    } text-xs font-monospaced-technical font-bold text-center focus:outline-none focus:border-[#ebc238] transition-colors`}
                    title="Sender identification call sign (Clear text)"
                  />
                </div>
                <div>
                  <label
                    className="text-[8px] text-[#8c7e6a] uppercase font-monospaced-technical block mb-0.5 flex justify-between items-center"
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
                      className="text-[8px] text-[#ebc238] hover:underline cursor-pointer font-bold"
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
                    className={`w-full bg-[#1b160e] text-[#ebc238] border border-[#4e453b] rounded ${
                      isCompact ? 'px-1 py-0.5' : 'px-1.5 py-1'
                    } text-xs font-monospaced-technical font-bold text-center focus:outline-none focus:border-[#ebc238] transition-colors`}
                    title="Time of transmission (HHMM clear text)"
                  />
                </div>
                <div>
                  <label
                    className="text-[8px] text-[#8c7e6a] uppercase font-monospaced-technical block mb-0.5"
                    title="Letter Count"
                  >
                    Letters
                  </label>
                  <div
                    className={`w-full bg-[#1b160e]/50 text-[#ede1cd] border border-[#3b3426] rounded ${
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
              className={`border border-[#4e453b]/60 rounded ${
                isCompact ? 'p-2' : 'p-2.5'
              } bg-[#120e04]/50 flex flex-col justify-between`}
            >
              <div className={`flex items-center justify-between ${isCompact ? 'mb-1' : 'mb-1.5'}`}>
                <span className="text-[10px] font-monospaced-technical text-[#d1c4b7] font-bold uppercase">
                  2. Kenngruppe (Key ID)
                </span>
                {onRandomKey ? (
                  <button
                    type="button"
                    onClick={onRandomKey}
                    className="text-[9px] text-[#ebc238] hover:underline cursor-pointer font-bold font-mono"
                    title="Randomly select indicator group from currently active daily key"
                  >
                    🎲 Random Key
                  </button>
                ) : (
                  <span className="text-[9px] text-[#8c7e6a] font-mono">3-Letter</span>
                )}
              </div>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={kenngruppe}
                  onChange={(e) => setKenngruppe(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').substring(0, 3))}
                  placeholder="UIO"
                  className={`w-20 bg-[#1b160e] text-[#ebc238] border border-[#4e453b] rounded ${
                    isCompact ? 'px-1 py-0.5' : 'px-1.5 py-1'
                  } text-xs font-monospaced-technical font-bold text-center focus:outline-none focus:border-[#ebc238] transition-colors`}
                  title="3-letter indicator of the daily key sheet being used"
                />
                <div className="text-[9px] text-[#8c7e6a] leading-tight flex-1">
                  Identifies key day:{' '}
                  <span className="text-[#ebc238] font-bold font-monospaced-technical">
                    {kenngruppe || '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Indicators */}
            <div
              className={`border border-[#4e453b]/60 rounded ${
                isCompact ? 'p-2' : 'p-2.5'
              } bg-[#120e04]/50 flex flex-col justify-between`}
            >
              <div className={`flex items-center justify-between ${isCompact ? 'mb-1' : 'mb-1.5'}`}>
                <span className="text-[10px] font-monospaced-technical text-[#d1c4b7] font-bold uppercase">
                  3. Indicators (Spruchschlüssel)
                </span>
                <span className="text-[9px] text-[#8c7e6a] font-mono">Grundstellung</span>
              </div>
              <div className="flex gap-1.5 items-center">
                <div className="relative flex items-center gap-1 flex-1">
                  <input
                    type="text"
                    value={localGrundstellung}
                    onChange={handleGrundstellungChange}
                    onBlur={onGrundstellungBlur}
                    className={`w-full bg-[#1b160e] text-[#ebc238] border border-[#4e453b] rounded ${
                      isCompact ? 'px-1 py-0.5' : 'px-1.5 py-1'
                    } text-xs font-monospaced-technical font-bold tracking-widest text-center focus:outline-none focus:border-[#ebc238] transition-colors`}
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
                      } font-monospaced-technical bg-[#221c11] border border-[#4e453b] text-[#ebc238] hover:bg-[#ebc238]/20 rounded cursor-pointer font-bold`}
                      title="Step all rotors and reflector forward"
                    >
                      +1 ALL
                    </button>
                    <button
                      type="button"
                      onClick={handleResetAllToA}
                      className={`${
                        isCompact ? 'text-[7px] px-0.5 py-0.2' : 'text-[8px] px-1 py-0.5'
                      } font-monospaced-technical bg-[#221c11] border border-[#4e453b] text-[#ede1cd] hover:bg-[#ebc238]/20 rounded cursor-pointer`}
                      title="Reset all rotors and reflector to A"
                    >
                      RESET
                    </button>
                  </div>
                </div>
              </div>
              <div className="text-[9px] text-[#8c7e6a] mt-1.5 italic font-mono leading-tight border-t border-[#3b3426]/30 pt-1">
                Start position:{' '}
                <span className="text-[#ebc238] font-bold font-monospaced-technical">
                  {localGrundstellung || '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-[#3b3426]/60 justify-end">
            <button
              type="button"
              onClick={handleCopyHeader}
              className={`text-[10px] font-monospaced-technical font-bold uppercase px-3 py-1.5 rounded border transition-all flex items-center gap-1.5 cursor-pointer ${
                headerCopied
                  ? 'bg-[#1b5e20] text-[#e8f5e9] border-[#2e7d32]'
                  : 'bg-[#221c11] text-[#ede1cd] border-[#4e453b] hover:bg-[#ebc238]/10 hover:text-[#ebc238] hover:border-[#ebc238]'
              }`}
              title="Copy the Funktelegramm header/preamble to clipboard"
            >
              <span className="material-symbols-outlined text-[14px]">
                {headerCopied ? 'done' : 'content_copy'}
              </span>
              {headerCopied ? 'Header Copied!' : 'Copy Header'}
            </button>

            <button
              type="button"
              onClick={handleCopyFullMessage}
              disabled={!cipherTape}
              className={`text-[10px] font-monospaced-technical font-bold uppercase px-3 py-1.5 rounded border transition-all flex items-center gap-1.5 cursor-pointer ${
                !cipherTape
                  ? 'opacity-40 cursor-not-allowed bg-[#1c1811] text-[#635848] border-[#2a241a]'
                  : fullMessageCopied
                  ? 'bg-[#1b5e20] text-[#e8f5e9] border-[#2e7d32]'
                  : 'bg-[#ebc238] text-[#17130b] border-[#ebc238] hover:bg-[#f6d258]'
              }`}
              title="Copy full transmission (Header + Ciphertext) to clipboard"
            >
              <span className="material-symbols-outlined text-[14px]">
                {fullMessageCopied ? 'done' : 'forward_to_inbox'}
              </span>
              {fullMessageCopied ? 'Message Copied!' : 'Copy Full Message'}
            </button>

            <button
              type="button"
              onClick={() => setShowImportModal(true)}
              className="text-[10px] font-monospaced-technical font-bold uppercase px-3 py-1.5 rounded border transition-all flex items-center gap-1.5 cursor-pointer bg-[#221c11] text-[#ede1cd] border-[#4e453b] hover:bg-[#ebc238]/10 hover:text-[#ebc238] hover:border-[#ebc238]"
              title="Import transmission or message and optional header"
            >
              <span className="material-symbols-outlined text-[14px]">file_upload</span>
              Import Message
            </button>

            <button
              type="button"
              onClick={() => setShowBroadcastModal(true)}
              className="text-[10px] font-monospaced-technical font-bold uppercase px-3 py-1.5 rounded border transition-all flex items-center gap-1.5 cursor-pointer bg-[#221c11] text-[#ede1cd] border-[#4e453b] hover:bg-[#ebc238]/10 hover:text-[#ebc238] hover:border-[#ebc238]"
              title="Broadcast message via Morse code audio and visual signal"
            >
              <span className="material-symbols-outlined text-[14px]">rss_feed</span>
              Broadcast Message
            </button>
          </div>
        </>
      )}
    </div>
  );
};

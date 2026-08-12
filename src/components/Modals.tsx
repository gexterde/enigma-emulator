import React, { useState } from 'react';
import { EnigmaConfig } from '../types';
import { generateConfigString } from '../lib/enigmaEngine';
import { useTheme, getTheme, ThemeName, AVAILABLE_THEMES } from '../lib/theme';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: string;
  children: React.ReactNode;
}

export const BaseModal: React.FC<ModalProps> = ({ isOpen, onClose, title, icon, children }) => {
  const { theme, setTheme } = useTheme();
  const t = getTheme(theme);



  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
      <div
        className={`${t.modalBg} rounded-lg max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`p-4 ${t.modalHeaderBg} flex justify-between items-center shrink-0`}>
          <div className="flex items-center gap-2">
            {icon && <span className={`material-symbols-outlined ${t.textAccent}`}>{icon}</span>}
            <h2 className={`${t.fontHeader} ${t.textPrimary} text-base`}>{title}</h2>
          </div>
          <button
            onClick={onClose}
            className={`${t.textMuted} hover:${t.textAccent} transition-colors p-1 rounded-full cursor-pointer`}
            aria-label="Close modal"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className={`p-6 overflow-y-auto space-y-4 ${t.fontBody} text-xs ${t.textMuted}`}>
          {children}
        </div>

        <div className={`p-4 ${t.modalFooterBg} flex justify-end shrink-0`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 ${t.buttonHighlight} ${t.fontHeader} rounded shadow text-xs font-bold cursor-pointer transition-colors`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  soundEnabled: boolean;
  onToggleSound: (enabled: boolean) => void;
  onResetMachine: () => void;
  senderCallSign: string;
  onUpdateSenderCallSign: (newSender: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  soundEnabled,
  onToggleSound,
  onResetMachine,
  senderCallSign,
  onUpdateSenderCallSign,
}) => {
  const { theme, setTheme } = useTheme();
  const t = getTheme(theme);

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Emulator Settings" icon="settings">
      <div className="space-y-4">
        {/* Audio Feedback */}
        <div className={`flex justify-between items-center ${t.panelBg} p-3 rounded ${t.borderBase}`}>
          <div>
            <span className={`font-bold ${t.textPrimary} block`}>Audio Feedback</span>
            <span className={`text-[10px] ${t.textMuted}`}>Simulate physical mechanical key clacks & rotor clicks</span>
          </div>
          <input
            type="checkbox"
            checked={soundEnabled}
            onChange={(e) => onToggleSound(e.target.checked)}
            className="mech-switch cursor-pointer"
          />
        </div>

        {/* Customizable Sender Call Sign (Absender) */}
        <div className={`p-3.5 rounded ${t.panelBg} border ${t.borderBase} space-y-2.5`}>
          <div className="flex items-center justify-between">
            <div>
              <span className={`font-bold ${t.textPrimary} flex items-center gap-1.5 text-sm`}>
                <span className={`material-symbols-outlined text-base ${t.textAccent}`}>badge</span>
                <span>Sender Call Sign (Absender)</span>
              </span>
              <span className={`text-[10px] ${t.textMuted} block mt-0.5`}>
                Station call sign used in Funktelegramm Preamble (Präambel) headers
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={senderCallSign}
                onChange={(e) =>
                  onUpdateSenderCallSign(
                    e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 5)
                  )
                }
                placeholder="DFS"
                maxLength={5}
                className={`w-20 ${t.inputBg} ${t.textAccent} border ${t.borderBase} font-monospaced-technical font-bold text-sm text-center px-2 py-1 rounded focus:outline-none focus:${t.borderAccent}`}
              />
            </div>
          </div>

          {/* Presets */}
          <div className="flex items-center gap-1.5 pt-1">
            <span className={`text-[9px] ${t.textMuted} font-mono uppercase font-bold`}>Presets:</span>
            {['DFS', 'J3K', 'X9W', 'G7A', 'R5T'].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => onUpdateSenderCallSign(preset)}
                className={`px-2 py-0.5 rounded text-[10px] ${t.fontMono} font-bold border transition-all cursor-pointer ${
                  senderCallSign === preset
                    ? t.activeBadge
                    : t.inactiveBadge
                }`}
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Live Preamble Header Preview */}
          <div className={`${t.wellBg} p-2 rounded border ${t.borderBase}/60 text-[10px] ${t.fontMono} flex items-center justify-between`}>
            <span className={t.textMuted}>Preamble Format Preview:</span>
            <span className={`${t.textAccent} font-bold tracking-wider`}>
              {senderCallSign || '???'} 1200 15 UIO AAA
            </span>
          </div>
        </div>

        {/* Theme & Appearance */}
        <div className={`flex justify-between items-center ${t.panelBg} p-3 rounded ${t.borderBase}`}>
          <div>
            <span className={`font-bold ${t.textPrimary} block`}>Theme & Appearance</span>
            <span className={`text-[10px] ${t.textMuted}`}>Select visual styling scheme</span>
          </div>
          <select 
            value={theme}
            onChange={(e) => setTheme(e.target.value as ThemeName)}
            className={`${t.inputBg} ${t.fontMono} text-xs px-2 py-1 rounded border outline-none cursor-pointer`}
          >
            {AVAILABLE_THEMES.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.name}
              </option>
            ))}
          </select>
        </div>

        <div className={`p-3 ${t.dangerBg} rounded space-y-2 border`}>
          <span className="font-bold block">Factory Reset</span>
          <p className="text-[10px] opacity-80">Reset rotors to Rotors I-II-III, positions A-A-A, rings 01-01-01, and clear plugboard.</p>
          <button
            onClick={() => {
              onResetMachine();
              onClose();
            }}
            className={`px-3 py-1.5 ${t.buttonDangerSolid} rounded text-xs font-bold transition-colors cursor-pointer`}
          >
            Reset Machine Now
          </button>
        </div>
      </div>
    </BaseModal>
  );
};

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose }) => {
  const { theme, setTheme } = useTheme();
  const t = getTheme(theme);


  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Historical Accuracy & Manual" icon="info">
      <div className="space-y-3 leading-relaxed">
        <h3 className={`font-bold ${t.textAccent} text-sm`}>Wehrmacht Enigma Model M3 (1938-1945)</h3>
        <p>
          The Enigma machine is an electro-mechanical rotor cipher machine used extensively during World War II. The M3 model features a 3-rotor scrambler selected from a pool of 5 rotors (I through V), a reflector (Umkehrwalze B or C), and a plugboard (Steckerbrett).
        </p>

        <h4 className={`font-bold ${t.textSecondary} mt-2`}>Key Concepts & Terminology:</h4>
        <ul className={`list-disc list-inside space-y-1 text-[11px] ${t.textMuted}`}>
          <li><strong className={`${t.textPrimary}`}>Walzenlage (Rotor Selection):</strong> The sequence of 3 rotors chosen from rotors I-V placed left to right in positions 1, 2, and 3.</li>
          <li><strong className={`${t.textPrimary}`}>Ringstellung (Ring Setting):</strong> The offset of the internal rotor wiring relative to the outer letter ring (1 to 26).</li>
          <li><strong className={`${t.textPrimary}`}>Grundstellung (Start Position):</strong> The initial visible letters facing up in the rotor windows (A to Z).</li>
          <li><strong className={`${t.textPrimary}`}>Steckerbrett (Plugboard):</strong> Up to 10 cables connecting letter pairs to swap signals prior to and after passing through the rotors.</li>
          <li><strong className={`${t.textPrimary}`}>Reciprocity:</strong> Encryption is symmetrical—if letter 'A' encrypts to 'G', setting the machine to the same key and typing 'G' will yield 'A'. No letter can ever encrypt to itself.</li>
        </ul>

        <h4 className={`font-bold ${t.textAccent} mt-3 pt-2 border-t ${t.borderBase}`}>Historical Rotor Turnover Notches:</h4>
        <div className={`overflow-x-auto ${t.panelInner} rounded border ${t.borderBase} p-2`}>
          <table className={`w-full text-left text-[11px] ${t.fontMono}`}>
            <thead>
              <tr className={`border-b ${t.borderBase} ${t.textAccent}`}>
                <th className="pb-1 px-1">Rotor</th>
                <th className="pb-1 px-1">Turnover</th>
                <th className="pb-1 px-1">Letter in Window</th>
                <th className="pb-1 px-1">Action</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${t.borderBase} ${t.textMuted}`}>
              <tr>
                <td className={`py-1 px-1 font-bold ${t.textSecondary}`}>Rotor I</td>
                <td className={`py-1 px-1 ${t.textAccent}`}>Q</td>
                <td className="py-1 px-1">Q</td>
                <td className={`py-1 px-1 ${t.textMuted}`}>Moving from Q → R steps the next rotor.</td>
              </tr>
              <tr>
                <td className={`py-1 px-1 font-bold ${t.textSecondary}`}>Rotor II</td>
                <td className={`py-1 px-1 ${t.textAccent}`}>E</td>
                <td className="py-1 px-1">E</td>
                <td className={`py-1 px-1 ${t.textMuted}`}>Moving from E → F steps the next rotor.</td>
              </tr>
              <tr>
                <td className={`py-1 px-1 font-bold ${t.textSecondary}`}>Rotor III</td>
                <td className={`py-1 px-1 ${t.textAccent}`}>V</td>
                <td className="py-1 px-1">V</td>
                <td className={`py-1 px-1 ${t.textMuted}`}>Moving from V → W steps the next rotor.</td>
              </tr>
              <tr>
                <td className={`py-1 px-1 font-bold ${t.textSecondary}`}>Rotor IV</td>
                <td className={`py-1 px-1 ${t.textAccent}`}>J</td>
                <td className="py-1 px-1">J</td>
                <td className={`py-1 px-1 ${t.textMuted}`}>Moving from J → K steps the next rotor.</td>
              </tr>
              <tr>
                <td className={`py-1 px-1 font-bold ${t.textSecondary}`}>Rotor V</td>
                <td className={`py-1 px-1 ${t.textAccent}`}>Z</td>
                <td className="py-1 px-1">Z</td>
                <td className={`py-1 px-1 ${t.textMuted}`}>Moving from Z → A steps the next rotor.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className={`text-[10px] ${t.textMuted} italic pt-2 border-t ${t.borderBase}`}>
          Historical Note: Bletchley Park cryptanalysts including Alan Turing and Marian Rejewski exploited structural weaknesses in Enigma operation, pioneering modern computing with the electromechanical Bombe machine.
        </p>
      </div>
    </BaseModal>
  );
};

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: EnigmaConfig;
}

export const ShortcutsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { theme, setTheme } = useTheme();
  const t = getTheme(theme);
  const shortcuts = [
    {
      category: 'Navigation Tabs',
      items: [
        { key: 'F1 or Ctrl + M', desc: 'Machine View' },
        { key: 'F2 or Ctrl + R', desc: 'Rotor Settings' },
        { key: 'F3 or Ctrl + P', desc: 'Plugboard View' },
        { key: 'F4 or Ctrl + B', desc: 'Codebook / Key Sheets' },
        { key: 'F5 or Ctrl + L', desc: 'Log & History View' },
        { key: 'F6 or Ctrl + T', desc: 'Morse Code Trainer' },
        { key: 'F7 or Ctrl + X', desc: 'Radio Transceiver (Live Multi-User CW)' },
      ]
    },
    {
      category: 'Machine View Controls',
      items: [
        { key: 'Ctrl + C (or Ctrl + Shift + C)', desc: 'Toggle Compact Mode (Compact Battery Switch / Dense Layout)' },
        { key: 'A – Z', desc: 'Type / Press Enigma Keys' },
        { key: 'Backspace', desc: 'Remove last character from paper tape' },
        { key: 'Space', desc: 'Add space separator on paper tape' },
      ]
    },
    {
      category: 'Modals & Dialogs',
      items: [
        { key: 'F6 or Ctrl + S', desc: 'Emulator Settings Modal' },
        { key: 'F7 or Ctrl + H', desc: 'Historical Info & Manual' },
        { key: 'F8 or Ctrl + Shift + S', desc: 'Share Key Configuration' },
        { key: 'F9 or ?', desc: 'Keyboard Shortcuts (this dialog)' },
        { key: 'Escape', desc: 'Close open dialog or menu' },
      ]
    }
  ];

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Keyboard Shortcuts" icon="keyboard">
      <div className="space-y-4">
        {shortcuts.map((group, idx) => (
          <div key={idx} className="space-y-2">
            <h3 className={`font-bold ${t.textAccent} text-xs uppercase tracking-wider border-b ${t.borderBase} pb-1`}>
              {group.category}
            </h3>
            <div className="grid grid-cols-1 gap-1.5">
              {group.items.map((item, itemIdx) => (
                <div
                  key={itemIdx}
                  className={`flex justify-between items-center ${t.panelInner} p-2 rounded border ${t.borderBase} text-[11px]`}
                >
                  <span className={`${t.textMuted}`}>{item.desc}</span>
                  <span className={`${t.fontMono} ${t.textAccent} ${t.panelInner} px-2 py-0.5 rounded border ${t.borderBase} font-bold shrink-0 ml-2`}>
                    {item.key}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </BaseModal>
  );
};

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, config }) => {
  const { theme, setTheme } = useTheme();
  const t = getTheme(theme);


  const configStr = generateConfigString(config);
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(configStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Share Enigma Key Configuration" icon="share">
      <div className="space-y-4">
        <p>You can share your current Enigma machine rotor setup and starting positions with fellow cryptographers to allow them to decrypt your messages.</p>

        <div className={`${t.panelInner} p-3 rounded border ${t.borderBase} flex items-center justify-between ${t.fontMono} text-sm ${t.textAccent}`}>
          <span className="break-all pr-2">{configStr}</span>
          <button
            onClick={handleCopy}
            className={`px-3 py-1.5 rounded text-xs ${t.fontHeader} font-bold cursor-pointer flex items-center gap-1 transition-all ${
              copied
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : t.buttonHighlight
            }`}
          >
            <span className="material-symbols-outlined text-xs">
              {copied ? 'check' : 'content_copy'}
            </span>
            {copied ? 'Copied!' : 'Copy Key'}
          </button>
        </div>
      </div>
    </BaseModal>
  );
};

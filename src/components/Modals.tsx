import React from 'react';
import { EnigmaConfig } from '../types';
import { generateConfigString } from '../lib/enigmaEngine';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: string;
  children: React.ReactNode;
}

export const BaseModal: React.FC<ModalProps> = ({ isOpen, onClose, title, icon, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
      <div
        className="bg-[#201b0f] border border-[#4e453b] text-[#ede1cd] rounded-lg max-w-lg w-full shadow-2xl texture-metal overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 bg-[#3b3426] border-b border-[#4e453b] flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            {icon && <span className="material-symbols-outlined text-[#ebc238]">{icon}</span>}
            <h2 className="text-ui-header font-ui-header font-bold text-[#e3c193] text-base">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#d1c4b7] hover:text-[#ffb4ab] transition-colors p-1 rounded-full hover:bg-[#2f291c] cursor-pointer"
            aria-label="Close modal"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4 font-ui-body text-xs text-[#d1c4b7]">
          {children}
        </div>

        <div className="p-4 bg-[#120e04] border-t border-[#3b3426] flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#8b6f47] hover:bg-[#8b6f47]/90 text-[#fffaf8] font-ui-header rounded shadow text-xs font-bold cursor-pointer transition-colors"
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
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  soundEnabled,
  onToggleSound,
  onResetMachine
}) => {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Emulator Settings" icon="settings">
      <div className="space-y-4">
        <div className="flex justify-between items-center bg-[#120e04] p-3 rounded border border-[#3b3426]">
          <div>
            <span className="font-bold text-[#ede1cd] block">Audio Feedback</span>
            <span className="text-[10px] text-[#d1c4b7]">Simulate physical mechanical key clacks & rotor clicks</span>
          </div>
          <input
            type="checkbox"
            checked={soundEnabled}
            onChange={(e) => onToggleSound(e.target.checked)}
            className="mech-switch cursor-pointer"
          />
        </div>

        <div className="flex justify-between items-center bg-[#120e04] p-3 rounded border border-[#3b3426]">
          <div>
            <span className="font-bold text-[#ede1cd] block">Theme & Appearance</span>
            <span className="text-[10px] text-[#d1c4b7]">Skeuomorphic WWII Enigma Tactile System Dark Walnut & Brass</span>
          </div>
          <span className="text-xs font-monospaced-technical text-[#ebc238]">Period Active</span>
        </div>

        <div className="p-3 bg-[#93000a]/20 border border-red-800/40 rounded space-y-2">
          <span className="font-bold text-[#ffdad6] block">Factory Reset</span>
          <p className="text-[10px] text-[#ffdad6]/80">Reset rotors to Rotors I-II-III, positions A-A-A, rings 01-01-01, and clear plugboard.</p>
          <button
            onClick={() => {
              onResetMachine();
              onClose();
            }}
            className="px-3 py-1.5 bg-[#93000a] text-[#ffdad6] rounded text-xs font-bold hover:bg-red-900 transition-colors cursor-pointer"
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
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Historical Accuracy & Manual" icon="info">
      <div className="space-y-3 leading-relaxed">
        <h3 className="font-bold text-[#ebc238] text-sm">Wehrmacht Enigma Model M3 (1938-1945)</h3>
        <p>
          The Enigma machine is an electro-mechanical rotor cipher machine used extensively during World War II. The M3 model features a 3-rotor scrambler selected from a pool of 5 rotors (I through V), a reflector (Umkehrwalze B or C), and a plugboard (Steckerbrett).
        </p>

        <h4 className="font-bold text-[#e3c193] mt-2">Key Concepts & Terminology:</h4>
        <ul className="list-disc list-inside space-y-1 text-[11px] text-[#d1c4b7]">
          <li><strong className="text-[#ede1cd]">Walzenlage (Rotor Selection):</strong> The sequence of 3 rotors chosen from rotors I-V placed left to right in positions 1, 2, and 3.</li>
          <li><strong className="text-[#ede1cd]">Ringstellung (Ring Setting):</strong> The offset of the internal rotor wiring relative to the outer letter ring (1 to 26).</li>
          <li><strong className="text-[#ede1cd]">Grundstellung (Start Position):</strong> The initial visible letters facing up in the rotor windows (A to Z).</li>
          <li><strong className="text-[#ede1cd]">Steckerbrett (Plugboard):</strong> Up to 10 cables connecting letter pairs to swap signals prior to and after passing through the rotors.</li>
          <li><strong className="text-[#ede1cd]">Reciprocity:</strong> Encryption is symmetrical—if letter 'A' encrypts to 'G', setting the machine to the same key and typing 'G' will yield 'A'. No letter can ever encrypt to itself.</li>
        </ul>

        <h4 className="font-bold text-[#ebc238] mt-3 pt-2 border-t border-[#3b3426]">Historical Rotor Turnover Notches:</h4>
        <div className="overflow-x-auto bg-[#120e04] rounded border border-[#3b3426] p-2">
          <table className="w-full text-left text-[11px] font-monospaced-technical">
            <thead>
              <tr className="border-b border-[#3b3426] text-[#ebc238]">
                <th className="pb-1 px-1">Rotor</th>
                <th className="pb-1 px-1">Turnover</th>
                <th className="pb-1 px-1">Letter in Window</th>
                <th className="pb-1 px-1">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#201b0f] text-[#d1c4b7]">
              <tr>
                <td className="py-1 px-1 font-bold text-[#e3c193]">Rotor I</td>
                <td className="py-1 px-1 text-[#ebc238]">Q</td>
                <td className="py-1 px-1">Q</td>
                <td className="py-1 px-1 text-[#a89985]">Moving from Q → R steps the next rotor.</td>
              </tr>
              <tr>
                <td className="py-1 px-1 font-bold text-[#e3c193]">Rotor II</td>
                <td className="py-1 px-1 text-[#ebc238]">E</td>
                <td className="py-1 px-1">E</td>
                <td className="py-1 px-1 text-[#a89985]">Moving from E → F steps the next rotor.</td>
              </tr>
              <tr>
                <td className="py-1 px-1 font-bold text-[#e3c193]">Rotor III</td>
                <td className="py-1 px-1 text-[#ebc238]">V</td>
                <td className="py-1 px-1">V</td>
                <td className="py-1 px-1 text-[#a89985]">Moving from V → W steps the next rotor.</td>
              </tr>
              <tr>
                <td className="py-1 px-1 font-bold text-[#e3c193]">Rotor IV</td>
                <td className="py-1 px-1 text-[#ebc238]">J</td>
                <td className="py-1 px-1">J</td>
                <td className="py-1 px-1 text-[#a89985]">Moving from J → K steps the next rotor.</td>
              </tr>
              <tr>
                <td className="py-1 px-1 font-bold text-[#e3c193]">Rotor V</td>
                <td className="py-1 px-1 text-[#ebc238]">Z</td>
                <td className="py-1 px-1">Z</td>
                <td className="py-1 px-1 text-[#a89985]">Moving from Z → A steps the next rotor.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-[10px] text-[#d1c4b7] italic pt-2 border-t border-[#3b3426]">
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

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, config }) => {
  const configStr = generateConfigString(config);

  const handleCopy = () => {
    navigator.clipboard.writeText(configStr);
    alert('Configuration string copied to clipboard!');
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Share Enigma Key Configuration" icon="share">
      <div className="space-y-4">
        <p>You can share your current Enigma machine rotor setup and starting positions with fellow cryptographers to allow them to decrypt your messages.</p>

        <div className="bg-[#120e04] p-3 rounded border border-[#3b3426] flex items-center justify-between font-monospaced-technical text-sm text-[#ebc238]">
          <span>{configStr}</span>
          <button
            onClick={handleCopy}
            className="px-2.5 py-1 bg-[#8b6f47] text-[#fffaf8] hover:bg-[#8b6f47]/90 rounded text-xs font-ui-header cursor-pointer flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-xs">content_copy</span>
            Copy Key
          </button>
        </div>
      </div>
    </BaseModal>
  );
};

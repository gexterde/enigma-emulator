import React from 'react';
import { EnigmaConfig } from '../types';
import { PlugboardPanel } from './PlugboardPanel';

interface PlugboardQuickModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: EnigmaConfig;
  onUpdateConfig: (newConfig: EnigmaConfig) => void;
  soundEnabled: boolean;
}

export const PlugboardQuickModal: React.FC<PlugboardQuickModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  soundEnabled
}) => {
  if (!isOpen) return null;

  const pairsCount = Object.keys(config.plugboard || {}).length / 2;

  const handleClearAll = () => {
    onUpdateConfig({ ...config, plugboard: {} });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-[#1a150c] border border-[#ebc238]/40 rounded-xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl texture-metal text-[#d1c4b7] relative my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#3b3426]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#ebc238] text-xl">settings_ethernet</span>
            <div>
              <h2 className="font-rotor-label text-[#ebc238] text-base sm:text-lg font-bold leading-tight flex items-center gap-2">
                Plugboard (Steckerbrett) Quick Settings
                <span className="text-[10px] font-monospaced-technical bg-[#ebc238]/20 text-[#ebc238] px-2 py-0.5 rounded border border-[#ebc238]/40">
                  {pairsCount} / 13 Pairs
                </span>
              </h2>
              <p className="text-[11px] text-[#9e8d78]">Connect or disconnect socket pairs directly on the Enigma front panel</p>
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

        {/* Plugboard Interactive Panel */}
        <div className="bg-[#201b0f] border border-[#4e453b] rounded-lg p-3 sm:p-4 shadow-panel texture-metal mb-4">
          <PlugboardPanel
            config={config}
            onUpdateConfig={onUpdateConfig}
            soundEnabled={soundEnabled}
            showTitle={false}
          />
        </div>

        {/* Footer Controls */}
        <div className="flex items-center justify-between pt-3 border-t border-[#3b3426]">
          <button
            type="button"
            onClick={handleClearAll}
            disabled={pairsCount === 0}
            className="px-3 py-1.5 text-xs text-[#ff8a80] hover:text-[#ff5252] bg-[#201b0f] hover:bg-[#2c1a1a] rounded border border-[#3b3426] disabled:opacity-40 cursor-pointer transition-colors"
          >
            Clear All Plugs
          </button>
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

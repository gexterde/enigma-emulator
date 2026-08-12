import React, { useState, useEffect, useRef, useCallback, useMemo, useContext } from 'react';
import { useTheme, getTheme } from '../lib/theme';
//import React from 'react';
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
  const { theme } = useTheme();
  const t = getTheme(theme);
  if (!isOpen) return null;

  const pairsCount = Object.keys(config.plugboard || {}).length / 2;

  const handleClearAll = () => {
    onUpdateConfig({ ...config, plugboard: {} });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div className={`${t.modalBg} border ${t.borderAccent}/40 rounded-xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl ${t.textureMetal} ${t.textMuted} relative my-auto`}>
        {/* Header */}
        <div className={`flex items-center justify-between pb-3 mb-4 border-b ${t.borderBase}`}>
          <div className="flex items-center gap-2">
            <span className={`material-symbols-outlined ${t.textAccent} text-xl`}>settings_ethernet</span>
            <div>
              <h2 className={`${t.fontRotor} ${t.textAccent} text-base sm:text-lg font-bold leading-tight flex items-center gap-2`}>
                Plugboard (Steckerbrett) Quick Settings
                <span className={`text-[10px] ${t.fontMono} ${t.panelInner}/60 ${t.textAccent} px-2 py-0.5 rounded border ${t.borderAccent}/40`}>
                  {pairsCount} / 13 Pairs
                </span>
              </h2>
              <p className={`text-[11px] ${t.textSecondary}`}>Connect or disconnect socket pairs directly on the Enigma front panel</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`w-8 h-8 flex items-center justify-center ${t.textMuted} hover:${t.textAccent} ${t.panelInner}/60 rounded-full border ${t.borderBase} transition-colors cursor-pointer`}
            title="Close"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        {/* Plugboard Interactive Panel */}
        <div className={`${t.panelBg} border ${t.borderBase} rounded-lg p-3 sm:p-4 shadow-panel ${t.textureMetal} mb-4`}>
          <PlugboardPanel
            config={config}
            onUpdateConfig={onUpdateConfig}
            soundEnabled={soundEnabled}
            showTitle={false}
          />
        </div>

        {/* Footer Controls */}
        <div className={`flex items-center justify-between pt-3 border-t ${t.borderBase}`}>
          <button
            type="button"
            onClick={handleClearAll}
            disabled={pairsCount === 0}
            className={`px-3 py-1.5 text-xs text-[#ff8a80] hover:text-[#ff5252] ${t.buttonMuted} rounded border ${t.borderBase} disabled:opacity-40 cursor-pointer transition-colors`}
          >
            Clear All Plugs
          </button>
          <button
            type="button"
            onClick={onClose}
            className={`px-5 py-1.5 text-xs font-bold cursor-pointer transition-colors shadow-md rounded ${t.buttonHighlight}`}
          >
            Done & Close
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { useTheme, getTheme } from '../lib/theme';
import { EnigmaConfig } from '../types';
import { PlugboardPanel } from './PlugboardPanel';

interface PlugboardViewProps {
  config: EnigmaConfig;
  onUpdateConfig: (newConfig: EnigmaConfig) => void;
  soundEnabled: boolean;
}

export const PlugboardView: React.FC<PlugboardViewProps> = ({
  config,
  onUpdateConfig,
  soundEnabled
}) => {
  const { theme } = useTheme();
  const t = getTheme(theme);
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className={`border-b ${t.borderBase} pb-4`}>
        <h1 className={`${t.fontRotor} text-xl md:text-2xl`}>
          Plugboard (Steckerbrett)
        </h1>
        <p className={`${t.textMuted} text-xs ${t.fontBody} mt-1`}>
          Swap letter pairs prior to entering the scrambler rotors. Click any socket, then click a second socket to insert a cable plug (Max 10 pairs).
        </p>
      </div>

      {/* Main Plugboard Socket Panel */}
      <div className={`${t.lampboardPanelBg} rounded-lg p-4 md:p-6`}>
        <PlugboardPanel
          config={config}
          onUpdateConfig={onUpdateConfig}
          soundEnabled={soundEnabled}
        />
      </div>
    </div>
  );
};

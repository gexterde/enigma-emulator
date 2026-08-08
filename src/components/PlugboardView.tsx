import React from 'react';
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
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-[#3b3426] pb-4">
        <h1 className="text-rotor-label font-rotor-label text-[#ebc238] text-xl md:text-2xl">
          Plugboard (Steckerbrett)
        </h1>
        <p className="text-[#d1c4b7] text-xs font-ui-body mt-1">
          Swap letter pairs prior to entering the scrambler rotors. Click any socket, then click a second socket to insert a cable plug (Max 10 pairs).
        </p>
      </div>

      {/* Main Plugboard Socket Panel */}
      <div className="bg-[#201b0f] border border-[#4e453b] rounded-lg p-4 md:p-6 shadow-panel texture-metal">
        <PlugboardPanel
          config={config}
          onUpdateConfig={onUpdateConfig}
          soundEnabled={soundEnabled}
        />
      </div>
    </div>
  );
};

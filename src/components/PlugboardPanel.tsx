import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { EnigmaConfig } from '../types';
import { playPlugConnectSound } from '../lib/audio';

interface PlugboardPanelProps {
  config: EnigmaConfig;
  onUpdateConfig: (newConfig: EnigmaConfig) => void;
  soundEnabled: boolean;
  showTitle?: boolean;
}

export const CORD_COLORS = [
  '#b33939', // Crimson Red
  '#218c74', // Teal Green
  '#227093', // Deep Blue
  '#cc8e35', // Ochre Amber
  '#40407a', // Indigo Purple
  '#ff5252', // Bright Red
  '#33d9b2', // Mint
  '#34ace0', // Sky Blue
  '#ffb142', // Gold
  '#706fd3', // Lavender
  '#ff793f', // Coral Orange
  '#84817a', // Slate
  '#d1ccc0'  // Off-white
];

const ROW1 = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'];
const ROW2 = ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

export const PlugboardPanel: React.FC<PlugboardPanelProps> = ({
  config,
  onUpdateConfig,
  soundEnabled,
  showTitle = true
}) => {
  const [selectedSocket, setSelectedSocket] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const socketRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [cablePaths, setCablePaths] = useState<Array<{ a: string; b: string; path: string; color: string }>>([]);

  const plugboard = config.plugboard || {};

  const plugboardKey = JSON.stringify(plugboard);

  // Extract pair list (unique and memoized stably)
  const pairs = useMemo(() => {
    const res: Array<[string, string]> = [];
    const visited = new Set<string>();

    for (const [k, val] of Object.entries(plugboard)) {
      const v = val as string;
      if (!visited.has(k) && !visited.has(v)) {
        visited.add(k);
        visited.add(v);
        res.push([k, v]);
      }
    }
    return res;
  }, [plugboardKey]);

  const handleSocketClick = (char: string) => {
    playPlugConnectSound(soundEnabled);

    // If letter is already plugged, unplug it!
    if (plugboard[char]) {
      const partner = plugboard[char];
      const newPb = { ...plugboard };
      delete newPb[char];
      delete newPb[partner];
      onUpdateConfig({ ...config, plugboard: newPb });
      setSelectedSocket(null);
      return;
    }

    // If no socket selected, set selected
    if (!selectedSocket) {
      setSelectedSocket(char);
      return;
    }

    // If user clicked the same socket, deselect
    if (selectedSocket === char) {
      setSelectedSocket(null);
      return;
    }

    // Enforce 13 pairs maximum rule
    if (pairs.length >= 13) {
      alert('Maximum 13 plugboard pairs allowed for Enigma.');
      setSelectedSocket(null);
      return;
    }

    // Connect selectedSocket and char
    const newPb = {
      ...plugboard,
      [selectedSocket]: char,
      [char]: selectedSocket
    };

    onUpdateConfig({ ...config, plugboard: newPb });
    setSelectedSocket(null);
  };

  const handleClearAll = () => {
    playPlugConnectSound(soundEnabled);
    onUpdateConfig({ ...config, plugboard: {} });
    setSelectedSocket(null);
  };

  const handlePresetStandard = () => {
    playPlugConnectSound(soundEnabled);
    const preset: Record<string, string> = {
      'A': 'N', 'N': 'A',
      'C': 'Q', 'Q': 'C',
      'D': 'P', 'P': 'D',
      'H': 'T', 'T': 'H',
      'R': 'W', 'W': 'R'
    };
    onUpdateConfig({ ...config, plugboard: preset });
    setSelectedSocket(null);
  };

  // Recalculate SVG curved cable paths for all connected pairs
  const updateCables = useCallback(() => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const newPaths: Array<{ a: string; b: string; path: string; color: string }> = [];

    pairs.forEach(([a, b], idx) => {
      const elA = socketRefs.current[a];
      const elB = socketRefs.current[b];
      if (!elA || !elB) return;

      const rectA = elA.getBoundingClientRect();
      const rectB = elB.getBoundingClientRect();

      const startX = rectA.left + rectA.width / 2 - containerRect.left;
      const startY = rectA.top + rectA.height / 2 - containerRect.top;
      const endX = rectB.left + rectB.width / 2 - containerRect.left;
      const endY = rectB.top + rectB.height / 2 - containerRect.top;

      const dx = endX - startX;
      const dy = endY - startY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Natural cable droop calculation
      const droop = Math.min(dist * 0.45 + 30, 140);
      const cp1X = startX;
      const cp1Y = startY + droop;
      const cp2X = endX;
      const cp2Y = endY + droop;

      const d = `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;
      const color = CORD_COLORS[idx % CORD_COLORS.length];

      newPaths.push({ a, b, path: d, color });
    });

    setCablePaths(newPaths);
  }, [pairs]);

  useEffect(() => {
    updateCables();
    window.addEventListener('resize', updateCables);
    const timeout = setTimeout(updateCables, 50);
    return () => {
      window.removeEventListener('resize', updateCables);
      clearTimeout(timeout);
    };
  }, [updateCables]);

  const renderSocketGroup = (letters: string[]) => (
    <div className="flex justify-between sm:justify-around px-1 sm:px-4 gap-1 sm:gap-2">
      {letters.map((char) => {
        const isConnected = !!plugboard[char];
        const isSelected = selectedSocket === char;
        const partner = plugboard[char];
        const pairIndex = pairs.findIndex(([a, b]) => a === char || b === char);
        const color = pairIndex !== -1 ? CORD_COLORS[pairIndex % CORD_COLORS.length] : undefined;

        return (
          <div key={char} className="flex flex-col items-center gap-1 sm:gap-2 z-20">
            <span className="text-[#f6dfc7] font-lamp-char font-bold text-xs sm:text-base drop-shadow-md">
              {char}
            </span>
            <button
              type="button"
              ref={(el) => { socketRefs.current[char] = el; }}
              onClick={() => handleSocketClick(char)}
              className={`bg-[#1a1510] border-2 rounded-full p-1 cursor-pointer flex flex-col gap-1 items-center justify-center transition-all min-w-[34px] min-h-[50px] sm:min-w-[44px] sm:min-h-[58px] ${
                isSelected
                  ? 'border-[#ebc238] shadow-[0_0_12px_#ebc238] scale-110'
                  : isConnected
                  ? 'border-[#4e453b] shadow-md'
                  : 'border-[#2a221a] hover:border-[#9a8f83]'
              }`}
              style={{
                borderColor: isSelected ? '#ebc238' : color || undefined
              }}
              aria-label={`Socket ${char}`}
              title={partner ? `Plugged to ${partner}` : 'Click to connect'}
            >
              {/* Double pin holes (stecker sockets) */}
              <div
                className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#111] border border-[#000] shadow-[inset_0_2px_4px_rgba(0,0,0,0.9)]"
                style={{ backgroundColor: isConnected ? color : '#111' }}
              />
              <div
                className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#111] border border-[#000] shadow-[inset_0_2px_4px_rgba(0,0,0,0.9)]"
                style={{ backgroundColor: isConnected ? color : '#111' }}
              />
            </button>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Plugboard Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2 border-b border-[#3b3426]">
        {showTitle ? (
          <span className="text-ui-header font-ui-header text-[#ede1cd] text-xs uppercase tracking-widest flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-[#ebc238]">settings_ethernet</span>
            Plugboard Socket Board (Steckerbrett)
          </span>
        ) : (
          <span className="text-monospaced-technical text-xs text-[#ebc238]">
            Connected Pairs: {pairs.length} / 13
          </span>
        )}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={handlePresetStandard}
            className="text-[11px] font-ui-header bg-[#3b3426] hover:bg-[#4e453b] text-[#e3c193] border border-[#8b6f47] px-2.5 py-1 rounded transition-colors cursor-pointer"
          >
            Sample Patch Wiring
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            className="text-[11px] font-ui-header bg-[#93000a]/30 hover:bg-[#93000a] text-[#ffdad6] border border-red-800/40 px-2.5 py-1 rounded transition-colors cursor-pointer"
          >
            Clear ({pairs.length}/13)
          </button>
        </div>
      </div>

      {/* Physical Wooden Steckerbrett Housing with SVG Patch Cables */}
      <div className="w-full overflow-x-auto pb-2 rounded-xl focus:outline-none">
        <div className="sm:hidden text-center text-[10px] font-monospaced-technical text-[#ebc238] flex items-center justify-center gap-1 mb-1.5 opacity-90">
          <span className="material-symbols-outlined text-xs">swap_horiz</span>
          Scroll horizontally to view all plugboard sockets (A–Z)
        </div>
        <div
          ref={containerRef}
          className="relative bg-[#3b2a1a] rounded-xl p-3 sm:p-6 border-[6px] border-[#2f291c] shadow-[inset_0_0_40px_rgba(0,0,0,0.8),0_10px_30px_rgba(0,0,0,0.8)] min-w-[620px]"
        >
          {/* SVG Cable Overlay Canvas */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
            <defs>
              <filter id="cableShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="8" stdDeviation="4" floodColor="#000000" floodOpacity="0.7" />
              </filter>
            </defs>
            {cablePaths.map(({ a, b, path, color }) => (
              <g key={`${a}-${b}`}>
                {/* Outer Shadow Cable */}
                <path
                  d={path}
                  fill="none"
                  stroke="#000000"
                  strokeWidth="10"
                  strokeLinecap="round"
                  opacity="0.4"
                  transform="translate(0, 4)"
                />
                {/* Cable Outer / Base */}
                <path
                  d={path}
                  fill="none"
                  stroke="#1a1510"
                  strokeWidth="7"
                  strokeLinecap="round"
                />
                {/* Colored Cable Wire (Twin / Dual Strand Effect) */}
                <path
                  d={path}
                  fill="none"
                  stroke={color}
                  strokeWidth="4"
                  strokeLinecap="round"
                  filter="url(#cableShadow)"
                />
                {/* Center Highlight */}
                <path
                  d={path}
                  fill="none"
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </g>
            ))}
          </svg>

          {/* 2-Row Socket Layout */}
          <div className="flex flex-col gap-6 sm:gap-10 py-2 sm:py-4">
            {renderSocketGroup(ROW1)}
            {renderSocketGroup(ROW2)}
          </div>
        </div>
      </div>

      {/* Active Plug Cables Summary */}
      {pairs.length > 0 && (
        <div className="bg-[#120e04] border border-[#3b3426] rounded p-3">
          <span className="text-[10px] font-monospaced-technical text-[#d1c4b7] uppercase block mb-2">
            Active Cable Connections ({pairs.length}):
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {pairs.map(([a, b], idx) => {
              const cordColor = CORD_COLORS[idx % CORD_COLORS.length];
              return (
                <div
                  key={`${a}-${b}`}
                  className="bg-[#201b0f] border border-[#3b3426] px-2 py-1.5 rounded flex items-center justify-between"
                >
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full shadow-xs"
                      style={{ backgroundColor: cordColor }}
                    />
                    <span className="font-monospaced-technical text-xs text-[#ede1cd] font-bold">
                      {a} ↔ {b}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSocketClick(a)}
                    className="text-[#d1c4b7] hover:text-[#ffb4ab] text-xs p-0.5 cursor-pointer"
                    title="Remove plug"
                  >
                    <span className="material-symbols-outlined text-xs">close</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};


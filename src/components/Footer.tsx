import React from 'react';
import { useTheme, getTheme } from '../lib/theme';
import { Battery, BatteryWarning, Zap } from 'lucide-react';

interface FooterProps {
  onOpenInfo: () => void;
  batteryLevel: number;
  batteryMode: string;
  onRecharge: () => void;
  batteryDrainEnabled?: boolean;
  onToggleBatteryDrain?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenInfo,
  batteryLevel,
  batteryMode,
  onRecharge,
  batteryDrainEnabled = true,
  onToggleBatteryDrain,
}) => {
  const { theme } = useTheme();
  const t = getTheme(theme);

  // Determine battery color based on level
  let barColor = 'bg-emerald-500';
  if (batteryLevel < 20) {
    barColor = 'bg-red-500 animate-pulse';
  } else if (batteryLevel < 50) {
    barColor = 'bg-amber-500';
  }

  const isPowerOn = batteryMode !== 'aus';

  return (
    <footer className={`border-t ${t.borderBase} ${t.headerBg} flex flex-col lg:flex-row justify-between items-center px-4 md:px-8 py-3 w-full text-[10px] shrink-0 z-50 gap-3 lg:gap-0`}>
      <span className={`${t.textMuted} ${t.fontMono} text-center lg:text-left`}>
        © 1943 Bletchley Park Systems. For instructional use only.
      </span>

      {/* Simulated Battery Level Indicator & Recharge Control */}
      <div className={`flex items-center gap-3 px-3 py-1.5 rounded-lg border ${t.borderBase} ${t.panelInner} shadow-inner`}>
        <div className="flex items-center gap-1.5">
          {batteryLevel === 0 ? (
            <BatteryWarning className="w-4 h-4 text-red-500 animate-bounce" id="battery-icon-empty" />
          ) : isPowerOn ? (
            <Zap className="w-4 h-4 text-amber-400 animate-pulse" id="battery-icon-zap" />
          ) : (
            <Battery className="w-4 h-4 text-emerald-400" id="battery-icon-full" />
          )}
          <span className={`${t.fontMono} font-bold text-xs ${batteryLevel < 20 ? 'text-red-400 animate-pulse' : t.textPrimary}`}>
            {Math.round(batteryLevel)}%
          </span>
        </div>

        {/* Outer Battery Bar */}
        <div className="w-20 h-2.5 bg-zinc-800 rounded-sm overflow-hidden border border-zinc-700 p-[1px] flex items-center">
          <div
            className={`h-full ${barColor} rounded-xs transition-all duration-300`}
            style={{ width: `${batteryLevel}%` }}
          />
        </div>

        {/* Battery Description */}
        <span className={`${t.fontMono} text-[9px] ${t.textSecondary} hidden sm:inline`}>
          {batteryLevel === 0
            ? 'BATTERY DEAD'
            : !batteryDrainEnabled
            ? 'CONSTANT (DRAIN OFF)'
            : batteryMode === 'aus'
            ? 'STANDBY (NO DRAIN)'
            : `POWER SUPPLY (${batteryMode.toUpperCase()})`}
        </span>

        {/* Battery Level Drain Toggle Button */}
        {onToggleBatteryDrain && (
          <button
            onClick={onToggleBatteryDrain}
            className={`px-2 py-0.5 rounded text-[9px] ${t.fontMono} font-bold cursor-pointer transition-all ${
              batteryDrainEnabled
                ? `${t.activeBadge}`
                : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:text-zinc-200'
            }`}
            title="Switch battery level drain / change ON or OFF"
          >
            DRAIN: {batteryDrainEnabled ? 'ON' : 'OFF'}
          </button>
        )}

        {/* Recharge / Replace Button */}
        <button
          onClick={onRecharge}
          className={`px-2 py-0.5 rounded text-[9px] ${t.fontMono} font-bold cursor-pointer transition-all ${
            batteryLevel < 30
              ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse'
              : `${t.buttonHighlight}`
          }`}
          title="Recharge or replace the accumulator batteries"
        >
          {batteryLevel < 100 ? 'RECHARGE' : 'FULL'}
        </button>
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        <button
          onClick={onOpenInfo}
          className={`${t.textSecondary} hover:${t.textAccent} transition-opacity duration-200 ${t.fontMono} min-h-[44px] flex items-center cursor-pointer`}
        >
          Historical Accuracy
        </button>
        <button
          onClick={onOpenInfo}
          className={`${t.textSecondary} hover:${t.textAccent} transition-opacity duration-200 ${t.fontMono} min-h-[44px] flex items-center cursor-pointer`}
        >
          Manual
        </button>
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className={`${t.textSecondary} hover:${t.textAccent} transition-opacity duration-200 ${t.fontMono} min-h-[44px] flex items-center`}
        >
          Source Code
        </a>
      </div>
    </footer>
  );
};

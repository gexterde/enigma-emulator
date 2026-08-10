import React from 'react';

export type BatterySwitchMode = 'hell' | 'dkl' | 'aus' | 'sammler';

interface BatterySwitchProps {
  mode: BatterySwitchMode;
  onChangeMode: (mode: BatterySwitchMode) => void;
  compact?: boolean;
  onClose?: () => void;
}

export const BatterySwitch: React.FC<BatterySwitchProps> = ({ mode, onChangeMode, compact = false, onClose }) => {
  const getAngle = (m: BatterySwitchMode) => {
    switch (m) {
      case 'hell': return -54;
      case 'dkl': return -10;
      case 'aus': return 16;
      case 'sammler': return 50;
      default: return -54;
    }
  };

  const angle = getAngle(mode);

  const modes: { id: BatterySwitchMode; label: string }[] = [
    { id: 'hell', label: 'hell' },
    { id: 'dkl', label: 'dkl' },
    { id: 'aus', label: 'aus' },
    { id: 'sammler', label: 'Sammler 4V' }
  ];

  return (
    <div
      className={`relative flex flex-col items-center bg-[#100d07] rounded-xl border border-[#3b3426] shadow-2xl select-none w-full transition-all ${
        compact ? 'p-1.5 max-w-[145px]' : 'p-2 max-w-[160px]'
      }`}
    >
      <div className="w-full flex items-center justify-between gap-1 mb-1 border-b border-[#3b3426]/40 pb-1">
        <div className={`font-monospaced-technical text-[#a89983] uppercase tracking-wider font-bold flex items-center gap-1 ${compact ? 'text-[8px]' : 'text-[9px]'}`}>
          <span className="material-symbols-outlined text-xs text-[#ebc238]">bolt</span>
          BATTERIESCHALTER
        </div>
        {onClose && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="text-[8px] sm:text-[9px] font-ui-header text-[#d1c4b7] hover:text-[#ebc238] hover:border-[#ebc238]/40 flex items-center gap-0.5 cursor-pointer border border-[#3b3426] px-1 py-0.5 rounded bg-[#120e04] transition-colors shadow-sm"
            title="Close Battery Switch"
          >
            <span className="material-symbols-outlined text-[10px] sm:text-[12px] leading-none">close</span>
            <span>Close</span>
          </button>
        )}
      </div>

      <div className={`relative flex items-center justify-center bg-[#18130b] rounded-lg border border-[#2d2518] p-1 shadow-inner w-full ${compact ? 'h-20 my-0.5' : 'h-24 my-0.5'}`}>
        <svg viewBox="0 0 200 135" className="w-full h-full overflow-visible">
          <defs>
            {/* Wrinkled dark metallic panel texture gradient */}
            <radialGradient id="panelGrad" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="#211b12" />
              <stop offset="100%" stopColor="#0d0a06" />
            </radialGradient>

            {/* Brass finish gradient */}
            <linearGradient id="brassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f7ea9b" />
              <stop offset="40%" stopColor="#d8b240" />
              <stop offset="80%" stopColor="#8f6f1c" />
              <stop offset="100%" stopColor="#57420e" />
            </linearGradient>

            {/* Bakelite knob gradient */}
            <radialGradient id="bakeliteBody" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#4a2d1d" />
              <stop offset="40%" stopColor="#28170e" />
              <stop offset="85%" stopColor="#140b06" />
              <stop offset="100%" stopColor="#090402" />
            </radialGradient>

            {/* Arc plate filter shadow */}
            <filter id="plateShadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.8" />
            </filter>
          </defs>

          {/* Background Textured Plate */}
          <rect x="0" y="0" width="200" height="135" rx="6" fill="url(#panelGrad)" />

          {/* Center Axle Screwhole */}
          <circle cx="100" cy="92" r="6" fill="#080503" stroke="#2d2215" strokeWidth="1.2" />

          {/* Pure White Porcelain / Enamel Arc Scale Plate */}
          <path
            d="M 32,92 A 68,68 0 0,1 168,92"
            fill="none"
            stroke="#120e09"
            strokeWidth="28"
            strokeLinecap="round"
            filter="url(#plateShadow)"
          />
          <path
            d="M 32,92 A 68,68 0 0,1 168,92"
            fill="none"
            stroke="#ffffff"
            strokeWidth="25"
            strokeLinecap="round"
          />

          {/* Screws on Porcelain Arc Ends */}
          <g transform="translate(32, 92)">
            <circle cx="0" cy="0" r="3.2" fill="url(#brassGrad)" stroke="#1a1106" strokeWidth="0.6" />
            <line x1="-2" y1="-0.8" x2="2" y2="0.8" stroke="#0a0602" strokeWidth="0.8" />
          </g>
          <g transform="translate(168, 92)">
            <circle cx="0" cy="0" r="3.2" fill="url(#brassGrad)" stroke="#1a1106" strokeWidth="0.6" />
            <line x1="-2" y1="0.8" x2="2" y2="-0.8" stroke="#0a0602" strokeWidth="0.8" />
          </g>

          {/* HIGH-CONTRAST BLACK GERMAN LABELS DIRECTLY ON WHITE ENAMEL ARC */}
          {/* Label: hell (-54 deg) */}
          <g transform="translate(100, 92) rotate(-54)">
            <text x="0" y="-68" fontSize="9.5" fontWeight="900" fill="#000000" textAnchor="middle" fontFamily="Georgia, 'Times New Roman', serif">
              hell
            </text>
            <line x1="0" y1="-62" x2="0" y2="-57" stroke="#000000" strokeWidth="1.8" strokeLinecap="round" />
          </g>

          {/* Label: Batterie (-32 deg) */}
          <g transform="translate(100, 92) rotate(-32)">
            <text x="0" y="-68" fontSize="8" fontWeight="800" fill="#000000" textAnchor="middle" fontFamily="Georgia, 'Times New Roman', serif">
              Batterie
            </text>
          </g>

          {/* Label: dkl (-10 deg) */}
          <g transform="translate(100, 92) rotate(-10)">
            <text x="0" y="-68" fontSize="9.5" fontWeight="900" fill="#000000" textAnchor="middle" fontFamily="Georgia, 'Times New Roman', serif">
              dkl
            </text>
            <line x1="0" y1="-62" x2="0" y2="-57" stroke="#000000" strokeWidth="1.8" strokeLinecap="round" />
          </g>

          {/* Label: aus (16 deg) */}
          <g transform="translate(100, 92) rotate(16)">
            <text x="0" y="-68" fontSize="9.5" fontWeight="900" fill="#000000" textAnchor="middle" fontFamily="Georgia, 'Times New Roman', serif">
              aus
            </text>
            <line x1="0" y1="-62" x2="0" y2="-57" stroke="#000000" strokeWidth="1.8" strokeLinecap="round" />
          </g>

          {/* Label: Sammler 4V (50 deg) */}
          <g transform="translate(100, 92) rotate(50)">
            <text x="0" y="-68" fontSize="8" fontWeight="900" fill="#000000" textAnchor="middle" fontFamily="Georgia, 'Times New Roman', serif">
              Sammler 4V
            </text>
            <line x1="0" y1="-62" x2="0" y2="-57" stroke="#000000" strokeWidth="1.8" strokeLinecap="round" />
          </g>

          {/* Brass Binding Posts (4V Accumulator terminals on far right) */}
          <g transform="translate(182, 38)">
            <circle cx="0" cy="0" r="5.5" fill="url(#brassGrad)" stroke="#38290a" strokeWidth="0.8" />
            <circle cx="0" cy="0" r="2" fill="#fce484" />
            <line x1="-2.8" y1="0" x2="2.8" y2="0" stroke="#261b05" strokeWidth="0.8" />
          </g>
          <g transform="translate(182, 62)">
            <circle cx="0" cy="0" r="5.5" fill="url(#brassGrad)" stroke="#38290a" strokeWidth="0.8" />
            <circle cx="0" cy="0" r="2" fill="#fce484" />
            <line x1="-2.8" y1="0" x2="2.8" y2="0" stroke="#261b05" strokeWidth="0.8" />
          </g>

          {/* ROTATING BAKELITE KNOB WITH DOUBLE-ENDED BRASS ARROW */}
          <g
            transform={`translate(100, 92) rotate(${angle})`}
            className="transition-transform duration-300 ease-out cursor-pointer"
            onClick={() => {
              const order: BatterySwitchMode[] = ['hell', 'dkl', 'aus', 'sammler'];
              const idx = order.indexOf(mode);
              onChangeMode(order[(idx + 1) % order.length]);
            }}
          >
            {/* Knob Base Outer Circle */}
            <circle cx="0" cy="0" r="32" fill="#0a0604" stroke="#281a10" strokeWidth="1.2" />
            <circle cx="0" cy="0" r="29" fill="url(#bakeliteBody)" stroke="#110a06" strokeWidth="0.8" />

            {/* Raised Teardrop Bakelite Handle Bar */}
            <path
              d="M -10,-38 C -10,-44 10,-44 10,-38 L 12,38 C 12,44 -12,44 -12,38 Z"
              fill="url(#bakeliteBody)"
              stroke="#050302"
              strokeWidth="1"
              filter="url(#plateShadow)"
            />

            {/* Inner Handle Grip Ridge */}
            <path
              d="M -7,-34 L 7,-34 L 8,34 L -8,34 Z"
              fill="#211209"
              stroke="#382012"
              strokeWidth="0.6"
            />

            {/* Center Brass Hub Screw */}
            <circle cx="0" cy="0" r="5" fill="url(#brassGrad)" stroke="#2d1f07" strokeWidth="0.8" />
            <circle cx="0" cy="0" r="1.8" fill="#120c04" />

            {/* DOUBLE-ENDED BRASS ARROW INDICATOR */}
            <g transform="translate(0, 0)">
              {/* Top Arrow Pointer (Points directly to white arc scale label) */}
              <path d="M 0,-28 L -5,-19 L -2,-19 L -2,-5 L 2,-5 L 2,-19 L 5,-19 Z" fill="url(#brassGrad)" stroke="#3d2c08" strokeWidth="0.5" />
              {/* Bottom Arrow Pointer */}
              <path d="M 0,28 L -5,19 L -2,19 L -2,5 L 2,5 L 2,19 L 5,19 Z" fill="url(#brassGrad)" stroke="#3d2c08" strokeWidth="0.5" />
            </g>
          </g>
        </svg>
      </div>

      {/* Quick Select Mode Buttons */}
      <div className={`flex items-center gap-1 w-full justify-center ${compact ? 'mt-0.5 text-[8px]' : 'mt-1 text-[9px]'} font-monospaced-technical`}>
        {modes.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => onChangeMode(m.id)}
            className={`rounded transition-all cursor-pointer font-bold ${compact ? 'px-1 py-0.2' : 'px-1.5 py-0.5'} ${
              mode === m.id
                ? m.id === 'aus'
                  ? 'bg-[#ff3b30] text-white shadow-md'
                  : 'bg-[#ebc238] text-[#25190b] shadow-md ring-1 ring-[#fff5d6]'
                : 'bg-[#1b160b] text-[#9e8d78] hover:text-[#e2d7c5] border border-[#2b2416]'
            }`}
            title={`Set Power Switch to ${m.label}`}
          >
            {m.label}
          </button>
        ))}
      </div>
    </div>
  );
};

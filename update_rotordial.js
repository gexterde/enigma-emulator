import fs from 'fs';

let content = fs.readFileSync('src/components/RotorDial.tsx', 'utf8');

if (!content.includes('useTheme')) {
  content = content.replace("import React from 'react';", "import React from 'react';\nimport { useTheme, getTheme } from '../lib/theme';");
}

content = content.replace(
  "export const RotorDial: React.FC<RotorDialProps> = ({",
  "export const RotorDial: React.FC<RotorDialProps> = ({\n  label,\n  typeDisplay,\n  currentPos,\n  ringFormat,\n  onStep,\n  onRandomize,\n  isNotch = false,\n  notchValue,\n  turnoverAction\n}) => {\n  const { theme } = useTheme();\n  const t = getTheme(theme);"
);

content = content.replace(
  "  label,\n  typeDisplay,\n  currentPos,\n  ringFormat,\n  onStep,\n  onRandomize,\n  isNotch = false,\n  notchValue,\n  turnoverAction\n}) => {\n  return (",
  "  return ("
);

content = content.replace(
  "className=\"bg-[#18130b] rounded-lg p-1.5 sm:p-2 border border-[#3b3426] flex flex-col items-center max-w-[76px] sm:max-w-[105px] w-full mx-auto shadow-sm\"",
  "className={`${t.panelInner} rounded-lg p-1.5 sm:p-2 border flex flex-col items-center max-w-[76px] sm:max-w-[105px] w-full mx-auto shadow-sm`}"
);

content = content.replace(
  "className=\"text-[7.5px] sm:text-[9px] text-[#d1c4b7] font-monospaced-technical mb-0.5 whitespace-nowrap\"",
  "className={`text-[7.5px] sm:text-[9px] ${t.textMuted} ${t.fontMono} mb-0.5 whitespace-nowrap`}"
);

content = content.replace(
  "className=\"relative bg-[#3b3426] border border-[#4e453b] rounded shadow-rotor-window w-9 sm:w-12 h-11 sm:h-13 flex items-center justify-center my-0.5 overflow-hidden\"",
  "className={`relative rounded w-9 sm:w-12 h-11 sm:h-13 flex items-center justify-center my-0.5 overflow-hidden ${theme === 'vintage' ? 'bg-[#3b3426] border-[#4e453b] border shadow-rotor-window' : 'bg-white border-slate-300 border shadow-inner'}`}"
);

content = content.replace(
  /className="absolute top-0 w-full h-1\/2 flex items-start justify-center text-\[#d1c4b7\] hover:text-\[#ebc238\] cursor-pointer"/g,
  "className={`absolute top-0 w-full h-1/2 flex items-start justify-center ${theme === 'vintage' ? 'text-[#d1c4b7] hover:text-[#ebc238]' : 'text-slate-400 hover:text-blue-500'} cursor-pointer`}"
);

content = content.replace(
  /className="absolute bottom-0 w-full h-1\/2 flex items-end justify-center text-\[#d1c4b7\] hover:text-\[#ebc238\] cursor-pointer"/g,
  "className={`absolute bottom-0 w-full h-1/2 flex items-end justify-center ${theme === 'vintage' ? 'text-[#d1c4b7] hover:text-[#ebc238]' : 'text-slate-400 hover:text-blue-500'} cursor-pointer`}"
);

content = content.replace(
  "className=\"text-rotor-label font-rotor-label text-[#ebc238] text-base sm:text-xl font-bold select-none animate-rotor-step\"",
  "className={`${t.fontRotor} text-base sm:text-xl select-none animate-rotor-step`}"
);

content = content.replace(
  "className=\"text-[7px] sm:text-[8px] font-monospaced-technical text-[#ebc238]/80 whitespace-nowrap\"",
  "className={`text-[7px] sm:text-[8px] ${t.fontMono} ${theme === 'vintage' ? 'text-[#ebc238]/80' : 'text-slate-500'} whitespace-nowrap`}"
);

content = content.replace(
  "className=\"mt-1 px-1 sm:px-1.5 py-0.5 text-[7px] sm:text-[8px] font-monospaced-technical text-[#ebc238] bg-[#120e04] hover:bg-[#ebc238] hover:text-[#25190b] border border-[#3b3426] rounded transition-colors cursor-pointer flex items-center justify-center gap-0.5 shadow-xs w-full max-w-[56px] sm:max-w-none\"",
  "className={`mt-1 px-1 sm:px-1.5 py-0.5 text-[7px] sm:text-[8px] ${t.fontMono} ${theme === 'vintage' ? 'text-[#ebc238] bg-[#120e04] hover:bg-[#ebc238] hover:text-[#25190b] border-[#3b3426]' : 'text-slate-500 bg-white hover:bg-blue-50 hover:text-blue-600 border-slate-300'} border rounded transition-colors cursor-pointer flex items-center justify-center gap-0.5 shadow-xs w-full max-w-[56px] sm:max-w-none`}"
);

content = content.replace(
  "className=\"text-[7px] sm:text-[8px] text-[#83715d] font-monospaced-technical whitespace-nowrap\"",
  "className={`text-[7px] sm:text-[8px] ${t.textSecondary} ${t.fontMono} whitespace-nowrap`}"
);

content = content.replace(
  "className=\"mt-1 px-1 sm:px-1.5 py-0.5 text-[7px] sm:text-[8px] font-monospaced-technical text-[#ebc238] bg-[#120e04] hover:bg-[#ebc238] hover:text-[#25190b] border border-[#3b3426] rounded transition-colors cursor-pointer flex items-center justify-center gap-0.5 shadow-xs w-full max-w-[56px] sm:max-w-none\"",
  "className={`mt-1 px-1 sm:px-1.5 py-0.5 text-[7px] sm:text-[8px] ${t.fontMono} ${theme === 'vintage' ? 'text-[#ebc238] bg-[#120e04] hover:bg-[#ebc238] hover:text-[#25190b] border-[#3b3426]' : 'text-slate-500 bg-white hover:bg-blue-50 hover:text-blue-600 border-slate-300'} border rounded transition-colors cursor-pointer flex items-center justify-center gap-0.5 shadow-xs w-full max-w-[56px] sm:max-w-none`}"
);

fs.writeFileSync('src/components/RotorDial.tsx', content);

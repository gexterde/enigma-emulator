import fs from 'fs';

let content = fs.readFileSync('src/components/RotorSettingsView.tsx', 'utf8');

if (!content.includes('useTheme')) {
  content = content.replace("import React, { useState, useEffect } from 'react';", "import React, { useState, useEffect } from 'react';\nimport { useTheme, getTheme } from '../lib/theme';");
}

content = content.replace(
  "export const RotorSettingsView: React.FC<RotorSettingsViewProps> = ({ config, onUpdateConfig }) => {",
  "export const RotorSettingsView: React.FC<RotorSettingsViewProps> = ({ config, onUpdateConfig }) => {\n  const { theme } = useTheme();\n  const t = getTheme(theme);"
);

content = content.replace(
  "className=\"border-b border-[#3b3426] pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4\"",
  "className={`border-b ${t.borderBase} pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4`}"
);

content = content.replace(
  "className=\"text-rotor-label font-rotor-label text-[#ebc238] text-xl md:text-2xl\"",
  "className={`${t.fontRotor} text-xl md:text-2xl`}"
);

content = content.replace(
  "className=\"text-[#d1c4b7] text-xs font-ui-body mt-1 max-w-xl\"",
  "className={`${t.textMuted} text-xs ${t.fontBody} mt-1 max-w-xl`}"
);

content = content.replace(
  /className="p-1\.5 text-\[#d1c4b7\] hover:text-\[#ebc238\] transition-colors cursor-pointer flex items-center justify-center rounded bg-\[#120e04\] border border-\[#3b3426\] shadow-xs"/g,
  "className={`p-1.5 transition-colors cursor-pointer flex items-center justify-center rounded shadow-xs ${theme === 'vintage' ? 'text-[#d1c4b7] hover:text-[#ebc238] bg-[#120e04] border border-[#3b3426]' : 'text-slate-600 hover:text-blue-600 bg-white border border-slate-300'}`}"
);

content = content.replace(
  /className="bg-\[#201b0f\] rounded-lg p-4 md:p-5 border border-\[#4e453b\] shadow-panel texture-metal relative overflow-hidden group"/g,
  "className={`${t.lampboardPanelBg} rounded-lg p-4 md:p-5 relative overflow-hidden group`}"
);

content = content.replace(
  /className="text-ui-header font-ui-header text-\[#ede1cd\] border-b border-\[#3b3426\] pb-2 mb-4 flex justify-between items-center"/g,
  "className={`${t.fontHeader} ${t.textPrimary} border-b ${t.borderBase} pb-2 mb-4 flex justify-between items-center`}"
);

content = content.replace(
  /className="block text-monospaced-technical font-monospaced-technical text-\[#d1c4b7\]"/g,
  "className={`block ${t.fontMono} ${t.textMuted}`}"
);

content = content.replace(
  /className="w-full bg-\[#0a0806\] border border-\[#3b3426\] rounded p-2 text-\[#ebc238\] text-sm font-ui-body focus:outline-none focus:border-\[#8b6f47\] shadow-inner"/g,
  "className={`w-full rounded p-2 text-sm ${t.fontBody} focus:outline-none ${t.inputBg}`}"
);

content = content.replace(
  /className="relative bg-\[#3b3426\] border border-\[#3b3426\] rounded shadow-rotor-window h-14 min-h-\[48px\] flex items-center justify-center overflow-hidden"/g,
  "className={`relative rounded h-14 min-h-[48px] flex items-center justify-center overflow-hidden ${theme === 'vintage' ? 'bg-[#3b3426] border-[#3b3426] shadow-rotor-window' : 'bg-slate-100 border-slate-300 border shadow-inner'}`}"
);

content = content.replace(
  /className="absolute top-0 w-full h-1\/2 flex items-start justify-center text-\[#d1c4b7\] hover:text-\[#ebc238\] transition-colors"/g,
  "className={`absolute top-0 w-full h-1/2 flex items-start justify-center ${theme === 'vintage' ? 'text-[#d1c4b7] hover:text-[#ebc238]' : 'text-slate-400 hover:text-blue-500'} transition-colors`}"
);

content = content.replace(
  /className="absolute bottom-0 w-full h-1\/2 flex items-end justify-center text-\[#d1c4b7\] hover:text-\[#ebc238\] transition-colors"/g,
  "className={`absolute bottom-0 w-full h-1/2 flex items-end justify-center ${theme === 'vintage' ? 'text-[#d1c4b7] hover:text-[#ebc238]' : 'text-slate-400 hover:text-blue-500'} transition-colors`}"
);

content = content.replace(
  /className="text-rotor-label font-rotor-label text-\[#e3c193\] z-10 pointer-events-none"/g,
  "className={`${t.fontRotor} z-10 pointer-events-none`}"
);

content = content.replace(
  /className="text-ui-header font-ui-header text-\[#ede1cd\]"/g,
  "className={`${t.fontHeader} ${t.textPrimary}`}"
);

content = content.replace(
  /className="w-full sm:w-auto min-w-\[200px\] min-h-\[48px\] py-3 px-6 bg-\[#8b6f47\] text-\[#fffaf8\] rounded shadow-key-base hover:bg-\[#8b6f47\]\/90 active:shadow-key-pressed active:translate-y-1 transition-all font-ui-header font-bold text-base border border-\[#e3c193\]\/30 flex items-center justify-center gap-2 group cursor-pointer"/g,
  "className={`w-full sm:w-auto min-w-[200px] min-h-[48px] py-3 px-6 rounded transition-all ${t.fontHeader} font-bold text-base flex items-center justify-center gap-2 group cursor-pointer ${theme === 'vintage' ? 'bg-[#8b6f47] text-[#fffaf8] shadow-key-base hover:bg-[#8b6f47]/90 active:shadow-key-pressed active:translate-y-1 border border-[#e3c193]/30' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md active:translate-y-0.5'}`}"
);

content = content.replace(
  /className="text-xs text-\[#d1c4b7\]"/g,
  "className={`text-xs ${t.textMuted}`}"
);

content = content.replace(
  /className="bg-\[#201b0f\] rounded-lg p-4 md:p-5 border border-\[#4e453b\] shadow-panel texture-metal flex flex-col sm:flex-row items-center justify-between gap-4"/g,
  "className={`${t.lampboardPanelBg} rounded-lg p-4 md:p-5 flex flex-col sm:flex-row items-center justify-between gap-4`}"
);

content = content.replace(
  /className="p-1 text-\[#8c7e6a\] hover:text-\[#ebc238\] transition-colors cursor-pointer flex items-center justify-center rounded"/g,
  "className={`p-1 transition-colors cursor-pointer flex items-center justify-center rounded ${theme === 'vintage' ? 'text-[#8c7e6a] hover:text-[#ebc238]' : 'text-slate-400 hover:text-blue-500 hover:bg-slate-100'}`}"
);

content = content.replace(
  /className="p-1 text-\[#8c7e6a\] hover:text-\[#ebc238\] transition-colors cursor-pointer flex items-center justify-center rounded bg-\[#120e04\]\/40 border border-\[#3b3426\]"/g,
  "className={`p-1 transition-colors cursor-pointer flex items-center justify-center rounded ${theme === 'vintage' ? 'text-[#8c7e6a] hover:text-[#ebc238] bg-[#120e04]/40 border border-[#3b3426]' : 'text-slate-400 hover:text-blue-500 bg-white border border-slate-300'}`}"
);

content = content.replace(
  /className="text-monospaced-technical text-\[10px\] text-\[#d1c4b7\]"/g,
  "className={`${t.fontMono} text-[10px] ${t.textMuted}`}"
);

fs.writeFileSync('src/components/RotorSettingsView.tsx', content);

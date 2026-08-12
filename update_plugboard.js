import fs from 'fs';

let content = fs.readFileSync('src/components/PlugboardPanel.tsx', 'utf8');

// Add theme imports
if (!content.includes('useTheme')) {
  content = content.replace("import React, { useState, useEffect, useRef } from 'react';", "import React, { useState, useEffect, useRef } from 'react';\nimport { useTheme, getTheme } from '../lib/theme';");
}

// Update the component
content = content.replace(
  "const PlugboardSocket: React.FC<PlugboardSocketProps> = ({ char, isConnected, isSelected, partner, colorClassIndex, onClick, socketRef }) => {",
  "const PlugboardSocket: React.FC<PlugboardSocketProps> = ({ char, isConnected, isSelected, partner, colorClassIndex, onClick, socketRef }) => {\n  const { theme } = useTheme();\n  const t = getTheme(theme);"
);

content = content.replace(
  "className={`w-10 h-10 xs:w-11 xs:h-11 sm:w-14 sm:h-14 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all ${",
  "className={`${theme === 'vintage' ? 'rounded-full' : 'rounded-md'} w-10 h-10 xs:w-11 xs:h-11 sm:w-14 sm:h-14 border-2 flex items-center justify-center cursor-pointer transition-all ${"
);

content = content.replace(
  "isSelected ? 'border-[#ebc238] bg-[#ebc238]/20 shadow-[0_0_15px_rgba(235,194,56,0.4)] scale-110' :",
  "isSelected ? (theme === 'vintage' ? 'border-[#ebc238] bg-[#ebc238]/20 shadow-[0_0_15px_rgba(235,194,56,0.4)] scale-110' : 'border-blue-500 bg-blue-100 shadow-[0_0_10px_rgba(59,130,246,0.5)] scale-110') :"
);

content = content.replace(
  "isConnected ? `border-[#e3c193] bg-[#2a241a] cable-border-${colorClassIndex}` :",
  "isConnected ? (theme === 'vintage' ? `border-[#e3c193] bg-[#2a241a] cable-border-${colorClassIndex}` : `border-slate-400 bg-slate-100 cable-border-${colorClassIndex}`) :"
);

content = content.replace(
  "'border-[#4e453b] bg-[#1a130b] hover:border-[#8b6f47] hover:bg-[#201b0f]'",
  "theme === 'vintage' ? 'border-[#4e453b] bg-[#1a130b] hover:border-[#8b6f47] hover:bg-[#201b0f]' : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50'"
);

content = content.replace(
  "<span className=\"text-xs sm:text-sm font-rotor-label font-bold text-[#ede1cd]\">",
  "<span className={`text-xs sm:text-sm ${theme === 'vintage' ? 'font-rotor-label text-[#ede1cd]' : 'font-mono text-slate-800'} font-bold`}>"
);

content = content.replace(
  "export const PlugboardPanel: React.FC<PlugboardPanelProps> = ({ plugboard, setPlugboard, showTitle = true }) => {",
  "export const PlugboardPanel: React.FC<PlugboardPanelProps> = ({ plugboard, setPlugboard, showTitle = true }) => {\n  const { theme } = useTheme();\n  const t = getTheme(theme);"
);

content = content.replace(
  "className=\"flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2 border-b border-[#3b3426]\"",
  "className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2 border-b ${t.borderBase}`}"
);

content = content.replace(
  "<span className=\"text-ui-header font-ui-header text-[#ede1cd] text-xs uppercase tracking-widest flex items-center gap-2\">",
  "<span className={`${t.fontHeader} ${t.textPrimary} text-xs uppercase tracking-widest flex items-center gap-2`}>"
);

content = content.replace(
  "<span className=\"material-symbols-outlined text-sm text-[#ebc238]\">settings_ethernet</span>",
  "<span className={`material-symbols-outlined text-sm ${t.textAccent}`}>settings_ethernet</span>"
);

content = content.replace(
  "<span className=\"text-monospaced-technical text-xs text-[#ebc238]\">",
  "<span className={`${t.fontMono} text-xs ${t.textAccent}`}>"
);

content = content.replace(
  "className=\"text-[11px] font-ui-header bg-[#3b3426] hover:bg-[#4e453b] text-[#e3c193] border border-[#8b6f47] px-2.5 py-1 rounded transition-colors cursor-pointer\"",
  "className={`text-[11px] ${t.fontHeader} ${t.buttonPrimary} px-2.5 py-1 rounded transition-colors cursor-pointer`}"
);

content = content.replace(
  "className=\"text-[11px] font-ui-header bg-[#93000a]/30 hover:bg-[#93000a] text-[#ffdad6] border border-red-800/40 px-2.5 py-1 rounded transition-colors cursor-pointer\"",
  "className={`text-[11px] ${t.fontHeader} ${t.buttonDanger} px-2.5 py-1 rounded transition-colors cursor-pointer`}"
);

content = content.replace(
  "className=\"bg-[#241010] border border-[#801818] text-[#f5d0d0] text-xs px-3 py-2 rounded-lg flex items-center gap-2 animate-fade-in\"",
  "className={`text-xs px-3 py-2 rounded-lg flex items-center gap-2 animate-fade-in ${t.dangerBg}`}"
);

content = content.replace(
  "<span className=\"sm:hidden text-center text-[10px] font-monospaced-technical text-[#ebc238] flex items-center justify-center gap-1 mb-1.5 opacity-90\">",
  "<span className={`sm:hidden text-center text-[10px] ${t.fontMono} ${t.textAccent} flex items-center justify-center gap-1 mb-1.5 opacity-90`}>"
);

content = content.replace(
  "className=\"relative bg-[#3b2a1a] rounded-xl p-3 sm:p-6 border-[6px] border-[#2f291c] shadow-[inset_0_0_40px_rgba(0,0,0,0.8),0_10px_30px_rgba(0,0,0,0.8)] min-w-[620px]\"",
  "className={`relative rounded-xl p-3 sm:p-6 border-[6px] min-w-[620px] ${theme === 'vintage' ? 'bg-[#3b2a1a] border-[#2f291c] shadow-[inset_0_0_40px_rgba(0,0,0,0.8),0_10px_30px_rgba(0,0,0,0.8)]' : 'bg-slate-100 border-slate-300 shadow-sm'}`}"
);

content = content.replace(
  "className=\"bg-[#120e04] border border-[#3b3426] rounded p-3\"",
  "className={`${t.panelInner} rounded p-3`}"
);

content = content.replace(
  "<span className=\"text-[10px] font-monospaced-technical text-[#d1c4b7] uppercase block mb-2\">",
  "<span className={`text-[10px] ${t.fontMono} ${t.textMuted} uppercase block mb-2`}>"
);

content = content.replace(
  "className=\"bg-[#201b0f] border border-[#3b3426] px-2 py-1.5 rounded flex items-center justify-between\"",
  "className={`${t.panelBg} px-2 py-1.5 rounded flex items-center justify-between`}"
);

content = content.replace(
  "<span className=\"font-monospaced-technical text-xs text-[#ede1cd] font-bold\">",
  "<span className={`${t.fontMono} text-xs ${t.textPrimary} font-bold`}>"
);

content = content.replace(
  "className=\"text-[#d1c4b7] hover:text-[#ffb4ab] text-xs p-0.5 cursor-pointer\"",
  "className={`${t.textMuted} hover:text-red-500 text-xs p-0.5 cursor-pointer`}"
);

fs.writeFileSync('src/components/PlugboardPanel.tsx', content);

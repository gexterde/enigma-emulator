import fs from 'fs';
let content = fs.readFileSync('src/components/MachineView.tsx', 'utf8');

// Use regex to replace hardcoded vintage theme bg classes with theme equivalents where applicable
// or manually target specific elements.

content = content.replace(
  /className="bg-\[#120e04\] border border-\[#ebc238\]\/40 text-\[#ebc238\] rounded-lg p-2\.5 text-center text-xs font-monospaced-technical flex items-center justify-between shadow-panel"/g,
  "className={`rounded-lg p-2.5 text-center text-xs ${t.fontMono} flex items-center justify-between shadow-panel ${theme === 'vintage' ? 'bg-[#120e04] border-[#ebc238]/40 border text-[#ebc238]' : 'bg-slate-50 border border-slate-300 text-slate-800'}`}"
);

content = content.replace(
  /className="bg-\[#201b0f\] border border-\[#4e453b\] rounded-lg p-4 shadow-panel texture-metal space-y-4 animate-fade-in"/g,
  "className={`${t.lampboardPanelBg} rounded-lg p-4 space-y-4 animate-fade-in`}"
);

content = content.replace(
  /className="bg-\[#201b0f\] border border-\[#4e453b\] rounded-lg p-4 shadow-panel texture-metal transition-all animate-fade-in"/g,
  "className={`${t.lampboardPanelBg} rounded-lg p-4 transition-all animate-fade-in`}"
);

content = content.replace(
  /className="bg-\[#18130a\] border-2 border-\[#ebc238\]\/60 rounded-lg shadow-2xl w-full max-w-lg p-5 text-\[#ede1cd\] flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200"/g,
  "className={`${t.modalBg} border-2 rounded-lg shadow-2xl w-full max-w-lg p-5 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200`}"
);

content = content.replace(
  /className="bg-\[#181307\] border-2 border-\[#ebc238\] rounded-xl p-3 shadow-\[0_0_20px_rgba\(235,194,56,0\.3\)\] animate-fade-in flex flex-col sm:flex-row items-center justify-between gap-2\.5 my-2"/g,
  "className={`${theme === 'vintage' ? 'bg-[#181307] border-[#ebc238] shadow-[0_0_20px_rgba(235,194,56,0.3)]' : 'bg-white border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]'} border-2 rounded-xl p-3 animate-fade-in flex flex-col sm:flex-row items-center justify-between gap-2.5 my-2`}"
);

content = content.replace(
  /className="bg-\[#181307\] border-2 border-\[#ebc238\] rounded-xl p-3 shadow-\[0_0_20px_rgba\(235,194,56,0\.3\)\] animate-fade-in flex flex-col sm:flex-row items-center justify-between gap-2\.5 my-1"/g,
  "className={`${theme === 'vintage' ? 'bg-[#181307] border-[#ebc238] shadow-[0_0_20px_rgba(235,194,56,0.3)]' : 'bg-white border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]'} border-2 rounded-xl p-3 animate-fade-in flex flex-col sm:flex-row items-center justify-between gap-2.5 my-1`}"
);

fs.writeFileSync('src/components/MachineView.tsx', content);

import fs from 'fs';
let content = fs.readFileSync('src/components/PlugboardView.tsx', 'utf8');

if (!content.includes('useTheme')) {
  content = content.replace("import React from 'react';", "import React from 'react';\nimport { useTheme, getTheme } from '../lib/theme';");
}

content = content.replace(
  "export const PlugboardView: React.FC<PlugboardViewProps> = ({",
  "export const PlugboardView: React.FC<PlugboardViewProps> = ({\n  config,\n  onUpdateConfig,\n  soundEnabled\n}) => {\n  const { theme } = useTheme();\n  const t = getTheme(theme);"
);

// We need to clean up the signature
content = content.replace(
  "  config,\n  onUpdateConfig,\n  soundEnabled\n}) => {\n  return (",
  "  return ("
);

content = content.replace(
  "className=\"border-b border-[#3b3426] pb-4\"",
  "className={`border-b ${t.borderBase} pb-4`}"
);

content = content.replace(
  "className=\"text-rotor-label font-rotor-label text-[#ebc238] text-xl md:text-2xl\"",
  "className={`${t.fontRotor} text-xl md:text-2xl`}"
);

content = content.replace(
  "className=\"text-[#d1c4b7] text-xs font-ui-body mt-1\"",
  "className={`${t.textMuted} text-xs ${t.fontBody} mt-1`}"
);

content = content.replace(
  "className=\"bg-[#201b0f] border border-[#4e453b] rounded-lg p-4 md:p-6 shadow-panel texture-metal\"",
  "className={`${t.lampboardPanelBg} rounded-lg p-4 md:p-6`}"
);

fs.writeFileSync('src/components/PlugboardView.tsx', content);

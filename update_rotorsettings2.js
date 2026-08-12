import fs from 'fs';

let content = fs.readFileSync('src/components/RotorSettingsView.tsx', 'utf8');

if (!content.includes('useTheme')) {
  content = content.replace("import React, { useState } from 'react';", "import React, { useState } from 'react';\nimport { useTheme, getTheme } from '../lib/theme';");
}

content = content.replace(
  "export const RotorSettingsView: React.FC<RotorSettingsViewProps> = ({",
  "export const RotorSettingsView: React.FC<RotorSettingsViewProps> = ({\n  config,\n  onApplyConfig,\n  soundEnabled\n}) => {\n  const { theme } = useTheme();\n  const t = getTheme(theme);"
);

content = content.replace(
  "  config,\n  onApplyConfig,\n  soundEnabled\n}) => {\n",
  ""
);

fs.writeFileSync('src/components/RotorSettingsView.tsx', content);

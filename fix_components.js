import fs from 'fs';

// Fix PlugboardPanel
let pbContent = fs.readFileSync('src/components/PlugboardPanel.tsx', 'utf8');
if (!pbContent.includes('useTheme')) {
  pbContent = pbContent.replace(
    "import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';", 
    "import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';\nimport { useTheme, getTheme } from '../lib/theme';"
  );
  
  pbContent = pbContent.replace(
    "export const PlugboardPanel: React.FC<PlugboardPanelProps> = ({",
    "export const PlugboardPanel: React.FC<PlugboardPanelProps> = ({\n  config,\n  onUpdateConfig,\n  soundEnabled,\n  showTitle = true\n}) => {\n  const { theme } = useTheme();\n  const t = getTheme(theme);"
  );
  
  pbContent = pbContent.replace(
    "  config,\n  onUpdateConfig,\n  soundEnabled,\n  showTitle = true\n}) => {\n  const plugboard = config.plugboard;",
    "  const plugboard = config.plugboard;"
  );
  
  fs.writeFileSync('src/components/PlugboardPanel.tsx', pbContent);
}

// Fix RotorSettingsView
let rsContent = fs.readFileSync('src/components/RotorSettingsView.tsx', 'utf8');
rsContent = rsContent.replace(/export const RotorSettingsView.*\n.*\n.*\n.*\n\} => \{/, "export const RotorSettingsView: React.FC<RotorSettingsViewProps> = ({\n  config,\n  onApplyConfig,\n  soundEnabled\n}) => {\n  const { theme } = useTheme();\n  const t = getTheme(theme);");
fs.writeFileSync('src/components/RotorSettingsView.tsx', rsContent);


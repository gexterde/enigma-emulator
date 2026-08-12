import fs from 'fs';

const files = [
  'src/components/SignalPathAnimation.tsx',
  'src/components/CodebookBuilder.tsx',
  'src/components/FrequencyAnalysisView.tsx',
  'src/components/MorseTrainer.tsx',
  'src/components/RotorQuickModal.tsx',
  'src/components/MessageHeaderPanel.tsx',
  'src/components/BroadcastModal.tsx',
  'src/components/LampboardPanel.tsx',
  'src/components/CodebookQuickModal.tsx',
  'src/components/BatterySwitch.tsx',
  'src/components/LogView.tsx',
  'src/components/PlugboardQuickModal.tsx',
  'src/components/Modals.tsx',
  'src/components/KeyboardPanel.tsx'
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');

  // Fix imports
  if (content.includes('import React, { useContext } from \'react\';')) {
    content = content.replace("import React, { useContext } from 'react';", "import React, { useState, useEffect, useRef, useCallback, useMemo, useContext } from 'react';");
  } else if (content.includes("import React from 'react';")) {
    content = content.replace("import React from 'react';", "import React, { useState, useEffect, useRef, useCallback, useMemo, useContext } from 'react';");
  }

  // Remove duplicate const { theme } = useTheme(); const t = getTheme(theme);
  // Just in case it was injected multiple times
  const search = "  const { theme } = useTheme();\n  const t = getTheme(theme);";
  if (content.split(search).length > 2) {
    // Only keep the first one
    let parts = content.split(search);
    content = parts[0] + search + parts.slice(1).join("");
  }

  fs.writeFileSync(file, content);
}

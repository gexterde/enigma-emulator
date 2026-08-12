import fs from 'fs';
let content = fs.readFileSync('src/components/CodebookView.tsx', 'utf8');

if (!content.includes('useTheme')) {
  content = content.replace("import React, { useState, useEffect } from 'react';", "import React, { useState, useEffect } from 'react';\nimport { useTheme, getTheme } from '../lib/theme';");
}

content = content.replace(
  "export const CodebookView: React.FC<CodebookViewProps> = ({ config, onApplyConfig, soundEnabled }) => {",
  "export const CodebookView: React.FC<CodebookViewProps> = ({ config, onApplyConfig, soundEnabled }) => {\n  const { theme } = useTheme();\n  const t = getTheme(theme);"
);

// Generic replacements for browns
content = content.replace(/bg-\[#201b0f\]/g, "${t.panelBg}");
content = content.replace(/bg-\[#120e04\]/g, "${t.panelInner}");
content = content.replace(/bg-\[#1c170e\]/g, "${t.modalBg}");
content = content.replace(/bg-\[#3b3426\]/g, "${t.panelBg}");
content = content.replace(/bg-\[#18130a\]/g, "${t.modalBg}");
content = content.replace(/text-\[#ede1cd\]/g, "${t.textPrimary}");
content = content.replace(/text-\[#d1c4b7\]/g, "${t.textMuted}");
content = content.replace(/text-\[#ebc238\]/g, "${t.textAccent}");
content = content.replace(/text-\[#e3c193\]/g, "${t.textSecondary}");
content = content.replace(/text-\[#8c7e6a\]/g, "${t.textMuted}");
content = content.replace(/border-\[#3b3426\]/g, "${t.borderBase}");
content = content.replace(/border-\[#4e453b\]/g, "${t.borderBase}");
content = content.replace(/border-\[#ebc238\]/g, "${t.borderAccent}");
content = content.replace(/font-ui-header/g, "${t.fontHeader}");
content = content.replace(/font-monospaced-technical/g, "${t.fontMono}");
content = content.replace(/font-ui-body/g, "${t.fontBody}");

content = content.replace(/className="/g, 'className={`');
content = content.replace(/"/g, '`}');

// Fix string literals inside classNames which are now double template literals
// We will simply regex out any nested interpolation issues. Wait, no, blindly replacing className="" with className={`...`} will break strings that don't have interpolations if we don't do it properly.

// Let's not do blind regex for className on 800 lines. 

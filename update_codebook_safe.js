import fs from 'fs';

let content = fs.readFileSync('src/components/CodebookView.tsx', 'utf8');

if (!content.includes('useTheme')) {
  content = content.replace("import React, { useState, useEffect } from 'react';", "import React, { useState, useEffect } from 'react';\nimport { useTheme, getTheme } from '../lib/theme';");
}

content = content.replace(
  "export const CodebookView: React.FC<CodebookViewProps> = ({ config, onApplyConfig, onNavigateToMachine }) => {",
  "export const CodebookView: React.FC<CodebookViewProps> = ({ config, onApplyConfig, onNavigateToMachine }) => {\n  const { theme } = useTheme();\n  const t = getTheme(theme);"
);

// We need to inject t variables safely.
// Let's find all className="bg-[#201b0f]..." and replace with className={`${t.panelBg} ...`}
// Because there are many variations, we can just find and replace specific known color strings

const replacements = [
  { match: /bg-\[#201b0f\]/g, rep: "${t.panelBg}" },
  { match: /bg-\[#120e04\]/g, rep: "${t.panelInner}" },
  { match: /bg-\[#1c170e\]/g, rep: "${t.modalBg}" },
  { match: /bg-\[#3b3426\]/g, rep: "${t.panelBg}" },
  { match: /bg-\[#18130a\]/g, rep: "${t.modalBg}" },
  { match: /text-\[#ede1cd\]/g, rep: "${t.textPrimary}" },
  { match: /text-\[#d1c4b7\]/g, rep: "${t.textMuted}" },
  { match: /text-\[#ebc238\]/g, rep: "${t.textAccent}" },
  { match: /text-\[#e3c193\]/g, rep: "${t.textSecondary}" },
  { match: /text-\[#8c7e6a\]/g, rep: "${t.textMuted}" },
  { match: /border-\[#3b3426\]/g, rep: "${t.borderBase}" },
  { match: /border-\[#4e453b\]/g, rep: "${t.borderBase}" },
  { match: /border-\[#ebc238\]/g, rep: "${t.borderAccent}" },
  { match: /font-ui-header/g, rep: "${t.fontHeader}" },
  { match: /font-monospaced-technical/g, rep: "${t.fontMono}" },
  { match: /font-ui-body/g, rep: "${t.fontBody}" },
];

// Instead of rewriting all classNames, we'll find className="..." and replace it with className={`...`} 
// but carefully, avoiding already templated ones.
// Actually, it's safer to just replace className=" with className={` and the terminating " with `}
// Since we might have multiple " on a line, we should use a custom replacer.

let lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  let line = lines[i];
  // If line contains className="... ", convert it to className={`...`}
  if (line.includes('className="')) {
    line = line.replace(/className="([^"]+)"/g, (match, p1) => {
      let newClass = p1;
      for (const r of replacements) {
        newClass = newClass.replace(r.match, r.rep);
      }
      if (newClass !== p1) {
        return `className={\`${newClass}\`}`;
      }
      return match;
    });
  }
  
  // Also handle cases where it's already a template literal: className={`...`}
  if (line.includes('className={`')) {
    for (const r of replacements) {
      line = line.replace(r.match, r.rep);
    }
  }

  lines[i] = line;
}

fs.writeFileSync('src/components/CodebookView.tsx', lines.join('\n'));

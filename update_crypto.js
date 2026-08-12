import fs from 'fs';
let content = fs.readFileSync('src/components/CryptanalysisView.tsx', 'utf8');

const replacements = [
  { match: /bg-\[#201b0f\]/g, rep: "${t.panelBg}" },
  { match: /bg-\[#120e04\]/g, rep: "${t.panelInner}" },
  { match: /bg-\[#1c170e\]/g, rep: "${t.modalBg}" },
  { match: /bg-\[#3b3426\]/g, rep: "${t.panelBg}" },
  { match: /bg-\[#18130a\]/g, rep: "${t.modalBg}" },
  { match: /bg-\[#181307\]/g, rep: "${t.panelBg}" },
  { match: /bg-\[#1e1810\]/g, rep: "${t.panelInner}" },
  { match: /bg-\[#2a241a\]/g, rep: "${t.panelInner}" },
  { match: /bg-\[#0b0805\]/g, rep: "${t.appBg}" },
  { match: /bg-\[#3b2a1a\]/g, rep: "${t.panelBg}" },
  { match: /text-\[#ede1cd\]/g, rep: "${t.textPrimary}" },
  { match: /text-\[#d1c4b7\]/g, rep: "${t.textMuted}" },
  { match: /text-\[#ebc238\]/g, rep: "${t.textAccent}" },
  { match: /text-\[#e3c193\]/g, rep: "${t.textSecondary}" },
  { match: /text-\[#8c7e6a\]/g, rep: "${t.textMuted}" },
  { match: /text-\[#ffdad6\]/g, rep: "${t.textPrimary}" },
  { match: /text-\[#801818\]/g, rep: "text-red-500" },
  { match: /border-\[#3b3426\]/g, rep: "${t.borderBase}" },
  { match: /border-\[#4e453b\]/g, rep: "${t.borderBase}" },
  { match: /border-\[#ebc238\]/g, rep: "${t.borderAccent}" },
  { match: /border-\[#8b6f47\]/g, rep: "${t.borderAccent}" },
  { match: /font-ui-header/g, rep: "${t.fontHeader}" },
  { match: /font-monospaced-technical/g, rep: "${t.fontMono}" },
  { match: /font-ui-body/g, rep: "${t.fontBody}" },
  { match: /font-rotor-label/g, rep: "${t.fontRotor}" },
];

let lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  let line = lines[i];
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
  
  if (line.includes('className={`')) {
    for (const r of replacements) {
      line = line.replace(r.match, r.rep);
    }
  }

  lines[i] = line;
}

fs.writeFileSync('src/components/CryptanalysisView.tsx', lines.join('\n'));

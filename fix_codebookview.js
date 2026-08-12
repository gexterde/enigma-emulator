import fs from 'fs';
let content = fs.readFileSync('src/components/CodebookView.tsx', 'utf8');

// I will just reconstruct the signature properly
content = content.replace(/export const CodebookView: React\.FC<CodebookViewProps> = \([\s\S]*?=> \{/, 
  "export const CodebookView: React.FC<CodebookViewProps> = ({ currentConfig, onApplyConfig, onNavigateToMachine }) => {\n  const { theme } = useTheme();\n  const t = getTheme(theme);"
);

fs.writeFileSync('src/components/CodebookView.tsx', content);

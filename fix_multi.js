import fs from 'fs';

const files = [
  'src/components/KeyboardPanel.tsx',
  'src/components/LampboardPanel.tsx',
  'src/components/Modals.tsx'
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');

  // First, completely strip out all injected lines:
  content = content.replace(/  const \{ theme \} = useTheme\(\);\n  const t = getTheme\(theme\);\n/g, "");

  // Now properly inject it into EVERY component definition:
  content = content.replace(/(export const [a-zA-Z0-9_]+(?:: React\.FC(?:<[^>]+>)?)? = \([^)]*\) => \{)/g, "$1\n  const { theme } = useTheme();\n  const t = getTheme(theme);\n");

  fs.writeFileSync(file, content);
}

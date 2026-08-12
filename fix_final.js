import fs from 'fs';

const files = [
  'src/components/KeyboardPanel.tsx',
  'src/components/LampboardPanel.tsx',
  'src/components/Modals.tsx'
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');

  // Inject properly for both exported and un-exported components
  content = content.replace(/(?<!export )(const [a-zA-Z0-9_]+(?:: React\.FC(?:<[^>]+>)?)? = \([^)]*\)(?:: React\.ReactElement)? => \{)/g, "$1\n  const { theme, setTheme } = useTheme();\n  const t = getTheme(theme);\n");

  fs.writeFileSync(file, content);
}

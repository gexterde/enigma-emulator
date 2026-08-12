import fs from 'fs';

const files = [
  'src/components/KeyboardPanel.tsx',
  'src/components/LampboardPanel.tsx',
  'src/components/Modals.tsx'
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');

  // Strip all
  content = content.replace(/  const \{ theme(?:, setTheme)? \} = useTheme\(\);\n  const t = getTheme\(theme\);\n/g, "");
  content = content.replace(/  const \{ theme \} = useTheme\(\);\n/g, "");
  content = content.replace(/  const t = getTheme\(theme\);\n/g, "");

  // Inject properly
  // For Modals, it also needs setTheme in some places? No, only ShareModal maybe?
  // Let's just use `const { theme, setTheme } = useTheme(); const t = getTheme(theme);` everywhere it doesn't break
  content = content.replace(/(export const [a-zA-Z0-9_]+(?:: React\.FC(?:<[^>]+>)?)? = \([^)]*\)(?:: React\.ReactElement)? => \{)/g, "$1\n  const { theme, setTheme } = useTheme();\n  const t = getTheme(theme);\n");

  fs.writeFileSync(file, content);
}

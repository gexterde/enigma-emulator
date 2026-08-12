import fs from 'fs';

let content = fs.readFileSync('src/components/PlugboardPanel.tsx', 'utf8');
content = content.replace(
  "}) => {\n  const { theme } = useTheme();\n  const t = getTheme(theme);\n  config,\n  onUpdateConfig,\n  soundEnabled,\n  showTitle = true\n}) => {",
  "}) => {\n  const { theme } = useTheme();\n  const t = getTheme(theme);"
);
fs.writeFileSync('src/components/PlugboardPanel.tsx', content);

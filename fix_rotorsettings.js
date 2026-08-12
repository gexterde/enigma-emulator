import fs from 'fs';

let content = fs.readFileSync('src/components/RotorSettingsView.tsx', 'utf8');

content = content.replace(
  "export const RotorSettingsView: React.FC<RotorSettingsViewProps> = ({\n  const { theme } = useTheme();\n  const t = getTheme(theme);\n  config,\n  onApplyConfig,\n  soundEnabled\n}) => {",
  "export const RotorSettingsView: React.FC<RotorSettingsViewProps> = ({\n  config,\n  onApplyConfig,\n  soundEnabled\n}) => {\n  const { theme } = useTheme();\n  const t = getTheme(theme);"
);

content = content.replace(
  "export const RotorSettingsView: React.FC<RotorSettingsViewProps> = ({\n  const { theme } = useTheme();\n  const t = getTheme(theme);\n  config,\n  onApplyConfig,\n  soundEnabled\n",
  "export const RotorSettingsView: React.FC<RotorSettingsViewProps> = ({\n  config,\n  onApplyConfig,\n  soundEnabled\n}) => {\n  const { theme } = useTheme();\n  const t = getTheme(theme);\n"
);

fs.writeFileSync('src/components/RotorSettingsView.tsx', content);

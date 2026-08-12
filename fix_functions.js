import fs from 'fs';

const file = 'src/components/Modals.tsx';
let content = fs.readFileSync(file, 'utf8');

// Also inject into "export function ComponentName(...)"
content = content.replace(/(export function [a-zA-Z0-9_]+\([^)]*\) \{)/g, "$1\n  const { theme, setTheme } = useTheme();\n  const t = getTheme(theme);\n");

fs.writeFileSync(file, content);

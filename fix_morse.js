import fs from 'fs';
let content = fs.readFileSync('src/components/MorseTrainer.tsx', 'utf8');
content = content.replace("export const MorseTrainer: React.FC = () => {", "export const MorseTrainer: React.FC = () => {\n  const { theme } = useTheme();\n  const t = getTheme(theme);");
content = content.replace("import React, { useContext } from 'react';\nimport { useTheme, getTheme } from '../lib/theme';\n//import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';", "import React, { useState, useEffect, useRef, useCallback, useMemo, useContext } from 'react';\nimport { useTheme, getTheme } from '../lib/theme';");
fs.writeFileSync('src/components/MorseTrainer.tsx', content);

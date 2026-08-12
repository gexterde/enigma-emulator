import fs from 'fs';
let content = fs.readFileSync('src/components/SignalPathAnimation.tsx', 'utf8');
content = content.replace("import React, { useContext } from 'react';\nimport { useTheme, getTheme } from '../lib/theme';\n//import React, { useState, useEffect, useRef } from 'react';", "import React, { useState, useEffect, useRef, useContext } from 'react';\nimport { useTheme, getTheme } from '../lib/theme';");
fs.writeFileSync('src/components/SignalPathAnimation.tsx', content);

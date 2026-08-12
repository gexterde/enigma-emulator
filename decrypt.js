const fs = require('fs');
const content = fs.readFileSync('src/lib/enigmaEngine.ts', 'utf8');
// Compile it to JS using esbuild, then run

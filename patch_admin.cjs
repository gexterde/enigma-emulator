const fs = require('fs');
let code = fs.readFileSync('src/lib/server/setupAdmin.ts', 'utf-8');
code = code.replace("const password = process.env.ADMIN_PASSWORD;", "const password = process.env.ADMIN_PASSWORD;\nconst callSign = process.env.ADMIN_CALLSIGN ? process.env.ADMIN_CALLSIGN.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 5) : 'ADMIN';");
code = code.replace("callSign: null,", "callSign: callSign,");
fs.writeFileSync('src/lib/server/setupAdmin.ts', code);
console.log("patched setupAdmin.ts");

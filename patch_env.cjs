const fs = require('fs');

let envEx = fs.readFileSync('.env.example', 'utf-8');
if (!envEx.includes('ADMIN_CALLSIGN')) {
  envEx += '\nADMIN_CALLSIGN="ADMIN"\n';
  fs.writeFileSync('.env.example', envEx);
}

let env = fs.readFileSync('.env', 'utf-8');
if (!env.includes('ADMIN_CALLSIGN')) {
  env += '\nADMIN_CALLSIGN="ADMIN"\n';
  fs.writeFileSync('.env', env);
}
console.log('patched env');

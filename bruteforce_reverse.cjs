const { encryptChar } = require('./enigmaEngine.cjs');
function charToNum(c) { return c.toUpperCase().charCodeAt(0) - 65; }

const message = "NZEEZPLZMGWW";
// Try reverse order: W=Fourth, L=Left, M=Middle, J=Right
let config = {
  fourthRotor: { type: 'Gamma', ring: charToNum('U')+1, start: charToNum('W'), current: charToNum('W') },
  leftRotor: { type: 'IV', ring: charToNum('C')+1, start: charToNum('L'), current: charToNum('L') },
  middleRotor: { type: 'III', ring: charToNum('A')+1, start: charToNum('M'), current: charToNum('M') },
  rightRotor: { type: 'VIII', ring: charToNum('A')+1, start: charToNum('J'), current: charToNum('J') },
  reflector: { type: 'Reflector B Thin' },
  plugboard: {
    'C':'H', 'H':'C', 'E':'J', 'J':'E', 'N':'V', 'V':'N', 'O':'U', 'U':'O',
    'T':'Y', 'Y':'T', 'L':'G', 'G':'L', 'S':'Z', 'Z':'S', 'P':'K', 'K':'P',
    'D':'I', 'I':'D', 'Q':'B', 'B':'Q'
  }
};
let decrypted = "";
for (let i = 0; i < message.length; i++) {
  const { nextConfig, result } = encryptChar(message[i], config);
  decrypted += result.outputChar;
  config = nextConfig;
}
console.log(`Reversed => ${decrypted}`);

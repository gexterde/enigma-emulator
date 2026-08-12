const { encryptChar } = require('./enigmaEngine.cjs');

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
function charToNum(c) {
  if (!c) return 0;
  return c.toUpperCase().charCodeAt(0) - 65;
}

let config = {
  fourthRotor: { type: 'Gamma', ring: 1, start: charToNum('J'), current: charToNum('J') }, // A=1
  leftRotor: { type: 'IV', ring: 1, start: charToNum('M'), current: charToNum('M') }, // A=1
  middleRotor: { type: 'III', ring: 3, start: charToNum('L'), current: charToNum('L') }, // C=3
  rightRotor: { type: 'VIII', ring: 21, start: charToNum('W'), current: charToNum('W') }, // U=21
  reflector: { type: 'Reflector C Thin' },
  plugboard: {
    'C':'H', 'H':'C', 'E':'J', 'J':'E', 'N':'V', 'V':'N', 'O':'U', 'U':'O',
    'T':'Y', 'Y':'T', 'L':'G', 'G':'L', 'S':'Z', 'Z':'S', 'P':'K', 'K':'P',
    'D':'I', 'I':'D', 'Q':'B', 'B':'Q'
  }
};

const message = "NZEEZPLZMGWW";
let decrypted = "";

for (let i = 0; i < message.length; i++) {
  const char = message[i];
  if (char === ' ') {
    decrypted += ' ';
    continue;
  }
  const { nextConfig, result } = encryptChar(char, config);
  decrypted += result.outputChar;
  config = nextConfig;
}

console.log("DECRYPTED:", decrypted);

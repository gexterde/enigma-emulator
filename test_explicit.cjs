const { encryptChar } = require('./enigmaEngine.cjs');
function charToNum(c) { return c.toUpperCase().charCodeAt(0) - 65; }

let config = {
  fourthRotor: { type: 'Beta', ring: charToNum('A')+1, start: charToNum('J'), current: charToNum('J') },
  leftRotor: { type: 'IV', ring: charToNum('A')+1, start: charToNum('M'), current: charToNum('M') },
  middleRotor: { type: 'III', ring: charToNum('C')+1, start: charToNum('L'), current: charToNum('L') },
  rightRotor: { type: 'VIII', ring: charToNum('U')+1, start: charToNum('W'), current: charToNum('W') },
  reflector: { type: 'Reflector B Thin' },
  plugboard: {
    'C':'H', 'H':'C', 'E':'J', 'J':'E', 'N':'V', 'V':'N', 'O':'U', 'U':'O',
    'T':'Y', 'Y':'T', 'L':'G', 'G':'L', 'S':'Z', 'Z':'S', 'P':'K', 'K':'P',
    'D':'I', 'I':'D', 'Q':'B', 'B':'Q'
  }
};

const message = "TITKOSUZENET";
let decrypted = "";
for (let i = 0; i < message.length; i++) {
  const { nextConfig, result } = encryptChar(message[i], config);
  decrypted += result.outputChar;
  config = nextConfig;
}
console.log("Encrypted TITKOSUZENET:", decrypted);

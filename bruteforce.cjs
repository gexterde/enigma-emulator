const { encryptChar } = require('./enigmaEngine.cjs');

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
function charToNum(c) { return c.toUpperCase().charCodeAt(0) - 65; }

const message = "NZEEZPLZMGWW";

const reflectors = ['Reflector B Thin', 'Reflector C Thin', 'Reflector B', 'Reflector C', 'UKW-B', 'UKW-C'];
const greeks = ['Beta', 'Gamma', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

for (let ref of reflectors) {
  for (let greek of greeks) {
    let config = {
      fourthRotor: { type: greek, ring: 1, start: charToNum('J'), current: charToNum('J') }, // A=1
      leftRotor: { type: 'IV', ring: 1, start: charToNum('M'), current: charToNum('M') }, // A=1
      middleRotor: { type: 'III', ring: 3, start: charToNum('L'), current: charToNum('L') }, // C=3
      rightRotor: { type: 'VIII', ring: 21, start: charToNum('W'), current: charToNum('W') }, // U=21
      reflector: { type: ref },
      plugboard: {
        'C':'H', 'H':'C', 'E':'J', 'J':'E', 'N':'V', 'V':'N', 'O':'U', 'U':'O',
        'T':'Y', 'Y':'T', 'L':'G', 'G':'L', 'S':'Z', 'Z':'S', 'P':'K', 'K':'P',
        'D':'I', 'I':'D', 'Q':'B', 'B':'Q'
      }
    };
    
    let decrypted = "";
    for (let i = 0; i < message.length; i++) {
      try {
        const { nextConfig, result } = encryptChar(message[i], config);
        decrypted += result.outputChar;
        config = nextConfig;
      } catch (e) { break; }
    }
    console.log(`Ref: ${ref}, Greek: ${greek} => ${decrypted}`);
  }
}

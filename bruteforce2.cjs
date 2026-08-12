const { encryptChar } = require('./enigmaEngine.cjs');
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
function charToNum(c) { return c.toUpperCase().charCodeAt(0) - 65; }

const message = "NZEEZPLZMGWW";

const greeks = ['Beta', 'Gamma'];
const refs = ['Reflector B Thin', 'Reflector C Thin'];

// Just to be sure, check if the word starts with a common german word.
// "GEHEIM", "WETTER", "FUNK", "HALLO", "GUTEN", "MORGEN"
function isGerman(str) {
  return str.includes("WETTER") || str.includes("HALLO") || str.includes("GEHEIM") || str.includes("GUTEN") || str.includes("FUNK") || str.includes("HEUTE") || str.includes("X");
}

let found = false;

for (let greek of greeks) {
  for (let ref of refs) {
    let config = {
      fourthRotor: { type: greek, ring: charToNum('A')+1, start: charToNum('J'), current: charToNum('J') },
      leftRotor: { type: 'IV', ring: charToNum('A')+1, start: charToNum('M'), current: charToNum('M') },
      middleRotor: { type: 'III', ring: charToNum('C')+1, start: charToNum('L'), current: charToNum('L') },
      rightRotor: { type: 'VIII', ring: charToNum('U')+1, start: charToNum('W'), current: charToNum('W') },
      reflector: { type: ref },
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
    console.log(`Straight: ${ref}, ${greek} => ${decrypted}`);
  }
}

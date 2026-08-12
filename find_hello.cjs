const { encryptChar } = require('./enigmaEngine.cjs');
function charToNum(c) { return c.toUpperCase().charCodeAt(0) - 65; }

const plain = "HELLOWORLDXX";
const expected = "NZEEZPLZMGWW";

const greeks = ['Beta', 'Gamma'];
const refs = ['Reflector B Thin', 'Reflector C Thin', 'Reflector B', 'Reflector C', 'UKW-B', 'UKW-C'];
const allRotors = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

let found = false;

for (let r4 of greeks) {
  for (let ref of refs) {
    let config = {
      fourthRotor: { type: r4, ring: charToNum('A')+1, start: charToNum('J'), current: charToNum('J') },
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
    let match = true;
    try {
      for (let i = 0; i < plain.length; i++) {
        const { nextConfig, result } = encryptChar(plain[i], config);
        decrypted += result.outputChar;
        config = nextConfig;
        if (decrypted[i] !== expected[i]) { match = false; break; }
      }
      if (match) {
        console.log(`FOUND! HELLOWORLDXX -> R4:${r4} Ref:${ref}`);
        found = true;
      }
    } catch(e) {}
  }
}
if(!found) console.log("Not found with HELLOWORLDXX.");

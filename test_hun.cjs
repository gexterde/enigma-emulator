const { encryptChar } = require('./enigmaEngine.cjs');
function charToNum(c) { return c.toUpperCase().charCodeAt(0) - 65; }

const message = "NZEEZPLZMGWW";
const allRotors = ['Beta', 'Gamma', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
const refs = ['Reflector B Thin', 'Reflector C Thin', 'Reflector B', 'Reflector C', 'UKW-B', 'UKW-C', 'UKW-Dual-Dynamic'];

for (let r4 of allRotors) {
  for (let ref of refs) {
    for (let r1 of allRotors) {
      for (let r2 of allRotors) {
        for (let r3 of allRotors) {
          let config = {
            fourthRotor: { type: r4, ring: charToNum('A')+1, start: charToNum('J'), current: charToNum('J') },
            leftRotor: { type: r1, ring: charToNum('A')+1, start: charToNum('M'), current: charToNum('M') },
            middleRotor: { type: r2, ring: charToNum('C')+1, start: charToNum('L'), current: charToNum('L') },
            rightRotor: { type: r3, ring: charToNum('U')+1, start: charToNum('W'), current: charToNum('W') },
            reflector: { type: ref },
            plugboard: {
              'C':'H', 'H':'C', 'E':'J', 'J':'E', 'N':'V', 'V':'N', 'O':'U', 'U':'O',
              'T':'Y', 'Y':'T', 'L':'G', 'G':'L', 'S':'Z', 'Z':'S', 'P':'K', 'K':'P',
              'D':'I', 'I':'D', 'Q':'B', 'B':'Q'
            }
          };
          
          let decrypted = "";
          try {
            for (let i = 0; i < message.length; i++) {
              const { nextConfig, result } = encryptChar(message[i], config);
              decrypted += result.outputChar;
              config = nextConfig;
            }
            if (decrypted.includes("TITKOS") || decrypted.includes("UZENET") || decrypted.includes("MAGYAR") || decrypted.includes("ENIGMA")) {
              console.log(`R4:${r4} Ref:${ref} Rotors:${r1},${r2},${r3} => ${decrypted}`);
            }
          } catch(e) {}
        }
      }
    }
  }
}

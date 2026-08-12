const { encryptChar } = require('./enigmaEngine.cjs');
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
function charToNum(c) { return c.toUpperCase().charCodeAt(0) - 65; }

const message = "NZEEZPLZMGWW";
const greeks = ['Beta', 'Gamma'];
const refs = ['Reflector B Thin', 'Reflector C Thin'];
const rotors = ['IV', 'III', 'VIII'];

function permute(arr) {
  if (arr.length === 0) return [[]];
  let res = [];
  for (let i = 0; i < arr.length; i++) {
    let rest = permute(arr.slice(0, i).concat(arr.slice(i + 1)));
    for (let j = 0; j < rest.length; j++) {
      res.push([arr[i]].concat(rest[j]));
    }
  }
  return res;
}

const rotorPerms = permute(rotors);
const positions = 'JMLW';
const rings = 'AACU';

for (let r4 of greeks) {
  for (let ref of refs) {
    for (let rPerm of rotorPerms) {
      let config = {
        fourthRotor: { type: r4, ring: charToNum(rings[0])+1, start: charToNum(positions[0]), current: charToNum(positions[0]) },
        leftRotor: { type: rPerm[0], ring: charToNum(rings[1])+1, start: charToNum(positions[1]), current: charToNum(positions[1]) },
        middleRotor: { type: rPerm[1], ring: charToNum(rings[2])+1, start: charToNum(positions[2]), current: charToNum(positions[2]) },
        rightRotor: { type: rPerm[2], ring: charToNum(rings[3])+1, start: charToNum(positions[3]), current: charToNum(positions[3]) },
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
      
      // Let's print out all outputs and visually inspect or find "GEHEIM", "HELLO", "TEST"
      if (decrypted.includes("HELLO") || decrypted.includes("GEHEIM") || decrypted.includes("WETTER") || decrypted.includes("TEST") || decrypted.includes("GUTEN")) {
        console.log(`FOUND! R4:${r4} Ref:${ref} Rotors:${rPerm.join(',')} => ${decrypted}`);
      }
    }
  }
}

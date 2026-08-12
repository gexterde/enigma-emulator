const { encryptChar } = require('./enigmaEngine.cjs');
function charToNum(c) { return c.toUpperCase().charCodeAt(0) - 65; }

const cipher = "NZEEZPLZMGWW";

const greeks = ['Beta', 'Gamma', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
const refs = ['Reflector B Thin', 'Reflector C Thin', 'Reflector B', 'UKW-B', 'Reflector A', 'Reflector C', 'UKW-Dual-Dynamic'];
const rotors = ['IV', 'III', 'VIII'];

function getPermutations(arr, k) {
  if (k === 1) return arr.map(e => [e]);
  let res = [];
  arr.forEach((e, i) => {
    let rest = getPermutations(arr.slice(0, i).concat(arr.slice(i + 1)), k - 1);
    rest.forEach(r => res.push([e].concat(r)));
  });
  return res;
}
const rotorCombs = getPermutations(rotors, 3);
const positionsList = ['JMLW', 'JMLW']; // maybe reverse JMLW? WLMJ
const ringsList = ['AACU']; // reverse UCAA

let found = false;

for (let r4 of greeks) {
  for (let ref of refs) {
    for (let rPerm of rotorCombs) {
      for (let pos of ['JMLW', 'WLMJ', 'M L W J']) {
          let posStr = pos.replace(/ /g, '');
          let config = {
            fourthRotor: { type: r4, ring: charToNum('A')+1, start: charToNum(posStr[0]), current: charToNum(posStr[0]) },
            leftRotor: { type: rPerm[0], ring: charToNum('A')+1, start: charToNum(posStr[1]), current: charToNum(posStr[1]) },
            middleRotor: { type: rPerm[1], ring: charToNum('C')+1, start: charToNum(posStr[2]), current: charToNum(posStr[2]) },
            rightRotor: { type: rPerm[2], ring: charToNum('U')+1, start: charToNum(posStr[3]), current: charToNum(posStr[3]) },
            reflector: { type: ref },
            plugboard: {
              'C':'H', 'H':'C', 'E':'J', 'J':'E', 'N':'V', 'V':'N', 'O':'U', 'U':'O',
              'T':'Y', 'Y':'T', 'L':'G', 'G':'L', 'S':'Z', 'Z':'S', 'P':'K', 'K':'P',
              'D':'I', 'I':'D', 'Q':'B', 'B':'Q'
            }
          };
          
          let decrypted = "";
          try {
            for (let i = 0; i < cipher.length; i++) {
              const { nextConfig, result } = encryptChar(cipher[i], config);
              decrypted += result.outputChar;
              config = nextConfig;
            }
            if (decrypted.includes("HELLO") || decrypted.includes("WETTER") || decrypted.includes("GEHEIM") || decrypted.includes("TITKOS")) {
              console.log(`FOUND! R4:${r4} Ref:${ref} Rotors:${rPerm.join(',')} Pos:${posStr} => ${decrypted}`);
              found = true;
            }
          } catch(e) {}
      }
    }
  }
}
if(!found) console.log("Not found.");

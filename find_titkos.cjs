const { encryptChar } = require('./enigmaEngine.cjs');
function charToNum(c) { return c.toUpperCase().charCodeAt(0) - 65; }

const plain = "TITKOSUZENET";
const expected = "NZEEZPLZMGWW";

const greeks = ['Beta', 'Gamma', 'I', 'II', 'III'];
const refs = ['Reflector B Thin', 'Reflector C Thin', 'Reflector B', 'Reflector C'];
const allRotors = [ 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII' ];

function getPermutations(arr, k) {
  if (k === 1) return arr.map(e => [e]);
  let res = [];
  arr.forEach((e, i) => {
    let rest = getPermutations(arr.slice(0, i).concat(arr.slice(i + 1)), k - 1);
    rest.forEach(r => res.push([e].concat(r)));
  });
  return res;
}
const rotorCombs = getPermutations(allRotors, 3);

const ringsList = [
  'AACU', 'UCAA', 'AUCA'
];

const posList = ['JMLW', 'WLMJ', 'WLJM'];

let found = false;
for (let r4 of greeks) {
  for (let ref of refs) {
    for (let rPerm of rotorCombs) {
      for (let rings of ringsList) {
        for (let positions of posList) {
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
          let match = true;
          try {
            for (let i = 0; i < plain.length; i++) {
              const { nextConfig, result } = encryptChar(plain[i], config);
              decrypted += result.outputChar;
              config = nextConfig;
              if (decrypted[i] !== expected[i]) { match = false; break; }
            }
            if (match) {
              console.log(`FOUND! TITKOSUZENET -> R4:${r4} Ref:${ref} Rotors:${rPerm.join(',')} Rings:${rings} Pos:${positions}`);
              found = true;
            }
          } catch(e) {}
        }
      }
    }
  }
}
if(!found) console.log("Not found with TITKOSUZENET.");

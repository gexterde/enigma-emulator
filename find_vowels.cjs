const { encryptChar } = require('./enigmaEngine.cjs');
function charToNum(c) { return c.toUpperCase().charCodeAt(0) - 65; }

const message = "NZEEZPLZMGWW";
const greeks = ['Beta', 'Gamma'];
const refs = ['Reflector B Thin', 'Reflector C Thin', 'Reflector B', 'Reflector C', 'UKW-B', 'UKW-C'];
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

const positionsList = ['JMLW'];
const ringsList = ['AACU'];

let best = [];
for (let r4 of greeks) {
  for (let ref of refs) {
    for (let rPerm of rotorCombs) {
      let config = {
        fourthRotor: { type: r4, ring: charToNum('A')+1, start: charToNum('J'), current: charToNum('J') },
        leftRotor: { type: rPerm[0], ring: charToNum('A')+1, start: charToNum('M'), current: charToNum('M') },
        middleRotor: { type: rPerm[1], ring: charToNum('C')+1, start: charToNum('L'), current: charToNum('L') },
        rightRotor: { type: rPerm[2], ring: charToNum('U')+1, start: charToNum('W'), current: charToNum('W') },
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
        
        let vowelCount = (decrypted.match(/[AEIOU]/g) || []).length;
        if (vowelCount >= 3 && !decrypted.includes("UUU") && !decrypted.includes("YYY")) {
          // just to filter out garbage
          best.push({ config: `${r4} ${ref} ${rPerm.join(',')}`, decrypted, vowels: vowelCount });
        }
      } catch(e) {}
    }
  }
}
best.sort((a,b) => b.vowels - a.vowels);
console.log(best.slice(0, 10));

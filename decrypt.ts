import { processMessage } from './src/lib/enigmaEngine';

const config = {
  leftRotor: { type: 'IV', ring: 0, start: 'M'.charCodeAt(0)-65, current: 'M'.charCodeAt(0)-65 },
  middleRotor: { type: 'III', ring: 0, start: 'L'.charCodeAt(0)-65, current: 'L'.charCodeAt(0)-65 },
  rightRotor: { type: 'VIII', ring: 20, start: 'W'.charCodeAt(0)-65, current: 'W'.charCodeAt(0)-65 },
  fourthRotor: { type: 'Gamma', ring: 0, start: 'J'.charCodeAt(0)-65, current: 'J'.charCodeAt(0)-65 },
  reflector: { type: 'Reflector B Thin' },
  plugboard: {
    'C':'H', 'H':'C', 'E':'J', 'J':'E', 'N':'V', 'V':'N', 'O':'U', 'U':'O',
    'T':'Y', 'Y':'T', 'L':'G', 'G':'L', 'S':'Z', 'Z':'S', 'P':'K', 'K':'P',
    'D':'I', 'I':'D', 'Q':'B', 'B':'Q'
  }
};

const result = processMessage("NZEEZPLZMGWW", config);
console.log(result.map(r => r.outputChar).join(''));

import { EnigmaConfig, RotorType, ReflectorType, EncryptionResult, StepTrace } from '../types';

// Historical Enigma Rotor Wirings & Turnovers (Notch)
export const ROTOR_SPECS: Record<RotorType, { wiring: string; notch: string; modelName: string; year: string }> = {
  // Enigma I / M3 Army & Air Force
  'I':    { wiring: 'EKMFLGDQVZNTOWYHXUSPAIBRCJ', notch: 'Q', modelName: 'Enigma I / M3', year: '1930' },
  'II':   { wiring: 'AJDKSIRUXBLHWTMCQGZNPYFVOE', notch: 'E', modelName: 'Enigma I / M3', year: '1930' },
  'III':  { wiring: 'BDFHJLCPRTXVZNYEIWGAKMUSQO', notch: 'V', modelName: 'Enigma I / M3', year: '1930' },
  'IV':   { wiring: 'ESOVPZJAYQUIRHXLNFTGKDCMWB', notch: 'J', modelName: 'M3 Army', year: 'Dec 1938' },
  'V':    { wiring: 'VZBRGITYUPSDNHLXAWMJQOFECK', notch: 'Z', modelName: 'M3 Army', year: 'Dec 1938' },
  'VI':   { wiring: 'JPGVOUMFYQBENHZRDKASXLICTW', notch: 'Z', modelName: 'M3 & M4 Naval', year: '1939' },
  'VII':  { wiring: 'NZJHGRCXMYSWBOUFAIVLPEKQDT', notch: 'Z', modelName: 'M3 & M4 Naval', year: '1939' },
  'VIII': { wiring: 'FKQHTLXOCBJSPDZRAMEWNIUYGV', notch: 'Z', modelName: 'M3 & M4 Naval', year: '1939' },

  // M4 Naval Greek Rotors (Thin)
  'Beta':  { wiring: 'LEYJVCNIXWPBQMDRTAKZGFUHOS', notch: 'Z', modelName: 'M4 R2', year: 'Spring 1941' },
  'Gamma': { wiring: 'FSOKANUERHMBTIYCWLQPZXVGJD', notch: 'Z', modelName: 'M4 R2', year: 'Spring 1942' },

  // Commercial Enigma A, B (1924)
  'IC':   { wiring: 'DMTWSILRUYQNKFEJCAZBPGXOHV', notch: 'Z', modelName: 'Commercial Enigma A, B', year: '1924' },
  'IIC':  { wiring: 'HQZGPJTMOBLNCIFDYAWVEUSRKX', notch: 'Z', modelName: 'Commercial Enigma A, B', year: '1924' },
  'IIIC': { wiring: 'UQNTLSZFMREHDPXKIBVYGJCWOA', notch: 'Z', modelName: 'Commercial Enigma A, B', year: '1924' },

  // German Railway (Rocket) (1941)
  'I-Rocket':   { wiring: 'JGDQOXUSCAMIFRVTPNEWKBLZYH', notch: 'Q', modelName: 'German Railway (Rocket)', year: '7 Feb 1941' },
  'II-Rocket':  { wiring: 'NTZPSFBOKMWRCJDIVLAEYUXHGQ', notch: 'E', modelName: 'German Railway (Rocket)', year: '7 Feb 1941' },
  'III-Rocket': { wiring: 'JVIUBHTCDYAKEQZPOSGXNRMWFL', notch: 'V', modelName: 'German Railway (Rocket)', year: '7 Feb 1941' },

  // Swiss K (1939)
  'I-K':   { wiring: 'PEZUOHXSCVFMTBGLRINQJWAYDK', notch: 'Q', modelName: 'Swiss K', year: 'Feb 1939' },
  'II-K':  { wiring: 'ZOUESYDKFWPCIQXHMVBLGNJRAT', notch: 'E', modelName: 'Swiss K', year: 'Feb 1939' },
  'III-K': { wiring: 'EHRVXGAOBQUSIMZFLYNWKTPDJC', notch: 'V', modelName: 'Swiss K', year: 'Feb 1939' }
};

// Reflector Wirings (Umkehrwalze)
export const REFLECTOR_SPECS: Record<ReflectorType, { wiring: string; modelName: string; year?: string }> = {
  'Reflector A': { wiring: 'EJMZALYXVBWFCRQUONTSPIKHGD', modelName: 'Standard Reflector A' },
  'Reflector B': { wiring: 'YRUHQSLDPXNGOKMIEBFZCWVJAT', modelName: 'Standard Reflector B' },
  'Reflector C': { wiring: 'FVPJIAOYEDRZXWGCTKUQSBNMHL', modelName: 'Standard Reflector C' },
  'Reflector B Thin': { wiring: 'ENKQAUYWJICOPBLMDXZVFTHRGS', modelName: 'M4 R1 (Thin)', year: '1940' },
  'Reflector C Thin': { wiring: 'RDOBJNTKVEHMLFCWZAXGYIPSUQ', modelName: 'M4 R1 (Thin)', year: '1940' },
  'UKW-Rocket': { wiring: 'QYHOGNECVPUZTFDJAXWMKISRBL', modelName: 'German Railway (Rocket)', year: '7 Feb 1941' },
  'UKW-K': { wiring: 'IMETCGFRAYSQBZXWLHKDVUPOJN', modelName: 'Swiss K', year: 'Feb 1939' },

  // Aliases for backward compatibility
  'UKW-B': { wiring: 'YRUHQSLDPXNGOKMIEBFZCWVJAT', modelName: 'Reflector B (UKW-B)' },
  'UKW-C': { wiring: 'FVPJIAOYEDRZXWGCTKUQSBNMHL', modelName: 'Reflector C (UKW-C)' }
};

export const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function charToNum(c: string): number {
  if (!c) return 0;
  return c.toUpperCase().charCodeAt(0) - 65;
}

export function numToChar(n: number): string {
  const norm = ((n % 26) + 26) % 26;
  return String.fromCharCode(65 + norm);
}

// Convert numbers/letters format
export function formatRotorPos(num: number, format: 'number' | 'letter' = 'number'): string {
  if (format === 'number') {
    const norm = (((num % 26) + 26) % 26) + 1;
    return norm < 10 ? `0${norm}` : `${norm}`;
  }
  return numToChar(num);
}

export function formatRotorRing(ring: number, format: 'number' | 'letter' = 'number'): string {
  if (format === 'letter') {
    const norm = Math.max(1, Math.min(26, ring));
    return String.fromCharCode(64 + norm);
  }
  return ring < 10 ? `0${ring}` : `${ring}`;
}

export function getRotorNotchPos(type: RotorType): number {
  return charToNum(ROTOR_SPECS[type].notch);
}

// Formats string preview like: "UKW-B | I-II-III | 01-01-01 | 01-01-01" or "UKW-B | I-II-III-β | 01-01-01-01 | 01-01-01-01"
export function generateConfigString(config: EnigmaConfig, ringFormat: 'number' | 'letter' = 'number'): string {
  const reflector = config.reflector;
  const fourthLabel = config.fourthRotor.type === 'Beta' ? 'β' : config.fourthRotor.type === 'Gamma' ? 'γ' : config.fourthRotor.type;
  const rotors = `${config.leftRotor.type}-${config.middleRotor.type}-${config.rightRotor.type}-${fourthLabel}`;
  const starts = `${formatRotorPos(config.leftRotor.current, ringFormat)}-${formatRotorPos(config.middleRotor.current, ringFormat)}-${formatRotorPos(config.rightRotor.current, ringFormat)}-${formatRotorPos(config.fourthRotor.current, ringFormat)}`;
  const rings = `${formatRotorRing(config.leftRotor.ring, ringFormat)}-${formatRotorRing(config.middleRotor.ring, ringFormat)}-${formatRotorRing(config.rightRotor.ring, ringFormat)}-${formatRotorRing(config.fourthRotor.ring, ringFormat)}`;
  return `${reflector} | ${rotors} | ${starts} | ${rings}`;
}

/**
 * Step rotors according to standard Enigma double-stepping mechanism.
 * In original machine order (Right to Left):
 * - Right Rotor is Fast rotor (steps every keypress)
 * - Middle Rotor steps on Right rotor notch or Middle rotor notch (double-stepping)
 * - Left Rotor is Slow rotor (steps on Middle rotor notch)
 */
export function stepRotors(config: EnigmaConfig): EnigmaConfig {
  const newConfig: EnigmaConfig = JSON.parse(JSON.stringify(config));

  const rightNotch = getRotorNotchPos(newConfig.rightRotor.type);
  const middleNotch = getRotorNotchPos(newConfig.middleRotor.type);

  // Check turnover conditions BEFORE stepping
  const rightAtNotch = newConfig.rightRotor.current === rightNotch;
  const middleAtNotch = newConfig.middleRotor.current === middleNotch;

  // 1. Right (Fast) rotor ALWAYS steps
  newConfig.rightRotor.current = (newConfig.rightRotor.current + 1) % 26;

  // 2. Middle rotor steps if right (fast) rotor was at notch OR if middle rotor is at notch (double-stepping)
  if (rightAtNotch || middleAtNotch) {
    newConfig.middleRotor.current = (newConfig.middleRotor.current + 1) % 26;

    // 3. Left (Slow) rotor steps if middle rotor was at notch
    if (middleAtNotch) {
      newConfig.leftRotor.current = (newConfig.leftRotor.current + 1) % 26;
    }
  }

  return newConfig;
}

/**
 * Pass character through a rotor forward
 */
function passRotorForward(charNum: number, rotor: { type: RotorType; ring: number; current: number }): { result: number; inChar: string; outChar: string } {
  const wiring = ROTOR_SPECS[rotor.type].wiring;
  const ringOffset = rotor.ring - 1;
  const posOffset = rotor.current;
  
  // Input position shifted by rotor position and ring offset
  const shift = posOffset - ringOffset;
  const entryIndex = ((charNum + shift) % 26 + 26) % 26;
  const wiredChar = wiring[entryIndex];
  const wiredNum = charToNum(wiredChar);
  
  // Output position adjusted back for rotor position and ring offset
  const exitNum = ((wiredNum - shift) % 26 + 26) % 26;

  return {
    result: exitNum,
    inChar: numToChar(charNum),
    outChar: numToChar(exitNum)
  };
}

/**
 * Pass character through a rotor backward (reverse signal path)
 */
function passRotorBackward(charNum: number, rotor: { type: RotorType; ring: number; current: number }): { result: number; inChar: string; outChar: string } {
  const wiring = ROTOR_SPECS[rotor.type].wiring;
  const ringOffset = rotor.ring - 1;
  const posOffset = rotor.current;

  const shift = posOffset - ringOffset;
  const entryIndex = ((charNum + shift) % 26 + 26) % 26;
  const entryChar = numToChar(entryIndex);

  // Find index of entryChar in wiring
  const wiredIndex = wiring.indexOf(entryChar);
  const exitNum = ((wiredIndex - shift) % 26 + 26) % 26;

  return {
    result: exitNum,
    inChar: numToChar(charNum),
    outChar: numToChar(exitNum)
  };
}

/**
 * Encrypt a single character and return new configuration and signal trace
 * Signal flow (Right to Left):
 * Keyboard -> Plugboard In -> 4th Rotor (Fixed) -> Right Rotor (Fast) -> Middle Rotor -> Left Rotor (Slow) -> Reflector -> Left Rotor -> Middle Rotor -> Right Rotor -> 4th Rotor (Fixed) -> Plugboard Out -> Lamp
 *
 * For M3 (4th rotor at 'A' position with no wiring effect, or when 4th rotor is absent):
 * The 4th rotor still passes through but with type 'A' effectively acting as pass-through.
 * When fourthRotor.type is not Beta/Gamma, it acts as a pass-through (identity mapping).
 */
export function encryptChar(char: string, config: EnigmaConfig): { nextConfig: EnigmaConfig; result: EncryptionResult } {
  const upperChar = char.toUpperCase();
  if (!ALPHABET.includes(upperChar)) {
    return {
      nextConfig: config,
      result: {
        outputChar: upperChar,
        trace: [],
        rotorsBefore: {
          left: numToChar(config.leftRotor.current),
          middle: numToChar(config.middleRotor.current),
          right: numToChar(config.rightRotor.current),
          fourth: numToChar(config.fourthRotor.current)
        },
        rotorsAfter: {
          left: numToChar(config.leftRotor.current),
          middle: numToChar(config.middleRotor.current),
          right: numToChar(config.rightRotor.current),
          fourth: numToChar(config.fourthRotor.current)
        }
      }
    };
  }

  const rotorsBefore = {
    left: numToChar(config.leftRotor.current),
    middle: numToChar(config.middleRotor.current),
    right: numToChar(config.rightRotor.current),
    fourth: numToChar(config.fourthRotor.current)
  };

  // Step rotors prior to key contact (4th rotor does NOT step — it's a fixed stator)
  const nextConfig = stepRotors(config);

  const rotorsAfter = {
    left: numToChar(nextConfig.leftRotor.current),
    middle: numToChar(nextConfig.middleRotor.current),
    right: numToChar(nextConfig.rightRotor.current),
    fourth: numToChar(nextConfig.fourthRotor.current)
  };

  const trace: StepTrace[] = [];
  let currentNum = charToNum(upperChar);

  // 1. Plugboard In
  const pbInChar = upperChar;
  const pbOutChar = nextConfig.plugboard[pbInChar] || pbInChar;
  currentNum = charToNum(pbOutChar);
  trace.push({
    stage: 'Plugboard (In)',
    inChar: pbInChar,
    outChar: pbOutChar,
    inNum: charToNum(pbInChar),
    outNum: currentNum,
    note: nextConfig.plugboard[pbInChar] ? `Stecker: ${pbInChar} ↔ ${pbOutChar}` : 'Direct connection'
  });

  // 1.5. 4th Rotor Forward (Fixed stator — does not step, acts as additional wiring layer)
  // Only active for Beta/Gamma types; other types act as pass-through
  if (nextConfig.fourthRotor.type === 'Beta' || nextConfig.fourthRotor.type === 'Gamma') {
    const rFourthFwd = passRotorForward(currentNum, nextConfig.fourthRotor);
    currentNum = rFourthFwd.result;
    trace.push({
      stage: `4th Rotor (${nextConfig.fourthRotor.type} - Fixed)`,
      inChar: rFourthFwd.inChar,
      outChar: rFourthFwd.outChar,
      inNum: charToNum(rFourthFwd.inChar),
      outNum: currentNum,
      note: `Fixed position: ${numToChar(nextConfig.fourthRotor.current)}, Ring: ${formatRotorRing(nextConfig.fourthRotor.ring)}`
    });
  }

  // 2. Right Rotor Forward (Fast)
  const rRightFwd = passRotorForward(currentNum, nextConfig.rightRotor);
  currentNum = rRightFwd.result;
  trace.push({
    stage: `Right Rotor (${nextConfig.rightRotor.type} - Fast)`,
    inChar: rRightFwd.inChar,
    outChar: rRightFwd.outChar,
    inNum: charToNum(rRightFwd.inChar),
    outNum: currentNum,
    note: `Pos: ${numToChar(nextConfig.rightRotor.current)}, Ring: ${formatRotorRing(nextConfig.rightRotor.ring)}`
  });

  // 3. Middle Rotor Forward
  const rMidFwd = passRotorForward(currentNum, nextConfig.middleRotor);
  currentNum = rMidFwd.result;
  trace.push({
    stage: `Middle Rotor (${nextConfig.middleRotor.type})`,
    inChar: rMidFwd.inChar,
    outChar: rMidFwd.outChar,
    inNum: charToNum(rMidFwd.inChar),
    outNum: currentNum,
    note: `Pos: ${numToChar(nextConfig.middleRotor.current)}, Ring: ${formatRotorRing(nextConfig.middleRotor.ring)}`
  });

  // 4. Left Rotor Forward (Slow)
  const rLeftFwd = passRotorForward(currentNum, nextConfig.leftRotor);
  currentNum = rLeftFwd.result;
  trace.push({
    stage: `Left Rotor (${nextConfig.leftRotor.type} - Slow)`,
    inChar: rLeftFwd.inChar,
    outChar: rLeftFwd.outChar,
    inNum: charToNum(rLeftFwd.inChar),
    outNum: currentNum,
    note: `Pos: ${numToChar(nextConfig.leftRotor.current)}, Ring: ${formatRotorRing(nextConfig.leftRotor.ring)}`
  });

  // 5. Reflector (Umkehrwalze - Left)
  const reflectorSpec = REFLECTOR_SPECS[nextConfig.reflector] || REFLECTOR_SPECS['UKW-B'];
  const reflectorWiring = typeof reflectorSpec === 'string' ? reflectorSpec : reflectorSpec.wiring;
  const refInChar = numToChar(currentNum);
  const refOutChar = reflectorWiring[currentNum];
  currentNum = charToNum(refOutChar);
  trace.push({
    stage: `Reflector (${nextConfig.reflector} - Left)`,
    inChar: refInChar,
    outChar: refOutChar,
    inNum: charToNum(refInChar),
    outNum: currentNum,
    note: 'Signal reflected back'
  });

  // 6. Left Rotor Return (Slow)
  const rLeftBwd = passRotorBackward(currentNum, nextConfig.leftRotor);
  currentNum = rLeftBwd.result;
  trace.push({
    stage: `Left Rotor Return (${nextConfig.leftRotor.type})`,
    inChar: rLeftBwd.inChar,
    outChar: rLeftBwd.outChar,
    inNum: charToNum(rLeftBwd.inChar),
    outNum: currentNum
  });

  // 7. Middle Rotor Return
  const rMidBwd = passRotorBackward(currentNum, nextConfig.middleRotor);
  currentNum = rMidBwd.result;
  trace.push({
    stage: `Middle Rotor Return (${nextConfig.middleRotor.type})`,
    inChar: rMidBwd.inChar,
    outChar: rMidBwd.outChar,
    inNum: charToNum(rMidBwd.inChar),
    outNum: currentNum
  });

  // 8. Right Rotor Return (Fast)
  const rRightBwd = passRotorBackward(currentNum, nextConfig.rightRotor);
  currentNum = rRightBwd.result;
  trace.push({
    stage: `Right Rotor Return (${nextConfig.rightRotor.type})`,
    inChar: rRightBwd.inChar,
    outChar: rRightBwd.outChar,
    inNum: charToNum(rRightBwd.inChar),
    outNum: currentNum
  });

  // 8.5. 4th Rotor Return (Fixed stator — does not step)
  if (nextConfig.fourthRotor.type === 'Beta' || nextConfig.fourthRotor.type === 'Gamma') {
    const rFourthBwd = passRotorBackward(currentNum, nextConfig.fourthRotor);
    currentNum = rFourthBwd.result;
    trace.push({
      stage: `4th Rotor Return (${nextConfig.fourthRotor.type} - Fixed)`,
      inChar: rFourthBwd.inChar,
      outChar: rFourthBwd.outChar,
      inNum: charToNum(rFourthBwd.inChar),
      outNum: currentNum,
      note: `Fixed position: ${numToChar(nextConfig.fourthRotor.current)}, Ring: ${formatRotorRing(nextConfig.fourthRotor.ring)}`
    });
  }

  // 9. Plugboard Out
  const pb2InChar = numToChar(currentNum);
  const pb2OutChar = nextConfig.plugboard[pb2InChar] || pb2InChar;
  currentNum = charToNum(pb2OutChar);
  trace.push({
    stage: 'Plugboard (Out)',
    inChar: pb2InChar,
    outChar: pb2OutChar,
    inNum: charToNum(pb2InChar),
    outNum: currentNum,
    note: nextConfig.plugboard[pb2InChar] ? `Stecker: ${pb2InChar} ↔ ${pb2OutChar}` : 'Direct connection'
  });

  // Lamp illuminates final letter
  const finalOutput = numToChar(currentNum);

  return {
    nextConfig,
    result: {
      outputChar: finalOutput,
      trace,
      rotorsBefore,
      rotorsAfter
    }
  };
}

// Default initial config (M3-compatible): I-II-III | A-A-A | 01-01-01 | B
// 4th rotor defaults to 'I' (non-Beta/Gamma = pass-through) for M3 backward compatibility
export const DEFAULT_ENIGMA_CONFIG: EnigmaConfig = {
  leftRotor: { type: 'I', ring: 1, start: 0, current: 0 },
  middleRotor: { type: 'II', ring: 1, start: 0, current: 0 },
  rightRotor: { type: 'III', ring: 1, start: 0, current: 0 },
  fourthRotor: { type: 'I', ring: 1, start: 0, current: 0 },
  reflector: 'UKW-B',
  plugboard: {}
};

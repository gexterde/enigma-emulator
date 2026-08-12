var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/lib/enigmaEngine.ts
var enigmaEngine_exports = {};
__export(enigmaEngine_exports, {
  ALPHABET: () => ALPHABET,
  DEFAULT_ENIGMA_CONFIG: () => DEFAULT_ENIGMA_CONFIG,
  ENIGMA_KEYBOARD_ROWS: () => ENIGMA_KEYBOARD_ROWS,
  REFLECTOR_SPECS: () => REFLECTOR_SPECS,
  ROTOR_SPECS: () => ROTOR_SPECS,
  charToNum: () => charToNum,
  encryptChar: () => encryptChar,
  formatRotorPos: () => formatRotorPos,
  formatRotorRing: () => formatRotorRing,
  generateConfigString: () => generateConfigString,
  getRotorNotchPos: () => getRotorNotchPos,
  getRotorNotchPositions: () => getRotorNotchPositions,
  isRotorAtNotch: () => isRotorAtNotch,
  numToChar: () => numToChar,
  stepRotors: () => stepRotors
});
module.exports = __toCommonJS(enigmaEngine_exports);
var ROTOR_SPECS = {
  // Enigma I / M3 Army & Air Force
  "I": { wiring: "EKMFLGDQVZNTOWYHXUSPAIBRCJ", notch: "Q", turnoverAction: "Moving from Q \u2192 R steps the next rotor.", modelName: "Enigma I / M3", year: "1930" },
  "II": { wiring: "AJDKSIRUXBLHWTMCQGZNPYFVOE", notch: "E", turnoverAction: "Moving from E \u2192 F steps the next rotor.", modelName: "Enigma I / M3", year: "1930" },
  "III": { wiring: "BDFHJLCPRTXVZNYEIWGAKMUSQO", notch: "V", turnoverAction: "Moving from V \u2192 W steps the next rotor.", modelName: "Enigma I / M3", year: "1930" },
  "IV": { wiring: "ESOVPZJAYQUIRHXLNFTGKDCMWB", notch: "J", turnoverAction: "Moving from J \u2192 K steps the next rotor.", modelName: "M3 Army", year: "Dec 1938" },
  "V": { wiring: "VZBRGITYUPSDNHLXAWMJQOFECK", notch: "Z", turnoverAction: "Moving from Z \u2192 A steps the next rotor.", modelName: "M3 Army", year: "Dec 1938" },
  "VI": { wiring: "JPGVOUMFYQBENHZRDKASXLICTW", notch: "ZM", turnoverAction: "Two notches: Z \u2192 A and M \u2192 N step next rotor.", modelName: "M3 & M4 Naval", year: "1939" },
  "VII": { wiring: "NZJHGRCXMYSWBOUFAIVLPEKQDT", notch: "ZM", turnoverAction: "Two notches: Z \u2192 A and M \u2192 N step next rotor.", modelName: "M3 & M4 Naval", year: "1939" },
  "VIII": { wiring: "FKQHTLXOCBJSPDZRAMEWNIUYGV", notch: "ZM", turnoverAction: "Two notches: Z \u2192 A and M \u2192 N step next rotor.", modelName: "M3 & M4 Naval", year: "1939" },
  // M4 Naval Greek Rotors (Thin)
  "Beta": { wiring: "LEYJVCNIXWPBQMDRTAKZGFUHOS", notch: "Z", turnoverAction: "Fixed stator (does not step or turn next rotor)", modelName: "M4 R2", year: "Spring 1941" },
  "Gamma": { wiring: "FSOKANUERHMBTIYCWLQPZXVGJD", notch: "Z", turnoverAction: "Fixed stator (does not step or turn next rotor)", modelName: "M4 R2", year: "Spring 1942" },
  // Commercial Enigma A, B (1924)
  "IC": { wiring: "DMTWSILRUYQNKFEJCAZBPGXOHV", notch: "Z", turnoverAction: "Moving from Z \u2192 A steps the next rotor.", modelName: "Commercial Enigma A, B", year: "1924" },
  "IIC": { wiring: "HQZGPJTMOBLNCIFDYAWVEUSRKX", notch: "Z", turnoverAction: "Moving from Z \u2192 A steps the next rotor.", modelName: "Commercial Enigma A, B", year: "1924" },
  "IIIC": { wiring: "UQNTLSZFMREHDPXKIBVYGJCWOA", notch: "Z", turnoverAction: "Moving from Z \u2192 A steps the next rotor.", modelName: "Commercial Enigma A, B", year: "1924" },
  // German Railway (Rocket) (1941)
  "I-Rocket": { wiring: "JGDQOXUSCAMIFRVTPNEWKBLZYH", notch: "Q", turnoverAction: "Moving from Q \u2192 R steps the next rotor.", modelName: "German Railway (Rocket)", year: "7 Feb 1941" },
  "II-Rocket": { wiring: "NTZPSFBOKMWRCJDIVLAEYUXHGQ", notch: "E", turnoverAction: "Moving from E \u2192 F steps the next rotor.", modelName: "German Railway (Rocket)", year: "7 Feb 1941" },
  "III-Rocket": { wiring: "JVIUBHTCDYAKEQZPOSGXNRMWFL", notch: "V", turnoverAction: "Moving from V \u2192 W steps the next rotor.", modelName: "German Railway (Rocket)", year: "7 Feb 1941" },
  // Swiss K (1939)
  "I-K": { wiring: "PEZUOHXSCVFMTBGLRINQJWAYDK", notch: "Q", turnoverAction: "Moving from Q \u2192 R steps the next rotor.", modelName: "Swiss K", year: "Feb 1939" },
  "II-K": { wiring: "ZOUESYDKFWPCIQXHMVBLGNJRAT", notch: "E", turnoverAction: "Moving from E \u2192 F steps the next rotor.", modelName: "Swiss K", year: "Feb 1939" },
  "III-K": { wiring: "EHRVXGAOBQUSIMZFLYNWKTPDJC", notch: "V", turnoverAction: "Moving from V \u2192 W steps the next rotor.", modelName: "Swiss K", year: "Feb 1939" }
};
var REFLECTOR_SPECS = {
  "Reflector A": { wiring: "EJMZALYXVBWFCRQUONTSPIKHGD", modelName: "Standard Reflector A" },
  "Reflector B": { wiring: "YRUHQSLDPXNGOKMIEBFZCWVJAT", modelName: "Standard Reflector B" },
  "Reflector C": { wiring: "FVPJIAOYEDRZXWGCTKUQSBNMHL", modelName: "Standard Reflector C" },
  "Reflector B Thin": { wiring: "ENKQAUYWJICOPBLMDXZVFTHRGS", modelName: "M4 R1 (Thin)", year: "1940" },
  "Reflector C Thin": { wiring: "RDOBJNTKVEHMLFCWZAXGYIPSUQ", modelName: "M4 R1 (Thin)", year: "1940" },
  "UKW-Rocket": { wiring: "QYHOGNECVPUZTFDJAXWMKISRBL", modelName: "German Railway (Rocket)", year: "7 Feb 1941" },
  "UKW-K": { wiring: "IMETCGFRAYSQBZXWLHKDVUPOJN", modelName: "Swiss K", year: "Feb 1939" },
  // Aliases for backward compatibility
  "UKW-B": { wiring: "YRUHQSLDPXNGOKMIEBFZCWVJAT", modelName: "Reflector B (UKW-B)" },
  "UKW-C": { wiring: "FVPJIAOYEDRZXWGCTKUQSBNMHL", modelName: "Reflector C (UKW-C)" },
  "UKW-Dual-Dynamic": { wiring: "EKMFLGDQVZNTOWYHXUSPAIBRCJ", modelName: "Combined Self-Coder (Dynamic)", year: "Alternative 1943" }
};
var ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
function charToNum(c) {
  if (!c) return 0;
  return c.toUpperCase().charCodeAt(0) - 65;
}
function numToChar(n) {
  const norm = (n % 26 + 26) % 26;
  return String.fromCharCode(65 + norm);
}
function formatRotorPos(num, format = "number") {
  if (format === "number") {
    const norm = (num % 26 + 26) % 26 + 1;
    return norm < 10 ? `0${norm}` : `${norm}`;
  }
  return numToChar(num);
}
function formatRotorRing(ring, format = "number") {
  if (format === "letter") {
    const norm = Math.max(1, Math.min(26, ring));
    return String.fromCharCode(64 + norm);
  }
  return ring < 10 ? `0${ring}` : `${ring}`;
}
function getRotorNotchPositions(type) {
  const spec = ROTOR_SPECS[type];
  if (!spec || !spec.notch) return [0];
  return Array.from(spec.notch).map((ch) => charToNum(ch));
}
function isRotorAtNotch(type, currentPos) {
  const notches = getRotorNotchPositions(type);
  return notches.includes(currentPos);
}
function getRotorNotchPos(type) {
  return getRotorNotchPositions(type)[0] || 0;
}
function generateConfigString(config, ringFormat = "number") {
  const reflectorName = typeof config.reflector === "object" && config.reflector !== null ? config.reflector.type : config.reflector || "UKW-B";
  const isM4 = config.fourthRotor.type === "Beta" || config.fourthRotor.type === "Gamma";
  const isUKWDual = reflectorName === "UKW-Dual-Dynamic";
  let rotors = `${config.leftRotor.type}-${config.middleRotor.type}-${config.rightRotor.type}`;
  if (isM4) {
    const fourthLabel = config.fourthRotor.type === "Beta" ? "\u03B2" : "\u03B3";
    rotors = `${fourthLabel}-${rotors}`;
  }
  if (isUKWDual) {
    rotors = `UKW-Dual-${rotors}`;
  }
  let starts = `${formatRotorPos(config.leftRotor.current, ringFormat)}-${formatRotorPos(config.middleRotor.current, ringFormat)}-${formatRotorPos(config.rightRotor.current, ringFormat)}`;
  if (isM4) {
    starts = `${formatRotorPos(config.fourthRotor.current, ringFormat)}-${starts}`;
  }
  if (isUKWDual) {
    const refPos = typeof config.reflector === "object" && config.reflector !== null ? config.reflector.current : 0;
    starts = `${formatRotorPos(refPos, ringFormat)}-${starts}`;
  }
  let rings = `${formatRotorRing(config.leftRotor.ring, ringFormat)}-${formatRotorRing(config.middleRotor.ring, ringFormat)}-${formatRotorRing(config.rightRotor.ring, ringFormat)}`;
  if (isM4) {
    rings = `${formatRotorRing(config.fourthRotor.ring, ringFormat)}-${rings}`;
  }
  if (isUKWDual) {
    const refRing = typeof config.reflector === "object" && config.reflector !== null ? config.reflector.ring : 1;
    rings = `${formatRotorRing(refRing, ringFormat)}-${rings}`;
  }
  return `${reflectorName} | ${rotors} | ${rings} | ${starts}`;
}
function stepRotors(config) {
  const newConfig = JSON.parse(JSON.stringify(config));
  const rightAtNotch = isRotorAtNotch(newConfig.rightRotor.type, newConfig.rightRotor.current);
  const middleAtNotch = isRotorAtNotch(newConfig.middleRotor.type, newConfig.middleRotor.current);
  newConfig.rightRotor.current = (newConfig.rightRotor.current + 1) % 26;
  if (rightAtNotch || middleAtNotch) {
    newConfig.middleRotor.current = (newConfig.middleRotor.current + 1) % 26;
    if (middleAtNotch) {
      newConfig.leftRotor.current = (newConfig.leftRotor.current + 1) % 26;
      if (newConfig.reflector.type === "UKW-Dual-Dynamic") {
        newConfig.reflector.current = (newConfig.reflector.current + 1) % 26;
      }
    }
  }
  return newConfig;
}
function passRotorForward(charNum, rotor) {
  const wiring = ROTOR_SPECS[rotor.type].wiring;
  const ringOffset = rotor.ring - 1;
  const posOffset = rotor.current;
  const shift = posOffset - ringOffset;
  const entryIndex = ((charNum + shift) % 26 + 26) % 26;
  const wiredChar = wiring[entryIndex];
  const wiredNum = charToNum(wiredChar);
  const exitNum = ((wiredNum - shift) % 26 + 26) % 26;
  return {
    result: exitNum,
    inChar: numToChar(charNum),
    outChar: numToChar(exitNum)
  };
}
function passRotorBackward(charNum, rotor) {
  const wiring = ROTOR_SPECS[rotor.type].wiring;
  const ringOffset = rotor.ring - 1;
  const posOffset = rotor.current;
  const shift = posOffset - ringOffset;
  const entryIndex = ((charNum + shift) % 26 + 26) % 26;
  const entryChar = numToChar(entryIndex);
  const wiredIndex = wiring.indexOf(entryChar);
  const exitNum = ((wiredIndex - shift) % 26 + 26) % 26;
  return {
    result: exitNum,
    inChar: numToChar(charNum),
    outChar: numToChar(exitNum)
  };
}
function encryptChar(char, config) {
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
          fourth: numToChar(config.fourthRotor.current),
          reflector: numToChar(config.reflector?.current || 0)
        },
        rotorsAfter: {
          left: numToChar(config.leftRotor.current),
          middle: numToChar(config.middleRotor.current),
          right: numToChar(config.rightRotor.current),
          fourth: numToChar(config.fourthRotor.current),
          reflector: numToChar(config.reflector?.current || 0)
        }
      }
    };
  }
  const rotorsBefore = {
    left: numToChar(config.leftRotor.current),
    middle: numToChar(config.middleRotor.current),
    right: numToChar(config.rightRotor.current),
    fourth: numToChar(config.fourthRotor.current),
    reflector: numToChar(config.reflector?.current || 0)
  };
  const nextConfig = stepRotors(config);
  const rotorsAfter = {
    left: numToChar(nextConfig.leftRotor.current),
    middle: numToChar(nextConfig.middleRotor.current),
    right: numToChar(nextConfig.rightRotor.current),
    fourth: numToChar(nextConfig.fourthRotor.current),
    reflector: numToChar(config.reflector?.current || 0)
  };
  const trace = [];
  let currentNum = charToNum(upperChar);
  const pbInChar = upperChar;
  const pbOutChar = nextConfig.plugboard[pbInChar] || pbInChar;
  currentNum = charToNum(pbOutChar);
  trace.push({
    stage: "Plugboard (In)",
    inChar: pbInChar,
    outChar: pbOutChar,
    inNum: charToNum(pbInChar),
    outNum: currentNum,
    note: nextConfig.plugboard[pbInChar] ? `Stecker: ${pbInChar} \u2194 ${pbOutChar}` : "Direct connection"
  });
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
  if (nextConfig.fourthRotor.type === "Beta" || nextConfig.fourthRotor.type === "Gamma") {
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
  const reflectorState = nextConfig.reflector;
  const reflectorSpec = REFLECTOR_SPECS[reflectorState.type] || REFLECTOR_SPECS["UKW-B"];
  const reflectorWiring = typeof reflectorSpec === "string" ? reflectorSpec : reflectorSpec.wiring;
  const refInChar = numToChar(currentNum);
  let refOutChar;
  let refNote = `Signal reflected back using ${reflectorState.type}`;
  if (reflectorState.type === "UKW-Dual-Dynamic") {
    const shift = (reflectorState.current - (reflectorState.ring - 1) + 26) % 26;
    const indexWithShift = (currentNum + shift) % 26;
    const forwardChar = reflectorWiring[indexWithShift];
    const forwardNum = charToNum(forwardChar);
    const postRefNum = (forwardNum - shift + 26) % 26;
    refOutChar = numToChar(postRefNum);
    if (postRefNum === currentNum) {
      refNote = `Critical Self-Coding! ${refInChar} \u2794 ${refOutChar} (Turing-Welchman Bombe loop broken)`;
    } else {
      refNote = `Dynamic asymmetric reflection`;
    }
  } else {
    refOutChar = reflectorWiring[currentNum];
  }
  currentNum = charToNum(refOutChar);
  trace.push({
    stage: `Reflector (${nextConfig.reflector.type} - Left)`,
    inChar: refInChar,
    outChar: refOutChar,
    inNum: charToNum(refInChar),
    outNum: currentNum,
    note: "Signal reflected back"
  });
  if (nextConfig.fourthRotor.type === "Beta" || nextConfig.fourthRotor.type === "Gamma") {
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
  const rLeftBwd = passRotorBackward(currentNum, nextConfig.leftRotor);
  currentNum = rLeftBwd.result;
  trace.push({
    stage: `Left Rotor Return (${nextConfig.leftRotor.type})`,
    inChar: rLeftBwd.inChar,
    outChar: rLeftBwd.outChar,
    inNum: charToNum(rLeftBwd.inChar),
    outNum: currentNum
  });
  const rMidBwd = passRotorBackward(currentNum, nextConfig.middleRotor);
  currentNum = rMidBwd.result;
  trace.push({
    stage: `Middle Rotor Return (${nextConfig.middleRotor.type})`,
    inChar: rMidBwd.inChar,
    outChar: rMidBwd.outChar,
    inNum: charToNum(rMidBwd.inChar),
    outNum: currentNum
  });
  const rRightBwd = passRotorBackward(currentNum, nextConfig.rightRotor);
  currentNum = rRightBwd.result;
  trace.push({
    stage: `Right Rotor Return (${nextConfig.rightRotor.type})`,
    inChar: rRightBwd.inChar,
    outChar: rRightBwd.outChar,
    inNum: charToNum(rRightBwd.inChar),
    outNum: currentNum
  });
  const pb2InChar = numToChar(currentNum);
  const pb2OutChar = nextConfig.plugboard[pb2InChar] || pb2InChar;
  currentNum = charToNum(pb2OutChar);
  trace.push({
    stage: "Plugboard (Out)",
    inChar: pb2InChar,
    outChar: pb2OutChar,
    inNum: charToNum(pb2InChar),
    outNum: currentNum,
    note: nextConfig.plugboard[pb2InChar] ? `Stecker: ${pb2InChar} \u2194 ${pb2OutChar}` : "Direct connection"
  });
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
var DEFAULT_ENIGMA_CONFIG = {
  leftRotor: { type: "I", ring: 1, start: 0, current: 0 },
  middleRotor: { type: "II", ring: 1, start: 0, current: 0 },
  rightRotor: { type: "III", ring: 1, start: 0, current: 0 },
  fourthRotor: { type: "I", ring: 1, start: 0, current: 0 },
  reflector: {
    type: "UKW-B",
    ring: 1,
    start: 0,
    current: 0
  },
  plugboard: {},
  senderCallSign: "DFS"
};
var ENIGMA_KEYBOARD_ROWS = [
  ["Q", "W", "E", "R", "T", "Z", "U", "I", "O"],
  ["A", "S", "D", "F", "G", "H", "J", "K"],
  ["P", "Y", "X", "C", "V", "B", "N", "M", "L"]
];
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ALPHABET,
  DEFAULT_ENIGMA_CONFIG,
  ENIGMA_KEYBOARD_ROWS,
  REFLECTOR_SPECS,
  ROTOR_SPECS,
  charToNum,
  encryptChar,
  formatRotorPos,
  formatRotorRing,
  generateConfigString,
  getRotorNotchPos,
  getRotorNotchPositions,
  isRotorAtNotch,
  numToChar,
  stepRotors
});

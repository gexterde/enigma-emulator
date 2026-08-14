// Web Worker engine for non-blocking Turing-Welchman Bombe cryptanalysis
// Handles high-speed 3-rotor / 4-rotor searches off the main UI thread

export interface BombeWorkerTask {
  bombeEngineMode: 'welchman_diagonal' | 'direct_scan';
  rotorCombs: Array<{ left: string; middle: string; right: string }>;
  precalculatedOffsets: Array<{
    offset: number;
    menuEdges: Array<{ i: number; p: number; c: number }>;
    testNode: number;
    validLetterPairs: Array<{ index: number; cipherNum: number; cribNum: number }>;
  }>;
  leftRotorRing: number;
  middleRotorRing: number;
  rightRotorRing: number;
  fourthRotorType: string;
  fourthRotorRing: number;
  fourthRotorStart: number;
  reflectorType: string;
  reflectorWiring: number[];
  reflectorRing: number;
  reflectorStart: number;
  hasDualReflector: boolean;
  knownSteckersStr: string;
  plugboardMap: number[];
  autoRefineIterative: boolean;
  batchSize: number;
}

export interface BombeWorkerProgressMessage {
  type: 'progress';
  progress: number;
  currentScan: [string, string, string];
  currentRotorComb: string;
  currentScanOffset: number;
  foundMatchesCount: number;
}

export interface BombeWorkerStopFoundMessage {
  type: 'stop_found';
  stopData: {
    leftRotor: string;
    middleRotor: string;
    rightRotor: string;
    left: string;
    middle: string;
    right: string;
    offset: number;
    deducedSteckers?: Record<string, string>;
    stopHypothesis?: string;
  };
}

export interface BombeWorkerCompleteMessage {
  type: 'complete';
  rawMatches: Array<{
    leftRotor: string;
    middleRotor: string;
    rightRotor: string;
    left: string;
    middle: string;
    right: string;
    offset: number;
    deducedSteckers?: Record<string, string>;
    stopHypothesis?: string;
  }>;
}

export type BombeWorkerMessage =
  | BombeWorkerProgressMessage
  | BombeWorkerStopFoundMessage
  | BombeWorkerCompleteMessage;

// Inline self-contained worker code string
const WORKER_SCRIPT = `
const ROTOR_SPECS = {
  'I':     { wiring: 'EKMFLGDQVZNTOWYHXUSPAIBRCJ', notches: ['Q'] },
  'II':    { wiring: 'AJDKSIRUXBLHWTMCQGZNPYFVOE', notches: ['E'] },
  'III':   { wiring: 'BDFHJLCPRTXVZNYEIWGAKMUSQO', notches: ['V'] },
  'IV':    { wiring: 'ESOVPZJAYQUIRHXLNFTGKDCMWB', notches: ['J'] },
  'V':     { wiring: 'VZBRGITYUPSDNHLXAWMJQOFECK', notches: ['Z'] },
  'VI':    { wiring: 'JPGVOUMFYQBENHZRDKASXLICTW', notches: ['Z', 'M'] },
  'VII':   { wiring: 'NZJHGRCXMYSWBOUFAIVPEQLSET', notches: ['Z', 'M'] },
  'VIII':  { wiring: 'FKQHTLXOCBJSPDZRAMEWNIUYGV', notches: ['Z', 'M'] },
  'Beta':  { wiring: 'LEYJVCNIXWPBQMDRTAKZGFUHOS', notches: [] },
  'Gamma': { wiring: 'FSOKANUERHMBTIYCWLQPZXVGJD', notches: [] },
};

function charToNum(c) {
  return c.charCodeAt(0) - 65;
}

function numToChar(n) {
  return String.fromCharCode(65 + ((n % 26 + 26) % 26));
}

function getRotorNotchPositions(type) {
  const spec = ROTOR_SPECS[type] || ROTOR_SPECS['I'];
  return spec.notches.map(charToNum);
}

function prepareRotor(type, ringSetting) {
  const spec = ROTOR_SPECS[type] || ROTOR_SPECS['I'];
  const wiring = spec.wiring.split('').map(charToNum);
  const notches = getRotorNotchPositions(type);
  const wiringFwd = new Array(26);
  const wiringBwd = new Array(26);

  for (let i = 0; i < 26; i++) {
    const forwardOutput = wiring[i];
    wiringFwd[i] = forwardOutput;
    wiringBwd[forwardOutput] = i;
  }

  return { wiringFwd, wiringBwd, notches, ring: ringSetting };
}

function passRotorForwardFast(inChar, position, ringSetting, wiringFwd) {
  const shift = (position - (ringSetting - 1) + 26) % 26;
  const indexWithShift = (inChar + shift) % 26;
  const forwardNum = wiringFwd[indexWithShift];
  return (forwardNum - shift + 26) % 26;
}

function passRotorBackwardFast(inChar, position, ringSetting, wiringBwd) {
  const shift = (position - (ringSetting - 1) + 26) % 26;
  const indexWithShift = (inChar + shift) % 26;
  const backwardNum = wiringBwd[indexWithShift];
  return (backwardNum - shift + 26) % 26;
}

function parseKnownSteckers(input) {
  const map = {};
  if (!input) return map;
  const cleaned = input.toUpperCase().replace(/[^A-Z]/g, '');
  for (let i = 0; i < cleaned.length - 1; i += 2) {
    const a = cleaned[i];
    const b = cleaned[i + 1];
    if (a !== b) {
      map[a] = b;
      map[b] = a;
    }
  }
  return map;
}

function testWelchmanDiagonalBoardPosWorker(
  leftStart, middleStart, rightStart,
  menuEdges, testNode,
  leftR, middleR, rightR, fourthR, fourthRotorStartVal,
  reflectorWiring, hasDualReflector, reflectorRingSetting, reflectorStartVal,
  knownSteckersMap
) {
  // 1. Calculate stepped scrambler mappings for each menu edge
  const scramblers = menuEdges.map((e) => {
    let lc = leftStart;
    let mc = middleStart;
    let rc = rightStart;
    let reflectorCurr = reflectorStartVal;

    // Step rotors (e.i + 1) times because character at offset e.i steps before electrical key contact
    for (let step = 0; step <= e.i; step++) {
      const rightAtNotch = rightR.notches.includes(rc);
      const middleAtNotch = middleR.notches.includes(mc);
      rc = (rc + 1) % 26;
      if (rightAtNotch || middleAtNotch) {
        mc = (mc + 1) % 26;
        if (middleAtNotch) {
          lc = (lc + 1) % 26;
          if (hasDualReflector) {
            reflectorCurr = (reflectorCurr + 1) % 26;
          }
        }
      }
    }

    // Compute forward 26x26 mapping for this scrambler stack
    const map = new Array(26);
    for (let inChar = 0; inChar < 26; inChar++) {
      let currentNum = inChar;
      currentNum = passRotorForwardFast(currentNum, rc, rightR.ring, rightR.wiringFwd);
      currentNum = passRotorForwardFast(currentNum, mc, middleR.ring, middleR.wiringFwd);
      currentNum = passRotorForwardFast(currentNum, lc, leftR.ring, leftR.wiringFwd);
      
      // 4-Rotor U-boat Enigma M4 support
      if (fourthR) {
        currentNum = passRotorForwardFast(currentNum, fourthRotorStartVal, fourthR.ring, fourthR.wiringFwd);
      }
      
      if (hasDualReflector) {
        const shift = (reflectorCurr - (reflectorRingSetting - 1) + 26) % 26;
        const indexWithShift = (currentNum + shift) % 26;
        const forwardNum = reflectorWiring[indexWithShift];
        currentNum = (forwardNum - shift + 26) % 26;
      } else {
        currentNum = reflectorWiring[currentNum];
      }

      // 4-Rotor U-boat Enigma M4 return path
      if (fourthR) {
        currentNum = passRotorBackwardFast(currentNum, fourthRotorStartVal, fourthR.ring, fourthR.wiringBwd);
      }

      currentNum = passRotorBackwardFast(currentNum, lc, leftR.ring, leftR.wiringBwd);
      currentNum = passRotorBackwardFast(currentNum, mc, middleR.ring, middleR.wiringBwd);
      currentNum = passRotorBackwardFast(currentNum, rc, rightR.ring, rightR.wiringBwd);
      map[inChar] = currentNum;
    }

    return { pNode: e.p, cNode: e.c, map };
  });

  // 2. Test candidate stecker hypotheses for testNode (k = 0..25)
  for (let k = 0; k < 26; k++) {
    // If testNode has a known stecker pair and k contradicts it, skip hypothesis
    if (knownSteckersMap[numToChar(testNode)] && knownSteckersMap[numToChar(testNode)] !== numToChar(k)) {
      continue;
    }

    const energized = new Uint8Array(676); // 26 nodes x 26 stecker wires
    const queue = [];

    energized[testNode * 26 + k] = 1;
    queue.push(testNode * 26 + k);

    // Seed known steckers into energized circuit
    for (const [knStr, ksStr] of Object.entries(knownSteckersMap)) {
      const kn = charToNum(knStr);
      const ks = charToNum(ksStr);
      const wire = kn * 26 + ks;
      if (!energized[wire]) {
        energized[wire] = 1;
        queue.push(wire);
      }
    }

    let head = 0;
    let hasContradiction = false;

    while (head < queue.length) {
      const wire = queue[head++];
      const node = Math.floor(wire / 26);
      const stecker = wire % 26;

      // Contradiction check against known steckers
      if (knownSteckersMap[numToChar(node)] && knownSteckersMap[numToChar(node)] !== numToChar(stecker)) {
        hasContradiction = true;
        break;
      }

      // a) Gordon Welchman's Diagonal Board: connect (node, stecker) <-> (stecker, node)
      const diagWire = stecker * 26 + node;
      if (!energized[diagWire]) {
        energized[diagWire] = 1;
        queue.push(diagWire);
      }

      // b) Scrambler Menu propagation across all edges
      for (let sIdx = 0; sIdx < scramblers.length; sIdx++) {
        const sc = scramblers[sIdx];
        if (sc.pNode === node) {
          const targetWire = sc.cNode * 26 + sc.map[stecker];
          if (!energized[targetWire]) {
            energized[targetWire] = 1;
            queue.push(targetWire);
          }
        }
        if (sc.cNode === node) {
          const targetWire = sc.pNode * 26 + sc.map[stecker];
          if (!energized[targetWire]) {
            energized[targetWire] = 1;
            queue.push(targetWire);
          }
        }
      }
    }

    if (hasContradiction) {
      continue; // Discard contradictory hypothesis
    }

    // Count how many wires for testNode were energized
    let testNodeEnergizedCount = 0;
    for (let s = 0; s < 26; s++) {
      if (energized[testNode * 26 + s]) testNodeEnergizedCount++;
    }

    // If less than 26 wires energized (specifically < 26), we hit a BOMBE STOP!
    if (testNodeEnergizedCount < 26) {
      const deducedSteckers = {};
      for (let n = 0; n < 26; n++) {
        const energizedForNode = [];
        for (let s = 0; s < 26; s++) {
          if (energized[n * 26 + s]) energizedForNode.push(numToChar(s));
        }
        if (energizedForNode.length === 1) {
          deducedSteckers[numToChar(n)] = energizedForNode[0];
        }
      }

      return {
        isStop: true,
        deducedSteckers,
        stopHypothesis: numToChar(k),
      };
    }
  }

  return { isStop: false, deducedSteckers: {}, stopHypothesis: '' };
}

function testStartPosWorker(
  leftStart, middleStart, rightStart,
  validLetterPairs,
  leftR, middleR, rightR, fourthR, fourthRotorStartVal,
  reflectorWiring, hasDualReflector, reflectorRingSetting, reflectorStartVal,
  plugboardMap
) {
  let leftCurrent = leftStart;
  let middleCurrent = middleStart;
  let rightCurrent = rightStart;
  let reflectorCurrent = reflectorStartVal;

  if (validLetterPairs.length === 0) return false;

  let pairIdx = 0;
  const maxStep = validLetterPairs[validLetterPairs.length - 1].index;

  for (let step = 0; step <= maxStep; step++) {
    // 1. Step Rotors BEFORE key electrical contact
    const rightAtNotch = rightR.notches.includes(rightCurrent);
    const middleAtNotch = middleR.notches.includes(middleCurrent);

    rightCurrent = (rightCurrent + 1) % 26;
    if (rightAtNotch || middleAtNotch) {
      middleCurrent = (middleCurrent + 1) % 26;
      if (middleAtNotch) {
        leftCurrent = (leftCurrent + 1) % 26;
        if (hasDualReflector) {
          reflectorCurrent = (reflectorCurrent + 1) % 26;
        }
      }
    }

    // Check if current step corresponds to a valid crib-ciphertext letter pair
    if (pairIdx < validLetterPairs.length && validLetterPairs[pairIdx].index === step) {
      const pair = validLetterPairs[pairIdx++];

      // 2a. Plugboard In
      let currentNum = plugboardMap[pair.cipherNum];

      // 2b-2d. Rotors Forward
      currentNum = passRotorForwardFast(currentNum, rightCurrent, rightR.ring, rightR.wiringFwd);
      currentNum = passRotorForwardFast(currentNum, middleCurrent, middleR.ring, middleR.wiringFwd);
      currentNum = passRotorForwardFast(currentNum, leftCurrent, leftR.ring, leftR.wiringFwd);

      // 2e. 4th Rotor Forward
      if (fourthR) {
        currentNum = passRotorForwardFast(currentNum, fourthRotorStartVal, fourthR.ring, fourthR.wiringFwd);
      }

      // 2f. Reflector
      if (hasDualReflector) {
        const shift = (reflectorCurrent - (reflectorRingSetting - 1) + 26) % 26;
        const indexWithShift = (currentNum + shift) % 26;
        const forwardNum = reflectorWiring[indexWithShift];
        currentNum = (forwardNum - shift + 26) % 26;
      } else {
        currentNum = reflectorWiring[currentNum];
      }

      // 2g. 4th Rotor Backward
      if (fourthR) {
        currentNum = passRotorBackwardFast(currentNum, fourthRotorStartVal, fourthR.ring, fourthR.wiringBwd);
      }

      // 2h-2j. Rotors Backward
      currentNum = passRotorBackwardFast(currentNum, leftCurrent, leftR.ring, leftR.wiringBwd);
      currentNum = passRotorBackwardFast(currentNum, middleCurrent, middleR.ring, middleR.wiringBwd);
      currentNum = passRotorBackwardFast(currentNum, rightCurrent, rightR.ring, rightR.wiringBwd);

      // 2k. Plugboard Out
      currentNum = plugboardMap[currentNum];

      // 3. Early Abort if letter decrypts differently than aligned crib letter
      if (currentNum !== pair.cribNum) {
        return false;
      }
    }
  }

  return true;
}

let isCancelled = false;

self.onmessage = function(e) {
  const { command, payload } = e.data;

  if (command === 'cancel') {
    isCancelled = true;
    return;
  }

  if (command === 'start') {
    isCancelled = false;
    const {
      bombeEngineMode,
      rotorCombs,
      precalculatedOffsets,
      leftRotorRing,
      middleRotorRing,
      rightRotorRing,
      fourthRotorType,
      fourthRotorRing,
      fourthRotorStart,
      reflectorWiring,
      hasDualReflector,
      reflectorRing,
      reflectorStart,
      knownSteckersStr,
      plugboardMap,
      autoRefineIterative,
      batchSize
    } = payload;

    let activeKnownSteckersMap = parseKnownSteckers(knownSteckersStr);

    const isM4 = fourthRotorType === 'Beta' || fourthRotorType === 'Gamma';
    const fourthR = isM4 ? prepareRotor(fourthRotorType, fourthRotorRing) : null;

    const totalCombinationsPerRotor = 17576;
    const rotorCache = {};
    function getCachedRotor(type, ring) {
      const key = type + '-' + ring;
      if (!rotorCache[key]) {
        rotorCache[key] = prepareRotor(type, ring);
      }
      return rotorCache[key];
    }

    const rawMatches = [];
    const totalSteps = rotorCombs.length * totalCombinationsPerRotor * precalculatedOffsets.length;

    let currentCombIndex = 0;
    let combinationIndex = 0;

    function processBatch() {
      if (isCancelled) return;

      if (currentCombIndex >= rotorCombs.length) {
        self.postMessage({ type: 'complete', rawMatches });
        return;
      }

      const activeComb = rotorCombs[currentCombIndex];
      const leftR = getCachedRotor(activeComb.left, leftRotorRing);
      const middleR = getCachedRotor(activeComb.middle, middleRotorRing);
      const rightR = getCachedRotor(activeComb.right, rightRotorRing);

      const limit = Math.min(combinationIndex + (batchSize || 1000), totalCombinationsPerRotor);

      for (let c = combinationIndex; c < limit; c++) {
        const r = c % 26;
        const m = Math.floor(c / 26) % 26;
        const l = Math.floor(c / 676) % 26;

        for (let pIdx = 0; pIdx < precalculatedOffsets.length; pIdx++) {
          const precalc = precalculatedOffsets[pIdx];

          if (bombeEngineMode === 'welchman_diagonal') {
            const result = testWelchmanDiagonalBoardPosWorker(
              l, m, r,
              precalc.menuEdges,
              precalc.testNode,
              leftR, middleR, rightR, fourthR, fourthRotorStart,
              reflectorWiring, hasDualReflector, reflectorRing, reflectorStart,
              activeKnownSteckersMap
            );

            if (result.isStop) {
              const stopMatch = {
                leftRotor: activeComb.left,
                middleRotor: activeComb.middle,
                rightRotor: activeComb.right,
                left: numToChar(l),
                middle: numToChar(m),
                right: numToChar(r),
                offset: precalc.offset,
                deducedSteckers: result.deducedSteckers,
                stopHypothesis: result.stopHypothesis,
              };

              rawMatches.push(stopMatch);
              self.postMessage({ type: 'stop_found', stopData: stopMatch });

              // If Auto-Iterative Refinement is enabled, feed newly deduced steckers into knownSteckersMap
              if (autoRefineIterative && result.deducedSteckers && Object.keys(result.deducedSteckers).length > 0) {
                Object.assign(activeKnownSteckersMap, result.deducedSteckers);
              }
            }
          } else {
            const isMatch = testStartPosWorker(
              l, m, r,
              precalc.validLetterPairs,
              leftR, middleR, rightR, fourthR, fourthRotorStart,
              reflectorWiring, hasDualReflector, reflectorRing, reflectorStart,
              plugboardMap
            );

            if (isMatch) {
              const directMatch = {
                leftRotor: activeComb.left,
                middleRotor: activeComb.middle,
                rightRotor: activeComb.right,
                left: numToChar(l),
                middle: numToChar(m),
                right: numToChar(r),
                offset: precalc.offset,
              };

              rawMatches.push(directMatch);
              self.postMessage({ type: 'stop_found', stopData: directMatch });
            }
          }
        }
      }

      combinationIndex = limit;

      if (combinationIndex >= totalCombinationsPerRotor) {
        currentCombIndex++;
        combinationIndex = 0;
      }

      const completedSteps = (currentCombIndex * totalCombinationsPerRotor + combinationIndex) * precalculatedOffsets.length;
      const progress = Math.min(100, Math.round((completedSteps / (totalSteps || 1)) * 100));

      const activeCombReport = rotorCombs[Math.min(currentCombIndex, rotorCombs.length - 1)];
      const lastR = (limit - 1) % 26;
      const lastM = Math.floor((limit - 1) / 26) % 26;
      const lastL = Math.floor((limit - 1) / 676) % 26;

      self.postMessage({
        type: 'progress',
        progress,
        currentScan: [numToChar(lastL < 0 ? 0 : lastL), numToChar(lastM < 0 ? 0 : lastM), numToChar(lastR < 0 ? 0 : lastR)],
        currentRotorComb: activeCombReport.left + '-' + activeCombReport.middle + '-' + activeCombReport.right,
        currentScanOffset: precalculatedOffsets.length > 0 ? precalculatedOffsets[0].offset : 0,
        foundMatchesCount: rawMatches.length
      });

      setTimeout(processBatch, 0);
    }

    processBatch();
  }
};
`;

let workerBlobUrl: string | null = null;

export function getOrCreateBombeWorker(): Worker {
  if (!workerBlobUrl) {
    const blob = new Blob([WORKER_SCRIPT], { type: 'application/javascript' });
    workerBlobUrl = URL.createObjectURL(blob);
  }
  return new Worker(workerBlobUrl);
}

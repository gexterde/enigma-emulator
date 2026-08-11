import React, { useState, useMemo, useEffect, useRef } from 'react';
import { EnigmaConfig } from '../types';
import {
  ROTOR_SPECS,
  REFLECTOR_SPECS,
  charToNum,
  numToChar,
  formatRotorPos,
  formatRotorRing,
  encryptChar,
  getRotorNotchPositions,
} from '../lib/enigmaEngine';
import { playRotorClickSound } from '../lib/audio';

interface CryptanalysisViewProps {
  config: EnigmaConfig;
  onUpdateConfig: (newConfig: EnigmaConfig) => void;
  cipherTape: string;
  inputTape: string;
  setActiveTab: (tab: 'machine' | 'plugboard' | 'rotors' | 'log' | 'codebook' | 'morseTrainer' | 'frequency' | 'cryptanalysis') => void;
  soundEnabled: boolean;
}

interface RotorStateFast {
  wiringFwd: number[];
  wiringBwd: number[];
  notches: number[];
  ring: number;
}

export const CryptanalysisView: React.FC<CryptanalysisViewProps> = ({
  config,
  onUpdateConfig,
  cipherTape,
  inputTape,
  setActiveTab,
  soundEnabled,
}) => {
  // Input states
  const [ciphertext, setCiphertext] = useState<string>('');
  const [crib, setCrib] = useState<string>('');
  const [alignmentOffset, setAlignmentOffset] = useState<number>(0);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll the comparison grid to follow the alignment offset
  useEffect(() => {
    if (scrollContainerRef.current) {
      const charWidth = 32; // 28px box width + 4px gap
      const targetScrollLeft = Math.max(0, (alignmentOffset * charWidth) - 120);
      scrollContainerRef.current.scrollTo({
        left: targetScrollLeft,
        behavior: 'smooth'
      });
    }
  }, [alignmentOffset]);

  // Search parameters (defaults to current machine settings)
  const [leftRotorType, setLeftRotorType] = useState<string>(config.leftRotor.type);
  const [middleRotorType, setMiddleRotorType] = useState<string>(config.middleRotor.type);
  const [rightRotorType, setRightRotorType] = useState<string>(config.rightRotor.type);
  const [leftRotorRing, setLeftRotorRing] = useState<number>(config.leftRotor.ring);
  const [middleRotorRing, setMiddleRotorRing] = useState<number>(config.middleRotor.ring);
  const [rightRotorRing, setRightRotorRing] = useState<number>(config.rightRotor.ring);
  
  const [fourthRotorType, setFourthRotorType] = useState<string>(config.fourthRotor.type);
  const [fourthRotorRing, setFourthRotorRing] = useState<number>(config.fourthRotor.ring);
  const [fourthRotorStart, setFourthRotorStart] = useState<number>(config.fourthRotor.current);

  const [reflectorType, setReflectorType] = useState<string>(config.reflector.type);
  const [reflectorRing, setReflectorRing] = useState<number>(config.reflector.ring);
  const [reflectorStart, setReflectorStart] = useState<number>(config.reflector.current);

  const [plugboardMode, setPlugboardMode] = useState<'active' | 'none'>('active');

  // Bombe Cryptanalysis Engine Mode
  const [bombeEngineMode, setBombeEngineMode] = useState<'welchman_diagonal' | 'direct_scan'>('welchman_diagonal');

  // Interactive Inspector Drawers
  const [showMenuGraphModal, setShowMenuGraphModal] = useState<boolean>(false);
  const [showDiagonalBoardModal, setShowDiagonalBoardModal] = useState<boolean>(false);

  // Search scope (single selected, 3-rotor permutations, or 5/8 rotor pools)
  const [rotorScanScope, setRotorScanScope] = useState<'selected' | 'permutations_3' | 'all_5' | 'all_8'>('selected');

  // Crib alignment scan mode
  const [alignmentScanMode, setAlignmentScanMode] = useState<'current' | 'all_viable'>('current');

  // Ringstellung alignment mapper states (converts relative dial offsets to physical window starts for custom ring settings)
  const [mapperLeftRing, setMapperLeftRing] = useState<number>(config.leftRotor.ring);
  const [mapperMiddleRing, setMapperMiddleRing] = useState<number>(config.middleRotor.ring);
  const [mapperRightRing, setMapperRightRing] = useState<number>(config.rightRotor.ring);

  // Search running states
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [currentScan, setCurrentScan] = useState<string[]>(['A', 'A', 'A']);
  const [matches, setMatches] = useState<Array<{
    leftRotor: string;
    middleRotor: string;
    rightRotor: string;
    left: string;
    middle: string;
    right: string;
    offset: number;
    decrypted: string;
    deducedSteckers?: Record<string, string>;
    stopHypothesis?: string;
  }>>([]);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  // Sync results mapper rings to scan rings by default
  useEffect(() => {
    setMapperLeftRing(leftRotorRing);
    setMapperMiddleRing(middleRotorRing);
    setMapperRightRing(rightRotorRing);
  }, [leftRotorRing, middleRotorRing, rightRotorRing]);

  // Sync with machine ciphertext on load if present
  useEffect(() => {
    if (cipherTape) {
      // Clean up punctuation and spaces for raw Enigma analysis
      const cleaned = cipherTape.toUpperCase().replace(/[^A-Z]/g, '');
      setCiphertext(cleaned);
    }
  }, [cipherTape]);

  // Handle alignment offset limits
  const maxOffset = Math.max(0, ciphertext.length - crib.length);
  useEffect(() => {
    if (alignmentOffset > maxOffset) {
      setAlignmentOffset(maxOffset);
    }
  }, [ciphertext, crib, alignmentOffset, maxOffset]);

  // Reset results when search configuration parameters are modified
  useEffect(() => {
    setMatches([]);
    setHasSearched(false);
  }, [
    ciphertext,
    crib,
    alignmentOffset,
    leftRotorType,
    middleRotorType,
    rightRotorType,
    leftRotorRing,
    middleRotorRing,
    rightRotorRing,
    fourthRotorType,
    fourthRotorRing,
    fourthRotorStart,
    reflectorType,
    reflectorRing,
    reflectorStart,
    plugboardMode,
    rotorScanScope,
    alignmentScanMode,
  ]);

  // Slide alignment details
  const alignedSection = useMemo(() => {
    if (!ciphertext || !crib || crib.length === 0) {
      return { alignedCipher: '', matchesCount: 0, positions: [], isViable: false };
    }

    const start = alignmentOffset;
    const end = alignmentOffset + crib.length;
    const alignedCipher = ciphertext.slice(start, end);
    
    let matchesCount = 0;
    const positions: boolean[] = []; // true if letters overlap (impossible)

    for (let i = 0; i < crib.length; i++) {
      const isOverlap = alignedCipher[i] === crib[i].toUpperCase();
      if (isOverlap) {
        matchesCount++;
      }
      positions.push(isOverlap);
    }

    return {
      alignedCipher,
      matchesCount,
      positions,
      isViable: matchesCount === 0 && alignedCipher.length === crib.length,
    };
  }, [ciphertext, crib, alignmentOffset]);

  // Find all possible alignment offsets with 0 overlaps
  const viableOffsets = useMemo(() => {
    if (!ciphertext || !crib || crib.length === 0) return [];
    const offsets: number[] = [];
    const max = ciphertext.length - crib.length;
    for (let offset = 0; offset <= max; offset++) {
      const alignedCipher = ciphertext.slice(offset, offset + crib.length);
      let overlaps = 0;
      for (let i = 0; i < crib.length; i++) {
        if (alignedCipher[i] === crib[i].toUpperCase()) {
          overlaps++;
        }
      }
      if (overlaps === 0 && alignedCipher.length === crib.length) {
        offsets.push(offset);
      }
    }
    return offsets;
  }, [ciphertext, crib]);

  // Load historical samples
  const loadTemplate = (type: 'navy_weather' | 'army_intercept') => {
    if (type === 'navy_weather') {
      // Setup Navy M3 keys: I-II-III, rings: 01-01-01, start positions scanned: Q-W-A
      // Plain: "WETTERVORHERSAGE"
      // Cipher: "VMOUDQTJEEVVQBVJ" (encrypted under I-II-III | 01-01-01 | QWA | no plugboard for simplicity)
      setCiphertext('VMOUDQTJEEVVQBVJ');
      setCrib('WETTERVORHERSAGE');
      setAlignmentOffset(0);
      setLeftRotorType('I');
      setMiddleRotorType('II');
      setRightRotorType('III');
      setLeftRotorRing(1);
      setMiddleRotorRing(1);
      setRightRotorRing(1);
      setReflectorType('UKW-B');
      setPlugboardMode('none');
    } else if (type === 'army_intercept') {
      // Setup intercept: III-IV-V, rings: 02-14-20
      // Plain text: "HALTUNGSTRENGGEHEIM" (Hold strictly secret)
      // Cipher: "JFPKQAEXBUKIXRTCTLO" (under III-IV-V, rings: B-N-T, starts: D-O-G)
      setCiphertext('JFPKQAEXBUKIXRTCTLO');
      setCrib('STRENGGEHEIM');
      setAlignmentOffset(7); // "STRENGGEHEIM" starts at offset 7
      setLeftRotorType('III');
      setMiddleRotorType('IV');
      setRightRotorType('V');
      setLeftRotorRing(2); // B
      setMiddleRotorRing(14); // N
      setRightRotorRing(20); // T
      setReflectorType('UKW-B');
      setPlugboardMode('none');
    }
  };

  // Prepare Fast Rotor Function
  const prepareRotor = (type: string, ring: number): RotorStateFast => {
    const spec = ROTOR_SPECS[type as any] || ROTOR_SPECS['I'];
    const wiringFwd = spec.wiring.split('').map(charToNum);
    const wiringBwd = new Array(26);
    for (let idx = 0; idx < 26; idx++) {
      wiringBwd[wiringFwd[idx]] = idx;
    }
    const notches = getRotorNotchPositions(type as any);
    return { wiringFwd, wiringBwd, notches, ring };
  };

  const passRotorForwardFast = (charNum: number, current: number, ring: number, wiringFwd: number[]): number => {
    const ringOffset = ring - 1;
    const shift = (current - ringOffset + 26) % 26;
    const entryIndex = (charNum + shift) % 26;
    const wiredNum = wiringFwd[entryIndex];
    return (wiredNum - shift + 26) % 26;
  };

  const passRotorBackwardFast = (charNum: number, current: number, ring: number, wiringBwd: number[]): number => {
    const ringOffset = ring - 1;
    const shift = (current - ringOffset + 26) % 26;
    const entryIndex = (charNum + shift) % 26;
    const wiredNum = wiringBwd[entryIndex];
    return (wiredNum - shift + 26) % 26;
  };

  const testStartPos = (
    leftStart: number,
    middleStart: number,
    rightStart: number,
    ciphertextNums: number[],
    cribNums: number[],
    leftR: RotorStateFast,
    middleR: RotorStateFast,
    rightR: RotorStateFast,
    fourthR: RotorStateFast | null,
    reflectorWiring: number[],
    hasDualReflector: boolean,
    reflectorRingSetting: number,
    reflectorStartVal: number,
    plugboardMap: number[]
  ): boolean => {
    let leftCurrent = leftStart;
    let middleCurrent = middleStart;
    let rightCurrent = rightStart;
    let reflectorCurrent = reflectorStartVal;

    const len = ciphertextNums.length;

    for (let i = 0; i < len; i++) {
      const cipherNum = ciphertextNums[i];
      const targetCribNum = cribNums[i];

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

      // 2. Encryption signal path
      
      // 2a. Plugboard In
      let currentNum = plugboardMap[cipherNum];

      // 2b. Right Rotor Forward (Fast)
      currentNum = passRotorForwardFast(currentNum, rightCurrent, rightR.ring, rightR.wiringFwd);

      // 2c. Middle Rotor Forward
      currentNum = passRotorForwardFast(currentNum, middleCurrent, middleR.ring, middleR.wiringFwd);

      // 2d. Left Rotor Forward (Slow)
      currentNum = passRotorForwardFast(currentNum, leftCurrent, leftR.ring, leftR.wiringFwd);

      // 2e. 4th Rotor Forward (Fixed stator)
      if (fourthR) {
        currentNum = passRotorForwardFast(currentNum, fourthRotorStart, fourthR.ring, fourthR.wiringFwd);
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

      // 2g. 4th Rotor Backward (Fixed stator)
      if (fourthR) {
        currentNum = passRotorBackwardFast(currentNum, fourthRotorStart, fourthR.ring, fourthR.wiringBwd);
      }

      // 2h. Left Rotor Backward
      currentNum = passRotorBackwardFast(currentNum, leftCurrent, leftR.ring, leftR.wiringBwd);

      // 2i. Middle Rotor Backward
      currentNum = passRotorBackwardFast(currentNum, middleCurrent, middleR.ring, middleR.wiringBwd);

      // 2j. Right Rotor Backward
      currentNum = passRotorBackwardFast(currentNum, rightCurrent, rightR.ring, rightR.wiringBwd);

      // 2k. Plugboard Out
      currentNum = plugboardMap[currentNum];

      // 3. Early Abort if letter decrypts differently than aligned crib letter!
      if (currentNum !== targetCribNum) {
        return false;
      }
    }

    return true;
  };

  // Gordon Welchman's Diagonal Board Electrical Circuit Test for candidate start position
  const testWelchmanDiagonalBoardPos = (
    leftStart: number,
    middleStart: number,
    rightStart: number,
    menuEdges: Array<{ i: number; p: number; c: number }>,
    testNode: number,
    leftR: RotorStateFast,
    middleR: RotorStateFast,
    rightR: RotorStateFast,
    fourthR: RotorStateFast | null,
    reflectorWiring: number[],
    hasDualReflector: boolean,
    reflectorRingSetting: number,
    reflectorStartVal: number
  ): { isStop: boolean; deducedSteckers: Record<string, string>; stopHypothesis: string } => {
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
        if (fourthR) {
          currentNum = passRotorForwardFast(currentNum, fourthRotorStart, fourthR.ring, fourthR.wiringFwd);
        }
        if (hasDualReflector) {
          const shift = (reflectorCurr - (reflectorRingSetting - 1) + 26) % 26;
          const indexWithShift = (currentNum + shift) % 26;
          const forwardNum = reflectorWiring[indexWithShift];
          currentNum = (forwardNum - shift + 26) % 26;
        } else {
          currentNum = reflectorWiring[currentNum];
        }
        if (fourthR) {
          currentNum = passRotorBackwardFast(currentNum, fourthRotorStart, fourthR.ring, fourthR.wiringBwd);
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
      const energized = new Uint8Array(676); // 26 nodes x 26 stecker wires
      const queue = [testNode * 26 + k];
      energized[testNode * 26 + k] = 1;

      let head = 0;
      while (head < queue.length) {
        const wire = queue[head++];
        const node = Math.floor(wire / 26);
        const stecker = wire % 26;

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

      // Count how many wires for testNode were energized
      let testNodeEnergizedCount = 0;
      for (let s = 0; s < 26; s++) {
        if (energized[testNode * 26 + s]) testNodeEnergizedCount++;
      }

      // If less than 26 wires energized (specifically < 26), we hit a BOMBE STOP!
      if (testNodeEnergizedCount < 26) {
        const deducedSteckers: Record<string, string> = {};
        for (let n = 0; n < 26; n++) {
          const energizedForNode: string[] = [];
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
  };

  // Full Decrypt helper to display previews
  const decryptFullMessage = (lStart: string, mStart: string, rStart: string): string => {
    // Build temporary Enigma config
    const testConfig: EnigmaConfig = {
      leftRotor: { type: leftRotorType as any, ring: leftRotorRing, start: charToNum(lStart), current: charToNum(lStart) },
      middleRotor: { type: middleRotorType as any, ring: middleRotorRing, start: charToNum(mStart), current: charToNum(mStart) },
      rightRotor: { type: rightRotorType as any, ring: rightRotorRing, start: charToNum(rStart), current: charToNum(rStart) },
      fourthRotor: { type: fourthRotorType as any, ring: fourthRotorRing, start: fourthRotorStart, current: fourthRotorStart },
      reflector: {
        type: reflectorType as any,
        ring: reflectorRing,
        start: reflectorStart,
        current: reflectorStart,
      },
      plugboard: plugboardMode === 'active' ? config.plugboard : {},
    };

    let currentTestConfig = testConfig;
    let decryptedText = '';
    
    // Clean spaces but preserve structure for visual readability
    for (let i = 0; i < ciphertext.length; i++) {
      const char = ciphertext[i];
      if (char === ' ') {
        decryptedText += ' ';
      } else {
        const { nextConfig, result } = encryptChar(char, currentTestConfig);
        decryptedText += result.outputChar;
        currentTestConfig = nextConfig;
      }
    }
    
    return decryptedText;
  };

  // Full Decrypt helper to display previews with custom rotors and rings
  const decryptFullMessageWithRotors = (
    lType: string, mType: string, rType: string,
    lStart: string, mStart: string, rStart: string,
    tLeftRing: number = leftRotorRing,
    tMiddleRing: number = middleRotorRing,
    tRightRing: number = rightRotorRing
  ): string => {
    const testConfig: EnigmaConfig = {
      leftRotor: { type: lType as any, ring: tLeftRing, start: charToNum(lStart), current: charToNum(lStart) },
      middleRotor: { type: mType as any, ring: tMiddleRing, start: charToNum(mStart), current: charToNum(mStart) },
      rightRotor: { type: rType as any, ring: tRightRing, start: charToNum(rStart), current: charToNum(rStart) },
      fourthRotor: { type: fourthRotorType as any, ring: fourthRotorRing, start: fourthRotorStart, current: fourthRotorStart },
      reflector: {
        type: reflectorType as any,
        ring: reflectorRing,
        start: reflectorStart,
        current: reflectorStart,
      },
      plugboard: plugboardMode === 'active' ? config.plugboard : {},
    };

    let currentTestConfig = testConfig;
    let decryptedText = '';
    
    for (let i = 0; i < ciphertext.length; i++) {
      const char = ciphertext[i];
      if (char === ' ') {
        decryptedText += ' ';
      } else {
        const { nextConfig, result } = encryptChar(char, currentTestConfig);
        decryptedText += result.outputChar;
        currentTestConfig = nextConfig;
      }
    }
    
    return decryptedText;
  };

  // Rollback function: Brute force which starting position at index 0 steps to (lEnd, mEnd, rEnd) after offset steps.
  const findStartingPositionAt0 = (
    lEnd: number, mEnd: number, rEnd: number,
    offset: number,
    leftType: string, middleType: string, rightType: string,
    leftRing: number, middleRing: number, rightRing: number
  ): { l0: number, m0: number, r0: number } => {
    if (offset === 0) return { l0: lEnd, m0: mEnd, r0: rEnd };

    const leftR = prepareRotor(leftType, leftRing);
    const middleR = prepareRotor(middleType, middleRing);
    const rightR = prepareRotor(rightType, rightRing);

    // Brute force all 17576 starting positions at index 0
    for (let l = 0; l < 26; l++) {
      for (let m = 0; m < 26; m++) {
        for (let r = 0; r < 26; r++) {
          let leftCurrent = l;
          let middleCurrent = m;
          let rightCurrent = r;

          for (let step = 0; step < offset; step++) {
            const rightAtNotch = rightR.notches.includes(rightCurrent);
            const middleAtNotch = middleR.notches.includes(middleCurrent);

            rightCurrent = (rightCurrent + 1) % 26;
            if (rightAtNotch || middleAtNotch) {
              middleCurrent = (middleCurrent + 1) % 26;
              if (middleAtNotch) {
                leftCurrent = (leftCurrent + 1) % 26;
              }
            }
          }

          if (leftCurrent === lEnd && middleCurrent === mEnd && rightCurrent === rEnd) {
            return { l0: l, m0: m, r0: r };
          }
        }
      }
    }

    return { l0: lEnd, m0: mEnd, r0: rEnd };
  };

  // Map the rolled-back index 0 start positions to Target Rings
  const findMappedStartingPositionAt0 = (
    lEndChar: string, mEndChar: string, rEndChar: string,
    offset: number,
    leftType: string, middleType: string, rightType: string,
    leftRingScan: number, middleRingScan: number, rightRingScan: number,
    leftRingTarget: number, middleRingTarget: number, rightRingTarget: number
  ): { l0Mapped: string, m0Mapped: string, r0Mapped: string } => {
    const { l0, m0, r0 } = findStartingPositionAt0(
      charToNum(lEndChar),
      charToNum(mEndChar),
      charToNum(rEndChar),
      offset,
      leftType,
      middleType,
      rightType,
      leftRingScan,
      middleRingScan,
      rightRingScan
    );

    const l0Mapped = getMappedStartChar(numToChar(l0), leftRingScan, leftRingTarget);
    const m0Mapped = getMappedStartChar(numToChar(m0), middleRingScan, middleRingTarget);
    const r0Mapped = getMappedStartChar(numToChar(r0), rightRingScan, rightRingTarget);

    return { l0Mapped, m0Mapped, r0Mapped };
  };

  // Helper to map relative offsets from 01-01-01 scan to custom physical Ring settings
  const getMappedStartChar = (startChar: string, searchRing: number, targetRing: number): string => {
    const startVal = charToNum(startChar);
    const relativeOffset = (startVal - (searchRing - 1) + 26) % 26;
    const targetStartVal = (relativeOffset + (targetRing - 1)) % 26;
    return numToChar(targetStartVal);
  };

  // Start electromechanical Bombe search
  const startBombeSearch = () => {
    // 1. Build list of offsets to scan based on user alignment selection
    const offsetsToScan = alignmentScanMode === 'all_viable' ? viableOffsets : [alignmentOffset];
    if (offsetsToScan.length === 0) return;

    setIsSearching(true);
    setProgress(0);
    setMatches([]);
    setHasSearched(false);

    // 2. Build list of rotor combinations to scan based on user selection
    const rotorCombs: Array<{ left: string; middle: string; right: string }> = [];
    if (rotorScanScope === 'selected') {
      rotorCombs.push({ left: leftRotorType, middle: middleRotorType, right: rightRotorType });
    } else if (rotorScanScope === 'permutations_3') {
      const selected = [leftRotorType, middleRotorType, rightRotorType];
      const permute = (arr: string[]): Array<string[]> => {
        if (arr.length === 0) return [[]];
        const result: Array<string[]> = [];
        for (let i = 0; i < arr.length; i++) {
          const current = arr[i];
          const remaining = arr.slice(0, i).concat(arr.slice(i + 1));
          const subPerms = permute(remaining);
          for (const sub of subPerms) {
            result.push([current, ...sub]);
          }
        }
        return result;
      };
      const uniqueStrings = Array.from(new Set(permute(selected).map(p => p.join('-'))));
      uniqueStrings.forEach(s => {
        const [l, m, r] = s.split('-');
        rotorCombs.push({ left: l, middle: m, right: r });
      });
    } else if (rotorScanScope === 'all_5') {
      const rotors5 = ['I', 'II', 'III', 'IV', 'V'];
      for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
          if (i === j) continue;
          for (let k = 0; k < 5; k++) {
            if (i === k || j === k) continue;
            rotorCombs.push({ left: rotors5[i], middle: rotors5[j], right: rotors5[k] });
          }
        }
      }
    } else if (rotorScanScope === 'all_8') {
      const rotors8 = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
          if (i === j) continue;
          for (let k = 0; k < 8; k++) {
            if (i === k || j === k) continue;
            rotorCombs.push({ left: rotors8[i], middle: rotors8[j], right: rotors8[k] });
          }
        }
      }
    }

    const isM4 = fourthRotorType === 'Beta' || fourthRotorType === 'Gamma';
    const fourthR = isM4 ? prepareRotor(fourthRotorType, fourthRotorRing) : null;

    const reflectorSpec = REFLECTOR_SPECS[reflectorType as any] || REFLECTOR_SPECS['Reflector B'];
    const reflectorWiring = reflectorSpec.wiring.split('').map(charToNum);
    const hasDualReflector = reflectorType === 'UKW-Dual-Dynamic';

    // Prepare plugboard number array lookup
    const pMap = new Array(26);
    for (let i = 0; i < 26; i++) pMap[i] = i;
    if (plugboardMode === 'active') {
      for (const [key, val] of Object.entries(config.plugboard)) {
        const k = charToNum(key as string);
        const v = charToNum(val as string);
        pMap[k] = v;
        pMap[v] = k;
      }
    }

    // Precalculate sliced text targets for fast loop across all offsets
    const precalculatedOffsets = offsetsToScan.map(offset => {
      const cipherTextSliced = ciphertext.toUpperCase().slice(offset, offset + crib.length);
      const cipherNums = cipherTextSliced.split('').map(charToNum);
      const cribNums = crib.toUpperCase().split('').map(charToNum);

      // Build menu graph edges for Welchman's Diagonal Board search
      const menuEdges: Array<{ i: number; p: number; c: number }> = [];
      for (let i = 0; i < cribNums.length; i++) {
        menuEdges.push({ i, p: cribNums[i], c: cipherNums[i] });
      }

      // Calculate node degrees to pick optimal testNode (highest degree node)
      const degree = new Array(26).fill(0);
      for (let i = 0; i < menuEdges.length; i++) {
        degree[menuEdges[i].p]++;
        degree[menuEdges[i].c]++;
      }
      let testNode = 0;
      let maxDeg = -1;
      for (let ch = 0; ch < 26; ch++) {
        if (degree[ch] > maxDeg) {
          maxDeg = degree[ch];
          testNode = ch;
        }
      }

      return {
        offset,
        cipherNums,
        cribNums,
        menuEdges,
        testNode,
      };
    });

    const foundMatches: Array<{
      leftRotor: string;
      middleRotor: string;
      rightRotor: string;
      left: string;
      middle: string;
      right: string;
      offset: number;
      decrypted: string;
      deducedSteckers?: Record<string, string>;
      stopHypothesis?: string;
    }> = [];

    let currentCombIndex = 0;
    let combinationIndex = 0;
    const totalCombinationsPerRotor = 17576; // 26 * 26 * 26 starting positions for Left, Middle, Right

    // Pre-cache rotor states for speed
    const rotorCache = new Map<string, any>();
    const getCachedRotor = (type: string, ring: number) => {
      const key = `${type}-${ring}`;
      if (!rotorCache.has(key)) {
        rotorCache.set(key, prepareRotor(type, ring));
      }
      return rotorCache.get(key);
    };

    const runBatch = () => {
      if (currentCombIndex >= rotorCombs.length) {
        // Complete! Roll back found starting positions to offset 0 and fill in decryptions
        const finalized = foundMatches.map((match) => {
          // 1. Find start position at index 0 under Scan Rings
          const { l0, m0, r0 } = findStartingPositionAt0(
            charToNum(match.left),
            charToNum(match.middle),
            charToNum(match.right),
            match.offset,
            match.leftRotor,
            match.middleRotor,
            match.rightRotor,
            leftRotorRing,
            middleRotorRing,
            rightRotorRing
          );

          // 2. Decrypt message starting from index 0
          const decrypted = decryptFullMessageWithRotors(
            match.leftRotor, match.middleRotor, match.rightRotor,
            numToChar(l0), numToChar(m0), numToChar(r0),
            leftRotorRing, middleRotorRing, rightRotorRing
          );

          return {
            ...match,
            decrypted,
          };
        });

        setIsSearching(false);
        setMatches(finalized);
        setHasSearched(true);
        return;
      }

      const activeComb = rotorCombs[currentCombIndex];
      const leftR = getCachedRotor(activeComb.left, leftRotorRing);
      const middleR = getCachedRotor(activeComb.middle, middleRotorRing);
      const rightR = getCachedRotor(activeComb.right, rightRotorRing);

      // Multi-rotor scans can scan a full rotor set (17.5k start positions) in a single frame to remain fast and interactive.
      // Single selected configuration scans in smaller chunks to let the user see the beautiful rotating dials simulation.
      const isMultiRotor = rotorCombs.length > 1;
      const batchSize = isMultiRotor ? totalCombinationsPerRotor : 1000;
      const limit = Math.min(combinationIndex + batchSize, totalCombinationsPerRotor);

      for (let c = combinationIndex; c < limit; c++) {
        // Unpack composite index into 3 independent dial values (0-25)
        const r = c % 26;
        const m = Math.floor(c / 26) % 26;
        const l = Math.floor(c / 676) % 26;

        for (const precalc of precalculatedOffsets) {
          if (bombeEngineMode === 'welchman_diagonal') {
            const result = testWelchmanDiagonalBoardPos(
              l, m, r,
              precalc.menuEdges,
              precalc.testNode,
              leftR,
              middleR,
              rightR,
              fourthR,
              reflectorWiring,
              hasDualReflector,
              reflectorRing,
              reflectorStart
            );

            if (result.isStop) {
              foundMatches.push({
                leftRotor: activeComb.left,
                middleRotor: activeComb.middle,
                rightRotor: activeComb.right,
                left: numToChar(l),
                middle: numToChar(m),
                right: numToChar(r),
                offset: precalc.offset,
                decrypted: '',
                deducedSteckers: result.deducedSteckers,
                stopHypothesis: result.stopHypothesis,
              });
            }
          } else {
            const isMatch = testStartPos(
              l, m, r,
              precalc.cipherNums,
              precalc.cribNums,
              leftR,
              middleR,
              rightR,
              fourthR,
              reflectorWiring,
              hasDualReflector,
              reflectorRing,
              reflectorStart,
              pMap
            );

            if (isMatch) {
              foundMatches.push({
                leftRotor: activeComb.left,
                middleRotor: activeComb.middle,
                rightRotor: activeComb.right,
                left: numToChar(l),
                middle: numToChar(m),
                right: numToChar(r),
                offset: precalc.offset,
                decrypted: '',
              });
            }
          }
        }
      }

      combinationIndex = limit;
      const totalSteps = rotorCombs.length * totalCombinationsPerRotor;
      const completedSteps = currentCombIndex * totalCombinationsPerRotor + combinationIndex;
      setProgress(Math.round((completedSteps / totalSteps) * 100));

      if (combinationIndex >= totalCombinationsPerRotor) {
        currentCombIndex++;
        combinationIndex = 0;
      }

      // Visual updates: show scanned position or active rotor combination names
      const currentActiveComb = rotorCombs[Math.min(currentCombIndex, rotorCombs.length - 1)];
      setCurrentScan([
        isMultiRotor ? currentActiveComb.left : numToChar(Math.floor(limit / 676) % 26),
        isMultiRotor ? currentActiveComb.middle : numToChar(Math.floor(limit / 26) % 26),
        isMultiRotor ? currentActiveComb.right : numToChar(limit % 26),
      ]);

      playRotorClickSound(soundEnabled);
      requestAnimationFrame(runBatch);
    };

    requestAnimationFrame(runBatch);
  };

  // Apply cracked keys back to main Enigma machine with mapped Ringstellung (Ring Settings)
  const handleApplyMatchWithRings = (
    match: typeof matches[0],
    tLeftRing: number, tMiddleRing: number, tRightRing: number,
    tLeftStart: string, tMiddleStart: string, tRightStart: string
  ) => {
    // Merge deduced steckers into plugboard if available
    const newPlugboard: Record<string, string> = { ...config.plugboard };
    if (match.deducedSteckers && Object.keys(match.deducedSteckers).length > 0) {
      Object.assign(newPlugboard, match.deducedSteckers);
    }

    const updatedConfig: EnigmaConfig = {
      ...config,
      leftRotor: {
        ...config.leftRotor,
        type: match.leftRotor as any,
        ring: tLeftRing,
        start: charToNum(tLeftStart),
        current: charToNum(tLeftStart),
      },
      middleRotor: {
        ...config.middleRotor,
        type: match.middleRotor as any,
        ring: tMiddleRing,
        start: charToNum(tMiddleStart),
        current: charToNum(tMiddleStart),
      },
      rightRotor: {
        ...config.rightRotor,
        type: match.rightRotor as any,
        ring: tRightRing,
        start: charToNum(tRightStart),
        current: charToNum(tRightStart),
      },
      plugboard: (plugboardMode === 'active' || (match.deducedSteckers && Object.keys(match.deducedSteckers).length > 0))
        ? newPlugboard
        : {},
    };

    onUpdateConfig(updatedConfig);
    setActiveTab('machine');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="border-b border-[#3b3426] pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-rotor-label font-rotor-label text-[#ebc238] text-xl md:text-2xl flex items-center gap-2">
            <span className="material-symbols-outlined text-2xl">auto_fix</span>
            Turing-Welchman Bombe Simulator
          </h1>
          <p className="text-[#d1c4b7] text-xs font-ui-body">
            Replicate Bletchley Park’s historical cryptanalysis techniques using a known plaintext fragment (Crib) slider and logical search.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => loadTemplate('navy_weather')}
            className="text-xs font-ui-header bg-[#3b3426] hover:bg-[#4e453b] text-[#e3c193] border border-[#8b6f47] px-3 py-1.5 rounded transition-colors cursor-pointer"
          >
            Kriegsmarine Wetter (Navy)
          </button>
          <button
            onClick={() => loadTemplate('army_intercept')}
            className="text-xs font-ui-header bg-[#3b3426] hover:bg-[#4e453b] text-[#e3c193] border border-[#8b6f47] px-3 py-1.5 rounded transition-colors cursor-pointer"
          >
            Wehrmacht Intercept (Army)
          </button>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Hand: Historical context & configuration desk */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Station X Briefing Card */}
          <div className="bg-[#1b170e]/95 border-2 border-[#8b6f47]/50 rounded-lg p-4 shadow-panel relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-[#ebc238]/5 transform rotate-45 translate-x-8 -translate-y-8 pointer-events-none" />
            <h3 className="text-ui-header font-ui-header text-[#ebc238] text-xs uppercase tracking-wider pb-1.5 border-b border-[#4e453b]/60 flex items-center gap-2">
              <span className="material-symbols-outlined text-xs">gavel</span>
              Bletchley Park Protocol
            </h3>
            <p className="text-[11px] text-[#d1c4b7] leading-relaxed pt-2">
              The Turing-Welchman <strong>Bombe</strong> cracked keys not by trying millions of full decrypts, but by exploiting a critical design flaw: <strong>Enigma can never encrypt a letter to itself</strong>.
            </p>
            <p className="text-[11px] text-[#d1c4b7] leading-relaxed pt-2">
              By sliding a guessed phrase (Crib) against ciphertext, codebreakers immediately discarded alignments that had overlapping characters. Viable alignments were then scanned to find starting settings that yielded a perfect circuit path.
            </p>
          </div>

          {/* Active Scrambler Settings Card */}
          <div className="bg-[#201b0f] border border-[#4e453b] rounded-lg p-4 shadow-panel texture-metal space-y-3.5">
            <h3 className="text-ui-header font-ui-header text-[#e3c193] text-xs uppercase tracking-wider pb-1.5 border-b border-[#3b3426] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-xs">settings_input_component</span>
              Scrambler Key Target
            </h3>

            <div className="space-y-3 text-xs">
              {/* Rotor selection visualization */}
              <div className="grid grid-cols-3 gap-2">
                {/* Left Rotor Selector */}
                <div className="bg-[#120e04] p-2 rounded border border-[#3b3426] flex flex-col justify-between">
                  <label className="text-[9px] text-[#8c7e6a] block uppercase font-monospaced-technical mb-1 text-center font-bold">Left Rotor</label>
                  <select
                    value={leftRotorType}
                    onChange={(e) => setLeftRotorType(e.target.value)}
                    className="w-full bg-[#1b170e] text-[#ede1cd] font-bold text-xs border border-[#4e453b] rounded py-1 px-1 focus:outline-none focus:border-[#ebc238] text-center cursor-pointer"
                  >
                    {['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'].map((type) => (
                      <option key={type} value={type} className="bg-[#1b170e]">
                        {type}
                      </option>
                    ))}
                  </select>
                  <div className="mt-1.5">
                    <span className="text-[8px] text-[#8c7e6a] block uppercase font-monospaced-technical text-center mb-0.5">Ring</span>
                    <select
                      value={leftRotorRing}
                      onChange={(e) => setLeftRotorRing(parseInt(e.target.value))}
                      className="w-full bg-[#1b170e] text-amber-500/90 text-[11px] border border-[#4e453b] rounded py-0.5 px-1 focus:outline-none focus:border-[#ebc238] text-center cursor-pointer"
                    >
                      {Array.from({ length: 26 }, (_, idx) => idx + 1).map((ring) => (
                        <option key={ring} value={ring} className="bg-[#1b170e]">
                          {formatRotorRing(ring)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Middle Rotor Selector */}
                <div className="bg-[#120e04] p-2 rounded border border-[#3b3426] flex flex-col justify-between">
                  <label className="text-[9px] text-[#8c7e6a] block uppercase font-monospaced-technical mb-1 text-center font-bold">Middle Rotor</label>
                  <select
                    value={middleRotorType}
                    onChange={(e) => setMiddleRotorType(e.target.value)}
                    className="w-full bg-[#1b170e] text-[#ede1cd] font-bold text-xs border border-[#4e453b] rounded py-1 px-1 focus:outline-none focus:border-[#ebc238] text-center cursor-pointer"
                  >
                    {['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'].map((type) => (
                      <option key={type} value={type} className="bg-[#1b170e]">
                        {type}
                      </option>
                    ))}
                  </select>
                  <div className="mt-1.5">
                    <span className="text-[8px] text-[#8c7e6a] block uppercase font-monospaced-technical text-center mb-0.5">Ring</span>
                    <select
                      value={middleRotorRing}
                      onChange={(e) => setMiddleRotorRing(parseInt(e.target.value))}
                      className="w-full bg-[#1b170e] text-amber-500/90 text-[11px] border border-[#4e453b] rounded py-0.5 px-1 focus:outline-none focus:border-[#ebc238] text-center cursor-pointer"
                    >
                      {Array.from({ length: 26 }, (_, idx) => idx + 1).map((ring) => (
                        <option key={ring} value={ring} className="bg-[#1b170e]">
                          {formatRotorRing(ring)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Right Rotor Selector */}
                <div className="bg-[#120e04] p-2 rounded border border-[#3b3426] flex flex-col justify-between">
                  <label className="text-[9px] text-[#8c7e6a] block uppercase font-monospaced-technical mb-1 text-center font-bold">Right Rotor</label>
                  <select
                    value={rightRotorType}
                    onChange={(e) => setRightRotorType(e.target.value)}
                    className="w-full bg-[#1b170e] text-[#ede1cd] font-bold text-xs border border-[#4e453b] rounded py-1 px-1 focus:outline-none focus:border-[#ebc238] text-center cursor-pointer"
                  >
                    {['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'].map((type) => (
                      <option key={type} value={type} className="bg-[#1b170e]">
                        {type}
                      </option>
                    ))}
                  </select>
                  <div className="mt-1.5">
                    <span className="text-[8px] text-[#8c7e6a] block uppercase font-monospaced-technical text-center mb-0.5">Ring</span>
                    <select
                      value={rightRotorRing}
                      onChange={(e) => setRightRotorRing(parseInt(e.target.value))}
                      className="w-full bg-[#1b170e] text-amber-500/90 text-[11px] border border-[#4e453b] rounded py-0.5 px-1 focus:outline-none focus:border-[#ebc238] text-center cursor-pointer"
                    >
                      {Array.from({ length: 26 }, (_, idx) => idx + 1).map((ring) => (
                        <option key={ring} value={ring} className="bg-[#1b170e]">
                          {formatRotorRing(ring)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Optional 4th Rotor and Reflector config */}
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="bg-[#120e04] p-2 rounded border border-[#3b3426] flex flex-col justify-between">
                  <div>
                    <label className="text-[9px] text-[#8c7e6a] block uppercase font-monospaced-technical mb-1 font-bold">4th Thin Rotor</label>
                    <select
                      value={fourthRotorType}
                      onChange={(e) => setFourthRotorType(e.target.value)}
                      className="w-full bg-[#1b170e] text-[#ede1cd] text-xs border border-[#4e453b] rounded py-1 px-1 focus:outline-none focus:border-[#ebc238] cursor-pointer"
                    >
                      {['I', 'Beta', 'Gamma'].map((type) => (
                        <option key={type} value={type} className="bg-[#1b170e]">
                          {type === 'I' ? 'None (3-Rotor)' : type}
                        </option>
                      ))}
                    </select>
                  </div>
                  {fourthRotorType !== 'I' && (
                    <div className="mt-1.5 flex gap-1">
                      <div className="w-1/2">
                        <span className="text-[8px] text-[#8c7e6a] block uppercase font-monospaced-technical mb-0.5 text-center">Ring</span>
                        <select
                          value={fourthRotorRing}
                          onChange={(e) => setFourthRotorRing(parseInt(e.target.value))}
                          className="w-full bg-[#1b170e] text-amber-500/90 text-[10px] border border-[#4e453b] rounded py-0.5 px-1 focus:outline-none focus:border-[#ebc238] text-center cursor-pointer"
                        >
                          {Array.from({ length: 26 }, (_, idx) => idx + 1).map((ring) => (
                            <option key={ring} value={ring} className="bg-[#1b170e]">
                              {formatRotorRing(ring)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="w-1/2">
                        <span className="text-[8px] text-[#8c7e6a] block uppercase font-monospaced-technical mb-0.5 text-center">Pos</span>
                        <select
                          value={fourthRotorStart}
                          onChange={(e) => setFourthRotorStart(parseInt(e.target.value))}
                          className="w-full bg-[#1b170e] text-amber-500/90 text-[10px] border border-[#4e453b] rounded py-0.5 px-1 focus:outline-none focus:border-[#ebc238] text-center cursor-pointer"
                        >
                          {Array.from({ length: 26 }, (_, idx) => idx).map((pos) => (
                            <option key={pos} value={pos} className="bg-[#1b170e]">
                              {numToChar(pos)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-[#120e04] p-2 rounded border border-[#3b3426] flex flex-col justify-between">
                  <div>
                    <label className="text-[9px] text-[#8c7e6a] block uppercase font-monospaced-technical mb-1 font-bold">Reflector</label>
                    <select
                      value={reflectorType}
                      onChange={(e) => setReflectorType(e.target.value)}
                      className="w-full bg-[#1b170e] text-[#ede1cd] text-xs border border-[#4e453b] rounded py-1 px-1 focus:outline-none focus:border-[#ebc238] cursor-pointer"
                    >
                      {['Reflector A', 'Reflector B', 'Reflector C', 'Reflector B Thin', 'Reflector C Thin', 'UKW-Rocket', 'UKW-K'].map((ref) => (
                        <option key={ref} value={ref} className="bg-[#1b170e]">
                          {ref}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Rotor Scan Scope Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-[#d1c4b7] uppercase tracking-wider block font-monospaced-technical">
                  Rotor Scan Scope (Search All?)
                </label>
                <select
                  value={rotorScanScope}
                  onChange={(e) => setRotorScanScope(e.target.value as any)}
                  className="w-full bg-[#120e04] text-[#ede1cd] text-xs border border-[#3b3426] rounded py-2 px-2.5 focus:outline-none focus:border-[#ebc238] cursor-pointer font-ui-header"
                >
                  <option value="selected" className="bg-[#1b170e]">Selected Rotor Types Only (1 combination)</option>
                  <option value="permutations_3" className="bg-[#1b170e]">All Permutations of Selected (up to 6 combinations)</option>
                  <option value="all_5" className="bg-[#1b170e]">Search All Combinations of Rotors I-V (60 combinations)</option>
                  <option value="all_8" className="bg-[#1b170e]">Search All Combinations of Rotors I-VIII (336 combinations)</option>
                </select>

                {(config.fourthRotor.type === 'Beta' || config.fourthRotor.type === 'Gamma') && (
                  <div className="p-1.5 bg-[#120e04] rounded border border-amber-800/40 text-[9px] text-amber-400 font-monospaced-technical flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">info</span>
                    <span>M4 Active: The 4th Greek rotor ({config.fourthRotor.type}) position is held fixed per daily codebook rules while scanning the 3 driving wheels.</span>
                  </div>
                )}
              </div>

              {/* Crib Alignment Scan Mode Select */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-[#d1c4b7] uppercase tracking-wider block font-monospaced-technical">
                  Crib Alignment Scan Mode
                </label>
                <select
                  value={alignmentScanMode}
                  onChange={(e) => setAlignmentScanMode(e.target.value as any)}
                  className="w-full bg-[#120e04] text-[#ede1cd] text-xs border border-[#3b3426] rounded py-2 px-2.5 focus:outline-none focus:border-[#ebc238] cursor-pointer font-ui-header"
                >
                  <option value="current" className="bg-[#1b170e]">Current Slider Position Only (Offset: {alignmentOffset})</option>
                  <option value="all_viable" className="bg-[#1b170e]">Auto-Scan All Viable Positions ({viableOffsets.length} valid)</option>
                </select>
              </div>

              {/* Plugboard Mode Switcher */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-[#d1c4b7] uppercase tracking-wider block font-monospaced-technical">
                  Bombe Cryptanalysis Algorithm
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setBombeEngineMode('welchman_diagonal')}
                    className={`py-1.5 px-2 text-[11px] rounded border transition-colors cursor-pointer font-ui-header flex flex-col items-center gap-0.5 ${
                      bombeEngineMode === 'welchman_diagonal'
                        ? 'bg-[#ebc238]/10 border-[#ebc238] text-[#ede1cd]'
                        : 'bg-[#120e04] border-[#3b3426] text-[#8c7e6a] hover:bg-[#252015]'
                    }`}
                  >
                    <span className="font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs text-amber-400">grid_4x4</span>
                      Welchman Diagonal Board
                    </span>
                    <span className="text-[8px] opacity-75">Full Reciprocity Circuit</span>
                  </button>
                  <button
                    onClick={() => setBombeEngineMode('direct_scan')}
                    className={`py-1.5 px-2 text-[11px] rounded border transition-colors cursor-pointer font-ui-header flex flex-col items-center gap-0.5 ${
                      bombeEngineMode === 'direct_scan'
                        ? 'bg-[#ebc238]/10 border-[#ebc238] text-[#ede1cd]'
                        : 'bg-[#120e04] border-[#3b3426] text-[#8c7e6a] hover:bg-[#252015]'
                    }`}
                  >
                    <span className="font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">tune</span>
                      Direct Character Scan
                    </span>
                    <span className="text-[8px] opacity-75">Known Stecker Rules</span>
                  </button>
                </div>

                {/* Welchman Circuit Inspector Trigger Buttons */}
                {bombeEngineMode === 'welchman_diagonal' && crib && ciphertext && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => setShowMenuGraphModal(true)}
                      className="py-1 px-2 bg-[#120e04] hover:bg-[#252015] border border-[#3b3426] hover:border-amber-600/50 rounded text-[10px] text-amber-400/90 font-monospaced-technical flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-xs">hub</span>
                      Inspect Menu Graph
                    </button>
                    <button
                      onClick={() => setShowDiagonalBoardModal(true)}
                      className="py-1 px-2 bg-[#120e04] hover:bg-[#252015] border border-[#3b3426] hover:border-amber-600/50 rounded text-[10px] text-amber-400/90 font-monospaced-technical flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-xs">grid_on</span>
                      26×26 Diagonal Matrix
                    </button>
                  </div>
                )}
              </div>

              {/* Plugboard Mode Switcher */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-[#d1c4b7] uppercase tracking-wider block font-monospaced-technical">
                  Plugboard (Steckerbrett) Rule
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPlugboardMode('active')}
                    className={`py-1.5 text-xs rounded border transition-colors cursor-pointer font-ui-header ${
                      plugboardMode === 'active'
                        ? 'bg-[#ebc238]/10 border-[#ebc238] text-[#ede1cd]'
                        : 'bg-[#120e04] border-[#3b3426] text-[#8c7e6a] hover:bg-[#252015]'
                    }`}
                  >
                    Use Active Plugboard
                  </button>
                  <button
                    onClick={() => setPlugboardMode('none')}
                    className={`py-1.5 text-xs rounded border transition-colors cursor-pointer font-ui-header ${
                      plugboardMode === 'none'
                        ? 'bg-[#ebc238]/10 border-[#ebc238] text-[#ede1cd]'
                        : 'bg-[#120e04] border-[#3b3426] text-[#8c7e6a] hover:bg-[#252015]'
                    }`}
                  >
                    No Plugboard (Bare)
                  </button>
                </div>

                {/* Display active plugboard connections */}
                <div className="p-2 bg-[#120e04] rounded border border-[#3b3426] text-[10px] font-monospaced-technical">
                  <div className="text-[#8c7e6a] uppercase font-bold text-[9px] mb-1">
                    Active Stecker Connections ({Object.keys(config.plugboard).length / 2} pairs)
                  </div>
                  {Object.keys(config.plugboard).length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(config.plugboard)
                        .filter(([k, v]) => k < v)
                        .map(([a, b]) => (
                          <span
                            key={`${a}-${b}`}
                            className={`px-1.5 py-0.5 rounded text-[10px] border ${
                              plugboardMode === 'active'
                                ? 'bg-amber-950/40 text-amber-300 border-amber-800/50'
                                : 'bg-[#1b170e] text-[#8c7e6a] border-[#3b3426] line-through opacity-60'
                            }`}
                          >
                            {a}↔{b}
                          </span>
                        ))}
                    </div>
                  ) : (
                    <span className="text-[#8c7e6a] italic">No plugboard connections configured</span>
                  )}
                </div>
              </div>

              {/* Warning/Info */}
              <div className="p-2.5 bg-[#120e04] rounded border border-[#3b3426] text-[10px] text-[#d1c4b7] font-monospaced-technical leading-normal">
                <span>
                  Normally, Bletchley Park ran the Bombe assuming unsteckered loops (assuming most letters used in loops were unplugged) or by guessing plugboard stecker pairings subsequently.
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Hand: The Interactive Slider, Drum Visuals, & Results */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Station X Alignment Slide Ruler */}
          <div className="bg-[#201b0f] border border-[#4e453b] rounded-lg p-5 shadow-panel texture-metal space-y-4">
            <div className="pb-1 border-b border-[#3b3426] flex justify-between items-center">
              <h3 className="text-ui-header font-ui-header text-[#e3c193] text-xs uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">view_week</span>
                Interactive Crib Alignment Ruler
              </h3>
              <span className="text-[10px] font-monospaced-technical text-amber-500 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40 font-bold">
                Slide & Match Station
              </span>
            </div>

            {/* Manual Entries */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-monospaced-technical text-[#d1c4b7] uppercase tracking-wider block mb-1">
                  Intercepted Ciphertext (A-Z)
                </label>
                <input
                  type="text"
                  value={ciphertext}
                  onChange={(e) => setCiphertext(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
                  placeholder="Type encrypted intercept text here..."
                  className="w-full p-2 bg-[#120e04] border border-[#3b3426] rounded text-[#ebc238] font-monospaced-technical text-xs tracking-wider uppercase focus:outline-none focus:border-[#ebc238]"
                />
              </div>
              <div>
                <label className="text-[10px] font-monospaced-technical text-[#d1c4b7] uppercase tracking-wider block mb-1">
                  Guessed Plaintext Segment (Crib)
                </label>
                <input
                  type="text"
                  value={crib}
                  onChange={(e) => setCrib(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
                  placeholder="e.g. WETTERVORHERSAGE"
                  className="w-full p-2 bg-[#120e04] border border-[#3b3426] rounded text-[#ede1cd] font-monospaced-technical text-xs tracking-wider uppercase focus:outline-none focus:border-[#ebc238]"
                />
              </div>
            </div>

            {/* Slider control */}
            {maxOffset > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-[11px] font-monospaced-technical text-[#d1c4b7]">
                  <span>Alignment Offset Position</span>
                  <span className="font-bold text-[#ebc238]">{alignmentOffset} chars</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={maxOffset}
                  value={alignmentOffset}
                  onChange={(e) => setAlignmentOffset(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#120e04] rounded-lg appearance-none cursor-pointer accent-[#ebc238] border border-[#3b3426]"
                />
                
                {/* Viable Zero-Overlap Offsets Badges */}
                {viableOffsets.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1.5 text-[10px] font-monospaced-technical text-[#8c7e6a]">
                    <span className="font-bold text-[#d1c4b7]">Viable Zero-Overlap Offsets:</span>
                    {viableOffsets.map((offset) => (
                      <button
                        key={offset}
                        onClick={() => setAlignmentOffset(offset)}
                        className={`px-2 py-0.5 rounded border cursor-pointer transition-all ${
                          alignmentOffset === offset
                            ? 'bg-green-950/80 border-green-500 text-green-300 font-bold shadow-[0_0_8px_rgba(34,197,94,0.3)]'
                            : 'bg-[#120e04] border-[#3b3426] text-[#ede1cd]/80 hover:border-[#ebc238]/60 hover:text-[#ede1cd]'
                        }`}
                      >
                        {offset}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Slide Comparison Visual Grid */}
            {ciphertext && crib && (
              <div ref={scrollContainerRef} className="bg-[#120e04] rounded border border-[#3b3426] p-4 overflow-x-auto select-none">
                <div className="flex flex-col gap-3 min-w-[500px]">
                  
                  {/* Full Ciphertext Row */}
                  <div className="flex items-center gap-2">
                    <span className="w-16 shrink-0 text-[10px] font-monospaced-technical text-[#8c7e6a] uppercase">Intercept:</span>
                    <div className="flex-1 flex gap-1 font-monospaced-technical text-sm tracking-wider">
                      {ciphertext.split('').map((char, idx) => {
                        const isAligned = idx >= alignmentOffset && idx < alignmentOffset + crib.length;
                        return (
                          <div
                            key={idx}
                            className={`w-7 h-8 flex items-center justify-center rounded border font-bold transition-all duration-300 shrink-0 ${
                              isAligned
                                ? 'bg-[#ebc238]/10 text-[#ebc238] border-[#ebc238]/50 shadow-[0_0_8px_rgba(235,194,56,0.2)]'
                                : 'text-[#8c7e6a]/40 border-[#3b3426]/30'
                            }`}
                          >
                            {char}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Crib Row (slid to alignmentOffset) */}
                  <div className="flex items-center gap-2">
                    <span className="w-16 shrink-0 text-[10px] font-monospaced-technical text-[#8c7e6a] uppercase font-bold">Crib:</span>
                    <div className="flex-1 flex gap-1 font-monospaced-technical text-sm tracking-wider relative">
                      
                      {/* Leading space spacer */}
                      {Array.from({ length: alignmentOffset }).map((_, idx) => (
                        <div key={idx} className="w-7 h-8 border border-transparent shrink-0" />
                      ))}

                      {/* Actual sliding crib letter boxes */}
                      {crib.split('').map((char, idx) => {
                        const isConflict = alignedSection.positions[idx];
                        return (
                          <div
                            key={idx}
                            className={`w-7 h-8 flex flex-col items-center justify-center rounded border font-bold transition-all duration-300 shrink-0 ${
                              isConflict
                                ? 'bg-red-950/45 text-red-400 border-red-800 shadow-[0_0_12px_rgba(239,68,68,0.4)] animate-pulse'
                                : 'bg-[#ede1cd]/10 text-[#ede1cd] border-[#d1c4b7]/30'
                            }`}
                            title={isConflict ? `Conflict! Both positions are "${char}"` : ''}
                          >
                            <span className="leading-none">{char}</span>
                            {isConflict && (
                              <span className="text-[7px] text-red-500 font-bold block mt-0.5">💥</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* Verification Status Banner */}
            {ciphertext && crib && (
              <div className="pt-1">
                {alignedSection.isViable ? (
                  <div className="p-3 bg-green-950/25 border-2 border-green-900/60 text-green-300 rounded flex items-center gap-3">
                    <span className="material-symbols-outlined text-green-400 text-xl animate-bounce">verified</span>
                    <div className="text-xs">
                      <strong className="block uppercase tracking-wider text-green-400 text-[10px]">Alignment Viable (0 Overlaps)</strong>
                      Perfect! No character in this crib maps to the same ciphertext index. This alignment is eligible for electromechanical scanning!
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-red-950/25 border-2 border-red-900/60 text-red-300 rounded flex items-center gap-3 animate-headShake">
                    <span className="material-symbols-outlined text-red-400 text-xl">cancel</span>
                    <div className="text-xs">
                      <strong className="block uppercase tracking-wider text-red-400 text-[10px]">Impossible Alignment ({alignedSection.matchesCount} overlap{alignedSection.matchesCount > 1 ? 's' : ''})</strong>
                      Turing's derangement rule broken. This offset is impossible because letters cannot encrypt to themselves. Slide to another position.
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* The Turing-Welchman Bombe Rotors Search Panel */}
          <div className="bg-[#201b0f] border border-[#4e453b] rounded-lg p-5 shadow-panel texture-metal space-y-6">
            <div className="pb-1 border-b border-[#3b3426] flex justify-between items-center">
              <h3 className="text-ui-header font-ui-header text-[#e3c193] text-xs uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">settings_backup_restore</span>
                Turing-Welchman Bombe Engine
              </h3>
              <span className="text-[9px] text-[#8c7e6a] font-monospaced-technical">
                17,576 combinations
              </span>
            </div>

            {/* The spinning drum dials simulation */}
            <div className="flex justify-center items-center gap-6 py-4">
              
              {/* Drum Left (Slow) */}
              <div className="flex flex-col items-center gap-2">
                <div className={`relative w-20 h-20 rounded-full border-4 border-[#8b6f47] bg-[#120e04] shadow-2xl flex items-center justify-center overflow-hidden ${
                  isSearching ? 'animate-spin [animation-duration:0.6s]' : ''
                }`}>
                  <div className="absolute inset-0 bg-radial-gradient from-transparent to-[#120e04]/90 pointer-events-none" />
                  <span className="font-rotor-label text-3xl font-bold text-[#ede1cd] z-10 select-none">
                    {isSearching ? currentScan[0] : 'L'}
                  </span>
                  {/* Decorative teeth loops */}
                  <div className="absolute inset-2 border border-dashed border-[#8b6f47]/30 rounded-full" />
                </div>
                <span className="text-[10px] font-monospaced-technical text-[#8c7e6a] uppercase">Left Dial</span>
              </div>

              {/* Drum Middle (Medium) */}
              <div className="flex flex-col items-center gap-2">
                <div className={`relative w-20 h-20 rounded-full border-4 border-[#8b6f47] bg-[#120e04] shadow-2xl flex items-center justify-center overflow-hidden ${
                  isSearching ? 'animate-spin [animation-duration:0.3s]' : ''
                }`}>
                  <div className="absolute inset-0 bg-radial-gradient from-transparent to-[#120e04]/90 pointer-events-none" />
                  <span className="font-rotor-label text-3xl font-bold text-[#ede1cd] z-10 select-none">
                    {isSearching ? currentScan[1] : 'M'}
                  </span>
                  <div className="absolute inset-2 border border-dashed border-[#8b6f47]/30 rounded-full" />
                </div>
                <span className="text-[10px] font-monospaced-technical text-[#8c7e6a] uppercase">Middle Dial</span>
              </div>

              {/* Drum Right (Fast) */}
              <div className="flex flex-col items-center gap-2">
                <div className={`relative w-20 h-20 rounded-full border-4 border-[#8b6f47] bg-[#120e04] shadow-2xl flex items-center justify-center overflow-hidden ${
                  isSearching ? 'animate-spin [animation-duration:0.1s]' : ''
                }`}>
                  <div className="absolute inset-0 bg-radial-gradient from-transparent to-[#120e04]/90 pointer-events-none" />
                  <span className="font-rotor-label text-3xl font-bold text-[#ebc238] z-10 select-none">
                    {isSearching ? currentScan[2] : 'R'}
                  </span>
                  <div className="absolute inset-2 border border-dashed border-[#8b6f47]/30 rounded-full" />
                </div>
                <span className="text-[10px] font-monospaced-technical text-[#8c7e6a] uppercase">Right Dial</span>
              </div>

            </div>

            {/* Progress & Actions */}
            <div className="space-y-4">
              
              {isSearching && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-monospaced-technical text-[#ede1cd]">
                    <span>Scanning Dial Positions...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-2 bg-[#120e04] rounded-full overflow-hidden border border-[#3b3426]">
                    <div
                      className="h-full bg-amber-500 rounded-full shadow-[0_0_12px_rgba(245,158,11,0.6)] transition-all duration-100"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                onClick={startBombeSearch}
                disabled={isSearching || (alignmentScanMode === 'current' ? !alignedSection.isViable : viableOffsets.length === 0)}
                className={`w-full py-3.5 rounded border font-ui-header font-bold text-sm tracking-wide shadow-lg flex items-center justify-center gap-2 transition-all ${
                  isSearching
                    ? 'bg-[#3b3426] border-[#4e453b] text-[#8c7e6a] cursor-wait'
                    : (alignmentScanMode === 'current' ? alignedSection.isViable : viableOffsets.length > 0)
                    ? 'bg-amber-600 hover:bg-amber-500 text-white border-amber-500 shadow-amber-950/20 active:scale-[0.99] cursor-pointer'
                    : 'bg-[#1e1a12] border-[#3b3426] text-[#8c7e6a] cursor-not-allowed'
                }`}
              >
                <span className="material-symbols-outlined text-lg">electric_bolt</span>
                {isSearching ? `Cracking... (Pos: ${currentScan.join('-')})` : 'Initiate Bombe Search'}
              </button>
            </div>
          </div>

          {/* Matches & Decrypted Outputs Desk */}
          {!isSearching && matches.length > 0 && (
            <div className="bg-[#201b0f] border border-[#4e453b] rounded-lg p-5 shadow-panel texture-metal space-y-4 animate-fadeIn">
              <div className="pb-1 border-b border-[#3b3426] flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-green-400">task_alt</span>
                <h3 className="text-ui-header font-ui-header text-green-400 text-xs uppercase tracking-wider">
                  Cracked Key Settings Found ({matches.length})
                </h3>
              </div>

              {/* Ring Settings Alignment Mapper Box */}
              <div className="p-4 bg-[#120e04] rounded border border-[#3b3426] space-y-3">
                <div className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-amber-500 text-lg">ring_volume</span>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wider font-monospaced-technical">
                      Ringstellung (Ring Settings) Alignment Mapper
                    </h4>
                    <p className="text-[10px] text-[#8c7e6a] leading-normal font-monospaced-technical">
                      Because short cribs (like WETTER) rarely trigger a middle rotor step, you can map the scan results to <strong>any custom Ring Settings</strong>. Adjust the target rings below to instantly calculate the corresponding Starting Positions!
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-1">
                  {/* Left Ring */}
                  <div className="space-y-1">
                    <span className="text-[8px] text-[#8c7e6a] block uppercase font-monospaced-technical text-center">Target Left Ring</span>
                    <select
                      value={mapperLeftRing}
                      onChange={(e) => setMapperLeftRing(parseInt(e.target.value))}
                      className="w-full bg-[#1b170e] text-[#ede1cd] text-xs border border-[#4e453b] rounded py-1 px-1.5 focus:outline-none focus:border-[#ebc238] text-center cursor-pointer font-monospaced-technical"
                    >
                      {Array.from({ length: 26 }, (_, idx) => idx + 1).map((ring) => (
                        <option key={ring} value={ring} className="bg-[#1b170e]">
                          {formatRotorRing(ring, 'number')} ({formatRotorRing(ring, 'letter')})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Middle Ring */}
                  <div className="space-y-1">
                    <span className="text-[8px] text-[#8c7e6a] block uppercase font-monospaced-technical text-center">Target Middle Ring</span>
                    <select
                      value={mapperMiddleRing}
                      onChange={(e) => setMapperMiddleRing(parseInt(e.target.value))}
                      className="w-full bg-[#1b170e] text-[#ede1cd] text-xs border border-[#4e453b] rounded py-1 px-1.5 focus:outline-none focus:border-[#ebc238] text-center cursor-pointer font-monospaced-technical"
                    >
                      {Array.from({ length: 26 }, (_, idx) => idx + 1).map((ring) => (
                        <option key={ring} value={ring} className="bg-[#1b170e]">
                          {formatRotorRing(ring, 'number')} ({formatRotorRing(ring, 'letter')})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Right Ring */}
                  <div className="space-y-1">
                    <span className="text-[8px] text-[#8c7e6a] block uppercase font-monospaced-technical text-center">Target Right Ring</span>
                    <select
                      value={mapperRightRing}
                      onChange={(e) => setMapperRightRing(parseInt(e.target.value))}
                      className="w-full bg-[#1b170e] text-[#ede1cd] text-xs border border-[#4e453b] rounded py-1 px-1.5 focus:outline-none focus:border-[#ebc238] text-center cursor-pointer font-monospaced-technical"
                    >
                      {Array.from({ length: 26 }, (_, idx) => idx + 1).map((ring) => (
                        <option key={ring} value={ring} className="bg-[#1b170e]">
                          {formatRotorRing(ring, 'number')} ({formatRotorRing(ring, 'letter')})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {matches.map((match, idx) => {
                  const { l0Mapped, m0Mapped, r0Mapped } = findMappedStartingPositionAt0(
                    match.left, match.middle, match.right,
                    match.offset,
                    match.leftRotor, match.middleRotor, match.rightRotor,
                    leftRotorRing, middleRotorRing, rightRotorRing,
                    mapperLeftRing, mapperMiddleRing, mapperRightRing
                  );

                  return (
                    <div
                      key={idx}
                      className="bg-[#120e04] border border-green-900/40 p-4 rounded-md space-y-4 shadow-inner"
                    >
                      {/* Rotor Types & Mapping Grid */}
                      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between pb-3 border-b border-[#3b3426]/60">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-monospaced-technical text-[#8c7e6a] uppercase font-bold">Rotor Set:</span>
                            <span className="text-xs font-bold text-amber-500 bg-[#1b170e] px-2 py-0.5 rounded border border-[#3b3426]">
                              {match.leftRotor} - {match.middleRotor} - {match.rightRotor}
                            </span>
                            {match.offset > 0 && (
                              <span className="text-[9px] text-green-500 bg-green-950/40 border border-green-800/40 px-1.5 py-0.5 rounded font-bold font-monospaced-technical">
                                Matched at Crib Offset: {match.offset}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-monospaced-technical text-[#8c7e6a] uppercase">Raw Dial Scan:</span>
                            <span className="text-xs font-mono text-[#ede1cd]/80">
                              {match.left} - {match.middle} - {match.right} (at crib offset {match.offset} under scan rings {formatRotorRing(leftRotorRing)}-{formatRotorRing(middleRotorRing)}-{formatRotorRing(rightRotorRing)})
                            </span>
                          </div>
                        </div>

                        {/* Mapped Key Position */}
                        <div className="bg-[#1b170e] px-4 py-2.5 rounded border-2 border-green-800/40 space-y-0.5 text-center shrink-0 min-w-[150px] w-full md:w-auto">
                          <span className="text-[9px] font-monospaced-technical text-green-500 block uppercase font-bold tracking-wider">
                            Mapped Start Position (at Offset 0)
                          </span>
                          <span className="font-rotor-label text-lg font-bold text-green-400 tracking-widest block">
                            {l0Mapped} - {m0Mapped} - {r0Mapped}
                          </span>
                          <span className="text-[8px] font-monospaced-technical text-[#8c7e6a] block">
                            Rings: {formatRotorRing(mapperLeftRing)}-{formatRotorRing(mapperMiddleRing)}-{formatRotorRing(mapperRightRing)}
                          </span>
                        </div>
                      </div>

                      {/* Decryption Preview */}
                      <div className="space-y-1">
                        <span className="text-[9px] font-monospaced-technical text-[#8c7e6a] block uppercase">
                          Decrypted Output Message Segment:
                        </span>
                        <div className="bg-[#0b0802] border border-[#3b3426] p-3 rounded font-monospaced-technical text-xs tracking-wider text-[#ede1cd] max-h-24 overflow-y-auto uppercase select-text">
                          {match.decrypted}
                        </div>
                      </div>

                      {/* Welchman Diagonal Board Deduced Steckers */}
                      {match.deducedSteckers && Object.keys(match.deducedSteckers).length > 0 && (
                        <div className="p-3 bg-amber-950/30 border border-amber-800/40 rounded space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-monospaced-technical font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-xs">grid_4x4</span>
                              Welchman Diagonal Board Deduced Steckers ({Object.keys(match.deducedSteckers).length} self-reciprocal mappings)
                            </span>
                            {match.stopHypothesis && (
                              <span className="text-[9px] font-monospaced-technical text-amber-300 bg-amber-900/50 px-1.5 py-0.5 rounded border border-amber-700/50">
                                Stop Hypothesis: {match.stopHypothesis}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1.5 font-monospaced-technical text-xs">
                            {Object.entries(match.deducedSteckers).map(([node, stecker]) => (
                              <span
                                key={`${node}-${stecker}`}
                                className="px-2 py-0.5 rounded bg-[#1b170e] text-amber-300 border border-amber-800/50 font-bold"
                              >
                                {node}↔{stecker}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Apply Settings Button */}
                      <button
                        onClick={() => handleApplyMatchWithRings(match, mapperLeftRing, mapperMiddleRing, mapperRightRing, l0Mapped, m0Mapped, r0Mapped)}
                        className="w-full text-center text-xs bg-green-950/80 hover:bg-green-900 text-green-300 border border-green-800/80 px-3 py-2.5 rounded transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-1.5 font-ui-header"
                      >
                        <span className="material-symbols-outlined text-xs">logout</span>
                        Apply Settings ({match.leftRotor}-{match.middleRotor}-{match.rightRotor} with Rings {formatRotorRing(mapperLeftRing)}-{formatRotorRing(mapperMiddleRing)}-{formatRotorRing(mapperRightRing)} & Start {l0Mapped}-{m0Mapped}-{r0Mapped}) to Machine
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* No Matches Found Banner */}
          {!isSearching && hasSearched && matches.length === 0 && ciphertext && crib && alignedSection.isViable && (
            <div className="bg-[#201b0f] border border-red-900/50 p-5 rounded-lg shadow-panel texture-metal text-center space-y-2 animate-fadeIn">
              <span className="material-symbols-outlined text-red-500 text-3xl">error_outline</span>
              <h4 className="text-xs font-ui-header font-bold text-red-400 uppercase tracking-wider">
                No Matches Found
              </h4>
              <p className="text-[11px] text-[#d1c4b7] max-w-md mx-auto leading-normal">
                Completed electromechanical scan of all <strong>17,576</strong> dial positions, but found no valid key configurations matching the crib alignment.
              </p>
              <p className="text-[10px] text-[#8c7e6a] max-w-sm mx-auto leading-normal">
                This indicates that the rotor types, ring settings, reflector choice, or plugboard rules do not match the intercept's. Try loading a historical sample or verifying your current settings.
              </p>
            </div>
          )}

          {/* Waiting for Search Banner */}
          {!isSearching && !hasSearched && matches.length === 0 && ciphertext && crib && alignedSection.isViable && (
            <div className="bg-[#201b0f] border border-[#4e453b] p-5 rounded-lg shadow-panel texture-metal text-center space-y-2">
              <span className="material-symbols-outlined text-amber-500 text-3xl">question_mark</span>
              <h4 className="text-xs font-ui-header font-bold text-[#ede1cd] uppercase tracking-wider">
                Waiting for Search
              </h4>
              <p className="text-[11px] text-[#d1c4b7] max-w-md mx-auto leading-normal">
                Click the "Initiate Bombe Search" button to spin the electromechanical drums and search all 17,576 combinations for matches.
              </p>
            </div>
          )}

        </div>

      </div>

      {/* 1. Modal: Menu Graph Visualizer */}
      {showMenuGraphModal && crib && ciphertext && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1b170e] border border-[#4e453b] rounded-lg max-w-2xl w-full p-6 space-y-4 shadow-2xl relative texture-metal">
            <button
              onClick={() => setShowMenuGraphModal(false)}
              className="absolute top-4 right-4 text-[#8c7e6a] hover:text-[#ede1cd] transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="flex items-center gap-2 border-b border-[#3b3426] pb-3">
              <span className="material-symbols-outlined text-amber-500">hub</span>
              <h3 className="text-sm font-bold text-[#e3c193] font-ui-header uppercase tracking-wider">
                Crib Menu Graph (Electrical Scrambler Circuit)
              </h3>
            </div>

            <p className="text-xs text-[#d1c4b7] leading-relaxed font-monospaced-technical">
              In Alan Turing's Bombe design, each letter pairing in the aligned crib forms a menu edge connecting two character nodes. Closed loops (cycles) in this graph enable the electrical voltage to propagate across multiple scramblers simultaneously, eliminating false hypotheses.
            </p>

            {/* Menu Graph Edges Table */}
            <div className="bg-[#120e04] border border-[#3b3426] rounded p-3 max-h-60 overflow-y-auto font-monospaced-technical text-xs space-y-2">
              <div className="grid grid-cols-4 text-[#8c7e6a] uppercase text-[10px] font-bold border-b border-[#3b3426] pb-1">
                <span>Pos (Step)</span>
                <span>Crib Letter</span>
                <span>Cipher Letter</span>
                <span>Circuit Edge</span>
              </div>
              {crib.split('').map((cribChar, i) => {
                const cipherChar = ciphertext[alignmentOffset + i] || '?';
                return (
                  <div key={i} className="grid grid-cols-4 text-[#ede1cd] py-1 border-b border-[#3b3426]/40 items-center">
                    <span className="text-amber-500 font-bold">Step {i + 1}</span>
                    <span>{cribChar}</span>
                    <span>{cipherChar}</span>
                    <span className="text-green-400 font-bold bg-[#1b170e] px-2 py-0.5 rounded border border-[#3b3426] w-max">
                      {cribChar} ↔ {cipherChar}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowMenuGraphModal(false)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-bold font-ui-header cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal: 26x26 Welchman Diagonal Board Matrix */}
      {showDiagonalBoardModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1b170e] border border-[#4e453b] rounded-lg max-w-3xl w-full p-6 space-y-4 shadow-2xl relative texture-metal max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowDiagonalBoardModal(false)}
              className="absolute top-4 right-4 text-[#8c7e6a] hover:text-[#ede1cd] transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="flex items-center gap-2 border-b border-[#3b3426] pb-3">
              <span className="material-symbols-outlined text-amber-500">grid_on</span>
              <h3 className="text-sm font-bold text-[#e3c193] font-ui-header uppercase tracking-wider">
                Gordon Welchman's 26×26 Diagonal Board Matrix
              </h3>
            </div>

            <p className="text-xs text-[#d1c4b7] leading-relaxed font-monospaced-technical">
              Welchman's genius innovation (introduced in late 1939) connected plugboard wire (node X, stecker Y) directly to wire (node Y, stecker X). This symmetric reciprocity matrix enforces $X \leftrightarrow Y \iff Y \leftrightarrow X$, vastly accelerating voltage flow and reducing false stops by over 95%!
            </p>

            {/* 26x26 Visual Matrix grid preview */}
            <div className="bg-[#120e04] border border-[#3b3426] rounded p-3 overflow-x-auto">
              <div className="min-w-[600px] font-monospaced-technical text-[9px]">
                {/* Header Row */}
                <div className="flex gap-0.5 mb-1 font-bold text-amber-500">
                  <div className="w-5 h-5 flex items-center justify-center text-center">/</div>
                  {Array.from({ length: 26 }, (_, i) => (
                    <div key={i} className="w-5 h-5 flex items-center justify-center text-center">
                      {numToChar(i)}
                    </div>
                  ))}
                </div>

                {/* Rows */}
                {Array.from({ length: 26 }, (_, rIdx) => (
                  <div key={rIdx} className="flex gap-0.5 mb-0.5">
                    <div className="w-5 h-5 flex items-center justify-center font-bold text-amber-500 shrink-0">
                      {numToChar(rIdx)}
                    </div>
                    {Array.from({ length: 26 }, (_, cIdx) => {
                      const isSelf = rIdx === cIdx;
                      return (
                        <div
                          key={cIdx}
                          className={`w-5 h-5 rounded flex items-center justify-center font-mono border text-[8px] ${
                            isSelf
                              ? 'bg-red-950/40 border-red-800 text-red-500 font-bold'
                              : 'bg-[#1b170e] border-[#3b3426] text-[#8c7e6a]'
                          }`}
                          title={`Wire connection (${numToChar(rIdx)}, ${numToChar(cIdx)})`}
                        >
                          {isSelf ? '×' : '•'}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowDiagonalBoardModal(false)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-bold font-ui-header cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

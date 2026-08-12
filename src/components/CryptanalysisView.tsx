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
import { useTheme, getTheme } from '../lib/theme';

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

interface CryptanalysisMatch {
  leftRotor: string;
  middleRotor: string;
  rightRotor: string;
  left: string;
  middle: string;
  right: string;
  leftRing?: number;
  middleRing?: number;
  rightRing?: number;
  offset: number;
  decrypted: string;
  deducedSteckers?: Record<string, string>;
  stopHypothesis?: string;
  score?: number;
  selfEncryptCount?: number;
  germanTrigramScore?: number;
}

export const CryptanalysisView: React.FC<CryptanalysisViewProps> = ({
  config,
  onUpdateConfig,
  cipherTape,
  inputTape,
  setActiveTab,
  soundEnabled,
}) => {
  const { theme } = useTheme();
  const t = getTheme(theme);

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
  const [knownSteckers, setKnownSteckers] = useState<string>('');

  // Bombe Cryptanalysis Engine Mode
  const [bombeEngineMode, setBombeEngineMode] = useState<'welchman_diagonal' | 'direct_scan'>('welchman_diagonal');

  // Interactive Inspector Drawers & Modals
  const [showMenuGraphModal, setShowMenuGraphModal] = useState<boolean>(false);
  const [showDiagonalBoardModal, setShowDiagonalBoardModal] = useState<boolean>(false);
  const [showCompareModal, setShowCompareModal] = useState<boolean>(false);
  const [filterTopMatches, setFilterTopMatches] = useState<boolean>(true);
  const [codebookMatch, setCodebookMatch] = useState<CryptanalysisMatch | null>(null);
  const [copiedToast, setCopiedToast] = useState<string | null>(null);

  const [scanSpeed, setScanSpeed] = useState<'paused' | 'slow' | 'normal' | 'fast' | 'realtime'>('fast');
  const scanSpeedRef = useRef<'paused' | 'slow' | 'normal' | 'fast' | 'realtime'>('fast');

  useEffect(() => {
    scanSpeedRef.current = scanSpeed;
  }, [scanSpeed]);

  const [currentScanOffset, setCurrentScanOffset] = useState<number | null>(null);
  const [currentRotorComb, setCurrentRotorComb] = useState<string>('I-II-III');
  const [recentStop, setRecentStop] = useState<{
    left: string, middle: string, right: string, 
    offset: number, rotorComb: string, steckerHypothesis?: string, timestamp: number
  } | null>(null);

  const [isStopFlashing, setIsStopFlashing] = useState(false);
  useEffect(() => {
    if (recentStop) {
      setIsStopFlashing(true);
      const timer = setTimeout(() => setIsStopFlashing(false), 500);
      return () => clearTimeout(timer);
    }
  }, [recentStop]);

  // Search scope (single selected, 3-rotor permutations, or 5/8 rotor pools)
  const [rotorScanScope, setRotorScanScope] = useState<'selected' | 'permutations_3' | 'all_5' | 'all_8'>('selected');

  // Ringstellung search scope (find rings AAA-AAZ, AAA-AZZ, AAA-ZZZ)
  const [ringScanMode, setRingScanMode] = useState<'fixed' | 'right_26' | 'mid_right_676' | 'all_17576'>('fixed');

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

  // Async loop control refs
  const stopSearchRef = useRef<boolean>(false);
  const animFrameIdRef = useRef<number | null>(null);

  const stopBombeSearch = () => {
    stopSearchRef.current = true;
    if (animFrameIdRef.current !== null) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    setIsSearching(false);
  };
  const [matches, setMatches] = useState<CryptanalysisMatch[]>([]);
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
    bombeEngineMode,
    rotorScanScope,
    ringScanMode,
    alignmentScanMode,
    knownSteckers,
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

  // Helper to parse user provided known steckers (e.g. "AB CD EF" or "A-B C-D")
  const parseKnownSteckers = (input: string): Record<string, string> => {
    const map: Record<string, string> = {};
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
  };

  // German Trigram and Frequency Scoring for decrypted candidate text
  const GERMAN_TRIGRAMS = ['DER', 'DIE', 'DAS', 'UND', 'ICH', 'DEN', 'DEM', 'MIT', 'VON', 'DES', 'EIN', 'AUS', 'AUF', 'FUR', 'SCH', 'UNG', 'GEN', 'CHE', 'IGE'];

  const scoreDecryption = (decrypted: string, ciphertext: string, cribText: string): { score: number; selfEncryptCount: number; germanTrigramScore: number } => {
    let selfEncryptCount = 0;
    const cleanDec = decrypted.toUpperCase().replace(/[^A-Z]/g, '');
    const cleanCiph = ciphertext.toUpperCase().replace(/[^A-Z]/g, '');

    for (let i = 0; i < Math.min(cleanDec.length, cleanCiph.length); i++) {
      if (cleanDec[i] === cleanCiph[i]) {
        selfEncryptCount++;
      }
    }

    let germanTrigramScore = 0;
    for (const tri of GERMAN_TRIGRAMS) {
      if (cleanDec.includes(tri)) {
        germanTrigramScore += 15;
      }
    }

    let vowels = 0;
    for (let i = 0; i < cleanDec.length; i++) {
      if (['A', 'E', 'I', 'O', 'U'].includes(cleanDec[i])) {
        vowels++;
      }
    }
    const vowelRatio = cleanDec.length > 0 ? vowels / cleanDec.length : 0;
    if (vowelRatio >= 0.30 && vowelRatio <= 0.50) {
      germanTrigramScore += 20;
    }

    return { score: germanTrigramScore - (selfEncryptCount * 25), selfEncryptCount, germanTrigramScore };
  };

  const deduplicateAndScoreMatches = (
    matchesList: Array<CryptanalysisMatch>,
    cribText: string
  ): CryptanalysisMatch[] => {
    const seen = new Set<string>();
    const unique: CryptanalysisMatch[] = [];

    for (const m of matchesList) {
      const key = `${m.leftRotor}-${m.middleRotor}-${m.rightRotor}-${m.left}-${m.middle}-${m.right}-${m.offset}-${m.leftRing || 0}-${m.middleRing || 0}-${m.rightRing || 0}`;
      if (!seen.has(key)) {
        seen.add(key);

        const deducedCount = m.deducedSteckers ? Object.keys(m.deducedSteckers).length : 0;
        const { selfEncryptCount, germanTrigramScore } = scoreDecryption(m.decrypted, ciphertext, cribText);
        const totalScore = (cribText.length * 10) + (deducedCount * 8) + germanTrigramScore - (selfEncryptCount * 25);

        unique.push({
          ...m,
          score: totalScore,
          selfEncryptCount,
          germanTrigramScore,
        });
      }
    }

    unique.sort((a, b) => (b.score || 0) - (a.score || 0));
    return unique;
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
    const knownSteckersMap = parseKnownSteckers(knownSteckers);

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
      // If testNode has a known stecker pair and k contradicts it, skip hypothesis
      if (knownSteckersMap[numToChar(testNode)] && knownSteckersMap[numToChar(testNode)] !== numToChar(k)) {
        continue;
      }

      const energized = new Uint8Array(676); // 26 nodes x 26 stecker wires
      const queue: number[] = [];

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

  // Memoized rollback cache ref for fast O(1) lookup during post-processing
  const rollbackCacheRef = useRef<Map<string, Map<number, { l0: number; m0: number; r0: number }>>>(new Map());

  const getRollbackMap = (
    leftType: string, middleType: string, rightType: string,
    leftRing: number, middleRing: number, rightRing: number,
    offset: number
  ) => {
    if (offset === 0) return null;
    const key = `${leftType}-${middleType}-${rightType}-${leftRing}-${middleRing}-${rightRing}-${offset}`;
    if (!rollbackCacheRef.current.has(key)) {
      const middleR = prepareRotor(middleType, middleRing);
      const rightR = prepareRotor(rightType, rightRing);
      const map = new Map<number, { l0: number; m0: number; r0: number }>();

      for (let l = 0; l < 26; l++) {
        for (let m = 0; m < 26; m++) {
          for (let r = 0; r < 26; r++) {
            let lc = l;
            let mc = m;
            let rc = r;
            for (let s = 0; s < offset; s++) {
              const rightAtNotch = rightR.notches.includes(rc);
              const middleAtNotch = middleR.notches.includes(mc);
              rc = (rc + 1) % 26;
              if (rightAtNotch || middleAtNotch) {
                mc = (mc + 1) % 26;
                if (middleAtNotch) {
                  lc = (lc + 1) % 26;
                }
              }
            }
            const compositeKey = lc * 676 + mc * 26 + rc;
            if (!map.has(compositeKey)) {
              map.set(compositeKey, { l0: l, m0: m, r0: r });
            }
          }
        }
      }
      rollbackCacheRef.current.set(key, map);
    }
    return rollbackCacheRef.current.get(key)!;
  };

  // Rollback function: Instantly finds which starting position at index 0 steps to (lEnd, mEnd, rEnd) after offset steps.
  const findStartingPositionAt0 = (
    lEnd: number, mEnd: number, rEnd: number,
    offset: number,
    leftType: string, middleType: string, rightType: string,
    leftRing: number, middleRing: number, rightRing: number
  ): { l0: number, m0: number, r0: number } => {
    if (offset === 0) return { l0: lEnd, m0: mEnd, r0: rEnd };
    const map = getRollbackMap(leftType, middleType, rightType, leftRing, middleRing, rightRing, offset);
    if (!map) return { l0: lEnd, m0: mEnd, r0: rEnd };
    const compositeKey = lEnd * 676 + mEnd * 26 + rEnd;
    const res = map.get(compositeKey);
    if (res) return res;
    return { l0: lEnd, m0: mEnd, r0: rEnd };
  };

  // Helper to map relative offsets from 01-01-01 scan to custom physical Ring settings
  const getMappedStartChar = (startChar: string, searchRing: number, targetRing: number): string => {
    const startVal = charToNum(startChar);
    const relativeOffset = (startVal - (searchRing - 1) + 26) % 26;
    const targetStartVal = (relativeOffset + (targetRing - 1)) % 26;
    return numToChar(targetStartVal);
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

  // Helper to process raw matches into finalized, deduplicated, scored results
  const processFoundMatches = (
    rawMatches: Array<CryptanalysisMatch>,
    cribText: string
  ): CryptanalysisMatch[] => {
    const finalized: CryptanalysisMatch[] = [];

    for (const match of rawMatches) {
      const lR_start = ringScanMode === 'all_17576' ? 1 : leftRotorRing;
      const lR_end   = ringScanMode === 'all_17576' ? 26 : leftRotorRing;

      const mR_start = (ringScanMode === 'mid_right_676' || ringScanMode === 'all_17576') ? 1 : middleRotorRing;
      const mR_end   = (ringScanMode === 'mid_right_676' || ringScanMode === 'all_17576') ? 26 : middleRotorRing;

      const rR_start = ringScanMode !== 'fixed' ? 1 : rightRotorRing;
      const rR_end   = ringScanMode !== 'fixed' ? 26 : rightRotorRing;

      const refLVal = charToNum(match.left);
      const refMVal = charToNum(match.middle);
      const refRVal = charToNum(match.right);

      for (let lR = lR_start; lR <= lR_end; lR++) {
        for (let mR = mR_start; mR <= mR_end; mR++) {
          for (let rR = rR_start; rR <= rR_end; rR++) {
            const { l0, m0, r0 } = findStartingPositionAt0(
              refLVal, refMVal, refRVal,
              match.offset,
              match.leftRotor, match.middleRotor, match.rightRotor,
              lR, mR, rR
            );

            const decrypted = decryptFullMessageWithRotors(
              match.leftRotor, match.middleRotor, match.rightRotor,
              numToChar(l0), numToChar(m0), numToChar(r0),
              lR, mR, rR
            );

            const decSegment = decrypted.slice(match.offset, match.offset + cribText.length);
            if (bombeEngineMode === 'welchman_diagonal' || decSegment === cribText.toUpperCase()) {
              finalized.push({
                ...match,
                left: numToChar(l0),
                middle: numToChar(m0),
                right: numToChar(r0),
                leftRing: lR,
                middleRing: mR,
                rightRing: rR,
                decrypted,
              });
            }
          }
        }
      }
    }

    return deduplicateAndScoreMatches(finalized, cribText);
  };

  // Start electromechanical Bombe search
  const startBombeSearch = () => {
    // 1. Build list of offsets to scan based on user alignment selection
    const offsetsToScan = alignmentScanMode === 'all_viable' ? viableOffsets : [alignmentOffset];
    if (offsetsToScan.length === 0) return;

    stopSearchRef.current = false;
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

    const speedMap: Record<string, number> = {
      paused: 0,
      slow: 5,
      normal: 100,
      fast: 1000,
      realtime: 17576
    };

    let lastFoundMatchesCount = 0;

    const runBatch = () => {
      if (stopSearchRef.current) {
        // Search aborted by operator! Process any matches found up to cancellation
        if (foundMatches.length > 0) {
          const processed = processFoundMatches(foundMatches, crib);
          setMatches(processed);
          setHasSearched(true);
        }
        setIsSearching(false);
        return;
      }

      const speedSetting = scanSpeedRef.current;
      if (speedSetting === 'paused') {
        animFrameIdRef.current = requestAnimationFrame(runBatch);
        return;
      }

      if (currentCombIndex >= rotorCombs.length) {
        // Complete! Roll back found starting positions to offset 0 and fill in decryptions across requested Ring search scope
        const processed = processFoundMatches(foundMatches, crib);
        setMatches(processed);
        setHasSearched(true);
        setIsSearching(false);
        return;
      }

      const activeComb = rotorCombs[currentCombIndex];
      const leftR = getCachedRotor(activeComb.left, leftRotorRing);
      const middleR = getCachedRotor(activeComb.middle, middleRotorRing);
      const rightR = getCachedRotor(activeComb.right, rightRotorRing);

      const batchSize = speedMap[speedSetting];
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
      const totalSteps = rotorCombs.length * totalCombinationsPerRotor * precalculatedOffsets.length;
      const completedSteps = (currentCombIndex * totalCombinationsPerRotor + combinationIndex) * precalculatedOffsets.length;
      setProgress(Math.round((completedSteps / totalSteps) * 100));

      if (combinationIndex >= totalCombinationsPerRotor) {
        currentCombIndex++;
        combinationIndex = 0;
      }

      // Visual updates: show scanned position or active rotor combination names
      const currentActiveComb = rotorCombs[Math.min(currentCombIndex, rotorCombs.length - 1)];
      const lastR = limit % 26;
      const lastM = Math.floor(limit / 26) % 26;
      const lastL = Math.floor(limit / 676) % 26;
      
      setCurrentScan([numToChar(lastL), numToChar(lastM), numToChar(lastR)]);
      setCurrentRotorComb(`${currentActiveComb.left}-${currentActiveComb.middle}-${currentActiveComb.right}`);
      
      if (precalculatedOffsets.length > 0) {
        setCurrentScanOffset(precalculatedOffsets[0].offset); // Show first offset being scanned
      }

      if (foundMatches.length > lastFoundMatchesCount) {
        const lastMatch = foundMatches[foundMatches.length - 1];
        setRecentStop({
          left: lastMatch.left,
          middle: lastMatch.middle,
          right: lastMatch.right,
          offset: lastMatch.offset,
          rotorComb: `${lastMatch.leftRotor}-${lastMatch.middleRotor}-${lastMatch.rightRotor}`,
          steckerHypothesis: lastMatch.stopHypothesis,
          timestamp: Date.now()
        });
        lastFoundMatchesCount = foundMatches.length;
      }

      playRotorClickSound(soundEnabled);
      animFrameIdRef.current = requestAnimationFrame(runBatch);
    };

    animFrameIdRef.current = requestAnimationFrame(runBatch);
  };

  // Helper component for Rotor Dial visualization
  const RotorDial = ({ 
    rotorType, 
    ringSetting, 
    currentPosLetter, 
    label,
    isRecentStop
  }: { 
    rotorType: string, 
    ringSetting: number, 
    currentPosLetter: string, 
    label: string,
    isRecentStop: boolean
  }) => {
    const rotorDef = ROTOR_SPECS[rotorType as keyof typeof ROTOR_SPECS];
    const notches = rotorDef ? getRotorNotchPositions(rotorType as any) : [];
    const ringLetter = numToChar(ringSetting - 1);
    
    return (
      <div className="flex flex-col items-center gap-1 sm:gap-2">
        <div className={`relative w-20 h-20 sm:w-28 sm:h-28 lg:w-36 lg:h-36 rounded-full border-[3px] sm:border-4 ${isRecentStop ? 'border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]' : `${t.borderAccent}`} ${t.panelInner} shadow-xl flex items-center justify-center transition-colors duration-300`}>
          <div className={`absolute inset-0 bg-radial-gradient from-transparent ${t.codebookSheetBg.includes('slate') ? 'to-slate-900/10' : 'to-[#120e04]/90'} pointer-events-none rounded-full`} />
          
          {/* Outer Ring Letters */}
          {Array.from({ length: 26 }).map((_, i) => {
            const letter = String.fromCharCode(65 + i);
            const isNotch = notches.includes(i);
            const isRingSetting = letter === ringLetter;
            const angle = (i * (360 / 26)) - 90; // Start A at top
            
            return (
              <div 
                key={i}
                className="absolute w-full h-full pointer-events-none"
                style={{ transform: `rotate(${angle}deg)` }}
              >
                <div className="absolute top-[2%] sm:top-1 left-1/2 -translate-x-1/2 flex flex-col items-center">
                  {isNotch && <div className={`w-1 h-1 sm:w-1.5 sm:h-1.5 lg:w-2 lg:h-2 ${t.bgAccentSolid} mb-[1px]`} style={{ clipPath: 'polygon(50% 100%, 0 0, 100% 0)' }} />}
                  <span className={`text-[5px] sm:text-[7px] lg:text-[9px] ${t.fontMono} font-bold leading-none ${isRingSetting ? `${t.textAccent} drop-shadow-[0_0_3px_rgba(235,194,56,0.6)]` : `${t.textMuted}/40`}`} style={{ transform: `rotate(${-angle}deg)` }}>
                    {letter}
                  </span>
                </div>
              </div>
            );
          })}
          
          {/* Inner Ring / Wiring Position */}
          <span className={`${t.fontRotor} text-2xl sm:text-4xl lg:text-5xl font-bold z-10 select-none transition-colors duration-200 ${isRecentStop ? 'text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.8)]' : t.textAccent}`}>
            {currentPosLetter}
          </span>
        </div>
        <span className={`text-[8px] sm:text-[10px] ${t.fontMono} ${t.textMuted} uppercase text-center max-w-[80px] sm:max-w-none leading-tight`}>{label}</span>
      </div>
    );
  };
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
      <div className={`border-b ${t.borderBase} pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4`}>
        <div>
          <h1 className={`text-rotor-label ${t.fontRotor} ${t.textAccent} text-xl md:text-2xl flex items-center gap-2`}>
            <span className="material-symbols-outlined text-2xl">auto_fix</span>
            Turing-Welchman Bombe Simulator
          </h1>
          <p className={`${t.textMuted} text-xs ${t.fontBody}`}>
            Replicate Bletchley Park’s historical cryptanalysis techniques using a known plaintext fragment (Crib) slider and logical search.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => loadTemplate('navy_weather')}
            className={`text-xs ${t.fontHeader} ${t.panelInner} hover:opacity-85 ${t.textSecondary} border ${t.borderAccent} px-3 py-1.5 rounded transition-colors cursor-pointer`}
          >
            Kriegsmarine Wetter (Navy)
          </button>
          <button
            onClick={() => loadTemplate('army_intercept')}
            className={`text-xs ${t.fontHeader} ${t.panelInner} hover:opacity-85 ${t.textSecondary} border ${t.borderAccent} px-3 py-1.5 rounded transition-colors cursor-pointer`}
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
          <div className={`${t.panelInner} border-2 ${t.borderAccent}/50 shadow-panel rounded-lg p-4 relative overflow-hidden`}>
            <div className={`absolute top-0 right-0 w-16 h-16 ${t.accentLightBg} transform rotate-45 translate-x-8 -translate-y-8 pointer-events-none`} />
            <h3 className={`text-ui-header ${t.fontHeader} ${t.textAccent} text-xs uppercase tracking-wider pb-1.5 border-b ${t.borderBase}/60 flex items-center gap-2`}>
              <span className="material-symbols-outlined text-xs">gavel</span>
              Bletchley Park Protocol
            </h3>
            <p className={`text-[11px] ${t.textMuted} leading-relaxed pt-2`}>
              The Turing-Welchman <strong>Bombe</strong> cracked keys not by trying millions of full decrypts, but by exploiting a critical design flaw: <strong>Enigma can never encrypt a letter to itself</strong>.
            </p>
            <p className={`text-[11px] ${t.textMuted} leading-relaxed pt-2`}>
              By sliding a guessed phrase (Crib) against ciphertext, codebreakers immediately discarded alignments that had overlapping characters. Viable alignments were then scanned to find starting settings that yielded a perfect circuit path.
            </p>
          </div>

          {/* Active Scrambler Settings Card */}
          <div className={`${t.panelBg} border ${t.borderBase} rounded-lg p-4 shadow-panel ${t.appTexture} space-y-3.5`}>
            <h3 className={`text-ui-header ${t.fontHeader} ${t.textSecondary} text-xs uppercase tracking-wider pb-1.5 border-b ${t.borderBase} flex items-center gap-1.5`}>
              <span className="material-symbols-outlined text-xs">settings_input_component</span>
              Scrambler Key Target
            </h3>

            <div className="space-y-3 text-xs">
              {/* Rotor selection visualization */}
              <div className="grid grid-cols-3 gap-2">
                {/* Left Rotor Selector */}
                <div className={`${t.panelInner} p-2 rounded border ${t.borderBase} flex flex-col justify-between`}>
                  <label className={`text-[9px] ${t.textMuted} block uppercase ${t.fontMono} mb-1 text-center font-bold`}>Left Rotor</label>
                  <select
                    value={leftRotorType}
                    onChange={(e) => setLeftRotorType(e.target.value)}
                    className={`w-full ${t.panelBg} ${t.textPrimary} font-bold text-xs border ${t.borderBase} rounded py-1 px-1 focus:outline-none focus:${t.borderAccent} text-center cursor-pointer`}
                  >
                    {['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'].map((type) => (
                      <option key={type} value={type} className={`${t.panelBg}`}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <div className="mt-1.5">
                    <span className={`text-[8px] ${t.textMuted} block uppercase ${t.fontMono} text-center mb-0.5`}>Ring</span>
                    <select
                      value={leftRotorRing}
                      onChange={(e) => setLeftRotorRing(parseInt(e.target.value))}
                      className={`w-full ${t.panelBg} ${t.textAccent} text-[11px] border ${t.borderBase} rounded py-0.5 px-1 focus:outline-none focus:${t.borderAccent} text-center cursor-pointer`}
                    >
                      {Array.from({ length: 26 }, (_, idx) => idx + 1).map((ring) => (
                        <option key={ring} value={ring} className={`${t.panelBg}`}>
                          {formatRotorRing(ring)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Middle Rotor Selector */}
                <div className={`${t.panelInner} p-2 rounded border ${t.borderBase} flex flex-col justify-between`}>
                  <label className={`text-[9px] ${t.textMuted} block uppercase ${t.fontMono} mb-1 text-center font-bold`}>Middle Rotor</label>
                  <select
                    value={middleRotorType}
                    onChange={(e) => setMiddleRotorType(e.target.value)}
                    className={`w-full ${t.panelBg} ${t.textPrimary} font-bold text-xs border ${t.borderBase} rounded py-1 px-1 focus:outline-none focus:${t.borderAccent} text-center cursor-pointer`}
                  >
                    {['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'].map((type) => (
                      <option key={type} value={type} className={`${t.panelBg} ${t.textPrimary}`}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <div className="mt-1.5">
                    <span className={`text-[8px] ${t.textMuted} block uppercase ${t.fontMono} text-center mb-0.5`}>Ring</span>
                    <select
                      value={middleRotorRing}
                      onChange={(e) => setMiddleRotorRing(parseInt(e.target.value))}
                      className={`w-full ${t.panelBg} ${t.textAccent} text-[11px] border ${t.borderBase} rounded py-0.5 px-1 focus:outline-none focus:${t.borderAccent} text-center cursor-pointer`}
                    >
                      {Array.from({ length: 26 }, (_, idx) => idx + 1).map((ring) => (
                        <option key={ring} value={ring} className={`${t.panelBg}`}>
                          {formatRotorRing(ring)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Right Rotor Selector */}
                <div className={`${t.panelInner} p-2 rounded border ${t.borderBase} flex flex-col justify-between`}>
                  <label className={`text-[9px] ${t.textMuted} block uppercase ${t.fontMono} mb-1 text-center font-bold`}>Right Rotor</label>
                  <select
                    value={rightRotorType}
                    onChange={(e) => setRightRotorType(e.target.value)}
                    className={`w-full ${t.panelBg} ${t.textPrimary} font-bold text-xs border ${t.borderBase} rounded py-1 px-1 focus:outline-none focus:${t.borderAccent} text-center cursor-pointer`}
                  >
                    {['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'].map((type) => (
                      <option key={type} value={type} className={`${t.panelBg}`}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <div className="mt-1.5">
                    <span className={`text-[8px] ${t.textMuted} block uppercase ${t.fontMono} text-center mb-0.5`}>Ring</span>
                    <select
                      value={rightRotorRing}
                      onChange={(e) => setRightRotorRing(parseInt(e.target.value))}
                      className={`w-full ${t.panelBg} ${t.textAccent} text-[11px] border ${t.borderBase} rounded py-0.5 px-1 focus:outline-none focus:${t.borderAccent} text-center cursor-pointer`}
                    >
                      {Array.from({ length: 26 }, (_, idx) => idx + 1).map((ring) => (
                        <option key={ring} value={ring} className={`${t.panelBg}`}>
                          {formatRotorRing(ring)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Optional 4th Rotor and Reflector config */}
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className={`${t.panelInner} p-2 rounded border ${t.borderBase} flex flex-col justify-between`}>
                  <div>
                    <label className={`text-[9px] ${t.textMuted} block uppercase ${t.fontMono} mb-1 font-bold`}>4th Thin Rotor</label>
                    <select
                      value={fourthRotorType}
                      onChange={(e) => setFourthRotorType(e.target.value)}
                      className={`w-full ${t.panelBg} ${t.textPrimary} text-xs border ${t.borderBase} rounded py-1 px-1 focus:outline-none focus:${t.borderAccent} cursor-pointer`}
                    >
                      {['I', 'Beta', 'Gamma'].map((type) => (
                        <option key={type} value={type} className={`${t.panelBg}`}>
                          {type === 'I' ? 'None (3-Rotor)' : type}
                        </option>
                      ))}
                    </select>
                  </div>
                  {fourthRotorType !== 'I' && (
                    <div className="mt-1.5 flex gap-1">
                      <div className="w-1/2">
                        <span className={`text-[8px] ${t.textMuted} block uppercase ${t.fontMono} mb-0.5 text-center`}>Ring</span>
                        <select
                          value={fourthRotorRing}
                          onChange={(e) => setFourthRotorRing(parseInt(e.target.value))}
                          className={`w-full ${t.panelBg} ${t.textAccent} text-[10px] border ${t.borderBase} rounded py-0.5 px-1 focus:outline-none focus:${t.borderAccent} text-center cursor-pointer`}
                        >
                          {Array.from({ length: 26 }, (_, idx) => idx + 1).map((ring) => (
                            <option key={ring} value={ring} className={`${t.panelBg}`}>
                              {formatRotorRing(ring)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="w-1/2">
                        <span className={`text-[8px] ${t.textMuted} block uppercase ${t.fontMono} mb-0.5 text-center`}>Pos</span>
                        <select
                          value={fourthRotorStart}
                          onChange={(e) => setFourthRotorStart(parseInt(e.target.value))}
                          className={`w-full ${t.panelBg} ${t.textAccent} text-[10px] border ${t.borderBase} rounded py-0.5 px-1 focus:outline-none focus:${t.borderAccent} text-center cursor-pointer`}
                        >
                          {Array.from({ length: 26 }, (_, idx) => idx).map((pos) => (
                            <option key={pos} value={pos} className={`${t.panelBg}`}>
                              {numToChar(pos)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                <div className={`${t.panelInner} p-2 rounded border ${t.borderBase} flex flex-col justify-between`}>
                  <div>
                    <label className={`text-[9px] ${t.textMuted} block uppercase ${t.fontMono} mb-1 font-bold`}>Reflector</label>
                    <select
                      value={reflectorType}
                      onChange={(e) => setReflectorType(e.target.value)}
                      className={`w-full ${t.panelBg} ${t.textPrimary} text-xs border ${t.borderBase} rounded py-1 px-1 focus:outline-none focus:${t.borderAccent} cursor-pointer`}
                    >
                      {['Reflector A', 'Reflector B', 'Reflector C', 'Reflector B Thin', 'Reflector C Thin', 'UKW-Rocket', 'UKW-K'].map((ref) => (
                        <option key={ref} value={ref} className={`${t.panelBg}`}>
                          {ref}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Rotor Scan Scope Selector */}
              <div className="space-y-1.5">
                <label className={`text-[10px] ${t.textMuted} uppercase tracking-wider block ${t.fontMono}`}>
                  Rotor Scan Scope (Search All?)
                </label>
                <select
                  value={rotorScanScope}
                  onChange={(e) => setRotorScanScope(e.target.value as any)}
                  className={`w-full ${t.panelInner} ${t.textPrimary} text-xs border ${t.borderBase} rounded py-2 px-2.5 focus:outline-none focus:${t.borderAccent} cursor-pointer ${t.fontHeader}`}
                >
                  <option value="selected" className={`${t.panelBg}`}>Selected Rotor Types Only (1 combination)</option>
                  <option value="permutations_3" className={`${t.panelBg}`}>All Permutations of Selected (up to 6 combinations)</option>
                  <option value="all_5" className={`${t.panelBg}`}>Search All Combinations of Rotors I-V (60 combinations)</option>
                  <option value="all_8" className={`${t.panelBg}`}>Search All Combinations of Rotors I-VIII (336 combinations)</option>
                </select>

                {(config.fourthRotor.type === 'Beta' || config.fourthRotor.type === 'Gamma') && (
                  <div className={`p-1.5 ${t.panelInner} rounded border ${t.accentLightBg} border-${t.borderAccent} ${t.textAccent} text-[9px] ${t.fontMono} flex items-center gap-1`}>
                    <span className="material-symbols-outlined text-xs">info</span>
                    <span>M4 Active: The 4th Greek rotor ({config.fourthRotor.type}) position is held fixed per daily codebook rules while scanning the 3 driving wheels.</span>
                  </div>
                )}
              </div>

              {/* Ringstellung Search Scope (Find Rings) Selector */}
              <div className="space-y-1.5">
                <label className={`text-[10px] ${t.textMuted} uppercase tracking-wider block ${t.fontMono} flex items-center justify-between`}>
                  <span>Ringstellung Search Scope (Find Rings)</span>
                  <span className={`text-[9px] ${t.textAccent} font-bold ${t.fontMono}`}>
                    {ringScanMode === 'fixed' && 'Fixed Rings'}
                    {ringScanMode === 'right_26' && 'AAA - AAZ (26 Rings)'}
                    {ringScanMode === 'mid_right_676' && 'AAA - AZZ (676 Rings)'}
                    {ringScanMode === 'all_17576' && 'AAA - ZZZ (17,576 Rings)'}
                  </span>
                </label>
                <select
                  value={ringScanMode}
                  onChange={(e) => setRingScanMode(e.target.value as any)}
                  className={`w-full ${t.panelInner} ${t.textPrimary} text-xs border ${t.borderBase} rounded py-2 px-2.5 focus:outline-none focus:${t.borderAccent} cursor-pointer ${t.fontHeader}`}
                >
                  <option value="fixed" className={`${t.panelBg}`}>Fixed Selected Ring Settings (1 combination)</option>
                  <option value="right_26" className={`${t.panelBg}`}>Find Right Ring: AAA - AAZ (26 ring combinations)</option>
                  <option value="mid_right_676" className={`${t.panelBg}`}>Find Middle & Right Rings: AAA - AZZ (676 ring combinations)</option>
                  <option value="all_17576" className={`${t.panelBg}`}>Find All 3 Rings: AAA - ZZZ (17,576 ring combinations)</option>
                </select>
              </div>

              {/* Crib Alignment Scan Mode Select */}
              <div className="space-y-1.5">
                <label className={`text-[10px] ${t.textMuted} uppercase tracking-wider block ${t.fontMono}`}>
                  Crib Alignment Scan Mode
                </label>
                <select
                  value={alignmentScanMode}
                  onChange={(e) => setAlignmentScanMode(e.target.value as any)}
                  className={`w-full ${t.panelInner} ${t.textPrimary} text-xs border ${t.borderBase} rounded py-2 px-2.5 focus:outline-none focus:${t.borderAccent} cursor-pointer ${t.fontHeader}`}
                >
                  <option value="current" className={`${t.panelBg}`}>Current Slider Position Only (Offset: {alignmentOffset})</option>
                  <option value="all_viable" className={`${t.panelBg}`}>Auto-Scan All Viable Positions ({viableOffsets.length} valid)</option>
                </select>
              </div>

              {/* Plugboard Mode Switcher */}
              <div className="space-y-1.5">
                <label className={`text-[10px] ${t.textMuted} uppercase tracking-wider block ${t.fontMono}`}>
                  Bombe Cryptanalysis Algorithm
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setBombeEngineMode('welchman_diagonal')}
                    className={`py-1.5 px-2 text-[11px] rounded border transition-colors cursor-pointer ${t.fontHeader} flex flex-col items-center gap-0.5 ${
                      bombeEngineMode === 'welchman_diagonal'
                        ? `${t.buttonHighlight} font-semibold`
                        : `${t.buttonPrimary}`
                    }`}
                  >
                    <span className="font-bold flex items-center gap-1">
                      <span className={`material-symbols-outlined text-xs ${t.textAccent}`}>grid_4x4</span>
                      Welchman Diagonal Board
                    </span>
                    <span className="text-[8px] opacity-75">Full Reciprocity Circuit</span>
                  </button>
                  <button
                    onClick={() => setBombeEngineMode('direct_scan')}
                    className={`py-1.5 px-2 text-[11px] rounded border transition-colors cursor-pointer ${t.fontHeader} flex flex-col items-center gap-0.5 ${
                      bombeEngineMode === 'direct_scan'
                        ? `${t.buttonHighlight} font-semibold`
                        : `${t.buttonPrimary}`
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
                      className={`py-1 px-2 ${t.panelInner} hover:opacity-80 border ${t.borderBase} hover:${t.borderAccent} rounded text-[10px] ${t.textAccent} ${t.fontMono} flex items-center justify-center gap-1 transition-colors cursor-pointer`}
                    >
                      <span className="material-symbols-outlined text-xs">hub</span>
                      Inspect Menu Graph
                    </button>
                    <button
                      onClick={() => setShowDiagonalBoardModal(true)}
                      className={`py-1 px-2 ${t.panelInner} hover:opacity-85 border ${t.borderBase} hover:${t.borderAccent} rounded text-[10px] ${t.textAccent} ${t.fontMono} flex items-center justify-center gap-1 transition-colors cursor-pointer`}
                    >
                      <span className="material-symbols-outlined text-xs">grid_on</span>
                      26×26 Diagonal Matrix
                    </button>
                  </div>
                )}
              </div>

              {/* Plugboard Rule & Known Steckers */}
              <div className="space-y-1.5">
                <label className={`text-[10px] ${t.textMuted} uppercase tracking-wider block ${t.fontMono}`}>
                  Plugboard (Steckerbrett) Rule
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPlugboardMode('active')}
                    className={`py-1.5 text-xs rounded border transition-colors cursor-pointer ${t.fontHeader} ${
                      plugboardMode === 'active'
                        ? `${t.buttonHighlight} font-semibold`
                        : `${t.buttonPrimary}`
                    }`}
                  >
                    Use Active Plugboard
                  </button>
                  <button
                    onClick={() => setPlugboardMode('none')}
                    className={`py-1.5 text-xs rounded border transition-colors cursor-pointer ${t.fontHeader} ${
                      plugboardMode === 'none'
                        ? `${t.buttonHighlight} font-semibold`
                        : `${t.buttonPrimary}`
                    }`}
                  >
                    No Plugboard (Bare)
                  </button>
                </div>

                {/* Known Steckers Seed Input */}
                <div className="space-y-1 pt-1">
                  <label className={`text-[9px] ${t.textMuted} block uppercase ${t.fontMono} font-bold`}>
                    Known Steckers Seed (e.g. AB CD EF)
                  </label>
                  <input
                    type="text"
                    value={knownSteckers}
                    onChange={(e) => setKnownSteckers(e.target.value)}
                    placeholder="e.g. AT CD ER"
                    className={`w-full ${t.panelInner} ${t.textPrimary} text-xs ${t.fontMono} border ${t.borderBase} rounded py-1 px-2 focus:outline-none focus:${t.borderAccent}`}
                  />
                </div>

                {/* Display active plugboard connections */}
                <div className={`p-2 ${t.panelInner} rounded border ${t.borderBase} text-[10px] ${t.fontMono}`}>
                  <div className={`${t.textMuted} uppercase font-bold text-[9px] mb-1`}>
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
                                ? `${t.accentLightBg} ${t.textAccent} border-${t.borderAccent}`
                                : `${t.panelInner} ${t.textSecondary} line-through opacity-60`
                            }`}
                          >
                            {a}↔{b}
                          </span>
                        ))}
                    </div>
                  ) : (
                    <span className={`${t.textMuted} italic`}>No plugboard connections configured</span>
                  )}
                </div>
              </div>

              {/* Warning/Info */}
              <div className={`p-2.5 ${t.panelInner} rounded border ${t.borderBase} text-[10px] ${t.textMuted} ${t.fontMono} leading-normal`}>
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
          <div className={`${t.panelBg} border ${t.borderBase} rounded-lg p-5 shadow-panel ${t.appTexture} space-y-4`}>
            <div className={`pb-1 border-b ${t.borderBase} flex justify-between items-center`}>
              <h3 className={`text-ui-header ${t.fontHeader} ${t.textSecondary} text-xs uppercase tracking-wider flex items-center gap-2`}>
                <span className="material-symbols-outlined text-sm">view_week</span>
                Interactive Crib Alignment Ruler
              </h3>
              <span className={`text-[10px] ${t.fontMono} ${t.textAccent} ${t.accentLightBg} border-${t.borderAccent} px-2 py-0.5 rounded border font-bold`}>
                Slide & Match Station
              </span>
            </div>

            {/* Manual Entries */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`text-[10px] ${t.fontMono} ${t.textMuted} uppercase tracking-wider block mb-1`}>
                  Intercepted Ciphertext (A-Z)
                </label>
                <input
                  type="text"
                  value={ciphertext}
                  onChange={(e) => setCiphertext(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
                  placeholder="Type encrypted intercept text here..."
                  className={`w-full p-2 ${t.panelInner} border ${t.borderBase} rounded ${t.textAccent} ${t.fontMono} text-xs tracking-wider uppercase focus:outline-none focus:${t.borderAccent}`}
                />
              </div>
              <div>
                <label className={`text-[10px] ${t.fontMono} ${t.textMuted} uppercase tracking-wider block mb-1`}>
                  Guessed Plaintext Segment (Crib)
                </label>
                <input
                  type="text"
                  value={crib}
                  onChange={(e) => setCrib(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
                  placeholder="e.g. WETTERVORHERSAGE"
                  className={`w-full p-2 ${t.panelInner} border ${t.borderBase} rounded ${t.textPrimary} ${t.fontMono} text-xs tracking-wider uppercase focus:outline-none focus:${t.borderAccent}`}
                />
              </div>
            </div>

            {/* Slider control */}
            {maxOffset > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className={`flex justify-between text-[11px] ${t.fontMono} ${t.textMuted}`}>
                  <span>Alignment Offset Position</span>
                  <span className={`font-bold ${t.textAccent}`}>{alignmentOffset} chars</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={maxOffset}
                  value={alignmentOffset}
                  onChange={(e) => setAlignmentOffset(Number(e.target.value))}
                  className={`w-full h-1.5 ${t.panelInner} rounded-lg appearance-none cursor-pointer ${t.sliderAccent} border ${t.borderBase}`}
                />
                
                {/* Viable Zero-Overlap Offsets Badges */}
                {viableOffsets.length > 0 && (
                  <div className={`flex flex-wrap items-center gap-1.5 pt-1.5 text-[10px] ${t.fontMono} ${t.textMuted}`}>
                    <span className={`font-bold ${t.textMuted}`}>Viable Zero-Overlap Offsets:</span>
                    {viableOffsets.map((offset) => (
                      <button
                        key={offset}
                        onClick={() => setAlignmentOffset(offset)}
                        className={`px-2 py-0.5 rounded border cursor-pointer transition-all ${
                          alignmentOffset === offset
                            ? `${t.successLightBg} border-green-500 ${t.successText} font-bold shadow-md`
                            : `${t.buttonPrimary}`
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
              <div ref={scrollContainerRef} className={`${t.panelInner} rounded border ${t.borderBase} p-4 overflow-x-auto select-none`}>
                <div className="flex flex-col gap-3 min-w-[500px]">
                  
                  {/* Full Ciphertext Row */}
                  <div className="flex items-center gap-2">
                    <span className={`w-16 shrink-0 text-[10px] ${t.fontMono} ${t.textMuted} uppercase`}>Intercept:</span>
                    <div className={`flex-1 flex gap-1 ${t.fontMono} text-sm tracking-wider`}>
                      {ciphertext.split('').map((char, idx) => {
                        const isAligned = idx >= alignmentOffset && idx < alignmentOffset + crib.length;
                        return (
                          <div
                            key={idx}
                            className={`w-7 h-8 flex items-center justify-center rounded border font-bold transition-all duration-300 shrink-0 ${
                              isAligned
                                ? `${t.accentLightBg} ${t.textAccent} border-${t.borderAccent} shadow-sm`
                                : `${t.textSecondary}/40 ${t.borderBase}/30`
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
                    <span className={`w-16 shrink-0 text-[10px] ${t.fontMono} ${t.textMuted} uppercase font-bold`}>Crib:</span>
                    <div className={`flex-1 flex gap-1 ${t.fontMono} text-sm tracking-wider relative`}>
                      
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
                                ? `${t.dangerLightBg} ${t.dangerText} border-red-800 shadow-md animate-pulse`
                                : `${t.panelInner} ${t.textPrimary} border-current/20`
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
                  <div className={`p-3 ${t.successLightBg} border-2 border-green-900/60 ${t.successText} rounded flex items-center gap-3`}>
                    <span className={`material-symbols-outlined ${t.successText} text-xl animate-bounce`}>verified</span>
                    <div className="text-xs">
                      <strong className={`block uppercase tracking-wider ${t.successText} text-[10px]`}>Alignment Viable (0 Overlaps)</strong>
                      Perfect! No character in this crib maps to the same ciphertext index. This alignment is eligible for electromechanical scanning!
                    </div>
                  </div>
                ) : (
                  <div className={`p-3 ${t.dangerBg} border-2 rounded flex items-center gap-3 animate-headShake`}>
                    <span className={`material-symbols-outlined ${t.dangerText} text-xl`}>cancel</span>
                    <div className="text-xs">
                      <strong className={`block uppercase tracking-wider ${t.dangerText} text-[10px]`}>Impossible Alignment ({alignedSection.matchesCount} overlap{alignedSection.matchesCount > 1 ? 's' : ''})</strong>
                      Turing's derangement rule broken. This offset is impossible because letters cannot encrypt to themselves. Slide to another position.
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* The Turing-Welchman Bombe Rotors Search Panel */}
          <div className={`${t.panelBg} border ${t.borderBase} rounded-lg p-5 shadow-panel ${t.appTexture} space-y-6`}>
            <div className={`pb-1 border-b ${t.borderBase} flex justify-between items-center`}>
              <h3 className={`text-ui-header ${t.fontHeader} ${t.textSecondary} text-xs uppercase tracking-wider flex items-center gap-2`}>
                <span className="material-symbols-outlined text-sm">settings_backup_restore</span>
                Turing-Welchman Bombe Engine
              </h3>
              <span className={`text-[9px] ${t.textMuted} ${t.fontMono}`}>
                17,576 combinations
              </span>
            </div>

            {/* Top row: Speed slider (full width) + progress % (right-aligned) */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className={`flex justify-between items-center mb-1 text-[10px] ${t.textMuted} uppercase ${t.fontMono}`}>
                  <span>Scan Speed</span>
                </div>
                <input 
                  type="range" 
                  min="0" max="4" 
                  value={['paused', 'slow', 'normal', 'fast', 'realtime'].indexOf(scanSpeed)}
                  onChange={(e) => {
                    const speeds = ['paused', 'slow', 'normal', 'fast', 'realtime'] as const;
                    setScanSpeed(speeds[parseInt(e.target.value)]);
                  }}
                  className={`w-full ${t.sliderAccent} cursor-pointer`}
                />
                <div className={`flex justify-between text-[8px] ${t.textMuted} mt-1 ${t.fontMono} uppercase px-1`}>
                  <span>Paused</span>
                  <span>Slow</span>
                  <span>Normal</span>
                  <span>Fast</span>
                  <span>Realtime</span>
                </div>
              </div>
              
              <div className="flex flex-col items-end w-32 shrink-0">
                <span className={`text-xs ${t.fontMono} ${t.textPrimary} mb-1`}>{progress}%</span>
                <div className={`w-full h-2 ${t.panelInner} rounded-full overflow-hidden border ${t.borderBase}`}>
                  <div
                    className={`h-full ${t.progressFill} rounded-full transition-all duration-100`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* The spinning drum dials simulation */}
            <div className="flex justify-center items-center gap-3 sm:gap-8 lg:gap-12 py-2 lg:py-6">
              <RotorDial 
                rotorType={currentRotorComb.split('-')[0] || leftRotorType}
                ringSetting={leftRotorRing}
                currentPosLetter={currentScan[0]}
                label="Left Dial (Slow)"
                isRecentStop={isStopFlashing}
              />
              <RotorDial 
                rotorType={currentRotorComb.split('-')[1] || middleRotorType}
                ringSetting={middleRotorRing}
                currentPosLetter={currentScan[1]}
                label="Middle Dial"
                isRecentStop={isStopFlashing}
              />
              <RotorDial 
                rotorType={currentRotorComb.split('-')[2] || rightRotorType}
                ringSetting={rightRotorRing}
                currentPosLetter={currentScan[2]}
                label="Right Dial (Fast)"
                isRecentStop={isStopFlashing}
              />
            </div>

            {/* Rotor Combination Badge & Offset */}
            <div className={`flex justify-between items-center ${t.panelInner} border ${t.borderBase} p-2 rounded`}>
              <div className="flex items-center gap-3">
                <span className={`text-xs ${t.textAccent} font-bold ${t.fontMono} uppercase px-2 py-1 ${t.accentLightBg} border-${t.borderAccent} rounded border flex items-center gap-1`}>
                  {currentRotorComb}
                  {isStopFlashing && (
                    <span className="ml-1 px-1 bg-green-500 text-black text-[9px] rounded">STOP</span>
                  )}
                </span>
                <span className={`text-[10px] ${t.textMuted} ${t.fontMono}`}>
                  Offset: {currentScanOffset ?? alignmentOffset}
                </span>
              </div>
              <div className={`text-[10px] ${t.textPrimary} ${t.fontMono} text-right flex-1 ml-4 truncate`}>
                {isSearching 
                  ? (isStopFlashing && recentStop) 
                      ? <span className="text-green-400 font-bold">⚡ STOP! {recentStop.rotorComb} at {recentStop.left}-{recentStop.middle}-{recentStop.right} — hypothesis: {recentStop.steckerHypothesis || 'Valid'}</span>
                      : `Testing ${currentScan.join('-')} at offset ${currentScanOffset ?? alignmentOffset}...`
                  : matches.length > 0
                    ? `Search complete. ${matches.length} stops found.`
                    : "Ready — select rotor types and start the search"}
              </div>
            </div>

            {/* Educational Context Strip */}
            <div className={`text-[9px] ${t.textMuted} ${t.fontMono} text-center border-t ${t.borderBase}/50 pt-3`}>
              {isSearching ? (
                isStopFlashing ? "A Bombe stop means this rotor setting produced a valid electrical circuit through the diagonal board." : "Outer ring = Ringstellung (notch position). Inner letter = wiring position being tested."
              ) : (
                matches.length > 0 ? "All combinations scanned. Review stops below to apply settings to the machine." : "The Bombe tests 17,576 start positions per rotor combination. Each position is a unique setting of the three driving rotors."
              )}
            </div>

            {/* Actions */}
            <div className="pt-2">
              {!isSearching ? (
                <button
                  onClick={startBombeSearch}
                  disabled={alignmentScanMode === 'current' ? !alignedSection.isViable : viableOffsets.length === 0}
                  className={`w-full py-3.5 rounded border ${t.fontHeader} font-bold text-sm tracking-wide shadow-lg flex items-center justify-center gap-2 transition-all ${
                    (alignmentScanMode === 'current' ? alignedSection.isViable : viableOffsets.length > 0)
                      ? `${t.buttonHighlight} shadow-amber-950/20 active:scale-[0.99] cursor-pointer`
                      : `${t.buttonPrimary} opacity-50 cursor-not-allowed`
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">electric_bolt</span>
                  Initiate Bombe Search
                </button>
              ) : (
                <button
                  onClick={stopBombeSearch}
                  title="Stop Bombe Cracking Operation"
                  className={`w-full py-3.5 bg-red-950/90 hover:bg-red-900 text-red-200 border-2 border-red-700 hover:border-red-500 rounded ${t.fontHeader} font-bold text-sm tracking-wider flex items-center justify-center gap-2 shadow-lg hover:shadow-red-950/60 active:scale-95 cursor-pointer transition-all`}
                >
                  <span className="material-symbols-outlined text-lg text-red-400">stop_circle</span>
                  <span>STOP SEARCH</span>
                </button>
              )}
            </div>
          </div>

          {/* Matches & Decrypted Outputs Desk */}
          {!isSearching && matches.length > 0 && (
            <div className={`${t.panelBg} border ${t.borderBase} rounded-lg p-5 shadow-panel ${t.appTexture} space-y-4 animate-fadeIn`}>
              <div className={`pb-1 border-b ${t.borderBase} flex items-center gap-2`}>
                <span className="material-symbols-outlined text-sm text-green-400">task_alt</span>
                <h3 className={`text-ui-header ${t.fontHeader} text-green-400 text-xs uppercase tracking-wider`}>
                  Cracked Key Settings Found ({matches.length})
                </h3>
              </div>

              {/* Ring Settings Alignment Mapper Box */}
              <div className={`p-4 ${t.panelInner} rounded border ${t.borderBase} space-y-3`}>
                <div className="flex items-start gap-2.5">
                  <span className={`material-symbols-outlined ${t.textAccent} text-lg`}>ring_volume</span>
                  <div className="space-y-1">
                    <h4 className={`text-xs font-bold ${t.textAccent} uppercase tracking-wider ${t.fontMono}`}>
                      Ringstellung (Ring Settings) Alignment Mapper
                    </h4>
                    <p className={`text-[10px] ${t.textMuted} leading-normal ${t.fontMono}`}>
                      Because short cribs (like WETTER) rarely trigger a middle rotor step, you can map the scan results to <strong>any custom Ring Settings</strong>. Adjust the target rings below to instantly calculate the corresponding Starting Positions!
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-1">
                  {/* Left Ring */}
                  <div className="space-y-1">
                    <span className={`text-[8px] ${t.textMuted} block uppercase ${t.fontMono} text-center`}>Target Left Ring</span>
                    <select
                      value={mapperLeftRing}
                      onChange={(e) => setMapperLeftRing(parseInt(e.target.value))}
                      className={`w-full ${t.panelBg} ${t.textPrimary} text-xs border ${t.borderBase} rounded py-1 px-1.5 focus:outline-none focus:${t.borderAccent} text-center cursor-pointer ${t.fontMono}`}
                    >
                      {Array.from({ length: 26 }, (_, idx) => idx + 1).map((ring) => (
                        <option key={ring} value={ring} className={`${t.panelBg}`}>
                          {formatRotorRing(ring, 'number')} ({formatRotorRing(ring, 'letter')})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Middle Ring */}
                  <div className="space-y-1">
                    <span className={`text-[8px] ${t.textMuted} block uppercase ${t.fontMono} text-center`}>Target Middle Ring</span>
                    <select
                      value={mapperMiddleRing}
                      onChange={(e) => setMapperMiddleRing(parseInt(e.target.value))}
                      className={`w-full ${t.panelBg} ${t.textPrimary} text-xs border ${t.borderBase} rounded py-1 px-1.5 focus:outline-none focus:${t.borderAccent} text-center cursor-pointer ${t.fontMono}`}
                    >
                      {Array.from({ length: 26 }, (_, idx) => idx + 1).map((ring) => (
                        <option key={ring} value={ring} className={`${t.panelBg}`}>
                          {formatRotorRing(ring, 'number')} ({formatRotorRing(ring, 'letter')})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Right Ring */}
                  <div className="space-y-1">
                    <span className={`text-[8px] ${t.textMuted} block uppercase ${t.fontMono} text-center`}>Target Right Ring</span>
                    <select
                      value={mapperRightRing}
                      onChange={(e) => setMapperRightRing(parseInt(e.target.value))}
                      className={`w-full ${t.panelBg} ${t.textPrimary} text-xs border ${t.borderBase} rounded py-1 px-1.5 focus:outline-none focus:${t.borderAccent} text-center cursor-pointer ${t.fontMono}`}
                    >
                      {Array.from({ length: 26 }, (_, idx) => idx + 1).map((ring) => (
                        <option key={ring} value={ring} className={`${t.panelBg}`}>
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

                  const matchLeftRing = match.leftRing ?? mapperLeftRing;
                  const matchMiddleRing = match.middleRing ?? mapperMiddleRing;
                  const matchRightRing = match.rightRing ?? mapperRightRing;

                  const displayStartLeft = match.leftRing !== undefined ? match.left : l0Mapped;
                  const displayStartMiddle = match.middleRing !== undefined ? match.middle : m0Mapped;
                  const displayStartRight = match.rightRing !== undefined ? match.right : r0Mapped;

                  return (
                    <div
                      key={idx}
                      className={`${t.panelInner} border ${t.successBadge} p-4 rounded-md space-y-4 shadow-inner`}
                    >
                      {/* Rotor Types & Mapping Grid */}
                      <div className={`flex flex-col md:flex-row gap-4 items-start md:items-center justify-between pb-3 border-b ${t.borderBase}/60`}>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] ${t.fontMono} ${t.textMuted} uppercase font-bold`}>Rotor Set:</span>
                            <span className={`text-xs font-bold ${t.textAccent} ${t.panelBg} px-2 py-0.5 rounded border ${t.borderBase}`}>
                              {match.leftRotor} - {match.middleRotor} - {match.rightRotor}
                            </span>
                            {match.leftRing !== undefined && (
                              <span className={`text-[9px] ${t.accentLightBg} ${t.textAccent} border-${t.borderAccent} px-1.5 py-0.5 rounded font-bold ${t.fontMono}`}>
                                Discovered Rings: {formatRotorRing(match.leftRing)}-{formatRotorRing(match.middleRing)}-{formatRotorRing(match.rightRing)}
                              </span>
                            )}
                            {match.offset > 0 && (
                              <span className={`text-[9px] ${t.successLightBg} ${t.successText} border-green-800/40 px-1.5 py-0.5 rounded font-bold ${t.fontMono}`}>
                                Matched at Crib Offset: {match.offset}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] ${t.fontMono} ${t.textMuted} uppercase`}>Raw Dial Scan:</span>
                            <span className={`text-xs font-mono ${t.textPrimary}/80`}>
                              {match.left} - {match.middle} - {match.right} (at crib offset {match.offset} under scan rings {formatRotorRing(leftRotorRing)}-{formatRotorRing(middleRotorRing)}-{formatRotorRing(rightRotorRing)})
                            </span>
                          </div>
                        </div>

                        {/* Mapped Key Position */}
                        <div className={`${t.panelBg} px-4 py-2.5 rounded border-2 ${t.successLightBg} border-green-300 shadow-sm space-y-0.5 text-center shrink-0 min-w-[150px] w-full md:w-auto`}>
                          <span className={`text-[9px] ${t.fontMono} ${t.successText} block uppercase font-bold tracking-wider`}>
                            {match.leftRing !== undefined ? 'Discovered Start Position (Offset 0)' : 'Mapped Start Position (Offset 0)'}
                          </span>
                          <span className={`${t.fontRotor} text-lg font-bold ${t.successText} tracking-widest block`}>
                            {displayStartLeft} - {displayStartMiddle} - {displayStartRight}
                          </span>
                          <span className={`text-[8px] ${t.fontMono} ${t.textMuted} block`}>
                            Rings: {formatRotorRing(matchLeftRing)}-{formatRotorRing(matchMiddleRing)}-{formatRotorRing(matchRightRing)} ({numToChar(matchLeftRing - 1)}{numToChar(matchMiddleRing - 1)}{numToChar(matchRightRing - 1)})
                          </span>
                        </div>
                      </div>

                      {/* Decryption Preview */}
                      <div className="space-y-1">
                        <span className={`text-[9px] ${t.fontMono} ${t.textMuted} block uppercase`}>
                          Decrypted Output Message Segment:
                        </span>
                        <div className={`${t.wellInnerBg} border ${t.borderBase} p-3 rounded ${t.fontMono} text-xs tracking-wider ${t.textPrimary} max-h-24 overflow-y-auto uppercase select-text`}>
                          {match.decrypted}
                        </div>
                      </div>

                      {/* Welchman Diagonal Board Deduced Steckers */}
                      {match.deducedSteckers && Object.keys(match.deducedSteckers).length > 0 && (
                        <div className={`p-3 ${t.accentLightBg} border-${t.borderAccent} rounded space-y-2 shadow-sm`}>
                          <div className="flex items-center justify-between">
                            <span className={`text-[10px] ${t.fontMono} font-bold ${t.textAccent} uppercase tracking-wider flex items-center gap-1.5`}>
                              <span className="material-symbols-outlined text-xs">grid_4x4</span>
                              Welchman Diagonal Board Deduced Steckers ({Object.keys(match.deducedSteckers).length} self-reciprocal mappings)
                            </span>
                            {match.stopHypothesis && (
                              <span className={`text-[9px] ${t.fontMono} ${t.accentLightBg} ${t.textAccent} border-${t.borderAccent} px-1.5 py-0.5 rounded border`}>
                                Stop Hypothesis: {match.stopHypothesis}
                              </span>
                            )}
                          </div>
                          <div className={`flex flex-wrap gap-1.5 ${t.fontMono} text-xs`}>
                            {Object.entries(match.deducedSteckers).map(([node, stecker]) => (
                              <span
                                key={`${node}-${stecker}`}
                                className={`px-2 py-0.5 rounded border ${t.indicatorBg} ${t.textAccent} border-${t.borderAccent} font-bold`}
                              >
                                {node}↔{stecker}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Apply Settings Button */}
                      <button
                        onClick={() => handleApplyMatchWithRings(match, matchLeftRing, matchMiddleRing, matchRightRing, displayStartLeft, displayStartMiddle, displayStartRight)}
                        className={`w-full text-center text-xs ${t.buttonSuccess} px-3 py-2.5 rounded transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-1.5 ${t.fontHeader}`}
                      >
                        <span className="material-symbols-outlined text-xs">logout</span>
                        Apply Settings ({match.leftRotor}-{match.middleRotor}-{match.rightRotor} with Rings {formatRotorRing(matchLeftRing)}-{formatRotorRing(matchMiddleRing)}-{formatRotorRing(matchRightRing)} & Start {displayStartLeft}-{displayStartMiddle}-{displayStartRight}) to Machine
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* No Matches Found Banner */}
          {!isSearching && hasSearched && matches.length === 0 && ciphertext && crib && alignedSection.isViable && (
            <div className={`${t.panelBg} border ${t.borderBase} p-5 rounded-lg shadow-panel ${t.appTexture} text-center space-y-2 animate-fadeIn`}>
              <span className={`material-symbols-outlined ${t.dangerText} text-3xl`}>error_outline</span>
              <h4 className={`text-xs ${t.fontHeader} font-bold ${t.dangerText} uppercase tracking-wider`}>
                No Matches Found
              </h4>
              <p className={`text-[11px] ${t.textMuted} max-w-md mx-auto leading-normal`}>
                Completed electromechanical scan of all <strong>17,576</strong> dial positions, but found no valid key configurations matching the crib alignment.
              </p>
              <p className={`text-[10px] ${t.textMuted} max-w-sm mx-auto leading-normal`}>
                This indicates that the rotor types, ring settings, reflector choice, or plugboard rules do not match the intercept's. Try loading a historical sample or verifying your current settings.
              </p>
            </div>
          )}

          {/* Waiting for Search Banner */}
          {!isSearching && !hasSearched && matches.length === 0 && ciphertext && crib && alignedSection.isViable && (
            <div className={`${t.panelBg} border ${t.borderBase} p-5 rounded-lg shadow-panel ${t.appTexture} text-center space-y-2`}>
              <span className={`material-symbols-outlined ${t.textAccent} text-3xl`}>question_mark</span>
              <h4 className={`text-xs ${t.fontHeader} font-bold ${t.textPrimary} uppercase tracking-wider`}>
                Waiting for Search
              </h4>
              <p className={`text-[11px] ${t.textMuted} max-w-md mx-auto leading-normal`}>
                Click the "Initiate Bombe Search" button to spin the electromechanical drums and search all 17,576 combinations for matches.
              </p>
            </div>
          )}

        </div>

      </div>

      {/* 1. Modal: Menu Graph Visualizer */}
      {showMenuGraphModal && crib && ciphertext && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`${t.modalBg} border ${t.borderBase} rounded-lg max-w-2xl w-full p-6 space-y-4 shadow-2xl relative ${t.appTexture}`}>
            <button
              onClick={() => setShowMenuGraphModal(false)}
              className={`absolute top-4 right-4 ${t.textMuted} hover:${t.textPrimary} transition-colors cursor-pointer`}
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className={`flex items-center gap-2 border-b ${t.borderBase} pb-3`}>
              <span className={`material-symbols-outlined ${t.textAccent}`}>hub</span>
              <h3 className={`text-sm font-bold ${t.textSecondary} ${t.fontHeader} uppercase tracking-wider`}>
                Crib Menu Graph (Electrical Scrambler Circuit)
              </h3>
            </div>

            <p className={`text-xs ${t.textMuted} leading-relaxed ${t.fontMono}`}>
              In Alan Turing's Bombe design, each letter pairing in the aligned crib forms a menu edge connecting two character nodes. Closed loops (cycles) in this graph enable the electrical voltage to propagate across multiple scramblers simultaneously, eliminating false hypotheses.
            </p>

            {/* Menu Graph Edges Table */}
            <div className={`${t.panelInner} border ${t.borderBase} rounded p-3 max-h-60 overflow-y-auto ${t.fontMono} text-xs space-y-2`}>
              <div className={`grid grid-cols-4 ${t.textMuted} uppercase text-[10px] font-bold border-b ${t.borderBase} pb-1`}>
                <span>Pos (Step)</span>
                <span>Crib Letter</span>
                <span>Cipher Letter</span>
                <span>Circuit Edge</span>
              </div>
              {crib.split('').map((cribChar, i) => {
                const cipherChar = ciphertext[alignmentOffset + i] || '?';
                return (
                  <div key={i} className={`grid grid-cols-4 ${t.textPrimary} py-1 border-b ${t.borderBase}/40 items-center`}>
                    <span className={`${t.textAccent} font-bold`}>Step {i + 1}</span>
                    <span>{cribChar}</span>
                    <span>{cipherChar}</span>
                    <span className={`text-green-600 font-bold ${t.panelBg} px-2 py-0.5 rounded border ${t.borderBase} w-max`}>
                      {cribChar} ↔ {cipherChar}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowMenuGraphModal(false)}
                className={`px-4 py-2 ${t.buttonHighlight} rounded text-xs font-bold ${t.fontHeader} cursor-pointer`}
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal: 26x26 Welchman Diagonal Board Matrix */}
      {showDiagonalBoardModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`${t.modalBg} border ${t.borderBase} rounded-lg max-w-3xl w-full p-6 space-y-4 shadow-2xl relative ${t.appTexture} max-h-[90vh] overflow-y-auto`}>
            <button
              onClick={() => setShowDiagonalBoardModal(false)}
              className={`absolute top-4 right-4 ${t.textMuted} hover:${t.textPrimary} transition-colors cursor-pointer`}
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className={`flex items-center gap-2 border-b ${t.borderBase} pb-3`}>
              <span className={`material-symbols-outlined ${t.textAccent}`}>grid_on</span>
              <h3 className={`text-sm font-bold ${t.textSecondary} ${t.fontHeader} uppercase tracking-wider`}>
                Gordon Welchman's 26×26 Diagonal Board Matrix
              </h3>
            </div>

            <p className={`text-xs ${t.textMuted} leading-relaxed ${t.fontMono}`}>
              Welchman's genius innovation (introduced in late 1939) connected plugboard wire (node X, stecker Y) directly to wire (node Y, stecker X). This symmetric reciprocity matrix enforces $X \leftrightarrow Y \iff Y \leftrightarrow X$, vastly accelerating voltage flow and reducing false stops by over 95%!
            </p>

            {/* 26x26 Visual Matrix grid preview */}
            <div className={`${t.panelInner} border ${t.borderBase} rounded p-3 overflow-x-auto`}>
              <div className={`min-w-[600px] ${t.fontMono} text-[9px]`}>
                {/* Header Row */}
                <div className={`flex gap-0.5 mb-1 font-bold ${t.textAccent}`}>
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
                    <div className={`w-5 h-5 flex items-center justify-center font-bold ${t.textAccent} shrink-0`}>
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
                              : `${t.panelInner} ${t.textSecondary}`
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
                className={`px-4 py-2 ${t.buttonHighlight} rounded text-xs font-bold ${t.fontHeader} cursor-pointer`}
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

import React, { useState, useMemo, useEffect } from 'react';
import { EnigmaConfig } from '../types';
import {
  ROTOR_SPECS,
  REFLECTOR_SPECS,
  charToNum,
  numToChar,
  formatRotorPos,
  formatRotorRing,
  encryptChar,
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
  notch: number;
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

  // Search running states
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [currentScan, setCurrentScan] = useState<string[]>(['A', 'A', 'A']);
  const [matches, setMatches] = useState<Array<{ left: string; middle: string; right: string; decrypted: string }>>([]);

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

  // Load historical samples
  const loadTemplate = (type: 'navy_weather' | 'army_intercept') => {
    if (type === 'navy_weather') {
      // Setup Navy M3 keys: I-II-III, rings: 01-01-01, start positions scanned: Q-W-A
      // Plain: "WETTERVORHERSAGE"
      // Cipher: "XMKPFYVJUPXQZDUW" (encrypted under I-II-III | 01-01-01 | QWA | no plugboard for simplicity)
      setCiphertext('XMKPFYVJUPXQZDUW');
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
      // Cipher: "IQLNDYVJZTXRUKMHPWQ" (under III-IV-V, rings: B-N-T, starts: D-O-G)
      setCiphertext('IQLNDYVJZTXRUKMHPWQ');
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
    const notch = charToNum(spec.notch);
    return { wiringFwd, wiringBwd, notch, ring };
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
      const rightAtNotch = rightCurrent === rightR.notch;
      const middleAtNotch = middleCurrent === middleR.notch;

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

  // Start electromechanical Bombe search
  const startBombeSearch = () => {
    if (!alignedSection.isViable) return;

    setIsSearching(true);
    setProgress(0);
    setMatches([]);

    // Prepare rotor mappings
    const leftR = prepareRotor(leftRotorType, leftRotorRing);
    const middleR = prepareRotor(middleRotorType, middleRotorRing);
    const rightR = prepareRotor(rightRotorType, rightRotorRing);

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

    // Sliced text targets for fast loop
    const cipherTextSliced = ciphertext.toUpperCase().slice(alignmentOffset, alignmentOffset + crib.length);
    const cipherNums = cipherTextSliced.split('').map(charToNum);
    const cribNums = crib.toUpperCase().split('').map(charToNum);

    const foundMatches: Array<{ left: string; middle: string; right: string; decrypted: string }> = [];

    let combinationIndex = 0;
    const totalCombinations = 17576; // 26 * 26 * 26 starting positions for Left, Middle, Right

    const runBatch = () => {
      // Batch size of 1500 is optimal: keeps the page highly responsive while spinning the drums beautifully
      const batchSize = 1500;
      const limit = Math.min(combinationIndex + batchSize, totalCombinations);

      for (let c = combinationIndex; c < limit; c++) {
        // Unpack composite index into 3 independent dial values (0-25)
        const r = c % 26;
        const m = Math.floor(c / 26) % 26;
        const l = Math.floor(c / 676) % 26;

        const isMatch = testStartPos(
          l, m, r,
          cipherNums,
          cribNums,
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
          const foundLeftChar = numToChar(l);
          const foundMiddleChar = numToChar(m);
          const foundRightChar = numToChar(r);
          
          foundMatches.push({
            left: foundLeftChar,
            middle: foundMiddleChar,
            right: foundRightChar,
            decrypted: '', // Will populate full decryption previews below
          });
        }
      }

      combinationIndex = limit;
      setProgress(Math.round((combinationIndex / totalCombinations) * 100));

      if (limit < totalCombinations) {
        // Visual updates: show scanned position
        setCurrentScan([
          numToChar(Math.floor(limit / 676) % 26),
          numToChar(Math.floor(limit / 26) % 26),
          numToChar(limit % 26),
        ]);
        playRotorClickSound(soundEnabled);
        requestAnimationFrame(runBatch);
      } else {
        // Complete! Fill in decryptions for the found keys
        const finalized = foundMatches.map((match) => ({
          ...match,
          decrypted: decryptFullMessage(match.left, match.middle, match.right),
        }));

        setIsSearching(false);
        setMatches(finalized);
      }
    };

    requestAnimationFrame(runBatch);
  };

  // Apply cracked keys back to main Enigma machine
  const handleApplyMatch = (match: typeof matches[0]) => {
    // Overwrite the current active config with cracked settings
    const updatedConfig: EnigmaConfig = {
      ...config,
      leftRotor: {
        ...config.leftRotor,
        type: leftRotorType as any,
        ring: leftRotorRing,
        start: charToNum(match.left),
        current: charToNum(match.left),
      },
      middleRotor: {
        ...config.middleRotor,
        type: middleRotorType as any,
        ring: middleRotorRing,
        start: charToNum(match.middle),
        current: charToNum(match.middle),
      },
      rightRotor: {
        ...config.rightRotor,
        type: rightRotorType as any,
        ring: rightRotorRing,
        start: charToNum(match.right),
        current: charToNum(match.right),
      },
      plugboard: plugboardMode === 'active' ? config.plugboard : {},
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
                <div className="bg-[#120e04] p-2 rounded border border-[#3b3426] text-center">
                  <span className="text-[9px] text-[#8c7e6a] block uppercase font-monospaced-technical">Left Rotor</span>
                  <span className="font-bold text-[#ede1cd]">{leftRotorType}</span>
                  <span className="text-[10px] text-amber-500/80 block mt-0.5">Ring: {formatRotorRing(leftRotorRing)}</span>
                </div>
                <div className="bg-[#120e04] p-2 rounded border border-[#3b3426] text-center">
                  <span className="text-[9px] text-[#8c7e6a] block uppercase font-monospaced-technical">Middle Rotor</span>
                  <span className="font-bold text-[#ede1cd]">{middleRotorType}</span>
                  <span className="text-[10px] text-amber-500/80 block mt-0.5">Ring: {formatRotorRing(middleRotorRing)}</span>
                </div>
                <div className="bg-[#120e04] p-2 rounded border border-[#3b3426] text-center">
                  <span className="text-[9px] text-[#8c7e6a] block uppercase font-monospaced-technical">Right Rotor</span>
                  <span className="font-bold text-[#ede1cd]">{rightRotorType}</span>
                  <span className="text-[10px] text-amber-500/80 block mt-0.5">Ring: {formatRotorRing(rightRotorRing)}</span>
                </div>
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
              </div>
            )}

            {/* Slide Comparison Visual Grid */}
            {ciphertext && crib && (
              <div className="bg-[#120e04] rounded border border-[#3b3426] p-4 overflow-x-auto select-none">
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
                            className={`w-7 h-8 flex items-center justify-center rounded border font-bold transition-all duration-300 ${
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
                disabled={isSearching || !alignedSection.isViable}
                className={`w-full py-3.5 rounded border font-ui-header font-bold text-sm tracking-wide shadow-lg flex items-center justify-center gap-2 transition-all ${
                  isSearching
                    ? 'bg-[#3b3426] border-[#4e453b] text-[#8c7e6a] cursor-wait'
                    : alignedSection.isViable
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

              <div className="space-y-4">
                {matches.map((match, idx) => (
                  <div
                    key={idx}
                    className="bg-[#120e04] border border-green-900/50 p-4 rounded-md space-y-3 shadow-inner"
                  >
                    {/* Position Label Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-monospaced-technical text-[#8c7e6a] uppercase">Key Position:</span>
                        <span className="font-rotor-label text-base font-bold text-green-400 tracking-wider">
                          {match.left} - {match.middle} - {match.right}
                        </span>
                      </div>
                      <button
                        onClick={() => handleApplyMatch(match)}
                        className="text-xs bg-green-950/80 hover:bg-green-900 text-green-300 border border-green-800/80 px-3 py-1.5 rounded transition-all active:scale-95 cursor-pointer flex items-center gap-1 font-ui-header"
                      >
                        <span className="material-symbols-outlined text-xs">logout</span>
                        Apply Settings to Machine
                      </button>
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
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Matches Found Banner */}
          {!isSearching && matches.length === 0 && ciphertext && crib && alignedSection.isViable && (
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

    </div>
  );
};

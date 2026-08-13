export interface EnigmaGeneratorConfig {
  daysInMonth: number;           // Number of days in the codebook (e.g., 30 or 31)
  rotorsPool: string[];          // Pool of selectable rotors (e.g., ['I','II','III','IV','V','VI','VII','VIII'])
  useTwoDayRule: boolean;        // If true, internal settings only change on odd-numbered days
  plugboardPairsCount: number;   // Number of plugboard cable pairs (typically 10, max 13)
  kenngruppenCount: number;      // Number of daily identification groups (Kriegsmarine: 3, Luftwaffe: 4)
  kenngruppenLength: number;     // Length of identification groups (typically 3-letter trigrams)
  // Optional settings for the 4-rotor (M4) variant:
  fourthRotorsPool?: string[];   // Pool of selectable thin fourth rotors (e.g., ['Beta', 'Gamma'])
  fixedFourthRing?: number;      // Fixes the ring setting of the 4th rotor (always 1/'A' for historical Kriegsmarine M4)
  includeGrundstellung?: boolean;   // If true, generates optional daily Grundstellung starting positions
  // UKW-Dual-Dynamic reflector settings (Experimental/Speculative what-if feature)
  useDualDynamicReflector?: boolean; // If true, UKW-Dual-Dynamic reflector is generated for the days
  fixedReflectorRing?: number;      // Fixes the reflector ring setting (1-26)
  fixedReflectorStart?: number;     // Fixes the reflector starting position (1-26)
}

export interface UniversalCodebookEntry {
  day: number;
  rotors: string[];
  rings: number[];
  grundstellung?: number[];       // Start ring settings (1-26) for each rotor
  plugboardPairs: string[];
  kenngruppen: string[];
  fourthRotor?: string;          // Only if fourthRotorsPool is provided
  fourthRing?: number;           // Only if fourthRotorsPool is provided
  reflectorType?: string;        // e.g., 'UKW-Dual-Dynamic'
  reflectorRing?: number;        // Reflector ring setting (1-26)
  reflectorStart?: number;       // Reflector starting position (1-26)
}

export function generateUniversalEnigmaCodebook(config: EnigmaGeneratorConfig): UniversalCodebookEntry[] {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const entries: UniversalCodebookEntry[] = [];

  // Fisher-Yates (Knuth) secure and unbiased shuffle algorithm
  const shuffle = <T>(array: T[]): T[] => {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  // Temporaries to manage the two-day rule (inheritance)
  let lastOddRotors: string[] = [];
  let lastOddRings: number[] = [];
  let lastOddFourthRotor: string | undefined = undefined;
  let lastOddFourthRing: number | undefined = undefined;
  let lastOddReflectorRing: number | undefined = undefined;
  let lastOddReflectorStart: number | undefined = undefined;

  // Codebooks were historically printed from the last day of the month down to the first day
  for (let day = config.daysInMonth; day >= 1; day--) {
    const isOddDay = day % 2 !== 0;
    
    // We generate a new internal key if:
    // A) The two-day rule is disabled (new key every day)
    // B) It is an odd-numbered day
    // C) This is the very first generated (calendar-last) day of the month
    const souldGenerateNewInternal = !config.useTwoDayRule || isOddDay || day === config.daysInMonth;

    let selectedRotors: string[];
    let rings: number[];
    let fourthRotor: string | undefined = undefined;
    let fourthRing: number | undefined = undefined;
    let reflectorType: string | undefined = undefined;
    let reflectorRing: number | undefined = undefined;
    let reflectorStart: number | undefined = undefined;

    if (souldGenerateNewInternal) {
      // Select 3 unique standard rotors from the pool
      const shuffledPool = shuffle(config.rotorsPool);
      selectedRotors = [shuffledPool[0], shuffledPool[1], shuffledPool[2]];

      // Generate 3 ring settings (1-26)
      rings = [
        Math.floor(Math.random() * 26) + 1,
        Math.floor(Math.random() * 26) + 1,
        Math.floor(Math.random() * 26) + 1
      ];

      // Handle optional fourth rotor (Enigma M4)
      if (config.fourthRotorsPool && config.fourthRotorsPool.length > 0) {
        const shuffledFourth = shuffle(config.fourthRotorsPool);
        fourthRotor = shuffledFourth[0];
        fourthRing = config.fixedFourthRing !== undefined 
          ? config.fixedFourthRing 
          : Math.floor(Math.random() * 26) + 1;
      }

      // Handle optional UKW-Dual-Dynamic reflector
      if (config.useDualDynamicReflector) {
        reflectorType = 'UKW-Dual-Dynamic';
        reflectorRing = config.fixedReflectorRing !== undefined
          ? config.fixedReflectorRing
          : Math.floor(Math.random() * 26) + 1;
        reflectorStart = config.fixedReflectorStart !== undefined
          ? config.fixedReflectorStart
          : Math.floor(Math.random() * 26) + 1;
      }

      // Save the internal key for potential inheritance on the following even day
      lastOddRotors = selectedRotors;
      lastOddRings = rings;
      lastOddFourthRotor = fourthRotor;
      lastOddFourthRing = fourthRing;
      lastOddReflectorRing = reflectorRing;
      lastOddReflectorStart = reflectorStart;
    } else {
      // For even days, inherit internal key values from the preceding odd day
      selectedRotors = lastOddRotors;
      rings = lastOddRings;
      fourthRotor = lastOddFourthRotor;
      fourthRing = lastOddFourthRing;
      if (config.useDualDynamicReflector) {
        reflectorType = 'UKW-Dual-Dynamic';
        reflectorRing = lastOddReflectorRing;
        reflectorStart = lastOddReflectorStart;
      }
    }

    // --- EXTERNAL SETTINGS (Unique and chaotic for every single day) ---

    // Generate non-overlapping, short-circuit free plugboard connections based on count
    const availChars = shuffle(alphabet);
    const pairs: string[] = [];
    for (let p = 0; p < config.plugboardPairsCount; p++) {
      if (availChars.length < 2) break; // Safety check
      const c1 = availChars.pop()!;
      const c2 = availChars.pop()!;
      pairs.push([c1, c2].sort().join('')); // Sort alphabetically (e.g., 'AF')
    }

    // Generate unique, uppercase Kenngruppen identification groups based on count and length
    const kgList: string[] = [];
    while (kgList.length < config.kenngruppenCount) {
      const currentGroup: string[] = [];
      for (let l = 0; l < config.kenngruppenLength; l++) {
        currentGroup.push(alphabet[Math.floor(Math.random() * 26)]);
      }
      const kgString = currentGroup.join('');
      
      // Prevent internal duplicate groups for the same day
      if (!kgList.includes(kgString)) {
        kgList.push(kgString);
      }
    }

    // Generate optional Grundstellung (Start ring settings 1-26 for each rotor)
    let grundstellung: number[] | undefined = undefined;
    if (config.includeGrundstellung) {
      grundstellung = [
        Math.floor(Math.random() * 26) + 1,
        Math.floor(Math.random() * 26) + 1,
        Math.floor(Math.random() * 26) + 1
      ];
      if (fourthRotor !== undefined) {
        grundstellung.push(Math.floor(Math.random() * 26) + 1);
      }
    }

    // Assemble and store current day entry
    const entry: UniversalCodebookEntry = {
      day,
      rotors: selectedRotors,
      rings,
      plugboardPairs: pairs,
      kenngruppen: kgList
    };

    if (grundstellung !== undefined) entry.grundstellung = grundstellung;

    if (fourthRotor !== undefined) entry.fourthRotor = fourthRotor;
    if (fourthRing !== undefined) entry.fourthRing = fourthRing;
    if (reflectorType !== undefined) entry.reflectorType = reflectorType;
    if (reflectorRing !== undefined) entry.reflectorRing = reflectorRing;
    if (reflectorStart !== undefined) entry.reflectorStart = reflectorStart;

    entries.push(entry);
  }

  return entries;
}

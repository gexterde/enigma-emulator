export interface EnigmaGeneratorConfig {
  daysInMonth: number;           // Hány napos legyen a kódkönyv (pl. 30 vagy 31)
  rotorsPool: string[];          // Választható hengerek (pl. ['I','II','III','IV','V','VI','VII','VIII'])
  useTwoDayRule: boolean;        // Igaz esetén a belső beállítások csak a páratlan napokon változnak
  plugboardPairsCount: number;   // Kapcsolótábla kábeleinek száma (általában 10, maximum 13)
  kenngruppenCount: number;      // Napi azonosító csoportok száma (Kriegsmarine: 3, Luftwaffe: 4)
  kenngruppenLength: number;     // Azonosító csoportok hossza (általában 3 betűs trigram)
  // Opcionális beállítások a 4-hengeres (M4) változathoz:
  fourthRotorsPool?: string[];   // Negyedik vékony henger készlet (pl. ['Beta', 'Gamma'])
  fixedFourthRing?: number;      // Fixálja a 4. henger gyűrűjét (Kriegsmarine esetén szigorúan 1-es, azaz 'A')
  // UKW-Dual-Dynamic fordítóhenger beállítások (Kísérleti/Speculatív mit-lett-volna funkció)
  useDualDynamicReflector?: boolean; // Ha igaz, UKW-Dual-Dynamic fordítóhenger generálódik a napokhoz
  fixedReflectorRing?: number;      // Fixálja a fordítóhenger gyűrűbeállítását (1-26)
  fixedReflectorStart?: number;     // Fixálja a fordítóhenger kezdőpozícióját (1-26)
}

export interface UniversalCodebookEntry {
  day: number;
  rotors: string[];
  rings: number[];
  plugboardPairs: string[];
  kenngruppen: string[];
  fourthRotor?: string;          // Csak ha a fourthRotorsPool meg van adva
  fourthRing?: number;           // Csak ha a fourthRotorsPool meg van adva
  reflectorType?: string;        // pl. 'UKW-Dual-Dynamic'
  reflectorRing?: number;        // Fordítóhenger gyűrűbeállítás (1-26)
  reflectorStart?: number;       // Fordítóhenger kezdőpozíció (1-26)
}

export function generateUniversalEnigmaCodebook(config: EnigmaGeneratorConfig): UniversalCodebookEntry[] {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const entries: UniversalCodebookEntry[] = [];

  // Fisher-Yates (Knuth) biztonságos és elfogulatlan keverő algoritmus
  const shuffle = <T>(array: T[]): T[] => {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  // Átmeneti tárolók a kétnapos szabály (öröklődés) menedzseléséhez
  let lastOddRotors: string[] = [];
  let lastOddRings: number[] = [];
  let lastOddFourthRotor: string | undefined = undefined;
  let lastOddFourthRing: number | undefined = undefined;
  let lastOddReflectorRing: number | undefined = undefined;
  let lastOddReflectorStart: number | undefined = undefined;

  // A kódkönyveket a németek mindig a hónap utolsó napjától az első felé haladva nyomtatták
  for (let day = config.daysInMonth; day >= 1; day--) {
    const isOddDay = day % 2 !== 0;
    
    // Akkor generálunk új belső kulcsot, ha:
    // A) Nem él a kétnapos szabály (minden nap új kulcs kell)
    // B) Páratlan nap van
    // C) Ez a hónap legelsőnek legenerált (legutolsó naptári) napja
    const souldGenerateNewInternal = !config.useTwoDayRule || isOddDay || day === config.daysInMonth;

    let selectedRotors: string[];
    let rings: number[];
    let fourthRotor: string | undefined = undefined;
    let fourthRing: number | undefined = undefined;
    let reflectorType: string | undefined = undefined;
    let reflectorRing: number | undefined = undefined;
    let reflectorStart: number | undefined = undefined;

    if (souldGenerateNewInternal) {
      // 3 különböző törzshenger kiválasztása a medencéből
      const shuffledPool = shuffle(config.rotorsPool);
      selectedRotors = [shuffledPool[0], shuffledPool[1], shuffledPool[2]];

      // 3 gyűrűbeállítás generálása (1-26)
      rings = [
        Math.floor(Math.random() * 26) + 1,
        Math.floor(Math.random() * 26) + 1,
        Math.floor(Math.random() * 26) + 1
      ];

      // Negyedik henger opcionális kezelése (Enigma M4)
      if (config.fourthRotorsPool && config.fourthRotorsPool.length > 0) {
        const shuffledFourth = shuffle(config.fourthRotorsPool);
        fourthRotor = shuffledFourth[0];
        fourthRing = config.fixedFourthRing !== undefined 
          ? config.fixedFourthRing 
          : Math.floor(Math.random() * 26) + 1;
      }

      // Opcionális UKW-Dual-Dynamic fordítóhenger kezelése
      if (config.useDualDynamicReflector) {
        reflectorType = 'UKW-Dual-Dynamic';
        reflectorRing = config.fixedReflectorRing !== undefined
          ? config.fixedReflectorRing
          : Math.floor(Math.random() * 26) + 1;
        reflectorStart = config.fixedReflectorStart !== undefined
          ? config.fixedReflectorStart
          : Math.floor(Math.random() * 26) + 1;
      }

      // Elmentjük a belső kulcsot az esetleges következő páros nap számára
      lastOddRotors = selectedRotors;
      lastOddRings = rings;
      lastOddFourthRotor = fourthRotor;
      lastOddFourthRing = fourthRing;
      lastOddReflectorRing = reflectorRing;
      lastOddReflectorStart = reflectorStart;
    } else {
      // Páros napokon átvesszük a legutóbbi páratlan nap belső értékeit
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

    // --- KÜLSŐ BEÁLLÍTÁSOK (Minden nap kötelezően egyedi és kaotikus) ---

    // Átfedés- és zárlatmentes kapcsolótábla-párok generálása a kért darabszám alapján
    const availChars = shuffle(alphabet);
    const pairs: string[] = [];
    for (let p = 0; p < config.plugboardPairsCount; p++) {
      if (availChars.length < 2) break; // Biztonsági fék, ha elfogynának a betűk
      const c1 = availChars.pop()!;
      const c2 = availChars.pop()!;
      pairs.push([c1, c2].sort().join('')); // Belső ábécé sorrend (pl. 'AF')
    }

    // Egyedi, nagybetűs Kenngruppen csoportok generálása a megadott darabszám és hossza szerint
    const kgList: string[] = [];
    while (kgList.length < config.kenngruppenCount) {
      const currentGroup: string[] = [];
      for (let l = 0; l < config.kenngruppenLength; l++) {
        currentGroup.push(alphabet[Math.floor(Math.random() * 26)]);
      }
      const kgString = currentGroup.join('');
      
      // Megakadályozzuk az üzenetfejek napon belüli duplikációját
      if (!kgList.includes(kgString)) {
        kgList.push(kgString);
      }
    }

    // Az aktuális nap összeállítása és elhelyezése a tömbben
    const entry: UniversalCodebookEntry = {
      day,
      rotors: selectedRotors,
      rings,
      plugboardPairs: pairs,
      kenngruppen: kgList
    };

    if (fourthRotor !== undefined) entry.fourthRotor = fourthRotor;
    if (fourthRing !== undefined) entry.fourthRing = fourthRing;
    if (reflectorType !== undefined) entry.reflectorType = reflectorType;
    if (reflectorRing !== undefined) entry.reflectorRing = reflectorRing;
    if (reflectorStart !== undefined) entry.reflectorStart = reflectorStart;

    entries.push(entry);
  }

  return entries;
}

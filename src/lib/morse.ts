// Morse code translation and audio broadcast utilities

export const MORSE_MAP: Record<string, string> = {
  'A': '.-',
  'B': '-...',
  'C': '-.-.',
  'D': '-..',
  'E': '.',
  'F': '..-.',
  'G': '--.',
  'H': '....',
  'I': '..',
  'J': '.---',
  'K': '-.-',
  'L': '.-..',
  'M': '--',
  'N': '-.',
  'O': '---',
  'P': '.--.',
  'Q': '--.-',
  'R': '.-.',
  'S': '...',
  'T': '-',
  'U': '..-',
  'V': '...-',
  'W': '.--',
  'X': '-..-',
  'Y': '-.--',
  'Z': '--..',
  '0': '-----',
  '1': '.----',
  '2': '..---',
  '3': '...--',
  '4': '....-',
  '5': '.....',
  '6': '-....',
  '7': '--...',
  '8': '---..',
  '9': '----.',
  '.': '.-.-.-',
  ',': '--..--',
  '?': '..--..',
  '/': '-..-.',
  '=': '-...-',
  '-': '-....-',
  '(': '-.--.',
  ')': '-.--.-',
  'IMI': '..--..',
  'VE': '...-.',
  'AR': '.-.-.',
  'SK': '...-.-',
  'BT': '-...-',
  'AS': '.-...',
  'HH': '........',
  ' ': '/'
};

export const REVERSE_MORSE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(MORSE_MAP).map(([k, v]) => [v, k])
);

export interface MorseGroup {
  title: string;
  icon: string;
  items: [string, string][];
  gridCols: string;
}

export const MORSE_GROUPS: MorseGroup[] = [
  {
    title: 'Letters (A–Z)',
    icon: 'sort_by_alpha',
    items: Object.entries(MORSE_MAP).filter(([char]) => /^[A-Z]$/.test(char)),
    gridCols: 'grid-cols-3 sm:grid-cols-6 md:grid-cols-9 lg:grid-cols-13',
  },
  {
    title: 'Numbers (0–9)',
    icon: 'pin',
    items: Object.entries(MORSE_MAP).filter(([char]) => /^[0-9]$/.test(char)),
    gridCols: 'grid-cols-3 sm:grid-cols-5 md:grid-cols-10',
  },
  {
    title: 'Procedural Signals & Signs (Prosigns)',
    icon: 'cell_tower',
    items: [
      ['IMI', '..--..'],   // Repeat Sign / Say Again
      ['VE', '...-.'],     // Visual Sign / Verified
      ['AR', '.-.-.'],     // End of Message
      ['SK', '...-.-'],    // End of Work / Final Sign
      ['BT', '-...-'],     // Break / Pause
      ['AS', '.-...'],     // Wait Sign
      ['HH', '........'],  // Error Sign
    ],
    gridCols: 'grid-cols-2 sm:grid-cols-4 md:grid-cols-7',
  },
  {
    title: 'Special Characters & Punctuation',
    icon: 'notes',
    items: Object.entries(MORSE_MAP).filter(([char]) => !/^[A-Z0-9 ]$/.test(char) && !['IMI', 'VE', 'AR', 'SK', 'BT', 'AS', 'HH'].includes(char)),
    gridCols: 'grid-cols-3 sm:grid-cols-4 md:grid-cols-7',
  },
];

export interface MorseToken {
  char: string;
  morse: string;
}

export function textToMorseTokens(text: string): MorseToken[] {
  const upper = text.toUpperCase();
  const result: MorseToken[] = [];
  for (let i = 0; i < upper.length; i++) {
    const char = upper[i];
    const morse = MORSE_MAP[char] || '';
    result.push({ char, morse });
  }
  return result;
}

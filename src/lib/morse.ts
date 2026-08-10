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
  '-': '-....-',
  '(': '-.--.',
  ')': '-.--.-',
  ' ': '/'
};

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

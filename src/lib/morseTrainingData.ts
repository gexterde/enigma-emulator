// Extended Morse Training Vocabulary, Q-Codes, Callsigns, and Prosigns

export const COMMON_CW_WORDS = [
  'THE', 'AND', 'FOR', 'WITH', 'YOU', 'THIS', 'FROM', 'HAVE', 'WORD', 'RADIO',
  'SIGNAL', 'STATION', 'REPORT', 'POWER', 'ANTENNA', 'WEATHER', 'TEMP', 'NAME', 'RIG', 'ROGER',
  'COPY', 'THANKS', 'NICE', 'GOOD', 'BEST', 'GREAT', 'HOPE', 'SOON', 'LATER', 'CLEAR',
  'NORTH', 'SOUTH', 'EAST', 'WEST', 'NIGHT', 'DAY', 'TEST', 'SPEED', 'FREQ', 'AUDIO',
  'TOWER', 'RADAR', 'CIPHER', 'DECODE', 'ENCODE', 'SECRET', 'PATROL', 'CONVOY', 'BEACON', 'ALPHA',
  'BRAVO', 'DELTA', 'ECHO', 'FOXTROT', 'GOLF', 'HOTEL', 'INDIA', 'JULIET', 'KILO', 'LIMA',
  'MIKE', 'OSCAR', 'PAPA', 'QUEBEC', 'ROMEO', 'SIERRA', 'TANGO', 'VICTOR', 'WHISKEY', 'YANKEE',
  'ZULU', 'FINE', 'VERY', 'PLEASE', 'AGAIN', 'SEND', 'HEAR', 'CALL', 'TIME', 'HERE',
  'THERE', 'ABOUT', 'AFTER', 'BEFORE', 'FIRST', 'LAST', 'WATER', 'STANDBY', 'OPERATOR', 'BAND'
];

export interface QCodeItem {
  code: string;
  meaning: string;
}

export const Q_CODES: QCodeItem[] = [
  { code: 'QTH', meaning: 'My location / What is your location?' },
  { code: 'QSO', meaning: 'Radio conversation / contact' },
  { code: 'QRM', meaning: 'Man-made interference' },
  { code: 'QRN', meaning: 'Atmospheric noise / static' },
  { code: 'QSL', meaning: 'Acknowledge receipt / I confirm' },
  { code: 'QRZ', meaning: 'Who is calling me?' },
  { code: 'QSB', meaning: 'Your signals are fading' },
  { code: 'QSY', meaning: 'Change frequency to...' },
  { code: 'QRL', meaning: 'Frequency is busy / Are you busy?' },
  { code: 'QRV', meaning: 'I am ready' },
  { code: 'QRP', meaning: 'Low power transmission' },
  { code: 'QRX', meaning: 'Stand by / Wait for...' },
  { code: '73', meaning: 'Best regards' },
  { code: '88', meaning: 'Love and kisses' },
  { code: 'RST', meaning: 'Readability, Strength, Tone report' },
  { code: 'TU', meaning: 'Thank you' },
  { code: 'GM', meaning: 'Good morning' },
  { code: 'GA', meaning: 'Good afternoon' },
  { code: 'GE', meaning: 'Good evening' },
  { code: 'UR', meaning: 'Your / You are' },
  { code: 'HW', meaning: 'How / How do you copy?' },
  { code: 'CPY', meaning: 'Copy' },
  { code: 'BK', meaning: 'Break / Back to you' },
  { code: 'SK', meaning: 'End of contact (Silent Key)' },
  { code: 'AR', meaning: 'End of message' },
  { code: 'DE', meaning: 'From / This is' },
  { code: 'ES', meaning: 'And' },
  { code: 'OM', meaning: 'Old man (friend/operator)' },
  { code: 'YL', meaning: 'Young lady' },
  { code: 'WX', meaning: 'Weather' },
  { code: 'RIG', meaning: 'Transceiver equipment' },
  { code: 'ANT', meaning: 'Antenna' },
  { code: 'PWR', meaning: 'Power output' },
  { code: 'FB', meaning: 'Fine business (excellent)' },
  { code: 'OP', meaning: 'Operator' },
  { code: 'TNX', meaning: 'Thanks' },
  { code: 'FER', meaning: 'For' },
  { code: 'MSG', meaning: 'Message' },
  { code: 'K', meaning: 'Over / Invitation to transmit' }
];

const CALLSIGN_PREFIXES = [
  'W1', 'W2', 'W3', 'K1', 'K3', 'N2', 'N7', 'AA1', 'G3', 'G4', 'M0', 'DL1',
  'DL7', 'F6', 'EA3', 'I2', 'JA1', 'JH3', 'VE3', 'VE7', 'VK2', 'ZL1', 'PA3',
  'OH2', 'SM5', 'SP9', 'OE1', 'HB9', 'LA2', 'PY2', 'LU4', 'ZS6', 'SV1'
];

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function generateRandomCallsign(): string {
  const prefix = CALLSIGN_PREFIXES[Math.floor(Math.random() * CALLSIGN_PREFIXES.length)];
  const suffixLen = Math.random() > 0.35 ? 3 : 2;
  let suffix = '';
  for (let i = 0; i < suffixLen; i++) {
    suffix += LETTERS[Math.floor(Math.random() * LETTERS.length)];
  }
  return `${prefix}${suffix}`;
}

export type PracticeContentType = 'lesson' | 'words' | 'qcodes' | 'callsigns' | 'weak_drill' | 'custom';

export type OpticalFilterColor = 'amber' | 'white' | 'red' | 'green';

export interface OpticalFilterConfig {
  id: OpticalFilterColor;
  label: string;
  sublabel: string;
  glowColor: string;
  lampOnBg: string;
  ringBorder: string;
  bloomCss: string;
  accentClass: string;
}

export const OPTICAL_FILTERS: Record<OpticalFilterColor, OpticalFilterConfig> = {
  amber: {
    id: 'amber',
    label: 'Incandescent Amber',
    sublabel: 'Classic 12V Naval Shutter Lamp',
    glowColor: 'rgba(245, 158, 11, 0.95)',
    lampOnBg: 'radial-gradient(circle, #fffbeb 0%, #fef3c7 25%, #f59e0b 70%, #b45309 100%)',
    ringBorder: 'border-amber-400',
    bloomCss: '0 0 35px 15px rgba(245, 158, 11, 0.65), inset 0 0 15px rgba(255, 255, 255, 0.8)',
    accentClass: 'text-amber-500'
  },
  white: {
    id: 'white',
    label: 'Daylight Arc White',
    sublabel: 'High-Power Carbon Searchlight',
    glowColor: 'rgba(255, 255, 255, 0.95)',
    lampOnBg: 'radial-gradient(circle, #ffffff 0%, #f8fafc 35%, #cbd5e1 75%, #64748b 100%)',
    ringBorder: 'border-slate-200',
    bloomCss: '0 0 40px 18px rgba(255, 255, 255, 0.8), inset 0 0 20px rgba(255, 255, 255, 0.95)',
    accentClass: 'text-slate-100'
  },
  red: {
    id: 'red',
    label: 'Night-Vision Ruby Red',
    sublabel: 'Stealth Tactical Night Shutter',
    glowColor: 'rgba(239, 68, 68, 0.95)',
    lampOnBg: 'radial-gradient(circle, #fee2e2 0%, #fca5a5 25%, #ef4444 70%, #991b1b 100%)',
    ringBorder: 'border-rose-500',
    bloomCss: '0 0 35px 15px rgba(239, 68, 68, 0.65), inset 0 0 15px rgba(255, 255, 255, 0.8)',
    accentClass: 'text-rose-500'
  },
  green: {
    id: 'green',
    label: 'Phosphor Matrix Green',
    sublabel: 'Optical Terminal Photodetector',
    glowColor: 'rgba(34, 197, 94, 0.95)',
    lampOnBg: 'radial-gradient(circle, #dcfce7 0%, #86efac 25%, #22c55e 70%, #15803d 100%)',
    ringBorder: 'border-emerald-500',
    bloomCss: '0 0 35px 15px rgba(34, 197, 94, 0.65), inset 0 0 15px rgba(255, 255, 255, 0.8)',
    accentClass: 'text-emerald-500'
  }
};

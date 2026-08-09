export type RotorType =
  // Enigma I / M3 / M4 Naval
  | 'I'
  | 'II'
  | 'III'
  | 'IV'
  | 'V'
  | 'VI'
  | 'VII'
  | 'VIII'
  // M4 Naval Greek Rotors
  | 'Beta'
  | 'Gamma'
  // Commercial Enigma A, B (1924)
  | 'IC'
  | 'IIC'
  | 'IIIC'
  // German Railway (Rocket) (1941)
  | 'I-Rocket'
  | 'II-Rocket'
  | 'III-Rocket'
  // Swiss K (1939)
  | 'I-K'
  | 'II-K'
  | 'III-K';

export type ReflectorType =
  // Standard Reflectors
  | 'Reflector A'
  | 'Reflector B'
  | 'Reflector C'
  | 'Reflector B Thin'
  | 'Reflector C Thin'
  // German Railway (Rocket)
  | 'UKW-Rocket'
  // Swiss K
  | 'UKW-K'
  // Backward compatibility aliases
  | 'UKW-B'
  | 'UKW-C'
    // ─── NEW DUAL REFLECTOR TYPE ───
  | 'UKW-Dual-Dynamic';

export interface ReflectorState {
  type: ReflectorType;
  ring: number;    // 1 to 26 (Ring Settings)
  start: number;   // 0 to 25 (Start Position: 0 = A, 1 = B, ...)
  current: number; // 0 to 25 (Current Position during turnover)
}

export interface RotorState {
  type: RotorType;
  ring: number; // 1 to 26
  start: number; // 0 to 25 (0 = A, 1 = B, ...)
  current: number; // 0 to 25
}

export interface EnigmaConfig {
  leftRotor: RotorState;   // Position 1 (Slow rotor)
  middleRotor: RotorState; // Position 2
  rightRotor: RotorState;  // Position 3 (Fast rotor)
  fourthRotor: RotorState; // Position 4 (M4 Naval fixed 4th rotor: Beta/Gamma)
  reflector: ReflectorState;
  plugboard: Record<string, string>; // e.g. { 'A': 'B', 'B': 'A' }
}

export interface StepTrace {
  stage: string;
  inChar: string;
  outChar: string;
  inNum: number;
  outNum: number;
  note?: string;
}

export interface EncryptionResult {
  outputChar: string;
  trace: StepTrace[];
  rotorsBefore: { left: string; middle: string; right: string; fourth?: string; reflector: string };
  rotorsAfter: { left: string; middle: string; right: string; fourth?: string; reflector: string };
}

export interface LogEntry {
  id: string;
  timestamp: string;
  inputChar: string;
  outputChar: string;
  configString: string;
  trace: StepTrace[];
}

export type ActiveTab = 'machine' | 'plugboard' | 'rotors' | 'log' | 'codebook';

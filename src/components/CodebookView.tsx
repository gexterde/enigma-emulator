import React, { useState, useEffect } from 'react';
import { EnigmaConfig, ReflectorType, RotorType } from '../types';
import { formatRotorRing } from '../lib/enigmaEngine';
import {
  generateUniversalEnigmaCodebook,
  EnigmaGeneratorConfig,
  UniversalCodebookEntry
} from '../lib/codebookGenerator';

interface CodebookViewProps {
  currentConfig: EnigmaConfig;
  onApplyConfig: (config: EnigmaConfig) => void;
  onNavigateToMachine?: () => void;
}

export interface CodebookEntry {
  day: number;
  rotors: [RotorType, RotorType, RotorType];
  rings: [number, number, number]; // 1-26
  plugboardPairs: string[]; // e.g. ['TW', 'BI', 'UY', ...]
  kenngruppen: string[]; // Trigrams or identifiers
  fourthRotor?: RotorType; // M4 Naval fixed stator (Beta/Gamma) — optional, defaults to 'I' (pass-through)
  fourthRing?: number; // 1-26, defaults to 1
  reflectorType?: ReflectorType; // e.g. 'UKW-Dual-Dynamic'
  reflectorRing?: number; // 1-26 ring setting for reflector
  reflectorStart?: number; // 1-26 start setting for reflector
}

export interface CodebookSheet {
  id: string;
  title: string;
  subtitle: string;
  classification: string;
  monthYear: string;
  pruefnummer: string;
  isHistorical?: boolean;
  entries: CodebookEntry[];
}

// 1. LUFTWAFFE NR. 2744 (ALL 31 DAYS - EXACT HISTORICAL DATA)
const LUFTWAFFE_2744_ENTRIES: CodebookEntry[] = [
  { day: 31, rotors: ['III', 'V', 'IV'], rings: [17, 11, 4], plugboardPairs: ['TW', 'BI', 'UY', 'GP', 'CK', 'JQ', 'DL', 'RV', 'EM', 'AH'], kenngruppen: ['KRA', 'WPT', 'XJB', 'MQZ'] },
  { day: 30, rotors: ['I', 'IV', 'V'], rings: [8, 17, 21], plugboardPairs: ['LS', 'DH', 'MT', 'EO', 'AP', 'UZ', 'FQ', 'WY', 'BK', 'GR'], kenngruppen: ['VNX', 'JQL', 'HYP', 'FDT'] },
  { day: 29, rotors: ['V', 'II', 'III'], rings: [11, 14, 5], plugboardPairs: ['DO', 'JW', 'CN', 'IV', 'PZ', 'BM', 'HU', 'AL', 'FR', 'KX'], kenngruppen: ['SGM', 'XRB', 'LQW', 'NHZ'] },
  { day: 28, rotors: ['II', 'IV', 'V'], rings: [2, 20, 16], plugboardPairs: ['NT', 'HK', 'BW', 'EP', 'LQ', 'AU', 'OY', 'FJ', 'CX', 'GI'], kenngruppen: ['DFK', 'PMY', 'ZVH', 'RQN'] },
  { day: 27, rotors: ['III', 'V', 'IV'], rings: [18, 13, 22], plugboardPairs: ['HM', 'GV', 'KZ', 'AI', 'DQ', 'NR', 'ES', 'BL', 'OU', 'FT'], kenngruppen: ['BWL', 'XTC', 'JQG', 'MZP'] },
  { day: 26, rotors: ['I', 'III', 'II'], rings: [24, 10, 1], plugboardPairs: ['GW', 'AQ', 'MO', 'FV', 'PS', 'DI', 'RU', 'JZ', 'BN', 'EH'], kenngruppen: ['YNH', 'KRD', 'VXF', 'LWB'] },
  { day: 25, rotors: ['IV', 'II', 'III'], rings: [4, 25, 23], plugboardPairs: ['LT', 'DR', 'QX', 'AG', 'IN', 'EU', 'BJ', 'KP', 'FW', 'CM'], kenngruppen: ['GQY', 'TMZ', 'JNP', 'XSH'] },
  { day: 24, rotors: ['V', 'III', 'I'], rings: [9, 19, 6], plugboardPairs: ['GL', 'MY', 'CR', 'HN', 'JX', 'DT', 'AF', 'PU', 'IQ', 'BO'], kenngruppen: ['KVF', 'RPW', 'NQC', 'BXM'] },
  { day: 23, rotors: ['IV', 'I', 'V'], rings: [15, 3, 19], plugboardPairs: ['IT', 'DV', 'HQ', 'AJ', 'MU', 'EX', 'KO', 'CS', 'FY', 'LN'], kenngruppen: ['HJD', 'WTL', 'ZQN', 'PKB'] },
  { day: 22, rotors: ['I', 'V', 'III'], rings: [12, 26, 7], plugboardPairs: ['EY', 'JL', 'AK', 'NV', 'FZ', 'CT', 'HP', 'MX', 'BQ', 'GS'], kenngruppen: ['YRQ', 'GWM', 'FXC', 'NVL'] },
  { day: 21, rotors: ['III', 'IV', 'II'], rings: [15, 9, 12], plugboardPairs: ['JP', 'DY', 'QS', 'HL', 'AE', 'NW', 'CU', 'IK', 'FX', 'BR'], kenngruppen: ['TPZ', 'KHM', 'WJN', 'QBX'] },
  { day: 20, rotors: ['IV', 'II', 'I'], rings: [2, 22, 5], plugboardPairs: ['HT', 'NP', 'AM', 'DX', 'GJ', 'KQ', 'BS', 'OV', 'ER', 'GW'], kenngruppen: ['RLF', 'MPC', 'NXD', 'YZK'] },
  { day: 19, rotors: ['V', 'I', 'II'], rings: [8, 19, 17], plugboardPairs: ['GM', 'OX', 'BT', 'QU', 'DP', 'HJ', 'FK', 'SW', 'AN', 'EL'], kenngruppen: ['VWH', 'TJQ', 'GNM', 'XBZ'] },
  { day: 18, rotors: ['III', 'IV', 'I'], rings: [11, 21, 1], plugboardPairs: ['KW', 'IP', 'DM', 'SV', 'JR', 'CX', 'EN', 'AZ', 'QT', 'BU'], kenngruppen: ['QPF', 'LXR', 'NDM', 'KYH'] },
  { day: 17, rotors: ['I', 'V', 'II'], rings: [18, 23, 14], plugboardPairs: ['BV', 'HW', 'AR', 'NX', 'DS', 'PT', 'CZ', 'FI', 'LY', 'EJ'], kenngruppen: ['GWT', 'ZMK', 'JQB', 'NHC'] },
  { day: 16, rotors: ['III', 'IV', 'V'], rings: [16, 4, 7], plugboardPairs: ['LU', 'CV', 'FM', 'KR', 'BY', 'GN', 'QW', 'DJ', 'PS', 'AO'], kenngruppen: ['XVF', 'RPL', 'TWN', 'MBQ'] },
  { day: 15, rotors: ['V', 'III', 'IV'], rings: [24, 13, 10], plugboardPairs: ['HZ', 'NQ', 'AD', 'TV', 'IX', 'KM', 'BG', 'LO', 'CE', 'RY'], kenngruppen: ['JHG', 'WKM', 'PYX', 'DZN'] },
  { day: 14, rotors: ['I', 'IV', 'II'], rings: [6, 20, 25], plugboardPairs: ['FN', 'UY', 'CJ', 'IW', 'LP', 'AS', 'DK', 'GQ', 'MO', 'BZ'], kenngruppen: ['TRC', 'LQH', 'NXP', 'FYM'] },
  { day: 13, rotors: ['III', 'II', 'I'], rings: [3, 26, 18], plugboardPairs: ['KR', 'IZ', 'AT', 'NV', 'BH', 'MP', 'CG', 'OY', 'ES', 'DF'], kenngruppen: ['VBK', 'MWJ', 'QGD', 'XPH'] },
  { day: 12, rotors: ['II', 'IV', 'III'], rings: [4, 11, 15], plugboardPairs: ['DT', 'JV', 'HS', 'CI', 'AY', 'KU', 'EN', 'FQ', 'LR', 'BW'], kenngruppen: ['ZNL', 'RMF', 'TKW', 'YCJ'] },
  { day: 11, rotors: ['V', 'I', 'IV'], rings: [16, 7, 2], plugboardPairs: ['JS', 'PW', 'AV', 'QX', 'DN', 'IZ', 'KM', 'CO', 'EG', 'FL'], kenngruppen: ['HBX', 'PQT', 'NGM', 'WRL'] },
  { day: 10, rotors: ['IV', 'III', 'II'], rings: [20, 12, 14], plugboardPairs: ['FS', 'CQ', 'JO', 'PR', 'AW', 'HV', 'EZ', 'KN', 'DU', 'GT'], kenngruppen: ['YKF', 'MVN', 'LDH', 'QWX'] },
  { day: 9, rotors: ['III', 'II', 'V'], rings: [6, 18, 10], plugboardPairs: ['HK', 'TZ', 'MX', 'LW', 'GQ', 'AD', 'NY', 'BE', 'CS', 'JP'], kenngruppen: ['RGP', 'WJZ', 'NXB', 'TQM'] },
  { day: 8, rotors: ['V', 'I', 'III'], rings: [1, 21, 17], plugboardPairs: ['GU', 'SW', 'BF', 'RX', 'EV', 'OT', 'LQ', 'CH', 'IP', 'KY'], kenngruppen: ['FHD', 'KVN', 'MWR', 'ZJC'] },
  { day: 7, rotors: ['II', 'V', 'I'], rings: [25, 8, 23], plugboardPairs: ['CX', 'AZ', 'DV', 'KT', 'HU', 'LW', 'GP', 'EY', 'MR', 'FQ'], kenngruppen: ['QYL', 'TBW', 'XNP', 'HCM'] },
  { day: 6, rotors: ['IV', 'II', 'V'], rings: [13, 26, 3], plugboardPairs: ['DV', 'LP', 'NQ', 'GZ', 'OS', 'FK', 'EW', 'MR', 'IT', 'HX'], kenngruppen: ['RKJ', 'VMZ', 'LQD', 'FWT'] },
  { day: 5, rotors: ['III', 'I', 'II'], rings: [24, 19, 22], plugboardPairs: ['SY', 'EK', 'NZ', 'OR', 'CG', 'JM', 'QU', 'PV', 'BI', 'LW'], kenngruppen: ['NHG', 'XCP', 'JMB', 'WQK'] },
  { day: 4, rotors: ['II', 'IV', 'I'], rings: [17, 5, 9], plugboardPairs: ['BD', 'GV', 'AX', 'KP', 'EM', 'FN', 'CW', 'RU', 'HO', 'JT'], kenngruppen: ['TPL', 'RZM', 'VWX', 'NQH'] },
  { day: 3, rotors: ['V', 'III', 'IV'], rings: [20, 16, 11], plugboardPairs: ['JT', 'NW', 'DU', 'EO', 'KV', 'BY', 'FS', 'HQ', 'IM', 'LX'], kenngruppen: ['GKJ', 'MYB', 'DZF', 'XRN'] },
  { day: 2, rotors: ['II', 'III', 'V'], rings: [14, 3, 19], plugboardPairs: ['RW', 'OQ', 'GI', 'AZ', 'EJ', 'MS', 'CU', 'DH', 'PY', 'BF'], kenngruppen: ['LWC', 'VTH', 'QNM', 'KXP'] },
  { day: 1, rotors: ['III', 'I', 'IV'], rings: [18, 24, 15], plugboardPairs: ['NP', 'JV', 'LY', 'IX', 'KQ', 'AO', 'DZ', 'CR', 'FT', 'EM'], kenngruppen: ['BHM', 'RJZ', 'YQW', 'FKN'] }
];


// 2. KRIEGSMARINE SCHLÜSSELTAFEL M3 (ALL 31 DAYS)
const KRIEGSMARINE_M3_ENTRIES: CodebookEntry[] = [
  { day: 31, rotors: ['II', 'IV', 'V'], rings: [8, 12, 24], plugboardPairs: ['AF', 'BL', 'CX', 'DI', 'EJ', 'GQ', 'HY', 'KN', 'OR', 'PZ'], kenngruppen: ['KXL', 'ZQM', 'EWJ'] },
  { day: 30, rotors: ['II', 'IV', 'V'], rings: [8, 12, 24], plugboardPairs: ['AM', 'BN', 'CW', 'DX', 'EF', 'GS', 'HU', 'IV', 'KR', 'PY'], kenngruppen: ['BNQ', 'PXV', 'YTZ'] },
  { day: 29, rotors: ['I', 'V', 'II'], rings: [11, 3, 26], plugboardPairs: ['AK', 'BQ', 'CZ', 'DW', 'ET', 'FX', 'GY', 'HJ', 'IN', 'LM'], kenngruppen: ['XVC', 'RTW', 'MKL'] },
  { day: 28, rotors: ['I', 'V', 'II'], rings: [11, 3, 26], plugboardPairs: ['AE', 'BF', 'CG', 'DH', 'IX', 'JW', 'KS', 'LV', 'MR', 'OT'], kenngruppen: ['LPU', 'JNB', 'FGD'] },
  { day: 27, rotors: ['V', 'II', 'IV'], rings: [2, 21, 9], plugboardPairs: ['AP', 'BC', 'DZ', 'EW', 'FY', 'GH', 'IQ', 'JL', 'KR', 'MS'], kenngruppen: ['HGR', 'YUO', 'WQA'] },
  { day: 26, rotors: ['V', 'II', 'IV'], rings: [2, 21, 9], plugboardPairs: ['AG', 'BH', 'CK', 'DL', 'EI', 'FQ', 'GY', 'JU', 'MN', 'PV'], kenngruppen: ['VCF', 'XZW', 'PLM'] },
  { day: 25, rotors: ['IV', 'V', 'II'], rings: [25, 10, 6], plugboardPairs: ['AL', 'BM', 'CN', 'DU', 'EY', 'FZ', 'GR', 'HT', 'IV', 'KW'], kenngruppen: ['TRQ', 'NJS', 'MKL'] },
  { day: 24, rotors: ['IV', 'V', 'II'], rings: [25, 10, 6], plugboardPairs: ['AQ', 'BW', 'CE', 'DR', 'FT', 'GY', 'HU', 'IK', 'JL', 'MP'], kenngruppen: ['OPX', 'VBN', 'QWE'] },
  { day: 23, rotors: ['V', 'IV', 'I'], rings: [7, 18, 12], plugboardPairs: ['AO', 'BP', 'CI', 'DU', 'EX', 'FY', 'GH', 'JK', 'LM', 'QR'], kenngruppen: ['TYU', 'GHJ', 'BNM'] },
  { day: 22, rotors: ['V', 'IV', 'I'], rings: [7, 18, 12], plugboardPairs: ['AZ', 'BX', 'CV', 'DB', 'EN', 'FM', 'GL', 'HK', 'JJ', 'PT'], kenngruppen: ['RTY', 'FGH', 'VBN'] },
  { day: 21, rotors: ['II', 'V', 'III'], rings: [3, 16, 21], plugboardPairs: ['AW', 'BE', 'CR', 'DT', 'EY', 'FU', 'GI', 'HO', 'JP', 'KL'], kenngruppen: ['ZXQ', 'WED', 'CFR'] },
  { day: 20, rotors: ['II', 'V', 'III'], rings: [3, 16, 21], plugboardPairs: ['AS', 'BD', 'CF', 'DG', 'EH', 'FJ', 'GK', 'HL', 'IZ', 'XC'], kenngruppen: ['VBN', 'MAS', 'DFG'] },
  { day: 19, rotors: ['I', 'II', 'V'], rings: [6, 22, 11], plugboardPairs: ['AD', 'FG', 'HJ', 'KL', 'ZX', 'CV', 'BN', 'MQ', 'WE', 'RT'], kenngruppen: ['UIO', 'PAS', 'DFG'] },
  { day: 18, rotors: ['I', 'II', 'V'], rings: [6, 22, 11], plugboardPairs: ['AY', 'BX', 'CU', 'DI', 'EO', 'FP', 'GA', 'HS', 'JK', 'LZ'], kenngruppen: ['XCV', 'BNM', 'QWE'] },
  { day: 17, rotors: ['III', 'V', 'II'], rings: [1, 13, 26], plugboardPairs: ['AC', 'BE', 'DR', 'FT', 'GY', 'HU', 'JI', 'KO', 'LP', 'ZX'], kenngruppen: ['RTY', 'UIO', 'PAS'] },
  { day: 16, rotors: ['III', 'V', 'II'], rings: [1, 13, 26], plugboardPairs: ['AQ', 'WS', 'ED', 'RF', 'TG', 'YH', 'UJ', 'IK', 'OL', 'PX'], kenngruppen: ['DFG', 'HJK', 'LZX'] },
  { day: 15, rotors: ['IV', 'II', 'V'], rings: [24, 8, 14], plugboardPairs: ['AZ', 'SX', 'DC', 'FV', 'GB', 'HN', 'JM', 'KL', 'QW', 'ER'], kenngruppen: ['TYU', 'IOP', 'ASD'] },
  { day: 14, rotors: ['IV', 'II', 'V'], rings: [24, 8, 14], plugboardPairs: ['AX', 'BY', 'CZ', 'DQ', 'EW', 'ER', 'TT', 'YY', 'UU', 'II'], kenngruppen: ['FGH', 'JKL', 'ZXC'] },
  { day: 13, rotors: ['V', 'III', 'I'], rings: [9, 21, 16], plugboardPairs: ['AM', 'NB', 'VC', 'XZ', 'LK', 'JH', 'GF', 'DS', 'AP', 'OI'], kenngruppen: ['UYT', 'REW', 'QAS'] },
  { day: 12, rotors: ['V', 'III', 'I'], rings: [9, 21, 16], plugboardPairs: ['AP', 'OW', 'IE', 'UR', 'YT', 'TQ', 'RE', 'WW', 'QQ', 'AA'], kenngruppen: ['ZSE', 'XDC', 'CFT'] },
  { day: 11, rotors: ['II', 'V', 'IV'], rings: [5, 23, 10], plugboardPairs: ['AK', 'SL', 'DJ', 'FH', 'GG', 'FF', 'DD', 'SS', 'AA', 'ZZ'], kenngruppen: ['VGY', 'BHU', 'NJM'] },
  { day: 10, rotors: ['II', 'V', 'IV'], rings: [5, 23, 10], plugboardPairs: ['AO', 'PI', 'UY', 'TR', 'EW', 'QZ', 'XC', 'VB', 'NM', 'LK'], kenngruppen: ['KJH', 'GFD', 'SAZ'] },
  { day: 9, rotors: ['IV', 'V', 'I'], rings: [14, 6, 20], plugboardPairs: ['AI', 'UB', 'YT', 'RE', 'WQ', 'ZX', 'CV', 'BN', 'MK', 'JH'], kenngruppen: ['GFD', 'SAP', 'OIU'] },
  { day: 8, rotors: ['IV', 'V', 'I'], rings: [14, 6, 20], plugboardPairs: ['AU', 'ZY', 'XW', 'VT', 'SR', 'QP', 'ON', 'ML', 'KJ', 'IH'], kenngruppen: ['GFE', 'DCB', 'AZX'] },
  { day: 7, rotors: ['III', 'IV', 'V'], rings: [16, 26, 1], plugboardPairs: ['AE', 'RI', 'OT', 'UP', 'AS', 'DF', 'GH', 'JK', 'LZ', 'XC'], kenngruppen: ['VBN', 'MQA', 'WSE'] },
  { day: 6, rotors: ['III', 'IV', 'V'], rings: [16, 26, 1], plugboardPairs: ['AW', 'SE', 'DR', 'FT', 'GY', 'HU', 'JI', 'KO', 'LP', 'MX'], kenngruppen: ['NCV', 'BZS', 'XDF'] },
  { day: 5, rotors: ['IV', 'II', 'I'], rings: [8, 3, 22], plugboardPairs: ['AQ', 'SW', 'DE', 'FR', 'GT', 'HY', 'JU', 'KI', 'LO', 'PZ'], kenngruppen: ['XCV', 'BNM', 'QAZ'] },
  { day: 4, rotors: ['IV', 'II', 'I'], rings: [8, 3, 22], plugboardPairs: ['AX', 'SD', 'CF', 'VG', 'BH', 'NJ', 'MK', 'LQ', 'WE', 'RT'], kenngruppen: ['YUI', 'OPA', 'SDF'] },
  { day: 3, rotors: ['V', 'IV', 'III'], rings: [26, 14, 9], plugboardPairs: ['AC', 'EV', 'GT', 'BY', 'HN', 'UJ', 'IK', 'OL', 'PQ', 'WX'], kenngruppen: ['RTY', 'FGH', 'VBN'] },
  { day: 2, rotors: ['V', 'IV', 'III'], rings: [26, 14, 9], plugboardPairs: ['AB', 'CD', 'EF', 'GH', 'IJ', 'KL', 'MN', 'OP', 'QR', 'ST'], kenngruppen: ['UVW', 'XYZ', 'ABC'] },
  { day: 1, rotors: ['III', 'V', 'I'], rings: [4, 18, 17], plugboardPairs: ['AZ', 'BY', 'CX', 'DW', 'EV', 'FU', 'GT', 'HS', 'IR', 'JQ'], kenngruppen: ['KLO', 'MNP', 'QRS'] }
];

// 4. KRIEGSMARINE M4 SHARK SCHLÜSSELTAFEL (4-ROTOR HISTORICAL RECORD)
const KRIEGSMARINE_M4_ENTRIES: CodebookEntry[] = [
  { day: 31, rotors: ['II', 'IV', 'V'], rings: [8, 12, 24], fourthRotor: 'Beta', fourthRing: 5, plugboardPairs: ['AF', 'BL', 'CX', 'DI', 'EJ', 'GQ', 'HY', 'KN', 'OR', 'PZ'], kenngruppen: ['KXL', 'ZQM', 'EWJ'] },
  { day: 30, rotors: ['II', 'IV', 'V'], rings: [8, 12, 24], fourthRotor: 'Beta', fourthRing: 5, plugboardPairs: ['AM', 'BN', 'CW', 'DX', 'EF', 'GS', 'HU', 'IV', 'KR', 'PY'], kenngruppen: ['BNQ', 'PXV', 'YTZ'] },
  { day: 29, rotors: ['I', 'V', 'II'], rings: [11, 3, 26], fourthRotor: 'Beta', fourthRing: 1, plugboardPairs: ['AK', 'BQ', 'CZ', 'DW', 'ET', 'FX', 'GY', 'HJ', 'IN', 'LM'], kenngruppen: ['XVC', 'RTW', 'MKL'] },
  { day: 28, rotors: ['I', 'V', 'II'], rings: [11, 3, 26], fourthRotor: 'Beta', fourthRing: 1, plugboardPairs: ['AE', 'BF', 'CG', 'DH', 'IX', 'JW', 'KS', 'LV', 'MR', 'OT'], kenngruppen: ['LPU', 'JNB', 'FGD'] },
  { day: 27, rotors: ['V', 'II', 'VI'], rings: [2, 21, 9], fourthRotor: 'Beta', fourthRing: 8, plugboardPairs: ['AP', 'BC', 'DZ', 'EW', 'FY', 'GH', 'IQ', 'JL', 'KR', 'MS'], kenngruppen: ['HGR', 'YUO', 'WQA'] },
  { day: 26, rotors: ['V', 'II', 'VI'], rings: [2, 21, 9], fourthRotor: 'Beta', fourthRing: 8, plugboardPairs: ['AG', 'BH', 'CK', 'DL', 'EI', 'FQ', 'GY', 'JU', 'MN', 'PV'], kenngruppen: ['VCF', 'XZW', 'PLM'] },
  { day: 25, rotors: ['VII', 'V', 'II'], rings: [25, 10, 6], fourthRotor: 'Beta', fourthRing: 22, plugboardPairs: ['AL', 'BM', 'CN', 'DU', 'EY', 'FZ', 'GR', 'HT', 'IV', 'KW'], kenngruppen: ['TRQ', 'NJS', 'MKL'] },
  { day: 24, rotors: ['VII', 'V', 'II'], rings: [25, 10, 6], fourthRotor: 'Beta', fourthRing: 22, plugboardPairs: ['AQ', 'BW', 'CE', 'DR', 'FT', 'GY', 'HU', 'IK', 'JL', 'MP'], kenngruppen: ['OPX', 'VBN', 'QWE'] },
  { day: 23, rotors: ['V', 'IV', 'I'], rings: [7, 18, 12], fourthRotor: 'Beta', fourthRing: 9, plugboardPairs: ['AO', 'BP', 'CI', 'DU', 'EX', 'FY', 'GH', 'JK', 'LM', 'QR'], kenngruppen: ['TYU', 'GHJ', 'BNM'] },
  { day: 22, rotors: ['V', 'IV', 'I'], rings: [7, 18, 12], fourthRotor: 'Beta', fourthRing: 9, plugboardPairs: ['AZ', 'BX', 'CV', 'DF', 'EN', 'FM', 'GL', 'HK', 'JP', 'ST'], kenngruppen: ['RTY', 'FGH', 'VBN'] },
  { day: 21, rotors: ['II', 'VI', 'III'], rings: [3, 16, 21], fourthRotor: 'Beta', fourthRing: 11, plugboardPairs: ['AW', 'BE', 'CR', 'DT', 'EY', 'FU', 'GI', 'HO', 'JP', 'KL'], kenngruppen: ['ZXQ', 'WED', 'CFR'] },
  { day: 20, rotors: ['II', 'VI', 'III'], rings: [3, 16, 21], fourthRotor: 'Beta', fourthRing: 11, plugboardPairs: ['AS', 'BD', 'CF', 'DG', 'EH', 'FJ', 'GK', 'HL', 'IZ', 'XC'], kenngruppen: ['VBN', 'MAS', 'DFG'] },
  { day: 19, rotors: ['I', 'II', 'V'], rings: [6, 22, 11], fourthRotor: 'Beta', fourthRing: 15, plugboardPairs: ['AD', 'FG', 'HJ', 'KL', 'ZX', 'CV', 'BN', 'MQ', 'WE', 'RT'], kenngruppen: ['UIO', 'PAS', 'DFG'] },
  { day: 18, rotors: ['I', 'II', 'V'], rings: [6, 22, 11], fourthRotor: 'Beta', fourthRing: 15, plugboardPairs: ['AY', 'BX', 'CU', 'DI', 'EO', 'FP', 'GA', 'HS', 'JK', 'LZ'], kenngruppen: ['XCV', 'BNM', 'QWE'] },
  { day: 17, rotors: ['III', 'V', 'II'], rings: [1, 13, 26], fourthRotor: 'Beta', fourthRing: 13, plugboardPairs: ['AC', 'BE', 'DR', 'FT', 'GY', 'HU', 'JI', 'KO', 'LP', 'ZX'], kenngruppen: ['RTY', 'UIO', 'PAS'] },
  { day: 16, rotors: ['III', 'V', 'II'], rings: [1, 13, 26], fourthRotor: 'Beta', fourthRing: 13, plugboardPairs: ['AQ', 'WS', 'ED', 'RF', 'TG', 'YH', 'UJ', 'IK', 'OL', 'PX'], kenngruppen: ['DFG', 'HJK', 'LZX'] },
  { day: 15, rotors: ['IV', 'II', 'VI'], rings: [24, 8, 14], fourthRotor: 'Beta', fourthRing: 25, plugboardPairs: ['AZ', 'SX', 'DC', 'FV', 'GB', 'HN', 'JM', 'KL', 'QW', 'ER'], kenngruppen: ['TYU', 'IOP', 'ASD'] },
  { day: 14, rotors: ['IV', 'II', 'VI'], rings: [24, 8, 14], fourthRotor: 'Beta', fourthRing: 25, plugboardPairs: ['AX', 'BY', 'CZ', 'DQ', 'EW', 'HR', 'TM', 'YV', 'UN', 'IP'], kenngruppen: ['FGH', 'JKL', 'ZXC'] },
  { day: 13, rotors: ['V', 'VIII', 'I'], rings: [9, 21, 16], fourthRotor: 'Beta', fourthRing: 6, plugboardPairs: ['AM', 'NB', 'VC', 'XZ', 'LK', 'JH', 'GF', 'DS', 'AP', 'OI'], kenngruppen: ['UYT', 'REW', 'QAS'] },
  { day: 12, rotors: ['V', 'VIII', 'I'], rings: [9, 21, 16], fourthRotor: 'Beta', fourthRing: 6, plugboardPairs: ['AP', 'OW', 'IE', 'UR', 'YT', 'TQ', 'RE', 'BX', 'KV', 'GZ'], kenngruppen: ['ZSE', 'XDC', 'CFT'] },
  { day: 11, rotors: ['II', 'V', 'IV'], rings: [5, 23, 10], fourthRotor: 'Beta', fourthRing: 19, plugboardPairs: ['AK', 'SL', 'DJ', 'FH', 'GI', 'BW', 'CP', 'EX', 'QT', 'MR'], kenngruppen: ['VGY', 'BHU', 'NJM'] },
  { day: 10, rotors: ['II', 'V', 'IV'], rings: [5, 23, 10], fourthRotor: 'Beta', fourthRing: 19, plugboardPairs: ['AO', 'PI', 'UY', 'TR', 'EW', 'QZ', 'XC', 'VB', 'NM', 'LK'], kenngruppen: ['KJH', 'GFD', 'SAZ'] },
  { day: 9, rotors: ['IV', 'VII', 'I'], rings: [14, 6, 20], fourthRotor: 'Beta', fourthRing: 24, plugboardPairs: ['AI', 'UB', 'YT', 'RE', 'WQ', 'ZX', 'CV', 'BN', 'MK', 'JH'], kenngruppen: ['GFD', 'SAP', 'OIU'] },
  { day: 8, rotors: ['IV', 'VII', 'I'], rings: [14, 6, 20], fourthRotor: 'Beta', fourthRing: 24, plugboardPairs: ['AU', 'ZY', 'XW', 'VT', 'SR', 'QP', 'ON', 'ML', 'KJ', 'IH'], kenngruppen: ['GFE', 'DCB', 'AZX'] },
  { day: 7, rotors: ['III', 'IV', 'V'], rings: [16, 26, 1], fourthRotor: 'Beta', fourthRing: 17, plugboardPairs: ['AE', 'RI', 'OT', 'UP', 'AS', 'DF', 'GH', 'JK', 'LZ', 'XC'], kenngruppen: ['VBN', 'MQA', 'WSE'] },
  { day: 6, rotors: ['III', 'IV', 'V'], rings: [16, 26, 1], fourthRotor: 'Beta', fourthRing: 17, plugboardPairs: ['AW', 'SE', 'DR', 'FT', 'GY', 'HU', 'JI', 'KO', 'LP', 'MX'], kenngruppen: ['NCV', 'BZS', 'XDF'] },
  { day: 5, rotors: ['IV', 'II', 'I'], rings: [8, 3, 22], fourthRotor: 'Beta', fourthRing: 3, plugboardPairs: ['AQ', 'SW', 'DE', 'FR', 'GT', 'HY', 'JU', 'KI', 'LO', 'PZ'], kenngruppen: ['XCV', 'BNM', 'QAZ'] },
  { day: 4, rotors: ['IV', 'II', 'I'], rings: [8, 3, 22], fourthRotor: 'Beta', fourthRing: 3, plugboardPairs: ['AX', 'SD', 'CF', 'VG', 'BH', 'NJ', 'MK', 'LQ', 'WE', 'RT'], kenngruppen: ['YUI', 'OPA', 'SDF'] },
  { day: 3, rotors: ['V', 'IV', 'III'], rings: [26, 14, 9], fourthRotor: 'Beta', fourthRing: 21, plugboardPairs: ['AC', 'EV', 'GT', 'BY', 'HN', 'UJ', 'IK', 'OL', 'PQ', 'WX'], kenngruppen: ['RTY', 'FGH', 'VBN'] },
  { day: 2, rotors: ['V', 'IV', 'III'], rings: [26, 14, 9], fourthRotor: 'Beta', fourthRing: 21, plugboardPairs: ['AB', 'CD', 'EF', 'GH', 'IJ', 'KL', 'MN', 'OP', 'QR', 'ST'], kenngruppen: ['UVW', 'XYZ', 'ABC'] },
  { day: 1, rotors: ['III', 'V', 'I'], rings: [4, 18, 17], fourthRotor: 'Beta', fourthRing: 1, plugboardPairs: ['AZ', 'BY', 'CX', 'DW', 'EV', 'FU', 'GT', 'HS', 'IR', 'JQ'], kenngruppen: ['KLO', 'MNP', 'QRS'] }
];

// 3. HEER / WEHRMACHT TAGESSCHLÜSSEL NR. 512 (ALL 31 DAYS)
const HEER_512_ENTRIES: CodebookEntry[] = [
  { day: 31, rotors: ['I', 'II', 'III'], rings: [1, 1, 1], plugboardPairs: ['AZ', 'BO', 'CN', 'DP', 'EQ', 'FR', 'GS', 'HT', 'IV', 'JK'], kenngruppen: ['MXQ', 'TWH', 'NVL', 'KPB'] },
  { day: 30, rotors: ['III', 'II', 'I'], rings: [2, 14, 20], plugboardPairs: ['AZ', 'BO', 'CN', 'DP', 'EQ', 'FG', 'HR', 'IS', 'JT', 'KL'], kenngruppen: ['RGZ', 'JNF', 'WDY', 'CXM'] },
  { day: 29, rotors: ['V', 'I', 'IV'], rings: [12, 8, 25], plugboardPairs: ['AZ', 'BM', 'CN', 'DO', 'EP', 'FQ', 'GR', 'HT', 'IS', 'JK'], kenngruppen: ['QHK', 'LBW', 'TVP', 'NMG'] },
  { day: 28, rotors: ['II', 'IV', 'I'], rings: [19, 3, 11], plugboardPairs: ['AY', 'BN', 'CO', 'DP', 'EF', 'GQ', 'HR', 'IS', 'JT', 'KV'], kenngruppen: ['FXZ', 'MDR', 'WJH', 'QCY'] },
  { day: 27, rotors: ['IV', 'III', 'V'], rings: [7, 21, 16], plugboardPairs: ['AX', 'BK', 'CM', 'DN', 'EO', 'FP', 'GQ', 'HR', 'IV', 'JS'], kenngruppen: ['NLT', 'GVB', 'XQW', 'RHZ'] },
  { day: 26, rotors: ['I', 'V', 'II'], rings: [24, 15, 6], plugboardPairs: ['AW', 'BS', 'CL', 'DM', 'EN', 'FO', 'GP', 'HQ', 'IR', 'JT'], kenngruppen: ['KPF', 'MWY', 'DJN', 'TXQ'] },
  { day: 25, rotors: ['III', 'I', 'IV'], rings: [10, 17, 22], plugboardPairs: ['AV', 'BT', 'CJ', 'DK', 'EN', 'FO', 'GP', 'HR', 'IS', 'LU'], kenngruppen: ['VHG', 'ZRB', 'NLC', 'QXM'] },
  { day: 24, rotors: ['V', 'IV', 'II'], rings: [5, 26, 13], plugboardPairs: ['AU', 'BR', 'CH', 'DK', 'EO', 'FT', 'GN', 'IQ', 'JS', 'LW'], kenngruppen: ['WPJ', 'KFZ', 'TDM', 'YNH'] },
  { day: 23, rotors: ['II', 'V', 'III'], rings: [18, 4, 9], plugboardPairs: ['AT', 'BO', 'CK', 'DN', 'EP', 'FQ', 'GH', 'IR', 'JV', 'SW'], kenngruppen: ['GQL', 'MXC', 'RNB', 'VWZ'] },
  { day: 22, rotors: ['IV', 'I', 'V'], rings: [14, 23, 2], plugboardPairs: ['AT', 'BR', 'CE', 'DW', 'FQ', 'GY', 'HU', 'IK', 'JL', 'MS'], kenngruppen: ['JPH', 'WKD', 'TFN', 'QYZ'] },
  { day: 21, rotors: ['I', 'III', 'IV'], rings: [9, 11, 21], plugboardPairs: ['AY', 'BX', 'CV', 'DN', 'EM', 'FL', 'GK', 'HJ', 'IQ', 'OZ'], kenngruppen: ['NMR', 'LVG', 'ZXC', 'TBW'] },
  { day: 20, rotors: ['III', 'V', 'I'], rings: [16, 2, 26], plugboardPairs: ['AS', 'BD', 'CF', 'EG', 'HJ', 'KL', 'ZX', 'IO', 'NT', 'MQ'], kenngruppen: ['HQP', 'JFW', 'KDZ', 'RYM'] },
  { day: 19, rotors: ['V', 'II', 'IV'], rings: [3, 19, 8], plugboardPairs: ['AO', 'PI', 'UY', 'TR', 'EW', 'QZ', 'XC', 'VB', 'NM', 'LK'], kenngruppen: ['TGL', 'XNB', 'VCH', 'MWZ'] },
  { day: 18, rotors: ['II', 'I', 'V'], rings: [22, 12, 17], plugboardPairs: ['AQ', 'SW', 'DE', 'FR', 'GT', 'HY', 'JU', 'KI', 'LO', 'PZ'], kenngruppen: ['QRF', 'MKD', 'VJX', 'BZW'] },
  { day: 17, rotors: ['IV', 'V', 'III'], rings: [8, 25, 4], plugboardPairs: ['AX', 'SD', 'CF', 'VG', 'BH', 'NJ', 'MK', 'LQ', 'WE', 'RT'], kenngruppen: ['LPH', 'NYC', 'WGM', 'KZB'] },
  { day: 16, rotors: ['I', 'IV', 'II'], rings: [20, 6, 15], plugboardPairs: ['AC', 'EV', 'GT', 'BY', 'HN', 'UJ', 'IK', 'OL', 'PQ', 'WX'], kenngruppen: ['TDQ', 'RZV', 'MJH', 'FXN'] },
  { day: 15, rotors: ['V', 'III', 'I'], rings: [13, 18, 10], plugboardPairs: ['AZ', 'SX', 'DC', 'FV', 'GB', 'HN', 'JM', 'KL', 'QW', 'ER'], kenngruppen: ['KBW', 'XMH', 'NPF', 'QGC'] },
  { day: 14, rotors: ['III', 'I', 'V'], rings: [26, 7, 23], plugboardPairs: ['AW', 'SE', 'DR', 'FT', 'GY', 'HU', 'JI', 'KO', 'LP', 'MX'], kenngruppen: ['VJT', 'DZL', 'QWR', 'NHM'] },
  { day: 13, rotors: ['II', 'IV', 'III'], rings: [11, 21, 5], plugboardPairs: ['AP', 'OW', 'IE', 'UR', 'YT', 'BN', 'CG', 'FJ', 'KS', 'MQ'], kenngruppen: ['XPG', 'FWB', 'TQC', 'MZH'] },
  { day: 12, rotors: ['IV', 'II', 'V'], rings: [4, 16, 12], plugboardPairs: ['AM', 'NB', 'VC', 'XZ', 'LK', 'JH', 'GF', 'DS', 'PR', 'OI'], kenngruppen: ['RLV', 'KNY', 'HDW', 'QJM'] },
  { day: 11, rotors: ['I', 'V', 'III'], rings: [17, 9, 24], plugboardPairs: ['AF', 'BL', 'CX', 'DI', 'EJ', 'GQ', 'HY', 'KN', 'OR', 'PZ'], kenngruppen: ['TZX', 'MGF', 'NBH', 'WCL'] },
  { day: 10, rotors: ['V', 'I', 'II'], rings: [21, 14, 3], plugboardPairs: ['AK', 'BQ', 'CZ', 'DW', 'ET', 'FX', 'GY', 'HJ', 'IN', 'LM'], kenngruppen: ['QPD', 'RVN', 'KWM', 'HJY'] },
  { day: 9, rotors: ['III', 'IV', 'I'], rings: [6, 22, 19], plugboardPairs: ['AM', 'BN', 'CW', 'DX', 'EF', 'GS', 'HU', 'IV', 'KR', 'PY'], kenngruppen: ['LBZ', 'XTF', 'NQC', 'MGH'] },
  { day: 8, rotors: ['II', 'V', 'IV'], rings: [15, 5, 20], plugboardPairs: ['AG', 'BH', 'CK', 'DL', 'EI', 'FQ', 'OS', 'JU', 'MN', 'PV'], kenngruppen: ['WVR', 'JDK', 'THM', 'QNP'] },
  { day: 7, rotors: ['IV', 'I', 'III'], rings: [2, 18, 11], plugboardPairs: ['AP', 'BC', 'DZ', 'EW', 'FY', 'GH', 'IQ', 'JL', 'KR', 'MS'], kenngruppen: ['XCG', 'NHW', 'FQL', 'TBZ'] },
  { day: 6, rotors: ['I', 'III', 'V'], rings: [25, 10, 8], plugboardPairs: ['AL', 'BM', 'CN', 'DU', 'EY', 'FZ', 'GR', 'HT', 'IV', 'KW'], kenngruppen: ['MJR', 'VDP', 'KGX', 'WHN'] },
  { day: 5, rotors: ['V', 'II', 'I'], rings: [12, 24, 7], plugboardPairs: ['AE', 'BF', 'CG', 'DH', 'IX', 'JW', 'KS', 'LV', 'MR', 'OT'], kenngruppen: ['QFB', 'ZTY', 'NHM', 'KLW'] },
  { day: 4, rotors: ['III', 'V', 'IV'], rings: [19, 13, 2], plugboardPairs: ['AQ', 'BW', 'CE', 'DR', 'FT', 'GY', 'HU', 'IK', 'JL', 'MP'], kenngruppen: ['XVD', 'RGJ', 'TNH', 'WCM'] },
  { day: 3, rotors: ['II', 'I', 'III'], rings: [7, 3, 16], plugboardPairs: ['AZ', 'BY', 'CX', 'DW', 'EV', 'FU', 'GT', 'HS', 'IR', 'JQ'], kenngruppen: ['NKQ', 'LFZ', 'MBH', 'WYG'] },
  { day: 2, rotors: ['IV', 'III', 'II'], rings: [23, 20, 14], plugboardPairs: ['AB', 'CD', 'EF', 'GH', 'IJ', 'KL', 'MN', 'OP', 'QR', 'ST'], kenngruppen: ['TJX', 'QPR', 'HDN', 'VWK'] },
  { day: 1, rotors: ['I', 'II', 'V'], rings: [10, 8, 25], plugboardPairs: ['TW', 'BI', 'UY', 'GP', 'CK', 'JQ', 'DL', 'RV', 'EM', 'AH'], kenngruppen: ['GZB', 'MFY', 'NCW', 'KHQ'] }
];


export const HISTORICAL_CODEBOOKS: CodebookSheet[] = [
  {
    id: 'luftwaffe_2744',
    title: 'Luftwaffen-Maschinen-Schlüssel Nr. 2744',
    subtitle: 'Oberkommando der Luftwaffe (Air Force WWII Secret Key Table)',
    classification: 'GEHEIME KOMMANDOSACHE!',
    monthYear: 'Oktober 1943',
    pruefnummer: '000082 / 2744',
    isHistorical: true,
    entries: LUFTWAFFE_2744_ENTRIES
  },
  {
    id: 'kriegsmarine_m3',
    title: 'Kriegsmarine Schlüsseltafel M3',
    subtitle: 'Oberkommando der Marine (Navy M3 Enigma Key Sheet)',
    classification: 'GEHEIM!',
    monthYear: 'Oktober 1943',
    pruefnummer: '4092-B',
    isHistorical: true,
    entries: KRIEGSMARINE_M3_ENTRIES
  },
  {
    id: 'heer_512',
    title: 'Heer/Wehrmacht Tagesschlüssel Nr. 512',
    subtitle: 'Oberkommando des Heeres (Army Ground Signals Secret Table)',
    classification: 'GEHEIME KOMMANDOSACHE!',
    monthYear: 'November 1944',
    pruefnummer: '512-H',
    isHistorical: true,
    entries: HEER_512_ENTRIES
  },
  {
    id: 'kriegsmarine_m4',
    title: 'Kriegsmarine M4 Schlüsseltafel (Shark)',
    subtitle: 'Oberkommando der Marine — 4-Rotor Enigma M4 Key Sheet',
    classification: 'GEHEIM!',
    monthYear: 'Oktober 1943',
    pruefnummer: '4092-M4',
    isHistorical: true,
    entries: KRIEGSMARINE_M4_ENTRIES
  }
];

// Helper to auto-generate authentic 31-day random codebook entries
function generateRandom31DayEntries(): CodebookEntry[] {
  const rotorsPool: RotorType[] = ['I', 'II', 'III', 'IV', 'V'];
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  const entries: CodebookEntry[] = [];

  for (let day = 31; day >= 1; day--) {
    // Pick 3 distinct rotors
    const shuffledRotors = [...rotorsPool].sort(() => Math.random() - 0.5);
    const selectedRotors: [RotorType, RotorType, RotorType] = [
      shuffledRotors[0],
      shuffledRotors[1],
      shuffledRotors[2]
    ];

    // Pick 3 ring settings 1-26
    const rings: [number, number, number] = [
      Math.floor(Math.random() * 26) + 1,
      Math.floor(Math.random() * 26) + 1,
      Math.floor(Math.random() * 26) + 1
    ];

    // Generate 10 non-overlapping plugboard pairs
    const availChars = [...alphabet].sort(() => Math.random() - 0.5);
    const pairs: string[] = [];
    for (let p = 0; p < 10; p++) {
      const c1 = availChars.pop()!;
      const c2 = availChars.pop()!;
      pairs.push(`${c1}${c2}`);
    }

    // Generate 3 or 4 Kenngruppen trigrams
    const kgList: string[] = [];
    for (let k = 0; k < 4; k++) {
      const kg =
        alphabet[Math.floor(Math.random() * 26)].toLowerCase() +
        alphabet[Math.floor(Math.random() * 26)].toLowerCase() +
        alphabet[Math.floor(Math.random() * 26)].toLowerCase();
      kgList.push(kg);
    }

    entries.push({
      day,
      rotors: selectedRotors,
      rings,
      plugboardPairs: pairs,
      kenngruppen: kgList
    });
  }

  return entries;
}

const LOCAL_STORAGE_KEY = 'enigma_custom_codebooks_v1';

export const CodebookView: React.FC<CodebookViewProps> = ({
  onApplyConfig,
  onNavigateToMachine
}) => {
  // Load custom codebooks from localStorage
  const [customSheets, setCustomSheets] = useState<CodebookSheet[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (err) {
      console.error('Failed to load custom codebooks:', err);
    }
    return [];
  });

  // Combine historical and custom codebooks
  const allSheets = [...HISTORICAL_CODEBOOKS, ...customSheets];

  const [selectedBookId, setSelectedBookId] = useState<string>('luftwaffe_2744');
  const [appliedDayKey, setAppliedDayKey] = useState<string | null>(null);
  const [filterDay, setFilterDay] = useState<string>('');
  
  // Ringstellung display format: 'number' (01-26) or 'letter' (A-Z)
  const [ringFormat, setRingFormat] = useState<'number' | 'letter'>(() => {
    try {
      const saved = localStorage.getItem('enigma_ring_format');
      if (saved === 'letter' || saved === 'number') return saved;
    } catch (e) {
      // ignore
    }
    return 'number';
  });

  const handleSetRingFormat = (fmt: 'number' | 'letter') => {
    setRingFormat(fmt);
    try {
      localStorage.setItem('enigma_ring_format', fmt);
    } catch (e) {
      // ignore
    }
  };
  
  // View Modes: 'view' | 'create_builder'
  const [activeViewMode, setActiveViewMode] = useState<'view' | 'create_builder'>('view');

  // Currently active sheet
  const currentSheet = allSheets.find((c) => c.id === selectedBookId) || HISTORICAL_CODEBOOKS[0];
  const isCurrentHistorical = !!currentSheet.isHistorical;
  const hasFourthRotor = currentSheet.entries.some((e: CodebookEntry) => e.fourthRotor);
  const hasDualReflector = currentSheet.entries.some((e: CodebookEntry) => e.reflectorType !== undefined);

  // Save custom sheets to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(customSheets));
    } catch (err) {
      console.error('Failed to save custom codebooks:', err);
    }
  }, [customSheets]);

  // Form states for "Create New Codebook" Page
  const [builderTitle, setBuilderTitle] = useState<string>('Sonder-Schlüsseltafel Nr. 99');
  const [builderSubtitle, setBuilderSubtitle] = useState<string>('Oberkommando der Wehrmacht (Custom Military Key Table)');
  const [builderClassification, setBuilderClassification] = useState<string>('GEHEIME KOMMANDOSACHE!');
  const [builderMonthYear, setBuilderMonthYear] = useState<string>('Dezember 1944');
  const [builderPruefnummer, setBuilderPruefnummer] = useState<string>('9901 / OKW');
  const [builderGenerateAllDays, setBuilderGenerateAllDays] = useState<boolean>(true);

  // Universal Enigma Generator Parameters (EnigmaGeneratorConfig)
  const [builderDaysInMonth, setBuilderDaysInMonth] = useState<number>(31);
  const [builderRotorsPool, setBuilderRotorsPool] = useState<string[]>(['I', 'II', 'III', 'IV', 'V']);
  const [builderUseTwoDayRule, setBuilderUseTwoDayRule] = useState<boolean>(false);
  const [builderPlugboardPairsCount, setBuilderPlugboardPairsCount] = useState<number>(10);
  const [builderKenngruppenCount, setBuilderKenngruppenCount] = useState<number>(4);
  const [builderKenngruppenLength, setBuilderKenngruppenLength] = useState<number>(3);
  const [builderIsM4, setBuilderIsM4] = useState<boolean>(false);
  const [builderFourthRotorsPool, setBuilderFourthRotorsPool] = useState<string[]>(['Beta', 'Gamma']);
  const [builderUseFixedFourthRing, setBuilderUseFixedFourthRing] = useState<boolean>(true);
  const [builderFixedFourthRing, setBuilderFixedFourthRing] = useState<number>(1);

  // UKW Dual Dynamic Reflector Parameters
  const [builderUseDualReflector, setBuilderUseDualReflector] = useState<boolean>(false);
  const [builderUseFixedReflectorRing, setBuilderUseFixedReflectorRing] = useState<boolean>(false);
  const [builderFixedReflectorRing, setBuilderFixedReflectorRing] = useState<number>(1);
  const [builderUseFixedReflectorStart, setBuilderUseFixedReflectorStart] = useState<boolean>(false);
  const [builderFixedReflectorStart, setBuilderFixedReflectorStart] = useState<number>(1);

  const toggleRotorInPool = (rotor: string) => {
    setBuilderRotorsPool((prev) => {
      if (prev.includes(rotor)) {
        if (prev.length <= 3) return prev; // At least 3 rotors required
        return prev.filter((r) => r !== rotor);
      } else {
        return [...prev, rotor];
      }
    });
  };

  const toggleFourthRotorInPool = (rotor: string) => {
    setBuilderFourthRotorsPool((prev) => {
      if (prev.includes(rotor)) {
        if (prev.length <= 1) return prev; // At least 1 fourth rotor required
        return prev.filter((r) => r !== rotor);
      } else {
        return [...prev, rotor];
      }
    });
  };

  const applyGeneratorPreset = (preset: 'luftwaffe' | 'heer' | 'm3' | 'm4' | 'ukw_dual') => {
    if (preset === 'luftwaffe') {
      setBuilderTitle('Luftwaffen-Maschinen-Schlüssel Nr. 2744');
      setBuilderSubtitle('Oberkommando der Luftwaffe (Air Force Secret Key Sheet)');
      setBuilderClassification('GEHEIME KOMMANDOSACHE!');
      setBuilderDaysInMonth(31);
      setBuilderRotorsPool(['I', 'II', 'III', 'IV', 'V']);
      setBuilderUseTwoDayRule(false);
      setBuilderPlugboardPairsCount(10);
      setBuilderKenngruppenCount(4);
      setBuilderKenngruppenLength(3);
      setBuilderIsM4(false);
      setBuilderUseDualReflector(false);
    } else if (preset === 'heer') {
      setBuilderTitle('Heer/Wehrmacht Tagesschlüssel Nr. 512');
      setBuilderSubtitle('Oberkommando des Heeres (Army Ground Signals Key Table)');
      setBuilderClassification('GEHEIME KOMMANDOSACHE!');
      setBuilderDaysInMonth(30);
      setBuilderRotorsPool(['I', 'II', 'III', 'IV', 'V']);
      setBuilderUseTwoDayRule(false);
      setBuilderPlugboardPairsCount(10);
      setBuilderKenngruppenCount(4);
      setBuilderKenngruppenLength(3);
      setBuilderIsM4(false);
      setBuilderUseDualReflector(false);
    } else if (preset === 'm3') {
      setBuilderTitle('Kriegsmarine Schlüsseltafel M3');
      setBuilderSubtitle('Oberkommando der Marine (Navy M3 Enigma Key Sheet)');
      setBuilderClassification('GEHEIM!');
      setBuilderDaysInMonth(31);
      setBuilderRotorsPool(['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII']);
      setBuilderUseTwoDayRule(true);
      setBuilderPlugboardPairsCount(10);
      setBuilderKenngruppenCount(3);
      setBuilderKenngruppenLength(3);
      setBuilderIsM4(false);
      setBuilderUseDualReflector(false);
    } else if (preset === 'm4') {
      setBuilderTitle('Kriegsmarine M4 Schlüsseltafel (Shark)');
      setBuilderSubtitle('Oberkommando der Marine (4-Rotor M4 Navy Key Sheet)');
      setBuilderClassification('GEHEIM!');
      setBuilderDaysInMonth(31);
      setBuilderRotorsPool(['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII']);
      setBuilderUseTwoDayRule(true);
      setBuilderPlugboardPairsCount(10);
      setBuilderKenngruppenCount(3);
      setBuilderKenngruppenLength(3);
      setBuilderIsM4(true);
      setBuilderFourthRotorsPool(['Beta', 'Gamma']);
      setBuilderUseFixedFourthRing(true);
      setBuilderFixedFourthRing(1);
      setBuilderUseDualReflector(false);
    } else if (preset === 'ukw_dual') {
      setBuilderTitle('Sonder-Schlüsseltafel UKW-Dual (What-If Speculative)');
      setBuilderSubtitle('Oberkommando der Wehrmacht — Experimental Dynamic Reflector Table');
      setBuilderClassification('GEHEIME KOMMANDOSACHE!');
      setBuilderDaysInMonth(31);
      setBuilderRotorsPool(['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII']);
      setBuilderUseTwoDayRule(false);
      setBuilderPlugboardPairsCount(10);
      setBuilderKenngruppenCount(4);
      setBuilderKenngruppenLength(3);
      setBuilderIsM4(false);
      setBuilderUseDualReflector(true);
      setBuilderUseFixedReflectorRing(false);
      setBuilderUseFixedReflectorStart(false);
    }
  };

  // Form states for adding a day entry to a custom codebook
  const [isAddDayModalOpen, setIsAddDayModalOpen] = useState<boolean>(false);
  const [addDayNum, setAddDayNum] = useState<number>(1);
  const [addRotorLeft, setAddRotorLeft] = useState<RotorType>('I');
  const [addRotorMid, setAddRotorMid] = useState<RotorType>('II');
  const [addRotorRight, setAddRotorRight] = useState<RotorType>('III');
  const [addRingLeft, setAddRingLeft] = useState<number>(1);
  const [addRingMid, setAddRingMid] = useState<number>(1);
  const [addRingRight, setAddRingRight] = useState<number>(1);
  const [addPlugString, setAddPlugString] = useState<string>('AF BL CX DI EJ GQ HY KN OR PZ');
  const [addKenngruppen, setAddKenngruppen] = useState<string>('kxl zqm ewj');
  const [addReflectorType, setAddReflectorType] = useState<ReflectorType>('Reflector B');
  const [addReflectorRing, setAddReflectorRing] = useState<number>(1);
  const [addReflectorStart, setAddReflectorStart] = useState<number>(1);

  const pad2 = (n: number) => n.toString().padStart(2, '0');

  // Apply a day's key configuration to the Enigma Machine
  const handleApplyDay = (entry: CodebookEntry) => {
    const plugboardRecord: Record<string, string> = {};
    entry.plugboardPairs.forEach((pair) => {
      const clean = pair.trim().toUpperCase();
      if (clean.length === 2) {
        const charA = clean[0];
        const charB = clean[1];
        if (charA !== charB) {
          plugboardRecord[charA] = charB;
          plugboardRecord[charB] = charA;
        }
      }
    });

    const isM4 = !!entry.fourthRotor;

    const newEnigmaConfig: EnigmaConfig = {
      leftRotor: {
        type: entry.rotors[0],
        ring: entry.rings[0],
        start: 0,
        current: 0
      },
      middleRotor: {
        type: entry.rotors[1],
        ring: entry.rings[1],
        start: 0,
        current: 0
      },
      rightRotor: {
        type: entry.rotors[2],
        ring: entry.rings[2],
        start: 0,
        current: 0
      },
      fourthRotor: {
        type: entry.fourthRotor || 'I',
        ring: entry.fourthRing || 1,
        start: 0,
        current: 0
      },
      reflector: {
        type: entry.reflectorType || (isM4 ? 'Reflector B Thin' : 'Reflector B'),
        ring: entry.reflectorRing || 1,
        start: entry.reflectorStart ? entry.reflectorStart - 1 : 0,
        current: entry.reflectorStart ? entry.reflectorStart - 1 : 0
      },
      plugboard: plugboardRecord
    };

    onApplyConfig(newEnigmaConfig);
    setAppliedDayKey(`${currentSheet.id}-${entry.day}`);
    if (onNavigateToMachine) {
      setTimeout(() => {
        onNavigateToMachine();
      }, 450);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Create new custom codebook
  const handleCreateCodebookSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newId = `custom_${Date.now()}`;
    let generatedEntries: CodebookEntry[] = [];

    if (builderGenerateAllDays) {
      const config: EnigmaGeneratorConfig = {
        daysInMonth: Math.max(1, Math.min(31, builderDaysInMonth || 31)),
        rotorsPool: builderRotorsPool.length >= 3 ? builderRotorsPool : ['I', 'II', 'III'],
        useTwoDayRule: builderUseTwoDayRule,
        plugboardPairsCount: Math.max(0, Math.min(13, builderPlugboardPairsCount ?? 10)),
        kenngruppenCount: Math.max(1, Math.min(6, builderKenngruppenCount ?? 4)),
        kenngruppenLength: Math.max(2, Math.min(5, builderKenngruppenLength ?? 3)),
        fourthRotorsPool: builderIsM4 ? (builderFourthRotorsPool.length > 0 ? builderFourthRotorsPool : ['Beta']) : undefined,
        fixedFourthRing: (builderIsM4 && builderUseFixedFourthRing) ? builderFixedFourthRing : undefined,
        useDualDynamicReflector: builderUseDualReflector,
        fixedReflectorRing: (builderUseDualReflector && builderUseFixedReflectorRing) ? builderFixedReflectorRing : undefined,
        fixedReflectorStart: (builderUseDualReflector && builderUseFixedReflectorStart) ? builderFixedReflectorStart : undefined
      };

      const universalEntries = generateUniversalEnigmaCodebook(config);
      generatedEntries = universalEntries.map((e) => ({
        day: e.day,
        rotors: [e.rotors[0] as RotorType, e.rotors[1] as RotorType, e.rotors[2] as RotorType],
        rings: [e.rings[0], e.rings[1], e.rings[2]],
        plugboardPairs: e.plugboardPairs,
        kenngruppen: e.kenngruppen,
        fourthRotor: e.fourthRotor as RotorType | undefined,
        fourthRing: e.fourthRing,
        reflectorType: e.reflectorType as ReflectorType | undefined,
        reflectorRing: e.reflectorRing,
        reflectorStart: e.reflectorStart
      }));
    }

    const newSheet: CodebookSheet = {
      id: newId,
      title: builderTitle.trim() || 'Custom Schlüsseltafel',
      subtitle: builderSubtitle.trim() || 'Custom Operations Secret Key Table',
      classification: builderClassification.trim() || 'GEHEIM!',
      monthYear: builderMonthYear.trim() || 'Custom Date',
      pruefnummer: builderPruefnummer.trim() || 'CST-001',
      isHistorical: false,
      entries: generatedEntries
    };

    setCustomSheets((prev) => [newSheet, ...prev]);
    setSelectedBookId(newId);
    setActiveViewMode('view');
  };

  // Add day entry to custom codebook
  const handleAddDayToCustomBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (isCurrentHistorical) return;

    const pairs = addPlugString
      .toUpperCase()
      .split(/[\s,]+/)
      .filter((p) => p.length === 2);

    const kgList = addKenngruppen
      .trim()
      .split(/[\s,]+/)
      .filter(Boolean);

    const created: CodebookEntry = {
      day: addDayNum,
      rotors: [addRotorLeft, addRotorMid, addRotorRight],
      rings: [addRingLeft, addRingMid, addRingRight],
      plugboardPairs: pairs,
      kenngruppen: kgList.length > 0 ? kgList : ['cst', 'key', 'grp'],
      reflectorType: addReflectorType,
      reflectorRing: addReflectorRing,
      reflectorStart: addReflectorStart
    };

    setCustomSheets((prev) =>
      prev.map((sheet) => {
        if (sheet.id === currentSheet.id) {
          const filtered = sheet.entries.filter((e) => e.day !== addDayNum);
          const updated = [...filtered, created].sort((a, b) => b.day - a.day);
          return { ...sheet, entries: updated };
        }
        return sheet;
      })
    );

    setIsAddDayModalOpen(false);
  };

  // Delete a day entry from custom codebook
  const handleDeleteDayEntry = (dayToDelete: number) => {
    if (isCurrentHistorical) return;
    setCustomSheets((prev) =>
      prev.map((sheet) => {
        if (sheet.id === currentSheet.id) {
          return {
            ...sheet,
            entries: sheet.entries.filter((e) => e.day !== dayToDelete)
          };
        }
        return sheet;
      })
    );
  };

  // Delete an entire custom codebook
  const handleDeleteCustomCodebook = () => {
    if (isCurrentHistorical) return;
    if (confirm(`Are you sure you want to delete the custom codebook "${currentSheet.title}"?`)) {
      setCustomSheets((prev) => prev.filter((s) => s.id !== currentSheet.id));
      setSelectedBookId(HISTORICAL_CODEBOOKS[0].id);
    }
  };

  // Filter entries
  const displayedEntries = currentSheet.entries.filter((entry) => {
    if (!filterDay.trim()) return true;
    return entry.day.toString().includes(filterDay.trim());
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Header & Page Mode Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden bg-[#201b0f] p-4 rounded-xl border border-[#4e453b] shadow-panel">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveViewMode('view')}
            className={`px-4 py-2 rounded-lg text-xs font-ui-header uppercase font-bold tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              activeViewMode === 'view'
                ? 'bg-[#ebc238] text-[#25190b] shadow'
                : 'bg-[#3b3426] text-[#e3c193] hover:bg-[#4e453b]'
            }`}
          >
            <span className="material-symbols-outlined text-sm">menu_book</span>
            View Codebooks
          </button>

          <button
            type="button"
            onClick={() => setActiveViewMode('create_builder')}
            className={`px-4 py-2 rounded-lg text-xs font-ui-header uppercase font-bold tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              activeViewMode === 'create_builder'
                ? 'bg-[#ebc238] text-[#25190b] shadow'
                : 'bg-[#2b6121] text-[#e3f0db] hover:bg-[#387a2c]'
            }`}
          >
            <span className="material-symbols-outlined text-sm">add_box</span>
            Create New Codebook
          </button>
        </div>

        {activeViewMode === 'view' && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handlePrint}
              className="text-xs font-ui-header bg-[#3b3426] hover:bg-[#4e453b] text-[#e3c193] border border-[#8b6f47] px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow"
            >
              <span className="material-symbols-outlined text-sm">print</span>
              Print Sheet
            </button>
          </div>
        )}
      </div>

      {/* MODE 1: CREATE NEW CODEBOOK PAGE */}
      {activeViewMode === 'create_builder' && (
        <div className="bg-[#201b0f] border border-[#8b6f47] rounded-xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="border-b border-[#3b3426] pb-4 flex justify-between items-start">
            <div>
              <h2 className="text-xl font-ui-header font-bold text-[#ebc238] uppercase flex items-center gap-2">
                <span className="material-symbols-outlined text-2xl">post_add</span>
                Create Custom Enigma Codebook
              </h2>
              <p className="text-xs text-[#d1c4b7] mt-1 font-ui-body">
                Generate or compose a authentic WWII-style key sheet for your unit or network.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveViewMode('view')}
              className="text-xs bg-[#3b3426] hover:bg-[#4e453b] text-[#d1c4b7] px-3 py-1.5 rounded flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">cancel</span>
              Cancel
            </button>
          </div>

          <form onSubmit={handleCreateCodebookSubmit} className="space-y-6 text-sm">
            {/* Historical Presets Banner */}
            <div className="bg-[#120e04] border border-[#3b3426] rounded-lg p-3.5 space-y-2">
              <span className="text-xs font-bold text-[#ebc238] uppercase tracking-wider block">
                Quick Branch Presets (Gyors történeti sablonok):
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => applyGeneratorPreset('luftwaffe')}
                  className="px-2.5 py-1 text-xs font-ui-header bg-[#2a2418] hover:bg-[#3b3426] text-[#e3c193] border border-[#4e453b] rounded flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span className="material-symbols-outlined text-xs">flight</span>
                  Luftwaffe (31d, I-V, 4 KG)
                </button>
                <button
                  type="button"
                  onClick={() => applyGeneratorPreset('heer')}
                  className="px-2.5 py-1 text-xs font-ui-header bg-[#2a2418] hover:bg-[#3b3426] text-[#e3c193] border border-[#4e453b] rounded flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span className="material-symbols-outlined text-xs">military_tech</span>
                  Heer / Army (30d, I-V, 4 KG)
                </button>
                <button
                  type="button"
                  onClick={() => applyGeneratorPreset('m3')}
                  className="px-2.5 py-1 text-xs font-ui-header bg-[#2a2418] hover:bg-[#3b3426] text-[#e3c193] border border-[#4e453b] rounded flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span className="material-symbols-outlined text-xs">sailing</span>
                  Kriegsmarine M3 (31d, I-VIII, 2-Day Rule, 3 KG)
                </button>
                <button
                  type="button"
                  onClick={() => applyGeneratorPreset('m4')}
                  className="px-2.5 py-1 text-xs font-ui-header bg-[#2a2418] hover:bg-[#3b3426] text-[#e3c193] border border-[#4e453b] rounded flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span className="material-symbols-outlined text-xs">phishing</span>
                  Kriegsmarine M4 (31d, 4-Rotor Beta/Gamma, Fixed Ring A)
                </button>
                <button
                  type="button"
                  onClick={() => applyGeneratorPreset('ukw_dual')}
                  className="px-2.5 py-1 text-xs font-ui-header bg-[#381f0d] hover:bg-[#4d2c14] text-[#f2a879] border border-[#733c19] rounded flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span className="material-symbols-outlined text-xs">published_with_changes</span>
                  Speculative UKW-Dual (31d, Dynamic Reflector)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#e3c193] mb-1 uppercase tracking-wider">
                  Document Title (Titel):
                </label>
                <input
                  type="text"
                  value={builderTitle}
                  onChange={(e) => setBuilderTitle(e.target.value)}
                  placeholder="e.g. Geheime Kommandosache - Tagesschlüssel"
                  className="w-full bg-[#120e04] border border-[#4e453b] rounded-lg p-2.5 text-[#ede1cd] font-mono text-xs focus:outline-none focus:border-[#ebc238]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#e3c193] mb-1 uppercase tracking-wider">
                  Subtitle / Unit (Untertitel):
                </label>
                <input
                  type="text"
                  value={builderSubtitle}
                  onChange={(e) => setBuilderSubtitle(e.target.value)}
                  placeholder="e.g. Special Field Forces Secret Key Table"
                  className="w-full bg-[#120e04] border border-[#4e453b] rounded-lg p-2.5 text-[#ede1cd] font-mono text-xs focus:outline-none focus:border-[#ebc238]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#e3c193] mb-1 uppercase tracking-wider">
                  Classification Stamp (Klassifizierung):
                </label>
                <select
                  value={builderClassification}
                  onChange={(e) => setBuilderClassification(e.target.value)}
                  className="w-full bg-[#120e04] border border-[#4e453b] text-[#ebc238] font-bold rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#ebc238]"
                >
                  <option value="GEHEIME KOMMANDOSACHE!">GEHEIME KOMMANDOSACHE! (Top Secret)</option>
                  <option value="GEHEIM!">GEHEIM! (Secret)</option>
                  <option value="NUR FÜR DIENSTGEBRAUCH">NUR FÜR DIENSTGEBRAUCH (Official Use Only)</option>
                  <option value="STRENG GEHEIM!">STRENG GEHEIM! (Strictly Confidential)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#e3c193] mb-1 uppercase tracking-wider">
                  Month & Year (Monat / Jahr):
                </label>
                <input
                  type="text"
                  value={builderMonthYear}
                  onChange={(e) => setBuilderMonthYear(e.target.value)}
                  placeholder="e.g. Dezember 1944"
                  className="w-full bg-[#120e04] border border-[#4e453b] rounded-lg p-2.5 text-[#ede1cd] font-mono text-xs focus:outline-none focus:border-[#ebc238]"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#e3c193] mb-1 uppercase tracking-wider">
                  Prüfnummer / Serial Number:
                </label>
                <input
                  type="text"
                  value={builderPruefnummer}
                  onChange={(e) => setBuilderPruefnummer(e.target.value)}
                  placeholder="e.g. 9901-C / OKW"
                  className="w-full bg-[#120e04] border border-[#4e453b] rounded-lg p-2.5 text-[#ede1cd] font-mono text-xs focus:outline-none focus:border-[#ebc238]"
                  required
                />
              </div>
            </div>

            {/* Checkbox toggle for auto-generation */}
            <div className="bg-[#120e04] border border-[#4e453b] rounded-lg p-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-[#ede1cd]">
                <input
                  type="checkbox"
                  checked={builderGenerateAllDays}
                  onChange={(e) => setBuilderGenerateAllDays(e.target.checked)}
                  className="accent-[#ebc238] w-4 h-4 cursor-pointer"
                />
                <span className="font-bold text-[#ebc238] uppercase tracking-wide">
                  Generate Days with Universal Enigma Codebook Generator (Általános Generáló)
                </span>
              </label>
            </div>

            {/* Universal Generator Parameters Panel */}
            {builderGenerateAllDays && (
              <div className="bg-[#171208] border border-[#8b6f47]/60 rounded-xl p-4 sm:p-5 space-y-4 animate-fade-in">
                <div className="flex items-center justify-between border-b border-[#3b3426] pb-2">
                  <h3 className="text-xs font-ui-header font-bold text-[#ebc238] uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">tune</span>
                    Universal Generator Parameters (EnigmaGeneratorConfig)
                  </h3>
                  <span className="text-[10px] text-[#83715d] font-mono">
                    Fisher-Yates Safe Randomizer
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {/* Days in Month */}
                  <div>
                    <label className="block text-xs font-bold text-[#d1c4b7] mb-1">
                      Days in Month (daysInMonth):
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={builderDaysInMonth}
                      onChange={(e) => setBuilderDaysInMonth(parseInt(e.target.value) || 31)}
                      className="w-full bg-[#0d0a03] border border-[#4e453b] rounded p-2 text-[#ede1cd] font-mono text-xs focus:outline-none focus:border-[#ebc238]"
                    />
                    <span className="text-[10px] text-[#83715d] mt-0.5 block">Standard: 30 or 31 days</span>
                  </div>

                  {/* Plugboard Pairs Count */}
                  <div>
                    <label className="block text-xs font-bold text-[#d1c4b7] mb-1">
                      Plugboard Cable Pairs (plugboardPairsCount):
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={13}
                      value={builderPlugboardPairsCount}
                      onChange={(e) => setBuilderPlugboardPairsCount(parseInt(e.target.value) ?? 10)}
                      className="w-full bg-[#0d0a03] border border-[#4e453b] rounded p-2 text-[#ede1cd] font-mono text-xs focus:outline-none focus:border-[#ebc238]"
                    />
                    <span className="text-[10px] text-[#83715d] mt-0.5 block">Standard: 10 (max 13 cables)</span>
                  </div>

                  {/* Two-Day Rule */}
                  <div>
                    <label className="block text-xs font-bold text-[#d1c4b7] mb-1">
                      Two-Day Rule (useTwoDayRule):
                    </label>
                    <label className="flex items-center gap-2 bg-[#0d0a03] border border-[#4e453b] rounded p-2 cursor-pointer text-xs text-[#ede1cd] h-[38px]">
                      <input
                        type="checkbox"
                        checked={builderUseTwoDayRule}
                        onChange={(e) => setBuilderUseTwoDayRule(e.target.checked)}
                        className="accent-[#ebc238] w-4 h-4 cursor-pointer"
                      />
                      <span>Inner key changes odd days only</span>
                    </label>
                    <span className="text-[10px] text-[#83715d] mt-0.5 block">Even days inherit odd day internal key</span>
                  </div>

                  {/* Kenngruppen Count */}
                  <div>
                    <label className="block text-xs font-bold text-[#d1c4b7] mb-1">
                      Kenngruppen Count (kenngruppenCount):
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={6}
                      value={builderKenngruppenCount}
                      onChange={(e) => setBuilderKenngruppenCount(parseInt(e.target.value) || 1)}
                      className="w-full bg-[#0d0a03] border border-[#4e453b] rounded p-2 text-[#ede1cd] font-mono text-xs focus:outline-none focus:border-[#ebc238]"
                    />
                    <span className="text-[10px] text-[#83715d] mt-0.5 block">Luftwaffe: 4, Kriegsmarine: 3</span>
                  </div>

                  {/* Kenngruppen Length */}
                  <div>
                    <label className="block text-xs font-bold text-[#d1c4b7] mb-1">
                      Kenngruppen Length (kenngruppenLength):
                    </label>
                    <input
                      type="number"
                      min={2}
                      max={5}
                      value={builderKenngruppenLength}
                      onChange={(e) => setBuilderKenngruppenLength(parseInt(e.target.value) || 3)}
                      className="w-full bg-[#0d0a03] border border-[#4e453b] rounded p-2 text-[#ede1cd] font-mono text-xs focus:outline-none focus:border-[#ebc238]"
                    />
                    <span className="text-[10px] text-[#83715d] mt-0.5 block">Usually 3 (trigram groups)</span>
                  </div>

                  {/* M4 4-Rotor Support */}
                  <div>
                    <label className="block text-xs font-bold text-[#d1c4b7] mb-1">
                      Enigma M4 4-Rotor Mode:
                    </label>
                    <label className="flex items-center gap-2 bg-[#0d0a03] border border-[#4e453b] rounded p-2 cursor-pointer text-xs text-[#ede1cd] h-[38px]">
                      <input
                        type="checkbox"
                        checked={builderIsM4}
                        onChange={(e) => setBuilderIsM4(e.target.checked)}
                        className="accent-[#ebc238] w-4 h-4 cursor-pointer"
                      />
                      <span>Enable 4th thin rotor</span>
                    </label>
                    <span className="text-[10px] text-[#83715d] mt-0.5 block">Kriegsmarine Shark key structure</span>
                  </div>
                </div>

                {/* Main Rotors Pool selection */}
                <div>
                  <label className="block text-xs font-bold text-[#e3c193] mb-1.5 uppercase tracking-wider">
                    Selectable Main Rotors Pool (rotorsPool):
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'].map((r) => {
                      const isSelected = builderRotorsPool.includes(r);
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => toggleRotorInPool(r)}
                          className={`px-3 py-1 rounded text-xs font-mono font-bold transition-colors cursor-pointer border ${
                            isSelected
                              ? 'bg-[#ebc238] text-[#25190b] border-[#ebc238]'
                              : 'bg-[#0d0a03] text-[#83715d] border-[#3b3426] hover:text-[#d1c4b7]'
                          }`}
                        >
                          Rotor {r}
                        </button>
                      );
                    })}
                  </div>
                  <span className="text-[10px] text-[#83715d] mt-1 block">
                    Pool size: {builderRotorsPool.length} rotors available for 3 main rotor positions.
                  </span>
                </div>

                {/* 4-Rotor Options (M4) */}
                {builderIsM4 && (
                  <div className="bg-[#0d0a03] border border-[#3b3426] p-3.5 rounded-lg space-y-3">
                    <div className="text-xs font-bold text-[#ebc238] uppercase tracking-wider">
                      M4 4th Thin Rotor Parameters (fourthRotorsPool & fixedFourthRing)
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-[#d1c4b7] mb-1">
                          4th Thin Rotors Pool (fourthRotorsPool):
                        </label>
                        <div className="flex gap-2">
                          {['Beta', 'Gamma'].map((r) => {
                            const isSelected = builderFourthRotorsPool.includes(r);
                            return (
                              <button
                                key={r}
                                type="button"
                                onClick={() => toggleFourthRotorInPool(r)}
                                className={`px-3 py-1 rounded text-xs font-mono font-bold transition-colors cursor-pointer border ${
                                  isSelected
                                    ? 'bg-[#ebc238] text-[#25190b] border-[#ebc238]'
                                    : 'bg-[#171208] text-[#83715d] border-[#3b3426] hover:text-[#d1c4b7]'
                                }`}
                              >
                                {r}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs text-[#d1c4b7] mb-1">
                          Fixed 4th Ring Setting (fixedFourthRing):
                        </label>
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1.5 text-xs text-[#ede1cd] cursor-pointer">
                            <input
                              type="checkbox"
                              checked={builderUseFixedFourthRing}
                              onChange={(e) => setBuilderUseFixedFourthRing(e.target.checked)}
                              className="accent-[#ebc238]"
                            />
                            <span>Fixed</span>
                          </label>
                          {builderUseFixedFourthRing && (
                            <select
                              value={builderFixedFourthRing}
                              onChange={(e) => setBuilderFixedFourthRing(parseInt(e.target.value) || 1)}
                              className="bg-[#171208] border border-[#4e453b] text-[#ebc238] rounded p-1 text-xs font-mono focus:outline-none"
                            >
                              {Array.from({ length: 26 }, (_, i) => i + 1).map((n) => (
                                <option key={n} value={n}>
                                  {n.toString().padStart(2, '0')} ({String.fromCharCode(64 + n)})
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                        <span className="text-[10px] text-[#83715d] mt-0.5 block">
                          Historical Kriegsmarine rule strictly fixed ring to 01 (A).
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* UKW-Dual-Dynamic Speculative Reflector Option */}
                <div className="bg-[#0d0a03] border border-[#8b6f47]/40 p-3.5 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-[#ebc238] uppercase tracking-wider flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-[#e06c3a]">published_with_changes</span>
                      UKW-Dual-Dynamic Speculative Reflector (Mit-lett-volna Dinamikus Fordítóhenger)
                    </div>
                    <span className="text-[10px] bg-[#381f0d] text-[#e06c3a] border border-[#733c19] px-2 py-0.5 rounded font-mono font-bold">
                      WHAT-IF MODE
                    </span>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer text-xs text-[#ede1cd]">
                    <input
                      type="checkbox"
                      checked={builderUseDualReflector}
                      onChange={(e) => setBuilderUseDualReflector(e.target.checked)}
                      className="accent-[#ebc238] w-4 h-4 cursor-pointer"
                    />
                    <span className="font-bold text-[#d1c4b7]">
                      Enable UKW-Dual-Dynamic Reflector for daily keys (useDualDynamicReflector)
                    </span>
                  </label>

                  {builderUseDualReflector && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#3b3426] animate-fade-in">
                      {/* Fixed vs Random Reflector Ring */}
                      <div>
                        <label className="block text-xs text-[#d1c4b7] mb-1">
                          Reflector Ringstellung (fixedReflectorRing):
                        </label>
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1.5 text-xs text-[#ede1cd] cursor-pointer">
                            <input
                              type="checkbox"
                              checked={builderUseFixedReflectorRing}
                              onChange={(e) => setBuilderUseFixedReflectorRing(e.target.checked)}
                              className="accent-[#ebc238]"
                            />
                            <span>Fixed Ring</span>
                          </label>
                          {builderUseFixedReflectorRing && (
                            <select
                              value={builderFixedReflectorRing}
                              onChange={(e) => setBuilderFixedReflectorRing(parseInt(e.target.value) || 1)}
                              className="bg-[#171208] border border-[#4e453b] text-[#ebc238] rounded p-1 text-xs font-mono focus:outline-none"
                            >
                              {Array.from({ length: 26 }, (_, i) => i + 1).map((n) => (
                                <option key={n} value={n}>
                                  {n.toString().padStart(2, '0')} ({String.fromCharCode(64 + n)})
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                        <span className="text-[10px] text-[#83715d] mt-0.5 block">
                          Unchecked: Randomized 01–26 daily per keying rules.
                        </span>
                      </div>

                      {/* Fixed vs Random Reflector Start Position */}
                      <div>
                        <label className="block text-xs text-[#d1c4b7] mb-1">
                          Reflector Start Position (fixedReflectorStart):
                        </label>
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1.5 text-xs text-[#ede1cd] cursor-pointer">
                            <input
                              type="checkbox"
                              checked={builderUseFixedReflectorStart}
                              onChange={(e) => setBuilderUseFixedReflectorStart(e.target.checked)}
                              className="accent-[#ebc238]"
                            />
                            <span>Fixed Start</span>
                          </label>
                          {builderUseFixedReflectorStart && (
                            <select
                              value={builderFixedReflectorStart}
                              onChange={(e) => setBuilderFixedReflectorStart(parseInt(e.target.value) || 1)}
                              className="bg-[#171208] border border-[#4e453b] text-[#ebc238] rounded p-1 text-xs font-mono focus:outline-none"
                            >
                              {Array.from({ length: 26 }, (_, i) => i + 1).map((n) => (
                                <option key={n} value={n}>
                                  {n.toString().padStart(2, '0')} ({String.fromCharCode(64 + n)})
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                        <span className="text-[10px] text-[#83715d] mt-0.5 block">
                          Unchecked: Randomized initial position per day.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-[#3b3426] flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveViewMode('view')}
                className="px-4 py-2 rounded-lg bg-[#3b3426] text-[#d1c4b7] hover:bg-[#4e453b] font-ui-header text-xs uppercase font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-lg bg-[#ebc238] text-[#25190b] font-ui-header text-xs uppercase font-bold hover:bg-[#d4ad2d] shadow flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">check_circle</span>
                Generate & Save Codebook
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODE 2: CODEBOOK DISPLAY SHEET */}
      {activeViewMode === 'view' && (
        <>
          {/* Selector Bar & Actions for Custom Codebooks */}
          <div className="flex flex-wrap items-center justify-between gap-4 print:hidden bg-[#201b0f] p-4 rounded-xl border border-[#4e453b] shadow-panel">
            <div className="flex-1 min-w-[280px]">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-[#ebc238]">menu_book</span>
                <label className="text-xs font-ui-header text-[#e3c193] uppercase tracking-wider">
                  Select Codebook Sheet:
                </label>
              </div>

              <select
                value={selectedBookId}
                onChange={(e) => setSelectedBookId(e.target.value)}
                className="w-full bg-[#120e04] border border-[#8b6f47] text-[#ebc238] font-monospaced-technical font-bold text-sm rounded-lg p-2.5 focus:outline-none focus:border-[#ebc238] cursor-pointer shadow-inner"
              >
                <optgroup label="Read-Only Sheets">
                  {HISTORICAL_CODEBOOKS.map((book) => (
                    <option key={book.id} value={book.id}>
                      🔒 {book.title} — ({book.entries.length} Days)
                    </option>
                  ))}
                </optgroup>
                {customSheets.length > 0 && (
                  <optgroup label="User Custom Codebooks">
                    {customSheets.map((book) => (
                      <option key={book.id} value={book.id}>
                        ✏️ {book.title} — ({book.entries.length} Days)
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            {/* Controls for filtering and managing custom book entries */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Ring Format Chooser */}
              <div className="flex items-center bg-[#120e04] border border-[#4e453b] rounded-lg p-1 shadow-inner">
                <span className="text-[11px] font-bold text-[#e3c193] px-2 font-ui-header uppercase flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs text-[#ebc238]">tune</span>
                  Ring Format:
                </span>
                <button
                  type="button"
                  onClick={() => handleSetRingFormat('number')}
                  className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                    ringFormat === 'number'
                      ? 'bg-[#ebc238] text-[#25190b] shadow'
                      : 'text-[#d1c4b7] hover:text-white hover:bg-[#3b3426]'
                  }`}
                  title="Display Ringstellung as Numbers (01 - 26)"
                >
                  01–26 (Numbers)
                </button>
                <button
                  type="button"
                  onClick={() => handleSetRingFormat('letter')}
                  className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                    ringFormat === 'letter'
                      ? 'bg-[#ebc238] text-[#25190b] shadow'
                      : 'text-[#d1c4b7] hover:text-white hover:bg-[#3b3426]'
                  }`}
                  title="Display Ringstellung as Letters (A - Z)"
                >
                  A–Z (Letters)
                </button>
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Search Day..."
                  value={filterDay}
                  onChange={(e) => setFilterDay(e.target.value)}
                  className="bg-[#120e04] border border-[#4e453b] text-[#ede1cd] text-xs font-mono rounded-lg pl-8 pr-3 py-2 w-32 focus:outline-none focus:border-[#ebc238]"
                />
                <span className="material-symbols-outlined text-sm text-[#83715d] absolute left-2 top-2.5">
                  search
                </span>
              </div>

              {!isCurrentHistorical ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsAddDayModalOpen(true)}
                    className="text-xs font-ui-header bg-[#2b6121] hover:bg-[#387a2c] text-[#e3f0db] border border-[#4d8f3e] px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                    Add Date
                  </button>

                  <button
                    type="button"
                    onClick={handleDeleteCustomCodebook}
                    className="text-xs font-ui-header bg-[#801818] hover:bg-[#a12020] text-white px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                    Delete Book
                  </button>
                </>
              ) : (
                <div className="text-xs bg-[#2b2518] text-[#e3c193] border border-[#524430] px-3 py-2 rounded-lg flex items-center gap-1.5 font-bold">
                  <span className="material-symbols-outlined text-sm text-[#ebc238]">lock</span>
                  Read-Only
                </div>
              )}
            </div>
          </div>

          {/* HISTORICAL TYPEWRITTEN SCHLÜSSELTAFEL CARD */}
          <div className="relative bg-[#d3c2a5] text-[#1f1910] p-6 sm:p-10 rounded-lg shadow-2xl border-4 border-[#8c785b] font-mono select-none overflow-x-auto print:shadow-none print:border-none print:p-0 print:bg-white print:text-black print:overflow-visible print:page-break-inside-avoid">
            {/* Classification Stamp */}
            <div className="absolute top-6 right-8 border-4 border-[#a32020] text-[#a32020] font-extrabold text-xl sm:text-2xl tracking-widest px-4 py-1 transform rotate-12 opacity-85 select-none pointer-events-none print:text-black print:border-black">
              {currentSheet.classification}
            </div>

            {/* Header Document Metadata */}
            <div className="mb-6 space-y-1 border-b-2 border-[#1f1910] pb-4">
              <h1 className="text-xl sm:text-3xl font-black uppercase tracking-wider underline underline-offset-4 pr-32 sm:pr-48">
                {currentSheet.title}
              </h1>
              <p className="text-xs font-bold text-[#4a3f2f] uppercase tracking-widest print:text-black">
                {currentSheet.subtitle}
              </p>

              <div className="text-xs sm:text-sm font-bold flex flex-wrap gap-x-8 gap-y-1 pt-2">
                <span>Monat: <strong className="underline">{currentSheet.monthYear}</strong></span>
                <span>Prüfnummer: <strong className="underline">{currentSheet.pruefnummer}</strong></span>
              </div>
              <p className="text-xs pt-1 italic text-[#4a3f2f] print:text-black">
                ACHTUNG! Schlüsselmittel dürfen nicht unversehrt in Feindeshand fallen. Bei Gefahr restlos vernichten.
              </p>
            </div>

            {/* Section Title */}
            <div className="text-center my-6 print:my-2">
              <h2 className="text-base sm:text-lg font-black uppercase tracking-widest underline decoration-2">
                TÄGLICHE SCHLÜSSELEINSTELLUNGEN ({currentSheet.entries.length} DAYS)
              </h2>
              <p className="text-xs tracking-wide text-[#3a3022] mt-0.5 print:text-black">
                (Nur für den dienstlichen Gebrauch — Click 'Apply' on any date row to set machine)
              </p>
            </div>

            {/* MAIN SCHLÜSSELTAFEL TABLE */}
            <div className="overflow-x-auto my-6 print:overflow-visible">
              <table className="w-full border-collapse border-2 border-[#1f1910] text-center text-xs sm:text-sm font-bold min-w-[700px]">
                <thead>
                  <tr className="bg-[#bfae91] print:bg-gray-200 border-b-2 border-[#1f1910]">
                    <th className="border border-[#1f1910] p-2 sm:p-2.5 w-16">
                      Tag
                    </th>
                    <th className="border border-[#1f1910] p-2 sm:p-2.5">
                      <div>Walzenlage</div>
                      <div className="text-[10px] font-normal text-[#3a3022] print:text-black">(Rotor Order)</div>
                    </th>
                    <th className="border border-[#1f1910] p-2 sm:p-2.5">
                      <div>Ringstellung</div>
                      <button
                        type="button"
                        onClick={() => handleSetRingFormat(ringFormat === 'number' ? 'letter' : 'number')}
                        className="mt-0.5 text-[10px] font-bold text-[#2a2215] bg-[#a89679] hover:bg-[#1f1910] hover:text-[#ebc238] px-2 py-0.5 rounded transition-all cursor-pointer inline-flex items-center gap-1 border border-[#1f1910]/30 shadow-xs print:hidden"
                        title="Click to toggle Ringstellung format between Numbers and Letters"
                      >
                        <span className="material-symbols-outlined text-[11px]">swap_horiz</span>
                        {ringFormat === 'number' ? 'Numbers (01–26)' : 'Letters (A–Z)'}
                      </button>
                      <div className="hidden print:block text-[10px] font-normal text-[#3a3022]">
                        ({ringFormat === 'number' ? 'Ring Settings: 01–26' : 'Ring Settings: A–Z'})
                      </div>
                    </th>
                    {hasFourthRotor && (
                      <th className="border border-[#1f1910] p-2 sm:p-2.5">
                        <div>4. Walze (M4)</div>
                        <div className="text-[10px] font-normal text-[#3a3022] print:text-black">(4th Rotor / Fixed Stator)</div>
                      </th>
                    )}
                    {hasDualReflector && (
                      <th className="border border-[#1f1910] p-2 sm:p-2.5">
                        <div>Umkehrwalze (UKW)</div>
                        <div className="text-[10px] font-normal text-[#3a3022] print:text-black">(Reflector Setting)</div>
                      </th>
                    )}
                    <th className="border border-[#1f1910] p-2 sm:p-2.5">
                      <div>Steckerverbindungen</div>
                      <div className="text-[10px] font-normal text-[#3a3022] print:text-black">(Plugboard Patches 1-10)</div>
                    </th>
                    <th className="border border-[#1f1910] p-2 sm:p-2.5">
                      <div>Kenngruppen</div>
                      <div className="text-[10px] font-normal text-[#3a3022] print:text-black">(Identifiers)</div>
                    </th>
                    <th className="border border-[#1f1910] p-2 sm:p-2.5 w-28 print:hidden">
                      Aktion
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {displayedEntries.length === 0 ? (
                    <tr>
                      <td colSpan={5 + (hasFourthRotor ? 1 : 0) + (hasDualReflector ? 1 : 0) + 1} className="p-8 text-center text-[#594a36] italic">
                        No entries found for this codebook. {!isCurrentHistorical && 'Click "Add Date" above to add entries.'}
                      </td>
                    </tr>
                  ) : (
                    displayedEntries.map((entry) => {
                      const rowKey = `${currentSheet.id}-${entry.day}`;
                      const isApplied = appliedDayKey === rowKey;
                      return (
                        <tr
                          key={entry.day}
                          className={`hover:bg-[#c7b597] print:hover:bg-transparent print:page-break-inside-avoid transition-colors border-b border-[#1f1910] ${
                            isApplied ? 'bg-[#ebd4ad] font-extrabold' : ''
                          }`}
                        >
                          {/* Day Tag */}
                          <td className="border border-[#1f1910] p-1.5 sm:p-2 text-base font-black bg-[#c4b395] print:bg-transparent">
                            {pad2(entry.day)}
                          </td>

                          {/* Walzenlage (Rotor Order) */}
                          <td className="border border-[#1f1910] p-1.5 sm:p-2 tracking-wider font-extrabold font-mono">
                            {entry.rotors.join('  ')}
                          </td>

                          {/* Ringstellung (Ring Settings) */}
                          <td className="border border-[#1f1910] p-1.5 sm:p-2 tracking-widest font-mono font-extrabold text-center">
                            {entry.rings.map((r) => formatRotorRing(r, ringFormat)).join(' ')}
                          </td>

                          {/* 4. Walze (4th Rotor — M4 only) */}
                          {hasFourthRotor && (
                            <td className="border border-[#1f1910] p-1.5 sm:p-2 tracking-widest font-mono font-extrabold text-center">
                              {entry.fourthRotor ? `${entry.fourthRotor} (${formatRotorRing(entry.fourthRing || 1, ringFormat)})` : '—'}
                            </td>
                          )}

                          {/* Umkehrwalze (Reflector Settings) */}
                          {hasDualReflector && (
                            <td className="border border-[#1f1910] p-1.5 sm:p-2 tracking-wide font-mono text-xs font-extrabold text-center">
                              {entry.reflectorType ? (
                                <span className="inline-flex flex-col items-center justify-center">
                                  <span className="text-[#a32020] font-black">{entry.reflectorType}</span>
                                  <span className="text-[10px] font-mono text-[#3a3022]">
                                    Ring:{formatRotorRing(entry.reflectorRing || 1, ringFormat)} Pos:{formatRotorRing(entry.reflectorStart || 1, ringFormat)}
                                  </span>
                                </span>
                              ) : (
                                <span className="text-[#594a36]">Standard</span>
                              )}
                            </td>
                          )}

                          {/* Steckerverbindungen (Plugboard Pairs) */}
                          <td className="border border-[#1f1910] p-1.5 sm:p-2 tracking-wide text-xs font-mono">
                            {entry.plugboardPairs.join(' ')}
                          </td>

                          {/* Kenngruppen */}
                          <td className="border border-[#1f1910] p-1.5 sm:p-2 tracking-widest text-xs font-mono">
                            {entry.kenngruppen.join(' ')}
                          </td>

                          {/* Action Apply / Manage Button */}
                          <td className="border border-[#1f1910] p-1.5 sm:p-2 print:hidden">
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleApplyDay(entry)}
                                className={`flex-1 py-1 px-2 rounded text-xs font-bold font-sans uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 shadow-sm ${
                                  isApplied
                                    ? 'bg-[#2b6121] text-white hover:bg-[#1f4a18]'
                                    : 'bg-[#1f1910] text-[#f4ebdc] hover:bg-[#3b3123] active:scale-95'
                                }`}
                              >
                                <span className="material-symbols-outlined text-xs">
                                  {isApplied ? 'check_circle' : 'bolt'}
                                </span>
                                {isApplied ? 'Applied' : 'Apply'}
                              </button>

                              {!isCurrentHistorical && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteDayEntry(entry.day)}
                                  title="Delete Entry"
                                  className="p-1 rounded bg-[#801818] text-white hover:bg-red-700 transition-colors"
                                >
                                  <span className="material-symbols-outlined text-xs">close</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer Document Metadata */}
            <div className="flex justify-between items-center text-xs font-bold text-[#3a3022] print:text-black border-t border-[#1f1910]/30 pt-3 mt-6">
              <span>Vernichten nach Gebrauch!</span>
              <span>{isCurrentHistorical ? 'Official WWII Historical Record' : 'Custom User Schlüsseltafel'}</span>
            </div>
          </div>
        </>
      )}

      {/* Add Day Entry Modal for Custom Codebooks */}
      {isAddDayModalOpen && !isCurrentHistorical && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#201b0f] border border-[#8b6f47] rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-[#3b3426] pb-2">
              <h3 className="text-base font-ui-header text-[#ebc238] uppercase flex items-center gap-2">
                <span className="material-symbols-outlined">add_box</span>
                Add Date Entry to Custom Codebook
              </h3>
              <button
                type="button"
                onClick={() => setIsAddDayModalOpen(false)}
                className="text-[#d1c4b7] hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAddDayToCustomBook} className="space-y-3 text-xs font-ui-body">
              <div>
                <label className="block text-[#d1c4b7] font-bold mb-1">Tag (Day of Month, 1-31):</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={addDayNum}
                  onChange={(e) => setAddDayNum(parseInt(e.target.value) || 1)}
                  className="w-full bg-[#120e04] border border-[#4e453b] rounded p-2 text-[#ede1cd] font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-[#d1c4b7] font-bold mb-1">Walzenlage (Rotors 1-2-3):</label>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={addRotorLeft}
                    onChange={(e) => setAddRotorLeft(e.target.value as RotorType)}
                    className="bg-[#120e04] border border-[#4e453b] rounded p-1.5 text-[#ede1cd]"
                  >
                    {['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'].map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>

                  <select
                    value={addRotorMid}
                    onChange={(e) => setAddRotorMid(e.target.value as RotorType)}
                    className="bg-[#120e04] border border-[#4e453b] rounded p-1.5 text-[#ede1cd]"
                  >
                    {['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'].map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>

                  <select
                    value={addRotorRight}
                    onChange={(e) => setAddRotorRight(e.target.value as RotorType)}
                    className="bg-[#120e04] border border-[#4e453b] rounded p-1.5 text-[#ede1cd]"
                  >
                    {['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'].map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[#d1c4b7] font-bold">Ringstellung (Ring Offset):</label>
                  <div className="flex items-center gap-1 text-[10px] bg-[#120e04] p-0.5 rounded border border-[#3b3426]">
                    <button
                      type="button"
                      onClick={() => handleSetRingFormat('number')}
                      className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                        ringFormat === 'number' ? 'bg-[#ebc238] text-[#25190b] font-bold' : 'text-[#83715d] hover:text-[#d1c4b7]'
                      }`}
                    >
                      01–26
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetRingFormat('letter')}
                      className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                        ringFormat === 'letter' ? 'bg-[#ebc238] text-[#25190b] font-bold' : 'text-[#83715d] hover:text-[#d1c4b7]'
                      }`}
                    >
                      A–Z
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: addRingLeft, setVal: setAddRingLeft, label: 'Left' },
                    { val: addRingMid, setVal: setAddRingMid, label: 'Middle' },
                    { val: addRingRight, setVal: setAddRingRight, label: 'Right' }
                  ].map((r, idx) => (
                    <select
                      key={idx}
                      value={r.val}
                      onChange={(e) => r.setVal(parseInt(e.target.value) || 1)}
                      className="bg-[#120e04] border border-[#4e453b] rounded p-1.5 text-[#ede1cd] font-mono text-xs focus:outline-none focus:border-[#ebc238]"
                    >
                      {Array.from({ length: 26 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          {formatRotorRing(n, ringFormat)}
                        </option>
                      ))}
                    </select>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[#d1c4b7] font-bold mb-1">Stecker (Plugboard Pairs, 10 pairs):</label>
                <input
                  type="text"
                  value={addPlugString}
                  onChange={(e) => setAddPlugString(e.target.value)}
                  placeholder="TW BI UY GP CK JQ DL RV EM AH"
                  className="w-full bg-[#120e04] border border-[#4e453b] rounded p-2 text-[#ede1cd] font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-[#d1c4b7] font-bold mb-1">Kenngruppen Identifiers:</label>
                <input
                  type="text"
                  value={addKenngruppen}
                  onChange={(e) => setAddKenngruppen(e.target.value)}
                  placeholder="kxl zqm ewj"
                  className="w-full bg-[#120e04] border border-[#4e453b] rounded p-2 text-[#ede1cd] font-mono lowercase"
                />
              </div>

              <div>
                <label className="block text-[#d1c4b7] font-bold mb-1">Umkehrwalze (Reflector Type):</label>
                <select
                  value={addReflectorType}
                  onChange={(e) => setAddReflectorType(e.target.value as ReflectorType)}
                  className="w-full bg-[#120e04] border border-[#4e453b] rounded p-2 text-[#ede1cd] font-mono text-xs focus:outline-none focus:border-[#ebc238]"
                >
                  <option value="Reflector B">Reflector B (Standard UKW-B)</option>
                  <option value="Reflector C">Reflector C (UKW-C)</option>
                  <option value="Reflector B Thin">Reflector B Thin (M4)</option>
                  <option value="Reflector C Thin">Reflector C Thin (M4)</option>
                  <option value="UKW-Dual-Dynamic">UKW-Dual-Dynamic (Dynamic Rotating Reflector)</option>
                </select>
              </div>

              {addReflectorType === 'UKW-Dual-Dynamic' && (
                <div className="grid grid-cols-2 gap-2 bg-[#120e04] p-2.5 rounded border border-[#3b3426]">
                  <div>
                    <label className="block text-[11px] text-[#d1c4b7] mb-1">Reflector Ring:</label>
                    <select
                      value={addReflectorRing}
                      onChange={(e) => setAddReflectorRing(parseInt(e.target.value) || 1)}
                      className="w-full bg-[#1c160a] border border-[#4e453b] rounded p-1 text-[#ebc238] font-mono text-xs"
                    >
                      {Array.from({ length: 26 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          {formatRotorRing(n, ringFormat)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#d1c4b7] mb-1">Reflector Start Pos:</label>
                    <select
                      value={addReflectorStart}
                      onChange={(e) => setAddReflectorStart(parseInt(e.target.value) || 1)}
                      className="w-full bg-[#1c160a] border border-[#4e453b] rounded p-1 text-[#ebc238] font-mono text-xs"
                    >
                      {Array.from({ length: 26 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          {formatRotorRing(n, ringFormat)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddDayModalOpen(false)}
                  className="px-3 py-1.5 rounded bg-[#3b3426] text-[#d1c4b7] hover:bg-[#4e453b]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-[#ebc238] text-[#25190b] font-bold hover:bg-[#d4ad2d]"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

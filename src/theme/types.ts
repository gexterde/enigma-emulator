export type ThemeName = string;

export interface CustomTheme {
  id: string; // e.g. 'custom-warm-sunset'
  name: string;
  enabled?: boolean;
  colors: {
    bgApp: string;
    bgPanel: string;
    bgPanelInner: string;
    textPrimary: string;
    textSecondary: string;
    textAccent: string;
    lampLitBg: string;
    borderBase: string;
    radioChassisBg: string;
    paperTapeBg?: string;
    paperTapeText?: string;
    rotorWindowBg?: string;
    rotorLabelColor?: string;
    keyBaseBg?: string;
    keyPressedBg?: string;
    radioNeedleBg?: string;
    plugboardCableColor?: string;
    plugboardCableColorEnd?: string;
    plugboardCableMode?: 'multicolor' | 'single' | 'gradient' | 'custom';
    plugboardCableCustomColors?: string[];
  };
  isDraft?: boolean;
}

export interface ThemeOption {
  id: ThemeName;
  name: string;
  isCustom?: boolean;
}

export const AVAILABLE_THEMES: ThemeOption[] = [
  { id: 'vintage', name: 'Vintage Wood' },
  { id: 'bakelite-brass', name: 'Bakelite & Brass' },
  { id: 'bletchley-park', name: 'Bletchley Park' },
  { id: 'cipher-noir', name: 'Cipher Noir' },
  { id: 'vintage-navy', name: 'Vintage Navy' },
  { id: 'modern', name: 'Modern' },
  { id: 'modern-dark', name: 'Modern Dark' },
  { id: 'amber-crt', name: 'Amber CRT' },
  { id: 'emerald-crt', name: 'Emerald CRT' },
];

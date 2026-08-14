export type ThemeName = 
  | 'vintage' 
  | 'bakelite-brass'
  | 'bletchley-park'
  | 'cipher-noir'
  | 'vintage-navy' 
  | 'modern' 
  | 'modern-dark' 
  | 'amber-crt' 
  | 'emerald-crt';

export interface ThemeOption {
  id: ThemeName;
  name: string;
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

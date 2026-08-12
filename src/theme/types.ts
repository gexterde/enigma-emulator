export type ThemeName = 'vintage' | 'vintage-navy' | 'modern' | 'modern-dark' | 'amber-crt' | 'emerald-crt';

export interface ThemeOption {
  id: ThemeName;
  name: string;
}

export const AVAILABLE_THEMES: ThemeOption[] = [
  { id: 'vintage', name: 'Vintage Wood' },
  { id: 'vintage-navy', name: 'Vintage Navy' },
  { id: 'modern', name: 'Modern' },
  { id: 'modern-dark', name: 'Modern Dark' },
  { id: 'amber-crt', name: 'Amber CRT' },
  { id: 'emerald-crt', name: 'Emerald CRT' },
];

/**
 * The Product interface declares the operations that all concrete products must
 * implement.
 */
export interface ThemeProduct {
  // Layout
  appBg: string;
  appTexture: string;
  sidebarBg: string;
  headerBg: string;
  panelBg: string;
  panelInner: string;
  modalBg: string;
  modalTexture: string;
  modalHeaderBg: string;
  modalFooterBg: string;
  wellBg: string;
  wellInnerBg: string;
  
  // Text
  textPrimary: string;
  textSecondary: string;
  textAccent: string;
  textMuted: string;
  
  // Borders
  borderBase: string;
  borderAccent: string;
  
  // Badges & States
  activeBadge: string;
  inactiveBadge: string;
  successBadge: string;
  dangerBadge: string;
  accentLightBg: string;
  accentSolidBg: string;
  mutedBg: string;
  indicatorBg: string;
  successLightBg: string;
  dangerLightBg: string;
  successText: string;
  dangerText: string;
  sliderAccent: string;
  progressFill: string;
  
  // Controls
  buttonPrimary: string;
  buttonHighlight: string;
  buttonDanger: string;
  buttonDangerSolid: string;
  dangerBg: string;
  controlButton: string;
  controlButtonActive: string;
  secondaryButtonHover: string;
  
  // Inputs
  inputBg: string;
  
  // Keys
  keyShape: string;
  keyBase: string;
  keyPressed: string;
  keyCompactBase: string;
  keyCompactPressed: string;

  // Lamps & Signals
  lampShape: string;
  lampBase: string;
  lampLit: string;
  lampDim: string;
  lampLitGlow: string;
  signalPulse: string;
  signalGradient: string;
  activeKeyBg: string;
  activeKeyText: string;
  
  // Specific Panel BGs
  keyboardPanelBg: string;
  lampboardPanelBg: string;
  compactPlateBg: string;
  paperTapeBg: string;
  paperTapeText: string;
  paperTapeBorder: string;
  paperTapeBorderActive: string;
  selectBg: string;
  fontHeader: string;
  fontBody: string;
  fontMono: string;
  fontRotor: string;
  
  // Custom states
  statusHighlight: string;
  buttonSuccess: string;
  buttonMuted: string;
  chartBarPlaintext: string;
  chartBarCiphertext: string;
  chartBarBaseline: string;
  paperTapeCopyButton: string;
  rotorWindowBg: string;
  rotorWindowBorder: string;
  rotorWindowShadow: string;
  rotorWindowControl: string;
  lampLitDkl: string;
  lampLitSammler: string;
  lampDimDkl: string;
  lampDimSammler: string;
  lampInnerLitDkl: string;
  lampInnerLitSammler: string;
  lampInnerLitHell: string;
  lampSocketBg: string;
  lampSocketBorder: string;
  lampSocketInnerBg: string;
  lampSocketInnerText: string;
  lampSocketInnerShadow: string;
  litLampBadgeDkl: string;
  litLampBadgeSammler: string;
  litLampBadgeHell: string;
  textureMetal: string;
  batteryPanelStop0: string;
  batteryPanelStop100: string;
  batteryBrassStop0: string;
  batteryBrassStop40: string;
  batteryBrassStop80: string;
  batteryBrassStop100: string;
  batteryBakeliteStop0: string;
  batteryBakeliteStop40: string;
  batteryBakeliteStop85: string;
  batteryBakeliteStop100: string;
  batteryPlateShadowOpacity: string;
  batteryRectStroke: string;
  batteryAxleFill: string;
  batteryAxleStroke: string;
  batteryArcStroke: string;
  batteryKnobBaseFill: string;
  batteryKnobBaseStroke: string;
  batteryKnobHandleStroke: string;
  batteryKnobRidgeFill: string;
  batteryKnobRidgeStroke: string;
  batteryHubStroke: string;
  batteryHubCenterFill: string;
  batteryArrowStroke: string;
  mixBlendMode: string;
  rotorDecoration: string;
  rotorDecorationHover: string;
  applyButton: string;
  buttonDangerHighlight: string;
  textDanger: string;
  borderDanger: string;
  dangerPanelBg: string;
  buttonMutedHover: string;
  rotorIconWrapper: string;
  textMutedAlt: string;
  bgSuccess: string;
  borderSuccess: string;
  textSuccess: string;
  bgSuccessStrong: string;
  textSuccessStrong: string;
  bgSuccessDark: string;
  borderSuccessAlt: string;
  textSuccessAlt: string;
  bgDangerAlt: string;
  borderDangerAlt: string;
  textDangerAlt: string;
  textDangerStrong: string;
  textDangerHeader: string;
  buttonActive: string;
  buttonInactive: string;
  rotorSettingPanelDecoration: string;
  rotorSettingSelect: string;
  rotorWindowControlAlt: string;
  rotorWindowControlMuted: string;
  rotorWindowControlAction: string;
  textMutedStrong: string;
  borderStrong: string;
  tableHeaderMuted: string;
  tableRowHover: string;
  tableRowActive: string;
  tableCellAccent: string;
  textDangerStrongAlt: string;
  buttonSuccessSolid: string;
  buttonMutedSolid: string;
  tabActive: string;
  tabInactive: string;
  inputBgAlt: string;
  cardInteractive: string;
  bgSuccessFaint: string;
  textSuccessFaint: string;
  buttonDisabled: string;
  rotorWindowContainer: string;
  tableDayTag: string;
  tabSwitchButton: string;
  codebookHeaderButton: string;
  indicatorBgAlt: string;
  codebookSheetBg: string;
  codebookStamp: string;
  tableHeaderBg: string;
  kenngruppenTag: string;
  textAccentExtra: string;
  textAccentStrong: string;
  bgAccentFaint: string;
  bgAccentSolid: string;
  bgAccentHover: string;
  circleIndicator: string;
  headerPreviewBadge: string;
}

/**
 * The Creator class declares the factory method that is supposed to return an
 * object of a Product class.
 */
export abstract class ThemeFactory {
  public abstract createTheme(): ThemeProduct;
}

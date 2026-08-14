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

  // Radio Transceiver Color & Design Properties
  radioChassisBg: string;
  radioRivets: string;
  radioHeaderBorder: string;
  radioPowerSwitchBg: string;
  radioPowerOffText: string;
  radioPowerOnText: string;
  radioPowerKnobBg: string;
  radioGlassDialBgOn: string;
  radioGlassDialBgOff: string;
  radioGlassDialBorder: string;
  radioDialText: string;
  radioDialTick: string;
  radioNeedle: string;
  radioNeedleGlow: string;
  radioSMeterBg: string;
  radioSMeterText: string;
  radioSMeterNeedle: string;
  radioDisplayBoxBg: string;
  radioDisplayReadoutOn: string;
  radioDisplayReadoutOff: string;
  radioDisplayTextAccent: string;
  radioDisplayInputBg: string;
  radioStationBadge: string;
  radioRotaryModuleBg: string;
  radioRotaryModuleBorder: string;
  radioRotaryKnobBg: string;
  radioRotaryKnobBorder: string;
  radioRotaryKnobNotch: string;
  radioRotaryCap: string;
  radioSpeedBtnActive: string;
  radioSpeedBtnInactive: string;
  radioPresetBtnActive: string;
  radioPresetBtnInactive: string;
  radioScopeBg: string;
  radioScopeGrid: string;
  radioScopeWaveActive: string;
  radioScopeWaveIdle: string;
}

/**
 * The Creator class declares the factory method that is supposed to return an
 * object of a Product class.
 */
export abstract class ThemeFactory {
  public abstract createTheme(): ThemeProduct;
}

export const CSS_VARIABLES_THEME: ThemeProduct = {
  // Layout
  appBg: 'bg-[var(--bg-app)] text-[var(--text-primary)] selection:bg-[var(--text-accent)]/30',
  appTexture: 'texture-wood',
  sidebarBg: 'bg-[var(--bg-sidebar)] border-[var(--border-base)]',
  headerBg: 'bg-[var(--bg-header)] border-[var(--border-base)]',
  panelBg: 'bg-[var(--bg-panel)] border-[var(--border-base)]',
  panelInner: 'bg-[var(--bg-panel-inner)] border-[var(--border-base)]',
  modalBg: 'bg-[var(--bg-modal)] border-[var(--border-modal)] text-[var(--text-primary)] texture-metal',
  modalTexture: 'texture-metal',
  modalHeaderBg: 'bg-[var(--bg-modal-header)] border-[var(--border-modal)]',
  modalFooterBg: 'bg-[var(--bg-modal-footer)] border-[var(--border-base)]',
  wellBg: 'bg-[var(--bg-well)]',
  wellInnerBg: 'bg-[var(--bg-well-inner)]',
  
  // Text
  textPrimary: 'text-[var(--text-primary)]',
  textSecondary: 'text-[var(--text-secondary)]',
  textAccent: 'text-[var(--text-accent)]',
  textMuted: 'text-[var(--text-muted)]',
  
  // Borders
  borderBase: 'border-[var(--border-base)]',
  borderAccent: 'border-[var(--border-accent)]',
  
  // Badges & States
  activeBadge: 'bg-[var(--badge-active-bg)] text-[var(--badge-active-text)]',
  inactiveBadge: 'bg-[var(--badge-inactive-bg)] text-[var(--badge-inactive-text)] hover:bg-[var(--muted-bg)]',
  successBadge: 'bg-[var(--badge-success-bg)] border-[var(--badge-success-border)] text-[var(--badge-success-text)]',
  dangerBadge: 'bg-[var(--badge-danger-bg)] text-[var(--badge-danger-text)] border-[var(--badge-danger-border)]',
  accentLightBg: 'bg-[var(--accent-light-bg)]',
  accentSolidBg: 'bg-[var(--accent-solid-bg)]',
  mutedBg: 'bg-[var(--muted-bg)]',
  indicatorBg: 'bg-[var(--indicator-bg)]',
  successLightBg: 'bg-[var(--success-light-bg)]',
  dangerLightBg: 'bg-[var(--danger-light-bg)]',
  successText: 'text-[var(--success-text)]',
  dangerText: 'text-[var(--danger-text)]',
  sliderAccent: 'accent-[var(--slider-accent)]',
  progressFill: 'bg-[var(--progress-fill)]',
  
  // Controls
  buttonPrimary: 'bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] text-[var(--btn-primary-text)] border-[var(--btn-primary-border)]',
  buttonHighlight: 'bg-[var(--btn-highlight-bg)] hover:bg-[var(--btn-highlight-hover)] text-[var(--btn-highlight-text)]',
  buttonDanger: 'bg-[var(--btn-danger-bg)] hover:bg-[var(--btn-danger-hover)] text-[var(--btn-danger-text)] border-[var(--btn-danger-border)]',
  buttonDangerSolid: 'bg-[var(--btn-danger-solid-bg)] text-[var(--btn-danger-solid-text)] hover:bg-[var(--btn-danger-solid-hover)]',
  dangerBg: 'bg-[var(--btn-danger-bg)] border-[var(--btn-danger-border)] text-[var(--btn-danger-text)]',
  controlButton: 'bg-[var(--control-btn-bg)] hover:bg-[var(--control-btn-hover)] text-[var(--control-btn-text)]',
  controlButtonActive: 'bg-[var(--control-btn-active-bg)] text-[var(--control-btn-active-text)] border-[var(--control-btn-active-bg)]',
  secondaryButtonHover: 'hover:bg-[var(--accent-light-bg)]',
  
  // Inputs
  inputBg: 'bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--input-text)]',
  
  // Keys
  keyShape: 'rounded-full',
  keyBase: 'border-[var(--key-base-border)] bg-[var(--key-base-bg)] shadow-key-base hover:border-[var(--key-base-hover-border)] hover:bg-[var(--key-base-hover-bg)]',
  keyPressed: 'bg-[var(--key-pressed-bg)] text-[var(--key-pressed-text)] border-[var(--key-pressed-border)] ring-4 ring-[var(--accent-solid-bg)]/40 shadow-[0_0_15px_var(--accent-solid-bg)]',
  keyCompactBase: 'bakelite-key text-[var(--key-base-text)]',
  keyCompactPressed: 'key-pressed ring-2 ring-[var(--accent-solid-bg)]/60 text-[var(--text-accent)]',

  // Lamps & Signals
  lampShape: 'rounded-full',
  lampBase: 'bg-[var(--lamp-base-bg)] border-[var(--lamp-base-border)] text-[var(--lamp-base-text)] shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]',
  lampLit: 'bg-[var(--lamp-lit-bg)] border-[var(--lamp-lit-border)] text-[var(--lamp-lit-text)] shadow-lamp-glow font-bold scale-105',
  lampDim: 'lamp-dim-glow border-[var(--border-accent)]/50',
  lampLitGlow: 'bg-[var(--lamp-lit-bg)] text-[var(--lamp-lit-text)] shadow-[0_0_12px_var(--lamp-lit-glow)]',
  signalPulse: 'bg-[var(--lamp-lit-bg)] text-[var(--lamp-lit-text)] shadow-[0_0_12px_var(--lamp-lit-glow)]',
  signalGradient: 'linear-gradient(to right, var(--border-accent), var(--text-accent), var(--lamp-lit-border))',
  activeKeyBg: 'bg-[var(--key-pressed-bg)]',
  activeKeyText: 'text-[var(--key-pressed-text)]',
  
  // Specific Panel BGs
  keyboardPanelBg: 'bg-[var(--keyboard-panel-bg)] border-[var(--keyboard-panel-border)] shadow-panel',
  lampboardPanelBg: 'bg-[var(--lampboard-panel-bg)] border-[var(--lampboard-panel-border)] shadow-panel',
  compactPlateBg: 'metal-plate shadow-md',
  paperTapeBg: 'paper-tape',
  paperTapeText: 'text-[var(--paper-tape-text)]',
  paperTapeBorder: 'border-[var(--paper-tape-border)]',
  paperTapeBorderActive: 'border-[var(--text-accent)]',
  selectBg: 'bg-[var(--bg-panel-inner)] text-[var(--text-primary)] border-[var(--border-base)]',
  fontHeader: 'font-serif',
  fontBody: 'font-mono',
  fontMono: 'font-mono',
  fontRotor: 'font-mono font-bold',
  
  // Custom states
  statusHighlight: 'text-[var(--text-accent)]',
  buttonSuccess: 'bg-[var(--badge-success-bg)] hover:bg-[var(--badge-success-bg)] text-[var(--badge-success-text)] border-[var(--badge-success-border)]',
  buttonMuted: 'bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] text-[var(--text-secondary)] border-[var(--border-base)]',
  chartBarPlaintext: 'var(--chart-bar-plain)',
  chartBarCiphertext: 'var(--chart-bar-cipher)',
  chartBarBaseline: 'var(--border-base)',
  paperTapeCopyButton: 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-light-bg)]',
  rotorWindowBg: 'bg-[var(--rotor-window-bg)]',
  rotorWindowBorder: 'border-[var(--rotor-window-border)]',
  rotorWindowShadow: 'shadow-rotor-window',
  rotorWindowControl: 'bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] text-[var(--text-primary)] border-[var(--border-base)]',
  lampLitDkl: 'bg-[var(--lamp-lit-dkl-bg)] border-[var(--border-accent)] text-[var(--lamp-lit-dkl-text)] shadow-lamp-glow font-bold scale-105',
  lampLitSammler: 'bg-[var(--lamp-lit-sammler-bg)] border-white text-[var(--lamp-lit-sammler-text)] shadow-lamp-glow font-bold scale-105',
  lampDimDkl: 'lamp-dim-glow-dkl border-[var(--border-base)]',
  lampDimSammler: 'lamp-dim-glow-sammler border-[var(--border-accent)]',
  lampInnerLitDkl: 'lamp-on-dkl',
  lampInnerLitSammler: 'lamp-on-sammler',
  lampInnerLitHell: 'lamp-on-hell',
  lampSocketBg: 'lamp-socket',
  lampSocketBorder: 'border-[var(--border-base)]',
  lampSocketInnerBg: 'bg-[var(--lamp-base-bg)]',
  lampSocketInnerText: 'text-[var(--lamp-base-text)]',
  lampSocketInnerShadow: 'shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]',
  litLampBadgeDkl: 'bg-[var(--lamp-lit-dkl-bg)] text-[var(--lamp-lit-dkl-text)] border-[var(--border-accent)]',
  litLampBadgeSammler: 'bg-[var(--lamp-lit-sammler-bg)] text-[var(--lamp-lit-sammler-text)] border-white',
  litLampBadgeHell: 'bg-[var(--lamp-lit-bg)] text-[var(--lamp-lit-text)] border-[var(--lamp-lit-border)]',
  textureMetal: 'texture-metal',
  batteryPanelStop0: 'var(--battery-panel-stop-0)',
  batteryPanelStop100: 'var(--battery-panel-stop-100)',
  batteryBrassStop0: 'var(--battery-brass-stop-0)',
  batteryBrassStop40: 'var(--battery-brass-stop-40)',
  batteryBrassStop80: 'var(--battery-brass-stop-80)',
  batteryBrassStop100: 'var(--battery-brass-stop-100)',
  batteryBakeliteStop0: 'var(--battery-bakelite-stop-0)',
  batteryBakeliteStop40: 'var(--battery-bakelite-stop-40)',
  batteryBakeliteStop85: 'var(--battery-bakelite-stop-85)',
  batteryBakeliteStop100: 'var(--battery-bakelite-stop-100)',
  batteryPlateShadowOpacity: 'var(--battery-plate-shadow-opacity)',
  batteryRectStroke: 'var(--battery-rect-stroke)',
  batteryAxleFill: 'var(--battery-axle-fill)',
  batteryAxleStroke: 'var(--battery-axle-stroke)',
  batteryArcStroke: 'var(--battery-arc-stroke)',
  batteryKnobBaseFill: 'var(--battery-knob-base-fill)',
  batteryKnobBaseStroke: 'var(--battery-knob-base-stroke)',
  batteryKnobHandleStroke: 'var(--battery-knob-handle-stroke)',
  batteryKnobRidgeFill: 'var(--battery-knob-ridge-fill)',
  batteryKnobRidgeStroke: 'var(--battery-knob-ridge-stroke)',
  batteryHubStroke: 'var(--battery-hub-stroke)',
  batteryHubCenterFill: 'var(--battery-hub-center-fill)',
  batteryArrowStroke: 'var(--battery-arrow-stroke)',
  mixBlendMode: 'var(--mix-blend-mode)',
  rotorDecoration: 'bg-[var(--border-base)]',
  rotorDecorationHover: 'hover:bg-[var(--border-accent)]',
  applyButton: 'bg-[var(--badge-success-bg)] text-[var(--badge-success-text)] border-[var(--badge-success-border)] hover:opacity-90',
  buttonDangerHighlight: 'bg-[var(--btn-danger-solid-bg)] text-[var(--btn-danger-solid-text)] hover:bg-[var(--btn-danger-solid-hover)]',
  textDanger: 'text-[var(--danger-text)]',
  borderDanger: 'border-[var(--badge-danger-border)]',
  dangerPanelBg: 'bg-[var(--danger-light-bg)] border-[var(--badge-danger-border)] text-[var(--danger-text)]',
  buttonMutedHover: 'hover:bg-[var(--btn-primary-hover)] hover:text-[var(--text-primary)]',
  rotorIconWrapper: 'bg-[var(--bg-panel-inner)] border-[var(--border-base)] text-[var(--text-accent)]',
  textMutedAlt: 'text-[var(--text-secondary)]',
  bgSuccess: 'bg-[var(--badge-success-bg)]',
  borderSuccess: 'border-[var(--badge-success-border)]',
  textSuccess: 'text-[var(--success-text)]',
  bgSuccessStrong: 'bg-[var(--badge-success-bg)] text-[var(--badge-success-text)] border-[var(--badge-success-border)]',
  textSuccessStrong: 'text-[var(--badge-success-text)]',
  bgSuccessDark: 'bg-[var(--success-light-bg)]',
  borderSuccessAlt: 'border-[var(--badge-success-border)]',
  textSuccessAlt: 'text-[var(--badge-success-text)]',
  bgDangerAlt: 'bg-[var(--danger-light-bg)]',
  borderDangerAlt: 'border-[var(--badge-danger-border)]',
  textDangerAlt: 'text-[var(--danger-text)]',
  textDangerStrong: 'text-[var(--btn-danger-solid-text)]',
  textDangerHeader: 'text-[var(--danger-text)]',
  buttonActive: 'bg-[var(--btn-highlight-bg)] text-[var(--btn-highlight-text)] border-[var(--btn-highlight-bg)]',
  buttonInactive: 'bg-[var(--btn-primary-bg)] text-[var(--text-primary)] border-[var(--border-base)] hover:bg-[var(--btn-primary-hover)]',
  rotorSettingPanelDecoration: 'bg-[var(--border-base)]',
  rotorSettingSelect: 'bg-[var(--bg-panel-inner)] text-[var(--text-primary)] border-[var(--border-base)]',
  rotorWindowControlAlt: 'bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-[var(--border-base)]',
  rotorWindowControlMuted: 'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
  rotorWindowControlAction: 'text-[var(--text-secondary)] hover:text-[var(--text-accent)]',
  textMutedStrong: 'text-[var(--text-secondary)]',
  borderStrong: 'border-[var(--border-accent)]',
  tableHeaderMuted: 'text-[var(--text-secondary)]',
  tableRowHover: 'hover:bg-[var(--muted-bg)]',
  tableRowActive: 'bg-[var(--accent-light-bg)]',
  tableCellAccent: 'text-[var(--text-accent)] font-semibold',
  textDangerStrongAlt: 'text-[var(--btn-danger-solid-text)] bg-[var(--btn-danger-solid-bg)]',
  buttonSuccessSolid: 'bg-[var(--badge-success-bg)] text-[var(--badge-success-text)] border-[var(--badge-success-border)]',
  buttonMutedSolid: 'bg-[var(--btn-primary-bg)] text-[var(--text-secondary)] border-[var(--border-base)]',
  tabActive: 'bg-[var(--accent-solid-bg)] text-[var(--btn-highlight-text)] font-semibold shadow-sm',
  tabInactive: 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--muted-bg)]',
  inputBgAlt: 'bg-[var(--bg-panel-inner)] border-[var(--border-base)] text-[var(--text-primary)]',
  cardInteractive: 'bg-[var(--bg-panel-inner)] border-[var(--border-base)] hover:border-[var(--border-accent)] transition-colors',
  bgSuccessFaint: 'bg-[var(--success-light-bg)]',
  textSuccessFaint: 'text-[var(--success-text)]',
  buttonDisabled: 'opacity-40 cursor-not-allowed',
  rotorWindowContainer: 'bg-[var(--rotor-window-bg)] border-[var(--rotor-window-border)] shadow-rotor-window',
  tableDayTag: 'bg-[var(--bg-panel-inner)] border-[var(--border-base)] text-[var(--text-accent)] font-mono font-bold',
  tabSwitchButton: 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-b-2 border-transparent hover:border-[var(--border-accent)]',
  codebookHeaderButton: 'bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] text-[var(--text-primary)] border-[var(--border-base)]',
  indicatorBgAlt: 'bg-[var(--indicator-bg)]',
  codebookSheetBg: 'bg-[var(--bg-panel-inner)] border-[var(--border-base)] text-[var(--text-primary)]',
  codebookStamp: 'border-[var(--border-accent)] text-[var(--text-accent)]',
  tableHeaderBg: 'bg-[var(--bg-modal-header)] text-[var(--text-primary)] border-[var(--border-base)]',
  kenngruppenTag: 'bg-[var(--accent-light-bg)] text-[var(--text-accent)] border-[var(--border-accent)] font-mono',
  textAccentExtra: 'text-[var(--text-accent)] font-bold',
  textAccentStrong: 'text-[var(--text-accent)]',
  bgAccentFaint: 'bg-[var(--accent-light-bg)]',
  bgAccentSolid: 'bg-[var(--accent-solid-bg)] text-[var(--badge-active-text)]',
  bgAccentHover: 'hover:bg-[var(--accent-solid-hover)]',
  circleIndicator: 'bg-[var(--accent-solid-bg)]',
  headerPreviewBadge: 'bg-[var(--accent-light-bg)] text-[var(--text-accent)] border-[var(--border-accent)]',

  // Radio Transceiver Color & Design Properties
  radioChassisBg: 'bg-[var(--radio-chassis-bg)]',
  radioRivets: 'border-[var(--border-base)] shadow-[inset_0_1px_2px_rgba(255,255,255,0.1),0_1px_1px_rgba(0,0,0,0.8)]',
  radioHeaderBorder: 'border-[var(--radio-header-border)]',
  radioPowerSwitchBg: 'bg-[var(--radio-power-switch-bg)] border-[var(--border-base)]',
  radioPowerOffText: 'text-[var(--radio-power-off-text)]',
  radioPowerOnText: 'text-[var(--radio-power-on-text)]',
  radioPowerKnobBg: 'from-[var(--radio-power-knob-from)] via-[var(--radio-power-knob-via)] to-[var(--radio-power-knob-to)]',
  radioGlassDialBgOn: 'var(--radio-glass-dial-on)',
  radioGlassDialBgOff: 'bg-[var(--bg-app)]',
  radioGlassDialBorder: 'border-[var(--radio-glass-dial-border)]',
  radioDialText: 'text-[var(--radio-dial-text)]',
  radioDialTick: 'bg-[var(--radio-dial-tick)]',
  radioNeedle: 'bg-[var(--radio-needle-bg)]',
  radioNeedleGlow: 'var(--radio-needle-glow)',
  radioSMeterBg: 'bg-[var(--radio-smeter-bg)]',
  radioSMeterText: 'text-[var(--radio-smeter-text)]',
  radioSMeterNeedle: 'bg-[var(--radio-needle-bg)]',
  radioDisplayBoxBg: 'bg-[var(--radio-display-box-bg)] border-[var(--border-base)]',
  radioDisplayReadoutOn: 'text-[var(--radio-display-readout-on)] shadow-[0_0_8px_var(--radio-display-readout-on)]',
  radioDisplayReadoutOff: 'text-[var(--radio-display-readout-off)]',
  radioDisplayTextAccent: 'text-[var(--text-accent)]',
  radioDisplayInputBg: 'bg-[var(--input-bg)] border-[var(--border-base)] text-[var(--text-accent)]',
  radioStationBadge: 'bg-[var(--accent-light-bg)] text-[var(--text-accent)] border-[var(--border-accent)]',
  radioRotaryModuleBg: 'bg-[var(--bg-panel-inner)] border-[var(--border-base)]',
  radioRotaryModuleBorder: 'border-[var(--border-base)]',
  radioRotaryKnobBg: 'from-[var(--radio-power-knob-from)] via-[var(--radio-power-knob-via)] to-[var(--radio-power-knob-to)]',
  radioRotaryKnobBorder: 'border-[var(--border-base)]',
  radioRotaryKnobNotch: 'bg-[var(--radio-rotary-knob-notch)]',
  radioRotaryCap: 'from-[var(--radio-power-knob-from)] to-[var(--radio-power-knob-to)] border-[var(--border-base)]',
  radioSpeedBtnActive: 'bg-[var(--btn-highlight-bg)] text-[var(--btn-highlight-text)] border-[var(--btn-highlight-bg)]',
  radioSpeedBtnInactive: 'bg-[var(--btn-primary-bg)] text-[var(--text-secondary)] border-[var(--border-base)] hover:text-[var(--text-primary)] hover:bg-[var(--btn-primary-hover)]',
  radioPresetBtnActive: 'bg-[var(--accent-solid-bg)] text-[var(--badge-active-text)] border-[var(--accent-solid-bg)] shadow-[0_0_8px_var(--accent-solid-bg)]',
  radioPresetBtnInactive: 'bg-[var(--btn-primary-bg)] text-[var(--text-secondary)] border-[var(--border-base)] hover:text-[var(--text-primary)] hover:border-[var(--border-accent)]',
  radioScopeBg: 'bg-[var(--radio-scope-bg)] border-[var(--border-base)]',
  radioScopeGrid: 'var(--radio-scope-grid)',
  radioScopeWaveActive: 'var(--radio-scope-wave-active)',
  radioScopeWaveIdle: 'var(--radio-scope-wave-idle)',
};


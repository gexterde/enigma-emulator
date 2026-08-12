import React, { createContext, useContext, useState, useEffect } from 'react';

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
}

/**
 * The Creator class declares the factory method that is supposed to return an
 * object of a Product class.
 */
abstract class ThemeFactory {
  public abstract createTheme(): ThemeProduct;
}

/**
 * Concrete Creators override the factory method in order to change the
 * resulting product's type.
 */
class VintageThemeFactory extends ThemeFactory {
  public createTheme(): ThemeProduct {
    return {
      appBg: 'bg-[#0a0806] text-[#ede1cd] selection:bg-amber-900/50',
      appTexture: 'texture-wood',
      sidebarBg: 'bg-[#120e04] border-[#3b3426]',
      headerBg: 'bg-[#120e04] border-[#3b3426]',
      panelBg: 'bg-[#120e04] border-[#3b3426]',
      panelInner: 'bg-[#1b170e] border-[#3b3426]',
      modalBg: 'bg-[#201b0f] border-[#4e453b] text-[#ede1cd] texture-metal',
      modalTexture: 'texture-metal',
      modalHeaderBg: 'bg-[#3b3426] border-[#4e453b]',
      modalFooterBg: 'bg-[#120e04] border-[#3b3426]',
      wellBg: 'bg-[#141007]',
      wellInnerBg: 'bg-[#201b0f]/80',
      textPrimary: 'text-[#ede1cd]',
      textSecondary: 'text-[#8c7e6a]',
      textAccent: 'text-[#ebc238]',
      textMuted: 'text-[#d1c4b7]',
      borderBase: 'border-[#3b3426]',
      borderAccent: 'border-[#8b6f47]',
      activeBadge: 'bg-[#ebc238] text-[#1a150c]',
      inactiveBadge: 'bg-[#1b160e] text-[#d1c4b7] hover:bg-[#2a2215]',
      successBadge: 'bg-[#2e7d32]/30 border-[#4caf50] text-[#a5d6a7]',
      dangerBadge: 'bg-[#2a1a1a] text-[#ff8a80] border-[#5c2b2b]',
      accentLightBg: 'bg-[#ebc238]/20',
      accentSolidBg: 'bg-[#ebc238]',
      mutedBg: 'bg-[#221c11]',
      indicatorBg: 'bg-[#251f12]',
      successLightBg: 'bg-green-950/25',
      dangerLightBg: 'bg-red-950/45',
      successText: 'text-green-400',
      dangerText: 'text-red-400',
      sliderAccent: 'accent-[#ebc238]',
      progressFill: 'bg-[#ebc238]',
      buttonPrimary: 'bg-[#2a241a] hover:bg-[#3b3426] text-[#ede1cd] border-[#4e453b]',
      buttonHighlight: 'bg-[#ebc238] hover:bg-[#ffd700] text-[#201b0f]',
      buttonDanger: 'bg-red-950/90 hover:bg-red-900 text-red-200 border-red-700',
      buttonDangerSolid: 'bg-[#93000a] text-[#ffdad6] hover:bg-red-900',
      dangerBg: 'bg-[#93000a]/20 border-red-800/40 text-[#ffdad6]',
      controlButton: 'bg-[#2a2215] hover:bg-[#ebc238] hover:text-[#1c170d]',
      controlButtonActive: 'bg-[#ebc238] text-[#201b0f] border-[#ebc238]',
      secondaryButtonHover: 'hover:bg-[#ebc238]/20',
      inputBg: 'bg-[#0a0806] border-[#3b3426] text-[#ebc238]',
      keyShape: 'rounded-full',
      keyBase: 'border-[#83715d] bg-[#3b3426] shadow-key-base hover:border-[#e3c193] hover:bg-[#4e453b]',
      keyPressed: 'bg-[#ebc238] text-[#25190b] border-white ring-4 ring-[#ebc238]/40 shadow-[0_0_15px_#ebc238]',
      keyCompactBase: 'bakelite-key text-[#e3c193]',
      keyCompactPressed: 'key-pressed ring-2 ring-[#ebc238]/60 text-[#ebc238]',
      lampShape: 'rounded-full',
      lampBase: 'bg-[#120e04] border-[#3b3426] text-[#83715d] shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]',
      lampLit: 'bg-[#ebc238] border-[#fff5d6] text-[#25190b] shadow-lamp-glow font-bold scale-105',
      lampDim: 'lamp-dim-glow border-[#ebc238]/50',
      lampLitGlow: 'bg-[#ebc238] text-[#25190b] shadow-[0_0_12px_#ebc238]',
      signalPulse: 'bg-[#ebc238] text-[#25190b] shadow-[0_0_12px_#ebc238]',
      signalGradient: 'linear-gradient(to right, #8b6f47, #ebc238, #fff5d6)',
      activeKeyBg: 'bg-[#25190b]',
      activeKeyText: 'text-yellow-100',
      keyboardPanelBg: 'bg-[#181307] border-[#4e453b] texture-wood shadow-panel',
      lampboardPanelBg: 'bg-[#201b0f] border-[#4e453b] texture-metal shadow-panel',
      compactPlateBg: 'metal-plate shadow-md',
      paperTapeBg: 'bg-[#f6dfc7] text-[#25190b]',
      paperTapeText: 'text-[#25190b]',
      paperTapeBorder: 'border-[#ebc238]',
      paperTapeBorderActive: 'border-[#ebc238]',
      selectBg: 'bg-[#1b170e] text-[#ede1cd] border-[#3b3426]',
      fontHeader: 'font-ui-header',
      fontBody: 'font-ui-body',
      fontMono: 'font-monospaced-technical',
      fontRotor: 'font-rotor-label text-[#ebc238]',
      statusHighlight: 'bg-[#181307] border-[#ebc238] shadow-[0_0_20px_rgba(235,194,56,0.3)]',
      buttonSuccess: 'bg-green-950/80 hover:bg-green-900 text-green-300 border-green-800/80',
      buttonMuted: 'border-[#ebc238]/60 bg-[#251b0a] text-[#ebc238] hover:bg-[#ebc238] hover:text-[#181307]',
      chartBarPlaintext: 'bg-[#ede1cd]/40 group-hover:bg-[#ede1cd]/60',
      chartBarCiphertext: 'bg-[#ebc238] group-hover:bg-[#f3d05a] shadow-[0_0_6px_rgba(235,194,56,0.25)] group-hover:shadow-[0_0_10px_rgba(235,194,56,0.5)]',
      chartBarBaseline: 'border-amber-700/60',
      paperTapeCopyButton: 'bg-[#25190b] text-[#f6dfc7] hover:bg-[#3c2e1e]',
      rotorWindowBg: 'bg-[#3b3426]',
      rotorWindowBorder: 'border-[#4e453b]',
      rotorWindowShadow: 'shadow-rotor-window',
      rotorWindowControl: 'text-[#d1c4b7] hover:text-[#ebc238]',
      lampLitDkl: 'bg-[#cba832] border-[#f1e09d] text-[#25190b] shadow-[0_0_12px_#d48800] opacity-80',
      lampLitSammler: 'bg-[#ffea70] border-[#ffffff] text-[#1a0f00] shadow-[0_0_25px_#ffff80,0_0_50px_#ffc83b]',
      lampDimDkl: 'lamp-dim-glow-dkl border-[#ebc238]/30',
      lampDimSammler: 'lamp-dim-glow-sammler border-[#ffea70]/70',
      lampInnerLitDkl: 'bg-[#d48800] text-[#3d2100] font-bold shadow-[inset_0_0_4px_#ffe0a3]',
      lampInnerLitSammler: 'bg-[#e6a100] text-[#1a0f00] font-bold shadow-[inset_0_0_8px_#ffffff]',
      lampInnerLitHell: 'bg-[#ffc83b] text-[#2b1700] font-bold shadow-[inset_0_0_6px_#ffffff]',
      lampSocketBg: 'bg-[#15120c]',
      lampSocketBorder: 'border-[#2e271d]',
      lampSocketInnerBg: 'bg-[#282319]/80',
      lampSocketInnerText: 'text-[#8c7e6a]',
      lampSocketInnerShadow: 'shadow-[inset_0_-1px_1px_rgba(0,0,0,0.8)]',
      litLampBadgeDkl: 'text-[#d48800] bg-[#d48800]/20 border-[#d48800]/40',
      litLampBadgeSammler: 'text-[#ffea70] bg-[#ffea70]/25 border-[#ffea70]/70 shadow-[0_0_10px_rgba(255,234,112,0.5)]',
      litLampBadgeHell: 'text-[#ebc238] bg-[#ebc238]/20 border-[#ebc238]/40',
      textureMetal: 'texture-metal',
      batteryPanelStop0: '#211b12',
      batteryPanelStop100: '#0d0a06',
      batteryBrassStop0: '#f7ea9b',
      batteryBrassStop40: '#d8b240',
      batteryBrassStop80: '#8f6f1c',
      batteryBrassStop100: '#57420e',
      batteryBakeliteStop0: '#4a2d1d',
      batteryBakeliteStop40: '#28170e',
      batteryBakeliteStop85: '#140b06',
      batteryBakeliteStop100: '#090402',
      batteryPlateShadowOpacity: '0.8',
      batteryRectStroke: '#3b3426',
      batteryAxleFill: '#080503',
      batteryAxleStroke: '#2d2215',
      batteryArcStroke: '#120e09',
      batteryKnobBaseFill: '#0a0604',
      batteryKnobBaseStroke: '#281a10',
      batteryKnobHandleStroke: '#050302',
      batteryKnobRidgeFill: '#211209',
      batteryKnobRidgeStroke: '#382012',
      batteryHubStroke: '#2d1f07',
      batteryHubCenterFill: '#120c04',
      batteryArrowStroke: '#3d2c08',
      mixBlendMode: 'mix-blend-screen',
      rotorDecoration: 'bg-[#e3c193]/5',
      rotorDecorationHover: 'group-hover:bg-[#e3c193]/10',
      applyButton: 'bg-[#8b6f47] text-[#fffaf8] shadow-key-base hover:bg-[#8b6f47]/90 active:shadow-key-pressed active:translate-y-1 border border-[#e3c193]/30',
      buttonDangerHighlight: 'bg-[#801818] hover:bg-[#a12020] text-white',
      textDanger: 'text-[#ff7070]',
      borderDanger: 'border-[#801818]',
      dangerPanelBg: 'bg-[#2c1a1a]',
      buttonMutedHover: 'hover:bg-[#4e453b]',
      rotorIconWrapper: 'bg-[#3b3426] border-4 border-[#181307] shadow-[inset_0_4px_8px_rgba(0,0,0,0.8)]',
      textMutedAlt: 'text-[#9e8d78]',
      bgSuccess: 'bg-[#1f3a18]',
      borderSuccess: 'border-[#3f7a30]',
      textSuccess: 'text-[#a1f092]',
      bgSuccessStrong: 'bg-[#224419]',
      textSuccessStrong: 'text-[#a1f092]',
      bgSuccessDark: 'bg-[#0b1209]',
      borderSuccessAlt: 'border-[#224419]',
      textSuccessAlt: 'text-[#8a9e84]',
      bgDangerAlt: 'bg-[#241010]',
      borderDangerAlt: 'border-[#6b2222]',
      textDangerAlt: 'text-[#f29191]',
      textDangerStrong: 'text-[#e05252]',
      textDangerHeader: 'text-[#f5d0d0]',
      buttonActive: 'border-[#ebc238] text-[#ebc238]',
      buttonInactive: 'border-transparent text-[#9e8d78] hover:text-[#d1c4b7]',
      rotorSettingPanelDecoration: 'bg-[#e3c193]/5 group-hover:bg-[#e3c193]/10',
      rotorSettingSelect: 'bg-[#3b3426] border-[#3b3426] text-[#e3c193] font-rotor-label text-rotor-label shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]',
      rotorWindowControlAlt: 'text-[#8c7e6a] hover:text-[#ebc238] bg-[#120e04]/40 border border-[#3b3426]',
      rotorWindowControlMuted: 'text-[#8c7e6a] hover:text-[#ebc238]',
      rotorWindowControlAction: 'text-[#d1c4b7] hover:text-[#ebc238]',
      textMutedStrong: 'text-[#3a3022]',
      borderStrong: 'border-[#1f1910]',
      tableHeaderMuted: 'text-[#3a3022]',
      tableRowHover: 'hover:bg-[#c7b597]',
      tableRowActive: 'bg-[#ebd4ad]',
      tableCellAccent: 'bg-[#c4b395]',
      textDangerStrongAlt: 'text-[#a32020]',
      buttonSuccessSolid: 'bg-[#2b6121] text-white hover:bg-[#1f4a18]',
      buttonMutedSolid: 'bg-[#1f1910] text-[#f4ebdc] hover:bg-[#3b3123]',
      tabActive: 'bg-[#ebc238] text-[#25190b]',
      tabInactive: 'text-[#83715d] hover:text-[#d1c4b7]',
      inputBgAlt: 'bg-[#1c160a]',
      cardInteractive: 'bg-[#251f12] hover:bg-[#332b1a] border-[#5c4a30]',
      bgSuccessFaint: 'bg-[#0b1209] border-[#224419]',
      textSuccessFaint: 'text-[#8a9e84]',
      buttonDisabled: 'bg-[#3b3426] text-[#73685a]',
      rotorWindowContainer: 'bg-[#3b3426] border-[#3b3426] shadow-rotor-window',
      tableDayTag: 'bg-[#c4b395] border-[#1f1910]',
      tabSwitchButton: 'text-[#2a2215] bg-[#a89679] hover:bg-[#1f1910] hover:text-[#ebc238] border-[#1f1910]/30',
      codebookHeaderButton: 'bg-[#2a2215] hover:bg-[#3b301e] text-[#ebc238] border-[#8b6f47]',
      indicatorBgAlt: 'bg-[#2b2518] text-[#8c7e6a] border-[#524430]',
      codebookSheetBg: 'bg-[#d3c2a5] text-[#1f1910] border-[#8c785b]',
      codebookStamp: 'border-[#a32020] text-[#a32020]',
      tableHeaderBg: 'bg-[#bfae91]',
      kenngruppenTag: 'bg-[#1b222c] text-[#61afef] border-[#61afef]/40',
      textAccentExtra: 'text-amber-300',
      textAccentStrong: 'text-amber-400',
      bgAccentFaint: 'bg-amber-600/20',
      bgAccentSolid: 'bg-amber-600',
      bgAccentHover: 'bg-amber-500',
      circleIndicator: 'bg-amber-950 border-amber-600/60 text-amber-400',
    };
  }
}

class VintageNavyThemeFactory extends ThemeFactory {
  public createTheme(): ThemeProduct {
    return {
      appBg: 'bg-[#04091a] text-[#dce4f7] selection:bg-indigo-900/60',
      appTexture: 'texture-navy-wood',
      sidebarBg: 'bg-[#091129] border-[#1d2c52]',
      headerBg: 'bg-[#091129] border-[#1d2c52]',
      panelBg: 'bg-[#091129] border-[#1d2c52]',
      panelInner: 'bg-[#0f1b3d] border-[#1d2c52]',
      modalBg: 'bg-[#12214a] border-[#294178] text-[#dce4f7] texture-metal',
      modalTexture: 'texture-metal',
      modalHeaderBg: 'bg-[#1d2c52] border-[#294178]',
      modalFooterBg: 'bg-[#091129] border-[#1d2c52]',
      wellBg: 'bg-[#050b1c]',
      wellInnerBg: 'bg-[#0f1b3d]/80',
      textPrimary: 'text-[#dce4f7]',
      textSecondary: 'text-[#7b90bd]',
      textAccent: 'text-[#e5c158]',
      textMuted: 'text-[#b2c2e5]',
      borderBase: 'border-[#1d2c52]',
      borderAccent: 'border-[#8c7438]',
      activeBadge: 'bg-[#e5c158] text-[#060e22] font-semibold',
      inactiveBadge: 'bg-[#0f1b3d] text-[#b2c2e5] hover:bg-[#1a2c5a]',
      successBadge: 'bg-[#163f25]/30 border-[#22c55e] text-[#86efac]',
      dangerBadge: 'bg-[#3f1620] text-[#fca5a5] border-[#991b1b]',
      accentLightBg: 'bg-[#e5c158]/20',
      accentSolidBg: 'bg-[#e5c158]',
      mutedBg: 'bg-[#14234c]',
      indicatorBg: 'bg-[#162754]',
      successLightBg: 'bg-emerald-950/30',
      dangerLightBg: 'bg-rose-950/45',
      successText: 'text-emerald-400',
      dangerText: 'text-rose-400',
      sliderAccent: 'accent-[#e5c158]',
      progressFill: 'bg-[#e5c158]',
      buttonPrimary: 'bg-[#182852] hover:bg-[#233872] text-[#dce4f7] border-[#2d4684]',
      buttonHighlight: 'bg-[#e5c158] hover:bg-[#f2d47d] text-[#060e22]',
      buttonDanger: 'bg-red-950/90 hover:bg-red-900 text-red-200 border-red-700',
      buttonDangerSolid: 'bg-[#93000a] text-[#ffdad6] hover:bg-red-900',
      dangerBg: 'bg-[#93000a]/20 border-red-800/40 text-[#ffdad6]',
      controlButton: 'bg-[#162754] hover:bg-[#e5c158] hover:text-[#060e22]',
      controlButtonActive: 'bg-[#e5c158] text-[#060e22] border-[#e5c158]',
      secondaryButtonHover: 'hover:bg-[#e5c158]/20',
      inputBg: 'bg-[#04091a] border-[#1d2c52] text-[#e5c158]',
      keyShape: 'rounded-full',
      keyBase: 'border-[#7084b0] bg-[#1d2c52] shadow-key-base hover:border-[#e5c158] hover:bg-[#233872]',
      keyPressed: 'bg-[#e5c158] text-[#060e22] border-white ring-4 ring-[#e5c158]/40 shadow-[0_0_15px_#e5c158]',
      keyCompactBase: 'bakelite-key text-[#cbd7f0]',
      keyCompactPressed: 'key-pressed ring-2 ring-[#e5c158]/60 text-[#e5c158]',
      lampShape: 'rounded-full',
      lampBase: 'bg-[#091129] border-[#1d2c52] text-[#7084b0] shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]',
      lampLit: 'bg-[#e5c158] border-[#fff5d6] text-[#060e22] shadow-lamp-glow font-bold scale-105',
      lampDim: 'lamp-dim-glow border-[#e5c158]/50',
      lampLitGlow: 'bg-[#e5c158] text-[#060e22] shadow-[0_0_12px_#e5c158]',
      signalPulse: 'bg-[#e5c158] text-[#060e22] shadow-[0_0_12px_#e5c158]',
      signalGradient: 'linear-gradient(to right, #294178, #e5c158, #fff5d6)',
      activeKeyBg: 'bg-[#060e22]',
      activeKeyText: 'text-yellow-100',
      keyboardPanelBg: 'bg-[#0c1633] border-2 border-[#3d599c] texture-navy-wood shadow-panel',
      lampboardPanelBg: 'bg-[#12214a] border-2 border-[#3d599c] texture-metal shadow-panel',
      compactPlateBg: 'metal-plate shadow-md',
      paperTapeBg: 'bg-[#f2ebdc] text-[#060e22]',
      paperTapeText: 'text-[#060e22]',
      paperTapeBorder: 'border-[#e5c158]',
      paperTapeBorderActive: 'border-[#e5c158]',
      selectBg: 'bg-[#0f1b3d] text-[#dce4f7] border-[#1d2c52]',
      fontHeader: 'font-ui-header',
      fontBody: 'font-ui-body',
      fontMono: 'font-monospaced-technical',
      fontRotor: 'font-rotor-label text-[#e5c158]',
      statusHighlight: 'bg-[#0c1633] border-[#e5c158] shadow-[0_0_20px_rgba(229,193,88,0.3)]',
      buttonSuccess: 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border-emerald-800/80',
      buttonMuted: 'border-[#e5c158]/60 bg-[#162754] text-[#e5c158] hover:bg-[#e5c158] hover:text-[#060e22]',
      chartBarPlaintext: 'bg-[#dce4f7]/40 group-hover:bg-[#dce4f7]/60',
      chartBarCiphertext: 'bg-[#e5c158] group-hover:bg-[#f2d47d] shadow-[0_0_6px_rgba(229,193,88,0.25)] group-hover:shadow-[0_0_10px_rgba(229,193,88,0.5)]',
      chartBarBaseline: 'border-amber-700/60',
      paperTapeCopyButton: 'bg-[#060e22] text-[#f2ebdc] hover:bg-[#12214a]',
      rotorWindowBg: 'bg-[#1d2c52]',
      rotorWindowBorder: 'border-[#294178]',
      rotorWindowShadow: 'shadow-rotor-window',
      rotorWindowControl: 'text-[#b2c2e5] hover:text-[#e5c158]',
      lampLitDkl: 'bg-[#bca03b] border-[#f5e3a8] text-[#060e22] shadow-[0_0_12px_#b57b07] opacity-80',
      lampLitSammler: 'bg-[#ffea70] border-[#ffffff] text-[#1a0f00] shadow-[0_0_25px_#ffff80,0_0_50px_#ffc83b]',
      lampDimDkl: 'lamp-dim-glow-dkl border-[#e5c158]/30',
      lampDimSammler: 'lamp-dim-glow-sammler border-[#ffea70]/70',
      lampInnerLitDkl: 'bg-[#b57b07] text-[#3d2100] font-bold shadow-[inset_0_0_4px_#ffe0a3]',
      lampInnerLitSammler: 'bg-[#e6a100] text-[#1a0f00] font-bold shadow-[inset_0_0_8px_#ffffff]',
      lampInnerLitHell: 'bg-[#ffc83b] text-[#2b1700] font-bold shadow-[inset_0_0_6px_#ffffff]',
      lampSocketBg: 'bg-[#060c1d]',
      lampSocketBorder: 'border-[#14234c]',
      lampSocketInnerBg: 'bg-[#111e42]/80',
      lampSocketInnerText: 'text-[#7084b0]',
      lampSocketInnerShadow: 'shadow-[inset_0_-1px_1px_rgba(0,0,0,0.8)]',
      litLampBadgeDkl: 'text-[#b57b07] bg-[#b57b07]/20 border-[#b57b07]/40',
      litLampBadgeSammler: 'text-[#ffea70] bg-[#ffea70]/25 border-[#ffea70]/70 shadow-[0_0_10px_rgba(255,234,112,0.5)]',
      litLampBadgeHell: 'text-[#e5c158] bg-[#e5c158]/20 border-[#e5c158]/40',
      textureMetal: 'texture-metal',
      batteryPanelStop0: '#12214a',
      batteryPanelStop100: '#050b1c',
      batteryBrassStop0: '#fcd34d',
      batteryBrassStop40: '#fbbf24',
      batteryBrassStop80: '#d97706',
      batteryBrassStop100: '#78350f',
      batteryBakeliteStop0: '#1e293b',
      batteryBakeliteStop40: '#0f172a',
      batteryBakeliteStop85: '#020617',
      batteryBakeliteStop100: '#000000',
      batteryPlateShadowOpacity: '0.8',
      batteryRectStroke: '#1d2c52',
      batteryAxleFill: '#050b1c',
      batteryAxleStroke: '#14234c',
      batteryArcStroke: '#091129',
      batteryKnobBaseFill: '#020617',
      batteryKnobBaseStroke: '#14234c',
      batteryKnobHandleStroke: '#020617',
      batteryKnobRidgeFill: '#0f172a',
      batteryKnobRidgeStroke: '#1e293b',
      batteryHubStroke: '#14234c',
      batteryHubCenterFill: '#020617',
      batteryArrowStroke: '#fbbf24',
      mixBlendMode: 'mix-blend-screen',
      rotorDecoration: 'bg-[#cbd7f0]/5',
      rotorDecorationHover: 'group-hover:bg-[#cbd7f0]/10',
      applyButton: 'bg-[#8c7438] text-[#fffaf8] shadow-key-base hover:bg-[#8c7438]/90 active:shadow-key-pressed active:translate-y-1 border border-[#cbd7f0]/30',
      buttonDangerHighlight: 'bg-[#801818] hover:bg-[#a12020] text-white',
      textDanger: 'text-[#ff7070]',
      borderDanger: 'border-[#801818]',
      dangerPanelBg: 'bg-[#2c1a1a]',
      buttonMutedHover: 'hover:bg-[#294178]',
      rotorIconWrapper: 'bg-[#1d2c52] border-4 border-[#0c1633] shadow-[inset_0_4px_8px_rgba(0,0,0,0.8)]',
      textMutedAlt: 'text-[#8397c4]',
      bgSuccess: 'bg-[#064e3b]',
      borderSuccess: 'border-[#047857]',
      textSuccess: 'text-[#34d399]',
      bgSuccessStrong: 'bg-[#065f46]',
      textSuccessStrong: 'text-[#ecfdf5]',
      bgSuccessDark: 'bg-[#030611]',
      borderSuccessAlt: 'border-[#047857]',
      textSuccessAlt: 'text-[#688c75]',
      bgDangerAlt: 'bg-[#4c0519]',
      borderDangerAlt: 'border-[#881337]',
      textDangerAlt: 'text-[#fda4af]',
      textDangerStrong: 'text-[#e11d48]',
      textDangerHeader: 'text-[#fecdd3]',
      buttonActive: 'border-[#e5c158] text-[#e5c158]',
      buttonInactive: 'border-transparent text-[#8397c4] hover:text-[#b2c2e5]',
      rotorSettingPanelDecoration: 'bg-[#cbd7f0]/5 group-hover:bg-[#cbd7f0]/10',
      rotorSettingSelect: 'bg-[#1d2c52] border-[#1d2c52] text-[#cbd7f0] font-rotor-label text-rotor-label shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]',
      rotorWindowControlAlt: 'text-[#7084b0] hover:text-[#e5c158] bg-[#091129]/40 border border-[#1d2c52]',
      rotorWindowControlMuted: 'text-[#7084b0] hover:text-[#e5c158]',
      rotorWindowControlAction: 'text-[#b2c2e5] hover:text-[#e5c158]',
      textMutedStrong: 'text-[#1e346b]',
      borderStrong: 'border-[#0b132a]',
      tableHeaderMuted: 'text-[#1e346b]',
      tableRowHover: 'hover:bg-[#1a2f64]',
      tableRowActive: 'bg-[#253f82]',
      tableCellAccent: 'bg-[#203773]',
      textDangerStrongAlt: 'text-[#a32020]',
      buttonSuccessSolid: 'bg-[#15803d] text-white hover:bg-[#166534]',
      buttonMutedSolid: 'bg-[#0b132a] text-[#f4ebdc] hover:bg-[#1e2f5c]',
      tabActive: 'bg-[#e5c158] text-[#060e22]',
      tabInactive: 'text-[#7084b0] hover:text-[#b2c2e5]',
      inputBgAlt: 'bg-[#070e24]',
      cardInteractive: 'bg-[#12214a] hover:bg-[#192d63] border-[#294178]',
      bgSuccessFaint: 'bg-[#030611] border-[#047857]',
      textSuccessFaint: 'text-[#688c75]',
      buttonDisabled: 'bg-[#1d2c52] text-[#556994]',
      rotorWindowContainer: 'bg-[#1d2c52] border-[#1d2c52] shadow-rotor-window',
      tableDayTag: 'bg-[#203773] border-[#0b132a]',
      tabSwitchButton: 'text-[#dce4f7] bg-[#294178] hover:bg-[#1a2f64] hover:text-[#e5c158] border-[#0b132a]/30',
      codebookHeaderButton: 'bg-[#12214a] hover:bg-[#192d63] text-[#e5c158] border-[#8c7438]',
      indicatorBgAlt: 'bg-[#111e42] text-[#7084b0] border-[#203773]',
      codebookSheetBg: 'bg-[#c9d1e3] text-[#0a142c] border-[#7b90bd]',
      codebookStamp: 'border-[#a32020] text-[#a32020]',
      tableHeaderBg: 'bg-[#aab4cc]',
      kenngruppenTag: 'bg-[#1b222c] text-[#61afef] border-[#61afef]/40',
      textAccentExtra: 'text-[#fcd34d]',
      textAccentStrong: 'text-[#fbbf24]',
      bgAccentFaint: 'bg-[#e5c158]/20',
      bgAccentSolid: 'bg-[#e5c158]',
      bgAccentHover: 'bg-[#f2d47d]',
      circleIndicator: 'bg-[#050b1c] border-[#e5c158]/60 text-[#e5c158]',
    };
  }
}

class ModernThemeFactory extends ThemeFactory {
  public createTheme(): ThemeProduct {
    return {
      appBg: 'bg-slate-50 text-slate-900 selection:bg-blue-200',
      appTexture: '',
      sidebarBg: 'bg-white border-slate-200',
      headerBg: 'bg-white border-slate-200',
      panelBg: 'bg-white border-slate-200 shadow-sm',
      panelInner: 'bg-slate-50 border-slate-200',
      modalBg: 'bg-white border-slate-200 text-slate-900 shadow-xl',
      modalTexture: '',
      modalHeaderBg: 'bg-slate-50 border-slate-200',
      modalFooterBg: 'bg-slate-50 border-slate-200',
      wellBg: 'bg-slate-50',
      wellInnerBg: 'bg-slate-50',
      textPrimary: 'text-slate-900',
      textSecondary: 'text-slate-500',
      textAccent: 'text-blue-600',
      textMuted: 'text-slate-600',
      borderBase: 'border-slate-200',
      borderAccent: 'border-blue-300',
      activeBadge: 'bg-blue-600 text-white',
      inactiveBadge: 'bg-white text-slate-600 hover:bg-blue-50 border border-slate-100',
      successBadge: 'bg-green-50 border-green-200 text-green-700',
      dangerBadge: 'bg-red-50 text-red-600 border-red-200',
      accentLightBg: 'bg-blue-50',
      accentSolidBg: 'bg-blue-600',
      mutedBg: 'bg-slate-100',
      indicatorBg: 'bg-slate-100',
      successLightBg: 'bg-green-50',
      dangerLightBg: 'bg-red-50',
      successText: 'text-green-700',
      dangerText: 'text-red-700',
      sliderAccent: 'accent-blue-600',
      progressFill: 'bg-blue-600',
      buttonPrimary: 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300 shadow-sm',
      buttonHighlight: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20',
      buttonDanger: 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200',
      buttonDangerSolid: 'bg-red-600 text-white hover:bg-red-700',
      dangerBg: 'bg-red-50 border-red-200 text-red-900',
      controlButton: 'bg-slate-100 hover:bg-slate-200 text-slate-600',
      controlButtonActive: 'bg-blue-600 text-white border-blue-600',
      secondaryButtonHover: 'hover:bg-blue-50',
      inputBg: 'bg-white border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500',
      keyShape: 'rounded-md',
      keyBase: 'border-slate-300 bg-white shadow-sm hover:border-slate-400 hover:bg-slate-50 text-slate-700',
      keyPressed: 'bg-blue-100 text-blue-700 border-blue-400 ring-2 ring-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.3)]',
      keyCompactBase: 'bg-white border border-slate-300 text-slate-700 shadow-sm hover:bg-slate-50',
      keyCompactPressed: 'bg-blue-100 border-blue-400 text-blue-700 ring-2 ring-blue-500/30',
      lampShape: 'rounded-md',
      lampBase: 'bg-slate-100 border-slate-300 text-slate-400 shadow-sm',
      lampLit: 'bg-blue-500 border-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.6)] font-bold scale-105',
      lampDim: 'bg-blue-50 border-blue-200 text-blue-600 shadow-sm animate-bulb-flicker',
      lampLitGlow: 'bg-yellow-400 text-yellow-950 shadow-sm',
      signalPulse: 'bg-yellow-400 text-yellow-950 shadow-sm',
      signalGradient: '',
      activeKeyBg: 'bg-yellow-900',
      activeKeyText: 'text-yellow-100',
      keyboardPanelBg: 'bg-white border-slate-200 shadow-sm',
      lampboardPanelBg: 'bg-slate-50 border-slate-200 shadow-sm',
      compactPlateBg: 'bg-white border border-slate-200 shadow-sm',
      paperTapeBg: 'bg-white text-slate-900 border border-slate-300',
      paperTapeText: 'text-slate-800',
      paperTapeBorder: 'border-blue-500',
      paperTapeBorderActive: 'border-blue-500',
      selectBg: 'bg-white text-slate-800 border-slate-300',
      fontHeader: 'font-sans font-semibold tracking-tight',
      fontBody: 'font-sans',
      fontMono: 'font-mono text-[0.9em]',
      fontRotor: 'font-sans font-bold text-slate-800',
      statusHighlight: 'bg-white border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]',
      buttonSuccess: 'bg-green-600 hover:bg-green-700 text-white border-green-500 shadow-sm',
      buttonMuted: 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-700 shadow-xs',
      chartBarPlaintext: 'bg-slate-300 group-hover:bg-slate-400',
      chartBarCiphertext: 'bg-blue-600 group-hover:bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.25)] group-hover:shadow-[0_0_10px_rgba(59,130,246,0.5)]',
      chartBarBaseline: 'border-slate-300',
      paperTapeCopyButton: 'bg-blue-600 text-white hover:bg-blue-700',
      rotorWindowBg: 'bg-white',
      rotorWindowBorder: 'border-slate-300',
      rotorWindowShadow: 'shadow-inner',
      rotorWindowControl: 'text-slate-400 hover:text-blue-500',
      lampLitDkl: 'bg-blue-600 border-blue-400 scale-105 shadow-[0_0_12px_rgba(59,130,246,0.5)]',
      lampLitSammler: 'bg-blue-600 border-blue-400 scale-105 shadow-[0_0_12px_rgba(59,130,246,0.5)]',
      lampDimDkl: 'bg-blue-50 border-blue-200 shadow-sm animate-bulb-flicker',
      lampDimSammler: 'bg-blue-50 border-blue-200 shadow-sm animate-bulb-flicker',
      lampInnerLitDkl: 'bg-blue-500 text-white font-bold',
      lampInnerLitSammler: 'bg-blue-500 text-white font-bold',
      lampInnerLitHell: 'bg-blue-500 text-white font-bold',
      lampSocketBg: 'bg-slate-200',
      lampSocketBorder: 'border-slate-300',
      lampSocketInnerBg: 'bg-slate-100',
      lampSocketInnerText: 'text-slate-400',
      lampSocketInnerShadow: '',
      litLampBadgeDkl: 'text-yellow-700 bg-yellow-100 border-yellow-300',
      litLampBadgeSammler: 'text-yellow-700 bg-yellow-100 border-yellow-300',
      litLampBadgeHell: 'text-yellow-700 bg-yellow-100 border-yellow-300',
      textureMetal: '',
      batteryPanelStop0: '#f8fafc',
      batteryPanelStop100: '#e2e8f0',
      batteryBrassStop0: '#3b82f6',
      batteryBrassStop40: '#2563eb',
      batteryBrassStop80: '#1d4ed8',
      batteryBrassStop100: '#1e40af',
      batteryBakeliteStop0: '#475569',
      batteryBakeliteStop40: '#334155',
      batteryBakeliteStop85: '#1e293b',
      batteryBakeliteStop100: '#0f172a',
      batteryPlateShadowOpacity: '0.15',
      batteryRectStroke: '#cbd5e1',
      batteryAxleFill: '#cbd5e1',
      batteryAxleStroke: '#94a3b8',
      batteryArcStroke: '#e2e8f0',
      batteryKnobBaseFill: '#1e293b',
      batteryKnobBaseStroke: '#475569',
      batteryKnobHandleStroke: '#0f172a',
      batteryKnobRidgeFill: '#334155',
      batteryKnobRidgeStroke: '#475569',
      batteryHubStroke: '#475569',
      batteryHubCenterFill: '#0f172a',
      batteryArrowStroke: '#1e40af',
      mixBlendMode: '',
      rotorDecoration: 'bg-blue-500/5',
      rotorDecorationHover: 'group-hover:bg-blue-500/10',
      applyButton: 'bg-blue-600 text-white hover:bg-blue-700 shadow-md active:translate-y-0.5',
      buttonDangerHighlight: 'bg-red-600 hover:bg-red-700 text-white',
      textDanger: 'text-red-600',
      borderDanger: 'border-red-200',
      dangerPanelBg: 'bg-red-50',
      buttonMutedHover: 'hover:bg-slate-100',
      rotorIconWrapper: 'bg-slate-100 border-4 border-slate-200 shadow-inner',
      textMutedAlt: 'text-slate-500',
      bgSuccess: 'bg-green-50',
      borderSuccess: 'border-green-200',
      textSuccess: 'text-green-700',
      bgSuccessStrong: 'bg-green-200',
      textSuccessStrong: 'text-green-800',
      bgSuccessDark: 'bg-white/50',
      borderSuccessAlt: 'border-green-100',
      textSuccessAlt: 'text-slate-500',
      bgDangerAlt: 'bg-red-50',
      borderDangerAlt: 'border-red-200',
      textDangerAlt: 'text-red-700',
      textDangerStrong: 'text-red-500',
      textDangerHeader: 'text-red-800',
      buttonActive: 'border-blue-500 text-blue-600',
      buttonInactive: 'border-transparent text-slate-500 hover:text-slate-700',
      rotorSettingPanelDecoration: 'bg-blue-500/5 group-hover:bg-blue-500/10',
      rotorSettingSelect: 'bg-white border-slate-300 text-slate-800 font-sans text-sm shadow-sm',
      rotorWindowControlAlt: 'text-slate-400 hover:text-blue-500 bg-white border border-slate-300',
      rotorWindowControlMuted: 'text-slate-400 hover:text-blue-500 hover:bg-slate-100',
      rotorWindowControlAction: 'text-slate-400 hover:text-blue-500',
      textMutedStrong: 'text-slate-600',
      borderStrong: 'border-slate-200',
      tableHeaderMuted: 'text-slate-500',
      tableRowHover: 'hover:bg-slate-50',
      tableRowActive: 'bg-blue-50',
      tableCellAccent: 'bg-slate-50 border-slate-200',
      textDangerStrongAlt: 'text-red-600',
      buttonSuccessSolid: 'bg-green-600 text-white hover:bg-green-700',
      buttonMutedSolid: 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300 shadow-sm',
      tabActive: 'bg-blue-500 text-white',
      tabInactive: 'text-slate-500 hover:text-slate-700',
      inputBgAlt: 'bg-slate-50 border-slate-200',
      cardInteractive: 'bg-slate-50 hover:bg-slate-100 border-slate-200',
      bgSuccessFaint: 'bg-white/50 border-green-100',
      textSuccessFaint: 'text-slate-500',
      buttonDisabled: 'bg-slate-200 text-slate-400',
      rotorWindowContainer: 'bg-slate-100 border-slate-300 border shadow-inner',
      tableDayTag: 'bg-slate-50 border-slate-200',
      tabSwitchButton: 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200',
      codebookHeaderButton: 'bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200',
      indicatorBgAlt: 'bg-slate-50 text-slate-500 border-slate-200 shadow-sm',
      codebookSheetBg: 'bg-white text-slate-900 border-slate-200',
      codebookStamp: 'border-blue-600 text-blue-600',
      tableHeaderBg: 'bg-slate-50',
      kenngruppenTag: 'bg-blue-50 text-blue-700 border-blue-200 shadow-xs',
      textAccentExtra: 'text-blue-600',
      textAccentStrong: 'text-blue-700',
      bgAccentFaint: 'bg-blue-600/10',
      bgAccentSolid: 'bg-blue-600',
      bgAccentHover: 'bg-blue-700',
      circleIndicator: 'bg-blue-50 border-blue-200 text-blue-600',
    };
  }
}



class ModernDarkThemeFactory extends ThemeFactory {
  public createTheme(): ThemeProduct {
    return {
      appBg: 'bg-slate-950 text-slate-100 selection:bg-cyan-900/50',
      appTexture: '',
      sidebarBg: 'bg-slate-900 border-slate-800',
      headerBg: 'bg-slate-900 border-slate-800',
      panelBg: 'bg-slate-900 border-slate-800 shadow-lg',
      panelInner: 'bg-slate-950 border-slate-800',
      modalBg: 'bg-slate-900 border-slate-800 text-slate-100 shadow-2xl',
      modalTexture: '',
      modalHeaderBg: 'bg-slate-950 border-slate-800',
      modalFooterBg: 'bg-slate-950 border-slate-800',
      wellBg: 'bg-slate-950',
      wellInnerBg: 'bg-slate-950',
      textPrimary: 'text-slate-100',
      textSecondary: 'text-slate-400',
      textAccent: 'text-cyan-400',
      textMuted: 'text-slate-300',
      borderBase: 'border-slate-800',
      borderAccent: 'border-cyan-500/50',
      activeBadge: 'bg-cyan-500 text-slate-950 font-semibold',
      inactiveBadge: 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800',
      successBadge: 'bg-emerald-950/60 border-emerald-800/80 text-emerald-400',
      dangerBadge: 'bg-rose-950/60 text-rose-300 border-rose-800/80',
      accentLightBg: 'bg-cyan-950/50',
      accentSolidBg: 'bg-cyan-500',
      mutedBg: 'bg-slate-800/80',
      indicatorBg: 'bg-slate-800',
      successLightBg: 'bg-emerald-950/40',
      dangerLightBg: 'bg-rose-950/40',
      successText: 'text-emerald-400',
      dangerText: 'text-rose-400',
      sliderAccent: 'accent-cyan-400',
      progressFill: 'bg-cyan-500',
      buttonPrimary: 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 shadow-sm',
      buttonHighlight: 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-cyan-500/20',
      buttonDanger: 'bg-rose-950/80 hover:bg-rose-900 text-rose-200 border-rose-800',
      buttonDangerSolid: 'bg-rose-600 text-white hover:bg-rose-500',
      dangerBg: 'bg-rose-950/50 border-rose-800/60 text-rose-200',
      controlButton: 'bg-slate-800 hover:bg-slate-700 text-slate-300',
      controlButtonActive: 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold',
      secondaryButtonHover: 'hover:bg-cyan-950/40',
      inputBg: 'bg-slate-950 border-slate-700 text-cyan-300 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400',
      keyShape: 'rounded-md',
      keyBase: 'border-slate-700 bg-slate-800/90 shadow-md hover:border-slate-500 hover:bg-slate-700 text-slate-200',
      keyPressed: 'bg-cyan-500 text-slate-950 border-cyan-300 ring-2 ring-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.6)] font-bold',
      keyCompactBase: 'bg-slate-800 border border-slate-700 text-slate-200 shadow-sm hover:bg-slate-700',
      keyCompactPressed: 'bg-cyan-500 border-cyan-300 text-slate-950 ring-2 ring-cyan-400/50 font-bold',
      lampShape: 'rounded-md',
      lampBase: 'bg-slate-950 border-slate-800 text-slate-600 shadow-inner',
      lampLit: 'bg-cyan-400 border-cyan-200 text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.8)] font-bold scale-105',
      lampDim: 'bg-cyan-950/60 border-cyan-800/60 text-cyan-400 shadow-sm animate-bulb-flicker',
      lampLitGlow: 'bg-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(34,211,238,0.8)]',
      signalPulse: 'bg-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(34,211,238,0.8)]',
      signalGradient: 'linear-gradient(to right, #0284c7, #06b6d4, #38bdf8)',
      activeKeyBg: 'bg-cyan-950',
      activeKeyText: 'text-cyan-200',
      keyboardPanelBg: 'bg-slate-900 border-slate-800 shadow-lg',
      lampboardPanelBg: 'bg-slate-900/90 border-slate-800 shadow-lg',
      compactPlateBg: 'bg-slate-900 border border-slate-800 shadow-md',
      paperTapeBg: 'bg-slate-950 text-cyan-300 border border-slate-800',
      paperTapeText: 'text-cyan-300',
      paperTapeBorder: 'border-cyan-500',
      paperTapeBorderActive: 'border-cyan-400',
      selectBg: 'bg-slate-950 text-slate-200 border-slate-700',
      fontHeader: 'font-sans font-semibold tracking-tight',
      fontBody: 'font-sans',
      fontMono: 'font-mono text-[0.9em]',
      fontRotor: 'font-sans font-bold text-cyan-400',
      statusHighlight: 'bg-slate-900 border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.25)]',
      buttonSuccess: 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-sm',
      buttonMuted: 'border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-slate-100 shadow-xs',
      chartBarPlaintext: 'bg-slate-700 group-hover:bg-slate-600',
      chartBarCiphertext: 'bg-cyan-500 group-hover:bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.3)] group-hover:shadow-[0_0_10px_rgba(6,182,212,0.6)]',
      chartBarBaseline: 'border-slate-800',
      paperTapeCopyButton: 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 font-semibold',
      rotorWindowBg: 'bg-slate-950',
      rotorWindowBorder: 'border-slate-800',
      rotorWindowShadow: 'shadow-inner',
      rotorWindowControl: 'text-slate-400 hover:text-cyan-400',
      lampLitDkl: 'bg-cyan-500 border-cyan-300 scale-105 shadow-[0_0_15px_rgba(6,182,212,0.7)]',
      lampLitSammler: 'bg-cyan-400 border-white scale-105 shadow-[0_0_20px_rgba(34,211,238,0.9)]',
      lampDimDkl: 'bg-cyan-950/60 border-cyan-800/60 shadow-sm animate-bulb-flicker',
      lampDimSammler: 'bg-cyan-950/80 border-cyan-700/80 shadow-sm animate-bulb-flicker',
      lampInnerLitDkl: 'bg-cyan-400 text-slate-950 font-bold',
      lampInnerLitSammler: 'bg-cyan-300 text-slate-950 font-bold',
      lampInnerLitHell: 'bg-cyan-300 text-slate-950 font-bold',
      lampSocketBg: 'bg-slate-950',
      lampSocketBorder: 'border-slate-800',
      lampSocketInnerBg: 'bg-slate-900',
      lampSocketInnerText: 'text-slate-400',
      lampSocketInnerShadow: 'shadow-inner',
      litLampBadgeDkl: 'text-cyan-300 bg-cyan-950/60 border-cyan-800/80',
      litLampBadgeSammler: 'text-cyan-200 bg-cyan-950/80 border-cyan-600/80 shadow-[0_0_10px_rgba(6,182,212,0.4)]',
      litLampBadgeHell: 'text-cyan-300 bg-cyan-950/60 border-cyan-800/80',
      textureMetal: '',
      batteryPanelStop0: '#0f172a',
      batteryPanelStop100: '#020617',
      batteryBrassStop0: '#38bdf8',
      batteryBrassStop40: '#0284c7',
      batteryBrassStop80: '#0369a1',
      batteryBrassStop100: '#075985',
      batteryBakeliteStop0: '#334155',
      batteryBakeliteStop40: '#1e293b',
      batteryBakeliteStop85: '#0f172a',
      batteryBakeliteStop100: '#020617',
      batteryPlateShadowOpacity: '0.6',
      batteryRectStroke: '#334155',
      batteryAxleFill: '#1e293b',
      batteryAxleStroke: '#475569',
      batteryArcStroke: '#0f172a',
      batteryKnobBaseFill: '#020617',
      batteryKnobBaseStroke: '#334155',
      batteryKnobHandleStroke: '#0f172a',
      batteryKnobRidgeFill: '#1e293b',
      batteryKnobRidgeStroke: '#334155',
      batteryHubStroke: '#334155',
      batteryHubCenterFill: '#020617',
      batteryArrowStroke: '#0284c7',
      mixBlendMode: '',
      rotorDecoration: 'bg-cyan-500/5',
      rotorDecorationHover: 'group-hover:bg-cyan-500/10',
      applyButton: 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 font-bold shadow-md active:translate-y-0.5',
      buttonDangerHighlight: 'bg-rose-600 hover:bg-rose-500 text-white',
      textDanger: 'text-rose-400',
      borderDanger: 'border-rose-800',
      dangerPanelBg: 'bg-rose-950/40',
      buttonMutedHover: 'hover:bg-slate-800',
      rotorIconWrapper: 'bg-slate-900 border-4 border-slate-800 shadow-inner',
      textMutedAlt: 'text-slate-400',
      bgSuccess: 'bg-emerald-950/60',
      borderSuccess: 'border-emerald-800/80',
      textSuccess: 'text-emerald-400',
      bgSuccessStrong: 'bg-emerald-900/80',
      textSuccessStrong: 'text-emerald-300',
      bgSuccessDark: 'bg-slate-950',
      borderSuccessAlt: 'border-emerald-800/50',
      textSuccessAlt: 'text-emerald-400',
      bgDangerAlt: 'bg-rose-950/60',
      borderDangerAlt: 'border-rose-800/80',
      textDangerAlt: 'text-rose-300',
      textDangerStrong: 'text-rose-400',
      textDangerHeader: 'text-rose-200',
      buttonActive: 'border-cyan-400 text-cyan-300',
      buttonInactive: 'border-transparent text-slate-400 hover:text-slate-200',
      rotorSettingPanelDecoration: 'bg-cyan-500/5 group-hover:bg-cyan-500/10',
      rotorSettingSelect: 'bg-slate-950 border-slate-700 text-slate-200 font-sans text-sm shadow-inner',
      rotorWindowControlAlt: 'text-slate-400 hover:text-cyan-400 bg-slate-950 border border-slate-800',
      rotorWindowControlMuted: 'text-slate-400 hover:text-cyan-400 hover:bg-slate-800',
      rotorWindowControlAction: 'text-slate-400 hover:text-cyan-400',
      textMutedStrong: 'text-slate-300',
      borderStrong: 'border-slate-800',
      tableHeaderMuted: 'text-slate-400',
      tableRowHover: 'hover:bg-slate-800/80',
      tableRowActive: 'bg-slate-800',
      tableCellAccent: 'bg-slate-900 border-slate-800',
      textDangerStrongAlt: 'text-rose-400',
      buttonSuccessSolid: 'bg-emerald-600 text-white hover:bg-emerald-500',
      buttonMutedSolid: 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 shadow-sm',
      tabActive: 'bg-cyan-500 text-slate-950 font-bold',
      tabInactive: 'text-slate-400 hover:text-slate-200',
      inputBgAlt: 'bg-slate-950 border-slate-800',
      cardInteractive: 'bg-slate-900 hover:bg-slate-800/80 border-slate-800',
      bgSuccessFaint: 'bg-emerald-950/40 border-emerald-800/40',
      textSuccessFaint: 'text-emerald-400',
      buttonDisabled: 'bg-slate-800/50 text-slate-600',
      rotorWindowContainer: 'bg-slate-950 border-slate-800 border shadow-inner',
      tableDayTag: 'bg-slate-900 border-slate-800',
      tabSwitchButton: 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700',
      codebookHeaderButton: 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border-slate-700',
      indicatorBgAlt: 'bg-slate-950 text-slate-400 border-slate-800 shadow-sm',
      codebookSheetBg: 'bg-slate-900 text-slate-200 border-slate-800',
      codebookStamp: 'border-cyan-400 text-cyan-400',
      tableHeaderBg: 'bg-slate-950',
      kenngruppenTag: 'bg-cyan-950/80 text-cyan-300 border-cyan-800/80 shadow-xs',
      textAccentExtra: 'text-cyan-300',
      textAccentStrong: 'text-cyan-400',
      bgAccentFaint: 'bg-cyan-950/60',
      bgAccentSolid: 'bg-cyan-500',
      bgAccentHover: 'bg-cyan-400',
      circleIndicator: 'bg-slate-900 border-cyan-500/60 text-cyan-400',
    };
  }
}

class AmberCrtThemeFactory extends ThemeFactory {
  public createTheme(): ThemeProduct {
    return {
      appBg: 'bg-zinc-950 text-amber-100 selection:bg-amber-900/60',
      appTexture: '',
      sidebarBg: 'bg-zinc-900 border-zinc-800',
      headerBg: 'bg-zinc-900 border-zinc-800',
      panelBg: 'bg-zinc-900 border-amber-900/40 shadow-xl',
      panelInner: 'bg-zinc-950 border-amber-900/30',
      modalBg: 'bg-zinc-900 border-amber-800/60 text-amber-100 shadow-2xl',
      modalTexture: '',
      modalHeaderBg: 'bg-zinc-950 border-amber-900/50',
      modalFooterBg: 'bg-zinc-950 border-amber-900/50',
      wellBg: 'bg-zinc-950',
      wellInnerBg: 'bg-zinc-950',
      textPrimary: 'text-amber-100',
      textSecondary: 'text-amber-400/80',
      textAccent: 'text-amber-400',
      textMuted: 'text-amber-300/70',
      borderBase: 'border-amber-900/40',
      borderAccent: 'border-amber-500/60',
      activeBadge: 'bg-amber-500 text-zinc-950 font-bold',
      inactiveBadge: 'bg-zinc-900 text-amber-400/60 hover:bg-zinc-800 border border-amber-900/40',
      successBadge: 'bg-emerald-950/80 border-emerald-800/80 text-emerald-400',
      dangerBadge: 'bg-rose-950/80 text-rose-300 border-rose-800/80',
      accentLightBg: 'bg-amber-950/60',
      accentSolidBg: 'bg-amber-500',
      mutedBg: 'bg-zinc-800/80',
      indicatorBg: 'bg-zinc-900',
      successLightBg: 'bg-emerald-950/50',
      dangerLightBg: 'bg-rose-950/50',
      successText: 'text-emerald-400',
      dangerText: 'text-rose-400',
      sliderAccent: 'accent-amber-500',
      progressFill: 'bg-amber-500',
      buttonPrimary: 'bg-zinc-800 hover:bg-zinc-700 text-amber-200 border-amber-900/50 shadow-sm',
      buttonHighlight: 'bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold shadow-amber-500/20',
      buttonDanger: 'bg-rose-950/80 hover:bg-rose-900 text-rose-200 border-rose-800',
      buttonDangerSolid: 'bg-rose-600 text-white hover:bg-rose-500',
      dangerBg: 'bg-rose-950/60 border-rose-800/60 text-rose-200',
      controlButton: 'bg-zinc-800 hover:bg-zinc-700 text-amber-300',
      controlButtonActive: 'bg-amber-500 text-zinc-950 border-amber-400 font-bold',
      secondaryButtonHover: 'hover:bg-amber-950/40',
      inputBg: 'bg-zinc-950 border-amber-800 text-amber-300 focus:border-amber-400 focus:ring-1 focus:ring-amber-400',
      keyShape: 'rounded-md',
      keyBase: 'border-amber-900/60 bg-zinc-800/90 shadow-md hover:border-amber-600 hover:bg-zinc-700 text-amber-200',
      keyPressed: 'bg-amber-500 text-zinc-950 border-amber-300 ring-2 ring-amber-400/50 shadow-[0_0_15px_rgba(245,158,11,0.6)] font-bold',
      keyCompactBase: 'bg-zinc-800 border border-amber-900/50 text-amber-200 shadow-sm hover:bg-zinc-700',
      keyCompactPressed: 'bg-amber-500 border-amber-300 text-zinc-950 ring-2 ring-amber-400/50 font-bold',
      lampShape: 'rounded-md',
      lampBase: 'bg-zinc-950 border-zinc-800 text-amber-900/60 shadow-inner',
      lampLit: 'bg-amber-400 border-amber-200 text-zinc-950 shadow-[0_0_22px_rgba(251,191,36,0.9)] font-bold scale-105',
      lampDim: 'bg-amber-950/70 border-amber-800/60 text-amber-500 shadow-sm animate-bulb-flicker',
      lampLitGlow: 'bg-amber-400 text-zinc-950 shadow-[0_0_15px_rgba(251,191,36,0.8)]',
      signalPulse: 'bg-amber-400 text-zinc-950 shadow-[0_0_15px_rgba(251,191,36,0.8)]',
      signalGradient: 'linear-gradient(to right, #d97706, #f59e0b, #fbbf24)',
      activeKeyBg: 'bg-amber-950',
      activeKeyText: 'text-amber-200',
      keyboardPanelBg: 'bg-zinc-900 border-amber-900/40 shadow-lg',
      lampboardPanelBg: 'bg-zinc-900/90 border-amber-900/40 shadow-lg',
      compactPlateBg: 'bg-zinc-900 border border-amber-900/40 shadow-md',
      paperTapeBg: 'bg-zinc-950 text-amber-300 border border-amber-900/60',
      paperTapeText: 'text-amber-300',
      paperTapeBorder: 'border-amber-500',
      paperTapeBorderActive: 'border-amber-400',
      selectBg: 'bg-zinc-950 text-amber-200 border-amber-800',
      fontHeader: 'font-mono font-semibold tracking-tight',
      fontBody: 'font-sans',
      fontMono: 'font-mono text-[0.9em]',
      fontRotor: 'font-mono font-bold text-amber-400',
      statusHighlight: 'bg-zinc-900 border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.25)]',
      buttonSuccess: 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-sm',
      buttonMuted: 'border-amber-900/50 bg-zinc-800/80 text-amber-300 hover:bg-zinc-700 hover:text-amber-100 shadow-xs',
      chartBarPlaintext: 'bg-zinc-700 group-hover:bg-zinc-600',
      chartBarCiphertext: 'bg-amber-500 group-hover:bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.3)] group-hover:shadow-[0_0_10px_rgba(245,158,11,0.6)]',
      chartBarBaseline: 'border-amber-900/40',
      paperTapeCopyButton: 'bg-amber-500 text-zinc-950 hover:bg-amber-400 font-semibold',
      rotorWindowBg: 'bg-zinc-950',
      rotorWindowBorder: 'border-amber-900/50',
      rotorWindowShadow: 'shadow-inner',
      rotorWindowControl: 'text-amber-400/70 hover:text-amber-400',
      lampLitDkl: 'bg-amber-500 border-amber-300 scale-105 shadow-[0_0_18px_rgba(245,158,11,0.8)]',
      lampLitSammler: 'bg-amber-400 border-white scale-105 shadow-[0_0_22px_rgba(251,191,36,0.95)]',
      lampDimDkl: 'bg-amber-950/60 border-amber-800/60 shadow-sm animate-bulb-flicker',
      lampDimSammler: 'bg-amber-950/80 border-amber-700/80 shadow-sm animate-bulb-flicker',
      lampInnerLitDkl: 'bg-amber-400 text-zinc-950 font-bold',
      lampInnerLitSammler: 'bg-amber-300 text-zinc-950 font-bold',
      lampInnerLitHell: 'bg-amber-300 text-zinc-950 font-bold',
      lampSocketBg: 'bg-zinc-950',
      lampSocketBorder: 'border-amber-900/40',
      lampSocketInnerBg: 'bg-zinc-900',
      lampSocketInnerText: 'text-amber-400/80',
      lampSocketInnerShadow: 'shadow-inner',
      litLampBadgeDkl: 'text-amber-300 bg-amber-950/60 border-amber-800/80',
      litLampBadgeSammler: 'text-amber-200 bg-amber-950/80 border-amber-600/80 shadow-[0_0_10px_rgba(245,158,11,0.4)]',
      litLampBadgeHell: 'text-amber-300 bg-amber-950/60 border-amber-800/80',
      textureMetal: '',
      batteryPanelStop0: '#18181b',
      batteryPanelStop100: '#09090b',
      batteryBrassStop0: '#fbbf24',
      batteryBrassStop40: '#f59e0b',
      batteryBrassStop80: '#d97706',
      batteryBrassStop100: '#b45309',
      batteryBakeliteStop0: '#27272a',
      batteryBakeliteStop40: '#18181b',
      batteryBakeliteStop85: '#09090b',
      batteryBakeliteStop100: '#000000',
      batteryPlateShadowOpacity: '0.7',
      batteryRectStroke: '#451a03',
      batteryAxleFill: '#18181b',
      batteryAxleStroke: '#78350f',
      batteryArcStroke: '#09090b',
      batteryKnobBaseFill: '#09090b',
      batteryKnobBaseStroke: '#451a03',
      batteryKnobHandleStroke: '#09090b',
      batteryKnobRidgeFill: '#18181b',
      batteryKnobRidgeStroke: '#451a03',
      batteryHubStroke: '#451a03',
      batteryHubCenterFill: '#09090b',
      batteryArrowStroke: '#f59e0b',
      mixBlendMode: '',
      rotorDecoration: 'bg-amber-500/5',
      rotorDecorationHover: 'group-hover:bg-amber-500/10',
      applyButton: 'bg-amber-500 text-zinc-950 hover:bg-amber-400 font-bold shadow-md active:translate-y-0.5',
      buttonDangerHighlight: 'bg-rose-600 hover:bg-rose-500 text-white',
      textDanger: 'text-rose-400',
      borderDanger: 'border-rose-800',
      dangerPanelBg: 'bg-rose-950/40',
      buttonMutedHover: 'hover:bg-zinc-800',
      rotorIconWrapper: 'bg-zinc-900 border-4 border-amber-900/40 shadow-inner',
      textMutedAlt: 'text-amber-400/80',
      bgSuccess: 'bg-emerald-950/60',
      borderSuccess: 'border-emerald-800/80',
      textSuccess: 'text-emerald-400',
      bgSuccessStrong: 'bg-emerald-900/80',
      textSuccessStrong: 'text-emerald-300',
      bgSuccessDark: 'bg-zinc-950',
      borderSuccessAlt: 'border-emerald-800/50',
      textSuccessAlt: 'text-emerald-400',
      bgDangerAlt: 'bg-rose-950/60',
      borderDangerAlt: 'border-rose-800/80',
      textDangerAlt: 'text-rose-300',
      textDangerStrong: 'text-rose-400',
      textDangerHeader: 'text-rose-200',
      buttonActive: 'border-amber-400 text-amber-300',
      buttonInactive: 'border-transparent text-amber-400/60 hover:text-amber-200',
      rotorSettingPanelDecoration: 'bg-amber-500/5 group-hover:bg-amber-500/10',
      rotorSettingSelect: 'bg-zinc-950 border-amber-800 text-amber-200 font-mono text-sm shadow-inner',
      rotorWindowControlAlt: 'text-amber-400/70 hover:text-amber-400 bg-zinc-950 border border-amber-900/50',
      rotorWindowControlMuted: 'text-amber-400/70 hover:text-amber-400 hover:bg-zinc-800',
      rotorWindowControlAction: 'text-amber-400/70 hover:text-amber-400',
      textMutedStrong: 'text-amber-200',
      borderStrong: 'border-amber-900/50',
      tableHeaderMuted: 'text-amber-400/70',
      tableRowHover: 'hover:bg-zinc-800/80',
      tableRowActive: 'bg-zinc-800',
      tableCellAccent: 'bg-zinc-900 border-amber-900/40',
      textDangerStrongAlt: 'text-rose-400',
      buttonSuccessSolid: 'bg-emerald-600 text-white hover:bg-emerald-500',
      buttonMutedSolid: 'bg-zinc-800 hover:bg-zinc-700 text-amber-200 border-amber-900/50 shadow-sm',
      tabActive: 'bg-amber-500 text-zinc-950 font-bold',
      tabInactive: 'text-amber-400/70 hover:text-amber-200',
      inputBgAlt: 'bg-zinc-950 border-amber-900/50',
      cardInteractive: 'bg-zinc-900 hover:bg-zinc-800/80 border-amber-900/40',
      bgSuccessFaint: 'bg-emerald-950/40 border-emerald-800/40',
      textSuccessFaint: 'text-emerald-400',
      buttonDisabled: 'bg-zinc-800/50 text-zinc-600',
      rotorWindowContainer: 'bg-zinc-950 border-amber-900/50 border shadow-inner',
      tableDayTag: 'bg-zinc-900 border-amber-900/40',
      tabSwitchButton: 'bg-zinc-800 border-amber-900/50 text-amber-300 hover:bg-zinc-700',
      codebookHeaderButton: 'bg-zinc-800 hover:bg-zinc-700 text-amber-300 border-amber-900/50',
      indicatorBgAlt: 'bg-zinc-950 text-amber-400/80 border-amber-900/50 shadow-sm',
      codebookSheetBg: 'bg-zinc-900 text-amber-200 border-amber-900/50',
      codebookStamp: 'border-amber-400 text-amber-400',
      tableHeaderBg: 'bg-zinc-950',
      kenngruppenTag: 'bg-amber-950/80 text-amber-300 border-amber-800/80 shadow-xs',
      textAccentExtra: 'text-amber-300',
      textAccentStrong: 'text-amber-400',
      bgAccentFaint: 'bg-amber-950/60',
      bgAccentSolid: 'bg-amber-500',
      bgAccentHover: 'bg-amber-400',
      circleIndicator: 'bg-zinc-900 border-amber-500/60 text-amber-400',
    };
  }
}

class EmeraldCrtThemeFactory extends ThemeFactory {
  public createTheme(): ThemeProduct {
    return {
      appBg: 'bg-zinc-950 text-emerald-100 selection:bg-emerald-900/60',
      appTexture: '',
      sidebarBg: 'bg-zinc-900 border-emerald-950',
      headerBg: 'bg-zinc-900 border-emerald-950',
      panelBg: 'bg-zinc-900 border-emerald-900/40 shadow-xl',
      panelInner: 'bg-zinc-950 border-emerald-900/30',
      modalBg: 'bg-zinc-900 border-emerald-800/60 text-emerald-100 shadow-2xl',
      modalTexture: '',
      modalHeaderBg: 'bg-zinc-950 border-emerald-900/50',
      modalFooterBg: 'bg-zinc-950 border-emerald-900/50',
      wellBg: 'bg-zinc-950',
      wellInnerBg: 'bg-zinc-950',
      textPrimary: 'text-emerald-100',
      textSecondary: 'text-emerald-400/80',
      textAccent: 'text-emerald-400',
      textMuted: 'text-emerald-300/70',
      borderBase: 'border-emerald-900/40',
      borderAccent: 'border-emerald-500/60',
      activeBadge: 'bg-emerald-500 text-zinc-950 font-bold',
      inactiveBadge: 'bg-zinc-900 text-emerald-400/60 hover:bg-zinc-800 border border-emerald-900/40',
      successBadge: 'bg-emerald-950/80 border-emerald-700/80 text-emerald-300',
      dangerBadge: 'bg-rose-950/80 text-rose-300 border-rose-800/80',
      accentLightBg: 'bg-emerald-950/60',
      accentSolidBg: 'bg-emerald-500',
      mutedBg: 'bg-zinc-800/80',
      indicatorBg: 'bg-zinc-900',
      successLightBg: 'bg-emerald-950/50',
      dangerLightBg: 'bg-rose-950/50',
      successText: 'text-emerald-400',
      dangerText: 'text-rose-400',
      sliderAccent: 'accent-emerald-500',
      progressFill: 'bg-emerald-500',
      buttonPrimary: 'bg-zinc-800 hover:bg-zinc-700 text-emerald-200 border-emerald-900/50 shadow-sm',
      buttonHighlight: 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold shadow-emerald-500/20',
      buttonDanger: 'bg-rose-950/80 hover:bg-rose-900 text-rose-200 border-rose-800',
      buttonDangerSolid: 'bg-rose-600 text-white hover:bg-rose-500',
      dangerBg: 'bg-rose-950/60 border-rose-800/60 text-rose-200',
      controlButton: 'bg-zinc-800 hover:bg-zinc-700 text-emerald-300',
      controlButtonActive: 'bg-emerald-500 text-zinc-950 border-emerald-400 font-bold',
      secondaryButtonHover: 'hover:bg-emerald-950/40',
      inputBg: 'bg-zinc-950 border-emerald-800 text-emerald-300 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400',
      keyShape: 'rounded-md',
      keyBase: 'border-emerald-900/60 bg-zinc-800/90 shadow-md hover:border-emerald-600 hover:bg-zinc-700 text-emerald-200',
      keyPressed: 'bg-emerald-500 text-zinc-950 border-emerald-300 ring-2 ring-emerald-400/50 shadow-[0_0_15px_rgba(16,185,129,0.6)] font-bold',
      keyCompactBase: 'bg-zinc-800 border border-emerald-900/50 text-emerald-200 shadow-sm hover:bg-zinc-700',
      keyCompactPressed: 'bg-emerald-500 border-emerald-300 text-zinc-950 ring-2 ring-emerald-400/50 font-bold',
      lampShape: 'rounded-md',
      lampBase: 'bg-zinc-950 border-zinc-800 text-emerald-900/60 shadow-inner',
      lampLit: 'bg-emerald-400 border-emerald-200 text-zinc-950 shadow-[0_0_22px_rgba(52,211,153,0.9)] font-bold scale-105',
      lampDim: 'bg-emerald-950/70 border-emerald-800/60 text-emerald-500 shadow-sm animate-bulb-flicker',
      lampLitGlow: 'bg-emerald-400 text-zinc-950 shadow-[0_0_15px_rgba(52,211,153,0.8)]',
      signalPulse: 'bg-emerald-400 text-zinc-950 shadow-[0_0_15px_rgba(52,211,153,0.8)]',
      signalGradient: 'linear-gradient(to right, #059669, #10b981, #34d399)',
      activeKeyBg: 'bg-emerald-950',
      activeKeyText: 'text-emerald-200',
      keyboardPanelBg: 'bg-zinc-900 border-emerald-900/40 shadow-lg',
      lampboardPanelBg: 'bg-zinc-900/90 border-emerald-900/40 shadow-lg',
      compactPlateBg: 'bg-zinc-900 border border-emerald-900/40 shadow-md',
      paperTapeBg: 'bg-zinc-950 text-emerald-300 border border-emerald-900/60',
      paperTapeText: 'text-emerald-300',
      paperTapeBorder: 'border-emerald-500',
      paperTapeBorderActive: 'border-emerald-400',
      selectBg: 'bg-zinc-950 text-emerald-200 border-emerald-800',
      fontHeader: 'font-mono font-semibold tracking-tight',
      fontBody: 'font-sans',
      fontMono: 'font-mono text-[0.9em]',
      fontRotor: 'font-mono font-bold text-emerald-400',
      statusHighlight: 'bg-zinc-900 border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.25)]',
      buttonSuccess: 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-sm',
      buttonMuted: 'border-emerald-900/50 bg-zinc-800/80 text-emerald-300 hover:bg-zinc-700 hover:text-emerald-100 shadow-xs',
      chartBarPlaintext: 'bg-zinc-700 group-hover:bg-zinc-600',
      chartBarCiphertext: 'bg-emerald-500 group-hover:bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.3)] group-hover:shadow-[0_0_10px_rgba(16,185,129,0.6)]',
      chartBarBaseline: 'border-emerald-900/40',
      paperTapeCopyButton: 'bg-emerald-500 text-zinc-950 hover:bg-emerald-400 font-semibold',
      rotorWindowBg: 'bg-zinc-950',
      rotorWindowBorder: 'border-emerald-900/50',
      rotorWindowShadow: 'shadow-inner',
      rotorWindowControl: 'text-emerald-400/70 hover:text-emerald-400',
      lampLitDkl: 'bg-emerald-500 border-emerald-300 scale-105 shadow-[0_0_18px_rgba(16,185,129,0.8)]',
      lampLitSammler: 'bg-emerald-400 border-white scale-105 shadow-[0_0_22px_rgba(52,211,153,0.95)]',
      lampDimDkl: 'bg-emerald-950/60 border-emerald-800/60 shadow-sm animate-bulb-flicker',
      lampDimSammler: 'bg-emerald-950/80 border-emerald-700/80 shadow-sm animate-bulb-flicker',
      lampInnerLitDkl: 'bg-emerald-400 text-zinc-950 font-bold',
      lampInnerLitSammler: 'bg-emerald-300 text-zinc-950 font-bold',
      lampInnerLitHell: 'bg-emerald-300 text-zinc-950 font-bold',
      lampSocketBg: 'bg-zinc-950',
      lampSocketBorder: 'border-emerald-900/40',
      lampSocketInnerBg: 'bg-zinc-900',
      lampSocketInnerText: 'text-emerald-400/80',
      lampSocketInnerShadow: 'shadow-inner',
      litLampBadgeDkl: 'text-emerald-300 bg-emerald-950/60 border-emerald-800/80',
      litLampBadgeSammler: 'text-emerald-200 bg-emerald-950/80 border-emerald-600/80 shadow-[0_0_10px_rgba(16,185,129,0.4)]',
      litLampBadgeHell: 'text-emerald-300 bg-emerald-950/60 border-emerald-800/80',
      textureMetal: '',
      batteryPanelStop0: '#18181b',
      batteryPanelStop100: '#09090b',
      batteryBrassStop0: '#34d399',
      batteryBrassStop40: '#10b981',
      batteryBrassStop80: '#059669',
      batteryBrassStop100: '#047857',
      batteryBakeliteStop0: '#27272a',
      batteryBakeliteStop40: '#18181b',
      batteryBakeliteStop85: '#09090b',
      batteryBakeliteStop100: '#000000',
      batteryPlateShadowOpacity: '0.7',
      batteryRectStroke: '#064e3b',
      batteryAxleFill: '#18181b',
      batteryAxleStroke: '#047857',
      batteryArcStroke: '#09090b',
      batteryKnobBaseFill: '#09090b',
      batteryKnobBaseStroke: '#064e3b',
      batteryKnobHandleStroke: '#09090b',
      batteryKnobRidgeFill: '#18181b',
      batteryKnobRidgeStroke: '#064e3b',
      batteryHubStroke: '#064e3b',
      batteryHubCenterFill: '#09090b',
      batteryArrowStroke: '#10b981',
      mixBlendMode: '',
      rotorDecoration: 'bg-emerald-500/5',
      rotorDecorationHover: 'group-hover:bg-emerald-500/10',
      applyButton: 'bg-emerald-500 text-zinc-950 hover:bg-emerald-400 font-bold shadow-md active:translate-y-0.5',
      buttonDangerHighlight: 'bg-rose-600 hover:bg-rose-500 text-white',
      textDanger: 'text-rose-400',
      borderDanger: 'border-rose-800',
      dangerPanelBg: 'bg-rose-950/40',
      buttonMutedHover: 'hover:bg-zinc-800',
      rotorIconWrapper: 'bg-zinc-900 border-4 border-emerald-900/40 shadow-inner',
      textMutedAlt: 'text-emerald-400/80',
      bgSuccess: 'bg-emerald-950/60',
      borderSuccess: 'border-emerald-800/80',
      textSuccess: 'text-emerald-400',
      bgSuccessStrong: 'bg-emerald-900/80',
      textSuccessStrong: 'text-emerald-300',
      bgSuccessDark: 'bg-zinc-950',
      borderSuccessAlt: 'border-emerald-800/50',
      textSuccessAlt: 'text-emerald-400',
      bgDangerAlt: 'bg-rose-950/60',
      borderDangerAlt: 'border-rose-800/80',
      textDangerAlt: 'text-rose-300',
      textDangerStrong: 'text-rose-400',
      textDangerHeader: 'text-rose-200',
      buttonActive: 'border-emerald-400 text-emerald-300',
      buttonInactive: 'border-transparent text-emerald-400/60 hover:text-emerald-200',
      rotorSettingPanelDecoration: 'bg-emerald-500/5 group-hover:bg-emerald-500/10',
      rotorSettingSelect: 'bg-zinc-950 border-emerald-800 text-emerald-200 font-mono text-sm shadow-inner',
      rotorWindowControlAlt: 'text-emerald-400/70 hover:text-emerald-400 bg-zinc-950 border border-emerald-900/50',
      rotorWindowControlMuted: 'text-emerald-400/70 hover:text-emerald-400 hover:bg-zinc-800',
      rotorWindowControlAction: 'text-emerald-400/70 hover:text-emerald-400',
      textMutedStrong: 'text-emerald-200',
      borderStrong: 'border-emerald-900/50',
      tableHeaderMuted: 'text-emerald-400/70',
      tableRowHover: 'hover:bg-zinc-800/80',
      tableRowActive: 'bg-zinc-800',
      tableCellAccent: 'bg-zinc-900 border-emerald-900/40',
      textDangerStrongAlt: 'text-rose-400',
      buttonSuccessSolid: 'bg-emerald-600 text-white hover:bg-emerald-500',
      buttonMutedSolid: 'bg-zinc-800 hover:bg-zinc-700 text-emerald-200 border-emerald-900/50 shadow-sm',
      tabActive: 'bg-emerald-500 text-zinc-950 font-bold',
      tabInactive: 'text-emerald-400/70 hover:text-emerald-200',
      inputBgAlt: 'bg-zinc-950 border-emerald-900/50',
      cardInteractive: 'bg-zinc-900 hover:bg-zinc-800/80 border-emerald-900/40',
      bgSuccessFaint: 'bg-emerald-950/40 border-emerald-800/40',
      textSuccessFaint: 'text-emerald-400',
      buttonDisabled: 'bg-zinc-800/50 text-zinc-600',
      rotorWindowContainer: 'bg-zinc-950 border-emerald-900/50 border shadow-inner',
      tableDayTag: 'bg-zinc-900 border-emerald-900/40',
      tabSwitchButton: 'bg-zinc-800 border-emerald-900/50 text-emerald-300 hover:bg-zinc-700',
      codebookHeaderButton: 'bg-zinc-800 hover:bg-zinc-700 text-emerald-300 border-emerald-900/50',
      indicatorBgAlt: 'bg-zinc-950 text-emerald-400/80 border-emerald-900/50 shadow-sm',
      codebookSheetBg: 'bg-zinc-900 text-emerald-200 border-emerald-900/50',
      codebookStamp: 'border-emerald-400 text-emerald-400',
      tableHeaderBg: 'bg-zinc-950',
      kenngruppenTag: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80 shadow-xs',
      textAccentExtra: 'text-emerald-300',
      textAccentStrong: 'text-emerald-400',
      bgAccentFaint: 'bg-emerald-950/60',
      bgAccentSolid: 'bg-emerald-500',
      bgAccentHover: 'bg-emerald-400',
      circleIndicator: 'bg-zinc-900 border-emerald-500/60 text-emerald-400',
    };
  }
}

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextType>({ theme: 'vintage', setTheme: () => {} });

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeName>('vintage');
  
  useEffect(() => {
    try {
      const saved = localStorage.getItem('enigma_theme') as ThemeName;
      if (AVAILABLE_THEMES.some((t) => t.id === saved)) setTheme(saved);
    } catch(e) {}
  }, []);

  const handleSetTheme = (t: ThemeName) => {
    setTheme(t);
    try { localStorage.setItem('enigma_theme', t); } catch(e) {}
    AVAILABLE_THEMES.forEach((themeOpt) => {
      document.documentElement.classList.remove(`theme-${themeOpt.id}`);
    });
    if (t !== 'vintage') {
      document.documentElement.classList.add(`theme-${t}`);
    }
  };

  return <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);

export const getTheme = (theme: ThemeName): ThemeProduct => {
  let factory: ThemeFactory;
  switch (theme) {
    case 'vintage':
      factory = new VintageThemeFactory();
      break;
    case 'vintage-navy':
      factory = new VintageNavyThemeFactory();
      break;
    case 'modern-dark':
      factory = new ModernDarkThemeFactory();
      break;
    case 'amber-crt':
      factory = new AmberCrtThemeFactory();
      break;
    case 'emerald-crt':
      factory = new EmeraldCrtThemeFactory();
      break;
    case 'modern':
    default:
      factory = new ModernThemeFactory();
      break;
  }
  return factory.createTheme();
};


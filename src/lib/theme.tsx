import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeName = 'vintage' | 'modern';

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



interface ThemeContextType {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextType>({ theme: 'vintage', setTheme: () => {} });

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeName>('vintage');
  
  useEffect(() => {
    try {
      const saved = localStorage.getItem('enigma_theme');
      if (saved === 'vintage' || saved === 'modern') setTheme(saved);
    } catch(e) {}
  }, []);

  const handleSetTheme = (t: ThemeName) => {
    setTheme(t);
    try { localStorage.setItem('enigma_theme', t); } catch(e) {}
    if (t === 'modern') {
      document.documentElement.classList.add('theme-modern');
    } else {
      document.documentElement.classList.remove('theme-modern');
    }
  };

  return <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);

export const getTheme = (theme: ThemeName): ThemeProduct => {
  const factory: ThemeFactory = theme === 'vintage' ? new VintageThemeFactory() : new ModernThemeFactory();
  return factory.createTheme();
};


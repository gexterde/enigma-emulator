import React, { useState, useEffect, useRef } from 'react';
import { useTheme, getTheme } from '../lib/theme';
import { OpticalFilterColor, OPTICAL_FILTERS } from '../lib/morseTrainingData';
import { playShutterClickSound } from '../lib/audio';

export interface AldisLampProps {
  isFlashing: boolean;
  filter: OpticalFilterColor;
  onFilterChange: (f: OpticalFilterColor) => void;
  brightness: number; // 0.2 to 1.0 or 20 to 100
  onBrightnessChange: (b: number) => void;
  opticalWpm: number; // 2 to 20 WPM
  onOpticalWpmChange: (wpm: number) => void;
  showTransmittedChar: boolean; // Setting to hide or show transmitted character in practice
  onToggleShowTransmittedChar: (show: boolean) => void;
  outputChannel: 'audio' | 'optical' | 'both';
  onOutputChannelChange: (mode: 'audio' | 'optical' | 'both') => void;
  isTheaterMode: boolean;
  onToggleTheaterMode: () => void;
  onManualPulse?: (active: boolean, symbol?: string) => void;
  onManualFlashStart?: () => void;
  onManualFlashEnd?: () => void;
  currentActiveChar?: string;
  currentSymbol?: string;
  flashSymbol?: string;
  flashChar?: string;
  isPlaying?: boolean;
  onStartStop?: () => void;
  startStopLabel?: string;
  onRepeat?: () => void;
}

export const AldisLamp: React.FC<AldisLampProps> = ({
  isFlashing,
  filter,
  onFilterChange,
  brightness,
  onBrightnessChange,
  opticalWpm,
  onOpticalWpmChange,
  showTransmittedChar,
  onToggleShowTransmittedChar,
  outputChannel,
  onOutputChannelChange,
  isTheaterMode,
  onToggleTheaterMode,
  onManualPulse,
  onManualFlashStart,
  onManualFlashEnd,
  currentActiveChar,
  currentSymbol,
  flashSymbol,
  flashChar,
  isPlaying,
  onStartStop,
  startStopLabel,
  onRepeat
}) => {
  const { theme } = useTheme();
  const t = getTheme(theme);
  const filterConfig = OPTICAL_FILTERS[filter] || OPTICAL_FILTERS.amber;
  const [showOpticsDrawer, setShowOpticsDrawer] = useState<boolean>(false);
  const [popupDismissed, setPopupDismissed] = useState<boolean>(false);
  const [lastFlashedChar, setLastFlashedChar] = useState<string>('');
  const [lastFlashedSymbol, setLastFlashedSymbol] = useState<string>('');
  const [showFloatingTimer, setShowFloatingTimer] = useState<boolean>(false);
  const [shutterSoundEnabled, setShutterSoundEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('aldis_shutter_sound');
      return saved !== null ? saved === 'true' : false;
    } catch {
      return false;
    }
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState<boolean>(true);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, []);

  // Play realistic mechanical shutter clicks on flash state transition
  const prevFlashingRef = useRef<boolean>(isFlashing);
  useEffect(() => {
    if (prevFlashingRef.current !== isFlashing) {
      if (shutterSoundEnabled) {
        playShutterClickSound(true, isFlashing);
      }
      prevFlashingRef.current = isFlashing;
    }
  }, [isFlashing, shutterSoundEnabled]);

  const handleToggleShutterSound = () => {
    setShutterSoundEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('aldis_shutter_sound', String(next));
      } catch {}
      return next;
    });
  };

  // Normalize brightness value (handles both 0-1 and 0-100 scales)
  const normBrightness = brightness > 1 ? brightness / 100 : brightness;
  const activeSym = flashSymbol || currentSymbol;
  const activeCh = flashChar || currentActiveChar;
  const ditDurationMs = Math.round(1200 / Math.max(1, opticalWpm));

  useEffect(() => {
    if (activeCh) setLastFlashedChar(activeCh);
    if (activeSym) setLastFlashedSymbol(activeSym);
  }, [activeCh, activeSym]);

  useEffect(() => {
    if (isFlashing) {
      setPopupDismissed(false);
      setShowFloatingTimer(true);
    } else {
      const timer = setTimeout(() => {
        setShowFloatingTimer(false);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [isFlashing]);

  const handleRepeatClick = () => {
    setPopupDismissed(false);
    if (onRepeat) {
      onRepeat();
    } else if (onStartStop) {
      onStartStop();
    }
  };

  const handleFlashDown = () => {
    if (onManualFlashStart) onManualFlashStart();
    if (onManualPulse) onManualPulse(true, '.');
  };

  const handleFlashUp = () => {
    if (onManualFlashEnd) onManualFlashEnd();
    if (onManualPulse) onManualPulse(false);
  };

  return (
    <>
      <div ref={containerRef} className={`${t.panelBg} border ${t.borderBase} rounded-lg p-3 sm:p-4 shadow-panel ${t.appTexture} relative overflow-hidden space-y-3`}>
        {/* Header Bar - Responsive and Clean */}
      <div className={`pb-2 border-b ${t.borderBase} flex flex-wrap justify-between items-center gap-2`}>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-amber-500 text-base">flashlight_on</span>
          <h3 className={`text-ui-header ${t.fontHeader} ${t.textSecondary} text-xs uppercase tracking-wider`}>
            Aldis Optical Shutter Lamp
          </h3>
          {/* Active Flash indicator dot */}
          <span
            className={`inline-block w-2.5 h-2.5 rounded-full transition-all ${
              isFlashing ? 'bg-amber-400 ring-4 ring-amber-400/40 animate-pulse' : 'bg-zinc-700'
            }`}
            title={isFlashing ? 'Transmitting Light Beam' : 'Shutter Closed'}
          />
          <span className="hidden sm:inline-block text-[10px] font-mono text-zinc-500">
            ({opticalWpm} WPM • {ditDurationMs}ms Dit)
          </span>
        </div>

        {/* Top Controls: Channel + Theater + Drawer toggle */}
        <div className="flex items-center gap-1.5 ml-auto">
          {/* Medium toggle */}
          <div className="flex items-center gap-0.5 bg-black/25 p-0.5 rounded border border-zinc-700/50 text-[10px] font-mono">
            <button
              type="button"
              onClick={() => onOutputChannelChange('optical')}
              className={`px-1.5 py-0.5 rounded transition-all cursor-pointer flex items-center gap-1 ${
                outputChannel === 'optical'
                  ? 'bg-amber-500/30 text-amber-300 font-bold border border-amber-500/50 shadow-xs'
                  : `${t.textMuted} hover:${t.textPrimary}`
              }`}
              title="Soundless visual light pulses only"
            >
              <span className="material-symbols-outlined text-[13px]">flare</span>
              <span className="text-[10px]">Light</span>
            </button>

            <button
              type="button"
              onClick={() => onOutputChannelChange('both')}
              className={`px-1.5 py-0.5 rounded transition-all cursor-pointer flex items-center gap-1 ${
                outputChannel === 'both'
                  ? `${t.bgAccentFaint} ${t.textAccentStrong} ${t.borderAccent} border font-bold shadow-xs`
                  : `${t.textMuted} hover:${t.textPrimary}`
              }`}
              title="Synchronized Audio sidetone + Optical shutter"
            >
              <span className="material-symbols-outlined text-[13px]">sync</span>
              <span className="text-[10px]">Dual</span>
            </button>

            <button
              type="button"
              onClick={() => onOutputChannelChange('audio')}
              className={`px-1.5 py-0.5 rounded transition-all cursor-pointer flex items-center gap-1 ${
                outputChannel === 'audio'
                  ? `${t.bgAccentSolid} text-white font-bold shadow-xs`
                  : `${t.textMuted} hover:${t.textPrimary}`
              }`}
              title="Switch to Audio sidetone only (hides flashlight)"
            >
              <span className="material-symbols-outlined text-[13px]">volume_up</span>
              <span className="hidden sm:inline text-[10px]">Audio</span>
            </button>
          </div>

          {/* Repeat Flash Button */}
          <button
            type="button"
            onClick={handleRepeatClick}
            className="p-1 sm:px-2 sm:py-1 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 text-xs transition-colors flex items-center gap-1 cursor-pointer font-bold"
            title="Repeat Flash Signal (↺)"
          >
            <span className="material-symbols-outlined text-[14px]">replay</span>
            <span className="hidden sm:inline text-[10px] font-mono">Repeat</span>
          </button>

          {/* Theater Mode Button */}
          <button
            type="button"
            onClick={onToggleTheaterMode}
            className="p-1 sm:px-2 sm:py-1 rounded bg-black/40 border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 text-xs transition-colors flex items-center gap-1 cursor-pointer"
            title="Open Fullscreen Theater Lighthouse Mode"
          >
            <span className="material-symbols-outlined text-[14px]">fullscreen</span>
            <span className="hidden sm:inline text-[10px] font-mono">Theater</span>
          </button>

          {/* Optics Settings Toggle */}
          <button
            type="button"
            onClick={() => setShowOpticsDrawer((prev) => !prev)}
            className={`p-1 sm:px-2 sm:py-1 rounded border text-xs transition-colors flex items-center gap-1 cursor-pointer ${
              showOpticsDrawer
                ? `${t.bgAccentFaint} ${t.borderAccent} ${t.textAccentStrong}`
                : `${t.panelInner} ${t.borderBase} ${t.textMuted} hover:${t.textPrimary}`
            }`}
            title="Toggle Optics Flash Speed, Brightness, and Character Hint controls"
          >
            <span className="material-symbols-outlined text-[14px]">tune</span>
            <span className="text-[10px] font-mono">Speed & Optics</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Chamber: Lamp Lens & Active State */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-lg border border-zinc-800/80 bg-radial from-zinc-900 via-zinc-950 to-black relative select-none shadow-inner overflow-hidden">
        
        {/* Ambient Wall Light Spill */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-75"
          style={{
            background: `radial-gradient(circle, ${filterConfig.glowColor} 0%, transparent 70%)`,
            opacity: isFlashing ? normBrightness * 0.5 : 0
          }}
        />

        {/* Center / Left: Circular Aldis Optical Lens */}
        <div className="flex items-center gap-4 z-10 w-full sm:w-auto justify-center sm:justify-start">
          <div
            className={`relative w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-zinc-700 bg-zinc-950 flex items-center justify-center cursor-pointer shadow-xl transition-all duration-75 shrink-0 ${
              isFlashing ? 'scale-105 ring-4 ring-amber-500/40' : 'hover:border-zinc-500'
            }`}
            onMouseDown={handleFlashDown}
            onMouseUp={handleFlashUp}
            onTouchStart={handleFlashDown}
            onTouchEnd={handleFlashUp}
            title="Click or hold to manually flash shutter beacon"
          >
            {/* Outer Shutter Flange */}
            <div className="absolute inset-1 rounded-full border border-zinc-800 pointer-events-none" />
            
            {/* Concentric Fresnel Lens Rings */}
            <div className="absolute inset-2.5 rounded-full border border-zinc-800/80 pointer-events-none" />
            <div className="absolute inset-5 rounded-full border border-zinc-800/50 pointer-events-none" />

            {/* Inner Bulb Core / Reflector */}
            <div
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all duration-75 relative overflow-hidden"
              style={{
                background: isFlashing
                  ? filterConfig.lampOnBg
                  : 'radial-gradient(circle, #27272a 0%, #18181b 50%, #09090b 100%)',
                boxShadow: isFlashing ? filterConfig.bloomCss : 'none',
                opacity: isFlashing ? normBrightness : 0.65
              }}
            >
              {/* Filament wire */}
              <div
                className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 transition-all duration-75 ${
                  isFlashing
                    ? 'border-white bg-white/95 shadow-[0_0_15px_#fff] scale-125'
                    : 'border-zinc-700 bg-transparent'
                }`}
              />

              {/* Glare Highlight */}
              {isFlashing && (
                <div className="absolute top-2 left-2.5 w-3 h-1.5 rounded-full bg-white/80 blur-xs" />
              )}
            </div>

            {/* Shutter Louvers */}
            <div className="absolute inset-0 rounded-full pointer-events-none flex flex-col justify-around py-3 opacity-25">
              <div className="w-full h-px bg-black" />
              <div className="w-full h-px bg-black" />
              <div className="w-full h-px bg-black" />
            </div>
          </div>

          {/* Shutter Telemetry & Optical Info */}
          <div className="space-y-1 text-center sm:text-left">
            <div className={`text-[9px] font-mono uppercase tracking-widest ${t.textMuted}`}>
              Shutter Telemetry
            </div>
            <div className={`text-xs font-mono font-bold uppercase ${
              isFlashing ? `${filterConfig.accentClass} animate-pulse` : 'text-zinc-400'
            }`}>
              {isFlashing 
                ? (activeSym === '-' ? 'DAH ( —— )' : activeSym === '.' ? 'DIT ( • )' : 'BEAM ACTIVE')
                : 'SHUTTER CLOSED'
              }
            </div>
            {/* Show character ONLY if enabled in settings, preventing spoilers during real decoding practice */}
            {showTransmittedChar && activeCh ? (
              <div className="text-[10px] font-mono text-zinc-400">
                Hint Char: <strong className="text-white text-xs">{activeCh}</strong>
              </div>
            ) : (
              <div className="text-[9px] font-mono text-zinc-500">
                Rate: <span className="text-zinc-300 font-semibold">{opticalWpm} WPM</span> ({ditDurationMs}ms)
              </div>
            )}
            <div className="text-[9px] font-mono text-zinc-500">
              Filter: <span className="text-zinc-300 font-semibold">{filterConfig.label.split(' ')[0]}</span> ({Math.round(normBrightness * 100)}%)
            </div>
          </div>
        </div>

        {/* Center / Right: Quick Filter Selector Chips + Optional Start Button */}
        <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto z-10">
          {/* Filter Pills */}
          <div className="flex items-center justify-center sm:justify-end gap-1.5 w-full">
            {(Object.keys(OPTICAL_FILTERS) as OpticalFilterColor[]).map((fKey) => {
              const conf = OPTICAL_FILTERS[fKey];
              const isSelected = filter === fKey;
              return (
                <button
                  key={fKey}
                  type="button"
                  onClick={() => onFilterChange(fKey)}
                  className={`px-2 py-1 rounded border text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? `bg-black/50 ${conf.accentClass} ${conf.ringBorder} ring-1 ring-amber-500/40 shadow-xs`
                      : 'bg-black/20 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                  title={`${conf.label} - ${conf.sublabel}`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-black/40 shrink-0"
                    style={{ background: conf.glowColor }}
                  />
                  <span>{conf.id.toUpperCase()}</span>
                </button>
              );
            })}
          </div>

          {/* Integrated Start / Stop & Repeat buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleRepeatClick}
              className={`px-3 py-2 rounded ${t.fontHeader} font-bold text-xs uppercase tracking-wider transition-all border active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 shadow-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40`}
              title="Repeat last transmitted flash signal (↺)"
            >
              <span className="material-symbols-outlined text-sm font-bold">replay</span>
              <span>Repeat Flash</span>
            </button>

            {onStartStop && (
              <button
                type="button"
                onClick={onStartStop}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded ${t.fontHeader} font-bold text-xs uppercase tracking-wider transition-all border active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 shadow-md ${
                  isPlaying
                    ? t.dangerBadge
                    : `${t.bgAccentSolid} hover:${t.bgAccentHover} text-white ${t.borderAccent}`
                }`}
              >
                <span className="material-symbols-outlined text-sm">
                  {isPlaying ? 'stop' : 'play_arrow'}
                </span>
                <span>{startStopLabel || (isPlaying ? 'Stop Signal' : 'Start Transmission')}</span>
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Expandable Optics Tuning Drawer (Flash Frequency, Brightness & Practice Settings) */}
      {showOpticsDrawer && (
        <div className={`p-3 rounded border ${t.borderBase} ${t.panelInner} space-y-3 animate-fadeIn text-xs`}>
          
          {/* Flash Frequency / Speed (WPM) Slider & Presets */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[11px] font-mono">
              <span className={`font-bold ${t.textPrimary} flex items-center gap-1`}>
                <span className="material-symbols-outlined text-xs text-amber-500">speed</span>
                Flash Frequency / Optical Speed:
              </span>
              <span className={`${t.textAccentStrong} font-bold font-mono`}>
                {opticalWpm} WPM <span className="text-[10px] text-zinc-400 font-normal">({ditDurationMs}ms Dit pulse)</span>
              </span>
            </div>
            
            <input
              type="range"
              min="2"
              max="20"
              step="1"
              value={opticalWpm}
              onChange={(e) => onOpticalWpmChange(parseInt(e.target.value, 10))}
              className={`w-full h-1.5 ${t.panelInner} rounded cursor-pointer accent-amber-500`}
            />

            {/* Quick Frequency Presets */}
            <div className="flex flex-wrap gap-1 pt-0.5">
              {[
                { label: '3 WPM (Slow 400ms)', wpmVal: 3 },
                { label: '5 WPM (Moderate 240ms)', wpmVal: 5 },
                { label: '8 WPM (Standard 150ms)', wpmVal: 8 },
                { label: '12 WPM (Rapid 100ms)', wpmVal: 12 },
                { label: '16 WPM (Fast 75ms)', wpmVal: 16 }
              ].map((p) => (
                <button
                  key={p.wpmVal}
                  type="button"
                  onClick={() => onOpticalWpmChange(p.wpmVal)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-all cursor-pointer ${
                    opticalWpm === p.wpmVal
                      ? `${t.bgAccentFaint} ${t.textAccentStrong} ${t.borderAccent} font-bold shadow-xs`
                      : `${t.panelBg} ${t.borderBase} ${t.textMuted} hover:${t.textPrimary}`
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Lamp Intensity / Aperture slider */}
          <div className="space-y-1 pt-1 border-t border-zinc-800">
            <div className={`flex justify-between text-[11px] font-mono ${t.textMuted}`}>
              <span>Lamp Aperture Beam Brightness</span>
              <span className={`${t.textAccentStrong} font-bold`}>{Math.round(normBrightness * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="1.0"
              step="0.05"
              value={normBrightness}
              onChange={(e) => onBrightnessChange(parseFloat(e.target.value))}
              className={`w-full h-1.5 ${t.panelInner} rounded cursor-pointer accent-amber-500`}
            />
            <div className="flex justify-between text-[9px] text-zinc-500 font-mono">
              <span>Dim (Night Deck 20%)</span>
              <span>Nominal (60%)</span>
              <span>Max Strobe (100%)</span>
            </div>
          </div>

          {/* Setting: Show or Hide Transmitted Character during Practice */}
          <div className={`pt-2 border-t ${t.borderBase} flex items-center justify-between gap-2`}>
            <div className="space-y-0.5">
              <div className={`text-[11px] font-mono font-bold ${t.textPrimary} flex items-center gap-1`}>
                <span className="material-symbols-outlined text-xs text-amber-500">visibility</span>
                Show Transmitted Character Hint
              </div>
              <div className={`text-[10px] ${t.textMuted}`}>
                {showTransmittedChar 
                  ? 'Active: Revealed on telemetry (Beginner assist)' 
                  : 'Hidden: Blind test mode (Audited practice)'}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onToggleShowTransmittedChar(!showTransmittedChar)}
              className={`px-2.5 py-1 rounded text-xs font-mono font-bold border transition-colors cursor-pointer flex items-center gap-1.5 ${
                showTransmittedChar
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/60'
                  : `${t.panelBg} ${t.borderBase} ${t.textMuted} hover:${t.textPrimary}`
              }`}
            >
              <span className="material-symbols-outlined text-xs">
                {showTransmittedChar ? 'check_box' : 'check_box_outline_blank'}
              </span>
              <span>{showTransmittedChar ? 'Hint ON' : 'Hint OFF'}</span>
            </button>
          </div>

          {/* Setting: Mechanical Shutter Acoustic Clicks */}
          <div className={`pt-2 border-t ${t.borderBase} flex items-center justify-between gap-2`}>
            <div className="space-y-0.5">
              <div className={`text-[11px] font-mono font-bold ${t.textPrimary} flex items-center gap-1`}>
                <span className="material-symbols-outlined text-xs text-amber-500">graphic_eq</span>
                Shutter Blade Mechanical Clicks
              </div>
              <div className={`text-[10px] ${t.textMuted}`}>
                {shutterSoundEnabled 
                  ? 'Active: Vintage acoustic blind clicks on open/close' 
                  : 'Silent: Pure soundless optical beam flashes'}
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleShutterSound}
              className={`px-2.5 py-1 rounded text-xs font-mono font-bold border transition-colors cursor-pointer flex items-center gap-1.5 ${
                shutterSoundEnabled
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/60'
                  : `${t.panelBg} ${t.borderBase} ${t.textMuted} hover:${t.textPrimary}`
              }`}
            >
              <span className="material-symbols-outlined text-xs">
                {shutterSoundEnabled ? 'volume_up' : 'volume_off'}
              </span>
              <span>{shutterSoundEnabled ? 'Clicks ON' : 'Clicks OFF'}</span>
            </button>
          </div>


          {/* Visual Morse Training Guidance Tip */}
          <div className={`text-[11px] ${t.textSecondary} leading-relaxed pt-1 border-t ${t.borderBase}`}>
            <span className={`font-bold ${t.textAccent} font-mono uppercase mr-1`}>Visual Telegraphy Tip:</span>
            Human visual shutter perception requires lower frequencies than acoustic CW. <strong>3–8 WPM</strong> allows the eye to cleanly distinguish Dits from Dahs without visual persistence fatigue.
          </div>
        </div>
      )}

      {/* FULLSCREEN THEATER LIGHTHOUSE MODAL */}
      {isTheaterMode && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-6 animate-fadeIn select-none">
          {/* Top Control Bar */}
          <div className="absolute top-6 left-6 right-6 flex justify-between items-center text-white">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-amber-500 text-2xl">flashlight_on</span>
              <div>
                <h2 className="font-mono font-bold text-sm tracking-wider uppercase">Aldis Signal Beacon — Theater Mode</h2>
                <p className="text-zinc-400 text-xs">Soundless Optical Reception Room • {opticalWpm} WPM ({ditDurationMs}ms Dit)</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {onStartStop && (
                <button
                  type="button"
                  onClick={onStartStop}
                  className={`px-4 py-2 rounded-lg font-mono text-xs uppercase font-bold tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer ${
                    isPlaying
                      ? 'bg-rose-700 hover:bg-rose-600 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">{isPlaying ? 'stop' : 'play_arrow'}</span>
                  <span>{isPlaying ? 'Stop' : 'Start'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={onToggleTheaterMode}
                className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-xs uppercase tracking-wider border border-zinc-600 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">close</span>
                Exit (Esc)
              </button>
            </div>
          </div>

          {/* Massive Center Shutter Lamp */}
          <div className="relative flex flex-col items-center justify-center">
            {/* Expansive Screen Bloom */}
            <div
              className="absolute w-[450px] h-[450px] sm:w-[650px] sm:h-[650px] rounded-full pointer-events-none transition-opacity duration-75 blur-3xl"
              style={{
                background: filterConfig.glowColor,
                opacity: isFlashing ? normBrightness * 0.5 : 0
              }}
            />

            {/* Giant Lamp Bezel */}
            <div
              className={`relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 rounded-full border-8 border-zinc-700 bg-zinc-950 flex items-center justify-center shadow-2xl transition-all duration-75 ${
                isFlashing ? 'scale-105 ring-8 ring-amber-500/40' : ''
              }`}
            >
              <div
                className="w-48 h-48 sm:w-60 sm:h-60 md:w-72 md:h-72 rounded-full flex items-center justify-center transition-all duration-75 relative overflow-hidden"
                style={{
                  background: isFlashing
                    ? filterConfig.lampOnBg
                    : 'radial-gradient(circle, #27272a 0%, #18181b 50%, #09090b 100%)',
                  boxShadow: isFlashing ? filterConfig.bloomCss : 'none',
                  opacity: isFlashing ? normBrightness : 0.6
                }}
              >
                <div
                  className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full border-4 transition-all duration-75 ${
                    isFlashing
                      ? 'border-white bg-white/95 shadow-[0_0_30px_#fff] scale-125'
                      : 'border-zinc-700 bg-transparent'
                  }`}
                />
              </div>
            </div>

            {/* Flash Ticker Status */}
            <div className="mt-8 text-center space-y-1">
              <div className="text-zinc-500 font-mono text-xs uppercase tracking-widest">
                {isFlashing ? 'SIGNAL TRANSMISSION IN PROGRESS' : 'AWAITING OPTICAL TRANSMISSION'}
              </div>
              <div className={`font-mono text-2xl sm:text-3xl font-bold ${filterConfig.accentClass}`}>
                {isFlashing 
                  ? (activeSym === '-' ? 'DAH ( —— )' : 'DIT ( • )') 
                  : (showTransmittedChar && activeCh ? `HINT: ${activeCh}` : '• • •')}
              </div>
            </div>
          </div>

          {/* Quick Footer Controls in Theater Mode */}
          <div className="absolute bottom-6 flex flex-wrap items-center justify-center gap-2 bg-zinc-900/90 px-4 py-2 rounded-xl border border-zinc-700">
            <span className="text-xs font-mono text-zinc-400">Filter:</span>
            {(Object.keys(OPTICAL_FILTERS) as OpticalFilterColor[]).map((fKey) => (
              <button
                key={fKey}
                type="button"
                onClick={() => onFilterChange(fKey)}
                className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-colors cursor-pointer ${
                  filter === fKey ? 'bg-amber-600 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {fKey.toUpperCase()}
              </button>
            ))}

            <div className="h-4 w-px bg-zinc-700 mx-1" />

            <span className="text-xs font-mono text-zinc-400">Flash Speed:</span>
            {[3, 5, 8, 12].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onOpticalWpmChange(s)}
                className={`px-2 py-0.5 rounded text-xs font-mono font-bold transition-colors cursor-pointer ${
                  opticalWpm === s ? 'bg-amber-500 text-black' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {s} WPM
              </button>
            ))}
          </div>
        </div>
      )}
      </div>

      {/* Floating Popup Flashlight Bit (Always shown, without the letter) */}
      {!popupDismissed && (
        <div className="fixed top-4 right-4 z-[9999] p-2.5 sm:p-3 rounded-2xl shadow-2xl flex items-center gap-2.5 bg-zinc-950/95 border border-amber-500/50 backdrop-blur-md transition-all text-white font-mono animate-fadeIn select-none">
          {/* Glowing Flashlight Lens */}
          <div className="relative flex items-center justify-center shrink-0">
            <div 
              className={`w-9 h-9 rounded-full transition-all duration-75 flex items-center justify-center ${
                isFlashing ? 'scale-110 ring-4 ring-amber-400/60' : ''
              }`}
              style={{ 
                backgroundColor: filterConfig.glowColor,
                boxShadow: isFlashing 
                  ? `0 0 35px ${filterConfig.glowColor}, 0 0 15px rgba(255,255,255,0.9) inset` 
                  : `0 0 10px ${filterConfig.glowColor}55`,
                opacity: isFlashing ? Math.max(0.85, normBrightness) : 0.4
              }}
            >
              <span className={`material-symbols-outlined text-base font-bold ${isFlashing ? 'text-black' : 'text-zinc-300'}`}>
                {isFlashing ? 'flashlight_on' : 'flashlight_off'}
              </span>
            </div>
          </div>

          {/* Status Label */}
          <div className="flex flex-col pr-1">
            <div className="text-[10px] uppercase text-amber-400 font-bold tracking-wider flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${isFlashing ? 'bg-amber-400 animate-pulse' : 'bg-zinc-600'}`} />
              <span>{isFlashing ? 'Flashing Beam' : 'Flashlight'}</span>
            </div>
          </div>

          {/* Action Buttons: Repeat Flash & Start/Stop & Controls */}
          <div className="flex items-center gap-1.5 border-l border-zinc-700/80 pl-2">
            <button
              type="button"
              onClick={handleRepeatClick}
              className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-all flex items-center gap-1 shadow-md cursor-pointer active:scale-95"
              title="Repeat Flash Signal (↺)"
            >
              <span className="material-symbols-outlined text-sm font-bold">replay</span>
              <span className="text-[11px] uppercase tracking-wider font-bold">Repeat</span>
            </button>

            {onStartStop && (
              <button
                type="button"
                onClick={onStartStop}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center shadow-md active:scale-95 ${
                  isPlaying ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-amber-500/40'
                }`}
                title={isPlaying ? 'Stop Signal' : 'Start Signal'}
              >
                <span className="material-symbols-outlined text-sm">
                  {isPlaying ? 'stop' : 'play_arrow'}
                </span>
              </button>
            )}

            {!isInView && (
              <button
                type="button"
                onClick={() => {
                  containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                title="Scroll to Flashlight"
              >
                <span className="material-symbols-outlined text-sm">north</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setPopupDismissed(true)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 text-xs transition-colors cursor-pointer"
              title="Dismiss floating flashlight"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

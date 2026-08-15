import React, { useState, useEffect, useRef } from 'react';
import { useTheme, CustomTheme } from '../theme';

const PRESETS = [
  {
    name: 'Desert Outpost',
    colors: {
      bgApp: '#1e1915',
      bgPanel: '#2c251e',
      bgPanelInner: '#3a3128',
      textPrimary: '#f5e6d3',
      textSecondary: '#ab9a87',
      textAccent: '#dca842',
      lampLitBg: '#e65c00',
      borderBase: '#504337',
      radioChassisBg: 'rgba(44,37,30,0.95)',
      paperTapeBg: '#eedbc5',
      paperTapeText: '#3a2b1a',
      rotorWindowBg: '#3a3128',
      rotorLabelColor: '#dca842',
      keyBaseBg: '#3a3128',
      keyPressedBg: '#dca842',
      radioNeedleBg: '#ef4444'
    }
  },
  {
    name: 'Submarine Navy',
    colors: {
      bgApp: '#080c14',
      bgPanel: '#111827',
      bgPanelInner: '#1f2937',
      textPrimary: '#f3f4f6',
      textSecondary: '#9ca3af',
      textAccent: '#3b82f6',
      lampLitBg: '#10b981',
      borderBase: '#374151',
      radioChassisBg: 'rgba(17,24,39,0.95)',
      paperTapeBg: '#e5e7eb',
      paperTapeText: '#111827',
      rotorWindowBg: '#1f2937',
      rotorLabelColor: '#3b82f6',
      keyBaseBg: '#1f2937',
      keyPressedBg: '#3b82f6',
      radioNeedleBg: '#10b981'
    }
  },
  {
    name: 'Secret Bunker',
    colors: {
      bgApp: '#0c0f0d',
      bgPanel: '#161e1a',
      bgPanelInner: '#24302b',
      textPrimary: '#e6f0ec',
      textSecondary: '#8a9e96',
      textAccent: '#10b981',
      lampLitBg: '#059669',
      borderBase: '#2d3d37',
      radioChassisBg: 'rgba(22,30,26,0.95)',
      paperTapeBg: '#d1e2db',
      paperTapeText: '#0f1714',
      rotorWindowBg: '#24302b',
      rotorLabelColor: '#10b981',
      keyBaseBg: '#24302b',
      keyPressedBg: '#10b981',
      radioNeedleBg: '#f59e0b'
    }
  },
  {
    name: 'Cyberpunk Noir',
    colors: {
      bgApp: '#0d0013',
      bgPanel: '#1a0026',
      bgPanelInner: '#2a003e',
      textPrimary: '#f9f0ff',
      textSecondary: '#cda3ff',
      textAccent: '#f000ff',
      lampLitBg: '#00f0ff',
      borderBase: '#4a006c',
      radioChassisBg: 'rgba(26,0,38,0.95)',
      paperTapeBg: '#ffe6ff',
      paperTapeText: '#330033',
      rotorWindowBg: '#2a003e',
      rotorLabelColor: '#f000ff',
      keyBaseBg: '#2a003e',
      keyPressedBg: '#f000ff',
      radioNeedleBg: '#00ffff'
    }
  },
  {
    name: 'Royal Guard',
    colors: {
      bgApp: '#1a0505',
      bgPanel: '#2c0c0c',
      bgPanelInner: '#3f1616',
      textPrimary: '#ffebe6',
      textSecondary: '#dca1a1',
      textAccent: '#f43f5e',
      lampLitBg: '#fbbf24',
      borderBase: '#5c1e1e',
      radioChassisBg: 'rgba(44,12,12,0.95)',
      paperTapeBg: '#fee2e2',
      paperTapeText: '#450a0a',
      rotorWindowBg: '#3f1616',
      rotorLabelColor: '#f43f5e',
      keyBaseBg: '#3f1616',
      keyPressedBg: '#f43f5e',
      radioNeedleBg: '#fbbf24'
    }
  }
];

export const ThemeDesigner: React.FC = () => {
  const { theme, setTheme, saveCustomTheme, customThemes, deleteCustomTheme, t } = useTheme();

  // State for current editor values (with sensible default)
  const [themeName, setThemeName] = useState('My Custom Theme');
  const [themeEnabled, setThemeEnabled] = useState(false);
  const [colors, setColors] = useState({
    bgApp: '#1c1c1c',
    bgPanel: '#2b2b2b',
    bgPanelInner: '#3a3a3a',
    textPrimary: '#eaeaea',
    textSecondary: '#aaaaaa',
    textAccent: '#f59e0b',
    lampLitBg: '#34d399',
    borderBase: '#444444',
    radioChassisBg: 'rgba(43,43,43,0.95)',
    paperTapeBg: '#eedbc5',
    paperTapeText: '#3a2b1a',
    rotorWindowBg: '#3a3a3a',
    rotorLabelColor: '#f59e0b',
    keyBaseBg: '#3a3a3a',
    keyPressedBg: '#f59e0b',
    radioNeedleBg: '#f87171',
    plugboardCableColor: '#b33939',
    plugboardCableColorEnd: '#d1ccc0',
    plugboardCableMode: 'multicolor' as 'multicolor' | 'single' | 'gradient' | 'custom',
    plugboardCableCustomColors: [
      '#b33939', '#218c74', '#227093', '#cc8e35', '#40407a',
      '#ff5252', '#33d9b2', '#34ace0', '#ffb142', '#706fd3',
      '#ff793f', '#84817a', '#d1ccc0'
    ]
  });

  // Sandbox states
  const [testKeyPressed, setTestKeyPressed] = useState(false);
  const [testRadioOn, setTestRadioOn] = useState(true);
  const [rotorValues, setRotorValues] = useState(['A', 'M', 'C']);
  const [plugConnections, setPlugConnections] = useState<Record<string, string>>({ 'A': 'B', 'B': 'A' });
  const [activePlug, setActivePlug] = useState<string | null>(null);

  // Oscilloscope canvas renderer
  const scopeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const meterCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Generate ID from name
  const themeId = 'custom-' + themeName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

  // 1. Remember/Load temporary settings on Mount
  useEffect(() => {
    try {
      const draft = localStorage.getItem('enigma_theme_designer_draft');
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed.themeName) setThemeName(parsed.themeName);
        if (parsed.themeEnabled !== undefined) setThemeEnabled(parsed.themeEnabled);
        if (parsed.colors) {
          setColors(prev => ({
            ...prev,
            ...parsed.colors
          }));
        }
      }
    } catch (e) {
      console.error('Failed to load draft from localStorage', e);
    }
  }, []);

  // 2. Automatically save draft & sync layout preview CSS on any changes
  useEffect(() => {
    const dynamicTheme: CustomTheme = {
      id: 'designer-draft',
      name: themeName,
      enabled: themeEnabled,
      colors,
      isDraft: true
    };

    saveCustomTheme(dynamicTheme);
    setTheme('designer-draft');

    try {
      localStorage.setItem('enigma_theme_designer_draft', JSON.stringify({ themeName, themeEnabled, colors }));
    } catch (e) {}
  }, [themeName, themeEnabled, colors]);

  // S-Meter moving needle visualization
  useEffect(() => {
    const canvas = meterCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let currentVal = 0.2;

    const drawMeter = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const targetVal = testRadioOn ? (testKeyPressed ? 0.85 : 0.25) : 0;
      currentVal += (targetVal - currentVal) * 0.15;

      // Arc gauge background
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height, canvas.height * 0.9, Math.PI, 0);
      ctx.strokeStyle = colors.borderBase;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Tick marks
      ctx.strokeStyle = colors.textSecondary;
      ctx.lineWidth = 1;
      for (let i = 0; i <= 10; i++) {
        const angle = Math.PI + (i / 10) * Math.PI;
        const startR = canvas.height * 0.82;
        const endR = canvas.height * 0.9;
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2 + Math.cos(angle) * startR, canvas.height + Math.sin(angle) * startR);
        ctx.lineTo(canvas.width / 2 + Math.cos(angle) * endR, canvas.height + Math.sin(angle) * endR);
        ctx.stroke();
      }

      // Draw red zones
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height, canvas.height * 0.86, Math.PI + Math.PI * 0.8, Math.PI + Math.PI);
      ctx.strokeStyle = colors.radioNeedleBg;
      ctx.lineWidth = 3;
      ctx.stroke();

      // Meter Needle
      const needleAngle = Math.PI + currentVal * Math.PI;
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, canvas.height);
      ctx.lineTo(canvas.width / 2 + Math.cos(needleAngle) * (canvas.height * 0.85), canvas.height + Math.sin(needleAngle) * (canvas.height * 0.85));
      ctx.strokeStyle = colors.radioNeedleBg;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 4;
      ctx.shadowColor = colors.radioNeedleBg;
      ctx.stroke();
      ctx.shadowBlur = 0; // Reset

      // Center peg
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height, 5, 0, Math.PI * 2);
      ctx.fillStyle = colors.borderBase;
      ctx.fill();

      animId = requestAnimationFrame(drawMeter);
    };

    drawMeter();
    return () => cancelAnimationFrame(animId);
  }, [colors, testRadioOn, testKeyPressed]);

  // Oscilloscope Scope Wave rendering loop
  useEffect(() => {
    const canvas = scopeCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let offset = 0;

    const drawScope = () => {
      ctx.fillStyle = colors.bgApp;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid line details
      ctx.strokeStyle = `${colors.textAccent}18`;
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 15) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 15) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Dynamic wave traces
      if (testRadioOn) {
        ctx.beginPath();
        ctx.strokeStyle = testKeyPressed ? colors.textAccent : `${colors.textSecondary}80`;
        ctx.lineWidth = 2;

        const amp = testKeyPressed ? canvas.height * 0.35 : 3;
        const freq = testKeyPressed ? 0.08 : 0.02;

        for (let x = 0; x < canvas.width; x++) {
          const noise = (Math.random() - 0.5) * (testKeyPressed ? 4 : 1);
          const y = canvas.height / 2 + Math.sin(x * freq + offset) * amp + noise;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        offset += 0.15;
      }

      animId = requestAnimationFrame(drawScope);
    };

    drawScope();
    return () => cancelAnimationFrame(animId);
  }, [colors, testRadioOn, testKeyPressed]);

  const handleApplyPreset = (preset: typeof PRESETS[0]) => {
    setThemeName(preset.name);
    setColors({
      ...preset.colors,
      plugboardCableColor: '#b33939',
      plugboardCableColorEnd: '#d1ccc0',
      plugboardCableMode: 'multicolor',
      plugboardCableCustomColors: [
        '#b33939', '#218c74', '#227093', '#cc8e35', '#40407a',
        '#ff5252', '#33d9b2', '#34ace0', '#ffb142', '#706fd3',
        '#ff793f', '#84817a', '#d1ccc0'
      ]
    });
  };

  const handleColorChange = (key: keyof typeof colors, val: string) => {
    setColors(prev => ({ ...prev, [key]: val }));
  };

  // 3. Discard Draft and Reset to Current Theme Selected
  const handleResetToActiveTheme = () => {
    try {
      const activeThemeId = localStorage.getItem('enigma_theme') || 'vintage';
      const matchCustom = customThemes.find(ct => ct.id === activeThemeId);
      
      if (matchCustom) {
        setThemeName(matchCustom.name);
        setColors({
          bgApp: matchCustom.colors.bgApp,
          bgPanel: matchCustom.colors.bgPanel,
          bgPanelInner: matchCustom.colors.bgPanelInner,
          textPrimary: matchCustom.colors.textPrimary,
          textSecondary: matchCustom.colors.textSecondary,
          textAccent: matchCustom.colors.textAccent,
          lampLitBg: matchCustom.colors.lampLitBg,
          borderBase: matchCustom.colors.borderBase,
          radioChassisBg: matchCustom.colors.radioChassisBg,
          paperTapeBg: matchCustom.colors.paperTapeBg || '#eedbc5',
          paperTapeText: matchCustom.colors.paperTapeText || '#3a2b1a',
          rotorWindowBg: matchCustom.colors.rotorWindowBg || matchCustom.colors.bgPanelInner,
          rotorLabelColor: matchCustom.colors.rotorLabelColor || matchCustom.colors.textAccent,
          keyBaseBg: matchCustom.colors.keyBaseBg || matchCustom.colors.bgPanelInner,
          keyPressedBg: matchCustom.colors.keyPressedBg || matchCustom.colors.textAccent,
          radioNeedleBg: matchCustom.colors.radioNeedleBg || '#f87171',
          plugboardCableColor: matchCustom.colors.plugboardCableColor || '#b33939',
          plugboardCableColorEnd: matchCustom.colors.plugboardCableColorEnd || '#d1ccc0',
          plugboardCableMode: matchCustom.colors.plugboardCableMode || 'multicolor',
          plugboardCableCustomColors: matchCustom.colors.plugboardCableCustomColors || [
            '#b33939', '#218c74', '#227093', '#cc8e35', '#40407a',
            '#ff5252', '#33d9b2', '#34ace0', '#ffb142', '#706fd3',
            '#ff793f', '#84817a', '#d1ccc0'
          ]
        });
      } else {
        // Fallback to standard presets or default Vintage
        const vintagePreset = PRESETS[0];
        setThemeName('My Custom Theme');
        setColors({
          ...vintagePreset.colors,
          plugboardCableColor: '#b33939',
          plugboardCableColorEnd: '#d1ccc0',
          plugboardCableMode: 'multicolor',
          plugboardCableCustomColors: [
            '#b33939', '#218c74', '#227093', '#cc8e35', '#40407a',
            '#ff5252', '#33d9b2', '#34ace0', '#ffb142', '#706fd3',
            '#ff793f', '#84817a', '#d1ccc0'
          ]
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  const handleSaveThemePermanently = () => {
    if (!themeName.trim()) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
      return;
    }
    const newId = `custom_${Math.random().toString(36).substr(2, 9)}`;
    const finalTheme: CustomTheme = {
      id: newId,
      name: themeName.trim(),
      enabled: true,
      colors
    };
    saveCustomTheme(finalTheme);
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  // Rotate a virtual rotor wheel
  const handleIncrementRotor = (idx: number) => {
    setRotorValues(prev => {
      const next = [...prev];
      const charCode = next[idx].charCodeAt(0);
      next[idx] = String.fromCharCode(charCode === 90 ? 65 : charCode + 1);
      return next;
    });
  };

  // Toggle plug patchboard patching
  const handleSocketClick = (char: string) => {
    if (activePlug === null) {
      setActivePlug(char);
    } else {
      if (activePlug === char) {
        setActivePlug(null);
        return;
      }
      // Connect activePlug to char
      const nextPlugs = { ...plugConnections };
      // Remove previous connections
      const oldActiveDest = nextPlugs[activePlug];
      const oldCharDest = nextPlugs[char];
      if (oldActiveDest) delete nextPlugs[oldActiveDest];
      if (oldCharDest) delete nextPlugs[oldCharDest];

      nextPlugs[activePlug] = char;
      nextPlugs[char] = activePlug;
      setPlugConnections(nextPlugs);
      setActivePlug(null);
    }
  };

  const handleClearSockets = () => {
    setPlugConnections({});
    setActivePlug(null);
  };

  return (
    <div className={`p-4 md:p-6 space-y-6 ${t.fontBody} animate-fadeIn`}>
      {/* Header Info Banner */}
      <div className={`p-5 rounded-lg border ${colors.borderBase} relative overflow-hidden shadow-md`} style={{ backgroundColor: colors.bgPanel }}>
        <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: colors.textAccent }} />
        <h2 className={`text-xl font-bold ${t.fontHeader} flex items-center gap-2 mb-2`} style={{ color: colors.textPrimary }}>
          <span className="material-symbols-outlined" style={{ color: colors.textAccent }}>palette</span>
          Dynamic Theme & Color Scheme Studio
        </h2>
        <p className="text-xs leading-relaxed max-w-3xl" style={{ color: colors.textSecondary }}>
          Modify and create custom physical skins on the fly. 
          Use the detailed settings panel below to override all machine options. 
          As you tweak colors, the whole emulator—including the sidebar, lamps, keys, rotors, wiring sockets, paper roll, and radio chassis—updates dynamically in real-time. 
          Your draft configurations persist automatically until reset.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Settings column */}
        <div className="lg:col-span-7 space-y-6">
          {/* Quick Preset Selector */}
          <div className="p-5 rounded-lg border shadow-sm" style={{ backgroundColor: colors.bgPanel, borderColor: colors.borderBase }}>
            <span className="text-[10px] uppercase font-bold tracking-wider mb-3.5 block" style={{ color: colors.textSecondary }}>
              Custom Presets & Blueprints
            </span>
            <div className="flex flex-wrap gap-2.5">
              {PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleApplyPreset(p)}
                  className="px-3.5 py-1.5 rounded text-xs font-bold font-mono transition-all border cursor-pointer active:scale-95"
                  style={{ backgroundColor: colors.bgPanelInner, borderColor: colors.borderBase, color: colors.textPrimary }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = colors.textAccent;
                    e.currentTarget.style.color = colors.textAccent;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = colors.borderBase;
                    e.currentTarget.style.color = colors.textPrimary;
                  }}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Theme Editor Form */}
          <div className="p-5 rounded-lg border space-y-5 shadow-sm" style={{ backgroundColor: colors.bgPanel, borderColor: colors.borderBase }}>
            <div>
              <label className="text-[10px] uppercase font-bold tracking-wider mb-2 block" style={{ color: colors.textSecondary }}>
                Theme Name
              </label>
              <input
                type="text"
                value={themeName}
                onChange={(e) => setThemeName(e.target.value)}
                maxLength={30}
                className="w-full px-4 py-2.5 rounded font-mono text-xs border focus:outline-none mb-3"
                style={{ backgroundColor: colors.bgPanelInner, borderColor: colors.borderBase, color: colors.textPrimary }}
              />
              <div className="flex items-center gap-2 mb-2">
                <input
                  id="theme-enabled-checkbox"
                  type="checkbox"
                  checked={themeEnabled}
                  onChange={(e) => setThemeEnabled(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="theme-enabled-checkbox" className="text-xs font-bold cursor-pointer select-none" style={{ color: colors.textPrimary }}>
                  Enable theme in visual styling drop-down by default
                </label>
              </div>
              <span className="text-[9px] mt-1.5 block" style={{ color: colors.textSecondary }}>
                Target Selector ID: <code className="font-bold">{themeId}</code>
              </span>
            </div>

            <div className="border-t border-zinc-800 my-4" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* App Background */}
              <div className="p-3 rounded-lg border flex items-center justify-between gap-4" style={{ backgroundColor: colors.bgPanelInner, borderColor: colors.borderBase }}>
                <div>
                  <span className="text-[10px] font-bold block" style={{ color: colors.textPrimary }}>App Background</span>
                  <span className="text-[9px]" style={{ color: colors.textSecondary }}>Chassis outline / floor</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-mono" style={{ color: colors.textSecondary }}>{colors.bgApp}</span>
                  <input
                    type="color"
                    value={colors.bgApp}
                    onChange={(e) => handleColorChange('bgApp', e.target.value)}
                    className="w-8 h-8 rounded border-none cursor-pointer p-0"
                  />
                </div>
              </div>

              {/* Panel Background */}
              <div className="p-3 rounded-lg border flex items-center justify-between gap-4" style={{ backgroundColor: colors.bgPanelInner, borderColor: colors.borderBase }}>
                <div>
                  <span className="text-[10px] font-bold block" style={{ color: colors.textPrimary }}>Panel & Sidebar</span>
                  <span className="text-[9px]" style={{ color: colors.textSecondary }}>Main background modules</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-mono" style={{ color: colors.textSecondary }}>{colors.bgPanel}</span>
                  <input
                    type="color"
                    value={colors.bgPanel}
                    onChange={(e) => handleColorChange('bgPanel', e.target.value)}
                    className="w-8 h-8 rounded border-none cursor-pointer p-0"
                  />
                </div>
              </div>

              {/* Panel Inner Background */}
              <div className="p-3 rounded-lg border flex items-center justify-between gap-4" style={{ backgroundColor: colors.bgPanelInner, borderColor: colors.borderBase }}>
                <div>
                  <span className="text-[10px] font-bold block" style={{ color: colors.textPrimary }}>Inner Well</span>
                  <span className="text-[9px]" style={{ color: colors.textSecondary }}>Sunken panels, inputs</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-mono" style={{ color: colors.textSecondary }}>{colors.bgPanelInner}</span>
                  <input
                    type="color"
                    value={colors.bgPanelInner}
                    onChange={(e) => handleColorChange('bgPanelInner', e.target.value)}
                    className="w-8 h-8 rounded border-none cursor-pointer p-0"
                  />
                </div>
              </div>

              {/* Primary Text */}
              <div className="p-3 rounded-lg border flex items-center justify-between gap-4" style={{ backgroundColor: colors.bgPanelInner, borderColor: colors.borderBase }}>
                <div>
                  <span className="text-[10px] font-bold block" style={{ color: colors.textPrimary }}>Primary Text</span>
                  <span className="text-[9px]" style={{ color: colors.textSecondary }}>Main headings, labels</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-mono" style={{ color: colors.textSecondary }}>{colors.textPrimary}</span>
                  <input
                    type="color"
                    value={colors.textPrimary}
                    onChange={(e) => handleColorChange('textPrimary', e.target.value)}
                    className="w-8 h-8 rounded border-none cursor-pointer p-0"
                  />
                </div>
              </div>

              {/* Secondary Text */}
              <div className="p-3 rounded-lg border flex items-center justify-between gap-4" style={{ backgroundColor: colors.bgPanelInner, borderColor: colors.borderBase }}>
                <div>
                  <span className="text-[10px] font-bold block" style={{ color: colors.textPrimary }}>Secondary Text</span>
                  <span className="text-[9px]" style={{ color: colors.textSecondary }}>Muted captions, descriptions</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-mono" style={{ color: colors.textSecondary }}>{colors.textSecondary}</span>
                  <input
                    type="color"
                    value={colors.textSecondary}
                    onChange={(e) => handleColorChange('textSecondary', e.target.value)}
                    className="w-8 h-8 rounded border-none cursor-pointer p-0"
                  />
                </div>
              </div>

              {/* Text Accent */}
              <div className="p-3 rounded-lg border flex items-center justify-between gap-4" style={{ backgroundColor: colors.bgPanelInner, borderColor: colors.borderBase }}>
                <div>
                  <span className="text-[10px] font-bold block" style={{ color: colors.textPrimary }}>Highlight / Accent</span>
                  <span className="text-[9px]" style={{ color: colors.textSecondary }}>Active dials, dials, text</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-mono" style={{ color: colors.textSecondary }}>{colors.textAccent}</span>
                  <input
                    type="color"
                    value={colors.textAccent}
                    onChange={(e) => handleColorChange('textAccent', e.target.value)}
                    className="w-8 h-8 rounded border-none cursor-pointer p-0"
                  />
                </div>
              </div>

              {/* Lamp Lit Bg */}
              <div className="p-3 rounded-lg border flex items-center justify-between gap-4" style={{ backgroundColor: colors.bgPanelInner, borderColor: colors.borderBase }}>
                <div>
                  <span className="text-[10px] font-bold block" style={{ color: colors.textPrimary }}>Lamp Glow Color</span>
                  <span className="text-[9px]" style={{ color: colors.textSecondary }}>Illuminated Enigma lamps</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-mono" style={{ color: colors.textSecondary }}>{colors.lampLitBg}</span>
                  <input
                    type="color"
                    value={colors.lampLitBg}
                    onChange={(e) => handleColorChange('lampLitBg', e.target.value)}
                    className="w-8 h-8 rounded border-none cursor-pointer p-0"
                  />
                </div>
              </div>

              {/* Border Base */}
              <div className="p-3 rounded-lg border flex items-center justify-between gap-4" style={{ backgroundColor: colors.bgPanelInner, borderColor: colors.borderBase }}>
                <div>
                  <span className="text-[10px] font-bold block" style={{ color: colors.textPrimary }}>Border Base</span>
                  <span className="text-[9px]" style={{ color: colors.textSecondary }}>Grid lines and component boxes</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-mono" style={{ color: colors.textSecondary }}>{colors.borderBase}</span>
                  <input
                    type="color"
                    value={colors.borderBase}
                    onChange={(e) => handleColorChange('borderBase', e.target.value)}
                    className="w-8 h-8 rounded border-none cursor-pointer p-0"
                  />
                </div>
              </div>

              {/* Keyboard Key Base */}
              <div className="p-3 rounded-lg border flex items-center justify-between gap-4" style={{ backgroundColor: colors.bgPanelInner, borderColor: colors.borderBase }}>
                <div>
                  <span className="text-[10px] font-bold block" style={{ color: colors.textPrimary }}>Keyboard Key Base</span>
                  <span className="text-[9px]" style={{ color: colors.textSecondary }}>Idle typewriter keycaps</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-mono" style={{ color: colors.textSecondary }}>{colors.keyBaseBg}</span>
                  <input
                    type="color"
                    value={colors.keyBaseBg}
                    onChange={(e) => handleColorChange('keyBaseBg', e.target.value)}
                    className="w-8 h-8 rounded border-none cursor-pointer p-0"
                  />
                </div>
              </div>

              {/* Keyboard Key Active */}
              <div className="p-3 rounded-lg border flex items-center justify-between gap-4" style={{ backgroundColor: colors.bgPanelInner, borderColor: colors.borderBase }}>
                <div>
                  <span className="text-[10px] font-bold block" style={{ color: colors.textPrimary }}>Keyboard Key Active</span>
                  <span className="text-[9px]" style={{ color: colors.textSecondary }}>Pressed keycaps background</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-mono" style={{ color: colors.textSecondary }}>{colors.keyPressedBg}</span>
                  <input
                    type="color"
                    value={colors.keyPressedBg}
                    onChange={(e) => handleColorChange('keyPressedBg', e.target.value)}
                    className="w-8 h-8 rounded border-none cursor-pointer p-0"
                  />
                </div>
              </div>

              {/* Paper Tape Background */}
              <div className="p-3 rounded-lg border flex items-center justify-between gap-4" style={{ backgroundColor: colors.bgPanelInner, borderColor: colors.borderBase }}>
                <div>
                  <span className="text-[10px] font-bold block" style={{ color: colors.textPrimary }}>Paper Tape Roll</span>
                  <span className="text-[9px]" style={{ color: colors.textSecondary }}>Print tape ribbon background</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-mono" style={{ color: colors.textSecondary }}>{colors.paperTapeBg}</span>
                  <input
                    type="color"
                    value={colors.paperTapeBg}
                    onChange={(e) => handleColorChange('paperTapeBg', e.target.value)}
                    className="w-8 h-8 rounded border-none cursor-pointer p-0"
                  />
                </div>
              </div>

              {/* Paper Tape Text */}
              <div className="p-3 rounded-lg border flex items-center justify-between gap-4" style={{ backgroundColor: colors.bgPanelInner, borderColor: colors.borderBase }}>
                <div>
                  <span className="text-[10px] font-bold block" style={{ color: colors.textPrimary }}>Paper Tape Ink</span>
                  <span className="text-[9px]" style={{ color: colors.textSecondary }}>Teleprinter printed characters</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-mono" style={{ color: colors.textSecondary }}>{colors.paperTapeText}</span>
                  <input
                    type="color"
                    value={colors.paperTapeText}
                    onChange={(e) => handleColorChange('paperTapeText', e.target.value)}
                    className="w-8 h-8 rounded border-none cursor-pointer p-0"
                  />
                </div>
              </div>

              {/* Rotor Window Bg */}
              <div className="p-3 rounded-lg border flex items-center justify-between gap-4" style={{ backgroundColor: colors.bgPanelInner, borderColor: colors.borderBase }}>
                <div>
                  <span className="text-[10px] font-bold block" style={{ color: colors.textPrimary }}>Rotor Chamber Bg</span>
                  <span className="text-[9px]" style={{ color: colors.textSecondary }}>Sunken gear wheels background</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-mono" style={{ color: colors.textSecondary }}>{colors.rotorWindowBg}</span>
                  <input
                    type="color"
                    value={colors.rotorWindowBg}
                    onChange={(e) => handleColorChange('rotorWindowBg', e.target.value)}
                    className="w-8 h-8 rounded border-none cursor-pointer p-0"
                  />
                </div>
              </div>

              {/* Rotor Label Text */}
              <div className="p-3 rounded-lg border flex items-center justify-between gap-4" style={{ backgroundColor: colors.bgPanelInner, borderColor: colors.borderBase }}>
                <div>
                  <span className="text-[10px] font-bold block" style={{ color: colors.textPrimary }}>Rotor Labels</span>
                  <span className="text-[9px]" style={{ color: colors.textSecondary }}>Alphabet character decals</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-mono" style={{ color: colors.textSecondary }}>{colors.rotorLabelColor}</span>
                  <input
                    type="color"
                    value={colors.rotorLabelColor}
                    onChange={(e) => handleColorChange('rotorLabelColor', e.target.value)}
                    className="w-8 h-8 rounded border-none cursor-pointer p-0"
                  />
                </div>
              </div>

              {/* S-Meter Gauge Needle */}
              <div className="p-3 rounded-lg border flex items-center justify-between gap-4" style={{ backgroundColor: colors.bgPanelInner, borderColor: colors.borderBase }}>
                <div>
                  <span className="text-[10px] font-bold block" style={{ color: colors.textPrimary }}>Meter Needle</span>
                  <span className="text-[9px]" style={{ color: colors.textSecondary }}>Transceiver dials &amp; visual indicators</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-mono" style={{ color: colors.textSecondary }}>{colors.radioNeedleBg}</span>
                  <input
                    type="color"
                    value={colors.radioNeedleBg}
                    onChange={(e) => handleColorChange('radioNeedleBg', e.target.value)}
                    className="w-8 h-8 rounded border-none cursor-pointer p-0"
                  />
                </div>
              </div>

              {/* Radio Chassis */}
              <div className="p-3 rounded-lg border flex items-center justify-between gap-4" style={{ backgroundColor: colors.bgPanelInner, borderColor: colors.borderBase }}>
                <div>
                  <span className="text-[10px] font-bold block" style={{ color: colors.textPrimary }}>Radio Steel Cover</span>
                  <span className="text-[9px]" style={{ color: colors.textSecondary }}>Steel chassis shield (supports opacity)</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="text"
                    value={colors.radioChassisBg}
                    onChange={(e) => handleColorChange('radioChassisBg', e.target.value)}
                    className="px-2 py-1 rounded text-xs font-mono font-bold border w-28 text-center focus:outline-none"
                    style={{ backgroundColor: colors.bgPanel, borderColor: colors.borderBase, color: colors.textAccent }}
                  />
                </div>
              </div>

              {/* Plugboard Cable Mode */}
              <div className="p-3 rounded-lg border flex flex-col gap-3" style={{ backgroundColor: colors.bgPanelInner, borderColor: colors.borderBase }}>
                <div>
                  <span className="text-[10px] font-bold block" style={{ color: colors.textPrimary }}>Plugboard Cable Mode</span>
                  <span className="text-[9px]" style={{ color: colors.textSecondary }}>Choose from rotational hues, solid color, gradients, or manual design</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 shrink-0">
                  <button
                    onClick={() => handleColorChange('plugboardCableMode', 'multicolor')}
                    className="px-2.5 py-1.5 text-[9px] font-bold rounded border transition-all cursor-pointer"
                    style={{
                      backgroundColor: colors.plugboardCableMode === 'multicolor' ? colors.textAccent : colors.bgPanel,
                      borderColor: colors.plugboardCableMode === 'multicolor' ? colors.textAccent : colors.borderBase,
                      color: colors.plugboardCableMode === 'multicolor' ? colors.bgApp : colors.textPrimary,
                    }}
                  >
                    Rotational Hues
                  </button>
                  <button
                    onClick={() => handleColorChange('plugboardCableMode', 'single')}
                    className="px-2.5 py-1.5 text-[9px] font-bold rounded border transition-all cursor-pointer"
                    style={{
                      backgroundColor: colors.plugboardCableMode === 'single' ? colors.textAccent : colors.bgPanel,
                      borderColor: colors.plugboardCableMode === 'single' ? colors.textAccent : colors.borderBase,
                      color: colors.plugboardCableMode === 'single' ? colors.bgApp : colors.textPrimary,
                    }}
                  >
                    Solid Color
                  </button>
                  <button
                    onClick={() => handleColorChange('plugboardCableMode', 'gradient')}
                    className="px-2.5 py-1.5 text-[9px] font-bold rounded border transition-all cursor-pointer"
                    style={{
                      backgroundColor: colors.plugboardCableMode === 'gradient' ? colors.textAccent : colors.bgPanel,
                      borderColor: colors.plugboardCableMode === 'gradient' ? colors.textAccent : colors.borderBase,
                      color: colors.plugboardCableMode === 'gradient' ? colors.bgApp : colors.textPrimary,
                    }}
                  >
                    Color Gradient
                  </button>
                  <button
                    onClick={() => handleColorChange('plugboardCableMode', 'custom')}
                    className="px-2.5 py-1.5 text-[9px] font-bold rounded border transition-all cursor-pointer"
                    style={{
                      backgroundColor: colors.plugboardCableMode === 'custom' ? colors.textAccent : colors.bgPanel,
                      borderColor: colors.plugboardCableMode === 'custom' ? colors.textAccent : colors.borderBase,
                      color: colors.plugboardCableMode === 'custom' ? colors.bgApp : colors.textPrimary,
                    }}
                  >
                    One-by-One Custom
                  </button>
                </div>
              </div>

              {/* Plugboard Cable Color (Start Color for Gradient / Base Color for Single & Multicolor) */}
              {colors.plugboardCableMode !== 'custom' && (
                <div className="p-3 rounded-lg border flex items-center justify-between gap-4" style={{ backgroundColor: colors.bgPanelInner, borderColor: colors.borderBase }}>
                  <div>
                    <span className="text-[10px] font-bold block" style={{ color: colors.textPrimary }}>
                      {colors.plugboardCableMode === 'gradient' ? 'Gradient Start Color' : 'Plugboard Wire Base Color'}
                    </span>
                    <span className="text-[9px]" style={{ color: colors.textSecondary }}>
                      {colors.plugboardCableMode === 'gradient' 
                        ? 'The starting color of the 13-wire gradient' 
                        : 'Base wire color (used directly or as hue generator source)'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono" style={{ color: colors.textSecondary }}>{colors.plugboardCableColor}</span>
                    <input
                      type="color"
                      value={colors.plugboardCableColor}
                      onChange={(e) => handleColorChange('plugboardCableColor', e.target.value)}
                      className="w-8 h-8 rounded border-none cursor-pointer p-0"
                    />
                  </div>
                </div>
              )}

              {/* Plugboard Cable End Color for Gradient Mode */}
              {colors.plugboardCableMode === 'gradient' && (
                <div className="p-3 rounded-lg border flex items-center justify-between gap-4" style={{ backgroundColor: colors.bgPanelInner, borderColor: colors.borderBase }}>
                  <div>
                    <span className="text-[10px] font-bold block" style={{ color: colors.textPrimary }}>Gradient End Color</span>
                    <span className="text-[9px]" style={{ color: colors.textSecondary }}>Colors of wires 1-13 will distribute evenly to this color</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono" style={{ color: colors.textSecondary }}>{colors.plugboardCableColorEnd || '#d1ccc0'}</span>
                    <input
                      type="color"
                      value={colors.plugboardCableColorEnd || '#d1ccc0'}
                      onChange={(e) => handleColorChange('plugboardCableColorEnd', e.target.value)}
                      className="w-8 h-8 rounded border-none cursor-pointer p-0"
                    />
                  </div>
                </div>
              )}

              {/* Custom One-By-One Wire Designing Grid */}
              {colors.plugboardCableMode === 'custom' && (
                <div className="p-3 rounded-lg border space-y-3" style={{ backgroundColor: colors.bgPanelInner, borderColor: colors.borderBase }}>
                  <div>
                    <span className="text-[10px] font-bold block" style={{ color: colors.textPrimary }}>Design Wires One-by-One</span>
                    <span className="text-[9px]" style={{ color: colors.textSecondary }}>Specify the unique color for each of the 13 connection wires:</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {Array.from({ length: 13 }).map((_, idx) => {
                      const currentCustomColors = colors.plugboardCableCustomColors || [];
                      const currentVal = currentCustomColors[idx] || '#b33939';
                      return (
                        <div key={idx} className="flex items-center gap-1.5 p-1 rounded bg-black/20 border border-white/5 justify-between">
                          <span className="text-[9px] font-mono font-bold shrink-0" style={{ color: colors.textSecondary }}>
                            Wire {idx + 1}
                          </span>
                          <input
                            type="color"
                            value={currentVal}
                            onChange={(e) => {
                              const updated = [...currentCustomColors];
                              while (updated.length < 13) {
                                updated.push('#b33939');
                              }
                              updated[idx] = e.target.value;
                              setColors(prev => ({
                                ...prev,
                                plugboardCableCustomColors: updated
                              }));
                            }}
                            className="w-5 h-5 rounded border-none cursor-pointer p-0 shrink-0"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleResetToActiveTheme}
                className="flex-1 py-3 px-4 rounded font-bold transition-all border active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                style={{ backgroundColor: colors.bgPanelInner, borderColor: colors.borderBase, color: colors.textPrimary }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = colors.textAccent}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = colors.borderBase}
              >
                <span className="material-symbols-outlined text-sm">history</span>
                Reset Draft to Active Theme
              </button>

              <button
                onClick={handleSaveThemePermanently}
                className="flex-1 py-3 px-4 rounded font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                style={{ backgroundColor: saveStatus === 'error' ? '#ef4444' : saveStatus === 'saved' ? '#10b981' : colors.textAccent, color: saveStatus === 'idle' ? colors.bgApp : '#ffffff' }}
              >
                <span className="material-symbols-outlined text-sm">
                  {saveStatus === 'error' ? 'error' : saveStatus === 'saved' ? 'check_circle' : 'save'}
                </span>
                {saveStatus === 'error' ? 'Name Required' : saveStatus === 'saved' ? 'Saved Successfully!' : 'Save as Custom Option'}
              </button>
            </div>
          </div>

          {/* Custom Theme Maintenance Card */}
          <div className="p-5 rounded-lg border space-y-4 shadow-sm animate-fadeIn" style={{ backgroundColor: colors.bgPanel, borderColor: colors.borderBase }}>
            <span className="text-[10px] uppercase font-bold tracking-wider block border-b pb-2" style={{ color: colors.textSecondary, borderColor: colors.borderBase }}>
              Custom Theme Maintenance
            </span>
            {customThemes.filter(ct => !ct.isDraft).length === 0 ? (
              <p className="text-xs italic text-center py-4" style={{ color: colors.textSecondary }}>
                No custom themes saved yet. Create and save one above!
              </p>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {customThemes.filter(ct => !ct.isDraft).map((ct) => {
                  return (
                    <div
                      key={ct.id}
                      className="p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      style={{ backgroundColor: colors.bgPanelInner, borderColor: colors.borderBase }}
                    >
                      <div className="flex flex-col">
                        <span className="text-xs font-bold" style={{ color: colors.textPrimary }}>
                          {ct.name}
                        </span>
                        <span className="text-[9px] font-mono" style={{ color: colors.textSecondary }}>
                          ID: {ct.id}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-start">
                        {/* Enabled checkbox */}
                        <label className="flex items-center gap-1.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={!!ct.enabled}
                            onChange={(e) => {
                              const updatedTheme = { ...ct, enabled: e.target.checked };
                              saveCustomTheme(updatedTheme);
                            }}
                            className="w-3.5 h-3.5 rounded border-zinc-700 bg-zinc-900 text-amber-500 cursor-pointer"
                          />
                          <span className="text-[10px] font-bold" style={{ color: colors.textPrimary }}>
                            Enabled
                          </span>
                        </label>

                        {/* Load Theme */}
                        <button
                          onClick={() => {
                            setThemeName(ct.name);
                            setThemeEnabled(!!ct.enabled);
                            if (ct.colors) {
                              setColors({
                                bgApp: ct.colors.bgApp || '#1c1c1c',
                                bgPanel: ct.colors.bgPanel || '#2b2b2b',
                                bgPanelInner: ct.colors.bgPanelInner || '#3a3a3a',
                                textPrimary: ct.colors.textPrimary || '#eaeaea',
                                textSecondary: ct.colors.textSecondary || '#aaaaaa',
                                textAccent: ct.colors.textAccent || '#f59e0b',
                                lampLitBg: ct.colors.lampLitBg || '#34d399',
                                borderBase: ct.colors.borderBase || '#444444',
                                radioChassisBg: ct.colors.radioChassisBg || 'rgba(43,43,43,0.95)',
                                paperTapeBg: ct.colors.paperTapeBg || '#eedbc5',
                                paperTapeText: ct.colors.paperTapeText || '#3a2b1a',
                                rotorWindowBg: ct.colors.rotorWindowBg || '#3a3a3a',
                                rotorLabelColor: ct.colors.rotorLabelColor || '#f59e0b',
                                keyBaseBg: ct.colors.keyBaseBg || '#3a3a3a',
                                keyPressedBg: ct.colors.keyPressedBg || '#f59e0b',
                                radioNeedleBg: ct.colors.radioNeedleBg || '#f87171',
                                plugboardCableColor: ct.colors.plugboardCableColor || '#b33939',
                                plugboardCableColorEnd: ct.colors.plugboardCableColorEnd || '#d1ccc0',
                                plugboardCableMode: ct.colors.plugboardCableMode || 'multicolor',
                                plugboardCableCustomColors: ct.colors.plugboardCableCustomColors || [
                                  '#b33939', '#218c74', '#227093', '#cc8e35', '#40407a',
                                  '#ff5252', '#33d9b2', '#34ace0', '#ffb142', '#706fd3',
                                  '#ff793f', '#84817a', '#d1ccc0'
                                ]
                              });
                            }
                          }}
                          className="px-2.5 py-1 rounded text-[10px] font-bold transition-all border cursor-pointer bg-zinc-800 hover:border-amber-500"
                          style={{ borderColor: colors.borderBase, color: colors.textPrimary }}
                        >
                          Load
                        </button>

                        {/* Delete Theme */}
                        <button
                          onClick={() => {
                            deleteCustomTheme(ct.id);
                          }}
                          className="px-2.5 py-1 rounded text-[10px] font-bold transition-colors border cursor-pointer border-red-900/50 hover:border-red-500 hover:bg-red-950/20 text-red-400"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Live Sandbox Column with ALL components preview */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-5 rounded-lg border shadow-sm space-y-5" style={{ backgroundColor: colors.bgPanel, borderColor: colors.borderBase }}>
            <div className="flex justify-between items-center border-b border-zinc-800 pb-2.5">
              <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: colors.textSecondary }}>
                All Components Dynamic Preview
              </span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>

            {/* A. ROTORS COMPONENT PREVIEW */}
            <div>
              <span className="text-[9px] font-bold tracking-wider uppercase block mb-2" style={{ color: colors.textSecondary }}>
                1. Rotor Wheels &amp; Windows
              </span>
              <div className="flex justify-center gap-3.5">
                {[0, 1, 2].map((idx) => (
                  <div key={idx} className="flex flex-col items-center gap-1">
                    <span className="text-[8px] opacity-75" style={{ color: colors.textSecondary }}>Rotor {idx + 1}</span>
                    <div className="flex items-center rounded border" style={{ borderColor: colors.borderBase }}>
                      <div
                        className="w-9 h-11 flex items-center justify-center font-bold font-mono text-base shadow-inner"
                        style={{ backgroundColor: colors.rotorWindowBg, color: colors.rotorLabelColor }}
                      >
                        {rotorValues[idx]}
                      </div>
                      <button
                        onClick={() => handleIncrementRotor(idx)}
                        className="p-1 border-l text-xs font-bold font-serif select-none cursor-pointer hover:opacity-80 active:scale-95"
                        style={{ backgroundColor: colors.bgPanelInner, borderColor: colors.borderBase, color: colors.textPrimary }}
                      >
                        ▲
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* B. PAPER TAPE RIBBON PRINT OUT PREVIEW */}
            <div>
              <span className="text-[9px] font-bold tracking-wider uppercase block mb-1.5" style={{ color: colors.textSecondary }}>
                2. Teleprinter Paper Ribbon
              </span>
              <div className="p-3.5 rounded border flex items-center justify-between font-mono text-sm tracking-widest relative overflow-hidden shadow-inner" style={{ backgroundColor: colors.paperTapeBg, borderColor: colors.textAccent }}>
                <div className="absolute top-0 bottom-0 left-0 w-3 bg-gradient-to-r from-black/10 to-transparent" />
                <div className="absolute top-0 bottom-0 right-0 w-3 bg-gradient-to-l from-black/10 to-transparent" />
                <span className="font-bold select-all" style={{ color: colors.paperTapeText }}>
                  ENIGMA * {rotorValues.join('')} * PRV
                </span>
                <span className="text-[9px] font-serif uppercase tracking-normal shrink-0 opacity-50" style={{ color: colors.paperTapeText }}>
                  Roll OK
                </span>
              </div>
            </div>

            {/* C. GLOWING LAMPBOARD PREVIEW */}
            <div>
              <span className="text-[9px] font-bold tracking-wider uppercase block mb-1.5" style={{ color: colors.textSecondary }}>
                3. Lightbulb Lampboard Grid
              </span>
              <div className="flex justify-around py-2 border rounded-lg" style={{ backgroundColor: colors.bgPanelInner, borderColor: colors.borderBase }}>
                {['Q', 'W', 'E', 'R'].map((letter) => {
                  const isLit = (letter === 'W' && testKeyPressed) || (letter === 'R' && activePlug !== null);
                  return (
                    <div key={letter} className="flex flex-col items-center">
                      <div
                        className="w-9 h-9 rounded-full border flex items-center justify-center font-bold text-xs transition-all duration-150"
                        style={{
                          backgroundColor: isLit ? colors.lampLitBg : colors.bgPanel,
                          borderColor: isLit ? colors.textPrimary : colors.borderBase,
                          color: isLit ? colors.bgApp : colors.textSecondary,
                          boxShadow: isLit ? `0 0 12px ${colors.lampLitBg}` : 'none',
                          textShadow: isLit ? `0 0 4px ${colors.textPrimary}` : 'none'
                        }}
                      >
                        {letter}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* D. TYPING KEYBOARD PREVIEW */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[9px] font-bold tracking-wider uppercase" style={{ color: colors.textSecondary }}>
                  4. Typewriter Keycaps
                </span>
                <span className="text-[8px] opacity-60" style={{ color: colors.textSecondary }}>Click &amp; hold to trigger light</span>
              </div>
              <div className="flex justify-around py-2">
                {['Q', 'W', 'E', 'R'].map((letter) => {
                  const isPressed = letter === 'W' && testKeyPressed;
                  return (
                    <button
                      key={letter}
                      onMouseDown={() => setTestKeyPressed(true)}
                      onMouseUp={() => setTestKeyPressed(false)}
                      onTouchStart={() => setTestKeyPressed(true)}
                      onTouchEnd={() => setTestKeyPressed(false)}
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all shadow-md border cursor-pointer select-none"
                      style={{
                        backgroundColor: isPressed ? colors.keyPressedBg : colors.keyBaseBg,
                        borderColor: isPressed ? colors.textPrimary : colors.borderBase,
                        color: isPressed ? colors.bgApp : colors.textPrimary
                      }}
                    >
                      {letter}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* E. PLUGBOARD WIRING PANEL PREVIEW */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[9px] font-bold tracking-wider uppercase" style={{ color: colors.textSecondary }}>
                  5. Patch Sockets &amp; Wires
                </span>
                <button
                  onClick={handleClearSockets}
                  className="text-[9px] underline hover:opacity-85"
                  style={{ color: colors.textAccent }}
                >
                  Clear Plugs
                </button>
              </div>
              <div className="flex justify-around items-center py-2.5 rounded-lg border shadow-inner" style={{ backgroundColor: colors.bgPanelInner, borderColor: colors.borderBase }}>
                {['A', 'B', 'C', 'D'].map((char) => {
                  const isConnected = plugConnections[char] !== undefined;
                  const isSelected = activePlug === char;
                  return (
                    <button
                      key={char}
                      onClick={() => handleSocketClick(char)}
                      className="flex flex-col items-center gap-1 relative cursor-pointer group"
                    >
                      {/* Socket Ring visual */}
                      <div
                        className="w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all"
                        style={{
                          backgroundColor: isSelected ? colors.textAccent : (isConnected ? colors.bgApp : colors.bgPanel),
                          borderColor: isSelected ? colors.textPrimary : (isConnected ? colors.textAccent : colors.borderBase)
                        }}
                      >
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.borderBase }} />
                      </div>
                      <span className="text-[9px] font-bold" style={{ color: isSelected ? colors.textAccent : colors.textPrimary }}>
                        {char}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[8.5px] mt-1.5 text-center leading-relaxed" style={{ color: colors.textSecondary }}>
                {activePlug ? `Connecting plug [ ${activePlug} ] ... Click another socket to patch.` : 'Click a socket pair to plug a connection wire.'}
              </p>
            </div>

            {/* F. RADIO TRANSCEIVER (STEEL, GAUGE & WAVE SCOPE) */}
            <div>
              <span className="text-[9px] font-bold tracking-wider uppercase block mb-2" style={{ color: colors.textSecondary }}>
                6. Steel Receiver Chassis &amp; Scope
              </span>
              <div className="p-4 rounded-lg border space-y-4" style={{ backgroundColor: colors.radioChassisBg, borderColor: colors.borderBase }}>
                <div className="flex justify-between items-center border-b pb-2" style={{ borderColor: colors.borderBase }}>
                  <span className="text-[10px] font-bold" style={{ color: colors.textAccent }}>TRANSCEIVER MW</span>
                  <span className="text-[9px] font-bold" style={{ color: testRadioOn ? colors.textAccent : '#f87171' }}>
                    {testRadioOn ? 'SIGNAL ACTIVE' : 'POWER OFF'}
                  </span>
                </div>

                <div className="grid grid-cols-12 gap-3 items-center">
                  {/* Gauge */}
                  <div className="col-span-5 flex flex-col items-center">
                    <canvas
                      ref={meterCanvasRef}
                      width={100}
                      height={45}
                      className="w-full h-11 object-contain"
                    />
                    <span className="text-[8px] mt-1 uppercase" style={{ color: colors.textSecondary }}>
                      S-Meter Signal
                    </span>
                  </div>

                  {/* Tuning Scope */}
                  <div className="col-span-7 flex flex-col items-center">
                    <canvas
                      ref={scopeCanvasRef}
                      width={160}
                      height={45}
                      className="w-full h-11 rounded border object-cover"
                      style={{ borderColor: colors.borderBase }}
                    />
                    <span className="text-[8px] mt-1 uppercase" style={{ color: colors.textSecondary }}>
                      Cathode Oscilloscope
                    </span>
                  </div>
                </div>

                {/* Knobs */}
                <div className="flex justify-between items-center bg-black/20 p-2 rounded border" style={{ borderColor: colors.borderBase }}>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setTestRadioOn(!testRadioOn)}
                      className="w-7 h-7 rounded-full border relative flex items-center justify-center cursor-pointer transition-transform"
                      style={{
                        backgroundColor: colors.bgPanelInner,
                        borderColor: colors.borderBase,
                        transform: `rotate(${testRadioOn ? 45 : -45}deg)`
                      }}
                    >
                      <div className="w-0.5 h-2 rounded absolute top-0" style={{ backgroundColor: colors.radioNeedleBg }} />
                    </button>
                    <span className="text-[8px] font-bold" style={{ color: colors.textSecondary }}>Strom</span>
                  </div>

                  <span className="text-[9px] font-mono tracking-widest font-bold" style={{ color: testRadioOn ? colors.textAccent : colors.textSecondary }}>
                    7.025 MHz
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

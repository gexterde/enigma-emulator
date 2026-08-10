import React, { useState, useEffect, useRef } from 'react';
import { EnigmaConfig, StepTrace } from '../types';
import { encryptChar, ALPHABET, numToChar, formatRotorRing } from '../lib/enigmaEngine';
import { playKeyClickSound } from '../lib/audio';

interface SignalPathAnimationProps {
  config: EnigmaConfig;
  initialChar?: string;
  activeKey?: string | null;
  isKeyPressed?: boolean;
  soundEnabled?: boolean;
  lastTraceResult?: {
    inputChar: string;
    outputChar: string;
    trace: StepTrace[];
    configBefore?: EnigmaConfig;
    configAfter?: EnigmaConfig;
  } | null;
}

export const SignalPathAnimation: React.FC<SignalPathAnimationProps> = ({
  config,
  initialChar = 'A',
  activeKey,
  isKeyPressed = false,
  soundEnabled = true,
  lastTraceResult
}) => {
  const [selectedChar, setSelectedChar] = useState<string>(activeKey || initialChar);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speedMs, setSpeedMs] = useState<number>(900); // ms per step
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const isM4Active = config.fourthRotor.type === 'Beta' || config.fourthRotor.type === 'Gamma';

  // Sync selected char whenever activeKey changes from external keyboard presses
  useEffect(() => {
    if (activeKey) {
      setSelectedChar(activeKey);
      setCurrentStep(0);
      setIsPlaying(true);
    }
  }, [activeKey]);

  // Use actual trace from keypress when available for selectedChar
  const useLastTrace = !!(lastTraceResult && lastTraceResult.inputChar === selectedChar);

  const traceResult = React.useMemo(() => {
    if (useLastTrace && lastTraceResult) {
      return {
        nextConfig: lastTraceResult.configAfter || config,
        result: {
          outputChar: lastTraceResult.outputChar,
          trace: lastTraceResult.trace,
          rotorsBefore: { left: '', middle: '', right: '' },
          rotorsAfter: { left: '', middle: '', right: '' }
        }
      };
    }
    return encryptChar(selectedChar, config);
  }, [selectedChar, config, useLastTrace, lastTraceResult]);

  const trace: StepTrace[] = traceResult.result.trace;
  const inputChar = selectedChar;
  const outputChar = traceResult.result.outputChar;

  // Full sequence stages: 0 (Keyboard Input) -> 1..9 (Trace Steps) -> 10 (Lampboard Output)
  const totalStages = trace.length + 2; // 0..10

  // Animation playback logic
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= totalStages - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, speedMs);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, speedMs, totalStages]);

  const handleSelectChar = (c: string) => {
    playKeyClickSound(soundEnabled);
    setSelectedChar(c);
    setCurrentStep(0);
    setIsPlaying(false);
  };

  const handlePlayPause = () => {
    if (currentStep >= totalStages - 1) {
      setCurrentStep(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleStepForward = () => {
    setIsPlaying(false);
    setCurrentStep((prev) => Math.min(prev + 1, totalStages - 1));
  };

  const handleStepBackward = () => {
    setIsPlaying(false);
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStep(0);
  };

  // Helper to get stage details including physical location in the machine
  const getStageDetails = (stepIndex: number) => {
    if (stepIndex === 0) {
      return {
        name: 'Keyboard (Tastatur)',
        location: 'Bottom Deck - Key Switch',
        icon: 'keyboard',
        direction: 'FORWARD',
        inChar: inputChar,
        outChar: inputChar,
        componentId: 'keyboard',
        note: `Key '${inputChar}' physically depressed closing electrical contact.`
      };
    }
    if (stepIndex === totalStages - 1) {
      return {
        name: 'Lampboard (Glühlampenfeld)',
        location: 'Middle Deck - Light Bulb',
        icon: 'lightbulb',
        direction: 'COMPLETE',
        inChar: outputChar,
        outChar: outputChar,
        componentId: 'lampboard',
        note: `Current illuminates bulb '${outputChar}' on the front glow panel.`
      };
    }
    const traceStep = trace[stepIndex - 1];
    let icon = 'cable';
    let location = 'Internal Wire';
    let componentId = 'other';
    let direction = 'FORWARD';

    if (traceStep.stage.includes('Plugboard (In)') || traceStep.stage.includes('Plugboard In')) {
      icon = 'settings_ethernet';
      location = 'Front Lower Panel - Steckerbrett Entry';
      componentId = 'plugboard_in';
    } else if (traceStep.stage.includes('Plugboard (Out)') || traceStep.stage.includes('Plugboard Out')) {
      icon = 'settings_ethernet';
      location = 'Front Lower Panel - Steckerbrett Exit';
      componentId = 'plugboard_out';
      direction = 'RETURN';
    } else if (traceStep.stage.includes('Reflector')) {
      icon = 'sync';
      location = 'Top Chamber - Leftmost Stator (UKW)';
      componentId = 'reflector';
      direction = 'REFLECT';
    } else if (traceStep.stage.includes('Right Rotor')) {
      icon = 'tune';
      location = `Top Chamber - Fast Rotor (${config.rightRotor.type})`;
      const isReturn = traceStep.stage.includes('Return') || traceStep.stage.includes('Reverse');
      componentId = isReturn ? 'rotor_right_rev' : 'rotor_right';
      direction = isReturn ? 'RETURN' : 'FORWARD';
    } else if (traceStep.stage.includes('Middle Rotor')) {
      icon = 'tune';
      location = `Top Chamber - Middle Rotor (${config.middleRotor.type})`;
      const isReturn = traceStep.stage.includes('Return') || traceStep.stage.includes('Reverse');
      componentId = isReturn ? 'rotor_middle_rev' : 'rotor_middle';
      direction = isReturn ? 'RETURN' : 'FORWARD';
    } else if (traceStep.stage.includes('Left Rotor')) {
      icon = 'tune';
      location = `Top Chamber - Slow Rotor (${config.leftRotor.type})`;
      const isReturn = traceStep.stage.includes('Return') || traceStep.stage.includes('Reverse');
      componentId = isReturn ? 'rotor_left_rev' : 'rotor_left';
      direction = isReturn ? 'RETURN' : 'FORWARD';
    } else if (traceStep.stage.includes('4th Rotor')) {
      icon = 'tune';
      location = `Top Chamber - 4th Rotor (${config.fourthRotor.type})`;
      const isReturn = traceStep.stage.includes('Return') || traceStep.stage.includes('Reverse');
      componentId = isReturn ? 'rotor_fourth_rev' : 'rotor_fourth';
      direction = isReturn ? 'RETURN' : 'FORWARD';
    } else if (traceStep.stage.includes('Entry Wheel')) {
      icon = 'input';
      location = 'Top Chamber - Fixed Stator (ETW)';
      componentId = 'etw';
      direction = 'FORWARD';
    }

    return {
      name: traceStep.stage,
      location,
      icon,
      direction,
      inChar: traceStep.inChar,
      outChar: traceStep.outChar,
      componentId,
      note: traceStep.note || `Transformed from '${traceStep.inChar}' to '${traceStep.outChar}'`
    };
  };

  const activeStage = getStageDetails(currentStep);

  // Structural physical blocks on the Enigma Machine diagram
  const machineBlocks = [
    { id: 'keyboard', label: '1. Keyboard', desc: 'Tastatur', pos: 'bottom-left' },
    { id: 'plugboard_in', label: '2. Plugboard (In)', desc: 'Steckerbrett', pos: 'bottom-mid' },
    { id: 'etw', label: '3. Entry Wheel', desc: 'ETW Stator', pos: 'mid-right' },
    { id: 'rotor_right', label: `4. Right Rotor`, desc: config.rightRotor.type, pos: 'top-right-1' },
    { id: 'rotor_middle', label: `5. Middle Rotor`, desc: config.middleRotor.type, pos: 'top-right-2' },
    { id: 'rotor_left', label: `6. Left Rotor`, desc: config.leftRotor.type, pos: 'top-right-3' },
    ...(isM4Active ? [
      { id: 'rotor_fourth', label: `6.5. 4th Rotor`, desc: config.fourthRotor.type, pos: 'top-right-4' },
      { id: 'rotor_fourth_rev', label: `7.5. 4th Rotor (Rev)`, desc: `${config.fourthRotor.type} Return`, pos: 'top-left-4' }
    ] : []),
    { id: 'reflector', label: `7. Reflector`, desc: config.reflector.type, pos: 'top-far-left' },
    { id: 'rotor_left_rev', label: `8. Left Rotor (Rev)`, desc: `${config.leftRotor.type} Return`, pos: 'top-left-3' },
    { id: 'rotor_middle_rev', label: `9. Middle Rotor (Rev)`, desc: `${config.middleRotor.type} Return`, pos: 'top-left-2' },
    { id: 'rotor_right_rev', label: `10. Right Rotor (Rev)`, desc: `${config.rightRotor.type} Return`, pos: 'top-left-1' },
    { id: 'plugboard_out', label: '11. Plugboard (Out)', desc: 'Steckerbrett Return', pos: 'bottom-mid-out' },
    { id: 'lampboard', label: '12. Lampboard', desc: 'Glühlampenfeld', pos: 'mid-left' }
  ];

  // Refactored helper function to render individual rotor views without duplicating HTML structure
  const renderRotorView = (
    stageSub: string,
    componentIdFwd: string,
    componentIdRev: string,
    rotorType: string,
    currentPos: number,
    ringVal: number,
    label: string
  ) => {
    const fwdStep = trace.find((s) => s.stage.includes(stageSub) && !s.stage.includes('Return') && !s.stage.includes('Reverse'));
    const revStep = trace.find((s) => s.stage.includes(stageSub) && (s.stage.includes('Return') || s.stage.includes('Reverse')));
    const isLit = activeStage.componentId === componentIdFwd || activeStage.componentId === componentIdRev || isKeyPressed;
    return (
      <div
        key={stageSub}
        className={`p-3.5 rounded-lg border-2 transition-all flex flex-col justify-between ${
          isLit
            ? 'bg-[#ebc238] text-[#25190b] border-white shadow-[0_0_22px_rgba(235,194,56,0.8)] scale-105 z-20 font-bold'
            : 'bg-[#120e04] text-[#d1c4b7] border-[#3b3426]'
        }`}
      >
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] font-monospaced-technical uppercase opacity-90">{label} ({rotorType})</span>
            <span className={`text-[9px] font-monospaced-technical px-1.5 py-0.5 rounded font-bold ${isLit ? 'bg-[#25190b] text-[#ebc238] shadow' : 'bg-[#251f12] text-[#8b6f47]'}`}>
              {isLit ? '● LIT' : '● IDLE'}
            </span>
          </div>

          {/* Rotor Window Dial */}
          <div className={`my-1.5 p-1.5 rounded text-center border shadow-inner ${isLit ? 'bg-[#25190b] border-[#ebc238]' : 'bg-[#201b0f] border-[#3b3426]'}`}>
            <span className="text-[9px] font-monospaced-technical uppercase block text-[#d1c4b7]">Position</span>
            <span className={`text-2xl font-rotor-label font-bold ${isLit ? 'text-[#ebc238]' : 'text-[#ede1cd]'}`}>
              {numToChar(currentPos)}
            </span>
            <span className="text-[8px] font-monospaced-technical block opacity-75">
              Ring: {formatRotorRing(ringVal)}
            </span>
          </div>
        </div>

        {/* Parameter Transformations */}
        <div className="mt-2 pt-1.5 border-t border-current/20 space-y-1 text-[10px] font-monospaced-technical">
          <div className="flex justify-between items-center">
            <span className="opacity-90">FWD:</span>
            <span className={`font-bold px-1.5 py-0.5 rounded ${isLit ? 'bg-[#25190b] text-[#ebc238]' : 'bg-[#251f12] text-[#e3c193]'}`}>
              {fwdStep ? `${fwdStep.inChar} ➔ ${fwdStep.outChar}` : '-'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="opacity-90">REV:</span>
            <span className={`font-bold px-1.5 py-0.5 rounded ${isLit ? 'bg-[#25190b] text-[#ebc238]' : 'bg-[#251f12] text-[#e3c193]'}`}>
              {revStep ? `${revStep.inChar} ➔ ${revStep.outChar}` : '-'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-[#201b0f] border border-[#4e453b] rounded-lg p-4 md:p-6 shadow-panel texture-metal space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#3b3426] pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-ui-header font-ui-header text-[#ebc238] text-sm md:text-base font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-[#ebc238]">route</span>
              Interactive Signal Path Machine Visualizer
            </h2>
            {isKeyPressed && (
              <span className="flex items-center gap-1.5 bg-[#ebc238] text-[#25190b] px-2.5 py-0.5 rounded font-monospaced-technical text-[10px] font-bold animate-pulse shadow-[0_0_12px_#ebc238]">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                KEY ACTIVE: '{selectedChar}' ➔ LAMP '{outputChar}'
              </span>
            )}
          </div>
          <p className="text-[#d1c4b7] text-xs font-ui-body">
            Real-time physical current path through the Enigma components with input/output parameters.
          </p>
        </div>

        {/* Character selector buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-monospaced-technical text-[#d1c4b7] mr-1">Select Key:</span>
          {['A', 'E', 'G', 'M', 'R', 'S', 'T', 'Z'].map((char) => (
            <button
              key={char}
              type="button"
              onClick={() => handleSelectChar(char)}
              className={`w-7 h-7 rounded font-rotor-label text-xs font-bold transition-all cursor-pointer ${
                selectedChar === char
                  ? 'bg-[#ebc238] text-[#25190b] border-2 border-white shadow-md scale-105'
                  : 'bg-[#120e04] text-[#d1c4b7] border border-[#3b3426] hover:bg-[#3b3426]'
              }`}
            >
              {char}
            </button>
          ))}
          {/* Custom letter input dropdown */}
          <select
            value={selectedChar}
            onChange={(e) => handleSelectChar(e.target.value)}
            className="bg-[#3b3426] text-[#e3c193] border border-[#8b6f47] text-xs rounded px-2 py-1 font-rotor-label cursor-pointer"
          >
            {ALPHABET.split('').map((c) => (
              <option key={c} value={c}>
                Key: {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Animation Playback Control Toolbar */}
      <div className="bg-[#120e04] border border-[#3b3426] rounded-lg p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePlayPause}
            className="bg-[#3b3426] hover:bg-[#4e453b] text-[#ebc238] border border-[#8b6f47] px-3 py-1.5 rounded text-xs font-ui-header font-bold flex items-center gap-1.5 transition-colors cursor-pointer min-h-[36px]"
          >
            <span className="material-symbols-outlined text-sm">
              {isPlaying ? 'pause' : currentStep >= totalStages - 1 ? 'replay' : 'play_arrow'}
            </span>
            {isPlaying ? 'Pause' : currentStep >= totalStages - 1 ? 'Replay' : 'Play Signal Journey'}
          </button>

          <button
            type="button"
            onClick={handleStepBackward}
            disabled={currentStep === 0}
            className="bg-[#251f12] hover:bg-[#3b3426] disabled:opacity-30 text-[#e3c193] border border-[#3b3426] p-1.5 rounded transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
            title="Step Backward"
          >
            <span className="material-symbols-outlined text-sm">skip_previous</span>
          </button>

          <button
            type="button"
            onClick={handleStepForward}
            disabled={currentStep >= totalStages - 1}
            className="bg-[#251f12] hover:bg-[#3b3426] disabled:opacity-30 text-[#e3c193] border border-[#3b3426] p-1.5 rounded transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
            title="Step Forward"
          >
            <span className="material-symbols-outlined text-sm">skip_next</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="bg-[#251f12] hover:bg-[#3b3426] text-[#d1c4b7] border border-[#3b3426] px-2.5 py-1.5 rounded text-xs font-monospaced-technical transition-colors cursor-pointer min-h-[36px]"
          >
            Reset
          </button>
        </div>

        {/* Speed Selector */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-monospaced-technical text-[#d1c4b7]">Speed:</span>
          {[
            { label: '0.5x', ms: 1400 },
            { label: '1x', ms: 900 },
            { label: '2x', ms: 450 }
          ].map((sp) => (
            <button
              key={sp.label}
              type="button"
              onClick={() => setSpeedMs(sp.ms)}
              className={`text-[10px] font-monospaced-technical px-2 py-1 rounded border transition-colors cursor-pointer ${
                speedMs === sp.ms
                  ? 'bg-[#ebc238] text-[#25190b] font-bold border-[#ebc238]'
                  : 'bg-[#120e04] text-[#d1c4b7] border-[#3b3426] hover:bg-[#251f12]'
              }`}
            >
              {sp.label}
            </button>
          ))}
        </div>

        {/* Current Step Counter */}
        <div className="text-monospaced-technical text-xs text-[#ebc238] bg-[#251f12] px-3 py-1 rounded border border-[#3b3426]">
          Step {currentStep + 1} / {totalStages}
        </div>
      </div>

      {/* PHYSICAL MACHINE SCHEMATIC DIAGRAM WITH LIVE SIGNAL LIGHT & PARAMETERS */}
      <div className="bg-[#120e04] border-2 border-[#3b3426] rounded-xl p-4 md:p-6 relative overflow-hidden shadow-inner">
        <div className="text-[10px] font-monospaced-technical text-[#8b6f47] uppercase tracking-widest mb-4 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-[#ebc238]">developer_board</span>
            {isM4Active ? 'ENIGMA M4' : 'ENIGMA M3'} PHYSICAL SCHEMATIC & SIGNAL FLOW
          </span>
          <span className="text-[#ebc238] font-bold bg-[#201b0f] px-2.5 py-1 rounded border border-[#3b3426]">
            ● Active Stage: {activeStage.name}
          </span>
        </div>

        {/* Physical Layout Enclosure Diagram */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-[#181307] p-4 rounded-lg border border-[#2f291c] relative">
          
          {/* Top Chamber - Scrambler Mechanism (Walzen & Reflector) */}
          <div className="md:col-span-4 bg-[#201b0f] p-4 rounded-lg border-2 border-[#4e453b] relative shadow-lg">
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-[#3b3426]">
              <span className="text-xs font-ui-header font-bold text-[#ebc238] uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">tune</span>
                Top Chamber: Rotor Assembly (Walzensatz) & Reflector
              </span>
              <span className="text-[10px] font-monospaced-technical text-[#d1c4b7]">
                 Signal Path: ETW ➔ Right Rotor ➔ Mid Rotor ➔ Left Rotor {isM4Active ? '➔ 4th Rotor ' : ''}➔ Reflector ➔ Return Pass
              </span>
            </div>

            {/* Scrambler Components in Chamber */}
            <div className={`grid grid-cols-1 sm:grid-cols-2 ${isM4Active ? 'lg:grid-cols-6' : 'lg:grid-cols-5'} gap-3`}>
              {/* Reflector (UKW) */}
              {(() => {
                const reflectorStep = trace.find((s) => s.stage.includes('Reflector'));
                const isLit = activeStage.componentId === 'reflector' || isKeyPressed;
                return (
                  <div
                    className={`p-3.5 rounded-lg border-2 transition-all flex flex-col justify-between ${
                      isLit
                        ? 'bg-[#ebc238] text-[#25190b] border-white shadow-[0_0_22px_rgba(235,194,56,0.8)] scale-105 z-20 font-bold'
                        : 'bg-[#120e04] text-[#d1c4b7] border-[#3b3426]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] font-monospaced-technical uppercase opacity-90">Reflector (UKW)</span>
                        <span className={`text-[9px] font-monospaced-technical px-1.5 py-0.5 rounded font-bold ${isLit ? 'bg-[#25190b] text-[#ebc238] shadow' : 'bg-[#251f12] text-[#8b6f47]'}`}>
                          {isLit ? '● LIT' : '● IDLE'}
                        </span>
                      </div>
                      <span className="text-sm font-rotor-label font-bold block">{config.reflector.type}</span>
                    </div>

                    <div className="mt-3 pt-2 border-t border-current/20">
                      <span className="text-[9px] font-monospaced-technical uppercase block opacity-90 font-semibold">Internal Mirror:</span>
                      <div className={`text-xs font-monospaced-technical font-bold mt-1 px-2 py-1 rounded text-center shadow ${isLit ? 'bg-[#25190b] text-[#ebc238]' : 'bg-[#201b0f] text-[#ede1cd]'}`}>
                        {reflectorStep ? `${reflectorStep.inChar} ➔ ${reflectorStep.outChar}` : 'N/A'}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* 4th Rotor (Fixed) */}
              {isM4Active && renderRotorView('4th Rotor', 'rotor_fourth', 'rotor_fourth_rev', config.fourthRotor.type, config.fourthRotor.current, config.fourthRotor.ring, 'Rotor 4')}

              {/* Left Rotor (Slow) */}
              {renderRotorView('Left Rotor', 'rotor_left', 'rotor_left_rev', config.leftRotor.type, config.leftRotor.current, config.leftRotor.ring, 'Rotor L')}

              {/* Middle Rotor */}
              {renderRotorView('Middle Rotor', 'rotor_middle', 'rotor_middle_rev', config.middleRotor.type, config.middleRotor.current, config.middleRotor.ring, 'Rotor M')}

              {/* Right Rotor (Fast) */}
              {renderRotorView('Right Rotor', 'rotor_right', 'rotor_right_rev', config.rightRotor.type, config.rightRotor.current, config.rightRotor.ring, 'Rotor R')}

              {/* Entry Wheel (ETW Stator) */}
              {(() => {
                const etwStep = trace.find((s) => s.stage.includes('Entry Wheel'));
                const isLit = activeStage.componentId === 'etw' || isKeyPressed;
                return (
                  <div
                    className={`p-3.5 rounded-lg border-2 transition-all flex flex-col justify-between ${
                      isLit
                        ? 'bg-[#ebc238] text-[#25190b] border-white shadow-[0_0_22px_rgba(235,194,56,0.8)] scale-105 z-20 font-bold'
                        : 'bg-[#120e04] text-[#d1c4b7] border-[#3b3426]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] font-monospaced-technical uppercase opacity-90">Entry Wheel (ETW)</span>
                        <span className={`text-[9px] font-monospaced-technical px-1.5 py-0.5 rounded font-bold ${isLit ? 'bg-[#25190b] text-[#ebc238] shadow' : 'bg-[#251f12] text-[#8b6f47]'}`}>
                          {isLit ? '● LIT' : '● IDLE'}
                        </span>
                      </div>
                      <span className="text-sm font-rotor-label font-bold block">Fixed Stator</span>
                    </div>

                    <div className="mt-3 pt-2 border-t border-current/20">
                      <span className="text-[9px] font-monospaced-technical uppercase block opacity-90 font-semibold">Pass-through:</span>
                      <div className={`text-xs font-monospaced-technical font-bold mt-1 px-2 py-1 rounded text-center shadow ${isLit ? 'bg-[#25190b] text-[#ebc238]' : 'bg-[#201b0f] text-[#ede1cd]'}`}>
                        {etwStep ? `${etwStep.inChar} ➔ ${etwStep.outChar}` : 'A ➔ A'}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Middle Deck - Lampboard (Glühlampenfeld) */}
          {(() => {
            const isLit = activeStage.componentId === 'lampboard' || isKeyPressed;
            return (
              <div
                className={`md:col-span-2 p-3.5 rounded-lg border-2 transition-all ${
                  isLit
                    ? 'bg-[#ebc238] text-[#25190b] border-white shadow-[0_0_20px_rgba(235,194,56,0.8)] font-bold z-20'
                    : 'bg-[#201b0f] text-[#d1c4b7] border-[#3b3426]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-monospaced-technical uppercase font-bold">
                    Middle Deck: Lampboard (Glühlampenfeld)
                  </span>
                  <span className={`text-[9px] font-monospaced-technical px-2 py-0.5 rounded ${isLit ? 'bg-[#25190b] text-[#ebc238] font-bold' : 'bg-[#120e04] text-[#8b6f47]'}`}>
                    {isLit ? '● BULB LIT' : '● BULB OFF'}
                  </span>
                </div>
                <div className="flex items-center justify-between bg-[#120e04]/80 p-2.5 rounded border border-current/30">
                  <span className="text-xs font-ui-header font-bold">Output Lamp</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-monospaced-technical opacity-80">Active Bulb:</span>
                    <span className={`text-xl font-rotor-label font-bold px-3 py-0.5 rounded shadow ${isLit ? 'bg-[#ebc238] text-[#25190b]' : 'bg-[#251f12] text-[#ebc238]'}`}>
                      '{outputChar}'
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Bottom Deck - Keyboard & Steckerbrett */}
          <div className="md:col-span-2 grid grid-cols-2 gap-3">
            {/* Keyboard */}
            {(() => {
              const isLit = activeStage.componentId === 'keyboard' || isKeyPressed;
              return (
                <div
                  className={`p-3.5 rounded-lg border-2 transition-all ${
                    isLit
                      ? 'bg-[#ebc238] text-[#25190b] border-white shadow-[0_0_20px_rgba(235,194,56,0.8)] font-bold z-20'
                      : 'bg-[#201b0f] text-[#d1c4b7] border-[#3b3426]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[9px] font-monospaced-technical uppercase font-bold">
                      Keyboard (Tastatur)
                    </span>
                    <span className={`text-[9px] font-monospaced-technical px-1.5 py-0.2 rounded ${isLit ? 'bg-[#25190b] text-[#ebc238]' : 'bg-[#120e04] text-[#8b6f47]'}`}>
                      {isLit ? '● PRESSED' : '● READY'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-ui-header font-bold">Input Key</span>
                    <span className={`text-base font-rotor-label font-bold px-2.5 py-0.5 rounded ${isLit ? 'bg-[#25190b] text-[#ebc238]' : 'bg-[#120e04] text-[#ede1cd]'}`}>
                      '{inputChar}'
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Steckerbrett (Plugboard) */}
            {(() => {
              const pbInStep = trace.find((s) => s.stage.includes('Plugboard (In)') || s.stage.includes('Plugboard In'));
              const pbOutStep = trace.find((s) => s.stage.includes('Plugboard (Out)') || s.stage.includes('Plugboard Out'));
              const isLit = activeStage.componentId === 'plugboard_in' || activeStage.componentId === 'plugboard_out' || isKeyPressed;
              return (
                <div
                  className={`p-3.5 rounded-lg border-2 transition-all ${
                    isLit
                      ? 'bg-[#ebc238] text-[#25190b] border-white shadow-[0_0_22px_rgba(235,194,56,0.8)] font-bold z-20'
                      : 'bg-[#201b0f] text-[#d1c4b7] border-[#3b3426]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-monospaced-technical uppercase font-bold">
                      Steckerbrett (Plugboard)
                    </span>
                    <span className={`text-[9px] font-monospaced-technical px-2 py-0.5 rounded font-bold ${isLit ? 'bg-[#25190b] text-[#ebc238] shadow' : 'bg-[#120e04] text-[#8b6f47]'}`}>
                      {isLit ? '● ACTIVE' : '● IDLE'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-monospaced-technical">
                    <div className={`p-1.5 rounded text-center border font-bold ${isLit ? 'bg-[#25190b] border-[#ebc238] text-[#ebc238]' : 'bg-[#120e04] border-[#3b3426] text-[#e3c193]'}`}>
                      <span className="text-[8px] block opacity-80 uppercase">IN PASS</span>
                      {pbInStep ? `${pbInStep.inChar} ↔ ${pbInStep.outChar}` : `${inputChar} ↔ ${config.plugboard?.[inputChar] || inputChar}`}
                    </div>
                    <div className={`p-1.5 rounded text-center border font-bold ${isLit ? 'bg-[#25190b] border-[#ebc238] text-[#ebc238]' : 'bg-[#120e04] border-[#3b3426] text-[#e3c193]'}`}>
                      <span className="text-[8px] block opacity-80 uppercase">OUT PASS</span>
                      {pbOutStep ? `${pbOutStep.inChar} ↔ ${pbOutStep.outChar}` : `${outputChar} ↔ ${config.plugboard?.[outputChar] || outputChar}`}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

        </div>
      </div>

      {/* Moving Light Pulse Step Sequence Line */}
      <div className="relative overflow-x-auto pb-2 pt-1">
        <div className="flex items-center min-w-[850px] relative px-4">
          {/* Wire Background */}
          <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-1 bg-[#3b3426] z-0 rounded">
            <div
              className="h-full bg-gradient-to-r from-[#8b6f47] via-[#ebc238] to-[#fff5d6] transition-all duration-300 rounded shadow-[0_0_8px_#ebc238] step-progress-fill"
              style={{
                '--progress-width': `${(currentStep / (totalStages - 1)) * 100}%`
              } as React.CSSProperties}
            />
          </div>

          {/* Step Nodes */}
          {Array.from({ length: totalStages }).map((_, idx) => {
            const isCompleted = idx < currentStep;
            const isActive = idx === currentStep;
            const details = getStageDetails(idx);

            return (
              <div
                key={idx}
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentStep(idx);
                }}
                className="relative z-10 flex flex-col items-center flex-1 cursor-pointer group transition-all duration-200"
              >
                <div
                  className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                    isActive
                      ? 'bg-[#ebc238] border-white text-[#25190b] shadow-[0_0_16px_#ebc238] scale-125'
                      : isCompleted
                      ? 'bg-[#8b6f47] border-[#ebc238] text-white shadow-md'
                      : 'bg-[#120e04] border-[#3b3426] text-[#d1c4b7] group-hover:border-[#8b6f47]'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">{details.icon}</span>
                </div>

                <span
                  className={`mt-1.5 font-rotor-label text-xs font-bold px-1.5 py-0.5 rounded transition-all ${
                    isActive
                      ? 'bg-[#ebc238] text-[#25190b] shadow'
                      : isCompleted
                      ? 'text-[#e3c193]'
                      : 'text-[#d1c4b7]'
                  }`}
                >
                  {details.outChar}
                </span>

                <span className="text-[9px] font-monospaced-technical text-[#d1c4b7] text-center max-w-[65px] truncate mt-0.5">
                  {details.name.split(' ')[0]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Stage Parameters Callout Spotlight */}
      <div className="bg-[#120e04] border-2 border-[#ebc238] rounded-lg p-4 shadow-[0_0_15px_rgba(235,194,56,0.15)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-full bg-[#ebc238]/20 border border-[#ebc238] flex items-center justify-center shrink-0 text-[#ebc238] shadow-[0_0_10px_rgba(235,194,56,0.3)]">
            <span className="material-symbols-outlined text-2xl">{activeStage.icon}</span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-monospaced-technical text-[#ebc238] uppercase tracking-wider">
                Stage {currentStep + 1} / {totalStages}
              </span>
              <span className="text-xs font-ui-header font-bold text-[#ede1cd]">
                {activeStage.name}
              </span>
              <span className="text-[10px] font-monospaced-technical bg-[#3b3426] text-[#e3c193] px-2 py-0.5 rounded">
                Location: {activeStage.location}
              </span>
            </div>
            <p className="text-xs font-ui-body text-[#d1c4b7] mt-1">
              {activeStage.note}
            </p>
          </div>
        </div>

        {/* Input and Output Parameter Indicators */}
        <div className="flex items-center gap-3 bg-[#201b0f] p-3 rounded border border-[#3b3426] shrink-0 self-stretch md:self-auto justify-center">
          <div className="text-center">
            <span className="text-[9px] font-monospaced-technical text-[#d1c4b7] block uppercase">
              Input Parameter
            </span>
            <span className="font-rotor-label font-bold text-lg text-[#ede1cd]">
              '{activeStage.inChar}'
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="material-symbols-outlined text-[#ebc238] text-sm animate-pulse">
              arrow_forward
            </span>
            <span className="text-[8px] font-monospaced-technical text-[#ebc238]">
              {activeStage.direction}
            </span>
          </div>
          <div className="text-center">
            <span className="text-[9px] font-monospaced-technical text-[#ebc238] block uppercase">
              Output Parameter
            </span>
            <span className="font-rotor-label font-bold text-xl text-[#ebc238]">
              '{activeStage.outChar}'
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
;

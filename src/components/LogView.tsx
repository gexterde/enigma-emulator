import React, { useState, useEffect, useRef, useCallback, useMemo, useContext } from 'react';
import { useTheme, getTheme } from '../lib/theme';
//import React, { useState } from 'react';
import { LogEntry } from '../types';

interface LogViewProps {
  logs: LogEntry[];
  onClearLogs: () => void;
}

export const LogView: React.FC<LogViewProps> = ({ logs, onClearLogs }) => {
  const { theme } = useTheme();
  const t = getTheme(theme);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(logs.length > 0 ? logs[logs.length - 1].id : null);

  const selectedLog = logs.find((l) => l.id === selectedLogId) || logs[logs.length - 1];

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `enigma_encryption_log_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center border-b ${t.borderBase} pb-4 gap-2`}>
        <div>
          <h1 className={`text-rotor-label ${t.fontRotor} ${t.textAccent} text-xl md:text-2xl`}>
            Signal Path & History Log
          </h1>
          <p className={`${t.textMuted} text-xs ${t.fontBody}`}>
            Cryptographic step-by-step trace through the Steckerbrett, Rotor Scrambler wiring, Reflector, and Lampboard return.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {logs.length > 0 && (
            <button
              onClick={handleExportJSON}
              className={`text-xs ${t.fontHeader} ${t.buttonPrimary} px-3 py-1.5 rounded transition-colors cursor-pointer flex items-center gap-1`}
            >
              <span className="material-symbols-outlined text-xs">download</span>
              Export JSON
            </button>
          )}
          <button
            onClick={onClearLogs}
            className={`text-xs ${t.fontHeader} ${t.buttonDanger} px-3 py-1.5 rounded transition-colors cursor-pointer`}
          >
            Clear Log
          </button>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className={`${t.panelBg} border ${t.borderBase} rounded-lg p-8 text-center ${t.textMuted}`}>
          <span className={`material-symbols-outlined text-4xl ${t.textAccent} mb-2`}>history_edu</span>
          <p className={`${t.fontHeader} text-sm ${t.textPrimary}`}>No encryption activity logged yet.</p>
          <p className={`text-xs ${t.textMuted} mt-1`}>Switch to the "Machine" view and type characters to generate signal path logs.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Recent Keystrokes List */}
          <div className={`${t.panelBg} border ${t.borderBase} rounded-lg p-4 shadow-panel ${t.appTexture} max-h-[520px] overflow-y-auto space-y-2`}>
            <h3 className={`text-ui-header ${t.fontHeader} ${t.textSecondary} text-xs uppercase mb-3 pb-1 border-b ${t.borderBase}`}>
              Logged Character Events ({logs.length})
            </h3>
            {logs.slice().reverse().map((entry) => {
              const isSelected = selectedLog?.id === entry.id;
              return (
                <button
                  key={entry.id}
                  onClick={() => setSelectedLogId(entry.id)}
                  className={`w-full text-left p-3 rounded border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? `${t.bgAccentFaint} ${t.borderAccent} ${t.textAccentStrong} shadow-sm font-bold`
                      : `${t.inputBgAlt} ${t.borderBase} ${t.textSecondary} hover:opacity-90`
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`${t.fontRotor} font-bold text-lg ${t.textAccent}`}>
                      {entry.inputChar} → {entry.outputChar}
                    </span>
                    <span className={`text-[10px] ${t.fontMono} ${t.textMuted} block`}>
                      {entry.timestamp}
                    </span>
                  </div>
                  <span className={`material-symbols-outlined text-xs ${t.textMuted}`}>
                    chevron_right
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Column: Step-by-step Signal Path Circuit Diagram for selected character */}
          <div className={`md:col-span-2 ${t.panelBg} border ${t.borderBase} rounded-lg p-5 shadow-panel ${t.appTexture} space-y-4`}>
            {selectedLog && (
              <>
                <div className={`flex justify-between items-center pb-2 border-b ${t.borderBase}`}>
                  <div>
                    <h3 className={`text-ui-header ${t.fontHeader} ${t.textAccent} text-sm font-bold flex items-center gap-2`}>
                      <span className="material-symbols-outlined text-sm">timeline</span>
                      Circuit Path: Key '{selectedLog.inputChar}' → Lamp '{selectedLog.outputChar}'
                    </h3>
                    <p className={`text-[10px] ${t.fontMono} ${t.textMuted}`}>
                      Snapshot: {selectedLog.configString}
                    </p>
                  </div>
                </div>

                {/* Vertical Signal Route Flow */}
                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {selectedLog.trace.map((step, idx) => (
                    <div
                      key={idx}
                      className={`${t.panelInner} border ${t.borderBase} rounded p-3 flex items-center justify-between hover:${t.borderAccent} transition-colors`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full ${t.panelBg} ${t.textSecondary} ${t.fontMono} text-[10px] flex items-center justify-center font-bold`}>
                          {idx + 1}
                        </span>
                        <div>
                          <span className={`${t.fontHeader} text-xs ${t.textPrimary} font-semibold block`}>
                            {step.stage}
                          </span>
                          {step.note && (
                            <span className={`text-[10px] ${t.textMuted} ${t.fontMono} block`}>
                              {step.note}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className={`${t.fontRotor} text-sm font-bold ${t.textAccent} ${t.panelBg} px-3 py-1 rounded border ${t.borderBase}`}>
                        {step.inChar} → {step.outChar}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

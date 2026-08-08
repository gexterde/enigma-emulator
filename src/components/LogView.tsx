import React, { useState } from 'react';
import { LogEntry } from '../types';

interface LogViewProps {
  logs: LogEntry[];
  onClearLogs: () => void;
}

export const LogView: React.FC<LogViewProps> = ({ logs, onClearLogs }) => {
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#3b3426] pb-4 gap-2">
        <div>
          <h1 className="text-rotor-label font-rotor-label text-[#ebc238] text-xl md:text-2xl">
            Signal Path & History Log
          </h1>
          <p className="text-[#d1c4b7] text-xs font-ui-body">
            Cryptographic step-by-step trace through the Steckerbrett, Rotor Scrambler wiring, Reflector, and Lampboard return.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {logs.length > 0 && (
            <button
              onClick={handleExportJSON}
              className="text-xs font-ui-header bg-[#3b3426] hover:bg-[#4e453b] text-[#e3c193] border border-[#8b6f47] px-3 py-1.5 rounded transition-colors cursor-pointer flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-xs">download</span>
              Export JSON
            </button>
          )}
          <button
            onClick={onClearLogs}
            className="text-xs font-ui-header bg-[#93000a]/30 hover:bg-[#93000a] text-[#ffdad6] border border-red-800/40 px-3 py-1.5 rounded transition-colors cursor-pointer"
          >
            Clear Log
          </button>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="bg-[#201b0f] border border-[#4e453b] rounded-lg p-8 text-center text-[#d1c4b7]">
          <span className="material-symbols-outlined text-4xl text-[#8b6f47] mb-2">history_edu</span>
          <p className="font-ui-header text-sm">No encryption activity logged yet.</p>
          <p className="text-xs text-[#d1c4b7] mt-1">Switch to the "Machine" view and type characters to generate signal path logs.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Recent Keystrokes List */}
          <div className="bg-[#201b0f] border border-[#4e453b] rounded-lg p-4 shadow-panel texture-metal max-h-[520px] overflow-y-auto space-y-2">
            <h3 className="text-ui-header font-ui-header text-[#e3c193] text-xs uppercase mb-3 pb-1 border-b border-[#3b3426]">
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
                      ? 'bg-[#3b3426] border-[#ebc238] text-[#ede1cd] shadow-md'
                      : 'bg-[#120e04] border-[#3b3426] text-[#d1c4b7] hover:bg-[#2f291c]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-rotor-label font-bold text-lg text-[#ebc238]">
                      {entry.inputChar} → {entry.outputChar}
                    </span>
                    <span className="text-[10px] font-monospaced-technical text-[#d1c4b7] block">
                      {entry.timestamp}
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-xs text-[#d1c4b7]">
                    chevron_right
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Column: Step-by-step Signal Path Circuit Diagram for selected character */}
          <div className="md:col-span-2 bg-[#201b0f] border border-[#4e453b] rounded-lg p-5 shadow-panel texture-metal space-y-4">
            {selectedLog && (
              <>
                <div className="flex justify-between items-center pb-2 border-b border-[#3b3426]">
                  <div>
                    <h3 className="text-ui-header font-ui-header text-[#ebc238] text-sm font-bold flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">timeline</span>
                      Circuit Path: Key '{selectedLog.inputChar}' → Lamp '{selectedLog.outputChar}'
                    </h3>
                    <p className="text-[10px] font-monospaced-technical text-[#d1c4b7]">
                      Snapshot: {selectedLog.configString}
                    </p>
                  </div>
                </div>

                {/* Vertical Signal Route Flow */}
                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {selectedLog.trace.map((step, idx) => (
                    <div
                      key={idx}
                      className="bg-[#120e04] border border-[#3b3426] rounded p-3 flex items-center justify-between hover:border-[#8b6f47] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-[#3b3426] text-[#e3c193] font-monospaced-technical text-[10px] flex items-center justify-center font-bold">
                          {idx + 1}
                        </span>
                        <div>
                          <span className="font-ui-header text-xs text-[#ede1cd] font-semibold block">
                            {step.stage}
                          </span>
                          {step.note && (
                            <span className="text-[10px] text-[#d1c4b7] font-monospaced-technical block">
                              {step.note}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="font-rotor-label text-sm font-bold text-[#ebc238] bg-[#251f12] px-3 py-1 rounded border border-[#3b3426]">
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

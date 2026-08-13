import React, { useState } from 'react';
import { useTheme, getTheme } from '../lib/theme';
import { MORSE_GROUPS } from '../lib/morse';

export interface MorseReferenceSheetProps {
  title?: string;
  subtitle?: string;
  icon?: string;
  onItemClick?: (char: string, code: string) => void;
  itemTitlePrefix?: string;
  isCollapsible?: boolean;
  defaultExpanded?: boolean;
  expanded?: boolean;
  onToggleExpand?: () => void;
  containerClassName?: string;
}

export const MorseReferenceSheet: React.FC<MorseReferenceSheetProps> = ({
  title = "Auditory Code Reference Sheet",
  subtitle,
  icon = "help",
  onItemClick,
  itemTitlePrefix = "Click to play or send",
  isCollapsible = true,
  defaultExpanded = false,
  expanded: controlledExpanded,
  onToggleExpand,
  containerClassName = "",
}) => {
  const { theme } = useTheme();
  const t = getTheme(theme);

  const [internalExpanded, setInternalExpanded] = useState<boolean>(defaultExpanded);

  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;

  const handleToggle = () => {
    if (onToggleExpand) {
      onToggleExpand();
    } else {
      setInternalExpanded(!internalExpanded);
    }
  };

  return (
    <div className={`${t.panelBg} p-4 rounded-xl border ${t.borderBase} shadow-xl space-y-3 ${containerClassName}`}>
      <div className={`flex items-center justify-between border-b ${t.borderBase} pb-2 select-none`}>
        <div className="flex flex-col">
          <span className={`text-xs font-bold ${t.textPrimary} flex items-center gap-1.5`}>
            <span className={`material-symbols-outlined text-sm ${t.textAccent}`}>{icon}</span>
            <span>{title}</span>
          </span>
          {subtitle && (
            <span className={`text-[10px] ${t.textMuted} mt-0.5 font-mono`}>{subtitle}</span>
          )}
        </div>

        {isCollapsible && (
          <button
            type="button"
            onClick={handleToggle}
            className={`text-xs font-mono font-bold ${t.textAccent} hover:underline flex items-center gap-1 cursor-pointer transition-colors`}
          >
            <span>{isExpanded ? 'Hide Reference' : 'Show Reference'}</span>
            <span className="material-symbols-outlined text-base">
              {isExpanded ? 'expand_less' : 'expand_more'}
            </span>
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="space-y-3.5 pt-1 animate-fadeIn select-none">
          {MORSE_GROUPS.map((group) => (
            <div key={group.title} className={`${t.panelInner} p-3 rounded-lg border ${t.borderBase}/60`}>
              <div className={`text-[11px] font-bold ${t.textAccent} ${t.fontHeader} uppercase tracking-wider mb-2 flex items-center gap-1.5 border-b ${t.borderBase}/40 pb-1`}>
                <span className="material-symbols-outlined text-xs">{group.icon}</span>
                <span>{group.title}</span>
              </div>
              <div className={`grid ${group.gridCols} gap-1.5`}>
                {group.items.map(([char, code]) => (
                  <button
                    key={char}
                    type="button"
                    onClick={() => onItemClick && onItemClick(char, code)}
                    className={`flex flex-col items-center justify-center p-2 border ${t.borderBase}/50 rounded ${t.panelBg} hover:${t.borderAccent} hover:brightness-125 transition-all cursor-pointer hover:scale-105 active:scale-95 select-none touch-manipulation`}
                    title={`${itemTitlePrefix} "${char}" (${code})`}
                  >
                    <span className={`${t.textSecondary} font-extrabold text-base leading-none mb-1`}>{char}</span>
                    <span className={`${t.textAccent} font-mono text-[11px] font-bold tracking-widest`}>{code}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

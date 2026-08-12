import React from 'react';
import { useTheme, getTheme } from '../lib/theme';

interface FooterProps {
  onOpenInfo: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenInfo }) => {
  const { theme } = useTheme();
  const t = getTheme(theme);

  return (
    <footer className={`border-t ${t.borderBase} ${t.headerBg} flex flex-col md:flex-row justify-between items-center px-4 md:px-8 py-3 w-full text-[10px] shrink-0 z-50 gap-2 md:gap-0`}>
      <span className={`${t.textMuted} ${t.fontMono} text-center`}>
        © 1943 Bletchley Park Systems. For instructional use only.
      </span>
      <div className="flex flex-wrap justify-center gap-4">
        <button
          onClick={onOpenInfo}
          className={`${t.textSecondary} hover:${t.textAccent} transition-opacity duration-200 ${t.fontMono} min-h-[44px] flex items-center cursor-pointer`}
        >
          Historical Accuracy
        </button>
        <button
          onClick={onOpenInfo}
          className={`${t.textSecondary} hover:${t.textAccent} transition-opacity duration-200 ${t.fontMono} min-h-[44px] flex items-center cursor-pointer`}
        >
          Manual
        </button>
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className={`${t.textSecondary} hover:${t.textAccent} transition-opacity duration-200 ${t.fontMono} min-h-[44px] flex items-center`}
        >
          Source Code
        </a>
      </div>
    </footer>
  );
};

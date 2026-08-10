import React from 'react';

interface FooterProps {
  onOpenInfo: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenInfo }) => {
  return (
    <footer className="border-t border-[#4e453b] bg-[#120e04] flex flex-col md:flex-row justify-between items-center px-4 md:px-8 py-3 w-full text-[10px] shrink-0 z-50 gap-2 md:gap-0">
      <span className="text-[#544433] text-monospaced-technical font-monospaced-technical text-center">
        © 1943 Bletchley Park Systems. For instructional use only.
      </span>
      <div className="flex flex-wrap justify-center gap-4">
        <button
          onClick={onOpenInfo}
          className="text-[#d1c4b7] hover:text-[#ebc238] transition-opacity duration-200 text-monospaced-technical font-monospaced-technical min-h-[44px] flex items-center"
        >
          Historical Accuracy
        </button>
        <button
          onClick={onOpenInfo}
          className="text-[#d1c4b7] hover:text-[#ebc238] transition-opacity duration-200 text-monospaced-technical font-monospaced-technical min-h-[44px] flex items-center"
        >
          Manual
        </button>
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#d1c4b7] hover:text-[#ebc238] transition-opacity duration-200 text-monospaced-technical font-monospaced-technical min-h-[44px] flex items-center"
        >
          Source Code
        </a>
      </div>
    </footer>
  );
};

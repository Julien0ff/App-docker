import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  subtitle?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', className = '', subtitle = 'Docker Engine' }) => {
  const iconSize = size === 'sm' ? 28 : size === 'lg' ? 44 : 36;

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Nothing Hardware-inspired Icon */}
      <div
        className="relative rounded-2xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center shadow-md overflow-hidden border border-zinc-800 dark:border-zinc-200 transition-transform duration-200 hover:scale-105"
        style={{ width: iconSize, height: iconSize }}
      >
        {/* Subtle internal dot matrix glyph */}
        <svg
          viewBox="0 0 32 32"
          className="w-5 h-5 fill-current opacity-90"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer glyph frame */}
          <rect x="5" y="5" width="22" height="22" rx="6" fill="none" stroke="currentColor" strokeWidth="2.2" />
          {/* Inner dots representing containers in a Nothing matrix */}
          <circle cx="11" cy="11" r="1.8" />
          <circle cx="21" cy="11" r="1.8" />
          <circle cx="11" cy="21" r="1.8" />
          {/* Signature Nothing Red diode */}
          <circle cx="21" cy="21" r="2.2" fill="#ea3829" className="animate-pulse-subtle" />
        </svg>

        {/* Diagonal hardware highlight */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />
      </div>

      {/* Typography: Nothing OS styled title */}
      <div>
        <div className="flex items-center gap-1.5">
          <span className="font-display font-bold tracking-tight text-base text-zinc-900 dark:text-white">
            DOCK (1)
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-mono bg-zinc-200 dark:bg-nothing-subcard text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-800 font-semibold">
            v26.1
          </span>
        </div>
        <p className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-nothing-red animate-pulse-subtle" />
          {subtitle}
        </p>
      </div>
    </div>
  );
};

export default Logo;

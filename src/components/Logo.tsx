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
      {/* Nothing Hardware-inspired Icon (Official Landing Identity) */}
      <div
        className="rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center relative overflow-hidden transition-all duration-200 hover:border-[#ea3829] shadow-sm shrink-0"
        style={{ width: iconSize, height: iconSize }}
      >
        <div className="w-2.5 h-2.5 rounded-full bg-[#ea3829] shadow-[0_0_12px_#ea3829] animate-pulse-subtle" />
      </div>

      {/* Typography: Nothing OS styled title */}
      <div>
        <div className="flex items-center gap-1.5">
          <span className="font-display font-bold tracking-tight text-base text-zinc-900 dark:text-white">
            DOCK (1)
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-mono bg-zinc-200 dark:bg-nothing-subcard text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-800 font-semibold">
            v26.2.5
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

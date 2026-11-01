import React, { useState, useEffect } from 'react';

interface PreloadScreenProps {
  isReady: boolean;
  onFinish?: () => void;
}

export const PreloadScreen: React.FC<PreloadScreenProps> = ({ isReady, onFinish }) => {
  const [progress, setProgress] = useState<number>(12);
  const [logs, setLogs] = useState<string[]>([
    '[INIT] Hardware bus detection...',
  ]);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);
  const [isDestroyed, setIsDestroyed] = useState<boolean>(false);

  useEffect(() => {
    const sequence = [
      { delay: 180, progress: 38, log: '[SOCKET] Probing /var/run/docker.sock... CONNECTED' },
      { delay: 420, progress: 68, log: '[COMPOSE] Indexing Docker stacks & clusters... OK' },
      { delay: 720, progress: 92, log: '[NOTIFY] Discord dispatcher & systemd service... READY' },
      { delay: 980, progress: 100, log: '[DOCK-ONE] Kernel v26.2 online • 127.0.0.1:4500' },
    ];

    const timeouts = sequence.map((item) =>
      setTimeout(() => {
        setProgress(item.progress);
        setLogs((prev) => [...prev, item.log]);
      }, item.delay)
    );

    return () => timeouts.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (progress >= 100 && isReady) {
      const timer = setTimeout(() => {
        setIsFadingOut(true);
        setTimeout(() => {
          setIsDestroyed(true);
          onFinish?.();
        }, 500);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [progress, isReady, onFinish]);

  if (isDestroyed) return null;

  return (
    <div
      className={`fixed inset-0 z-50 bg-[#090a0c] text-white flex flex-col items-center justify-center p-6 select-none transition-opacity duration-500 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    >
      <div className="w-full max-w-md flex flex-col items-center text-center">
        {/* Pulsing Hardware Diode */}
        <div className="relative mb-6">
          <div className="w-4 h-4 rounded-full bg-[#ea3829] shadow-[0_0_20px_#ea3829]" />
          <div className="absolute inset-0 w-4 h-4 rounded-full bg-[#ea3829] animate-ping opacity-60" />
        </div>

        {/* Brand Title in Nothing OS Typography */}
        <div className="flex items-center gap-2 mb-1">
          <span className="font-display font-extrabold text-3xl tracking-tight text-white">
            DOCK (1)
          </span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 border border-white/15">
            v26.2
          </span>
        </div>
        <p className="font-mono text-[11px] tracking-widest text-zinc-400 uppercase mb-8">
          NOTHING OS AESTHETIC // LOCAL DECK
        </p>

        {/* Progress bar */}
        <div className="w-full bg-zinc-900 border border-zinc-800 rounded-full h-2 overflow-hidden mb-3 p-[1px]">
          <div
            className="h-full bg-gradient-to-r from-zinc-200 via-white to-[#ea3829] rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="w-full flex items-center justify-between font-mono text-[11px] text-zinc-500 mb-6">
          <span>BOOT DIAGNOSTICS</span>
          <span className="text-zinc-300">{progress}%</span>
        </div>

        {/* High-tech boot console log lines */}
        <div className="w-full bg-black/60 border border-zinc-800/80 rounded-2xl p-4 font-mono text-[11px] text-left space-y-1.5 shadow-2xl backdrop-blur-md">
          {logs.map((log, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-2 transition-all duration-200 ${
                idx === logs.length - 1 ? 'text-zinc-200 font-semibold' : 'text-zinc-500'
              }`}
            >
              <span className="text-[#ea3829] text-[9px]">●</span>
              <span className="truncate">{log}</span>
            </div>
          ))}
          {progress < 100 && (
            <div className="flex items-center gap-1.5 text-zinc-500 animate-pulse">
              <span className="w-1.5 h-3 bg-[#ea3829]" />
              <span>reading docker.sock state...</span>
            </div>
          )}
        </div>

        {/* Skip button for instant testing */}
        <button
          onClick={() => {
            setIsFadingOut(true);
            setTimeout(() => {
              setIsDestroyed(true);
              onFinish?.();
            }, 300);
          }}
          className="mt-6 text-[10px] font-mono text-zinc-600 hover:text-zinc-400 tracking-wider transition-colors uppercase underline underline-offset-4"
        >
          Passer le boot
        </button>
      </div>
    </div>
  );
};

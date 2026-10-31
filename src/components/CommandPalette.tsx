import React, { useState, useEffect, useRef } from 'react';
import { Search, Play, Square, RotateCw, Terminal, Info, Power, Moon, Sun, X, Layers } from 'lucide-react';
import { DockerContainer } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  containers: DockerContainer[];
  onStart: (id: string, name: string) => void;
  onStop: (id: string, name: string) => void;
  onRestart: (id: string, name: string) => void;
  onOpenLogs: (container: DockerContainer) => void;
  onOpenDetails: (container: DockerContainer) => void;
  onToggleTheme: () => void;
  onRefresh: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  containers,
  onStart,
  onStop,
  onRestart,
  onOpenLogs,
  onOpenDetails,
  onToggleTheme,
  onRefresh,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [isOpen]);

  // Keyboard shortcut listener for Ctrl+K / Cmd+K and Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Filtered items
  const filteredContainers = containers.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.image.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelectContainer = (c: DockerContainer, action: 'logs' | 'toggle' | 'details') => {
    if (action === 'logs') onOpenLogs(c);
    else if (action === 'details') onOpenDetails(c);
    else if (action === 'toggle') {
      if (c.state === 'running') onStop(c.id, c.name);
      else onStart(c.id, c.name);
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/60 backdrop-blur-xs select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl bg-light-card dark:bg-nothing-card border border-light-border dark:border-nothing-border shadow-2xl overflow-hidden text-zinc-900 dark:text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-light-border dark:border-nothing-border gap-3">
          <Search size={16} className="text-zinc-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Rechercher conteneur, commande, action..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="w-full bg-transparent border-none outline-none text-sm font-sans placeholder-zinc-400 text-zinc-900 dark:text-white"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
          >
            <X size={15} />
          </button>
        </div>

        {/* List of items */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1 text-xs">
          {filteredContainers.length > 0 ? (
            filteredContainers.map((c, idx) => {
              const isRunning = c.state === 'running';
              return (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-light-hover dark:hover:bg-nothing-subcard group cursor-pointer transition-colors"
                  onClick={() => handleSelectContainer(c, 'logs')}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        isRunning ? 'bg-nothing-green animate-pulse' : 'bg-zinc-400'
                      }`}
                    />
                    <div className="min-w-0">
                      <span className="font-bold text-zinc-900 dark:text-white block truncate">
                        {c.name}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400 truncate block">
                        {c.image}
                      </span>
                    </div>
                  </div>

                  {/* Inline quick triggers */}
                  <div className="flex items-center gap-1.5 shrink-0 opacity-80 group-hover:opacity-100">
                    {isRunning ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onStop(c.id, c.name);
                          onClose();
                        }}
                        className="px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-nothing-red flex items-center gap-1 font-mono text-[10px] btn-press"
                      >
                        <Square size={10} className="fill-current" />
                        <span>Stop</span>
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onStart(c.id, c.name);
                          onClose();
                        }}
                        className="px-2 py-1 rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 flex items-center gap-1 font-mono text-[10px] btn-press"
                      >
                        <Play size={10} className="fill-current" />
                        <span>Start</span>
                      </button>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenLogs(c);
                        onClose();
                      }}
                      className="p-1 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500"
                      title="Logs"
                    >
                      <Terminal size={13} />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-zinc-400">
              Aucun conteneur correspondant à "{query}"
            </div>
          )}
        </div>

        {/* Footer shortcuts info */}
        <div className="px-4 py-2 bg-light-subcard dark:bg-nothing-subcard border-t border-light-border dark:border-nothing-border flex items-center justify-between text-[10px] font-mono text-zinc-400">
          <span>{filteredContainers.length} résultats</span>
          <span>Échap pour quitter</span>
        </div>
      </div>
    </div>
  );
};

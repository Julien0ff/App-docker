import React, { useEffect, useState, useRef } from 'react';
import { X, Play, Pause, Search, Copy, Download, Trash2, Terminal, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';
import { DockerContainer } from '../types';
import { fetchContainerLogs } from '../services/api';

interface LogViewerModalProps {
  container: DockerContainer | null;
  onClose: () => void;
}

export const LogViewerModal: React.FC<LogViewerModalProps> = ({ container, onClose }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!container) return;

    setLogs([]);
    setIsLoading(true);

    // Initial snapshot fetch
    fetchContainerLogs(container.id, 200)
      .then((rawLogs) => {
        if (rawLogs) {
          setLogs(rawLogs.split('\n').filter((l) => l.trim().length > 0));
        }
      })
      .catch((err) => {
        toast.error(`Erreur logs: ${err.message}`);
      })
      .finally(() => {
        setIsLoading(false);
      });

    // Start SSE stream
    const sse = new EventSource(`/api/containers/${container.id}/logs/stream?tail=50`);
    eventSourceRef.current = sse;

    sse.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.log) {
          setLogs((prev) => [...prev.slice(-1500), data.log]);
        }
      } catch (_) {
        // fallback
      }
    };

    sse.addEventListener('error', () => {
      // Stream error or ended
    });

    return () => {
      sse.close();
      eventSourceRef.current = null;
    };
  }, [container]);

  // Scroll to bottom when logs update if autoScroll is enabled
  useEffect(() => {
    if (autoScroll && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  // Toggle live streaming
  const toggleStreaming = () => {
    if (isStreaming) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setIsStreaming(false);
    } else if (container) {
      const sse = new EventSource(`/api/containers/${container.id}/logs/stream?tail=20`);
      eventSourceRef.current = sse;
      sse.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.log) {
            setLogs((prev) => [...prev.slice(-1500), data.log]);
          }
        } catch (_) {}
      };
      setIsStreaming(true);
    }
  };

  const handleCopy = () => {
    const text = logs.join('\n');
    navigator.clipboard.writeText(text);
    toast.success('Logs copiés dans le presse-papier');
  };

  const handleDownload = () => {
    if (!container) return;
    const blob = new Blob([logs.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${container.name}-logs.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Fichier de logs téléchargé');
  };

  const handleClear = () => {
    setLogs([]);
    toast.info('Affichage des logs réinitialisé');
  };

  if (!container) return null;

  const filteredLogs = searchFilter
    ? logs.filter((l) => l.toLowerCase().includes(searchFilter.toLowerCase()))
    : logs;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-5xl h-[88vh] rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl flex flex-col overflow-hidden text-zinc-100">
        {/* Terminal Header */}
        <div className="px-6 py-4 bg-zinc-900/90 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3 select-none">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-300">
              <Terminal size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-sm text-white">
                  Logs : {container.name}
                </span>
                <span className="w-2 h-2 rounded-full bg-nothing-green animate-pulse"></span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                  {container.shortId}
                </span>
              </div>
              <p className="text-[11px] font-mono text-zinc-400 truncate max-w-sm">
                {container.image}
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2">
            {/* Filter in logs */}
            <div className="relative flex items-center">
              <Search size={13} className="absolute left-2.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Filtrer dans les logs..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl bg-zinc-800 border border-zinc-700 text-xs text-white placeholder-zinc-500 outline-none focus:border-zinc-500 w-48 font-mono"
              />
            </div>

            {/* Stream toggle button */}
            <button
              onClick={toggleStreaming}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium flex items-center gap-1.5 btn-press border ${
                isStreaming
                  ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/80'
                  : 'bg-zinc-800 text-zinc-300 border-zinc-700'
              }`}
              title={isStreaming ? 'Mettre en pause' : 'Reprendre le streaming'}
            >
              {isStreaming ? <Pause size={12} /> : <Play size={12} className="fill-current" />}
              <span>{isStreaming ? 'Live' : 'En pause'}</span>
            </button>

            {/* Auto-scroll toggle */}
            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className={`p-1.5 rounded-xl text-xs font-mono btn-press border ${
                autoScroll
                  ? 'bg-white text-zinc-950 border-white font-semibold'
                  : 'bg-zinc-800 text-zinc-400 border-zinc-700'
              }`}
              title="Défilement automatique"
            >
              <ArrowDown size={14} />
            </button>

            {/* Copy button */}
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 btn-press"
              title="Copier les logs"
            >
              <Copy size={14} />
            </button>

            {/* Download button */}
            <button
              onClick={handleDownload}
              className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 btn-press"
              title="Télécharger"
            >
              <Download size={14} />
            </button>

            {/* Clear button */}
            <button
              onClick={handleClear}
              className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 btn-press"
              title="Effacer l'affichage"
            >
              <Trash2 size={14} />
            </button>

            {/* Close modal */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 btn-press ml-1"
              title="Fermer (Échap)"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Terminal Body */}
        <div className="flex-1 p-5 overflow-y-auto font-mono text-xs leading-relaxed space-y-1 bg-zinc-950 select-text">
          {isLoading && logs.length === 0 ? (
            <div className="h-full flex items-center justify-center text-zinc-500 font-mono">
              Chargement des logs du conteneur...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="h-full flex items-center justify-center text-zinc-500 font-mono">
              Aucun log trouvé pour ce conteneur.
            </div>
          ) : (
            filteredLogs.map((line, idx) => {
              // Highlight keywords: error/warn/info
              const isError = /error|fatal|fail/i.test(line);
              const isWarn = /warn|warning/i.test(line);
              const isInfo = /info/i.test(line);

              let textColor = 'text-zinc-300';
              if (isError) textColor = 'text-red-400 font-semibold';
              else if (isWarn) textColor = 'text-amber-300';
              else if (isInfo) textColor = 'text-sky-300';

              return (
                <div key={idx} className="flex items-start gap-3 hover:bg-zinc-900/60 px-1 py-0.5 rounded">
                  <span className="text-zinc-600 select-none text-[10px] w-9 text-right shrink-0">
                    {idx + 1}
                  </span>
                  <span className={`break-all whitespace-pre-wrap ${textColor}`}>{line}</span>
                </div>
              );
            })
          )}
          <div ref={terminalEndRef} />
        </div>

        {/* Terminal Footer */}
        <div className="px-6 py-2.5 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between text-[11px] font-mono text-zinc-400 select-none">
          <div className="flex items-center gap-3">
            <span>{filteredLogs.length} lignes</span>
            {searchFilter && <span className="text-amber-400">(filtre actif)</span>}
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-nothing-red"></span>
            <span>Flux temps réel Docker</span>
          </div>
        </div>
      </div>
    </div>
  );
};

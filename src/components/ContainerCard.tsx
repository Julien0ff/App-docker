import React from 'react';
import { Play, Square, RotateCw, Terminal, Info, ExternalLink, Cpu, HardDrive, Trash2, ArrowDownCircle } from 'lucide-react';
import { DockerContainer } from '../types';

interface ContainerCardProps {
  container: DockerContainer;
  onStart: (id: string, name: string) => void;
  onStop: (id: string, name: string) => void;
  onRestart: (id: string, name: string) => void;
  onUpdate?: (id: string, name: string) => void;
  onOpenLogs: (container: DockerContainer) => void;
  onOpenDetails: (container: DockerContainer) => void;
  onDelete: (container: DockerContainer) => void;
  actionLoadingId: string | null;
}

export const ContainerCard: React.FC<ContainerCardProps> = ({
  container,
  onStart,
  onStop,
  onRestart,
  onUpdate,
  onOpenLogs,
  onOpenDetails,
  onDelete,
  actionLoadingId,
}) => {
  const isRunning = container.state === 'running';
  const isActionLoading = actionLoadingId === container.id;

  // Extract public web ports and strictly DEDUPLICATE (removes IPv4/IPv6 duplicates)
  const uniquePorts = Array.from(
    new Set(
      container.ports
        .filter((p) => p.PublicPort)
        .map((p) => p.PublicPort!)
    )
  ).sort((a, b) => a - b);

  const displayedPorts = uniquePorts.slice(0, 4);
  const hiddenCount = uniquePorts.length - displayedPorts.length;

  return (
    <div className="rounded-3xl p-5 bg-light-card dark:bg-nothing-card border border-light-border dark:border-nothing-border shadow-card dark:shadow-card-dark flex flex-col justify-between hover:border-zinc-400 dark:hover:border-zinc-700 transition-all duration-200 group">
      {/* Top Header: Name & Status */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="min-w-0">
            <h3 className="font-display font-bold text-base text-zinc-900 dark:text-white truncate group-hover:text-nothing-red transition-colors">
              {container.name}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              {container.stack && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-nothing-subcard text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 shrink-0">
                  {container.stack}
                </span>
              )}
              <p className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 truncate" title={container.image}>
                {container.image}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div
            className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-medium flex items-center gap-1.5 shrink-0 ${
              isRunning
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700/50'
                : 'bg-zinc-100 text-zinc-700 border border-zinc-200 dark:bg-nothing-subcard dark:text-zinc-300 dark:border-zinc-800'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isRunning ? 'bg-nothing-green animate-pulse' : 'bg-zinc-400 dark:bg-zinc-500'
              }`}
            />
            <span>{isRunning ? 'Actif' : 'Arrêté'}</span>
          </div>
        </div>

        {/* Status text detail (e.g., Up 20 minutes) */}
        <p className="text-[11px] font-mono text-zinc-600 dark:text-zinc-300 mb-4 truncate">
          {container.status}
        </p>

        {/* Live Metrics: CPU & RAM */}
        {isRunning && (
          <div className="grid grid-cols-2 gap-2 mb-4 p-2.5 rounded-2xl bg-light-subcard dark:bg-nothing-subcard border border-light-border dark:border-nothing-border/60">
            <div>
              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-600 dark:text-zinc-300 mb-1">
                <span className="flex items-center gap-1">
                  <Cpu size={11} /> CPU
                </span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {container.stats?.cpuPercent ?? 0}%
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-zinc-900 dark:bg-white transition-all duration-300"
                  style={{ width: `${Math.min(container.stats?.cpuPercent ?? 0, 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-600 dark:text-zinc-300 mb-1">
                <span className="flex items-center gap-1">
                  <HardDrive size={11} /> RAM
                </span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {container.stats?.memory?.usageMb ?? 0} MB
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-zinc-900 dark:bg-white transition-all duration-300"
                  style={{ width: `${Math.min(container.stats?.memory?.percent ?? 0, 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Mapped Ports Pills (Deduplicated & Cleaned) */}
        {uniquePorts.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mb-4">
            {displayedPorts.map((port) => (
              <a
                key={port}
                href={`http://localhost:${port}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-mono bg-zinc-100 hover:bg-zinc-200 dark:bg-nothing-subcard dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 transition-colors"
                title={`Ouvrir http://localhost:${port}`}
              >
                <span>:{port}</span>
                <ExternalLink size={9} className="opacity-70" />
              </a>
            ))}
            {hiddenCount > 0 && (
              <span
                className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-nothing-subcard text-zinc-500 border border-zinc-200 dark:border-zinc-800"
                title={`Ports supplémentaires: ${uniquePorts.slice(4).join(', ')}`}
              >
                +{hiddenCount}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Action Footer: Start/Stop/Restart, Logs, Inspect */}
      <div className="pt-3 border-t border-light-border dark:border-nothing-border/60 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {isRunning ? (
            <>
              <button
                onClick={() => onStop(container.id, container.name)}
                disabled={isActionLoading}
                className="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-nothing-subcard dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-medium flex items-center gap-1.5 btn-press border border-light-border dark:border-nothing-border"
                title="Éteindre le conteneur"
              >
                <Square size={13} className="text-nothing-red fill-nothing-red" />
                <span>Stop</span>
              </button>
              <button
                onClick={() => onRestart(container.id, container.name)}
                disabled={isActionLoading}
                className="p-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-nothing-subcard dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-medium flex items-center justify-center btn-press border border-light-border dark:border-nothing-border"
                title="Redémarrer le conteneur"
              >
                <RotateCw size={13} />
              </button>
            </>
          ) : (
            <button
              onClick={() => onStart(container.id, container.name)}
              disabled={isActionLoading}
              className="px-3.5 py-1.5 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 text-xs font-medium flex items-center gap-1.5 btn-press shadow-sm"
              title="Allumer le conteneur"
            >
              <Play size={13} className="fill-current" />
              <span>Démarrer</span>
            </button>
          )}
        </div>

        {/* Logs, Update & Details triggers */}
        <div className="flex items-center gap-1.5">
          {onUpdate && (
            <button
              onClick={() => onUpdate(container.id, container.name)}
              disabled={isActionLoading}
              className="p-1.5 rounded-xl bg-transparent hover:bg-light-hover dark:hover:bg-nothing-subcard text-zinc-500 hover:text-emerald-500 btn-press"
              title="Mettre à jour l'image du conteneur (pull & restart)"
            >
              <ArrowDownCircle size={15} />
            </button>
          )}
          <button
            onClick={() => onOpenLogs(container)}
            className="p-1.5 rounded-xl bg-transparent hover:bg-light-hover dark:hover:bg-nothing-subcard text-zinc-500 hover:text-zinc-900 dark:hover:text-white btn-press"
            title="Consulter les logs"
          >
            <Terminal size={15} />
          </button>
          <button
            onClick={() => onOpenDetails(container)}
            className="p-1.5 rounded-xl bg-transparent hover:bg-light-hover dark:hover:bg-nothing-subcard text-zinc-500 hover:text-zinc-900 dark:hover:text-white btn-press"
            title="Inspecter la configuration"
          >
            <Info size={15} />
          </button>
          <button
            onClick={() => onDelete(container)}
            className="p-1.5 rounded-xl bg-transparent hover:bg-red-500/10 text-zinc-400 hover:text-nothing-red btn-press"
            title="Supprimer le conteneur"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};

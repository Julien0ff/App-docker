import React, { useState } from 'react';
import { Play, Square, RotateCw, Terminal, Info, ExternalLink, ArrowUpDown, Trash2, ArrowDownCircle } from 'lucide-react';
import { DockerContainer } from '../types';

interface ContainerTableProps {
  containers: DockerContainer[];
  onStart: (id: string, name: string) => void;
  onStop: (id: string, name: string) => void;
  onRestart: (id: string, name: string) => void;
  onUpdate?: (id: string, name: string) => void;
  onOpenLogs: (container: DockerContainer) => void;
  onOpenDetails: (container: DockerContainer) => void;
  onDelete: (container: DockerContainer) => void;
  actionLoadingId: string | null;
}

export const ContainerTable: React.FC<ContainerTableProps> = ({
  containers,
  onStart,
  onStop,
  onRestart,
  onUpdate,
  onOpenLogs,
  onOpenDetails,
  onDelete,
  actionLoadingId,
}) => {
  const [sortBy, setSortBy] = useState<'name' | 'state' | 'ram'>('name');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  const handleSort = (field: 'name' | 'state' | 'ram') => {
    if (sortBy === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(field);
      setSortAsc(true);
    }
  };

  const sortedContainers = [...containers].sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'name') cmp = a.name.localeCompare(b.name);
    else if (sortBy === 'state') cmp = a.state.localeCompare(b.state);
    else if (sortBy === 'ram') {
      const ramA = a.stats?.memory?.usageMb || 0;
      const ramB = b.stats?.memory?.usageMb || 0;
      cmp = ramA - ramB;
    }
    return sortAsc ? cmp : -cmp;
  });

  return (
    <div className="mx-8 my-4 rounded-3xl bg-light-card dark:bg-nothing-card border border-light-border dark:border-nothing-border shadow-card dark:shadow-card-dark overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-light-border dark:border-nothing-border bg-light-subcard dark:bg-nothing-subcard text-zinc-500 font-mono">
              <th className="py-3 px-5 font-medium cursor-pointer" onClick={() => handleSort('name')}>
                <div className="flex items-center gap-1.5">
                  <span>Nom du conteneur</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th className="py-3 px-4 font-medium cursor-pointer" onClick={() => handleSort('state')}>
                <div className="flex items-center gap-1.5">
                  <span>État</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th className="py-3 px-4 font-medium">Image</th>
              <th className="py-3 px-4 font-medium">Ports</th>
              <th className="py-3 px-4 font-medium cursor-pointer" onClick={() => handleSort('ram')}>
                <div className="flex items-center gap-1.5">
                  <span>Ressources (CPU / RAM)</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th className="py-3 px-5 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-light-border dark:divide-nothing-border/60">
            {sortedContainers.map((c) => {
              const isRunning = c.state === 'running';
              const isLoading = actionLoadingId === c.id;
              const uniquePorts = Array.from(
                new Set(c.ports.filter((p) => p.PublicPort).map((p) => p.PublicPort!))
              ).sort((a, b) => a - b);
              const displayedPorts = uniquePorts.slice(0, 4);
              const hiddenCount = uniquePorts.length - displayedPorts.length;

              return (
                <tr
                  key={c.id}
                  className="hover:bg-light-hover dark:hover:bg-nothing-subcard/80 transition-colors"
                >
                  {/* Name */}
                  <td className="py-3.5 px-5 font-medium text-zinc-900 dark:text-white font-display text-sm">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          isRunning ? 'bg-nothing-green animate-pulse' : 'bg-zinc-400 dark:bg-zinc-600'
                        }`}
                      />
                      <div className="flex items-center gap-2">
                        <span>{c.name}</span>
                        {c.stack && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-nothing-subcard text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800">
                            {c.stack}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* State badge */}
                  <td className="py-3.5 px-4 font-mono">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                        isRunning
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700/50'
                          : 'bg-zinc-100 text-zinc-700 border border-zinc-200 dark:bg-nothing-subcard dark:text-zinc-300 dark:border-zinc-800'
                      }`}
                    >
                      {isRunning ? 'Actif' : 'Arrêté'}
                    </span>
                  </td>

                  {/* Image */}
                  <td className="py-3.5 px-4 font-mono text-zinc-500 max-w-[220px] truncate" title={c.image}>
                    {c.image}
                  </td>

                  {/* Ports */}
                  <td className="py-3.5 px-4 font-mono">
                    {uniquePorts.length > 0 ? (
                      <div className="flex flex-wrap items-center gap-1">
                        {displayedPorts.map((p) => (
                          <a
                            key={p}
                            href={`http://localhost:${p}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-zinc-100 dark:bg-nothing-subcard hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800"
                          >
                            <span>:{p}</span>
                            <ExternalLink size={8} />
                          </a>
                        ))}
                        {hiddenCount > 0 && (
                          <span
                            className="text-[9px] px-1 py-0.5 rounded bg-zinc-100 dark:bg-nothing-subcard text-zinc-500 border border-zinc-200 dark:border-zinc-800"
                            title={`Autres ports: ${uniquePorts.slice(4).join(', ')}`}
                          >
                            +{hiddenCount}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-zinc-400">—</span>
                    )}
                  </td>

                  {/* CPU / RAM */}
                  <td className="py-3.5 px-4 font-mono text-zinc-700 dark:text-zinc-300">
                    {isRunning ? (
                      <div className="flex items-center gap-3">
                        <span className="text-[11px]">{c.stats?.cpuPercent ?? 0}% CPU</span>
                        <span className="text-zinc-400">•</span>
                        <span className="text-[11px]">{c.stats?.memory?.usageMb ?? 0} MB</span>
                      </div>
                    ) : (
                      <span className="text-zinc-400">—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-5 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      {isRunning ? (
                        <>
                          <button
                            onClick={() => onStop(c.id, c.name)}
                            disabled={isLoading}
                            className="p-1.5 rounded-lg bg-zinc-100 dark:bg-nothing-subcard hover:bg-zinc-200 text-zinc-800 dark:text-zinc-200 btn-press"
                            title="Stop"
                          >
                            <Square size={13} className="text-nothing-red fill-nothing-red" />
                          </button>
                          <button
                            onClick={() => onRestart(c.id, c.name)}
                            disabled={isLoading}
                            className="p-1.5 rounded-lg bg-zinc-100 dark:bg-nothing-subcard hover:bg-zinc-200 text-zinc-800 dark:text-zinc-200 btn-press"
                            title="Redémarrer"
                          >
                            <RotateCw size={13} />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => onStart(c.id, c.name)}
                          disabled={isLoading}
                          className="px-2.5 py-1 rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-medium btn-press flex items-center gap-1"
                        >
                          <Play size={11} className="fill-current" />
                          <span>Start</span>
                        </button>
                      )}

                      {onUpdate && (
                        <button
                          onClick={() => onUpdate(c.id, c.name)}
                          disabled={actionLoadingId === c.id}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-emerald-500 btn-press"
                          title="Mettre à jour l'image (pull & restart)"
                        >
                          <ArrowDownCircle size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => onOpenLogs(c)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white btn-press"
                        title="Logs"
                      >
                        <Terminal size={14} />
                      </button>
                      <button
                        onClick={() => onOpenDetails(c)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white btn-press"
                        title="Détails"
                      >
                        <Info size={14} />
                      </button>
                      <button
                        onClick={() => onDelete(c)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-nothing-red btn-press"
                        title="Supprimer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

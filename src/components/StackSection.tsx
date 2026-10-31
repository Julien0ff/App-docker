import React, { useState } from 'react';
import {
  FolderGit2,
  Play,
  Square,
  RotateCw,
  ChevronDown,
  ChevronRight,
  FileCode,
  ArrowDownCircle,
} from 'lucide-react';
import { DockerContainer, StackGroup } from '../types';
import { ContainerCard } from './ContainerCard';

interface StackSectionProps {
  stacks: StackGroup[];
  onStartStack: (stackName: string) => void;
  onStopStack: (stackName: string) => void;
  onRestartStack: (stackName: string) => void;
  onUpdateStack?: (stackName: string) => void;
  onEditCompose?: (stackName: string) => void;
  onStartContainer: (id: string, name: string) => void;
  onStopContainer: (id: string, name: string) => void;
  onRestartContainer: (id: string, name: string) => void;
  onUpdateContainer?: (id: string, name: string) => void;
  onOpenLogs: (container: DockerContainer) => void;
  onOpenDetails: (container: DockerContainer) => void;
  onDeleteContainer: (container: DockerContainer) => void;
  actionLoadingId: string | null;
  stackLoadingName: string | null;
}

export const StackSection: React.FC<StackSectionProps> = ({
  stacks,
  onStartStack,
  onStopStack,
  onRestartStack,
  onUpdateStack,
  onEditCompose,
  onStartContainer,
  onStopContainer,
  onRestartContainer,
  onUpdateContainer,
  onOpenLogs,
  onOpenDetails,
  onDeleteContainer,
  actionLoadingId,
  stackLoadingName,
}) => {
  // Collapsed state per stack (default all expanded)
  const [collapsedStacks, setCollapsedStacks] = useState<Record<string, boolean>>({});

  const toggleCollapse = (stackName: string) => {
    setCollapsedStacks((prev) => ({
      ...prev,
      [stackName]: !prev[stackName],
    }));
  };

  return (
    <div className="space-y-6">
      {stacks.map((stack) => {
        const isCollapsed = !!collapsedStacks[stack.name];
        const isStackLoading = stackLoadingName === stack.name;
        const allRunning = stack.runningCount === stack.totalCount && stack.totalCount > 0;
        const allStopped = stack.runningCount === 0;

        return (
          <div
            key={stack.name}
            className="rounded-3xl bg-light-card dark:bg-nothing-card border border-light-border dark:border-nothing-border shadow-card dark:shadow-card-dark overflow-hidden transition-all duration-200"
          >
            {/* Stack Header */}
            <div className="p-5 bg-light-subcard dark:bg-nothing-subcard border-b border-light-border dark:border-nothing-border flex flex-wrap items-center justify-between gap-4 select-none">
              <div
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => toggleCollapse(stack.name)}
              >
                <button className="p-1 rounded-lg text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
                  {isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                </button>

                <div className="w-9 h-9 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 flex items-center justify-center shadow-xs">
                  <FolderGit2 size={18} />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display font-bold text-base text-zinc-900 dark:text-white group-hover:text-nothing-red transition-colors">
                      {stack.name}
                    </h2>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-medium flex items-center gap-1.5 ${
                        allRunning
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700/50'
                          : allStopped
                          ? 'bg-zinc-100 text-zinc-700 border border-zinc-200 dark:bg-nothing-subcard dark:text-zinc-300 dark:border-zinc-800'
                          : 'bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700/50'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          allRunning
                            ? 'bg-nothing-green animate-pulse'
                            : allStopped
                            ? 'bg-zinc-400 dark:bg-zinc-500'
                            : 'bg-amber-400'
                        }`}
                      />
                      <span>
                        {stack.runningCount}/{stack.totalCount} actifs
                      </span>
                    </span>
                  </div>

                  {stack.dir && (
                    <p className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 truncate max-w-md mt-0.5" title={stack.dir}>
                      Dossier : {stack.dir}
                    </p>
                  )}
                </div>
              </div>

              {/* Stack Controls: Edit Compose, Update Stack, Batch start/stop */}
              {stack.name !== 'Conteneurs autonomes' && (
                <div className="flex items-center gap-2">
                  {onEditCompose && (
                    <button
                      onClick={() => onEditCompose(stack.name)}
                      className="px-3 py-1.5 rounded-xl bg-light-card dark:bg-nothing-card hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-xs font-mono flex items-center gap-1.5 btn-press border border-light-border dark:border-nothing-border"
                      title={`Éditer le docker-compose.yml de ${stack.name}`}
                    >
                      <FileCode size={13} className="text-nothing-red" />
                      <span>Éditer Compose</span>
                    </button>
                  )}

                  {onUpdateStack && (
                    <button
                      onClick={() => onUpdateStack(stack.name)}
                      disabled={isStackLoading}
                      className="px-3 py-1.5 rounded-xl bg-light-card dark:bg-nothing-card hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-xs font-mono flex items-center gap-1.5 btn-press border border-light-border dark:border-nothing-border"
                      title={`Mettre à jour la stack ${stack.name} (pull des images & redéploiement)`}
                    >
                      <ArrowDownCircle size={13} className={isStackLoading ? 'animate-spin text-nothing-red' : 'text-emerald-500'} />
                      <span>Mettre à jour</span>
                    </button>
                  )}

                  <span className="text-[11px] font-mono text-zinc-400 hidden sm:inline">
                    Actions :
                  </span>

                  <button
                    onClick={() => onStartStack(stack.name)}
                    disabled={isStackLoading}
                    className="px-3 py-1.5 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 text-xs font-medium flex items-center gap-1.5 btn-press shadow-xs"
                    title={`Allumer tous les conteneurs de ${stack.name}`}
                  >
                    <Play size={12} className="fill-current" />
                    <span>Tout allumer</span>
                  </button>

                  <button
                    onClick={() => onStopStack(stack.name)}
                    disabled={isStackLoading}
                    className="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-nothing-card dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-medium flex items-center gap-1.5 btn-press border border-light-border dark:border-nothing-border"
                    title={`Éteindre tous les conteneurs de ${stack.name}`}
                  >
                    <Square size={12} className="text-nothing-red fill-nothing-red" />
                    <span>Tout éteindre</span>
                  </button>

                  <button
                    onClick={() => onRestartStack(stack.name)}
                    disabled={isStackLoading}
                    className="p-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-nothing-card dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 btn-press border border-light-border dark:border-nothing-border"
                    title={`Redémarrer tous les conteneurs de ${stack.name}`}
                  >
                    <RotateCw size={14} className={isStackLoading ? 'animate-spin text-nothing-red' : ''} />
                  </button>
                </div>
              )}
            </div>

            {/* Stack Containers Grid (Collapsible) */}
            {!isCollapsed && (
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 bg-light-bg/40 dark:bg-nothing-bg/40">
                {stack.containers.map((c) => (
                  <ContainerCard
                    key={c.id}
                    container={c}
                    onStart={onStartContainer}
                    onStop={onStopContainer}
                    onRestart={onRestartContainer}
                    onUpdate={onUpdateContainer}
                    onOpenLogs={onOpenLogs}
                    onOpenDetails={onOpenDetails}
                    onDelete={onDeleteContainer}
                    actionLoadingId={actionLoadingId}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

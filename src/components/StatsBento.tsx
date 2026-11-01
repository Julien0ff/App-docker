import React from 'react';
import { Cpu, HardDrive, Power, CheckCircle2, Shield, Activity } from 'lucide-react';
import { SystemHost, SystemdStatus } from '../types';

interface StatsBentoProps {
  totalContainers: number;
  runningContainers: number;
  stoppedContainers: number;
  host?: SystemHost;
  dockerVersion?: any;
  systemd?: SystemdStatus;
  isAutostartToggling: boolean;
  onToggleAutostart: () => void;
  onOpenAutostartModal: () => void;
}

export const StatsBento: React.FC<StatsBentoProps> = ({
  totalContainers,
  runningContainers,
  stoppedContainers,
  host,
  dockerVersion,
  systemd,
  isAutostartToggling,
  onToggleAutostart,
  onOpenAutostartModal,
}) => {
  const ramPercent = host
    ? Math.round((host.memoryUsedGb / host.memoryTotalGb) * 100)
    : 0;

  return (
    <section className="px-8 py-3 grid grid-cols-1 md:grid-cols-3 gap-5 select-none">
      {/* CARD 1: Overall Information (Black high-contrast card inspired by iDraft) */}
      <div className="rounded-3xl p-6 bg-zinc-950 text-white shadow-card-dark flex flex-col justify-between relative overflow-hidden group">
        {/* Subtle dot pattern */}
        <div className="absolute inset-0 nothing-dots opacity-30 pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono tracking-wider uppercase text-zinc-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-nothing-red"></span>
              Statut Global
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
              Live Docker
            </span>
          </div>

          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-4xl font-display font-bold tracking-tight text-white">
              {totalContainers}
            </span>
            <span className="text-xs text-zinc-400 font-mono">
              conteneurs détectés
            </span>
          </div>
        </div>

        {/* 3 mini pill-cards inside (like in iDraft) */}
        <div className="grid grid-cols-3 gap-2.5 relative z-10">
          <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800/80 text-center">
            <div className="text-lg font-bold font-display text-white">{totalContainers}</div>
            <div className="text-[10px] text-zinc-400 font-mono mt-0.5">Total</div>
          </div>
          <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800/80 text-center">
            <div className="text-lg font-bold font-display text-nothing-green flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-nothing-green animate-pulse"></span>
              {runningContainers}
            </div>
            <div className="text-[10px] text-zinc-400 font-mono mt-0.5">En cours</div>
          </div>
          <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800/80 text-center">
            <div className="text-lg font-bold font-display text-zinc-400">{stoppedContainers}</div>
            <div className="text-[10px] text-zinc-400 font-mono mt-0.5">Arrêtés</div>
          </div>
        </div>
      </div>

      {/* CARD 2: Host Machine & Engine (Light or Dark bento) */}
      <div className="rounded-3xl p-6 bg-light-card dark:bg-nothing-card border border-light-border dark:border-nothing-border shadow-card dark:shadow-card-dark flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono tracking-wider uppercase text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
              <Activity size={14} className="text-zinc-600 dark:text-zinc-300" />
              Machine Hôte ({host?.platform === 'darwin' ? 'macOS' : host?.platform === 'win32' ? 'Windows' : host?.platform === 'linux' ? 'Linux' : (host?.platform || 'Hôte')})
            </span>
            <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-300 truncate max-w-[140px]">
              {host?.cpuModel.split(' ')[0] || (host?.platform === 'darwin' ? 'Apple Silicon' : 'CPU')} {host?.arch ? `• ${host.arch}` : ''}
            </span>
          </div>

          {/* RAM Progress & Metric */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5 font-mono">
                <span className="text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5">
                  <HardDrive size={13} /> Mémoire RAM Hôte
                </span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {host ? `${host.memoryUsedGb} GB / ${host.memoryTotalGb} GB` : '—'} ({ramPercent}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-nothing-subcard overflow-hidden">
                <div
                  className="h-full rounded-full bg-zinc-900 dark:bg-white transition-all duration-500 ease-emil-out"
                  style={{ width: `${Math.min(ramPercent, 100)}%` }}
                />
              </div>
            </div>

            {/* CPU & Kernel info pills */}
            <div className="flex items-center justify-between pt-2 border-t border-light-border dark:border-nothing-border text-xs">
              <span className="text-zinc-500 flex items-center gap-1 font-mono">
                <Cpu size={13} /> Cœurs CPU
              </span>
              <span className="font-mono text-zinc-800 dark:text-zinc-200">
                {host?.cpuCores || 4} threads
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500 font-mono">Docker Engine</span>
              <span className="font-mono text-zinc-800 dark:text-zinc-200">
                v{dockerVersion?.Version || '29.x'}
              </span>
            </div>
          </div>
        </div>

        <div className="pt-3 text-[11px] font-mono text-zinc-400 flex items-center justify-between">
          <span>Uptime machine :</span>
          <span className="text-zinc-600 dark:text-zinc-300">
            {host ? `${Math.floor(host.uptime / 3600)}h ${Math.floor((host.uptime % 3600) / 60)}m` : '—'}
          </span>
        </div>
      </div>

      {/* CARD 3: Autostart on Boot (Requested feature) */}
      <div className="rounded-3xl p-6 bg-light-card dark:bg-nothing-card border border-light-border dark:border-nothing-border shadow-card dark:shadow-card-dark flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono tracking-wider uppercase text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
              <Power size={14} className={systemd?.isEnabled ? 'text-nothing-green' : 'text-zinc-400'} />
              Démarrage au Boot
            </span>
            <button
              onClick={onOpenAutostartModal}
              className="text-[11px] font-mono text-zinc-500 hover:text-zinc-900 dark:hover:text-white underline underline-offset-2"
            >
              Détails
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {systemd?.isEnabled ? 'Actif au démarrage' : 'Désactivé au boot'}
                </p>
                <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                  systemd --user ({systemd?.serviceName})
                </p>
              </div>

              {/* Minimalist Nothing-style Toggle Switch */}
              <button
                onClick={onToggleAutostart}
                disabled={isAutostartToggling}
                className={`w-12 h-6 rounded-full p-0.5 transition-colors duration-200 ease-emil-out relative btn-press ${
                  systemd?.isEnabled
                    ? 'bg-nothing-green shadow-glow-green'
                    : 'bg-zinc-300 dark:bg-zinc-700'
                }`}
                title={systemd?.isEnabled ? 'Désactiver le démarrage auto' : 'Activer le démarrage auto'}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform duration-200 ease-emil-out ${
                    systemd?.isEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-light-subcard dark:bg-nothing-subcard border border-light-border dark:border-nothing-border/60 space-y-1.5 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Service :</span>
                <span className="text-zinc-700 dark:text-zinc-300">dockdash.service</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Port boot :</span>
                <span className="text-zinc-700 dark:text-zinc-300 font-bold">4500</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Linger user :</span>
                <span className={systemd?.isLinger ? 'text-nothing-green' : 'text-zinc-500'}>
                  {systemd?.isLinger ? 'Oui (Boot sans login)' : 'Non'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
          <span>Statut :</span>
          <span className={`font-medium flex items-center gap-1 ${systemd?.isEnabled ? 'text-nothing-green' : 'text-zinc-500'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${systemd?.isEnabled ? 'bg-nothing-green animate-pulse' : 'bg-zinc-400'}`}></span>
            {systemd?.statusText || 'Prêt'}
          </span>
        </div>
      </div>
    </section>
  );
};

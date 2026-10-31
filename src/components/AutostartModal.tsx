import React from 'react';
import { X, Power, CheckCircle2, Copy, Terminal, Shield, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { SystemdStatus } from '../types';

interface AutostartModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemd?: SystemdStatus;
  isToggling: boolean;
  onToggle: () => void;
}

export const AutostartModal: React.FC<AutostartModalProps> = ({
  isOpen,
  onClose,
  systemd,
  isToggling,
  onToggle,
}) => {
  if (!isOpen) return null;

  const handleCopyCmd = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    toast.success('Commande copiée');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm animate-fade-in select-none">
      <div className="w-full max-w-2xl rounded-3xl bg-light-card dark:bg-nothing-card border border-light-border dark:border-nothing-border shadow-2xl flex flex-col overflow-hidden text-zinc-900 dark:text-zinc-100">
        {/* Header */}
        <div className="px-6 py-5 bg-light-subcard dark:bg-nothing-subcard border-b border-light-border dark:border-nothing-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-white ${systemd?.isEnabled ? 'bg-nothing-green' : 'bg-zinc-800'
                }`}
            >
              <Power size={18} />
            </div>
            <div>
              <h2 className="font-display font-bold text-base text-zinc-900 dark:text-white">
                Démarrage Automatique au Boot
              </h2>
              <p className="text-xs font-mono text-zinc-600 dark:text-zinc-300">
                Service utilisateur persistant
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-light-hover dark:bg-nothing-hover text-zinc-500 hover:text-zinc-900 dark:hover:text-white btn-press"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
          {/* Main State Card */}
          <div className="p-5 rounded-2xl bg-light-subcard dark:bg-nothing-subcard border border-light-border dark:border-nothing-border flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`w-2 h-2 rounded-full ${systemd?.isEnabled ? 'bg-nothing-green animate-pulse' : 'bg-zinc-400'
                    }`}
                />
                <span className="font-display font-bold text-sm text-zinc-900 dark:text-white">
                  {systemd?.isEnabled ? 'Actif au démarrage de la machine' : 'Désactivé'}
                </span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-300 font-mono">
                {systemd?.isEnabled
                  ? 'L’application démarrera automatiquement sur le port 4500 au boot.'
                  : 'L’application ne démarre que manuellement via npm run dev ou npm start.'}
              </p>
            </div>

            {/* Main Toggle Switch */}
            <button
              onClick={onToggle}
              disabled={isToggling}
              className={`px-4 py-2 rounded-xl text-xs font-medium font-mono btn-press shadow-sm flex items-center gap-2 ${systemd?.isEnabled
                  ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-300 dark:hover:bg-zinc-700'
                  : 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-bold'
                }`}
            >
              <Power size={14} />
              <span>{systemd?.isEnabled ? 'Désactiver' : 'Activer au Boot'}</span>
            </button>
          </div>

          {/* Configuration & Files details */}
          <div className="space-y-3">
            <h3 className="font-display font-bold text-xs text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
              Détails du Service
            </h3>

            <div className="p-4 rounded-2xl bg-zinc-950 text-zinc-300 font-mono text-xs space-y-2 select-text">
              <div className="flex justify-between border-b border-zinc-800 pb-1.5">
                <span className="text-zinc-500">Nom de l'unité :</span>
                <span className="text-white font-bold">{systemd?.serviceName || 'dockdash.service'}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800 pb-1.5">
                <span className="text-zinc-500">Emplacement :</span>
                <span className="text-zinc-300 truncate max-w-xs">{systemd?.serviceFilePath}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800 pb-1.5">
                <span className="text-zinc-500">Mode Linger utilisateur :</span>
                <span className={systemd?.isLinger ? 'text-nothing-green' : 'text-amber-400'}>
                  {systemd?.isLinger ? 'Actif (Démarrage avant login)' : 'Non configuré'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Port HTTP en production :</span>
                <span className="text-white font-bold">4500 (http://localhost:4500)</span>
              </div>
            </div>
          </div>

          {/* Useful Arch Linux CLI commands */}
          <div className="space-y-3">
            <h3 className="font-display font-bold text-xs text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
              Commandes utiles dans votre terminal
            </h3>

            <div className="space-y-2 font-mono text-xs select-text">
              <div
                onClick={() => handleCopyCmd('systemctl --user status dockdash.service')}
                className="p-3 rounded-xl bg-light-subcard dark:bg-nothing-subcard border border-light-border dark:border-nothing-border flex items-center justify-between cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
                title="Cliquer pour copier"
              >
                <div className="flex items-center gap-2">
                  <Terminal size={14} className="text-zinc-500" />
                  <span className="text-zinc-800 dark:text-zinc-200">
                    systemctl --user status dockdash.service
                  </span>
                </div>
                <Copy size={13} className="text-zinc-400" />
              </div>

              <div
                onClick={() => handleCopyCmd('journalctl --user -u dockdash.service -f')}
                className="p-3 rounded-xl bg-light-subcard dark:bg-nothing-subcard border border-light-border dark:border-nothing-border flex items-center justify-between cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
                title="Cliquer pour copier"
              >
                <div className="flex items-center gap-2">
                  <Terminal size={14} className="text-zinc-500" />
                  <span className="text-zinc-800 dark:text-zinc-200">
                    journalctl --user -u dockdash.service -f
                  </span>
                </div>
                <Copy size={13} className="text-zinc-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-light-subcard dark:bg-nothing-subcard border-t border-light-border dark:border-nothing-border flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 text-xs font-semibold btn-press"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

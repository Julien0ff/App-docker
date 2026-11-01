import React, { useState, useEffect } from 'react';
import { X, Power, Copy, Terminal, CheckCircle2, Shield, Laptop } from 'lucide-react';
import { toast } from 'sonner';
import { SystemdStatus } from '../types';
import { Language } from '../i18n/translations';

interface AutostartModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemd?: SystemdStatus;
  isToggling: boolean;
  onToggle: () => void;
  hostPlatform?: string;
  lang?: Language;
}

export const AutostartModal: React.FC<AutostartModalProps> = ({
  isOpen,
  onClose,
  systemd,
  isToggling,
  onToggle,
  hostPlatform = 'linux',
  lang = 'fr',
}) => {
  const [selectedOs, setSelectedOs] = useState<'linux' | 'mac' | 'win'>('linux');

  useEffect(() => {
    if (hostPlatform === 'darwin') setSelectedOs('mac');
    else if (hostPlatform === 'win32') setSelectedOs('win');
    else setSelectedOs('linux');
  }, [hostPlatform]);

  if (!isOpen) return null;

  const handleCopyCmd = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    toast.success(lang === 'fr' ? 'Commande copiée' : 'Command copied');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm animate-fade-in select-none">
      <div className="w-full max-w-2xl rounded-3xl bg-light-card dark:bg-nothing-card border border-light-border dark:border-nothing-border shadow-2xl flex flex-col overflow-hidden text-zinc-900 dark:text-zinc-100">
        {/* Header */}
        <div className="px-6 py-5 bg-light-subcard dark:bg-nothing-subcard border-b border-light-border dark:border-nothing-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-white ${
                systemd?.isEnabled ? 'bg-nothing-green' : 'bg-zinc-800'
              }`}
            >
              <Power size={18} />
            </div>
            <div>
              <h2 className="font-display font-bold text-base text-zinc-900 dark:text-white">
                {lang === 'fr' ? 'Démarrage Automatique au Boot' : 'System Boot Autostart'}
              </h2>
              <p className="text-xs font-mono text-zinc-600 dark:text-zinc-300">
                {lang === 'fr' ? 'Support natif Linux, macOS & Windows' : 'Native support for Linux, macOS & Windows'}
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

        {/* OS Selector Tabs */}
        <div className="flex border-b border-light-border dark:border-nothing-border bg-light-card dark:bg-nothing-card px-6 pt-3 gap-2">
          <button
            onClick={() => setSelectedOs('linux')}
            className={`px-4 py-2 text-xs font-mono rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
              selectedOs === 'linux'
                ? 'border-[#ea3829] text-[#ea3829] font-bold bg-light-hover dark:bg-nothing-subcard'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <span>Linux (systemd)</span>
            {hostPlatform === 'linux' && (
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#ea3829]/15 text-[#ea3829] font-sans">Actuel</span>
            )}
          </button>

          <button
            onClick={() => setSelectedOs('mac')}
            className={`px-4 py-2 text-xs font-mono rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
              selectedOs === 'mac'
                ? 'border-[#ea3829] text-[#ea3829] font-bold bg-light-hover dark:bg-nothing-subcard'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <span>macOS (Launchd)</span>
            {hostPlatform === 'darwin' && (
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#ea3829]/15 text-[#ea3829] font-sans">Actuel</span>
            )}
          </button>

          <button
            onClick={() => setSelectedOs('win')}
            className={`px-4 py-2 text-xs font-mono rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
              selectedOs === 'win'
                ? 'border-[#ea3829] text-[#ea3829] font-bold bg-light-hover dark:bg-nothing-subcard'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <span>Windows (Startup)</span>
            {hostPlatform === 'win32' && (
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#ea3829]/15 text-[#ea3829] font-sans">Actuel</span>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          {/* LINUX TAB */}
          {selectedOs === 'linux' && (
            <div className="space-y-6">
              {/* Main State Card */}
              <div className="p-5 rounded-2xl bg-light-subcard dark:bg-nothing-subcard border border-light-border dark:border-nothing-border flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        systemd?.isEnabled ? 'bg-nothing-green animate-pulse' : 'bg-zinc-400'
                      }`}
                    />
                    <span className="font-display font-bold text-sm text-zinc-900 dark:text-white">
                      {systemd?.isEnabled ? 'Service actif au boot Linux' : 'Désactivé'}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 font-mono">
                    {systemd?.isEnabled
                      ? 'Dock (1) démarrera automatiquement au boot sans avoir besoin de vous connecter.'
                      : 'Le service utilisateur n\'est pas encore activé.'}
                  </p>
                </div>

                <button
                  onClick={onToggle}
                  disabled={isToggling}
                  className={`px-4 py-2 rounded-xl text-xs font-medium font-mono btn-press shadow-sm flex items-center gap-2 ${
                    systemd?.isEnabled
                      ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-300 dark:hover:bg-zinc-700'
                      : 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-bold'
                  }`}
                >
                  <Power size={14} />
                  <span>{systemd?.isEnabled ? 'Désactiver' : 'Activer au Boot'}</span>
                </button>
              </div>

              {/* Linux Details */}
              <div className="space-y-3">
                <h3 className="font-display font-bold text-xs text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
                  Détails du Service Systemd
                </h3>
                <div className="p-4 rounded-2xl bg-zinc-950 text-zinc-300 font-mono text-xs space-y-2 select-text">
                  <div className="flex justify-between border-b border-zinc-800 pb-1.5">
                    <span className="text-zinc-500">Unité :</span>
                    <span className="text-white font-bold">{systemd?.serviceName || 'dockdash.service'}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-800 pb-1.5">
                    <span className="text-zinc-500">Emplacement :</span>
                    <span className="text-zinc-300 truncate max-w-xs">{systemd?.serviceFilePath}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Mode Linger utilisateur :</span>
                    <span className={systemd?.isLinger ? 'text-nothing-green' : 'text-amber-400'}>
                      {systemd?.isLinger ? 'Actif (Démarrage avant login)' : 'Non configuré'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Terminal CLI commands */}
              <div className="space-y-2 font-mono text-xs select-text">
                <div
                  onClick={() => handleCopyCmd('systemctl --user status dockdash.service')}
                  className="p-3 rounded-xl bg-light-subcard dark:bg-nothing-subcard border border-light-border dark:border-nothing-border flex items-center justify-between cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
                  title="Cliquer pour copier"
                >
                  <div className="flex items-center gap-2">
                    <Terminal size={14} className="text-zinc-500" />
                    <span className="text-zinc-800 dark:text-zinc-200">systemctl --user status dockdash.service</span>
                  </div>
                  <Copy size={13} className="text-zinc-400" />
                </div>
              </div>
            </div>
          )}

          {/* MACOS TAB */}
          {selectedOs === 'mac' && (
            <div className="space-y-5">
              <div className="p-5 rounded-2xl bg-light-subcard dark:bg-nothing-subcard border border-light-border dark:border-nothing-border">
                <h3 className="font-display font-bold text-sm text-zinc-900 dark:text-white mb-2">
                  Démarrage Automatique sur macOS
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed mb-4">
                  Sur macOS, vous pouvez lancer Dock (1) en ouverture de session soit via les Réglages Système, soit en tâche d'arrière-plan avec Launchd.
                </p>

                <div className="space-y-3 font-mono text-xs">
                  <div className="p-3.5 rounded-xl bg-zinc-950 text-zinc-300 border border-zinc-800 flex flex-col gap-1.5">
                    <span className="text-[11px] text-[#ea3829] font-bold">Méthode 1 : Réglages Système Apple</span>
                    <p className="text-zinc-400 text-[11px]">
                      Allez dans <strong>Réglages Système &gt; Général &gt; Ouverture</strong> et ajoutez l'application <strong>Dock (1)</strong>.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-950 text-zinc-300 border border-zinc-800 flex flex-col gap-2">
                    <span className="text-[11px] text-zinc-400 font-bold">Méthode 2 : Commande AppleScript (1-Clic)</span>
                    <div
                      onClick={() =>
                        handleCopyCmd(
                          'osascript -e \'tell application "System Events" to make login item at end with properties {name:"Dock (1)", path:"/Applications/Dock (1).app", hidden:false}\''
                        )
                      }
                      className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-between cursor-pointer hover:border-zinc-600"
                    >
                      <span className="text-[11px] text-emerald-400 truncate max-w-md">
                        osascript -e 'tell application "System Events" to make login item...'
                      </span>
                      <Copy size={13} className="text-zinc-400 shrink-0 ml-2" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* WINDOWS TAB */}
          {selectedOs === 'win' && (
            <div className="space-y-5">
              <div className="p-5 rounded-2xl bg-light-subcard dark:bg-nothing-subcard border border-light-border dark:border-nothing-border">
                <h3 className="font-display font-bold text-sm text-zinc-900 dark:text-white mb-2">
                  Démarrage Automatique sur Windows 10 / 11
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed mb-4">
                  Sur Windows, placez un raccourci de l'exécutable Dock (1) dans votre dossier de démarrage personnel.
                </p>

                <div className="space-y-3 font-mono text-xs">
                  <div className="p-3.5 rounded-xl bg-zinc-950 text-zinc-300 border border-zinc-800 flex flex-col gap-2">
                    <span className="text-[11px] text-[#ea3829] font-bold">Ouvrir le dossier Démarrage Windows</span>
                    <div
                      onClick={() => handleCopyCmd('explorer.exe shell:startup')}
                      className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-between cursor-pointer hover:border-zinc-600"
                    >
                      <span className="text-zinc-200">explorer.exe shell:startup</span>
                      <Copy size={13} className="text-zinc-400 shrink-0 ml-2" />
                    </div>
                    <span className="text-[10px] text-zinc-500">
                      Appuyez sur Win + R, collez la commande, puis glissez le raccourci de Dock (1) dans le dossier ouvert.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-light-subcard dark:bg-nothing-subcard border-t border-light-border dark:border-nothing-border flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 text-xs font-semibold btn-press"
          >
            {lang === 'fr' ? 'Fermer' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  X,
  RotateCw,
  ArrowUpCircle,
  CheckCircle2,
  ExternalLink,
  Download,
  Sparkles,
} from 'lucide-react';
import { UpdateCheckResponse } from '../types';
import { Language, translations } from '../i18n/translations';
import { checkSystemUpdates } from '../services/api';
import { toast } from 'sonner';

interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  updateInfo: UpdateCheckResponse | null;
  onUpdateInfoChange: (info: UpdateCheckResponse) => void;
  lang?: Language;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({
  isOpen,
  onClose,
  updateInfo,
  onUpdateInfoChange,
  lang = 'fr',
}) => {
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [autoCheck, setAutoCheck] = useState<boolean>(() => {
    return localStorage.getItem('dockdash_auto_check_updates') !== 'false';
  });

  if (!isOpen) return null;

  const currentVersion = updateInfo?.currentVersion || '26.2.5';
  const hasUpdate = !!updateInfo?.hasUpdate;
  const latestVersion = updateInfo?.latestVersion || currentVersion;

  const handleCheck = async () => {
    setIsChecking(true);
    try {
      const data = await checkSystemUpdates();
      if (data && data.success) {
        onUpdateInfoChange(data);
        if (data.hasUpdate) {
          toast.info(lang === 'fr' ? `Nouvelle version v${data.latestVersion} disponible !` : `New version v${data.latestVersion} available!`);
        } else {
          toast.success(lang === 'fr' ? 'Dock (1) est parfaitement à jour !' : 'Dock (1) is completely up to date!');
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Erreur vérification');
    } finally {
      setIsChecking(false);
    }
  };

  const handleToggleAutoCheck = () => {
    const next = !autoCheck;
    setAutoCheck(next);
    localStorage.setItem('dockdash_auto_check_updates', String(next));
    toast.success(
      next
        ? (lang === 'fr' ? 'Recherche automatique au démarrage activée' : 'Auto check on launch enabled')
        : (lang === 'fr' ? 'Recherche automatique désactivée' : 'Auto check disabled')
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in select-none">
      <div
        className="w-full max-w-lg bg-white dark:bg-[#0f1013] border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col transition-all"
        style={{ boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.4)' }}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ea3829] shadow-[0_0_10px_#ea3829]" />
            <div>
              <h2 className="text-base font-display font-bold text-zinc-900 dark:text-white">
                {lang === 'fr' ? 'Mises à jour Dock (1)' : 'Dock (1) Updates'}
              </h2>
              <p className="text-[11px] font-mono text-zinc-500">
                {lang === 'fr' ? 'Gestion des versions & GitHub Releases' : 'Version management & GitHub Releases'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-zinc-900 dark:text-zinc-100">
          {/* Version Status Box */}
          <div
            className={`p-5 rounded-2xl border flex flex-col gap-3 transition-colors ${
              hasUpdate
                ? 'bg-[#ea3829]/5 dark:bg-[#ea3829]/10 border-[#ea3829]/30'
                : 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/20'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {hasUpdate ? (
                  <ArrowUpCircle size={20} className="text-[#ea3829] animate-bounce" />
                ) : (
                  <CheckCircle2 size={20} className="text-emerald-500" />
                )}
                <div>
                  <span className="font-semibold text-sm">
                    {hasUpdate
                      ? (lang === 'fr' ? 'Mise à jour disponible !' : 'Update available!')
                      : (lang === 'fr' ? 'Votre application est à jour' : 'You are up to date')}
                  </span>
                  <div className="text-[11px] font-mono text-zinc-500">
                    {hasUpdate
                      ? (lang === 'fr' ? `Version v${latestVersion} prête` : `Version v${latestVersion} ready`)
                      : (lang === 'fr' ? 'Aucune nouvelle version détectée' : 'Running the latest version')}
                  </div>
                </div>
              </div>

              <span className="font-mono text-xs px-2.5 py-1 rounded-full bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                v{currentVersion}
              </span>
            </div>

            {hasUpdate && updateInfo?.releaseName && (
              <div className="pt-2 border-t border-[#ea3829]/20 text-xs text-zinc-700 dark:text-zinc-300 font-mono">
                <strong>{updateInfo.releaseName}</strong>
                {updateInfo.publishedAt && (
                  <span className="text-zinc-500 text-[10px] ml-2">
                    ({new Date(updateInfo.publishedAt).toLocaleDateString()})
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Release Notes if update available */}
          {hasUpdate && updateInfo?.body && (
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 max-h-40 overflow-y-auto font-mono text-xs text-zinc-600 dark:text-zinc-300 space-y-1">
              <div className="text-[10px] uppercase font-bold text-zinc-500 mb-1">
                {lang === 'fr' ? 'Notes de version :' : 'Release Notes:'}
              </div>
              <div className="whitespace-pre-wrap leading-relaxed text-[11px]">
                {updateInfo.body}
              </div>
            </div>
          )}

          {/* Preferences Row */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80">
            <div>
              <div className="text-xs font-semibold">
                {lang === 'fr' ? 'Vérifier au lancement' : 'Check on launch'}
              </div>
              <div className="text-[11px] font-mono text-zinc-500">
                {lang === 'fr' ? 'Recherche automatique dès l\'ouverture' : 'Automatically poll GitHub Releases'}
              </div>
            </div>

            <button
              onClick={handleToggleAutoCheck}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                autoCheck ? 'bg-[#ea3829]' : 'bg-zinc-300 dark:bg-zinc-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                  autoCheck ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 flex items-center justify-between gap-3">
          <button
            onClick={handleCheck}
            disabled={isChecking}
            className="px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 btn-press flex items-center gap-1.5 disabled:opacity-50"
          >
            <RotateCw size={14} className={isChecking ? 'animate-spin text-[#ea3829]' : ''} />
            <span>{isChecking ? 'Vérification...' : lang === 'fr' ? 'Rechercher des màj' : 'Check for updates'}</span>
          </button>

          {hasUpdate ? (
            <a
              href={updateInfo?.releaseUrl || 'https://github.com/Julien0ff/App-docker/releases'}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-[#ea3829] text-white text-xs font-semibold hover:bg-[#ea3829]/90 btn-press flex items-center gap-1.5 shadow-xs"
            >
              <Download size={14} />
              <span>{lang === 'fr' ? 'Télécharger v' + latestVersion : 'Download v' + latestVersion}</span>
              <ExternalLink size={12} />
            </a>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 text-xs font-semibold btn-press"
            >
              {lang === 'fr' ? 'Fermer' : 'Close'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

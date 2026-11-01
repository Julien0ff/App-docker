import React, { useState } from 'react';
import { X, Trash2, AlertTriangle, HardDrive, ShieldAlert, Loader2 } from 'lucide-react';
import { DockerContainer } from '../types';

interface DeleteContainerModalProps {
  container: DockerContainer | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: (id: string, force: boolean, removeVolumes: boolean) => Promise<void>;
}

export const DeleteContainerModal: React.FC<DeleteContainerModalProps> = ({
  container,
  isOpen,
  onClose,
  onConfirmDelete,
}) => {
  if (!isOpen || !container) return null;

  const isRunning = container.state === 'running';
  const [force, setForce] = useState(isRunning);
  const [removeVolumes, setRemoveVolumes] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onConfirmDelete(container.id, force, removeVolumes);
      onClose();
    } catch (e) {
      // Error is handled via toast in parent
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-sm animate-fade-in select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl bg-light-card dark:bg-nothing-card border border-light-border dark:border-nothing-border shadow-2xl flex flex-col overflow-hidden text-zinc-900 dark:text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-light-subcard dark:bg-nothing-subcard border-b border-light-border dark:border-nothing-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-nothing-red/10 border border-nothing-red/20 text-nothing-red flex items-center justify-center">
              <Trash2 size={20} />
            </div>
            <div>
              <h2 className="font-display font-bold text-base text-zinc-900 dark:text-white flex items-center gap-2">
                Supprimer le conteneur
                <span className="w-1.5 h-1.5 rounded-full bg-nothing-red animate-pulse" />
              </h2>
              <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                Action irréversible sur Docker
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isDeleting}
            className="p-2 rounded-xl bg-light-hover dark:bg-nothing-hover text-zinc-500 hover:text-zinc-900 dark:hover:text-white btn-press"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Container summary pill */}
          <div className="p-4 rounded-2xl bg-light-subcard dark:bg-nothing-subcard border border-light-border dark:border-nothing-border/70 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-display font-bold text-base text-zinc-900 dark:text-white truncate">
                {container.name}
              </span>
              <span
                className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${
                  isRunning
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                    : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                }`}
              >
                {isRunning ? 'En cours d\'exécution' : 'Arrêté'}
              </span>
            </div>

            <div className="text-xs font-mono text-zinc-500 dark:text-zinc-400 space-y-1">
              <p className="truncate">Image : {container.image}</p>
              {container.stack && <p>Stack / Dossier : {container.stack}</p>}
              <p className="text-[11px] text-zinc-400">ID : {container.shortId}</p>
            </div>
          </div>

          {/* Running Warning */}
          {isRunning && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs flex items-start gap-2.5">
              <AlertTriangle size={18} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Le conteneur est actuellement en ligne</p>
                <p className="text-[11px] mt-0.5 opacity-90">
                  Pour le supprimer sans l'arrêter au préalable, l'option "Forcer la suppression" doit être activée.
                </p>
              </div>
            </div>
          )}

          {/* Options */}
          <div className="space-y-3 pt-1">
            <label className="flex items-start gap-3 p-3 rounded-2xl bg-light-subcard dark:bg-nothing-subcard border border-light-border dark:border-nothing-border cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-700 transition-colors">
              <input
                type="checkbox"
                checked={force}
                onChange={(e) => setForce(e.target.checked)}
                className="mt-0.5"
              />
              <div className="text-xs">
                <span className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <ShieldAlert size={13} className="text-nothing-red" />
                  Forcer l'arrêt et la suppression (force: true)
                </span>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Interrompt brutalement le conteneur s'il tourne encore avant de l'effacer.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-2xl bg-light-subcard dark:bg-nothing-subcard border border-light-border dark:border-nothing-border cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-700 transition-colors">
              <input
                type="checkbox"
                checked={removeVolumes}
                onChange={(e) => setRemoveVolumes(e.target.checked)}
                className="mt-0.5"
              />
              <div className="text-xs">
                <span className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <HardDrive size={13} />
                  Supprimer les volumes anonymes associés (v: true)
                </span>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Nettoie les volumes de données sans nom associés à ce conteneur pour libérer de l'espace disque.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-light-subcard dark:bg-nothing-subcard border-t border-light-border dark:border-nothing-border flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-light-hover dark:hover:bg-zinc-800 btn-press"
          >
            Annuler
          </button>

          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl bg-nothing-red hover:bg-red-600 text-white text-xs font-semibold flex items-center gap-2 btn-press shadow-sm"
          >
            {isDeleting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Suppression...</span>
              </>
            ) : (
              <>
                <Trash2 size={14} />
                <span>Supprimer définitivement</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

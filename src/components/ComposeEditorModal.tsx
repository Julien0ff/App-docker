import React, { useState, useEffect } from 'react';
import { X, Save, RotateCw, FileCode, CheckCircle2, Copy, Download, FolderGit2 } from 'lucide-react';
import { toast } from 'sonner';
import { fetchStackCompose, updateStackCompose } from '../services/api';
import { Language, translations } from '../i18n/translations';

interface ComposeEditorModalProps {
  stackName: string | null;
  isOpen: boolean;
  onClose: () => void;
  lang?: Language;
}

export const ComposeEditorModal: React.FC<ComposeEditorModalProps> = ({
  stackName,
  isOpen,
  onClose,
  lang = 'fr',
}) => {
  if (!isOpen || !stackName) return null;

  const t = translations[lang] || translations.fr;
  const [content, setContent] = useState<string>('');
  const [filePath, setFilePath] = useState<string>('');
  const [workingDir, setWorkingDir] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetchStackCompose(stackName)
      .then((data) => {
        if (!isMounted) return;
        setContent(data.content || '');
        setFilePath(data.filePath || '');
        setWorkingDir(data.workingDir || '');
      })
      .catch((err) => {
        if (!isMounted) return;
        toast.error(`Erreur: ${err.message}`);
        setContent(`# docker-compose.yml pour ${stackName}\nversion: '3.8'\nservices:\n`);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [stackName]);

  const handleSave = async (restartAfterSave = false) => {
    if (!content.trim()) {
      toast.error('Le contenu YAML ne peut pas être vide');
      return;
    }

    try {
      setIsSaving(true);
      const res = await updateStackCompose(stackName, content, filePath, restartAfterSave);
      toast.success(res.message || t.composeSavedSuccess);
      if (!restartAfterSave) {
        // Keep modal open so user can keep editing
      } else {
        onClose();
      }
    } catch (err: any) {
      toast.error(`Erreur: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    toast.success('Contenu copié dans le presse-papiers');
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${stackName}-docker-compose.yml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-sm animate-fade-in select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl h-[85vh] rounded-3xl bg-light-card dark:bg-nothing-card border border-light-border dark:border-nothing-border shadow-2xl flex flex-col overflow-hidden text-zinc-900 dark:text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-light-subcard dark:bg-nothing-subcard border-b border-light-border dark:border-nothing-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 flex items-center justify-center shadow-xs">
              <FileCode size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-bold text-base text-zinc-900 dark:text-white">
                  {t.composeEditorTitle} : <span className="text-nothing-red">{stackName}</span>
                </h2>
                <span className="w-1.5 h-1.5 rounded-full bg-nothing-red animate-pulse" />
              </div>
              <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400 truncate max-w-xl">
                {filePath || `${workingDir}/docker-compose.yml`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="p-2 rounded-xl bg-light-hover dark:bg-nothing-hover text-zinc-500 hover:text-zinc-900 dark:hover:text-white btn-press"
              title="Copier le contenu"
            >
              <Copy size={15} />
            </button>
            <button
              onClick={handleDownload}
              className="p-2 rounded-xl bg-light-hover dark:bg-nothing-hover text-zinc-500 hover:text-zinc-900 dark:hover:text-white btn-press"
              title="Télécharger le fichier YAML"
            >
              <Download size={15} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-light-hover dark:bg-nothing-hover text-zinc-500 hover:text-zinc-900 dark:hover:text-white btn-press"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Editor Body */}
        <div className="flex-1 p-4 bg-zinc-950 text-zinc-100 font-mono text-xs overflow-hidden flex flex-col">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center text-zinc-500">
              <RotateCw size={20} className="animate-spin mr-2" />
              Chargement du fichier docker-compose.yml...
            </div>
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full flex-1 bg-transparent border-0 outline-none resize-none font-mono text-xs text-zinc-200 leading-relaxed selection:bg-nothing-red selection:text-white"
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-light-subcard dark:bg-nothing-subcard border-t border-light-border dark:border-nothing-border flex items-center justify-between">
          <div className="text-xs font-mono text-zinc-400 hidden sm:block">
            {content.split('\n').length} lignes • UTF-8
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-light-hover dark:hover:bg-zinc-800 btn-press"
            >
              {t.cancel}
            </button>

            <button
              onClick={() => handleSave(false)}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl bg-light-card dark:bg-nothing-card text-zinc-900 dark:text-zinc-100 text-xs font-medium flex items-center gap-1.5 btn-press border border-light-border dark:border-nothing-border shadow-xs"
            >
              <Save size={13} />
              <span>{t.composeSave}</span>
            </button>

            <button
              onClick={() => handleSave(true)}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 text-xs font-semibold flex items-center gap-1.5 btn-press shadow-xs"
            >
              <RotateCw size={13} className={isSaving ? 'animate-spin' : ''} />
              <span>{t.composeSaveAndRestart}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

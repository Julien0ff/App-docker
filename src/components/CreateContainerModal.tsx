import React, { useState } from 'react';
import { X, Plus, Layers, FolderGit2, Play, Box, Check, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import { createContainer, deployStack } from '../services/api';
import { Language, translations } from '../i18n/translations';

interface CreateContainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  lang?: Language;
}

const COMPOSE_TEMPLATES: { label: string; desc: string; yaml: (name: string) => string }[] = [
  {
    label: 'Nginx Web Server',
    desc: 'Serveur HTTP Nginx simple sur le port 8080',
    yaml: (name) => `version: '3.8'
services:
  web:
    image: nginx:alpine
    container_name: ${name}-web
    ports:
      - "8080:80"
    restart: unless-stopped
`,
  },
  {
    label: 'Redis Cache',
    desc: 'Base clé-valeur Redis en mémoire',
    yaml: (name) => `version: '3.8'
services:
  redis:
    image: redis:alpine
    container_name: ${name}-redis
    ports:
      - "6379:6379"
    restart: unless-stopped
    command: redis-server --save 60 1 --loglevel warning
`,
  },
  {
    label: 'PostgreSQL Database',
    desc: 'Base de données SQL PostgreSQL 16',
    yaml: (name) => `version: '3.8'
services:
  db:
    image: postgres:16-alpine
    container_name: ${name}-db
    environment:
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: changeme123
      POSTGRES_DB: appdb
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
`,
  },
];

export const CreateContainerModal: React.FC<CreateContainerModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  lang = 'fr',
}) => {
  if (!isOpen) return null;

  const t = translations[lang] || translations.fr;
  const [activeTab, setActiveTab] = useState<'single' | 'compose'>('single');

  // Single Container Form State
  const [name, setName] = useState('');
  const [image, setImage] = useState('');
  const [hostPort, setHostPort] = useState('');
  const [containerPort, setContainerPort] = useState('');
  const [envKey, setEnvKey] = useState('');
  const [envVal, setEnvVal] = useState('');
  const [envList, setEnvList] = useState<{ key: string; value: string }[]>([]);
  const [hostVolume, setHostVolume] = useState('');
  const [containerVolume, setContainerVolume] = useState('');
  const [volumesList, setVolumesList] = useState<{ hostPath: string; containerPath: string }[]>([]);
  const [restartPolicy, setRestartPolicy] = useState('unless-stopped');
  const [startImmediately, setStartImmediately] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Compose Stack Form State
  const [stackName, setStackName] = useState('');
  const [stackDir, setStackDir] = useState('');
  const [composeYaml, setComposeYaml] = useState(COMPOSE_TEMPLATES[0].yaml('mon-service'));

  const handleAddEnv = () => {
    if (envKey.trim()) {
      setEnvList([...envList, { key: envKey.trim(), value: envVal.trim() }]);
      setEnvKey('');
      setEnvVal('');
    }
  };

  const handleRemoveEnv = (index: number) => {
    setEnvList(envList.filter((_, i) => i !== index));
  };

  const handleAddVolume = () => {
    if (hostVolume.trim() && containerVolume.trim()) {
      setVolumesList([...volumesList, { hostPath: hostVolume.trim(), containerPath: containerVolume.trim() }]);
      setHostVolume('');
      setContainerVolume('');
    }
  };

  const handleRemoveVolume = (index: number) => {
    setVolumesList(volumesList.filter((_, i) => i !== index));
  };

  const handleCreateSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image.trim()) {
      toast.error('L\'image Docker est requise');
      return;
    }

    try {
      setIsSubmitting(true);
      const ports = [];
      if (containerPort.trim()) {
        ports.push({
          hostPort: hostPort.trim() ? parseInt(hostPort.trim(), 10) : undefined,
          containerPort: parseInt(containerPort.trim(), 10),
          protocol: 'tcp',
        });
      }

      await createContainer({
        name: name.trim() || undefined,
        image: image.trim(),
        ports,
        env: envList,
        volumes: volumesList,
        restartPolicy,
        startImmediately,
      });

      toast.success(`Conteneur "${name || image}" créé avec succès !`);
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(`Erreur: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeployCompose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stackName.trim()) {
      toast.error('Le nom de la stack est requis');
      return;
    }
    if (!composeYaml.trim()) {
      toast.error('Le contenu YAML est requis');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await deployStack({
        name: stackName.trim(),
        dirPath: stackDir.trim() || undefined,
        composeYaml,
      });

      toast.success(res.message || 'Stack déployée avec succès !');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(`Erreur: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-sm animate-fade-in select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[88vh] rounded-3xl bg-light-card dark:bg-nothing-card border border-light-border dark:border-nothing-border shadow-2xl flex flex-col overflow-hidden text-zinc-900 dark:text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-light-subcard dark:bg-nothing-subcard border-b border-light-border dark:border-nothing-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 flex items-center justify-center shadow-xs">
              <Plus size={20} />
            </div>
            <div>
              <h2 className="font-display font-bold text-base text-zinc-900 dark:text-white flex items-center gap-2">
                {t.createTitle}
                <span className="w-1.5 h-1.5 rounded-full bg-nothing-red animate-pulse" />
              </h2>
              <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                {t.createSubtitle}
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

        {/* Mode Switcher Tabs */}
        <div className="px-6 pt-4 flex items-center gap-2 border-b border-light-border dark:border-nothing-border">
          <button
            onClick={() => setActiveTab('single')}
            className={`px-4 py-2 text-xs font-medium border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'single'
                ? 'border-nothing-red text-zinc-900 dark:text-white font-semibold'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            <Box size={14} />
            <span>{t.tabSimpleContainer}</span>
          </button>

          <button
            onClick={() => setActiveTab('compose')}
            className={`px-4 py-2 text-xs font-medium border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'compose'
                ? 'border-nothing-red text-zinc-900 dark:text-white font-semibold'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            <FolderGit2 size={14} />
            <span>{t.tabComposeStack}</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {activeTab === 'single' ? (
            <form onSubmit={handleCreateSingle} id="create-single-form" className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-zinc-600 dark:text-zinc-400 mb-1">
                    {t.containerName}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: mon-serveur"
                    className="w-full px-3.5 py-2 rounded-xl bg-light-subcard dark:bg-nothing-subcard border border-light-border dark:border-nothing-border text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-600 dark:text-zinc-400 mb-1">
                    {t.imageName}
                  </label>
                  <input
                    type="text"
                    required
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder="Ex: redis:alpine, nginx:latest"
                    className="w-full px-3.5 py-2 rounded-xl bg-light-subcard dark:bg-nothing-subcard border border-light-border dark:border-nothing-border text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 font-mono"
                  />
                </div>
              </div>

              {/* Port mapping */}
              <div>
                <label className="block text-xs font-mono text-zinc-600 dark:text-zinc-400 mb-1">
                  {t.ports}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={hostPort}
                    onChange={(e) => setHostPort(e.target.value)}
                    placeholder="Port Hôte (ex: 8080)"
                    className="flex-1 px-3.5 py-2 rounded-xl bg-light-subcard dark:bg-nothing-subcard border border-light-border dark:border-nothing-border text-xs text-zinc-900 dark:text-white font-mono"
                  />
                  <span className="text-zinc-400">:</span>
                  <input
                    type="number"
                    value={containerPort}
                    onChange={(e) => setContainerPort(e.target.value)}
                    placeholder="Port Conteneur (ex: 80)"
                    className="flex-1 px-3.5 py-2 rounded-xl bg-light-subcard dark:bg-nothing-subcard border border-light-border dark:border-nothing-border text-xs text-zinc-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              {/* Environment variables */}
              <div>
                <label className="block text-xs font-mono text-zinc-600 dark:text-zinc-400 mb-1">
                  {t.envVars}
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={envKey}
                    onChange={(e) => setEnvKey(e.target.value)}
                    placeholder="CLE"
                    className="w-1/3 px-3 py-1.5 rounded-xl bg-light-subcard dark:bg-nothing-subcard border border-light-border dark:border-nothing-border text-xs font-mono"
                  />
                  <input
                    type="text"
                    value={envVal}
                    onChange={(e) => setEnvVal(e.target.value)}
                    placeholder="VALEUR"
                    className="flex-1 px-3 py-1.5 rounded-xl bg-light-subcard dark:bg-nothing-subcard border border-light-border dark:border-nothing-border text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleAddEnv}
                    className="px-3 py-1.5 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 text-xs font-medium btn-press"
                  >
                    Ajouter
                  </button>
                </div>
                {envList.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {envList.map((env, i) => (
                      <span
                        key={i}
                        onClick={() => handleRemoveEnv(i)}
                        className="text-[11px] font-mono px-2 py-0.5 rounded-lg bg-light-subcard dark:bg-nothing-subcard border border-light-border dark:border-nothing-border flex items-center gap-1 cursor-pointer hover:border-red-500"
                        title="Cliquer pour supprimer"
                      >
                        <span>{env.key}={env.value}</span>
                        <X size={11} className="text-zinc-400 hover:text-red-500" />
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Volumes */}
              <div>
                <label className="block text-xs font-mono text-zinc-600 dark:text-zinc-400 mb-1">
                  {t.volumes}
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={hostVolume}
                    onChange={(e) => setHostVolume(e.target.value)}
                    placeholder="/dossier/hote"
                    className="flex-1 px-3 py-1.5 rounded-xl bg-light-subcard dark:bg-nothing-subcard border border-light-border dark:border-nothing-border text-xs font-mono"
                  />
                  <span className="text-zinc-400">:</span>
                  <input
                    type="text"
                    value={containerVolume}
                    onChange={(e) => setContainerVolume(e.target.value)}
                    placeholder="/dossier/conteneur"
                    className="flex-1 px-3 py-1.5 rounded-xl bg-light-subcard dark:bg-nothing-subcard border border-light-border dark:border-nothing-border text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleAddVolume}
                    className="px-3 py-1.5 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 text-xs font-medium btn-press"
                  >
                    Ajouter
                  </button>
                </div>
                {volumesList.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {volumesList.map((vol, i) => (
                      <span
                        key={i}
                        onClick={() => handleRemoveVolume(i)}
                        className="text-[11px] font-mono px-2 py-0.5 rounded-lg bg-light-subcard dark:bg-nothing-subcard border border-light-border dark:border-nothing-border flex items-center gap-1 cursor-pointer hover:border-red-500"
                        title="Cliquer pour supprimer"
                      >
                        <span>{vol.hostPath}:{vol.containerPath}</span>
                        <X size={11} className="text-zinc-400 hover:text-red-500" />
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Policy & Start option */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-mono text-zinc-600 dark:text-zinc-400 mb-1">
                    {t.restartPolicy}
                  </label>
                  <select
                    value={restartPolicy}
                    onChange={(e) => setRestartPolicy(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-light-subcard dark:bg-nothing-subcard border border-light-border dark:border-nothing-border text-xs font-mono"
                  >
                    <option value="unless-stopped">unless-stopped</option>
                    <option value="always">always</option>
                    <option value="on-failure">on-failure</option>
                    <option value="no">no (aucun redémarrage)</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs group select-none">
                    <input
                      type="checkbox"
                      checked={startImmediately}
                      onChange={(e) => setStartImmediately(e.target.checked)}
                    />
                    <span className="group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">{t.startImmediately}</span>
                  </label>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleDeployCompose} id="create-compose-form" className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-zinc-600 dark:text-zinc-400 mb-1">
                    {t.stackName}
                  </label>
                  <input
                    type="text"
                    required
                    value={stackName}
                    onChange={(e) => {
                      setStackName(e.target.value);
                      if (e.target.value) {
                        setComposeYaml(COMPOSE_TEMPLATES[0].yaml(e.target.value));
                      }
                    }}
                    placeholder="Ex: web-stack, database"
                    className="w-full px-3.5 py-2 rounded-xl bg-light-subcard dark:bg-nothing-subcard border border-light-border dark:border-nothing-border text-xs text-zinc-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-600 dark:text-zinc-400 mb-1">
                    {t.stackFolderCustom}
                  </label>
                  <input
                    type="text"
                    value={stackDir}
                    onChange={(e) => setStackDir(e.target.value)}
                    placeholder="Par défaut: ~/stacks/<nom>"
                    className="w-full px-3.5 py-2 rounded-xl bg-light-subcard dark:bg-nothing-subcard border border-light-border dark:border-nothing-border text-xs text-zinc-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              {/* Template quick-pick buttons */}
              <div>
                <label className="block text-xs font-mono text-zinc-600 dark:text-zinc-400 mb-1.5">
                  Modèles préconfigurés :
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {COMPOSE_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.label}
                      type="button"
                      onClick={() => setComposeYaml(tpl.yaml(stackName || 'mon-service'))}
                      className="p-2.5 rounded-xl bg-light-subcard dark:bg-nothing-subcard border border-light-border dark:border-nothing-border text-left hover:border-zinc-400 dark:hover:border-zinc-700 btn-press transition-colors"
                    >
                      <p className="text-xs font-semibold text-zinc-900 dark:text-white">{tpl.label}</p>
                      <p className="text-[10px] text-zinc-500 truncate mt-0.5">{tpl.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* YAML Editor */}
              <div>
                <label className="block text-xs font-mono text-zinc-600 dark:text-zinc-400 mb-1">
                  docker-compose.yml *
                </label>
                <textarea
                  required
                  rows={10}
                  value={composeYaml}
                  onChange={(e) => setComposeYaml(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-200 resize-y focus:outline-none focus:border-zinc-600"
                  spellCheck={false}
                />
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-light-subcard dark:bg-nothing-subcard border-t border-light-border dark:border-nothing-border flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-light-hover dark:hover:bg-zinc-800 btn-press"
          >
            {t.cancel}
          </button>

          {activeTab === 'single' ? (
            <button
              type="submit"
              form="create-single-form"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 text-xs font-semibold flex items-center gap-1.5 btn-press shadow-xs"
            >
              <Plus size={14} />
              <span>{isSubmitting ? 'Création...' : t.createContainerBtn}</span>
            </button>
          ) : (
            <button
              type="submit"
              form="create-compose-form"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 text-xs font-semibold flex items-center gap-1.5 btn-press shadow-xs"
            >
              <Play size={14} className="fill-current" />
              <span>{isSubmitting ? 'Déploiement...' : t.deployStackBtn}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

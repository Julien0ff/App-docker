import React, { useEffect, useState } from 'react';
import { X, Server, Network, FolderGit2, Variable, Code2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { DockerContainer } from '../types';
import { fetchContainerInspect } from '../services/api';

interface ContainerDetailsModalProps {
  container: DockerContainer | null;
  onClose: () => void;
}

export const ContainerDetailsModal: React.FC<ContainerDetailsModalProps> = ({ container, onClose }) => {
  const [details, setDetails] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'env' | 'mounts' | 'network' | 'raw'>('overview');
  const [envFilter, setEnvFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copiedRaw, setCopiedRaw] = useState<boolean>(false);

  useEffect(() => {
    if (!container) return;
    setIsLoading(true);
    fetchContainerInspect(container.id)
      .then((data) => {
        setDetails(data);
      })
      .catch((err) => {
        toast.error(`Erreur d'inspection: ${err.message}`);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [container]);

  if (!container) return null;

  const envList: string[] = details?.Config?.Env || [];
  const filteredEnv = envFilter
    ? envList.filter((e) => e.toLowerCase().includes(envFilter.toLowerCase()))
    : envList;

  const mounts = details?.Mounts || [];
  const networkSettings = details?.NetworkSettings || {};

  const handleCopyRaw = () => {
    navigator.clipboard.writeText(JSON.stringify(details, null, 2));
    setCopiedRaw(true);
    toast.success('Configuration brute copiée');
    setTimeout(() => setCopiedRaw(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-4xl h-[85vh] rounded-3xl bg-light-card dark:bg-nothing-card border border-light-border dark:border-nothing-border shadow-2xl flex flex-col overflow-hidden text-zinc-900 dark:text-zinc-100">
        {/* Header */}
        <div className="px-6 py-5 bg-light-subcard dark:bg-nothing-subcard border-b border-light-border dark:border-nothing-border flex items-center justify-between select-none">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 flex items-center justify-center shadow-sm">
              <Server size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-bold text-base text-zinc-900 dark:text-white">
                  {container.name}
                </h2>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                  {container.shortId}
                </span>
              </div>
              <p className="text-xs font-mono text-zinc-600 dark:text-zinc-300 truncate max-w-md">
                {container.image}
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

        {/* Tab Navigation */}
        <div className="px-6 py-2.5 bg-light-subcard dark:bg-nothing-subcard border-b border-light-border dark:border-nothing-border flex items-center gap-2 select-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium btn-press ${
              activeTab === 'overview'
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-semibold'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Vue générale
          </button>
          <button
            onClick={() => setActiveTab('env')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium btn-press flex items-center gap-1.5 ${
              activeTab === 'env'
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-semibold'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <Variable size={13} />
            <span>Variables d'env ({envList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('mounts')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium btn-press flex items-center gap-1.5 ${
              activeTab === 'mounts'
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-semibold'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <FolderGit2 size={13} />
            <span>Volumes ({mounts.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('network')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium btn-press flex items-center gap-1.5 ${
              activeTab === 'network'
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-semibold'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <Network size={13} />
            <span>Réseau</span>
          </button>
          <button
            onClick={() => setActiveTab('raw')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium btn-press flex items-center gap-1.5 ${
              activeTab === 'raw'
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-semibold'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <Code2 size={13} />
            <span>JSON Brut</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 p-6 overflow-y-auto text-xs font-mono select-text">
          {isLoading ? (
            <div className="h-full flex items-center justify-center text-zinc-400">
              Inspection du conteneur en cours...
            </div>
          ) : !details ? (
            <div className="h-full flex items-center justify-center text-zinc-400">
              Impossible de charger les détails du conteneur.
            </div>
          ) : activeTab === 'overview' ? (
            <div className="space-y-5">
              {/* State grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-light-subcard dark:bg-nothing-subcard border border-light-border dark:border-nothing-border">
                  <span className="text-[10px] text-zinc-500 block mb-1">État actuel</span>
                  <span className="text-sm font-bold text-zinc-900 dark:text-white capitalize">
                    {details.State?.Status}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-light-subcard dark:bg-nothing-subcard border border-light-border dark:border-nothing-border">
                  <span className="text-[10px] text-zinc-500 block mb-1">PID du processus</span>
                  <span className="text-sm font-bold text-zinc-900 dark:text-white">
                    {details.State?.Pid || 0}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-light-subcard dark:bg-nothing-subcard border border-light-border dark:border-nothing-border">
                  <span className="text-[10px] text-zinc-500 block mb-1">Politique de Restart</span>
                  <span className="text-sm font-bold text-zinc-900 dark:text-white">
                    {details.HostConfig?.RestartPolicy?.Name || 'no'}
                  </span>
                </div>
              </div>

              {/* Execution details */}
              <div className="p-4 rounded-2xl bg-light-subcard dark:bg-nothing-subcard border border-light-border dark:border-nothing-border space-y-2">
                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block mb-2 font-display">
                  Commande et Exécution
                </span>
                <div className="flex items-start gap-2">
                  <span className="text-zinc-500 w-24 shrink-0">Commande :</span>
                  <span className="text-zinc-800 dark:text-zinc-200 break-all bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                    {details.Config?.Cmd?.join(' ') || details.Path || '—'}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-zinc-500 w-24 shrink-0">WorkingDir :</span>
                  <span className="text-zinc-800 dark:text-zinc-200">
                    {details.Config?.WorkingDir || '/'}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-zinc-500 w-24 shrink-0">Créé le :</span>
                  <span className="text-zinc-800 dark:text-zinc-200">
                    {new Date(details.Created).toLocaleString('fr-FR')}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-zinc-500 w-24 shrink-0">Démarré le :</span>
                  <span className="text-zinc-800 dark:text-zinc-200">
                    {new Date(details.State?.StartedAt).toLocaleString('fr-FR')}
                  </span>
                </div>
              </div>
            </div>
          ) : activeTab === 'env' ? (
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Filtrer les variables d'environnement..."
                value={envFilter}
                onChange={(e) => setEnvFilter(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-light-subcard dark:bg-nothing-subcard border border-light-border dark:border-nothing-border text-xs outline-none focus:border-zinc-500"
              />
              <div className="divide-y divide-light-border dark:divide-nothing-border/60">
                {filteredEnv.map((env, i) => {
                  const [key, ...vals] = env.split('=');
                  const val = vals.join('=');
                  return (
                    <div key={i} className="py-2 flex items-start gap-3">
                      <span className="font-bold text-nothing-red shrink-0 min-w-[140px] select-all">
                        {key}
                      </span>
                      <span className="text-zinc-600 dark:text-zinc-300 break-all select-all">
                        {val}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : activeTab === 'mounts' ? (
            <div className="space-y-3">
              {mounts.length === 0 ? (
                <div className="text-zinc-500 text-center py-8">Aucun volume monté</div>
              ) : (
                mounts.map((m: any, i: number) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-2xl bg-light-subcard dark:bg-nothing-subcard border border-light-border dark:border-nothing-border space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-900 dark:text-white capitalize">
                        {m.Type || 'Bind'} : {m.Destination}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                        {m.RW ? 'Read/Write' : 'Read-Only'}
                      </span>
                    </div>
                    <div className="text-zinc-500 text-[11px] truncate" title={m.Source}>
                      Source hôte : <span className="text-zinc-700 dark:text-zinc-300">{m.Source}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : activeTab === 'network' ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-light-subcard dark:bg-nothing-subcard border border-light-border dark:border-nothing-border space-y-2">
                <span className="font-display font-bold text-xs text-zinc-900 dark:text-white block mb-1">
                  Paramètres Réseau
                </span>
                <div className="flex items-center justify-between py-1 border-b border-light-border dark:border-nothing-border/60">
                  <span className="text-zinc-500">Adresse IP :</span>
                  <span className="text-zinc-800 dark:text-zinc-200 font-bold">
                    {networkSettings.IPAddress || 'Host network'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-light-border dark:border-nothing-border/60">
                  <span className="text-zinc-500">Passerelle (Gateway) :</span>
                  <span className="text-zinc-800 dark:text-zinc-200">
                    {networkSettings.Gateway || '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-zinc-500">Adresse MAC :</span>
                  <span className="text-zinc-800 dark:text-zinc-200">
                    {networkSettings.MacAddress || '—'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={handleCopyRaw}
                className="absolute top-2 right-2 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-sans flex items-center gap-1.5 btn-press shadow-md"
              >
                {copiedRaw ? <Check size={13} className="text-nothing-green" /> : <Copy size={13} />}
                <span>{copiedRaw ? 'Copié !' : 'Copier JSON'}</span>
              </button>
              <pre className="p-4 rounded-2xl bg-zinc-950 text-zinc-300 overflow-x-auto text-[11px] leading-relaxed">
                {JSON.stringify(details, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

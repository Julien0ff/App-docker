import React, { useState } from 'react';
import {
  X,
  Bell,
  Plus,
  Trash2,
  Send,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Layers,
  Box,
  Clock,
  Activity,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { DiscordWebhook, DockerContainer, WebhookEvent } from '../types';
import {
  createWebhook,
  deleteWebhook,
  testWebhook,
  updateWebhook,
  sendWebhookReport,
} from '../services/api';

interface WebhooksModalProps {
  isOpen: boolean;
  onClose: () => void;
  webhooks: DiscordWebhook[];
  onRefreshWebhooks: () => void;
  containers?: DockerContainer[];
}

const AVAILABLE_EVENTS: { id: WebhookEvent; label: string; desc: string; color: string }[] = [
  { id: 'start', label: 'Démarrage', desc: 'Conteneur lancé ou démarré', color: 'bg-emerald-500' },
  { id: 'stop', label: 'Arrêt', desc: 'Conteneur stoppé proprement', color: 'bg-rose-500' },
  { id: 'restart', label: 'Redémarrage', desc: 'Conteneur relancé', color: 'bg-amber-500' },
  { id: 'delete', label: 'Suppression', desc: 'Conteneur effacé de Docker', color: 'bg-red-700' },
  { id: 'die', label: 'Crash / Alerte', desc: 'Sortie anormale (code != 0)', color: 'bg-red-500' },
];

export const WebhooksModal: React.FC<WebhooksModalProps> = ({
  isOpen,
  onClose,
  webhooks,
  onRefreshWebhooks,
  containers = [],
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<WebhookEvent[]>([
    'start',
    'stop',
    'restart',
    'delete',
    'die',
  ]);

  // Target scope & metrics configuration
  const [targetScope, setTargetScope] = useState<'all' | 'custom'>('all');
  const [selectedStacks, setSelectedStacks] = useState<string[]>([]);
  const [selectedContainers, setSelectedContainers] = useState<string[]>([]);
  const [includeUptime, setIncludeUptime] = useState(true);
  const [includeStatus, setIncludeStatus] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testingUrl, setTestingUrl] = useState<string | null>(null);
  const [sendingReportId, setSendingReportId] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  // Extract unique stacks and standalone containers
  const availableStacks = Array.from(
    new Set(containers.map((c) => c.stack).filter(Boolean) as string[])
  ).sort();

  const toggleEvent = (eventId: WebhookEvent) => {
    setSelectedEvents((prev) =>
      prev.includes(eventId) ? prev.filter((e) => e !== eventId) : [...prev, eventId]
    );
  };

  const toggleStack = (stackName: string) => {
    setSelectedStacks((prev) =>
      prev.includes(stackName) ? prev.filter((s) => s !== stackName) : [...prev, stackName]
    );
  };

  const toggleContainer = (cName: string) => {
    setSelectedContainers((prev) =>
      prev.includes(cName) ? prev.filter((c) => c !== cName) : [...prev, cName]
    );
  };

  const handleTestUrl = async (webhookUrl: string, webhookName: string) => {
    if (!webhookUrl || !webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
      toast.error('URL invalide', {
        description: 'Veuillez renseigner une URL valide commençant par https://discord.com/api/webhooks/',
      });
      return;
    }

    try {
      setTestingUrl(webhookUrl);
      const msg = await testWebhook(webhookUrl, webhookName);
      toast.success('Test Discord réussi !', {
        description: msg || 'Un message d’essai a été transmis sur votre salon Discord.',
      });
    } catch (err: any) {
      toast.error('Erreur de test Discord', {
        description: err.message || 'Impossible de joindre Discord avec cette URL.',
      });
    } finally {
      setTestingUrl(null);
    }
  };

  const handleSendReport = async (webhookId: string) => {
    try {
      setSendingReportId(webhookId);
      const msg = await sendWebhookReport(webhookId);
      toast.success('Rapport de statut envoyé !', {
        description: msg || 'Le récapitulatif live de l’uptime et du statut a été posté sur Discord.',
      });
      onRefreshWebhooks();
    } catch (err: any) {
      toast.error('Échec de l’envoi du rapport', {
        description: err.message,
      });
    } finally {
      setSendingReportId(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim().startsWith('https://discord.com/api/webhooks/')) {
      toast.error("L'URL du webhook Discord est invalide");
      return;
    }
    if (selectedEvents.length === 0) {
      toast.error('Sélectionnez au moins un événement à écouter');
      return;
    }

    if (targetScope === 'custom' && selectedStacks.length === 0 && selectedContainers.length === 0) {
      toast.error('Sélection vide', {
        description: 'Veuillez cocher au moins une stack ou un conteneur pour le ciblage personnalisé.',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await createWebhook({
        name: name.trim() || 'Discord #docker-alerts',
        url: url.trim(),
        events: selectedEvents,
        enabled: true,
        ...( {
          targetScope,
          targetStacks: targetScope === 'custom' ? selectedStacks : [],
          targetContainers: targetScope === 'custom' ? selectedContainers : [],
          includeUptime,
          includeStatus,
        } as any)
      });

      toast.success('Webhook Discord ajouté !', {
        description: 'Les alertes sélectionnées seront envoyées en temps réel.',
      });

      // Reset form
      setName('');
      setUrl('');
      setSelectedEvents(['start', 'stop', 'restart', 'delete', 'die']);
      setTargetScope('all');
      setSelectedStacks([]);
      setSelectedContainers([]);
      onRefreshWebhooks();
    } catch (err: any) {
      toast.error('Erreur lors de la création', {
        description: err.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (wh: DiscordWebhook) => {
    try {
      await updateWebhook(wh.id, { enabled: !wh.enabled });
      toast.success(wh.enabled ? 'Webhook désactivé' : 'Webhook activé');
      onRefreshWebhooks();
    } catch (err: any) {
      toast.error('Erreur', { description: err.message });
    }
  };

  const handleDelete = async (id: string, webhookName: string) => {
    if (!confirm(`Supprimer le webhook "${webhookName}" ?`)) return;
    try {
      await deleteWebhook(id);
      toast.success('Webhook supprimé');
      onRefreshWebhooks();
    } catch (err: any) {
      toast.error('Erreur lors de la suppression', { description: err.message });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-sm animate-fade-in select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-3xl bg-light-card dark:bg-nothing-card border border-light-border dark:border-nothing-border shadow-2xl flex flex-col max-h-[88vh] overflow-hidden text-zinc-900 dark:text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-light-subcard dark:bg-nothing-subcard border-b border-light-border dark:border-nothing-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 flex items-center justify-center shadow-xs">
              <Bell size={20} />
            </div>
            <div>
              <h2 className="font-display font-bold text-base text-zinc-900 dark:text-white flex items-center gap-2">
                Webhooks Discord
                <span className="w-1.5 h-1.5 rounded-full bg-nothing-red animate-pulse" />
              </h2>
              <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                Alertes temps réel, suivi d'uptime et statuts par conteneur ou stack
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

        {/* Scrollable Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Guide Accordion */}
          <div className="rounded-2xl bg-light-subcard dark:bg-nothing-subcard border border-light-border dark:border-nothing-border overflow-hidden">
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="w-full p-4 flex items-center justify-between text-left text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-nothing-red transition-colors"
            >
              <span className="flex items-center gap-2">
                <HelpCircle size={15} className="text-nothing-red" />
                Comment obtenir l'URL d'un webhook sur Discord ?
              </span>
              {showGuide ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showGuide && (
              <div className="px-4 pb-4 text-xs font-mono text-zinc-600 dark:text-zinc-400 space-y-2 border-t border-light-border dark:border-nothing-border pt-3">
                <ol className="list-decimal list-inside space-y-1">
                  <li>Ouvrez Discord et allez sur votre serveur.</li>
                  <li>Faites clic-droit sur le salon où recevoir les alertes &gt; <strong>Modifier le salon</strong>.</li>
                  <li>Allez dans <strong>Intégrations</strong> &gt; <strong>Webhooks</strong> &gt; <strong>Nouveau webhook</strong>.</li>
                  <li>Cliquez sur <strong>Copier l'URL du webhook</strong> et collez-la ci-dessous.</li>
                </ol>
              </div>
            )}
          </div>

          {/* Form: Add New Webhook */}
          <form
            onSubmit={handleCreate}
            className="p-5 rounded-2xl bg-light-subcard dark:bg-nothing-subcard border border-light-border dark:border-nothing-border space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
                <Plus size={16} />
                Configurer un nouveau Webhook
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                Discord Embed API
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono text-zinc-600 dark:text-zinc-400 mb-1">
                  Nom du salon / label
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: #alertes-production"
                  className="w-full px-3.5 py-2 rounded-xl bg-light-card dark:bg-nothing-card border border-light-border dark:border-nothing-border text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-600 dark:text-zinc-400 mb-1">
                  URL du Webhook Discord *
                </label>
                <input
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://discord.com/api/webhooks/..."
                  className="w-full px-3.5 py-2 rounded-xl bg-light-card dark:bg-nothing-card border border-light-border dark:border-nothing-border text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 font-mono"
                />
              </div>
            </div>

            {/* Scope Selection: All vs Custom */}
            <div>
              <label className="block text-xs font-mono text-zinc-600 dark:text-zinc-400 mb-2">
                Périmètre de surveillance :
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTargetScope('all')}
                  className={`p-3 rounded-xl border text-left text-xs font-mono transition-all btn-press ${
                    targetScope === 'all'
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-semibold border-transparent shadow-xs'
                      : 'bg-light-card dark:bg-nothing-card text-zinc-500 border-light-border dark:border-nothing-border hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5 mb-0.5">
                    <Box size={14} />
                    Tous les conteneurs
                  </div>
                  <div className="text-[10px] opacity-75">
                    Reçoit les notifications pour l'ensemble du daemon Docker
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTargetScope('custom')}
                  className={`p-3 rounded-xl border text-left text-xs font-mono transition-all btn-press ${
                    targetScope === 'custom'
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-semibold border-transparent shadow-xs'
                      : 'bg-light-card dark:bg-nothing-card text-zinc-500 border-light-border dark:border-nothing-border hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5 mb-0.5">
                    <Layers size={14} />
                    Ciblage spécifique
                  </div>
                  <div className="text-[10px] opacity-75">
                    Sélectionner des stacks ou conteneurs précis
                  </div>
                </button>
              </div>
            </div>

            {/* If Custom: Select Stacks & Containers */}
            {targetScope === 'custom' && (
              <div className="p-4 rounded-xl bg-light-card dark:bg-nothing-card border border-light-border dark:border-nothing-border space-y-3">
                {availableStacks.length > 0 && (
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Layers size={12} /> Stacks Compose ciblées :
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {availableStacks.map((s) => {
                        const active = selectedStacks.includes(s);
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => toggleStack(s)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all btn-press border ${
                              active
                                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 border-transparent font-medium'
                                : 'bg-light-subcard dark:bg-nothing-subcard text-zinc-500 border-light-border dark:border-nothing-border hover:text-zinc-700 dark:hover:text-zinc-300'
                            }`}
                          >
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-mono text-zinc-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Box size={12} /> Conteneurs ciblés :
                  </label>
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                    {containers.map((c) => {
                      const active = selectedContainers.includes(c.name);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => toggleContainer(c.name)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all btn-press border ${
                            active
                              ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 border-transparent font-medium'
                              : 'bg-light-subcard dark:bg-nothing-subcard text-zinc-500 border-light-border dark:border-nothing-border hover:text-zinc-700 dark:hover:text-zinc-300'
                          }`}
                        >
                          {c.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Event selection pills */}
            <div>
              <label className="block text-xs font-mono text-zinc-600 dark:text-zinc-400 mb-2">
                Événements déclencheurs :
              </label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_EVENTS.map((ev) => {
                  const isSelected = selectedEvents.includes(ev.id);
                  return (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={() => toggleEvent(ev.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono flex items-center gap-2 transition-all btn-press ${
                        isSelected
                          ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-semibold shadow-xs'
                          : 'bg-light-card dark:bg-nothing-card text-zinc-500 border border-light-border dark:border-nothing-border hover:text-zinc-800 dark:hover:text-zinc-200'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${ev.color}`} />
                      <span>{ev.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Metrics Options */}
            <div className="pt-1 flex flex-wrap gap-4 text-xs font-mono text-zinc-600 dark:text-zinc-300">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeStatus}
                  onChange={(e) => setIncludeStatus(e.target.checked)}
                  className="rounded border-zinc-400 text-nothing-red focus:ring-0"
                />
                <span className="flex items-center gap-1.5">
                  <Activity size={13} className="text-emerald-500" />
                  Inclure le statut détaillé
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeUptime}
                  onChange={(e) => setIncludeUptime(e.target.checked)}
                  className="rounded border-zinc-400 text-nothing-red focus:ring-0"
                />
                <span className="flex items-center gap-1.5">
                  <Clock size={13} className="text-amber-500" />
                  Inclure l'uptime
                </span>
              </label>
            </div>

            {/* Action buttons */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => handleTestUrl(url, name || 'Test Webhook')}
                disabled={!url || testingUrl === url}
                className="px-3.5 py-2 rounded-xl bg-light-card dark:bg-nothing-card hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium flex items-center gap-1.5 btn-press border border-light-border dark:border-nothing-border disabled:opacity-50"
              >
                <Send size={13} className={testingUrl === url ? 'animate-pulse text-nothing-red' : ''} />
                <span>Tester l'envoi</span>
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !url}
                className="px-4 py-2 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 text-xs font-semibold flex items-center gap-1.5 btn-press shadow-xs disabled:opacity-50"
              >
                <Plus size={14} />
                <span>Enregistrer le Webhook</span>
              </button>
            </div>
          </form>

          {/* List of configured Webhooks */}
          <div className="space-y-3">
            <h3 className="font-display font-semibold text-sm text-zinc-900 dark:text-white flex items-center justify-between">
              <span>Salons Discord configurés</span>
              <span className="text-xs font-mono text-zinc-400">
                {webhooks.length} {webhooks.length > 1 ? 'webhooks' : 'webhook'}
              </span>
            </h3>

            {webhooks.length === 0 ? (
              <div className="p-8 rounded-2xl bg-light-subcard dark:bg-nothing-subcard border border-light-border dark:border-nothing-border text-center">
                <Bell size={28} className="mx-auto text-zinc-400 mb-2 opacity-60" />
                <p className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                  Aucun webhook Discord configuré pour le moment.
                </p>
                <p className="text-[11px] font-mono text-zinc-400 mt-1">
                  Ajoutez l'URL d'un salon ci-dessus pour recevoir les notifications et rapports de santé.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {webhooks.map((wh) => (
                  <div
                    key={wh.id}
                    className="p-4 rounded-2xl bg-light-subcard dark:bg-nothing-subcard border border-light-border dark:border-nothing-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:border-zinc-400 dark:hover:border-zinc-700 transition-colors"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-sm text-zinc-900 dark:text-white truncate">
                          {wh.name}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1 ${
                            wh.enabled
                              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                              : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              wh.enabled ? 'bg-nothing-green animate-pulse' : 'bg-zinc-400'
                            }`}
                          />
                          {wh.enabled ? 'Actif' : 'Désactivé'}
                        </span>

                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                          {wh.targetScope === 'custom' ? 'Ciblé' : 'Tous conteneurs'}
                        </span>
                      </div>

                      <p className="text-[11px] font-mono text-zinc-400 truncate max-w-md">
                        {wh.url.replace(/(webhooks\/\d+\/)(.+)/, '$1••••••••')}
                      </p>

                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        {wh.events.map((ev) => (
                          <span
                            key={ev}
                            className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-light-card dark:bg-nothing-card text-zinc-600 dark:text-zinc-400 border border-light-border dark:border-nothing-border"
                          >
                            {ev}
                          </span>
                        ))}

                        {wh.includeStatus !== false && (
                          <span className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                            + statut
                          </span>
                        )}
                        {wh.includeUptime !== false && (
                          <span className="text-[10px] font-mono text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">
                            + uptime
                          </span>
                        )}

                        {wh.lastTriggeredAt && (
                          <span className="text-[10px] font-mono text-zinc-400 ml-1">
                            Dernier envoi : {new Date(wh.lastTriggeredAt).toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions on this webhook */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => handleSendReport(wh.id)}
                        disabled={sendingReportId === wh.id}
                        className="px-3 py-1.5 rounded-xl bg-light-card dark:bg-nothing-card hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-mono btn-press border border-light-border dark:border-nothing-border flex items-center gap-1.5"
                        title="Envoyer un rapport complet de statut et uptime sur Discord"
                      >
                        <FileText size={13} className={sendingReportId === wh.id ? 'animate-spin text-nothing-red' : 'text-nothing-red'} />
                        <span>Rapport live</span>
                      </button>

                      <button
                        onClick={() => handleToggle(wh)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono btn-press border ${
                          wh.enabled
                            ? 'bg-light-card dark:bg-nothing-card text-zinc-700 dark:text-zinc-300 border-light-border dark:border-nothing-border'
                            : 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-semibold'
                        }`}
                        title={wh.enabled ? 'Désactiver temporairement' : 'Réactiver ce webhook'}
                      >
                        {wh.enabled ? 'Couper' : 'Activer'}
                      </button>

                      <button
                        onClick={() => handleTestUrl(wh.url, wh.name)}
                        disabled={testingUrl === wh.url}
                        className="p-2 rounded-xl bg-light-card dark:bg-nothing-card hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white btn-press border border-light-border dark:border-nothing-border"
                        title="Envoyer un ping de test"
                      >
                        <Send size={14} className={testingUrl === wh.url ? 'animate-pulse text-nothing-red' : ''} />
                      </button>

                      <button
                        onClick={() => handleDelete(wh.id, wh.name)}
                        className="p-2 rounded-xl bg-light-card dark:bg-nothing-card hover:bg-red-500/10 text-zinc-400 hover:text-nothing-red btn-press border border-light-border dark:border-nothing-border"
                        title="Supprimer ce webhook"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-light-subcard dark:bg-nothing-subcard border-t border-light-border dark:border-nothing-border flex items-center justify-between text-xs font-mono text-zinc-400">
          <span>Surveillance continue du daemon Docker socket.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 text-xs font-medium btn-press"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

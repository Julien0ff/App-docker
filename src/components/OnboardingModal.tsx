import React, { useState } from 'react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Check,
  Globe,
  Sun,
  Moon,
  Command,
  Activity,
  Layers,
  FolderGit2,
  FileCode,
  Bell,
  Send,
  Sparkles,
  ArrowDownCircle,
  ExternalLink,
} from 'lucide-react';
import { Language, translations } from '../i18n/translations';
import { DockerContainer, StackGroup } from '../types';
import { createWebhook, testWebhook } from '../services/api';
import { toast } from 'sonner';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onSetLang: (lang: Language) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  containers: DockerContainer[];
  stacks: StackGroup[];
  onOpenCreateModal?: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  lang,
  onSetLang,
  isDark,
  onToggleTheme,
  containers,
  stacks,
}) => {
  const [step, setStep] = useState<number>(1);
  const totalSteps = 5;

  // Webhook step form state
  const [webhookUrl, setWebhookUrl] = useState<string>('');
  const [webhookName, setWebhookName] = useState<string>('#docker-alerts');
  const [webhookTarget, setWebhookTarget] = useState<'all' | 'custom'>('all');
  const [isTestingWebhook, setIsTestingWebhook] = useState<boolean>(false);
  const [isSavingWebhook, setIsSavingWebhook] = useState<boolean>(false);
  const [webhookConfigured, setWebhookConfigured] = useState<boolean>(false);

  const t = translations[lang] || translations.fr;

  if (!isOpen) return null;

  const handleFinish = () => {
    localStorage.setItem('dockdash_onboarded', 'true');
    toast.success(lang === 'fr' ? 'Configuration terminée ! Bienvenue sur Dock (1)' : 'Setup complete! Welcome to Dock (1)');
    onClose();
  };

  const handleTestWebhook = async () => {
    if (!webhookUrl.trim().startsWith('http')) {
      toast.error(lang === 'fr' ? 'Veuillez saisir une URL Discord valide' : 'Please enter a valid Discord URL');
      return;
    }
    setIsTestingWebhook(true);
    try {
      const res = await testWebhook(webhookUrl.trim(), webhookName.trim());
      if (res.success) {
        toast.success(lang === 'fr' ? 'Message de test envoyé sur Discord !' : 'Test message sent to Discord!');
      } else {
        toast.error(`Erreur : ${res.error}`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Échec du test');
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const handleSaveWebhook = async () => {
    if (!webhookUrl.trim().startsWith('http')) {
      toast.error(lang === 'fr' ? 'Veuillez saisir une URL Discord valide' : 'Please enter a valid Discord URL');
      return;
    }
    setIsSavingWebhook(true);
    try {
      await createWebhook({
        name: webhookName.trim() || 'Discord Webhook',
        url: webhookUrl.trim(),
        events: ['start', 'stop', 'die', 'destroy'],
        enabled: true,
      });
      setWebhookConfigured(true);
      toast.success(lang === 'fr' ? 'Webhook Discord configuré et actif !' : 'Discord webhook configured and active!');
      setStep(5);
    } catch (err: any) {
      toast.error(err.message || 'Erreur sauvegarde webhook');
    } finally {
      setIsSavingWebhook(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in select-none">
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#0f1013] border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-all"
        style={{
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.4)',
        }}
      >
        {/* Top Header with Stepper */}
        <div className="px-7 pt-6 pb-4 border-b border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ea3829] shadow-[0_0_10px_#ea3829]" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-extrabold text-lg text-zinc-900 dark:text-white">
                  DOCK (1)
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                  {lang === 'fr' ? `Étape ${step} sur ${totalSteps}` : `Step ${step} of ${totalSteps}`}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleFinish}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title={lang === 'fr' ? 'Fermer le guide' : 'Close guide'}
          >
            <X size={18} />
          </button>
        </div>

        {/* Step Progress Indicators */}
        <div className="px-7 pt-3 flex gap-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                step > i + 1
                  ? 'bg-zinc-900 dark:bg-white'
                  : step === i + 1
                  ? 'bg-[#ea3829]'
                  : 'bg-zinc-200 dark:bg-zinc-800'
              }`}
            />
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-7 overflow-y-auto flex-1 text-zinc-900 dark:text-zinc-100">
          {/* STEP 1: Language & Theme */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-xl font-display font-bold text-zinc-900 dark:text-white">
                  {lang === 'fr' ? 'Choisissez votre expérience' : 'Choose your experience'}
                </h2>
                <p className="text-xs text-zinc-500 font-mono mt-1">
                  {lang === 'fr'
                    ? 'Définissez la langue par défaut et le thème de votre deck de contrôle.'
                    : 'Set your default language and the appearance of your control deck.'}
                </p>
              </div>

              {/* Language Selection */}
              <div className="space-y-2.5">
                <label className="text-xs font-mono uppercase tracking-wider text-zinc-500">
                  {lang === 'fr' ? 'Langue de l\'interface' : 'Interface language'}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => onSetLang('fr')}
                    className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all btn-press ${
                      lang === 'fr'
                        ? 'border-[#ea3829] bg-[#ea3829]/5 dark:bg-[#ea3829]/10'
                        : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🇫🇷</span>
                      <div>
                        <div className="font-semibold text-sm">Français</div>
                        <div className="text-[11px] font-mono text-zinc-500">Interface en français</div>
                      </div>
                    </div>
                    {lang === 'fr' && <Check size={18} className="text-[#ea3829]" />}
                  </button>

                  <button
                    onClick={() => onSetLang('en')}
                    className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all btn-press ${
                      lang === 'en'
                        ? 'border-[#ea3829] bg-[#ea3829]/5 dark:bg-[#ea3829]/10'
                        : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🇬🇧</span>
                      <div>
                        <div className="font-semibold text-sm">English</div>
                        <div className="text-[11px] font-mono text-zinc-500">English interface</div>
                      </div>
                    </div>
                    {lang === 'en' && <Check size={18} className="text-[#ea3829]" />}
                  </button>
                </div>
              </div>

              {/* Theme Selection */}
              <div className="space-y-2.5 pt-2">
                <label className="text-xs font-mono uppercase tracking-wider text-zinc-500">
                  {lang === 'fr' ? 'Thème visuel Nothing' : 'Nothing visual theme'}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      if (!isDark) onToggleTheme();
                    }}
                    className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all btn-press ${
                      isDark
                        ? 'border-[#ea3829] bg-[#ea3829]/5 dark:bg-[#ea3829]/10'
                        : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-zinc-900 text-white flex items-center justify-center border border-zinc-800">
                        <Moon size={16} />
                      </div>
                      <div>
                        <div className="font-semibold text-sm">Dark OS</div>
                        <div className="text-[11px] font-mono text-zinc-500">Nothing Signature Dark</div>
                      </div>
                    </div>
                    {isDark && <Check size={18} className="text-[#ea3829]" />}
                  </button>

                  <button
                    onClick={() => {
                      if (isDark) onToggleTheme();
                    }}
                    className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all btn-press ${
                      !isDark
                        ? 'border-[#ea3829] bg-[#ea3829]/5 dark:bg-[#ea3829]/10'
                        : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-zinc-100 text-zinc-900 flex items-center justify-center border border-zinc-300">
                        <Sun size={16} />
                      </div>
                      <div>
                        <div className="font-semibold text-sm">Light Deck</div>
                        <div className="text-[11px] font-mono text-zinc-500">Monolith Clean White</div>
                      </div>
                    </div>
                    {!isDark && <Check size={18} className="text-[#ea3829]" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Features Tour (Bento & Quick Control) */}
          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h2 className="text-xl font-display font-bold text-zinc-900 dark:text-white">
                  {lang === 'fr' ? 'Contrôle & Métriques en direct' : 'Live Control & Metrics'}
                </h2>
                <p className="text-xs text-zinc-500 font-mono mt-1">
                  {lang === 'fr'
                    ? 'Un tableau de bord épuré inspiré de Nothing OS pour tout piloter au doigt et à l’œil.'
                    : 'A clean Nothing OS inspired dashboard to manage everything effortlessly.'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex flex-col gap-2">
                  <div className="w-8 h-8 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 flex items-center justify-center">
                    <Activity size={16} />
                  </div>
                  <h3 className="font-semibold text-sm">
                    {lang === 'fr' ? 'Bento Métriques Système' : 'System Metrics Bento'}
                  </h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    {lang === 'fr'
                      ? 'Consommation RAM hôte, nombre de cœurs CPU, statut du démon et uptime en direct.'
                      : 'Host RAM usage, CPU core counts, daemon socket status, and live system uptime.'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex flex-col gap-2">
                  <div className="w-8 h-8 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 flex items-center justify-center">
                    <Command size={16} />
                  </div>
                  <h3 className="font-semibold text-sm">
                    {lang === 'fr' ? 'Palette de Commandes ⌘K' : 'Command Palette ⌘K'}
                  </h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    {lang === 'fr'
                      ? 'Appuyez sur Ctrl+K ou ⌘K à tout moment pour chercher, démarrer ou voir les logs sans souris.'
                      : 'Press Ctrl+K or ⌘K anytime to search, boot, stop, or view container logs via keyboard.'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex flex-col gap-2">
                  <div className="w-8 h-8 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 flex items-center justify-center">
                    <Layers size={16} />
                  </div>
                  <h3 className="font-semibold text-sm">
                    {lang === 'fr' ? 'Vues Flexibles : Grille & Tableau' : 'Flexible Views: Grid & Table'}
                  </h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    {lang === 'fr'
                      ? 'Basculez instantanément entre les cartes tactiles et la vue tableau compacte avec filtres par statut.'
                      : 'Switch instantly between tactile cards and dense table rows with status filtering.'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex flex-col gap-2">
                  <div className="w-8 h-8 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 flex items-center justify-center">
                    <Sparkles size={16} />
                  </div>
                  <h3 className="font-semibold text-sm">
                    {lang === 'fr' ? 'Démarrage Automatique (Multi-OS)' : 'System Autostart (Multi-OS)'}
                  </h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    {lang === 'fr'
                      ? 'Activez Dock (1) en tâche de fond au démarrage de l\'ordinateur sous Linux (systemd), macOS (Launchd) ou Windows (Démarrage).'
                      : 'Run Dock (1) automatically on system boot under Linux (systemd), macOS (Launchd), or Windows (Startup).'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Stacks & Containers Detection */}
          {step === 3 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h2 className="text-xl font-display font-bold text-zinc-900 dark:text-white">
                  {lang === 'fr' ? 'Détection Stacks & Conteneurs' : 'Stacks & Containers Detection'}
                </h2>
                <p className="text-xs text-zinc-500 font-mono mt-1">
                  {lang === 'fr'
                    ? 'Dock (1) indexe automatiquement vos projets Docker Compose et conteneurs indépendants.'
                    : 'Dock (1) automatically indexes Docker Compose projects and standalone containers.'}
                </p>
              </div>

              {/* Live Detection Summary Card */}
              <div className="p-4 rounded-2xl bg-[#ea3829]/5 dark:bg-[#ea3829]/10 border border-[#ea3829]/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#ea3829] text-white flex items-center justify-center font-bold">
                    {containers.length}
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-zinc-900 dark:text-white">
                      {lang === 'fr'
                        ? `${containers.length} conteneurs & ${stacks.length} stacks détectés`
                        : `${containers.length} containers & ${stacks.length} stacks detected`}
                    </div>
                    <div className="text-[11px] font-mono text-zinc-500">
                      Socket UNIX: /var/run/docker.sock
                    </div>
                  </div>
                </div>
                <div className="text-xs font-mono px-3 py-1 rounded-full bg-white dark:bg-zinc-800 text-[#ea3829] font-bold border border-[#ea3829]/20">
                  AUTO-SYNC
                </div>
              </div>

              {/* Highlights */}
              <div className="space-y-3 pt-1">
                <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex items-start gap-3">
                  <FolderGit2 size={18} className="text-[#ea3829] mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold">
                      {lang === 'fr' ? 'Actions groupées sur les Stacks' : 'Batch actions on Stacks'}
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">
                      {lang === 'fr'
                        ? 'Allumez, éteignez ou redémarrez tous les services d\'une même stack en un clic.'
                        : 'Start, stop, or restart all services in a stack with a single click.'}
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex items-start gap-3">
                  <ArrowDownCircle size={18} className="text-blue-500 mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold">
                      {lang === 'fr' ? 'Mises à jour en 1 clic (Pull & Recreate)' : '1-Click Updates (Pull & Recreate)'}
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">
                      {lang === 'fr'
                        ? 'Téléchargez la dernière version d\'une image ou redéployez une stack complète avec docker compose pull.'
                        : 'Pull the latest image tag and redeploy the stack or container instantly.'}
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex items-start gap-3">
                  <FileCode size={18} className="text-emerald-500 mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold">
                      {lang === 'fr' ? 'Éditeur de Compose YAML intégré' : 'Built-in Compose YAML Editor'}
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">
                      {lang === 'fr'
                        ? 'Modifiez les variables, ports et volumes de votre fichier docker-compose.yml directement depuis l\'app.'
                        : 'Edit env variables, ports, and volumes of docker-compose.yml files directly in-app.'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Discord Webhook (Optional) */}
          {step === 4 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-display font-bold text-zinc-900 dark:text-white">
                    {lang === 'fr' ? 'Webhooks Discord' : 'Discord Webhooks'}
                  </h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                    {lang === 'fr' ? 'Facultatif / Optionnel' : 'Optional'}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 font-mono mt-1">
                  {lang === 'fr'
                    ? 'Recevez des alertes en temps réel sur Discord lors des démarrages, arrêts, crashs ou rapports quotidiens.'
                    : 'Get real-time Discord notifications when containers start, stop, crash, or send daily status reports.'}
                </p>
              </div>

              <div className="space-y-3.5 bg-zinc-50 dark:bg-zinc-900/60 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                <div>
                  <label className="text-xs font-semibold block mb-1.5">
                    {lang === 'fr' ? 'URL du Webhook Discord' : 'Discord Webhook URL'}
                  </label>
                  <input
                    type="url"
                    placeholder="https://discord.com/api/webhooks/..."
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-xs font-mono outline-none focus:border-[#ea3829] transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold block mb-1.5">
                      {lang === 'fr' ? 'Nom du salon' : 'Channel label'}
                    </label>
                    <input
                      type="text"
                      placeholder="#docker-alerts"
                      value={webhookName}
                      onChange={(e) => setWebhookName(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-xs outline-none focus:border-[#ea3829] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold block mb-1.5">
                      {lang === 'fr' ? 'Périmètre' : 'Scope'}
                    </label>
                    <select
                      value={webhookTarget}
                      onChange={(e) => setWebhookTarget(e.target.value as any)}
                      className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-xs outline-none focus:border-[#ea3829] transition-colors"
                    >
                      <option value="all">
                        {lang === 'fr' ? 'Tous les conteneurs' : 'All containers'}
                      </option>
                      <option value="custom">
                        {lang === 'fr' ? 'Ciblage sélectif (configurable)' : 'Selective targets'}
                      </option>
                    </select>
                  </div>
                </div>

                {/* Test button & Save webhook button */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={handleTestWebhook}
                    disabled={isTestingWebhook || !webhookUrl.trim()}
                    className="px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 btn-press flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Send size={13} />
                    <span>{isTestingWebhook ? 'Test...' : lang === 'fr' ? 'Tester l\'envoi' : 'Test Send'}</span>
                  </button>

                  <button
                    onClick={handleSaveWebhook}
                    disabled={isSavingWebhook || !webhookUrl.trim()}
                    className="px-3.5 py-2 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 text-xs font-semibold hover:opacity-90 btn-press flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Check size={13} />
                    <span>{isSavingWebhook ? 'Enregistrement...' : lang === 'fr' ? 'Activer ce Webhook' : 'Save & Enable'}</span>
                  </button>
                </div>
              </div>

              <div className="text-center">
                <button
                  onClick={() => setStep(5)}
                  className="text-xs font-mono text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 underline underline-offset-4 transition-colors"
                >
                  {lang === 'fr' ? 'Passer cette étape (je configurerai plus tard)' : 'Skip this step (I will configure later)'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Completion & Launch */}
          {step === 5 && (
            <div className="space-y-6 animate-fade-in text-center py-4">
              <div className="relative inline-flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-[#ea3829]/10 text-[#ea3829] flex items-center justify-center border border-[#ea3829]/30">
                  <Sparkles size={32} />
                </div>
                <div className="absolute inset-0 rounded-full bg-[#ea3829]/20 animate-ping opacity-40" />
              </div>

              <div>
                <h2 className="text-2xl font-display font-bold text-zinc-900 dark:text-white">
                  {lang === 'fr' ? 'Dock (1) est configuré !' : 'Dock (1) is ready!'}
                </h2>
                <p className="text-xs text-zinc-500 font-mono mt-1.5 max-w-md mx-auto leading-relaxed">
                  {lang === 'fr'
                    ? 'Votre deck de contrôle Docker local est opérationnel. Vous pouvez le piloter au clavier avec ⌘K ou via l\'interface graphique.'
                    : 'Your local Docker control deck is configured and ready to roll. Control it via ⌘K or the sleek GUI.'}
                </p>
              </div>

              {/* Summary pills */}
              <div className="flex flex-wrap items-center justify-center gap-2 font-mono text-[11px] pt-1">
                <span className="px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                  {lang === 'fr' ? 'Langue : Français' : 'Language: English'}
                </span>
                <span className="px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                  {isDark ? 'Nothing Dark OS' : 'Clean Light'}
                </span>
                <span className="px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                  {containers.length} {lang === 'fr' ? 'conteneurs synchronisés' : 'containers synced'}
                </span>
                {webhookConfigured && (
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    Discord Webhook OK
                  </span>
                )}
              </div>

              {/* Main Launch Button */}
              <div className="pt-4">
                <button
                  onClick={handleFinish}
                  className="w-full max-w-sm mx-auto py-3.5 px-6 rounded-2xl bg-[#ea3829] text-white font-display font-bold text-sm shadow-lg shadow-[#ea3829]/25 hover:bg-[#ea3829]/90 btn-press flex items-center justify-center gap-2 transition-all"
                >
                  <span>{lang === 'fr' ? 'Lancer Dock (1)' : 'Launch Dock (1)'}</span>
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        {step < 5 && (
          <div className="px-7 py-4 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30 flex items-center justify-between">
            {step > 1 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 btn-press flex items-center gap-1.5"
              >
                <ChevronLeft size={16} />
                <span>{lang === 'fr' ? 'Précédent' : 'Previous'}</span>
              </button>
            ) : (
              <div />
            )}

            <button
              onClick={() => setStep(step + 1)}
              className="px-5 py-2 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 text-xs font-semibold hover:opacity-90 btn-press flex items-center gap-1.5"
            >
              <span>{lang === 'fr' ? 'Suivant' : 'Next'}</span>
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

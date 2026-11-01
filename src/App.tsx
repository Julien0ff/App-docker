import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { StatsBento } from './components/StatsBento';
import { ContainerCard } from './components/ContainerCard';
import { ContainerTable } from './components/ContainerTable';
import { StackSection } from './components/StackSection';
import { LogViewerModal } from './components/LogViewerModal';
import { ContainerDetailsModal } from './components/ContainerDetailsModal';
import { CommandPalette } from './components/CommandPalette';
import { AutostartModal } from './components/AutostartModal';
import { DeleteContainerModal } from './components/DeleteContainerModal';
import { WebhooksModal } from './components/WebhooksModal';
import { ComposeEditorModal } from './components/ComposeEditorModal';
import { CreateContainerModal } from './components/CreateContainerModal';
import { PreloadScreen } from './components/PreloadScreen';
import { OnboardingModal } from './components/OnboardingModal';
import { UpdateModal } from './components/UpdateModal';
import {
  DockerContainer,
  SystemInfoResponse,
  StackGroup,
  DiscordWebhook,
  UpdateCheckResponse,
} from './types';
import { Language, translations } from './i18n/translations';
import {
  fetchContainers,
  fetchSystemInfo,
  startContainer,
  stopContainer,
  restartContainer,
  deleteContainer,
  startStack,
  stopStack,
  restartStack,
  updateStack,
  updateContainer,
  enableAutostart,
  disableAutostart,
  fetchWebhooks,
  checkSystemUpdates,
} from './services/api';

export const App: React.FC = () => {
  const [containers, setContainers] = useState<DockerContainer[]>([]);
  const [systemInfo, setSystemInfo] = useState<SystemInfoResponse | null>(null);
  const [webhooks, setWebhooks] = useState<DiscordWebhook[]>([]);
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'stacks' | 'containers'>('dashboard');
  const [statusFilter, setStatusFilter] = useState<'all' | 'running' | 'stopped'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [stackLoadingName, setStackLoadingName] = useState<string | null>(null);
  const [isAutostartToggling, setIsAutostartToggling] = useState<boolean>(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateCheckResponse | null>(null);

  // Preload & Onboarding states
  const [isInitialReady, setIsInitialReady] = useState<boolean>(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(() => {
    return localStorage.getItem('dockdash_onboarded') !== 'true';
  });

  // Dashboard stack / cluster filter
  const [dashboardStackFilter, setDashboardStackFilter] = useState<string>('all');

  // Modals state
  const [selectedLogContainer, setSelectedLogContainer] = useState<DockerContainer | null>(null);
  const [selectedDetailsContainer, setSelectedDetailsContainer] = useState<DockerContainer | null>(null);
  const [selectedDeleteContainer, setSelectedDeleteContainer] = useState<DockerContainer | null>(null);
  const [selectedComposeStack, setSelectedComposeStack] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isAutostartModalOpen, setIsAutostartModalOpen] = useState<boolean>(false);
  const [isWebhooksModalOpen, setIsWebhooksModalOpen] = useState<boolean>(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState<boolean>(false);

  // Language state (persisted)
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('dockdash_lang');
    return (saved === 'en' || saved === 'fr') ? saved : 'fr';
  });

  const t = translations[lang] || translations.fr;

  const toggleLanguage = () => {
    setLang((prev) => {
      const next = prev === 'fr' ? 'en' : 'fr';
      localStorage.setItem('dockdash_lang', next);
      toast.info(next === 'fr' ? 'Langue : Français' : 'Language: English');
      return next;
    });
  };

  // Theme state (default dark for Nothing aesthetic)
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('dockdash_theme');
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('dockdash_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('dockdash_theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  // Load data
  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsRefreshing(true);
    try {
      const [containersData, infoData, webhooksData] = await Promise.allSettled([
        fetchContainers(),
        fetchSystemInfo(),
        fetchWebhooks(),
      ]);

      if (containersData.status === 'fulfilled') {
        setContainers(containersData.value);
      }
      if (infoData.status === 'fulfilled') {
        setSystemInfo(infoData.value);
      }
      if (webhooksData.status === 'fulfilled') {
        setWebhooks(webhooksData.value);
      }
      setIsInitialReady(true);
    } catch (err: any) {
      if (!isSilent) {
        toast.error(`Erreur de connexion : ${err.message}`);
      }
    } finally {
      if (!isSilent) setIsRefreshing(false);
    }
  }, []);

  // Initial load + interval polling
  useEffect(() => {
    loadData(false);
    const interval = setInterval(() => {
      loadData(true);
    }, 4000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Check for updates on mount
  useEffect(() => {
    checkSystemUpdates()
      .then((data) => {
        if (data && data.success) {
          setUpdateInfo(data);
          if (data.hasUpdate) {
            toast.info(`Mise à jour v${data.latestVersion} disponible`, {
              description: 'Une nouvelle version GitHub Release est prête à être installée.',
            });
          }
        }
      })
      .catch(() => {
        // Silent update check failure
      });
  }, []);

  // Container lifecycle actions
  const handleStart = async (id: string, name: string) => {
    setActionLoadingId(id);
    try {
      await startContainer(id);
      toast.success(`Conteneur "${name}" allumé avec succès`);
      await loadData(true);
    } catch (err: any) {
      toast.error(`Échec du démarrage de "${name}": ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleStop = async (id: string, name: string) => {
    setActionLoadingId(id);
    try {
      await stopContainer(id);
      toast.success(`Conteneur "${name}" éteint`);
      await loadData(true);
    } catch (err: any) {
      toast.error(`Échec de l'arrêt de "${name}": ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRestart = async (id: string, name: string) => {
    setActionLoadingId(id);
    try {
      await restartContainer(id);
      toast.success(`Conteneur "${name}" redémarré`);
      await loadData(true);
    } catch (err: any) {
      toast.error(`Échec du redémarrage de "${name}": ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Container update (pull latest image & restart)
  const handleUpdateContainer = async (id: string, name: string) => {
    setActionLoadingId(id);
    try {
      toast.info(`${t.updatingContainer} (${name})`);
      const res = await updateContainer(id);
      toast.success(res.message || t.updateContainerSuccess);
      await loadData(true);
    } catch (err: any) {
      toast.error(`Échec mise à jour "${name}": ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteContainer = async (id: string, force: boolean, removeVolumes: boolean) => {
    try {
      const msg = await deleteContainer(id, force, removeVolumes);
      toast.success(msg);
      await loadData(true);
    } catch (err: any) {
      toast.error(`Erreur suppression: ${err.message}`);
      throw err;
    }
  };

  // Stack batch actions (Allumer tout, Éteindre tout, Redémarrer tout, Mettre à jour)
  const handleStartStack = async (stackName: string) => {
    setStackLoadingName(stackName);
    try {
      const msg = await startStack(stackName);
      toast.success(msg);
      await loadData(true);
    } catch (err: any) {
      toast.error(`Erreur groupe ${stackName}: ${err.message}`);
    } finally {
      setStackLoadingName(null);
    }
  };

  const handleStopStack = async (stackName: string) => {
    setStackLoadingName(stackName);
    try {
      const msg = await stopStack(stackName);
      toast.success(msg);
      await loadData(true);
    } catch (err: any) {
      toast.error(`Erreur groupe ${stackName}: ${err.message}`);
    } finally {
      setStackLoadingName(null);
    }
  };

  const handleRestartStack = async (stackName: string) => {
    setStackLoadingName(stackName);
    try {
      const msg = await restartStack(stackName);
      toast.success(msg);
      await loadData(true);
    } catch (err: any) {
      toast.error(`Erreur groupe ${stackName}: ${err.message}`);
    } finally {
      setStackLoadingName(null);
    }
  };

  const handleUpdateStack = async (stackName: string) => {
    setStackLoadingName(stackName);
    try {
      toast.info(`${t.updatingStack} (${stackName})`);
      const res = await updateStack(stackName);
      toast.success(res.message || t.updateStackSuccess);
      await loadData(true);
    } catch (err: any) {
      toast.error(`Erreur mise à jour stack ${stackName}: ${err.message}`);
    } finally {
      setStackLoadingName(null);
    }
  };

  // Autostart toggle
  const handleToggleAutostart = async () => {
    setIsAutostartToggling(true);
    try {
      const isCurrentlyEnabled = systemInfo?.systemd?.isEnabled;
      if (isCurrentlyEnabled) {
        const res = await disableAutostart();
        toast.success(res.message);
        if (systemInfo) {
          setSystemInfo({ ...systemInfo, systemd: res.status });
        }
      } else {
        const res = await enableAutostart();
        toast.success(res.message);
        if (systemInfo) {
          setSystemInfo({ ...systemInfo, systemd: res.status });
        }
      }
    } catch (err: any) {
      toast.error(`Erreur autostart: ${err.message}`);
    } finally {
      setIsAutostartToggling(false);
    }
  };

  // Full Stack Groups (unfiltered by search/status, used for totals and dashboard filter selector)
  const allStackGroups = useMemo<StackGroup[]>(() => {
    const map = new Map<string, { dir?: string | null; containers: DockerContainer[] }>();

    for (const c of containers) {
      const key = c.stack || 'Conteneurs autonomes';
      if (!map.has(key)) {
        map.set(key, { dir: c.stackDir, containers: [] });
      }
      map.get(key)!.containers.push(c);
    }

    const list: StackGroup[] = [];
    for (const [name, val] of map.entries()) {
      const running = val.containers.filter((c) => c.state === 'running').length;
      list.push({
        name,
        dir: val.dir,
        containers: val.containers,
        runningCount: running,
        totalCount: val.containers.length,
      });
    }

    return list.sort((a, b) => {
      if (a.name === 'Conteneurs autonomes') return 1;
      if (b.name === 'Conteneurs autonomes') return -1;
      return a.name.localeCompare(b.name);
    });
  }, [containers]);

  // Filtered containers
  const runningContainers = containers.filter((c) => c.state === 'running');
  const stoppedContainers = containers.filter((c) => c.state !== 'running');

  const filteredContainers = containers.filter((c) => {
    // Dashboard stack / cluster filter
    if (currentTab === 'dashboard' && dashboardStackFilter !== 'all') {
      const cStack = c.stack || 'Conteneurs autonomes';
      if (cStack !== dashboardStackFilter) return false;
    }

    // Status filter
    if (statusFilter === 'running' && c.state !== 'running') return false;
    if (statusFilter === 'stopped' && c.state === 'running') return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = c.name.toLowerCase().includes(q);
      const matchImage = c.image.toLowerCase().includes(q);
      const matchPort = c.ports.some((p) => String(p.PublicPort || '').includes(q));
      const matchStack = c.stack?.toLowerCase().includes(q);
      if (!matchName && !matchImage && !matchPort && !matchStack) return false;
    }

    return true;
  });

  // Group filtered containers by Docker Compose Project / Stack
  const stackGroups = useMemo<StackGroup[]>(() => {
    const map = new Map<string, { dir?: string | null; containers: DockerContainer[] }>();

    for (const c of filteredContainers) {
      const key = c.stack || 'Conteneurs autonomes';
      if (!map.has(key)) {
        map.set(key, { dir: c.stackDir, containers: [] });
      }
      map.get(key)!.containers.push(c);
    }

    const list: StackGroup[] = [];
    for (const [name, val] of map.entries()) {
      const running = val.containers.filter((c) => c.state === 'running').length;
      list.push({
        name,
        dir: val.dir,
        containers: val.containers,
        runningCount: running,
        totalCount: val.containers.length,
      });
    }

    return list.sort((a, b) => {
      if (a.name === 'Conteneurs autonomes') return 1;
      if (b.name === 'Conteneurs autonomes') return -1;
      return a.name.localeCompare(b.name);
    });
  }, [filteredContainers]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-light-bg dark:bg-nothing-bg font-sans transition-colors duration-200">
      {/* Preload screen */}
      <PreloadScreen isReady={isInitialReady} />

      {/* Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        onOpenWebhooks={() => setIsWebhooksModalOpen(true)}
        onOpenAutostart={() => setIsAutostartModalOpen(true)}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
        onOpenUpdates={() => setIsUpdateModalOpen(true)}
        updateInfo={updateInfo}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        lang={lang}
        onToggleLang={toggleLanguage}
        containersCount={containers.length}
        runningCount={runningContainers.length}
        stacksCount={allStackGroups.length}
        webhooksCount={webhooks.length}
        dockerVersion={systemInfo?.dockerVersion?.Version}
        isAutostartEnabled={!!systemInfo?.systemd?.isEnabled}
      />

      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-y-auto flex flex-col">
        {/* Top Header */}
        <Header
          hostname={systemInfo?.host?.hostname || ''}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onFilterChange={setStatusFilter}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          totalCount={containers.length}
          runningCount={runningContainers.length}
          stoppedCount={stoppedContainers.length}
          isRefreshing={isRefreshing}
          onRefresh={() => loadData(false)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenCreateModal={() => setIsCreateModalOpen(true)}
          updateInfo={updateInfo}
          lang={lang}
          currentTab={currentTab}
        />

        {/* Top Bento Stats (Only on Dashboard tab) */}
        {currentTab === 'dashboard' && (
          <StatsBento
            totalContainers={containers.length}
            runningContainers={runningContainers.length}
            stoppedContainers={stoppedContainers.length}
            host={systemInfo?.host}
            dockerVersion={systemInfo?.dockerVersion}
            systemd={systemInfo?.systemd}
            isAutostartToggling={isAutostartToggling}
            onToggleAutostart={handleToggleAutostart}
            onOpenAutostartModal={() => setIsAutostartModalOpen(true)}
          />
        )}

        {/* Dashboard Stack / Cluster Filter Pills (Configurable display) */}
        {currentTab === 'dashboard' && allStackGroups.length > 0 && (
          <div className="px-8 pt-3 pb-1 flex flex-wrap items-center justify-between gap-3 select-none">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
                {t.filterByStack}
              </span>
              <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-light-card dark:bg-nothing-card border border-light-border dark:border-nothing-border shadow-xs">
                <button
                  onClick={() => setDashboardStackFilter('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium btn-press transition-colors ${
                    dashboardStackFilter === 'all'
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-semibold shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  {t.allStacks} <span className="font-mono text-[10px] opacity-75">({containers.length})</span>
                </button>
                {allStackGroups.map((g) => (
                  <button
                    key={g.name}
                    onClick={() => setDashboardStackFilter(g.name)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium btn-press transition-colors flex items-center gap-1.5 ${
                      dashboardStackFilter === g.name
                        ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-semibold shadow-xs'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ea3829]" />
                    <span>{g.name}</span>
                    <span className="font-mono text-[10px] opacity-75">({g.totalCount})</span>
                  </button>
                ))}
              </div>
            </div>

            {dashboardStackFilter !== 'all' && (
              <button
                onClick={() => setDashboardStackFilter('all')}
                className="text-xs font-mono text-[#ea3829] hover:underline flex items-center gap-1 btn-press"
              >
                <span>{t.clearStackFilter}</span>
              </button>
            )}
          </div>
        )}

        {/* Main Content Views: Stacks vs Grid vs Table */}
        <div className="flex-1 pb-12">
          {currentTab === 'stacks' ? (
            <div className="px-8 py-4">
              <StackSection
                stacks={stackGroups}
                onStartStack={handleStartStack}
                onStopStack={handleStopStack}
                onRestartStack={handleRestartStack}
                onUpdateStack={handleUpdateStack}
                onEditCompose={(name) => setSelectedComposeStack(name)}
                onStartContainer={handleStart}
                onStopContainer={handleStop}
                onRestartContainer={handleRestart}
                onUpdateContainer={handleUpdateContainer}
                onOpenLogs={(cont) => setSelectedLogContainer(cont)}
                onOpenDetails={(cont) => setSelectedDetailsContainer(cont)}
                onDeleteContainer={(cont) => setSelectedDeleteContainer(cont)}
                actionLoadingId={actionLoadingId}
                stackLoadingName={stackLoadingName}
              />
            </div>
          ) : viewMode === 'table' ? (
            <ContainerTable
              containers={filteredContainers}
              onStart={handleStart}
              onStop={handleStop}
              onRestart={handleRestart}
              onUpdate={handleUpdateContainer}
              onOpenLogs={(cont) => setSelectedLogContainer(cont)}
              onOpenDetails={(cont) => setSelectedDetailsContainer(cont)}
              onDelete={(cont) => setSelectedDeleteContainer(cont)}
              actionLoadingId={actionLoadingId}
            />
          ) : (
            <div className="px-8 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredContainers.map((c) => (
                <ContainerCard
                  key={c.id}
                  container={c}
                  onStart={handleStart}
                  onStop={handleStop}
                  onRestart={handleRestart}
                  onUpdate={handleUpdateContainer}
                  onOpenLogs={(cont) => setSelectedLogContainer(cont)}
                  onOpenDetails={(cont) => setSelectedDetailsContainer(cont)}
                  onDelete={(cont) => setSelectedDeleteContainer(cont)}
                  actionLoadingId={actionLoadingId}
                />
              ))}
            </div>
          )}

          {filteredContainers.length === 0 && (
            <div className="py-20 text-center font-mono text-zinc-500 text-xs">
              {lang === 'fr'
                ? 'Aucun conteneur correspondant aux critères de recherche.'
                : 'No containers matching the search criteria.'}
            </div>
          )}
        </div>
      </main>

      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        lang={lang}
        onSetLang={setLang}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        containers={containers}
        stacks={allStackGroups}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
      />

      {/* Compose Editor Modal */}
      <ComposeEditorModal
        stackName={selectedComposeStack}
        isOpen={!!selectedComposeStack}
        onClose={() => setSelectedComposeStack(null)}
        onStackRedeployed={() => loadData(true)}
      />

      {/* Create Container / Deploy Stack Modal */}
      <CreateContainerModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => loadData(true)}
      />

      {/* Log Viewer Modal */}
      <LogViewerModal
        container={selectedLogContainer}
        onClose={() => setSelectedLogContainer(null)}
      />

      {/* Details Inspector Modal */}
      <ContainerDetailsModal
        container={selectedDetailsContainer}
        onClose={() => setSelectedDetailsContainer(null)}
      />

      {/* Delete Container Confirmation Modal */}
      <DeleteContainerModal
        container={selectedDeleteContainer}
        isOpen={!!selectedDeleteContainer}
        onClose={() => setSelectedDeleteContainer(null)}
        onConfirmDelete={handleDeleteContainer}
      />

      {/* Discord Webhooks Modal */}
      <WebhooksModal
        isOpen={isWebhooksModalOpen}
        onClose={() => setIsWebhooksModalOpen(false)}
        webhooks={webhooks}
        onRefreshWebhooks={() => loadData(true)}
        containers={containers}
      />

      {/* Command Palette (Ctrl+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        containers={containers}
        onStart={handleStart}
        onStop={handleStop}
        onRestart={handleRestart}
        onOpenLogs={(cont) => setSelectedLogContainer(cont)}
        onOpenDetails={(cont) => setSelectedDetailsContainer(cont)}
        onToggleTheme={toggleTheme}
        onRefresh={() => loadData(false)}
      />

      {/* Autostart Setup Modal */}
      <AutostartModal
        isOpen={isAutostartModalOpen}
        onClose={() => setIsAutostartModalOpen(false)}
        systemd={systemInfo?.systemd}
        isToggling={isAutostartToggling}
        onToggle={handleToggleAutostart}
        hostPlatform={systemInfo?.host?.platform}
        lang={lang}
      />

      {/* App & System Updates Modal */}
      <UpdateModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        updateInfo={updateInfo}
        onUpdateInfoChange={(info) => setUpdateInfo(info)}
        lang={lang}
      />
    </div>
  );
};

export default App;

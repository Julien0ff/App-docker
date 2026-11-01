import {
  LayoutDashboard,
  Layers,
  FolderGit2,
  Power,
  Moon,
  Sun,
  Bell,
  Globe,
  Compass,
  ExternalLink,
  ArrowUpCircle,
} from 'lucide-react';
import { Logo } from './Logo';
import { Language, translations } from '../i18n/translations';
import { UpdateCheckResponse } from '../types';

interface SidebarProps {
  currentTab: 'dashboard' | 'stacks' | 'containers';
  onSelectTab: (tab: 'dashboard' | 'stacks' | 'containers') => void;
  onOpenWebhooks: () => void;
  onOpenAutostart: () => void;
  onOpenOnboarding?: () => void;
  onOpenUpdates?: () => void;
  updateInfo?: UpdateCheckResponse | null;
  isDark: boolean;
  onToggleTheme: () => void;
  lang?: Language;
  onToggleLang?: () => void;
  containersCount: number;
  runningCount: number;
  stacksCount?: number;
  webhooksCount?: number;
  dockerVersion?: string;
  isAutostartEnabled: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenWebhooks,
  onOpenAutostart,
  onOpenOnboarding,
  onOpenUpdates,
  updateInfo,
  isDark,
  onToggleTheme,
  lang = 'fr',
  onToggleLang,
  containersCount,
  runningCount,
  stacksCount = 0,
  webhooksCount = 0,
  dockerVersion,
  isAutostartEnabled,
}) => {
  const t = translations[lang] || translations.fr;

  return (
    <aside className="w-64 h-full flex flex-col justify-between p-5 bg-light-card dark:bg-nothing-card border-r border-light-border dark:border-nothing-border select-none transition-colors">
      <div className="space-y-6">
        {/* Brand / Logo */}
        <div className="px-1 pt-1">
          <Logo />
        </div>

        {/* Primary Views Navigation */}
        <div className="space-y-1.5 pt-2">
          <div className="px-2 pb-1 text-[10px] font-mono uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
            {lang === 'fr' ? 'Navigation' : 'Views'}
          </div>

          <button
            onClick={() => onSelectTab('dashboard')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium btn-press ${
              currentTab === 'dashboard'
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-light-hover dark:hover:bg-nothing-subcard hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <LayoutDashboard size={18} />
              <span>{t.dashboard}</span>
            </div>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                currentTab === 'dashboard'
                  ? 'bg-zinc-700 text-zinc-200 dark:bg-zinc-200 dark:text-zinc-800'
                  : 'bg-zinc-100 dark:bg-nothing-subcard text-zinc-500'
              }`}
            >
              {runningCount}/{containersCount}
            </span>
          </button>

          <button
            onClick={() => onSelectTab('stacks')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium btn-press ${
              currentTab === 'stacks'
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-light-hover dark:hover:bg-nothing-subcard hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <FolderGit2 size={18} />
              <span>{t.stacks}</span>
            </div>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                currentTab === 'stacks'
                  ? 'bg-zinc-700 text-zinc-200 dark:bg-zinc-200 dark:text-zinc-800'
                  : 'bg-zinc-100 dark:bg-nothing-subcard text-zinc-500'
              }`}
            >
              {stacksCount}
            </span>
          </button>

          <button
            onClick={() => onSelectTab('containers')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium btn-press ${
              currentTab === 'containers'
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-light-hover dark:hover:bg-nothing-subcard hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <Layers size={18} />
              <span>{t.containers}</span>
            </div>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                currentTab === 'containers'
                  ? 'bg-zinc-700 text-zinc-200 dark:bg-zinc-200 dark:text-zinc-800'
                  : 'bg-zinc-100 dark:bg-nothing-subcard text-zinc-500'
              }`}
            >
              {containersCount}
            </span>
          </button>
        </div>

        {/* Tools & Popups section (does not alter currentTab) */}
        <div className="space-y-1.5 pt-1">
          <div className="px-2 pb-1 text-[10px] font-mono uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
            {lang === 'fr' ? 'Services & Outils' : 'Tools & Services'}
          </div>

          <button
            onClick={onOpenAutostart}
            type="button"
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-light-hover dark:hover:bg-nothing-subcard border border-light-border/60 dark:border-nothing-border/60 btn-press group"
          >
            <div className="flex items-center gap-2.5">
              <Power size={15} className={isAutostartEnabled ? 'text-nothing-green' : 'text-zinc-400'} />
              <span>{t.bootAutostart}</span>
            </div>
            <span
              className={`w-2 h-2 rounded-full ${
                isAutostartEnabled ? 'bg-nothing-green animate-pulse' : 'bg-zinc-400 dark:bg-zinc-600'
              }`}
            />
          </button>

          <button
            onClick={onOpenWebhooks}
            type="button"
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-light-hover dark:hover:bg-nothing-subcard border border-light-border/60 dark:border-nothing-border/60 btn-press group"
          >
            <div className="flex items-center gap-2.5">
              <Bell size={15} className="text-zinc-400 group-hover:text-nothing-red transition-colors" />
              <span>{t.webhooks}</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-light-card dark:bg-nothing-card text-zinc-600 dark:text-zinc-300 border border-light-border dark:border-nothing-border">
              {webhooksCount}
            </span>
          </button>

          {onOpenOnboarding && (
            <button
              onClick={onOpenOnboarding}
              type="button"
              className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-light-hover dark:hover:bg-nothing-subcard border border-light-border/60 dark:border-nothing-border/60 btn-press group"
            >
              <div className="flex items-center gap-2.5">
                <Compass size={15} className="text-zinc-400 group-hover:text-[#ea3829] transition-colors" />
                <span>{t.onboardingTour}</span>
              </div>
            </button>
          )}

          {onOpenUpdates && (
            <button
              onClick={onOpenUpdates}
              type="button"
              className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-light-hover dark:hover:bg-nothing-subcard border border-light-border/60 dark:border-nothing-border/60 btn-press group"
            >
              <div className="flex items-center gap-2.5">
                <ArrowUpCircle
                  size={15}
                  className={updateInfo?.hasUpdate ? 'text-nothing-red animate-bounce' : 'text-zinc-400 group-hover:text-nothing-red transition-colors'}
                />
                <span>{lang === 'fr' ? 'Mises à jour' : 'Updates'}</span>
              </div>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${
                  updateInfo?.hasUpdate
                    ? 'bg-nothing-red/15 text-nothing-red border border-nothing-red/30 font-bold'
                    : 'bg-light-card dark:bg-nothing-card text-zinc-500 border border-light-border dark:border-nothing-border'
                }`}
              >
                {updateInfo?.hasUpdate ? `v${updateInfo.latestVersion} !` : 'v26.1'}
              </span>
            </button>
          )}

          <a
            href="https://docker.thefoxy.me"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-light-hover dark:hover:bg-nothing-subcard border border-light-border/60 dark:border-nothing-border/60 btn-press group"
          >
            <div className="flex items-center gap-2.5">
              <ExternalLink size={15} className="text-zinc-400 group-hover:text-[#ea3829] transition-colors" />
              <span>{t.landingPage}</span>
            </div>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-nothing-red/10 text-nothing-red font-bold">
              v26.1
            </span>
          </a>
        </div>
      </div>

      {/* Footer / System status, Lang & Theme toggle */}
      <div className="space-y-3 pt-4 border-t border-light-border dark:border-nothing-border">
        {/* Docker engine indicator */}
        <div className="p-3 rounded-xl bg-light-subcard dark:bg-nothing-subcard border border-light-border dark:border-nothing-border/60">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-nothing-green animate-pulse"></span>
              {t.dockerDaemon}
            </span>
            <span className="font-mono text-[10px] text-zinc-600 dark:text-zinc-300">
              {dockerVersion ? `v${dockerVersion.split('.')[0]}` : 'Socket'}
            </span>
          </div>
          <p className="text-[10px] font-mono text-zinc-600 dark:text-zinc-300 mt-1 truncate">
            /var/run/docker.sock
          </p>
        </div>

        {/* Preferences row: Language + Theme switchers */}
        <div className="grid grid-cols-2 gap-2">
          {onToggleLang && (
            <button
              onClick={onToggleLang}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-medium text-zinc-700 dark:text-zinc-300 hover:bg-light-hover dark:hover:bg-nothing-subcard border border-light-border dark:border-nothing-border btn-press"
              title="Changer de langue / Switch language"
            >
              <Globe size={13} className="text-zinc-500" />
              <span className="font-bold">{lang.toUpperCase()}</span>
            </button>
          )}

          <button
            onClick={onToggleTheme}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-light-hover dark:hover:bg-nothing-subcard border border-light-border dark:border-nothing-border btn-press"
            title="Changer de thème"
          >
            {isDark ? <Sun size={14} className="text-amber-400" /> : <Moon size={14} className="text-zinc-700" />}
            <span className="font-mono text-[11px]">{isDark ? 'Dark' : 'Light'}</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

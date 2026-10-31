import React from 'react';
import {
  Search,
  RotateCw,
  LayoutGrid,
  List,
  Command,
  Plus,
  ArrowUpCircle,
  ExternalLink,
} from 'lucide-react';
import { Language, translations } from '../i18n/translations';
import { UpdateCheckResponse } from '../types';

interface HeaderProps {
  hostname: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: 'all' | 'running' | 'stopped';
  onFilterChange: (f: 'all' | 'running' | 'stopped') => void;
  viewMode: 'grid' | 'table';
  onViewModeChange: (v: 'grid' | 'table') => void;
  totalCount: number;
  runningCount: number;
  stoppedCount: number;
  isRefreshing: boolean;
  onRefresh: () => void;
  onOpenCommandPalette: () => void;
  onOpenCreateModal?: () => void;
  updateInfo?: UpdateCheckResponse | null;
  lang?: Language;
  currentTab?: 'dashboard' | 'stacks' | 'containers';
}

export const Header: React.FC<HeaderProps> = ({
  hostname,
  searchQuery,
  onSearchChange,
  statusFilter,
  onFilterChange,
  viewMode,
  onViewModeChange,
  totalCount,
  runningCount,
  stoppedCount,
  isRefreshing,
  onRefresh,
  onOpenCommandPalette,
  onOpenCreateModal,
  updateInfo,
  lang = 'fr',
  currentTab = 'dashboard',
}) => {
  const t = translations[lang] || translations.fr;
  const isStacksTab = currentTab === 'stacks';

  return (
    <header className="px-8 pt-7 pb-4 flex flex-col gap-3 select-none">
      {/* Top Banner if GitHub Release is detected */}
      {updateInfo?.hasUpdate && (
        <div className="px-4 py-2.5 rounded-2xl bg-nothing-red/10 border border-nothing-red/30 flex items-center justify-between text-xs font-mono text-zinc-900 dark:text-zinc-100 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <ArrowUpCircle size={16} className="text-nothing-red animate-bounce" />
            <span>
              <strong>Dock-One v{updateInfo.latestVersion}</strong>{' '}
              {lang === 'fr' ? 'est disponible !' : 'is available!'} (Actuel : v{updateInfo.currentVersion})
            </span>
          </div>

          <a
            href={updateInfo.releaseUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1 rounded-xl bg-nothing-red text-white font-medium text-[11px] flex items-center gap-1.5 hover:bg-nothing-red/90 transition-colors shadow-xs"
          >
            <span>{lang === 'fr' ? 'Voir la release' : 'View release'}</span>
            <ExternalLink size={12} />
          </a>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Title & Host info */}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-display font-bold tracking-tight text-zinc-900 dark:text-white">
              {lang === 'fr' ? 'Bonjour, ' : 'Hello, '}{hostname || 'Dock-One'}
            </h1>
            <span className="w-2 h-2 rounded-full bg-nothing-red"></span>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-300 font-mono mt-0.5">
            {t.headerSubtitle} • Socket UNIX
          </p>
        </div>

        {/* Controls & Search */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Create Button (Clean '+ Nouveau' with single icon) */}
          {onOpenCreateModal && (
            <button
              onClick={onOpenCreateModal}
              className="px-3.5 py-2 rounded-xl bg-nothing-red text-white text-xs font-semibold flex items-center gap-1.5 btn-press shadow-xs hover:bg-nothing-red/90 transition-colors"
            >
              <Plus size={15} />
              <span>{t.newContainerOrStack}</span>
            </button>
          )}

          {/* Search Bar with Ctrl+K trigger */}
          <div
            onClick={onOpenCommandPalette}
            className="relative flex items-center cursor-pointer group"
          >
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-light-card dark:bg-nothing-card border border-light-border dark:border-nothing-border text-xs text-zinc-600 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-700 transition-colors shadow-sm w-56">
              <Search size={14} className="text-zinc-500" />
              <input
                type="text"
                placeholder={t.searchPlaceholder.slice(0, 22) + '...'}
                value={searchQuery}
                onChange={(e) => {
                  e.stopPropagation();
                  onSearchChange(e.target.value);
                }}
                onClick={(e) => e.stopPropagation()}
                className="bg-transparent border-none outline-none text-xs w-full text-zinc-900 dark:text-zinc-100 placeholder-zinc-500"
              />
              <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-nothing-subcard border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300">
                <Command size={10} />K
              </kbd>
            </div>
          </div>

          {/* Status Filter Pills (Hidden on the Stacks page as requested) */}
          {!isStacksTab && (
            <div className="flex items-center p-1 rounded-xl bg-light-card dark:bg-nothing-card border border-light-border dark:border-nothing-border shadow-sm">
              <button
                onClick={() => onFilterChange('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium btn-press transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-semibold shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                {t.filterAll} <span className="font-mono text-[10px] opacity-80">({totalCount})</span>
              </button>
              <button
                onClick={() => onFilterChange('running')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium btn-press transition-colors ${
                  statusFilter === 'running'
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-semibold shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                {t.filterRunning} <span className="font-mono text-[10px] opacity-80">({runningCount})</span>
              </button>
              <button
                onClick={() => onFilterChange('stopped')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium btn-press transition-colors ${
                  statusFilter === 'stopped'
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-semibold shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                {t.filterStopped} <span className="font-mono text-[10px] opacity-80">({stoppedCount})</span>
              </button>
            </div>
          )}

          {/* View Mode Toggle: Grid vs Table (Stacks removed from here as it is a top-level page) */}
          {!isStacksTab && (
            <div className="flex items-center p-1 rounded-xl bg-light-card dark:bg-nothing-card border border-light-border dark:border-nothing-border shadow-sm">
              <button
                onClick={() => onViewModeChange('grid')}
                title={t.viewGrid}
                className={`p-1.5 rounded-lg btn-press flex items-center gap-1 ${
                  viewMode === 'grid'
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-medium'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <LayoutGrid size={15} />
                <span className="text-[10px] hidden sm:inline">{t.viewGrid}</span>
              </button>
              <button
                onClick={() => onViewModeChange('table')}
                title={t.viewTable}
                className={`p-1.5 rounded-lg btn-press flex items-center gap-1 ${
                  viewMode === 'table'
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-medium'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <List size={15} />
                <span className="text-[10px] hidden sm:inline">{t.viewTable}</span>
              </button>
            </div>
          )}

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title={t.refresh}
            className="p-2 rounded-xl bg-light-card dark:bg-nothing-card border border-light-border dark:border-nothing-border text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-400 dark:hover:border-zinc-700 btn-press shadow-sm"
          >
            <RotateCw size={15} className={isRefreshing ? 'animate-spin text-nothing-red' : ''} />
          </button>
        </div>
      </div>
    </header>
  );
};

// Interactive and Dynamic GitHub Releases Integration & Animations for Dock (1) Landing Page

document.addEventListener('DOMContentLoaded', () => {
  const GITHUB_REPO = 'Julien0ff/App-docker';
  const RELEASES_API = `https://api.github.com/repos/${GITHUB_REPO}/releases`;

  // Language switcher dictionary
  const translations = {
    fr: {
      navFeatures: 'Fonctionnalités',
      navPreview: 'Aperçu App',
      navDownloads: 'Téléchargements',
      navChangelog: 'Changelog',
      btnDownloadApp: "Télécharger l'App",
      btnHeroDownload: "Télécharger l'Application",
      releaseWaiting: 'Version v26.2.5 disponible • Linux, macOS & Windows',
      releaseLive: (tag, date) => `${tag} disponible sur GitHub (publiée le ${date})`,
    },
    en: {
      navFeatures: 'Features',
      navPreview: 'App Preview',
      navDownloads: 'Downloads',
      navChangelog: 'Changelog',
      btnDownloadApp: 'Download App',
      btnHeroDownload: 'Download Application',
      releaseWaiting: 'Version v26.2.5 ready • Linux, macOS & Windows',
      releaseLive: (tag, date) => `${tag} live on GitHub (released on ${date})`,
    }
  };

  let currentLang = 'fr';
  const langToggle = document.getElementById('langToggle');

  if (langToggle) {
    langToggle.addEventListener('click', () => {
      currentLang = currentLang === 'fr' ? 'en' : 'fr';
      langToggle.textContent = currentLang.toUpperCase();
    });
  }

  // Smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // Dynamic GitHub Releases Fetcher
  async function fetchGitHubReleases() {
    const statusText = document.getElementById('releaseStatusText');
    const heroTag = document.getElementById('heroReleaseTag');
    const navTag = document.getElementById('navVersionTag');
    const clTag = document.getElementById('clLatestTag');
    const clDate = document.getElementById('clLatestDate');
    const clBody = document.getElementById('clLatestBody');

    try {
      const res = await fetch(RELEASES_API);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const releases = await res.json();

      if (Array.isArray(releases) && releases.length > 0) {
        const latest = releases[0];
        const tag = latest.tag_name || 'v26.2.5';
        const pubDate = new Date(latest.published_at || Date.now()).toLocaleDateString('fr-FR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

        const displayTag = tag.startsWith('v') ? tag : `v${tag}`;

        if (statusText) statusText.textContent = `Release ${displayTag} officielle synchronisée (${pubDate})`;
        if (heroTag) heroTag.textContent = `${displayTag} (Stable)`;
        if (navTag) navTag.textContent = displayTag;
        if (clTag) clTag.textContent = displayTag;
        if (clDate) clDate.textContent = `Publiée le ${pubDate}`;

        // If release body exists, render full Markdown
        if (latest.body && clBody) {
          clBody.innerHTML = `<div class="changelog-markdown">${renderMarkdown(latest.body)}</div>`;
        }

        // Map uploaded assets to buttons
        if (Array.isArray(latest.assets)) {
          latest.assets.forEach((asset) => {
            const name = asset.name.toLowerCase();
            const size = (asset.size / (1024 * 1024)).toFixed(1) + ' MB';
            const url = asset.browser_download_url;

            if (name.endsWith('.appimage')) {
              bindAsset('btnLinuxAppImage', 'sizeLinuxAppImage', url, size);
            } else if (name.endsWith('.deb')) {
              bindAsset('btnLinuxDeb', 'sizeLinuxDeb', url, size);
            } else if (name.endsWith('.tar.gz')) {
              bindAsset('btnLinuxTar', 'sizeLinuxTar', url, size);
            } else if (name.endsWith('.dmg')) {
              if (name.includes('arm64') || name.includes('apple') || name.includes('aarch64')) {
                bindAsset('btnMacArm', 'sizeMacArm', url, size);
              } else {
                bindAsset('btnMacIntel', 'sizeMacIntel', url, size);
              }
            } else if (name.endsWith('.zip') && (name.includes('mac') || name.includes('darwin') || name.includes('osx'))) {
              bindAsset('btnMacZip', 'sizeMacZip', url, size);
            } else if (name.endsWith('.exe')) {
              bindAsset('btnWinExe', 'sizeWinExe', url, size);
            } else if (name.endsWith('.zip') && (name.includes('win') || name.includes('windows'))) {
              bindAsset('btnWinZip', 'sizeWinZip', url, size);
            }
          });
        }
      } else {
        if (statusText) {
          statusText.textContent = 'Version v26.2.5 • Installateurs Linux, macOS & Windows';
        }
      }
    } catch (err) {
      if (statusText) {
        statusText.textContent = 'Version v26.2.5 • Linux, macOS & Windows';
      }
    }
  }

  function bindAsset(btnId, sizeId, url, sizeText) {
    const btn = document.getElementById(btnId);
    const size = document.getElementById(sizeId);
    if (btn) {
      btn.href = url;
      btn.classList.add('border-[#ea3829]/50');
    }
    if (size) size.textContent = sizeText;
  }

  // Markdown renderer with marked.js + comprehensive standalone fallback
  function renderMarkdown(md) {
    if (!md) return '';

    // If marked.js is available via CDN
    if (typeof marked !== 'undefined' && typeof marked.parse === 'function') {
      try {
        return marked.parse(md, { gfm: true, breaks: true });
      } catch (e) {
        console.warn('marked.js parse failed, using fallback:', e);
      }
    }

    // High quality offline fallback Markdown parser
    let raw = md.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // Headers
    raw = raw.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
    raw = raw.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    raw = raw.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    raw = raw.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Bold, Italic & Strikethrough
    raw = raw.replace(/\*\*\*(.*?)\*\*\*/gim, '<strong><em>$1</em></strong>');
    raw = raw.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
    raw = raw.replace(/\*(.*?)\*/gim, '<em>$1</em>');
    raw = raw.replace(/~~(.*?)~~/gim, '<del>$1</del>');

    // Inline Code
    raw = raw.replace(/`([^`]+)`/gim, '<code>$1</code>');

    // Markdown Links [text](url)
    raw = raw.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // Auto-link standalone URLs (excluding those already in href="...")
    raw = raw.replace(/(^|[^"'])(https?:\/\/[^\s<]+)/gim, '$1<a href="$2" target="_blank" rel="noopener noreferrer">$2</a>');

    // Process lists and paragraphs
    const lines = raw.split('\n');
    let inList = false;
    let listType = 'ul';
    const outputLines = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const ulMatch = line.match(/^\s*[-*+]\s+(.*)$/);
      const olMatch = line.match(/^\s*(\d+)\.\s+(.*)$/);

      if (ulMatch) {
        if (!inList || listType !== 'ul') {
          if (inList) outputLines.push(`</${listType}>`);
          outputLines.push('<ul>');
          inList = true;
          listType = 'ul';
        }
        outputLines.push(`<li>${ulMatch[1]}</li>`);
      } else if (olMatch) {
        if (!inList || listType !== 'ol') {
          if (inList) outputLines.push(`</${listType}>`);
          outputLines.push('<ol>');
          inList = true;
          listType = 'ol';
        }
        outputLines.push(`<li>${olMatch[2]}</li>`);
      } else {
        if (inList) {
          outputLines.push(`</${listType}>`);
          inList = false;
        }
        const trimmed = line.trim();
        if (trimmed.length > 0) {
          if (trimmed.startsWith('<h') || trimmed.startsWith('<hr') || trimmed.startsWith('<blockquote') || trimmed.startsWith('<pre') || trimmed.startsWith('<ul') || trimmed.startsWith('<ol')) {
            outputLines.push(trimmed);
          } else {
            outputLines.push(`<p>${trimmed}</p>`);
          }
        }
      }
    }
    if (inList) {
      outputLines.push(`</${listType}>`);
    }

    return outputLines.join('\n');
  }

  fetchGitHubReleases();

  // Scroll Reveal Animations
  const reveals = document.querySelectorAll('.reveal-on-scroll');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    reveals.forEach((el) => observer.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('is-revealed'));
  }

  // Interactive Live Preview Mockup Tabs
  const previewData = {
    containers: `
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in">
        <div class="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-colors flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-2">
              <span class="font-mono text-xs text-zinc-300 font-bold">nextcloud-server</span>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">● En cours</span>
            </div>
            <p class="text-[11px] font-mono text-zinc-500">nextcloud:28.0-apache</p>
            <div class="mt-3 flex items-center gap-2">
              <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">:8080</span>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">:8443</span>
            </div>
          </div>
          <div class="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono">
            <span class="text-zinc-500">CPU 1.2% • 182 MB</span>
            <span class="text-zinc-400">Stack: cloud</span>
          </div>
        </div>

        <div class="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-colors flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-2">
              <span class="font-mono text-xs text-zinc-300 font-bold">postgres-cluster</span>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">● En cours</span>
            </div>
            <p class="text-[11px] font-mono text-zinc-500">postgres:16-alpine</p>
            <div class="mt-3 flex items-center gap-2">
              <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">:5432</span>
            </div>
          </div>
          <div class="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono">
            <span class="text-zinc-500">CPU 0.4% • 94 MB</span>
            <span class="text-zinc-400">Stack: database</span>
          </div>
        </div>

        <div class="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-colors flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-2">
              <span class="font-mono text-xs text-zinc-300 font-bold">ghost-blog</span>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">▲ Màj dispo</span>
            </div>
            <p class="text-[11px] font-mono text-zinc-500">ghost:5-alpine</p>
            <div class="mt-3 flex items-center gap-2">
              <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">:2368</span>
            </div>
          </div>
          <div class="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono">
            <span class="text-zinc-500">CPU 0.1% • 120 MB</span>
            <span class="text-[#ea3829] font-semibold">1-Click Pull</span>
          </div>
        </div>
      </div>
    `,
    stacks: `
      <div class="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 font-mono text-xs animate-fade-in space-y-3">
        <div class="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div class="flex items-center gap-3">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <span class="text-white font-bold text-sm">Stack: production-web (3 services)</span>
          </div>
          <span class="text-[11px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">docker-compose.yml</span>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div class="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex justify-between items-center">
            <span class="text-zinc-300">traefik-proxy</span>
            <span class="text-emerald-400 text-[10px]">● 80/443</span>
          </div>
          <div class="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex justify-between items-center">
            <span class="text-zinc-300">api-backend</span>
            <span class="text-emerald-400 text-[10px]">● :5000</span>
          </div>
          <div class="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex justify-between items-center">
            <span class="text-zinc-300">redis-cache</span>
            <span class="text-emerald-400 text-[10px]">● :6379</span>
          </div>
        </div>
      </div>
    `,
    logs: `
      <div class="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 font-mono text-[11px] text-zinc-300 leading-relaxed animate-fade-in select-text space-y-1.5 overflow-x-auto">
        <div class="text-zinc-500">// Flux de logs Docker en direct (Streaming WebSocket)</div>
        <div><span class="text-zinc-500">2026-11-01T00:14:02.102Z</span> <span class="text-emerald-400">[INFO]</span> [traefik] Configuration reloaded successfully</div>
        <div><span class="text-zinc-500">2026-11-01T00:14:03.441Z</span> <span class="text-blue-400">[HTTP]</span> GET /api/v1/containers 200 OK (1.4ms)</div>
        <div><span class="text-zinc-500">2026-11-01T00:14:04.912Z</span> <span class="text-amber-400">[WARN]</span> [redis-cache] DB 0: 14 keys evicted by maxmemory-policy</div>
        <div><span class="text-zinc-500">2026-11-01T00:14:05.100Z</span> <span class="text-[#ea3829]">[WEBHOOK]</span> Discord alert sent: "ghost-blog is up to date"</div>
      </div>
    `,
    compose: `
      <div class="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-300 animate-fade-in select-text overflow-x-auto space-y-1">
        <div class="flex items-center justify-between pb-2 border-b border-zinc-800 mb-2">
          <span class="text-zinc-400">Éditeur YAML en direct</span>
          <span class="text-[10px] text-emerald-400">Syntaxe valide ✓</span>
        </div>
        <div class="text-zinc-500">services:</div>
        <div class="pl-4 text-purple-400">web-service:</div>
        <div class="pl-8 text-zinc-400">image: <span class="text-emerald-400">nginx:alpine</span></div>
        <div class="pl-8 text-zinc-400">restart: <span class="text-amber-300">unless-stopped</span></div>
        <div class="pl-8 text-zinc-400">ports:</div>
        <div class="pl-12 text-zinc-300">- <span class="text-blue-400">"80:80"</span></div>
      </div>
    `
  };

  const previewContainer = document.getElementById('previewDynamicContent');
  const tabs = document.querySelectorAll('.preview-tab-btn');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-tab');
      if (previewData[target] && previewContainer) {
        tabs.forEach((t) => {
          t.classList.remove('bg-zinc-800', 'text-white', 'font-bold', 'border-zinc-700');
          t.classList.add('bg-zinc-900', 'text-zinc-400', 'border-zinc-800');
        });
        tab.classList.remove('bg-zinc-900', 'text-zinc-400', 'border-zinc-800');
        tab.classList.add('bg-zinc-800', 'text-white', 'font-bold', 'border-zinc-700');

        previewContainer.innerHTML = previewData[target];
      }
    });
  });

  // Dynamic Telemetry Animation (subtle realistic fluctuation)
  const ramDisplay = document.getElementById('mockupRamVal');
  if (ramDisplay) {
    setInterval(() => {
      const baseRam = 8.42;
      const variation = (Math.random() * 0.08 - 0.04).toFixed(2);
      const newRam = (baseRam + parseFloat(variation)).toFixed(2);
      ramDisplay.innerHTML = `${newRam} <span class="text-xs text-zinc-500 font-mono">/ 31.2 GB</span>`;
    }, 3500);
  }
});

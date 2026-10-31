// Interactive and Dynamic GitHub Releases Integration for Dock (1) Landing Page

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
      releaseWaiting: 'v26.1 prête pour publication sur GitHub',
      releaseLive: (tag, date) => `${tag} disponible sur GitHub (publiée le ${date})`,
    },
    en: {
      navFeatures: 'Features',
      navPreview: 'App Preview',
      navDownloads: 'Downloads',
      navChangelog: 'Changelog',
      btnDownloadApp: 'Download App',
      btnHeroDownload: 'Download Application',
      releaseWaiting: 'v26.1 ready for release on GitHub',
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
        const tag = latest.tag_name || 'v26.1';
        const pubDate = new Date(latest.published_at || Date.now()).toLocaleDateString('fr-FR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

        if (statusText) statusText.textContent = `Release ${tag} officielle synchronisée (${pubDate})`;
        if (heroTag) heroTag.textContent = `${tag} (GitHub Release)`;
        if (navTag) navTag.textContent = tag;
        if (clTag) clTag.textContent = tag;
        if (clDate) clDate.textContent = `Publiée le ${pubDate}`;

        // If release body exists, show it
        if (latest.body && clBody) {
          const lines = latest.body
            .split('\n')
            .filter((l) => l.trim().length > 0)
            .slice(0, 10);
          clBody.innerHTML = `<ul class="space-y-2 text-xs text-zinc-300 font-sans leading-relaxed">${lines
            .map((line) => `<li class="flex items-start gap-2"><span class="text-[#ea3829] font-bold">●</span><span>${escapeHtml(line.replace(/^[*-]\s*/, ''))}</span></li>`)
            .join('')}</ul>`;
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
            } else if (name.endsWith('.tar.gz') && name.includes('linux')) {
              bindAsset('btnLinuxTar', 'sizeLinuxTar', url, size);
            } else if (name.endsWith('.dmg')) {
              if (name.includes('arm64') || name.includes('apple')) {
                bindAsset('btnMacArm', 'sizeMacArm', url, size);
              } else {
                bindAsset('btnMacIntel', 'sizeMacIntel', url, size);
              }
            } else if (name.endsWith('.exe')) {
              bindAsset('btnWinExe', 'sizeWinExe', url, size);
            } else if (name.endsWith('.zip') && name.includes('win')) {
              bindAsset('btnWinZip', 'sizeWinZip', url, size);
            }
          });
        }
      } else {
        if (statusText) {
          statusText.textContent = 'v26.1 — Prêt pour publication GitHub Actions';
        }
      }
    } catch (err) {
      console.warn('[Landing] Note: GitHub API offline or rate-limited:', err.message);
      if (statusText) {
        statusText.textContent = 'Version 26.1 (CalVer) • Dépôt Julien0ff/App-docker';
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

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  fetchGitHubReleases();
});

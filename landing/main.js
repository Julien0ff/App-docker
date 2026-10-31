// Interactive behaviors for Dock (1) Landing Page

document.addEventListener('DOMContentLoaded', () => {
  // Language switcher dictionary
  const translations = {
    fr: {
      navFeatures: 'Fonctionnalités',
      navPreview: 'Aperçu',
      navDownloads: 'Téléchargements',
      navChangelog: 'Changelog',
      btnOpenApp: "Ouvrir l'App",
      heroBadge: 'Version 26.1 disponible',
      heroTitle1: 'Le deck de contrôle Docker.',
      heroTitle2: 'Inspiré par Nothing OS.',
      heroSubtitle: 'Surveillez vos conteneurs en temps réel, éditez vos fichiers Compose sans jamais ouvrir un terminal et recevez des alertes Discord ultra-ciblées.',
      btnDownload: 'Télécharger v26.1',
      btnAccessDashboard: 'Accéder au Dashboard',
    },
    en: {
      navFeatures: 'Features',
      navPreview: 'Preview',
      navDownloads: 'Downloads',
      navChangelog: 'Changelog',
      btnOpenApp: 'Open App',
      heroBadge: 'Version 26.1 Available',
      heroTitle1: 'The Docker Control Deck.',
      heroTitle2: 'Inspired by Nothing OS.',
      heroSubtitle: 'Monitor containers in real time, edit Compose manifests without touching a CLI, and get strictly targeted Discord alerts.',
      btnDownload: 'Download v26.1',
      btnAccessDashboard: 'Access Dashboard',
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
});

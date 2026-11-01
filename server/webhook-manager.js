const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const os = require('os');
const { DOCKER_SOCKET } = require('./docker-client');

const DATA_DIR = path.join(__dirname, 'data');
const WEBHOOKS_FILE = path.join(DATA_DIR, 'webhooks.json');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {
    console.error('Erreur lors de la création du dossier data:', e.message);
  }
}

// In-memory webhooks cache
let webhooks = [];

function loadWebhooks() {
  try {
    if (fs.existsSync(WEBHOOKS_FILE)) {
      const data = fs.readFileSync(WEBHOOKS_FILE, 'utf8');
      webhooks = JSON.parse(data);
    } else {
      webhooks = [];
      saveWebhooksToFile();
    }
  } catch (err) {
    console.error('Erreur lors du chargement des webhooks:', err.message);
    webhooks = [];
  }
  return webhooks;
}

function saveWebhooksToFile() {
  try {
    fs.writeFileSync(WEBHOOKS_FILE, JSON.stringify(webhooks, null, 2), 'utf8');
  } catch (err) {
    console.error('Erreur lors de la sauvegarde des webhooks:', err.message);
  }
}

// Initial load
loadWebhooks();

/**
 * Send payload to a Discord webhook URL using native Node https
 */
function postToDiscord(webhookUrl, payload) {
  return new Promise((resolve, reject) => {
    try {
      const url = new URL(webhookUrl);
      if (url.protocol !== 'https:') {
        return reject(new Error('L\'URL du webhook Discord doit utiliser le protocole HTTPS'));
      }

      const postData = JSON.stringify(payload);

      const options = {
        hostname: url.hostname,
        port: 443,
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'User-Agent': 'Dock-1-Docker-Manager/26.2',
        },
      };

      const req = https.request(options, (res) => {
        let responseBody = '';
        res.on('data', (d) => {
          responseBody += d;
        });

        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ success: true, statusCode: res.statusCode });
          } else {
            let errorDetail = responseBody;
            try {
              const parsed = JSON.parse(responseBody);
              errorDetail = parsed.message || responseBody;
            } catch (_) {}
            reject(new Error(`Discord API (${res.statusCode}): ${errorDetail || 'Erreur inconnue'}`));
          }
        });
      });

      req.on('error', (e) => {
        reject(new Error(`Échec de la connexion à Discord: ${e.message}`));
      });

      req.write(postData);
      req.end();
    } catch (err) {
      reject(new Error(`URL de webhook invalide: ${err.message}`));
    }
  });
}

/**
 * Send test message to a webhook URL
 */
async function testWebhook(webhookUrl, channelName = 'Salon Discord') {
  const payload = {
    username: 'Dock (1) • Notifications',
    avatar_url: 'https://raw.githubusercontent.com/docker/compose/main/logo.png',
    embeds: [
      {
        title: '🔴 Dock (1) — Connexion Webhook Établie',
        description: `Le salon Discord a été configuré avec succès pour recevoir les notifications Docker de l'hôte **${os.hostname()}**.`,
        color: 15349801, // Nothing Red #ea3829
        fields: [
          {
            name: '🖥️ Machine Hôte',
            value: `\`${os.hostname()}\` (${os.type()} ${os.arch()})`,
            inline: true,
          },
          {
            name: '⏱️ Uptime Système',
            value: `${Math.floor(os.uptime() / 3600)}h ${Math.floor((os.uptime() % 3600) / 60)}m`,
            inline: true,
          },
          {
            name: '📡 Statut',
            value: '🟢 Actif et prêt',
            inline: true,
          },
          {
            name: '⚙️ Événements supportés',
            value: '• 🟢 Démarrages (`start`)\n• ⏹️ Arrêts (`stop`)\n• 🔄 Redémarrages (`restart`)\n• 🗑️ Suppressions (`delete`)\n• ⚠️ Arrêts inopinés / alertes (`die`)',
            inline: false,
          },
        ],
        footer: {
          text: 'Dock (1) • Docker Manager v26.2',
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };

  return postToDiscord(webhookUrl, payload);
}

/**
 * Send a full status & uptime digest report of selected stacks and containers to Discord
 */
async function sendDigestReport(webhookOrUrl, containers = []) {
  const webhookUrl = typeof webhookOrUrl === 'string' ? webhookOrUrl : webhookOrUrl.url;
  const targetWebhook = typeof webhookOrUrl === 'object' ? webhookOrUrl : webhooks.find((w) => w.url === webhookUrl);

  // Strictly filter containers if custom scope is defined
  let targetContainers = containers;
  if (targetWebhook && targetWebhook.targetScope === 'custom') {
    targetContainers = containers.filter((c) => matchesWebhookTarget(targetWebhook, c));
  }

  const running = targetContainers.filter((c) => c.state === 'running');
  const stopped = targetContainers.filter((c) => c.state !== 'running');

  // Group by stack
  const stackMap = new Map();
  for (const c of targetContainers) {
    const stackKey = c.stack || 'Conteneurs autonomes';
    if (!stackMap.has(stackKey)) stackMap.set(stackKey, []);
    stackMap.get(stackKey).push(c);
  }

  const stackSummaries = [];
  for (const [stackName, conts] of stackMap.entries()) {
    const stackRunning = conts.filter((c) => c.state === 'running').length;
    const lines = conts.slice(0, 8).map((c) => {
      const icon = c.state === 'running' ? '🟢' : '⚪';
      const uptime = targetWebhook?.includeUptime !== false && c.status ? `(${c.status})` : '';
      return `${icon} **${c.name}** \`${c.image}\` ${uptime}`;
    });
    if (conts.length > 8) {
      lines.push(`*...et ${conts.length - 8} autre(s) conteneur(s)*`);
    }

    stackSummaries.push({
      name: `📁 ${stackName} (${stackRunning}/${conts.length} actifs)`,
      value: lines.join('\n') || 'Aucun conteneur',
      inline: false,
    });
  }

  if (stackSummaries.length === 0) {
    stackSummaries.push({
      name: '🎯 Périmètre Ciblé',
      value: `Aucun conteneur ne correspond au ciblage configuré pour ce webhook.\nStacks: \`${(targetWebhook?.targetStacks || []).join(', ') || 'aucune'}\`\nConteneurs: \`${(targetWebhook?.targetContainers || []).join(', ') || 'aucun'}\``,
      inline: false,
    });
  }

  const scopeLabel = targetWebhook?.targetScope === 'custom' ? 'Périmètre Ciblé' : 'Tous les conteneurs';

  const payload = {
    username: 'Dock (1) • Rapport d\'État',
    avatar_url: 'https://raw.githubusercontent.com/docker/compose/main/logo.png',
    embeds: [
      {
        title: '📊 Dock (1) — Rapport d\'État & Uptime des Conteneurs',
        description: `Synthèse de l'état des services Docker (${scopeLabel}) sur **${os.hostname()}** (${os.type()} ${os.arch()}).\n**${running.length}** actifs / **${targetContainers.length}** conteneurs surveillés.`,
        color: 58741, // Nothing Green #00e575
        fields: [
          ...stackSummaries.slice(0, 8),
          {
            name: '🖥️ Uptime Hôte',
            value: `${Math.floor(os.uptime() / 3600)}h ${Math.floor((os.uptime() % 3600) / 60)}m`,
            inline: true,
          },
          {
            name: '⏱️ Date du rapport',
            value: new Date().toLocaleString(),
            inline: true,
          },
        ],
        footer: {
          text: `Dock (1) • Rapport d'Uptime & Santé v26.2 • ${scopeLabel}`,
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };

  return postToDiscord(webhookUrl, payload);
}

/**
 * Deduplication tracker to prevent double notifications
 */
const recentEvents = new Map();

function isRecentlyDispatched(key) {
  const now = Date.now();
  const last = recentEvents.get(key);
  if (last && now - last < 3500) {
    return true;
  }
  recentEvents.set(key, now);
  if (recentEvents.size > 200) {
    for (const [k, time] of recentEvents.entries()) {
      if (now - time > 10000) recentEvents.delete(k);
    }
  }
  return false;
}

/**
 * Check if a container matches webhook targeting rules
 */
function matchesWebhookTarget(webhook, container) {
  if (!webhook || !webhook.targetScope || webhook.targetScope === 'all') {
    return true;
  }

  const targetContainers = (Array.isArray(webhook.targetContainers) ? webhook.targetContainers : [])
    .map((c) => String(c).trim().toLowerCase().replace(/^\//, ''));
  const targetStacks = (Array.isArray(webhook.targetStacks) ? webhook.targetStacks : [])
    .map((s) => String(s).trim().toLowerCase());

  const rawName = String(container.name || (Array.isArray(container.names) ? container.names[0] : '') || '').replace(/^\//, '').toLowerCase();
  const rawId = String(container.id || '').toLowerCase();
  const rawShortId = String(container.shortId || rawId.substring(0, 12)).toLowerCase();
  const rawStack = String(
    container.stack ||
    container.labels?.['com.docker.compose.project'] ||
    container.labels?.['com.docker.stack.namespace'] ||
    ''
  ).toLowerCase();

  const matchedContainer = targetContainers.some(
    (tc) => tc === rawName || tc === rawId || tc === rawShortId
  );
  const matchedStack = rawStack && targetStacks.some((ts) => ts === rawStack);

  return Boolean(matchedContainer || matchedStack);
}

/**
 * Dispatch an event notification to all matching active webhooks
 */
async function notify(event, container, extra = {}) {
  const containerName = container.name || container.shortId || container.id || 'Conteneur';
  const dedupKey = `${event}:${container.id || containerName}`;

  if (isRecentlyDispatched(dedupKey)) {
    return;
  }

  // Filter eligible webhooks
  const eligibleWebhooks = webhooks.filter(
    (w) =>
      w.enabled &&
      Array.isArray(w.events) &&
      w.events.includes(event) &&
      matchesWebhookTarget(w, container)
  );

  if (eligibleWebhooks.length === 0) return;

  // Build Nothing-styled Embed based on event
  let title = '';
  let color = 15349801; // Nothing red default
  let description = '';

  switch (event) {
    case 'start':
      title = `🟢 Conteneur Démarré : ${containerName}`;
      color = 58741; // Nothing Green #00e575
      description = `Le conteneur **${containerName}** a été démarré avec succès.`;
      break;
    case 'stop':
      title = `⏹️ Conteneur Arrêté : ${containerName}`;
      color = 15349801; // Nothing Red #ea3829
      description = `Le conteneur **${containerName}** a été arrêté.`;
      break;
    case 'restart':
      title = `🔄 Conteneur Redémarré : ${containerName}`;
      color = 16755200; // Amber #ffaa00
      description = `Le conteneur **${containerName}** a été redémarré.`;
      break;
    case 'delete':
      title = `🗑️ Conteneur Supprimé : ${containerName}`;
      color = 10027008; // Dark Red #990000
      description = `Le conteneur **${containerName}** a été supprimé de Docker.`;
      break;
    case 'die':
      title = `⚠️ Alerte : Conteneur arrêté anormalement : ${containerName}`;
      color = 16711731; // Crimson #ff0033
      description = `Le conteneur **${containerName}** s'est arrêté inopinément (code de sortie : \`${extra.exitCode ?? '?'}\`).`;
      break;
    default:
      title = `ℹ️ Événement Docker : ${containerName}`;
      color = 8421504;
      description = `Action: ${event}`;
  }

  for (const webhook of eligibleWebhooks) {
    const fields = [
      {
        name: '📦 Conteneur',
        value: `\`${containerName}\` (${(container.id || '').substring(0, 12) || 'N/A'})`,
        inline: true,
      },
      {
        name: '🏷️ Image',
        value: `\`${container.image || 'N/A'}\``,
        inline: true,
      },
    ];

    if (container.stack) {
      fields.push({
        name: '📁 Stack / Dossier',
        value: `\`${container.stack}\``,
        inline: true,
      });
    }

    // Optional Uptime & Detailed Status as requested by user
    if (webhook.includeStatus !== false && (container.state || container.status)) {
      fields.push({
        name: '📊 Statut Actuel',
        value: `\`${container.state || 'exited'}\``,
        inline: true,
      });
    }

    if (webhook.includeUptime !== false && container.status) {
      fields.push({
        name: '⏱️ Uptime / Temps actif',
        value: container.status,
        inline: true,
      });
    }

    if (extra.source) {
      fields.push({
        name: '🕹️ Source',
        value: extra.source,
        inline: true,
      });
    }

    fields.push({
      name: '🖥️ Machine Hôte',
      value: `${os.hostname()} (${os.type()} ${os.arch()})`,
      inline: true,
    });

    const payload = {
      username: 'Dock (1) • Docker Manager',
      avatar_url: 'https://raw.githubusercontent.com/docker/compose/main/logo.png',
      embeds: [
        {
          title,
          description,
          color,
          fields,
          footer: {
            text: `Dock (1) • Événement ${event.toUpperCase()} • v26.2`,
          },
          timestamp: new Date().toISOString(),
        },
      ],
    };

    postToDiscord(webhook.url, payload)
      .then(() => {
        webhook.lastTriggeredAt = new Date().toISOString();
        saveWebhooksToFile();
      })
      .catch((err) => {
        console.error(`Erreur webhook Discord (${webhook.name}):`, err.message);
      });
  }
}

/**
 * Background Docker daemon event stream listener
 */
let eventReq = null;

function startDockerEventListener() {
  if (eventReq) return;

  const options = {
    socketPath: DOCKER_SOCKET,
    path: '/events?filters=%7B%22type%22%3A%5B%22container%22%5D%7D',
    method: 'GET',
  };

  try {
    eventReq = http.request(options, (res) => {
      let buffer = '';

      res.on('data', (chunk) => {
        buffer += chunk.toString('utf8');
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const ev = JSON.parse(line);
            if (ev.Type === 'container') {
              const action = ev.Action;
              const actor = ev.Actor || {};
              const attributes = actor.Attributes || {};
              const containerId = actor.ID || ev.id || '';
              const containerName = attributes.name || containerId.substring(0, 12);
              const stack = attributes['com.docker.compose.project'] || null;
              const image = attributes.image || 'docker:image';

              const containerData = {
                id: containerId,
                shortId: containerId.substring(0, 12),
                name: containerName,
                image,
                stack,
                status: action === 'start' ? 'Démarré récemment' : action === 'stop' ? 'Arrêté' : '',
                state: action === 'start' ? 'running' : 'exited',
              };

              if (action === 'start') {
                notify('start', containerData, { source: 'Docker Daemon' });
              } else if (action === 'stop') {
                notify('stop', containerData, { source: 'Docker Daemon' });
              } else if (action === 'restart') {
                notify('restart', containerData, { source: 'Docker Daemon' });
              } else if (action === 'destroy') {
                notify('delete', containerData, { source: 'Docker Daemon' });
              } else if (action === 'die') {
                const exitCode = attributes.exitCode;
                if (exitCode && exitCode !== '0') {
                  notify('die', containerData, { exitCode, source: 'Signal Docker' });
                }
              }
            }
          } catch (_) {}
        }
      });

      res.on('end', () => {
        eventReq = null;
        setTimeout(startDockerEventListener, 5000);
      });

      res.on('error', () => {
        eventReq = null;
        setTimeout(startDockerEventListener, 5000);
      });
    });

    eventReq.on('error', () => {
      eventReq = null;
      setTimeout(startDockerEventListener, 5000);
    });

    eventReq.end();
  } catch (e) {
    eventReq = null;
    setTimeout(startDockerEventListener, 5000);
  }
}

// Start watching Docker events
startDockerEventListener();

module.exports = {
  getWebhooks: () => loadWebhooks(),

  createWebhook: ({
    name,
    url,
    events = ['start', 'stop', 'restart', 'delete', 'die'],
    enabled = true,
    targetScope = 'all',
    targetStacks = [],
    targetContainers = [],
    includeUptime = true,
    includeStatus = true,
  }) => {
    const id = 'wh_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const newWebhook = {
      id,
      name: name.trim() || 'Discord Webhook',
      url: url.trim(),
      events: Array.isArray(events) ? events : ['start', 'stop', 'restart', 'delete', 'die'],
      enabled: enabled ?? true,
      targetScope: targetScope || 'all',
      targetStacks: Array.isArray(targetStacks) ? targetStacks : [],
      targetContainers: Array.isArray(targetContainers) ? targetContainers : [],
      includeUptime: includeUptime ?? true,
      includeStatus: includeStatus ?? true,
      createdAt: new Date().toISOString(),
      lastTriggeredAt: null,
    };
    webhooks.push(newWebhook);
    saveWebhooksToFile();
    return newWebhook;
  },

  updateWebhook: (id, updates) => {
    const index = webhooks.findIndex((w) => w.id === id);
    if (index === -1) return null;
    webhooks[index] = {
      ...webhooks[index],
      ...updates,
      id,
    };
    saveWebhooksToFile();
    return webhooks[index];
  },

  deleteWebhook: (id) => {
    const initialLen = webhooks.length;
    webhooks = webhooks.filter((w) => w.id !== id);
    saveWebhooksToFile();
    return webhooks.length < initialLen;
  },

  testWebhook,
  sendDigestReport,
  notify,
};

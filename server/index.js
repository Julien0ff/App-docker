const express = require('express');
const cors = require('cors');
const path = require('path');
const os = require('os');
const fs = require('fs');
const https = require('https');
const { exec } = require('child_process');
const docker = require('./docker-client');
const systemd = require('./systemd-manager');
const webhookManager = require('./webhook-manager');

const app = express();
const PORT = process.env.PORT || 4500;
const APP_VERSION = '26.2';

app.use(cors());
app.use(express.json());

// In-memory cache for container stats so list endpoint is instant (0ms delay)
const statsCache = new Map();
let isUpdatingStats = false;

async function refreshStatsInBackground() {
  if (isUpdatingStats) return;
  isUpdatingStats = true;
  try {
    const list = await docker.listContainers(true);
    const running = list.filter((c) => c.State === 'running');

    // Sample stats sequentially or in small batches of 4 to keep Docker daemon load low
    const BATCH_SIZE = 4;
    for (let i = 0; i < running.length; i += BATCH_SIZE) {
      const batch = running.slice(i, i + BATCH_SIZE);
      await Promise.allSettled(
        batch.map(async (c) => {
          const stats = await docker.getContainerStats(c.Id);
          statsCache.set(c.Id, {
            ...stats,
            updatedAt: Date.now(),
          });
        })
      );
    }
  } catch (err) {
    // Non-blocking background log
  } finally {
    isUpdatingStats = false;
  }
}

// Start background stats sampling loop
setInterval(refreshStatsInBackground, 6000);
setTimeout(refreshStatsInBackground, 1000);

// API Routes

// 1. System & Host info
app.get('/api/system/info', async (req, res) => {
  try {
    const [dockerInfo, dockerVer, systemdStatus] = await Promise.allSettled([
      docker.getDockerInfo(),
      docker.getDockerVersion(),
      systemd.getStatus(),
    ]);

    const memTotal = os.totalmem();
    const memFree = os.freemem();
    const cpus = os.cpus();

    res.json({
      success: true,
      host: {
        hostname: os.hostname(),
        platform: os.platform(),
        release: os.release(),
        uptime: os.uptime(),
        arch: os.arch(),
        cpuModel: cpus[0]?.model || 'CPU',
        cpuCores: cpus.length,
        memoryTotalGb: parseFloat((memTotal / (1024 ** 3)).toFixed(2)),
        memoryUsedGb: parseFloat(((memTotal - memFree) / (1024 ** 3)).toFixed(2)),
      },
      docker: dockerInfo.status === 'fulfilled' ? dockerInfo.value : null,
      dockerVersion: dockerVer.status === 'fulfilled' ? dockerVer.value : null,
      systemd: systemdStatus.status === 'fulfilled' ? systemdStatus.value : null,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Systemd Autostart endpoints
app.get('/api/system/autostart', async (req, res) => {
  try {
    const status = await systemd.getStatus();
    res.json({ success: true, ...status });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/system/autostart/enable', async (req, res) => {
  const result = await systemd.enableAutoStart();
  res.status(result.success ? 200 : 500).json(result);
});

app.post('/api/system/autostart/disable', async (req, res) => {
  const result = await systemd.disableAutoStart();
  res.status(result.success ? 200 : 500).json(result);
});

// 3. Containers list
app.get('/api/containers', async (req, res) => {
  try {
    const containers = await docker.listContainers(true);

    // Merge in cached stats
    const enriched = containers.map((c) => {
      const cached = statsCache.get(c.Id) || {
        cpuPercent: 0,
        memory: { usageMb: 0, limitMb: 0, percent: 0 },
        pids: 0,
      };

      const stack = c.Labels ? c.Labels['com.docker.compose.project'] || null : null;
      const stackDir = c.Labels ? c.Labels['com.docker.compose.project.working_dir'] || null : null;
      const stackService = c.Labels ? c.Labels['com.docker.compose.service'] || null : null;
      const rawName = c.Names && c.Names[0] ? c.Names[0].replace(/^\//, '') : c.Id.substring(0, 12);

      return {
        id: c.Id,
        shortId: c.Id.substring(0, 12),
        name: rawName,
        names: c.Names,
        image: c.Image,
        imageId: c.ImageID,
        command: c.Command,
        created: c.Created,
        state: c.State, // "running", "exited", "paused"
        status: c.Status, // e.g. "Up 20 minutes (healthy)"
        ports: c.Ports || [],
        labels: c.Labels || {},
        stack,
        stackDir,
        stackService,
        stats: cached,
      };
    });

    res.json({
      success: true,
      count: enriched.length,
      containers: enriched,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. Container inspect
app.get('/api/containers/:id/inspect', async (req, res) => {
  try {
    const data = await docker.inspectContainer(req.params.id);
    res.json({ success: true, container: data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. Container live stats
app.get('/api/containers/:id/stats', async (req, res) => {
  try {
    const stats = await docker.getContainerStats(req.params.id);
    statsCache.set(req.params.id, { ...stats, updatedAt: Date.now() });
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 6. Container actions (start, stop, restart, kill, delete)
app.post('/api/containers/:id/start', async (req, res) => {
  try {
    const info = await docker.inspectContainer(req.params.id).catch(() => null);
    await docker.startContainer(req.params.id);
    const containerName = info?.Name ? info.Name.replace(/^\//, '') : req.params.id.substring(0, 12);
    webhookManager.notify('start', {
      id: req.params.id,
      name: containerName,
      image: info?.Config?.Image || 'docker:image',
      stack: info?.Config?.Labels?.['com.docker.compose.project'] || null,
    }, { source: 'Dock (1) Dashboard' });
    res.json({ success: true, message: `Conteneur ${containerName} démarré avec succès` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/containers/:id/stop', async (req, res) => {
  try {
    const timeout = parseInt(req.query.t || '10', 10);
    const info = await docker.inspectContainer(req.params.id).catch(() => null);
    await docker.stopContainer(req.params.id, timeout);
    statsCache.delete(req.params.id);
    const containerName = info?.Name ? info.Name.replace(/^\//, '') : req.params.id.substring(0, 12);
    webhookManager.notify('stop', {
      id: req.params.id,
      name: containerName,
      image: info?.Config?.Image || 'docker:image',
      stack: info?.Config?.Labels?.['com.docker.compose.project'] || null,
    }, { source: 'Dock (1) Dashboard' });
    res.json({ success: true, message: `Conteneur ${containerName} arrêté avec succès` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/containers/:id/restart', async (req, res) => {
  try {
    const timeout = parseInt(req.query.t || '10', 10);
    const info = await docker.inspectContainer(req.params.id).catch(() => null);
    await docker.restartContainer(req.params.id, timeout);
    const containerName = info?.Name ? info.Name.replace(/^\//, '') : req.params.id.substring(0, 12);
    webhookManager.notify('restart', {
      id: req.params.id,
      name: containerName,
      image: info?.Config?.Image || 'docker:image',
      stack: info?.Config?.Labels?.['com.docker.compose.project'] || null,
    }, { source: 'Dock (1) Dashboard' });
    res.json({ success: true, message: `Conteneur ${containerName} redémarré avec succès` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/containers/:id/kill', async (req, res) => {
  try {
    await docker.killContainer(req.params.id);
    statsCache.delete(req.params.id);
    res.json({ success: true, message: `Signal KILL envoyé au conteneur ${req.params.id}` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete / Remove container
app.delete('/api/containers/:id', async (req, res) => {
  try {
    const force = req.query.force === 'true' || req.query.force === '1';
    const removeVolumes = req.query.v === 'true' || req.query.v === '1';
    const info = await docker.inspectContainer(req.params.id).catch(() => null);
    const containerName = info?.Name ? info.Name.replace(/^\//, '') : req.params.id.substring(0, 12);

    await docker.deleteContainer(req.params.id, force, removeVolumes);
    statsCache.delete(req.params.id);

    webhookManager.notify('delete', {
      id: req.params.id,
      name: containerName,
      image: info?.Config?.Image || 'docker:image',
      stack: info?.Config?.Labels?.['com.docker.compose.project'] || null,
    }, { source: 'Dock (1) Dashboard' });

    res.json({
      success: true,
      message: `Conteneur ${containerName} supprimé avec succès`,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create and run new container without CLI
app.post('/api/containers/create', async (req, res) => {
  try {
    const { name, image, ports, env, volumes, restartPolicy, startImmediately } = req.body;
    if (!image || typeof image !== 'string') {
      return res.status(400).json({ success: false, error: "L'image Docker est obligatoire (ex: nginx:alpine)" });
    }

    // Attempt to pull image (non-blocking if already local)
    try {
      await docker.pullImage(image.trim());
    } catch (_) {}

    const ExposedPorts = {};
    const PortBindings = {};

    if (Array.isArray(ports)) {
      for (const p of ports) {
        const cPort = parseInt(p.containerPort, 10);
        const hPort = p.hostPort ? String(p.hostPort) : '';
        const proto = p.protocol || 'tcp';
        if (cPort) {
          const key = `${cPort}/${proto}`;
          ExposedPorts[key] = {};
          if (hPort) {
            PortBindings[key] = [{ HostPort: hPort }];
          }
        }
      }
    }

    const envArray = [];
    if (Array.isArray(env)) {
      for (const item of env) {
        if (typeof item === 'string' && item.includes('=')) {
          envArray.push(item);
        } else if (item && item.key) {
          envArray.push(`${item.key}=${item.value || ''}`);
        }
      }
    } else if (env && typeof env === 'object') {
      for (const [k, v] of Object.entries(env)) {
        envArray.push(`${k}=${v}`);
      }
    }

    const binds = [];
    if (Array.isArray(volumes)) {
      for (const v of volumes) {
        if (v.hostPath && v.containerPath) {
          binds.push(`${v.hostPath}:${v.containerPath}:${v.mode || 'rw'}`);
        }
      }
    }

    const containerConfig = {
      Image: image.trim(),
      Env: envArray,
      ExposedPorts,
      HostConfig: {
        PortBindings,
        Binds: binds,
        RestartPolicy: {
          Name: restartPolicy || 'unless-stopped',
        },
      },
    };

    const containerName = name && name.trim() ? name.trim().replace(/^\//, '') : null;
    const created = await docker.createContainer(containerName, containerConfig);
    const containerId = created.Id;

    if (startImmediately !== false) {
      await docker.startContainer(containerId);
    }

    webhookManager.notify('start', {
      id: containerId,
      name: containerName || containerId.substring(0, 12),
      image: image.trim(),
      stack: null,
      state: 'running',
      status: 'Créé via Dock (1)',
    }, { source: 'Dock (1) Creator' });

    res.json({
      success: true,
      containerId,
      message: `Conteneur "${containerName || containerId.substring(0, 12)}" créé avec succès`,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 7. Container logs (snapshot)
app.get('/api/containers/:id/logs', async (req, res) => {
  try {
    const tail = parseInt(req.query.tail || '250', 10);
    const logs = await docker.getContainerLogs(req.params.id, tail);
    res.json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 8. Container logs live streaming (SSE - Server-Sent Events)
app.get('/api/containers/:id/logs/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const tail = parseInt(req.query.tail || '150', 10);
  docker.streamLogsToResponse(req.params.id, res, tail);
});

// 9. Stack batch controls (start, stop, restart all containers in a stack)
app.post('/api/stacks/:stackName/start', async (req, res) => {
  try {
    const { stackName } = req.params;
    const containers = await docker.listContainers(true);
    const stackContainers = containers.filter(
      (c) => c.Labels && c.Labels['com.docker.compose.project'] === stackName
    );
    if (stackContainers.length === 0) {
      return res.status(404).json({ success: false, error: `Aucun conteneur trouvé pour le groupe "${stackName}"` });
    }
    const results = await Promise.allSettled(stackContainers.map((c) => docker.startContainer(c.Id)));
    res.json({
      success: true,
      message: `Démarrage de la stack "${stackName}" lancé (${stackContainers.length} conteneurs)`,
      count: stackContainers.length,
      results,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/stacks/:stackName/stop', async (req, res) => {
  try {
    const { stackName } = req.params;
    const containers = await docker.listContainers(true);
    const stackContainers = containers.filter(
      (c) => c.Labels && c.Labels['com.docker.compose.project'] === stackName
    );
    if (stackContainers.length === 0) {
      return res.status(404).json({ success: false, error: `Aucun conteneur trouvé pour le groupe "${stackName}"` });
    }
    const results = await Promise.allSettled(stackContainers.map((c) => docker.stopContainer(c.Id, 10)));
    res.json({
      success: true,
      message: `Arrêt de la stack "${stackName}" effectué (${stackContainers.length} conteneurs)`,
      count: stackContainers.length,
      results,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/stacks/:stackName/restart', async (req, res) => {
  try {
    const { stackName } = req.params;
    const containers = await docker.listContainers(true);
    const stackContainers = containers.filter(
      (c) => c.Labels && c.Labels['com.docker.compose.project'] === stackName
    );
    if (stackContainers.length === 0) {
      return res.status(404).json({ success: false, error: `Aucun conteneur trouvé pour le groupe "${stackName}"` });
    }
    const results = await Promise.allSettled(stackContainers.map((c) => docker.restartContainer(c.Id, 10)));
    res.json({
      success: true,
      message: `Redémarrage de la stack "${stackName}" effectué (${stackContainers.length} conteneurs)`,
      count: stackContainers.length,
      results,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 10. Discord Webhooks management endpoints
app.get('/api/webhooks', (req, res) => {
  try {
    const list = webhookManager.getWebhooks();
    res.json({ success: true, webhooks: list });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/webhooks', (req, res) => {
  try {
    const {
      name,
      url,
      events,
      enabled,
      targetScope,
      targetStacks,
      targetContainers,
      includeUptime,
      includeStatus,
    } = req.body;
    if (!url || typeof url !== 'string' || !url.startsWith('https://discord.com/api/webhooks/')) {
      return res.status(400).json({
        success: false,
        error: "L'URL doit être un webhook Discord HTTPS valide (ex: https://discord.com/api/webhooks/123/abc...)",
      });
    }
    const created = webhookManager.createWebhook({
      name,
      url,
      events,
      enabled,
      targetScope: targetScope || 'all',
      targetStacks: Array.isArray(targetStacks) ? targetStacks : [],
      targetContainers: Array.isArray(targetContainers) ? targetContainers : [],
      includeUptime: includeUptime ?? true,
      includeStatus: includeStatus ?? true,
    });
    res.json({ success: true, webhook: created });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/webhooks/:id', (req, res) => {
  try {
    const updated = webhookManager.updateWebhook(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Webhook introuvable' });
    }
    res.json({ success: true, webhook: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/webhooks/:id', (req, res) => {
  try {
    const deleted = webhookManager.deleteWebhook(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Webhook introuvable' });
    }
    res.json({ success: true, message: 'Webhook supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/webhooks/test', async (req, res) => {
  try {
    const { url, name } = req.body;
    if (!url || typeof url !== 'string' || !url.startsWith('https://discord.com/api/webhooks/')) {
      return res.status(400).json({
        success: false,
        error: "Veuillez spécifier une URL Discord valide (https://discord.com/api/webhooks/...)",
      });
    }
    await webhookManager.testWebhook(url, name);
    res.json({
      success: true,
      message: 'Message de test envoyé avec succès sur Discord !',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Send on-demand status & uptime digest report to a Discord Webhook
app.post('/api/webhooks/:id/report', async (req, res) => {
  try {
    const webhooks = webhookManager.getWebhooks();
    const webhook = webhooks.find((w) => w.id === req.params.id);
    if (!webhook) {
      return res.status(404).json({ success: false, error: 'Webhook introuvable' });
    }

    const containers = await docker.listContainers(true);
    const enriched = containers.map((c) => ({
      id: c.Id,
      shortId: c.Id ? c.Id.substring(0, 12) : '',
      name: c.Names && c.Names[0] ? c.Names[0].replace(/^\//, '') : (c.Id ? c.Id.substring(0, 12) : 'container'),
      image: c.Image,
      state: c.State,
      status: c.Status,
      stack: c.Labels ? c.Labels['com.docker.compose.project'] || c.Labels['com.docker.stack.namespace'] || null : null,
    }));

    await webhookManager.sendDigestReport(webhook, enriched);
    res.json({
      success: true,
      message: `Rapport d'état et uptime transmis sur Discord (${webhook.name})`,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update entire stack (pull latest images & redeploy with docker compose)
app.post('/api/stacks/:stackName/update', async (req, res) => {
  try {
    const { stackName } = req.params;
    const containers = await docker.listContainers(true);
    const stackContainers = containers.filter(
      (c) => c.Labels && c.Labels['com.docker.compose.project'] === stackName
    );

    let workingDir = null;
    let configFiles = null;
    for (const c of stackContainers) {
      if (c.Labels['com.docker.compose.project.working_dir']) {
        workingDir = c.Labels['com.docker.compose.project.working_dir'];
      }
      if (c.Labels['com.docker.compose.project.config_files']) {
        configFiles = c.Labels['com.docker.compose.project.config_files'];
      }
    }

    if (!workingDir && configFiles) {
      workingDir = path.dirname(configFiles);
    }

    if (!workingDir || !fs.existsSync(workingDir)) {
      return res.status(404).json({
        success: false,
        error: `Dossier de travail introuvable pour la stack "${stackName}"`,
      });
    }

    exec('docker compose pull && (docker compose up -d || docker-compose up -d)', { cwd: workingDir }, (err, stdout, stderr) => {
      if (err) {
        console.error(`Erreur mise à jour stack (${stackName}):`, stderr || err.message);
        return res.status(500).json({
          success: false,
          error: `Échec du pull / redéploiement: ${stderr || err.message}`,
        });
      }
      res.json({
        success: true,
        message: `Stack "${stackName}" mise à jour avec succès`,
        output: stdout,
      });
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update single container (pull latest image and restart)
app.post('/api/containers/:id/update', async (req, res) => {
  try {
    const containerId = req.params.id;
    const info = await docker.inspectContainer(containerId);
    if (!info) {
      return res.status(404).json({ success: false, error: 'Conteneur introuvable' });
    }

    const imageName = info.Config?.Image || '';
    const containerName = info.Name ? info.Name.replace(/^\//, '') : containerId.substring(0, 12);

    if (imageName) {
      try {
        await docker.pullImage(imageName);
      } catch (pullErr) {
        console.warn(`Avertissement pull ${imageName}:`, pullErr.message);
      }
    }

    await docker.restartContainer(containerId, 5);
    res.json({
      success: true,
      message: `Conteneur "${containerName}" mis à jour avec succès`,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 11. Docker Compose Editor routes
app.get('/api/stacks/:stackName/compose', async (req, res) => {
  try {
    const { stackName } = req.params;
    const containers = await docker.listContainers(true);
    const stackContainers = containers.filter(
      (c) => c.Labels && c.Labels['com.docker.compose.project'] === stackName
    );

    let workingDir = null;
    let configFiles = null;

    for (const c of stackContainers) {
      if (c.Labels['com.docker.compose.project.working_dir']) {
        workingDir = c.Labels['com.docker.compose.project.working_dir'];
      }
      if (c.Labels['com.docker.compose.project.config_files']) {
        configFiles = c.Labels['com.docker.compose.project.config_files'];
      }
    }

    let filePath = null;
    if (configFiles && fs.existsSync(configFiles)) {
      filePath = configFiles;
    } else if (workingDir) {
      const candidates = [
        path.join(workingDir, 'docker-compose.yml'),
        path.join(workingDir, 'docker-compose.yaml'),
        path.join(workingDir, 'compose.yml'),
        path.join(workingDir, 'compose.yaml'),
      ];
      for (const cand of candidates) {
        if (fs.existsSync(cand)) {
          filePath = cand;
          break;
        }
      }
    }

    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: `Fichier docker-compose.yml introuvable pour la stack "${stackName}"`,
        workingDir,
      });
    }

    const content = fs.readFileSync(filePath, 'utf8');
    res.json({
      success: true,
      stackName,
      filePath,
      workingDir: workingDir || path.dirname(filePath),
      content,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/stacks/:stackName/compose', async (req, res) => {
  try {
    const { stackName } = req.params;
    const { content, filePath, restartAfterSave } = req.body;

    if (!content || typeof content !== 'string') {
      return res.status(400).json({ success: false, error: 'Contenu YAML manquant' });
    }

    let targetFile = filePath;
    if (!targetFile || !fs.existsSync(targetFile)) {
      const containers = await docker.listContainers(true);
      const stackContainers = containers.filter(
        (c) => c.Labels && c.Labels['com.docker.compose.project'] === stackName
      );
      for (const c of stackContainers) {
        const dir = c.Labels['com.docker.compose.project.working_dir'];
        if (dir && fs.existsSync(path.join(dir, 'docker-compose.yml'))) {
          targetFile = path.join(dir, 'docker-compose.yml');
          break;
        }
      }
    }

    if (!targetFile) {
      return res.status(404).json({ success: false, error: 'Chemin du fichier compose introuvable' });
    }

    fs.writeFileSync(targetFile, content, 'utf8');

    if (restartAfterSave) {
      const workingDir = path.dirname(targetFile);
      exec('docker compose up -d || docker-compose up -d', { cwd: workingDir }, (err, stdout, stderr) => {
        if (err) {
          console.error(`Erreur docker compose up (${stackName}):`, stderr || err.message);
        }
      });
    }

    res.json({
      success: true,
      message: `Fichier ${path.basename(targetFile)} sauvegardé${restartAfterSave ? ' et mise à jour de la stack lancée' : ''}`,
      filePath: targetFile,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Deploy new Compose Stack from scratch
app.post('/api/stacks/deploy', async (req, res) => {
  try {
    const { name, dirPath, composeYaml } = req.body;
    if (!name || !composeYaml) {
      return res.status(400).json({ success: false, error: 'Nom de stack et compose.yml requis' });
    }

    const cleanName = name.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    const targetDir = dirPath && dirPath.trim() ? dirPath.trim() : path.join(os.homedir(), 'stacks', cleanName);

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const composePath = path.join(targetDir, 'docker-compose.yml');
    fs.writeFileSync(composePath, composeYaml, 'utf8');

    exec('docker compose up -d || docker-compose up -d', { cwd: targetDir }, (err, stdout, stderr) => {
      if (err) {
        console.error(`Erreur déploiement stack (${cleanName}):`, stderr || err.message);
      }
    });

    res.json({
      success: true,
      message: `Déploiement de la stack "${cleanName}" lancé dans ${targetDir}`,
      dirPath: targetDir,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 12. Check for updates (CalVer 26.2)
app.get('/api/system/check-updates', (req, res) => {
  const currentVersion = APP_VERSION;
  const githubRepo = process.env.GITHUB_REPO || 'Julien0ff/App-docker';

  const options = {
    hostname: 'api.github.com',
    path: `/repos/${githubRepo}/releases/latest`,
    headers: { 'User-Agent': 'Dock-1-App' },
    timeout: 4000,
  };

  let responded = false;
  const sendOnce = (payload) => {
    if (responded) return;
    responded = true;
    res.json(payload);
  };

  const reqGit = https.get(options, (gitRes) => {
    let data = '';
    gitRes.on('data', (d) => (data += d));
    gitRes.on('end', () => {
      try {
        if (gitRes.statusCode === 200) {
          const rel = JSON.parse(data);
          const tag = rel.tag_name ? rel.tag_name.replace(/^v/, '') : currentVersion;
          const hasUpdate = tag !== currentVersion && !currentVersion.startsWith(tag);
          return sendOnce({
            success: true,
            currentVersion,
            latestVersion: tag,
            hasUpdate,
            releaseName: rel.name || tag,
            releaseUrl: rel.html_url || `https://github.com/${githubRepo}/releases`,
            publishedAt: rel.published_at,
            body: rel.body || '',
            assets: rel.assets || [],
          });
        }
      } catch (_) {}
      sendOnce({ success: true, currentVersion, latestVersion: currentVersion, hasUpdate: false });
    });
  });

  reqGit.on('error', () => {
    sendOnce({ success: true, currentVersion, latestVersion: currentVersion, hasUpdate: false });
  });
  reqGit.on('timeout', () => {
    reqGit.destroy();
    sendOnce({ success: true, currentVersion, latestVersion: currentVersion, hasUpdate: false });
  });
});

// Serve static build in production
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// Landing page route
const landingDir = path.join(__dirname, '..', 'landing');
const landingPath = path.join(landingDir, 'index.html');
app.use('/landing', express.static(landingDir));
app.get('/landing', (req, res) => {
  if (fs.existsSync(landingPath)) {
    return res.sendFile(landingPath);
  }
  res.redirect('/');
});
app.use('/landing-assets', express.static(landingDir));

// Fallback for SPA routing
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Endpoint non trouvé' });
  }
  const indexPath = path.join(distPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(200).send(`
        <!DOCTYPE html>
        <html>
          <head><title>Dock (1) Server</title></head>
          <body style="font-family:sans-serif;background:#0f0f11;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
            <div style="text-align:center;">
              <h1>Dock (1) Backend actif sur le port ${PORT}</h1>
              <p style="color:#888;">Le frontend Vite n'est pas encore compilé dans /dist.</p>
              <p>Lancez <code>npm run dev</code> pour le développement avec HMR ou <code>npm run build</code> pour la production.</p>
            </div>
          </body>
        </html>
      `);
    }
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n========================================`);
  console.log(`  Dock (1) API Server démarré !`);
  console.log(`  URL: http://localhost:${PORT}`);
  console.log(`  Docker socket: ${docker.DOCKER_SOCKET}`);
  console.log(`========================================\n`);
});

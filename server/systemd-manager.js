const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');

const SERVICE_NAME = 'dockdash.service';
const USER_SYSTEMD_DIR = path.join(os.homedir(), '.config', 'systemd', 'user');
const SERVICE_FILE_PATH = path.join(USER_SYSTEMD_DIR, SERVICE_NAME);
const APP_DIR = path.resolve(__dirname, '..');
const NODE_BIN = process.execPath; // Typically /usr/bin/node

function execPromise(cmd) {
  return new Promise((resolve) => {
    exec(cmd, (error, stdout, stderr) => {
      resolve({
        success: !error,
        code: error?.code || 0,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
      });
    });
  });
}

function getServiceTemplate() {
  return `[Unit]
Description=Dock (1) - Docker Manager Dashboard
Documentation=https://github.com
After=network.target docker.service
Wants=docker.service

[Service]
Type=simple
WorkingDirectory=${APP_DIR}
ExecStart=${NODE_BIN} "${path.join(APP_DIR, 'server', 'index.js')}"
Restart=always
RestartSec=5
Environment=NODE_ENV=production PORT=4500

[Install]
WantedBy=default.target
`;
}

async function getStatus() {
  const fileExists = fs.existsSync(SERVICE_FILE_PATH);

  const enabledRes = await execPromise(`systemctl --user is-enabled ${SERVICE_NAME}`);
  const isEnabled = enabledRes.stdout === 'enabled';

  const activeRes = await execPromise(`systemctl --user is-active ${SERVICE_NAME}`);
  const isActive = activeRes.stdout === 'active';

  // Check linger (allows user services to run on boot without login)
  const lingerRes = await execPromise(`loginctl show-user ${os.userInfo().username} --property=Linger`);
  const isLinger = lingerRes.stdout.includes('yes');

  return {
    serviceName: SERVICE_NAME,
    serviceFilePath: SERVICE_FILE_PATH,
    appDir: APP_DIR,
    nodeBin: NODE_BIN,
    fileExists,
    isEnabled,
    isActive,
    isLinger,
    statusText: isEnabled ? (isActive ? 'Actif au démarrage' : 'Activé (en attente)') : 'Désactivé',
  };
}

async function enableAutoStart() {
  try {
    // 1. Ensure directory exists
    if (!fs.existsSync(USER_SYSTEMD_DIR)) {
      fs.mkdirSync(USER_SYSTEMD_DIR, { recursive: true });
    }

    // 2. Write service file
    fs.writeFileSync(SERVICE_FILE_PATH, getServiceTemplate(), 'utf8');

    // 3. Reload systemd daemon
    await execPromise('systemctl --user daemon-reload');

    // 4. Enable service
    const enableRes = await execPromise(`systemctl --user enable ${SERVICE_NAME}`);
    if (!enableRes.success) {
      throw new Error(`Erreur lors de l'activation: ${enableRes.stderr || enableRes.stdout}`);
    }

    // 5. Try to enable linger so user services start at boot before interactive login
    const username = os.userInfo().username;
    await execPromise(`loginctl enable-linger ${username}`);

    return {
      success: true,
      message: 'Service systemd activé au démarrage de la machine avec succès !',
      status: await getStatus(),
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      status: await getStatus(),
    };
  }
}

async function disableAutoStart() {
  try {
    // 1. Stop service if running via systemd
    await execPromise(`systemctl --user stop ${SERVICE_NAME}`);

    // 2. Disable service
    await execPromise(`systemctl --user disable ${SERVICE_NAME}`);

    // 3. Optionally remove service file or leave it disabled
    if (fs.existsSync(SERVICE_FILE_PATH)) {
      fs.unlinkSync(SERVICE_FILE_PATH);
    }

    // 4. Reload daemon
    await execPromise('systemctl --user daemon-reload');

    return {
      success: true,
      message: 'Démarrage automatique désactivé avec succès.',
      status: await getStatus(),
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      status: await getStatus(),
    };
  }
}

module.exports = {
  getStatus,
  enableAutoStart,
  disableAutoStart,
  SERVICE_NAME,
  SERVICE_FILE_PATH,
};

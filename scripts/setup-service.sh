#!/usr/bin/env bash
set -e

echo "=========================================="
echo " Dock (1) - Configuration du démarrage auto"
echo "=========================================="

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVICE_DIR="$HOME/.config/systemd/user"
SERVICE_FILE="$SERVICE_DIR/dockdash.service"
NODE_BIN="$(which node)"

mkdir -p "$SERVICE_DIR"

cat <<EOF > "$SERVICE_FILE"
[Unit]
Description=Dock (1) - Docker Manager Dashboard
Documentation=https://github.com
After=network.target docker.service
Wants=docker.service

[Service]
Type=simple
WorkingDirectory=$APP_DIR
ExecStart=$NODE_BIN $APP_DIR/server/index.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production PORT=4500

[Install]
WantedBy=default.target
EOF

echo "✓ Fichier de service généré dans $SERVICE_FILE"

# Rechargement et activation
systemctl --user daemon-reload
systemctl --user enable dockdash.service
systemctl --user restart dockdash.service

# Activer le linger pour démarrer dès le boot de la machine
loginctl enable-linger "$USER" || true

echo "✓ Service dockdash.service activé et démarré !"
echo "✓ L'application sera accessible sur http://localhost:4500 à chaque démarrage."
echo "Statut actuel :"
systemctl --user status dockdash.service --no-pager || true

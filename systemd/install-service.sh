#!/bin/bash
set -e

SERVICE_NAME="stringlytyped-store"

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SERVICE_FILE="$SERVICE_NAME.service"

echo "Installing $SERVICE_NAME systemd service..."

sudo cp "$SCRIPT_DIR/$SERVICE_FILE" "/etc/systemd/system/"

echo "Reloading systemd daemon..."
sudo systemctl daemon-reload

echo "Enabling and starting $SERVICE_NAME service..."
sudo systemctl enable "$SERVICE_NAME"
sudo systemctl start "$SERVICE_NAME"

echo "Service installation complete. Status:"
sudo systemctl status "$SERVICE_NAME"

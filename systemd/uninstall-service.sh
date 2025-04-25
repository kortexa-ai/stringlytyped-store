#!/bin/bash
set -e

SERVICE_NAME="stringlytyped-store"

echo "Stopping $SERVICE_NAME service..."
sudo systemctl stop "$SERVICE_NAME" || true

echo "Disabling $SERVICE_NAME service..."
sudo systemctl disable "$SERVICE_NAME" || true

echo "Removing service file..."
sudo rm -f "/etc/systemd/system/$SERVICE_NAME.service"

echo "Reloading systemd daemon..."
sudo systemctl daemon-reload

echo "Service uninstallation complete."

#!/bin/bash
set -e

SERVICE_NAME="stringlytyped-store"

echo "Restarting $SERVICE_NAME service..."
sudo systemctl restart $SERVICE_NAME || { echo "$SERVICE_NAME restart failed"; exit 1; }

echo "Reloading Nginx..."
sudo systemctl reload nginx || { echo "Nginx reload failed"; exit 1; }

echo "------- Nginx Status -------"
sudo systemctl status nginx

echo "------- $SERVICE_NAME Status -------"
sudo systemctl status $SERVICE_NAME

echo "Done!"

#!/bin/bash
# Deploy script para TecnoSolution en el servidor
# Ejecutar como: bash deploy.sh
set -e

SERVER_DIR="/var/www/tecnosolution"
NGINX_DIR="/etc/nginx/sites-available"
NGINX_ENABLED="/etc/nginx/sites-enabled"

echo "=== [1/5] Git pull ==="
cd $SERVER_DIR
git pull origin main

echo "=== [2/5] Build del frontend ==="
cd $SERVER_DIR
npm ci --prefer-offline
npm run build -- --mode production

echo "=== [3/5] Copiar configs de Nginx ==="
sudo cp nginx/api.tecnosolution.com.ar.conf $NGINX_DIR/api.tecnosolution.com.ar
sudo cp nginx/tecnosolution.com.ar.conf $NGINX_DIR/tecnosolution.com.ar

# Activar sitios
sudo ln -sf $NGINX_DIR/api.tecnosolution.com.ar $NGINX_ENABLED/
sudo ln -sf $NGINX_DIR/tecnosolution.com.ar $NGINX_ENABLED/

echo "=== [4/5] Rebuild del backend ==="
cd $SERVER_DIR
docker compose up -d --build backend

echo "=== [5/5] Reload Nginx ==="
sudo nginx -t && sudo systemctl reload nginx

echo ""
echo "✓ Deploy completo!"
echo "  Frontend: http://tecnosolution.com.ar"
echo "  API:      http://api.tecnosolution.com.ar/api/health"
echo ""
echo "Cuando el DNS propague, corré:"
echo "  sudo certbot --nginx -d tecnosolution.com.ar -d www.tecnosolution.com.ar -d api.tecnosolution.com.ar"

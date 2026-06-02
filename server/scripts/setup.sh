#!/bin/bash
# ════════════════════════════════════════════════════════════════
#  RÚBRICA — Script de Setup del Servidor Ubuntu 22.04 LTS
#  Ejecutar COMO ROOT en el servidor limpio
#  
#  USO:
#    wget -O setup.sh https://raw.githubusercontent.com/.../setup.sh
#    chmod +x setup.sh && bash setup.sh
#
#  O copiar este archivo al servidor via SCP y ejecutarlo.
# ════════════════════════════════════════════════════════════════

set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'

info()    { echo -e "${BLUE}[INFO]${NC}    $1"; }
success() { echo -e "${GREEN}[OK]${NC}      $1"; }
warning() { echo -e "${YELLOW}[AVISO]${NC}   $1"; }
error()   { echo -e "${RED}[ERROR]${NC}   $1"; exit 1; }

# ─── Verificar que se ejecuta como root ─────────────────────────
[[ $EUID -ne 0 ]] && error "Este script debe ejecutarse como root. Usa: sudo bash setup.sh"

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║        RÚBRICA — Setup de Servidor Ubuntu        ║"
echo "║            rubrica.com.mx                        ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# ════════════════════════════════════════════════════════════════
# PASO 1: Actualización del sistema
# ════════════════════════════════════════════════════════════════
info "PASO 1/8: Actualizando el sistema..."
apt-get update -y
apt-get upgrade -y
apt-get autoremove -y
success "Sistema actualizado"

# ════════════════════════════════════════════════════════════════
# PASO 2: Herramientas base
# ════════════════════════════════════════════════════════════════
info "PASO 2/8: Instalando herramientas base..."
apt-get install -y \
    curl wget git vim htop net-tools \
    unzip zip tar \
    software-properties-common \
    ca-certificates gnupg lsb-release \
    ufw fail2ban \
    jq rsync \
    cron logrotate
success "Herramientas base instaladas"

# ════════════════════════════════════════════════════════════════
# PASO 3: Zona horaria
# ════════════════════════════════════════════════════════════════
info "PASO 3/8: Configurando zona horaria (America/Mexico_City)..."
timedatectl set-timezone America/Mexico_City
timedatectl status
success "Zona horaria: $(timedatectl | grep 'Time zone' | awk '{print $3}')"

# ════════════════════════════════════════════════════════════════
# PASO 4: Usuario 'rubrica' (sin privilegios root directos)
# ════════════════════════════════════════════════════════════════
info "PASO 4/8: Creando usuario 'rubrica'..."
if id "rubrica" &>/dev/null; then
    warning "Usuario 'rubrica' ya existe, continuando..."
else
    adduser --disabled-password --gecos "" rubrica
    usermod -aG sudo rubrica
    success "Usuario 'rubrica' creado"
fi

# Copiar llaves SSH del root al nuevo usuario
if [ -f /root/.ssh/authorized_keys ]; then
    mkdir -p /home/rubrica/.ssh
    cp /root/.ssh/authorized_keys /home/rubrica/.ssh/
    chown -R rubrica:rubrica /home/rubrica/.ssh
    chmod 700 /home/rubrica/.ssh
    chmod 600 /home/rubrica/.ssh/authorized_keys
    success "Llaves SSH copiadas al usuario 'rubrica'"
fi

# ════════════════════════════════════════════════════════════════
# PASO 5: Firewall UFW
# ════════════════════════════════════════════════════════════════
info "PASO 5/8: Configurando UFW (Firewall)..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh        # puerto 22
ufw allow http       # puerto 80
ufw allow https      # puerto 443
ufw --force enable
ufw status verbose
success "UFW activado"

# ════════════════════════════════════════════════════════════════
# PASO 6: Hardening SSH
# ════════════════════════════════════════════════════════════════
info "PASO 6/8: Hardening SSH..."
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak

# Solo modificar si ya no se aplicó
if grep -q "^PermitRootLogin no" /etc/ssh/sshd_config; then
    warning "SSH ya está configurado, omitiendo..."
else
    cat >> /etc/ssh/sshd_config << 'EOF'

# ─── Rúbrica Hardening ─────────────────────
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2
EOF
    systemctl restart ssh
    success "SSH hardening aplicado"
fi

# ════════════════════════════════════════════════════════════════
# PASO 7: Fail2ban
# ════════════════════════════════════════════════════════════════
info "PASO 7/8: Configurando Fail2ban..."
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime  = 3600
findtime = 600
maxretry = 5

[sshd]
enabled  = true
port     = ssh
maxretry = 3
bantime  = 86400

[nginx-http-auth]
enabled  = true

[nginx-limit-req]
enabled  = true
EOF
systemctl enable fail2ban
systemctl restart fail2ban
success "Fail2ban configurado"

# ════════════════════════════════════════════════════════════════
# PASO 8: Docker Engine
# ════════════════════════════════════════════════════════════════
info "PASO 8/8: Instalando Docker Engine..."

# Remover versiones viejas
apt-get remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true

# Agregar repositorio oficial de Docker
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
    gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
    https://download.docker.com/linux/ubuntu \
    $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
    tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update -y
apt-get install -y \
    docker-ce \
    docker-ce-cli \
    containerd.io \
    docker-buildx-plugin \
    docker-compose-plugin

# Agregar usuario 'rubrica' al grupo docker
usermod -aG docker rubrica

# Habilitar e iniciar Docker
systemctl enable docker
systemctl start docker

# Verificar
docker --version
docker compose version
success "Docker instalado"

# ════════════════════════════════════════════════════════════════
# BONUS: Nginx + Certbot
# ════════════════════════════════════════════════════════════════
info "BONUS: Instalando Nginx + Certbot..."
apt-get install -y nginx
apt-get install -y certbot python3-certbot-nginx
systemctl enable nginx
systemctl start nginx
success "Nginx instalado"

# ════════════════════════════════════════════════════════════════
# BONUS: Node.js 20 LTS (para PM2 y desarrollo)
# ════════════════════════════════════════════════════════════════
info "BONUS: Instalando Node.js 20 LTS..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
npm install -g pm2
success "Node.js $(node --version) + PM2 instalados"

# ════════════════════════════════════════════════════════════════
# Estructura de directorios del proyecto
# ════════════════════════════════════════════════════════════════
info "Creando estructura de directorios en /opt/rubrica/..."
mkdir -p /opt/rubrica/{postgres,redis,minio,docuseal,stirling,nginx,scripts,backups,logs}
mkdir -p /opt/rubrica/postgres/data
mkdir -p /opt/rubrica/docuseal/storage
mkdir -p /opt/rubrica/stirling/{configs,logs,customFiles,pipeline}
mkdir -p /opt/rubrica/minio/data
mkdir -p /opt/rubrica/redis/data
chown -R rubrica:rubrica /opt/rubrica
success "Directorios creados en /opt/rubrica/"

# ════════════════════════════════════════════════════════════════
# RESUMEN FINAL
# ════════════════════════════════════════════════════════════════
echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║           ✅  SETUP COMPLETADO                   ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
echo "📋 SIGUIENTES PASOS MANUALES:"
echo ""
echo "  1. Conectarte como usuario 'rubrica' (nunca más como root):"
echo "     ssh rubrica@$(hostname -I | awk '{print $1}')"
echo ""
echo "  2. Copiar archivos del proyecto al servidor:"
echo "     scp -r ./server/* rubrica@IP_SERVIDOR:/opt/rubrica/"
echo ""
echo "  3. Editar el archivo .env con tus credenciales reales:"
echo "     vim /opt/rubrica/.env"
echo ""
echo "  4. Apuntar DNS de rubrica.com.mx a este servidor:"
echo "     IP del servidor: $(hostname -I | awk '{print $1}')"
echo "     Registros A necesarios:"
echo "       app.rubrica.com.mx    → $(hostname -I | awk '{print $1}')"
echo "       api.rubrica.com.mx    → $(hostname -I | awk '{print $1}')"
echo "       admin.rubrica.com.mx  → $(hostname -I | awk '{print $1}')"
echo ""
echo "  5. Una vez propagados los DNS, obtener certificados SSL:"
echo "     sudo certbot --nginx -d app.rubrica.com.mx -d api.rubrica.com.mx -d admin.rubrica.com.mx"
echo ""
echo "  6. Levantar los servicios:"
echo "     cd /opt/rubrica && docker compose up -d"
echo ""
warning "⚠️  IMPORTANTE: SSH hardening activó PasswordAuthentication=no"
warning "   Asegúrate de tener tu llave SSH cargada ANTES de cerrar esta sesión."
echo ""

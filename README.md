# Rúbrica — Plataforma SaaS de Gestión Documental

**Dominio:** rubrica.com.mx

## Estructura del repositorio

```
/                          ← raíz del repo (clonar en /opt/rubrica/)
├── rubrica/
│   └── saas/             ← Frontend React (Velzon template)
└── server/               ← Todo lo del servidor
    ├── docker-compose.yml
    ├── .env.example
    ├── nginx/
    │   └── rubrica.conf
    ├── postgres/
    │   └── init.sql
    └── scripts/
        ├── setup.sh      ← Setup inicial Ubuntu 22.04
        └── backup.sh     ← Backup diario automático
```

## Stack

| Componente | Tecnología |
|---|---|
| Frontend | React 19 + Bootstrap 5.3 (Velzon) |
| API Gateway | Node.js + Express |
| Firma electrónica | DocuSeal (self-hosted) |
| Herramientas PDF | Stirling-PDF (self-hosted) |
| Base de datos | PostgreSQL 15 |
| Cache | Redis 7 |
| Almacenamiento | MinIO (S3-compatible) |
| NOM-151 | Microservicio Node.js + PSC (Mifiel) |
| Email | Brevo SMTP |
| Infraestructura | Ubuntu 22.04 LTS + Docker Compose |

---

## Setup en servidor Ubuntu 22.04 LTS

### Paso 1 — Clonar el repositorio

```bash
# Clonar siempre en /opt/rubrica (la raíz del repo = /opt/rubrica/)
git clone https://github.com/felipe1712/rubrica.git /opt/rubrica
chown -R rubrica:rubrica /opt/rubrica
```

### Paso 2 — Crear directorios de datos

```bash
mkdir -p /opt/rubrica/server/postgres/data
mkdir -p /opt/rubrica/server/redis/data
mkdir -p /opt/rubrica/server/minio/data
mkdir -p /opt/rubrica/server/docuseal/storage
mkdir -p /opt/rubrica/server/stirling/{configs,logs,customFiles,pipeline}
mkdir -p /opt/rubrica/server/backups
mkdir -p /opt/rubrica/server/logs
```

### Paso 3 — Configurar variables de entorno

```bash
cp /opt/rubrica/server/.env.example /opt/rubrica/server/.env

# Generar secrets seguros:
openssl rand -base64 32   # → POSTGRES_PASSWORD
openssl rand -base64 24   # → REDIS_PASSWORD
openssl rand -hex 64      # → DOCUSEAL_SECRET_KEY_BASE
openssl rand -base64 16   # → STIRLING_ADMIN_PASSWORD
openssl rand -hex 32      # → JWT_SECRET
openssl rand -hex 32      # → ADMIN_JWT_SECRET
openssl rand -hex 32      # → EDD_WEBHOOK_SECRET
openssl rand -base64 24   # → MINIO_ROOT_PASSWORD

nano /opt/rubrica/server/.env
chmod 600 /opt/rubrica/server/.env
```

### Paso 4 — Configurar Nginx

```bash
# Agregar config de Rúbrica (sin tocar configs existentes)
sudo cp /opt/rubrica/server/nginx/rubrica.conf /etc/nginx/sites-available/rubrica.conf
sudo ln -s /etc/nginx/sites-available/rubrica.conf /etc/nginx/sites-enabled/rubrica.conf
sudo nginx -t && sudo systemctl reload nginx
```

### Paso 5 — SSL con Certbot

```bash
# Requiere que los DNS ya apunten al servidor
sudo certbot --nginx \
  -d app.rubrica.com.mx \
  -d api.rubrica.com.mx \
  -d admin.rubrica.com.mx
```

### Paso 6 — Levantar los servicios

```bash
cd /opt/rubrica/server

# Verificar config antes de levantar
docker compose config

# Levantar en orden
docker compose up -d postgres redis minio
sleep 15
docker compose up -d docuseal stirling-pdf
docker compose up -d portainer uptime-kuma

# Verificar
docker compose ps
```

### Paso 7 — Configurar backup automático

```bash
chmod +x /opt/rubrica/server/scripts/backup.sh

# Agregar cron (2 AM todos los días)
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/rubrica/server/scripts/backup.sh >> /opt/rubrica/server/backups/backup.log 2>&1") | crontab -
```

---

## Actualizar el servidor (git pull)

```bash
cd /opt/rubrica
git pull origin main

# Si cambiaron archivos de server/:
cd /opt/rubrica/server
docker compose up -d --build   # rebuilds solo los contenedores modificados
```

## Subdominios

| URL | Servicio | Puerto interno |
|---|---|---|
| `app.rubrica.com.mx` | Dashboard del cliente (React) | 3001 |
| `api.rubrica.com.mx` | API Gateway | 4000 |
| `admin.rubrica.com.mx` | Panel de administración | 3001 |

> ⚠️ **Nunca subir `.env` al repo.** Usar `.env.example` como plantilla.

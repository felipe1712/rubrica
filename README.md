# Rúbrica — Plataforma SaaS de Gestión Documental

Plataforma multi-tenant para firma electrónica, herramientas PDF y cumplimiento NOM-151.

**Dominio:** [rubrica.com.mx](https://rubrica.com.mx)

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

## Estructura del Repositorio

```
rubrica/          ← Frontend (React — Velzon template)
  └── saas/       ← Variante principal (dashboard + admin panel)
server/           ← Configuración del servidor
  ├── docker-compose.yml
  ├── .env.example         ← Plantilla (NUNCA subir .env real)
  ├── nginx/rubrica.conf
  ├── postgres/init.sql    ← Schema de BD
  └── scripts/
      ├── setup.sh         ← Setup automático Ubuntu 22.04
      └── backup.sh        ← Backup diario
api-gateway/      ← [Por desarrollar] Node.js + Express
nom151-service/   ← [Por desarrollar] Microservicio NOM-151
```

## Setup del Servidor

```bash
# 1. Clonar el repositorio
git clone https://github.com/felipe1712/rubrica.git
cd rubrica

# 2. Ejecutar setup automático (como root en Ubuntu 22.04 limpio)
bash server/scripts/setup.sh

# 3. Configurar variables de entorno
cp server/.env.example server/.env
vim server/.env

# 4. Levantar servicios
cd /opt/rubrica
docker compose up -d
```

## Subdominios

| URL | Servicio |
|---|---|
| `app.rubrica.com.mx` | Dashboard del cliente |
| `api.rubrica.com.mx` | API Gateway |
| `admin.rubrica.com.mx` | Panel de administración |

---

> ⚠️ **Nunca subir el archivo `.env` al repositorio.** Usar `.env.example` como plantilla.

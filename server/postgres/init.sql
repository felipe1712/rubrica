-- ════════════════════════════════════════════════════════════════
-- RÚBRICA — Inicialización de PostgreSQL
-- Archivo: /opt/rubrica/postgres/init.sql
-- Se ejecuta automáticamente la primera vez que arranca PostgreSQL
-- ════════════════════════════════════════════════════════════════

-- Crear base de datos para DocuSeal (separada de la principal)
CREATE DATABASE docuseal_prod;

-- Dar permisos completos al usuario principal
GRANT ALL PRIVILEGES ON DATABASE rubrica_prod TO rubrica_user;
GRANT ALL PRIVILEGES ON DATABASE docuseal_prod TO rubrica_user;

-- Conectarse a rubrica_prod para crear extensiones
\c rubrica_prod

-- Extensión para UUIDs (usada por el API Gateway)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Extensión para búsqueda full-text en español
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- ─── TABLA: tenants ────────────────────────────────────────────
-- Cada tenant = un cliente de Rúbrica (empresa/organización)
CREATE TABLE IF NOT EXISTS tenants (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(255) NOT NULL,
    email           VARCHAR(255) NOT NULL UNIQUE,
    plan            VARCHAR(50)  NOT NULL DEFAULT 'esencial',
                                          -- esencial | profesional | empresarial
    status          VARCHAR(20)  NOT NULL DEFAULT 'active',
                                          -- active | suspended | expired | trial
    license_key     VARCHAR(255) UNIQUE,  -- Clave EDD
    edd_product_id  INTEGER,              -- ID producto en WP/EDD
    expires_at      TIMESTAMP WITH TIME ZONE,
    max_users       INTEGER NOT NULL DEFAULT 3,
    max_docs_month  INTEGER NOT NULL DEFAULT 30,  -- -1 = ilimitado
    max_storage_gb  INTEGER NOT NULL DEFAULT 5,
    docuseal_org_id VARCHAR(255),         -- ID organización en DocuSeal
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── TABLA: users ──────────────────────────────────────────────
-- Usuarios dentro de cada tenant
CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email           VARCHAR(255) NOT NULL,
    name            VARCHAR(255),
    role            VARCHAR(20)  NOT NULL DEFAULT 'member',
                                          -- owner | admin | member
    password_hash   VARCHAR(255) NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    last_login_at   TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, email)
);

-- ─── TABLA: super_admins ───────────────────────────────────────
-- Administradores de la plataforma (solo tú)
CREATE TABLE IF NOT EXISTS super_admins (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── TABLA: usage_stats ────────────────────────────────────────
-- Estadísticas de uso por tenant y mes
CREATE TABLE IF NOT EXISTS usage_stats (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    year_month      CHAR(7) NOT NULL,     -- formato: '2025-01'
    docs_signed     INTEGER NOT NULL DEFAULT 0,
    pdf_operations  INTEGER NOT NULL DEFAULT 0,
    nom151_stamps   INTEGER NOT NULL DEFAULT 0,
    storage_used_gb DECIMAL(10,3) NOT NULL DEFAULT 0,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, year_month)
);

-- ─── TABLA: edd_webhooks_log ───────────────────────────────────
-- Log de todos los webhooks recibidos de EDD
CREATE TABLE IF NOT EXISTS edd_webhooks_log (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type      VARCHAR(100) NOT NULL,
    license_key     VARCHAR(255),
    payload         JSONB,
    processed       BOOLEAN NOT NULL DEFAULT false,
    error_msg       TEXT,
    received_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── TABLA: nom151_records ─────────────────────────────────────
-- Registro de constancias NOM-151 emitidas
CREATE TABLE IF NOT EXISTS nom151_records (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    document_name   VARCHAR(500),
    docuseal_sub_id VARCHAR(255),         -- submission_id de DocuSeal
    pdf_hash_sha256 VARCHAR(64) NOT NULL,
    psc_token       TEXT,                 -- respuesta del PSC
    psc_timestamp   TIMESTAMP WITH TIME ZONE,
    psc_provider    VARCHAR(50),          -- mifiel | seguridata | ateb
    status          VARCHAR(20) NOT NULL DEFAULT 'pending',
                                          -- pending | stamped | failed
    error_msg       TEXT,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── TABLA: smtp_config ────────────────────────────────────────
-- Configuración SMTP editable desde el panel admin (Brevo)
CREATE TABLE IF NOT EXISTS smtp_config (
    id              INTEGER PRIMARY KEY DEFAULT 1,  -- Solo 1 fila
    host            VARCHAR(255) NOT NULL DEFAULT 'smtp-relay.brevo.com',
    port            INTEGER NOT NULL DEFAULT 587,
    username        VARCHAR(255),
    password        VARCHAR(255),
    from_email      VARCHAR(255) DEFAULT 'noreply@rubrica.com.mx',
    from_name       VARCHAR(255) DEFAULT 'Rúbrica',
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (id = 1)  -- Garantizar una sola fila
);

-- ─── TABLA: plan_config ────────────────────────────────────────
-- Configuración de planes editable desde el panel admin
CREATE TABLE IF NOT EXISTS plan_config (
    plan            VARCHAR(50) PRIMARY KEY,
    max_users       INTEGER NOT NULL,
    max_docs_month  INTEGER NOT NULL,  -- -1 = ilimitado
    max_storage_gb  INTEGER NOT NULL,
    has_api_access  BOOLEAN NOT NULL DEFAULT false,
    has_ocr         BOOLEAN NOT NULL DEFAULT false,
    has_bulk_send   BOOLEAN NOT NULL DEFAULT false,
    edd_product_id  INTEGER,
    price_usd_month DECIMAL(10,2),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar planes por defecto
INSERT INTO plan_config (plan, max_users, max_docs_month, max_storage_gb, has_api_access, has_ocr, has_bulk_send, price_usd_month) VALUES
    ('esencial',     3,  30, 5,   false, false, false, 29.00),
    ('profesional',  15, -1, 30,  true,  true,  false, 79.00),
    ('empresarial',  50, -1, 100, true,  true,  true,  199.00)
ON CONFLICT (plan) DO NOTHING;

-- Insertar config SMTP por defecto
INSERT INTO smtp_config (id, host, port, from_email, from_name)
VALUES (1, 'smtp-relay.brevo.com', 587, 'noreply@rubrica.com.mx', 'Rúbrica')
ON CONFLICT (id) DO NOTHING;

-- ─── ÍNDICES ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenants_license_key ON tenants(license_key);
CREATE INDEX IF NOT EXISTS idx_usage_stats_tenant ON usage_stats(tenant_id);
CREATE INDEX IF NOT EXISTS idx_nom151_tenant ON nom151_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_edd_log_license ON edd_webhooks_log(license_key);

-- ─── ROW LEVEL SECURITY (RLS) ──────────────────────────────────
-- Habilitar RLS en tablas críticas para aislamiento multi-tenant
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE nom151_records ENABLE ROW LEVEL SECURITY;

-- El API Gateway se conecta como rubrica_user y setea el tenant_id
-- en cada sesión: SET app.current_tenant_id = 'uuid-del-tenant';
CREATE POLICY tenant_isolation_users ON users
    USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);

CREATE POLICY tenant_isolation_usage ON usage_stats
    USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);

CREATE POLICY tenant_isolation_nom151 ON nom151_records
    USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);

-- ════════════════════════════════════════════════════════════════
-- Fin del script de inicialización
-- ════════════════════════════════════════════════════════════════

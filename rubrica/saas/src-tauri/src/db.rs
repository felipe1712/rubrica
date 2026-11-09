use rusqlite::{Connection, Result};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DocumentRecord {
    pub id: String,
    pub name: String,
    pub file_path: String,
    pub file_size_bytes: i64,
    pub page_count: i32,
    pub status: String,
    pub remote_envelope_id: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[allow(dead_code)]
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ContactRecord {
    pub id: String,
    pub name: String,
    pub email: String,
    pub phone: Option<String>,
    pub company: Option<String>,
}

pub struct DbState {
    pub conn: Mutex<Connection>,
    pub data_dir: PathBuf,
}

pub fn get_app_data_dir() -> PathBuf {
    let base_dir = dirs::data_dir().unwrap_or_else(|| PathBuf::from("."));
    let app_dir = base_dir.join("Rubrica");
    if !app_dir.exists() {
        let _ = fs::create_dir_all(&app_dir);
    }
    app_dir
}

pub fn init_database() -> Result<DbState> {
    let data_dir = get_app_data_dir();
    let storage_dir = data_dir.join("storage");
    if !storage_dir.exists() {
        let _ = fs::create_dir_all(&storage_dir);
    }

    let db_path = data_dir.join("rubrica.db");
    let conn = Connection::open(&db_path)?;

    // Configuración de optimización SQLite (WAL mode para alta concurrencia)
    conn.execute_batch("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;")?;

    // Crear tablas
    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS local_config (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS local_documents (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            file_path TEXT NOT NULL,
            file_size_bytes INTEGER NOT NULL,
            page_count INTEGER NOT NULL DEFAULT 1,
            status TEXT NOT NULL DEFAULT 'draft',
            remote_envelope_id TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS local_contacts (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT,
            company TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS local_templates (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            field_definitions_json TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS pdf_operations_history (
            id TEXT PRIMARY KEY,
            operation_type TEXT NOT NULL,
            input_files_json TEXT NOT NULL,
            output_file TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        ",
    )?;

    Ok(DbState {
        conn: Mutex::new(conn),
        data_dir,
    })
}

mod db;
mod pdf_tools;

use db::{init_database, DbState, DocumentRecord};
use pdf_tools::PdfMetadata;
use rusqlite::params;
use serde_json::json;
use tauri::State;
use uuid::Uuid;

#[tauri::command]
fn get_app_info(state: State<DbState>) -> Result<serde_json::Value, String> {
    Ok(json!({
        "app_name": "Rúbrica Desktop",
        "version": "1.0.0",
        "data_dir": state.data_dir.to_string_lossy().to_string(),
        "storage_dir": state.data_dir.join("storage").to_string_lossy().to_string()
    }))
}

// ─── COMANDOS DE BASE DE DATOS LOCAL (SQLite) ───────────────────

#[tauri::command]
fn get_documents(state: State<DbState>) -> Result<Vec<DocumentRecord>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, name, file_path, file_size_bytes, page_count, status, remote_envelope_id, created_at, updated_at FROM local_documents ORDER BY updated_at DESC")
        .map_err(|e| e.to_string())?;

    let doc_iter = stmt
        .query_map([], |row| {
            Ok(DocumentRecord {
                id: row.get(0)?,
                name: row.get(1)?,
                file_path: row.get(2)?,
                file_size_bytes: row.get(3)?,
                page_count: row.get(4)?,
                status: row.get(5)?,
                remote_envelope_id: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut docs = Vec::new();
    for doc in doc_iter {
        docs.push(doc.map_err(|e| e.to_string())?);
    }
    Ok(docs)
}

#[tauri::command]
fn save_document(
    state: State<DbState>,
    name: String,
    file_path: String,
    file_size_bytes: i64,
    page_count: i32,
    status: Option<String>,
) -> Result<DocumentRecord, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    let id = Uuid::new_v4().to_string();
    let doc_status = status.unwrap_or_else(|| "draft".to_string());

    conn.execute(
        "INSERT INTO local_documents (id, name, file_path, file_size_bytes, page_count, status) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![id, name, file_path, file_size_bytes, page_count, doc_status],
    ).map_err(|e| e.to_string())?;

    Ok(DocumentRecord {
        id,
        name,
        file_path,
        file_size_bytes,
        page_count,
        status: doc_status,
        remote_envelope_id: None,
        created_at: chrono::Utc::now().to_rfc3339(),
        updated_at: chrono::Utc::now().to_rfc3339(),
    })
}

#[tauri::command]
fn delete_document(state: State<DbState>, id: String) -> Result<bool, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM local_documents WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(true)
}

#[tauri::command]
fn get_config(state: State<DbState>, key: String) -> Result<Option<String>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT value FROM local_config WHERE key = ?1")
        .map_err(|e| e.to_string())?;
    let mut rows = stmt.query(params![key]).map_err(|e| e.to_string())?;

    if let Some(row) = rows.next().map_err(|e| e.to_string())? {
        let val: String = row.get(0).map_err(|e| e.to_string())?;
        Ok(Some(val))
    } else {
        Ok(None)
    }
}

#[tauri::command]
fn set_config(state: State<DbState>, key: String, value: String) -> Result<bool, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO local_config (key, value) VALUES (?1, ?2) ON CONFLICT(key) DO UPDATE SET value = ?2",
        params![key, value],
    ).map_err(|e| e.to_string())?;
    Ok(true)
}

// ─── COMANDOS DE HERRAMIENTAS PDF NATIVAS (Taller PDF) ────────────

#[tauri::command]
fn pdf_get_info(file_path: String) -> Result<PdfMetadata, String> {
    pdf_tools::get_info(&file_path)
}

#[tauri::command]
fn pdf_merge(file_paths: Vec<String>, output_path: String) -> Result<String, String> {
    pdf_tools::merge_documents(&file_paths, &output_path)
}

#[tauri::command]
fn pdf_rotate(file_path: String, pages: Vec<u32>, angle: i64, output_path: String) -> Result<String, String> {
    pdf_tools::rotate_pages(&file_path, &pages, angle, &output_path)
}

#[tauri::command]
fn pdf_delete_pages(file_path: String, pages: Vec<u32>, output_path: String) -> Result<String, String> {
    pdf_tools::delete_pages(&file_path, &pages, &output_path)
}

#[tauri::command]
fn pdf_extract_pages(file_path: String, pages: Vec<u32>, output_path: String) -> Result<String, String> {
    pdf_tools::extract_pages(&file_path, &pages, &output_path)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let db_state = init_database().expect("Fallo al inicializar base de datos SQLite");

    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(db_state)
        .invoke_handler(tauri::generate_handler![
            get_app_info,
            get_documents,
            save_document,
            delete_document,
            get_config,
            set_config,
            pdf_get_info,
            pdf_merge,
            pdf_rotate,
            pdf_delete_pages,
            pdf_extract_pages
        ])
        .run(tauri::generate_context!())
        .expect("Error al ejecutar la aplicación Rúbrica");
}

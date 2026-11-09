use lopdf::{Document, Object, ObjectId};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

#[derive(Debug, Serialize, Deserialize)]
pub struct PdfMetadata {
    pub page_count: usize,
    pub title: Option<String>,
    pub author: Option<String>,
    pub subject: Option<String>,
    pub producer: Option<String>,
    pub file_size_bytes: u64,
}

/// Obtiene metadatos e información básica de un PDF
pub fn get_info(file_path: &str) -> Result<PdfMetadata, String> {
    let path = Path::new(file_path);
    if !path.exists() {
        return Err(format!("El archivo no existe: {}", file_path));
    }

    let file_size_bytes = fs::metadata(path)
        .map_err(|e| format!("Error al leer metadatos del archivo: {}", e))?
        .len();

    let doc = Document::load(file_path)
        .map_err(|e| format!("Error al abrir PDF: {}", e))?;

    let page_count = doc.get_pages().len();

    let mut title = None;
    let mut author = None;
    let mut subject = None;
    let mut producer = None;

    if let Ok(info_dict) = doc.get_object(doc.trailer.get(b"Info").and_then(|o| o.as_reference()).unwrap_or((0, 0))) {
        if let Ok(dict) = info_dict.as_dict() {
            if let Ok(t) = dict.get(b"Title").and_then(|o| o.as_str()) {
                title = Some(String::from_utf8_lossy(t).to_string());
            }
            if let Ok(a) = dict.get(b"Author").and_then(|o| o.as_str()) {
                author = Some(String::from_utf8_lossy(a).to_string());
            }
            if let Ok(s) = dict.get(b"Subject").and_then(|o| o.as_str()) {
                subject = Some(String::from_utf8_lossy(s).to_string());
            }
            if let Ok(p) = dict.get(b"Producer").and_then(|o| o.as_str()) {
                producer = Some(String::from_utf8_lossy(p).to_string());
            }
        }
    }

    Ok(PdfMetadata {
        page_count,
        title,
        author,
        subject,
        producer,
        file_size_bytes,
    })
}

/// Rota páginas especificadas (en incrementos de 90 grados)
pub fn rotate_pages(file_path: &str, pages: &[u32], angle: i64, output_path: &str) -> Result<String, String> {
    let mut doc = Document::load(file_path)
        .map_err(|e| format!("Error al abrir PDF: {}", e))?;

    let all_pages = doc.get_pages();
    for (page_num, object_id) in all_pages {
        if pages.is_empty() || pages.contains(&page_num) {
            if let Ok(page) = doc.get_object_mut(object_id) {
                if let Ok(dict) = page.as_dict_mut() {
                    let current_rot = dict.get(b"Rotate")
                        .and_then(|r| r.as_i64())
                        .unwrap_or(0);
                    let new_rot = (current_rot + angle).rem_euclid(360);
                    dict.set("Rotate", Object::Integer(new_rot));
                }
            }
        }
    }

    doc.save(output_path)
        .map_err(|e| format!("Error al guardar PDF rotado: {}", e))?;

    Ok(output_path.to_string())
}

/// Elimina páginas de un PDF y guarda el resultado
pub fn delete_pages(file_path: &str, pages_to_delete: &[u32], output_path: &str) -> Result<String, String> {
    let mut doc = Document::load(file_path)
        .map_err(|e| format!("Error al abrir PDF: {}", e))?;

    doc.delete_pages(pages_to_delete);

    doc.save(output_path)
        .map_err(|e| format!("Error al guardar PDF: {}", e))?;

    Ok(output_path.to_string())
}

/// Extrae páginas seleccionadas hacia un nuevo documento PDF
pub fn extract_pages(file_path: &str, pages_to_keep: &[u32], output_path: &str) -> Result<String, String> {
    let doc = Document::load(file_path)
        .map_err(|e| format!("Error al abrir PDF: {}", e))?;

    let total_pages = doc.get_pages().len() as u32;
    let mut to_delete = Vec::new();

    for p in 1..=total_pages {
        if !pages_to_keep.contains(&p) {
            to_delete.push(p);
        }
    }

    let mut new_doc = doc;
    new_doc.delete_pages(&to_delete);

    new_doc.save(output_path)
        .map_err(|e| format!("Error al guardar páginas extraídas: {}", e))?;

    Ok(output_path.to_string())
}

/// Une múltiples PDFs en un único archivo consolidado
pub fn merge_documents(file_paths: &[String], output_path: &str) -> Result<String, String> {
    if file_paths.is_empty() {
        return Err("No se especificaron documentos para unir.".to_string());
    }

    let mut max_id = 1;
    let mut documents = Vec::new();

    for path in file_paths {
        let mut doc = Document::load(path)
            .map_err(|e| format!("Error al cargar '{}': {}", path, e))?;
        doc.renumber_objects_with(max_id);
        max_id = doc.max_id + 1;
        documents.push(doc);
    }

    if documents.is_empty() {
        return Err("No fue posible cargar documentos válidos.".to_string());
    }

    let mut target = Document::with_version("1.7");
    let mut pages_list = Vec::new();

    for doc in documents {
        for (_page_num, page_id) in doc.get_pages() {
            pages_list.push(page_id);
        }
        for (id, object) in doc.objects {
            target.objects.insert(id, object);
        }
    }

    // Crear catálogo de páginas Pages
    let pages_id = target.new_object_id();
    let count = pages_list.len() as i64;
    let kids: Vec<Object> = pages_list.into_iter().map(Object::Reference).collect();

    let mut pages_dict = lopdf::Dictionary::new();
    pages_dict.set("Type", Object::Name(b"Pages".to_vec()));
    pages_dict.set("Count", Object::Integer(count));
    pages_dict.set("Kids", Object::Array(kids));

    for &page_ref in &pages_list_clone(&target, pages_id) {
        if let Ok(page) = target.get_object_mut(page_ref) {
            if let Ok(dict) = page.as_dict_mut() {
                dict.set("Parent", Object::Reference(pages_id));
            }
        }
    }

    target.objects.insert(pages_id, Object::Dictionary(pages_dict));

    // Crear Catálogo raíz
    let catalog_id = target.new_object_id();
    let mut catalog_dict = lopdf::Dictionary::new();
    catalog_dict.set("Type", Object::Name(b"Catalog".to_vec()));
    catalog_dict.set("Pages", Object::Reference(pages_id));
    target.objects.insert(catalog_id, Object::Dictionary(catalog_dict));

    target.trailer.set("Root", Object::Reference(catalog_id));
    target.prune_objects();

    target.save(output_path)
        .map_err(|e| format!("Error al guardar PDF consolidado: {}", e))?;

    Ok(output_path.to_string())
}

fn pages_list_clone(target: &Document, pages_id: ObjectId) -> Vec<ObjectId> {
    if let Ok(obj) = target.get_object(pages_id) {
        if let Ok(dict) = obj.as_dict() {
            if let Ok(kids) = dict.get(b"Kids").and_then(|k| k.as_array()) {
                return kids.iter().filter_map(|k| k.as_reference().ok()).collect();
            }
        }
    }
    Vec::new()
}

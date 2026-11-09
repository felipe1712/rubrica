/**
 * Rúbrica Desktop Bridge
 * Abstracción para comunicación entre el Frontend React y:
 * 1) Núcleo nativo Tauri / Rust / SQLite (local)
 * 2) Backend Cloud Transaccional (Saldo prepago y despacho de firmas con tu URL)
 */

import axios from "axios";
import { api } from "../config";

const CLOUD_API_BASE = api?.API_URL || "https://api.rubricalo.com";

// Verifica si la aplicación se está ejecutando dentro del entorno nativo de Tauri
export const isDesktopApp = () => {
  return typeof window !== "undefined" && Boolean(window.__TAURI_INTERNALS__);
};

/**
 * Invoca un comando nativo en Rust de forma segura.
 */
export const invokeNative = async (command, args = {}) => {
  if (isDesktopApp()) {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      return await invoke(command, args);
    } catch (err) {
      console.error(`[Tauri IPC Error] ${command}:`, err);
      throw err;
    }
  }

  console.warn(`[Desktop Bridge] Modo Web: Comando '${command}' no disponible en navegador.`);
  return null;
};

// ─── MÉTODOS DE BASE DE DATOS LOCAL (SQLite) ──────────────────────

export const getLocalAppInfo = async () => {
  return await invokeNative("get_app_info");
};

export const getLocalDocuments = async () => {
  return (await invokeNative("get_documents")) || [];
};

export const saveLocalDocument = async ({ name, filePath, fileSizeBytes, pageCount = 1, status = "draft" }) => {
  return await invokeNative("save_document", {
    name,
    filePath,
    fileSizeBytes,
    pageCount,
    status,
  });
};

export const deleteLocalDocument = async (id) => {
  return await invokeNative("delete_document", { id });
};

export const getLocalConfig = async (key) => {
  return await invokeNative("get_config", { key });
};

export const setLocalConfig = async (key, value) => {
  return await invokeNative("set_config", { key, value });
};

// ─── TALLER PDF NATIVO (Reemplazo local de Stirling-PDF) ──────────

export const pdfGetInfo = async (filePath) => {
  return await invokeNative("pdf_get_info", { filePath });
};

export const pdfMerge = async (filePaths, outputPath) => {
  return await invokeNative("pdf_merge", { filePaths, outputPath });
};

export const pdfRotate = async (filePath, pages = [], angle = 90, outputPath) => {
  return await invokeNative("pdf_rotate", { filePath, pages, angle, outputPath });
};

export const pdfDeletePages = async (filePath, pages = [], outputPath) => {
  return await invokeNative("pdf_delete_pages", { filePath, pages, outputPath });
};

export const pdfExtractPages = async (filePath, pages = [], outputPath) => {
  return await invokeNative("pdf_extract_pages", { filePath, pages, outputPath });
};

// ─── NUBE TRANSACCIONAL: SALDO Y DESPACHO DE FIRMAS ───────────────

const getAuthToken = async () => {
  if (isDesktopApp()) {
    const localToken = await getLocalConfig("auth_token");
    if (localToken) return localToken;
  }
  try {
    const raw = sessionStorage.getItem("authUser") || localStorage.getItem("authUser");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.token || parsed?.accessToken || null;
  } catch (e) {
    return null;
  }
};

/**
 * Consulta el saldo de firmas disponibles en la nube y datos del tenant
 */
export const fetchCloudBalance = async () => {
  const token = await getAuthToken();
  const res = await axios.get(`${CLOUD_API_BASE}/desktop/balance`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });

  const data = res.data;
  // Guardar en caché local para acceso offline
  if (isDesktopApp() && data?.creditsAvailable !== undefined) {
    await setLocalConfig("cached_credits", String(data.creditsAvailable));
  }

  return data;
};

/**
 * Despacha un documento a firmar a la nube:
 * - Descuenta 1 crédito atómicamente
 * - Genera URLs de firma únicas bajo https://firmar.rubrica.com.mx/s/:token
 * - Notifica a los firmantes por correo
 */
export const dispatchCloudEnvelope = async ({ title, pdfFile, signers }) => {
  const token = await getAuthToken();
  const formData = new FormData();
  formData.append("title", title);
  formData.append("file", pdfFile);
  formData.append("signers", JSON.stringify(signers));

  const res = await axios.post(`${CLOUD_API_BASE}/desktop/envelopes/dispatch`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });

  return res.data;
};

/**
 * Consulta el estado en tiempo real de los firmantes de un sobre
 */
export const checkEnvelopeStatus = async (documentId) => {
  const token = await getAuthToken();
  const res = await axios.get(`${CLOUD_API_BASE}/desktop/envelopes/${documentId}/status`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  return res.data;
};

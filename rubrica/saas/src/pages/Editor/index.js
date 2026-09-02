import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Spinner, Alert, Button } from "reactstrap";

const API_URL = process.env.REACT_APP_API_URL || "https://api.rubricalo.com";
const DOCS_URL = process.env.REACT_APP_DOCS_URL || "https://docs.rubricalo.com";

const Editor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const editorRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [docName, setDocName] = useState("Documento");
  const scriptLoaded = useRef(false);

  const getToken = () => {
    const raw = sessionStorage.getItem("authUser") || localStorage.getItem("authUser");
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return parsed.token || parsed.accessToken || null;
    } catch (e) {
      return null;
    }
  };

  useEffect(() => {
    document.title = `Editor | Rubrícalo`;

    const initEditor = async () => {
      try {
        // 1. Obtener la configuración del editor desde el API
        const res = await fetch(`${API_URL}/editor/${id}/editor-config`, {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        if (!res.ok) throw new Error("No se pudo cargar la configuración del editor.");
        const { config } = await res.json();
        setDocName(config.document.title);
        document.title = `${config.document.title} | Rubrícalo`;

        // 2. Cargar el script de OnlyOffice si no está cargado
        if (!scriptLoaded.current && !window.DocsAPI) {
          await new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = `${DOCS_URL}/web-apps/apps/api/documents/api.js`;
            script.onload = resolve;
            script.onerror = () => reject(new Error("No se pudo cargar OnlyOffice. Verifica que docs.rubricalo.com esté disponible."));
            document.head.appendChild(script);
          });
          scriptLoaded.current = true;
        }

        // 3. Inicializar el editor
        if (editorRef.current && window.DocsAPI) {
          new window.DocsAPI.DocEditor("onlyoffice-editor", {
            ...config,
            height: "100%",
            width: "100%",
            events: {
              onDocumentReady: () => setLoading(false),
              onError: (event) => {
                console.error("OnlyOffice error:", event.data);
                setError("Error al cargar el documento en el editor.");
                setLoading(false);
              }
            }
          });
        }
      } catch (e) {
        setError(e.message);
        setLoading(false);
      }
    };

    initEditor();

    // Cleanup: destruir el editor al desmontar
    return () => {
      if (window.DocsAPI && window.DocsAPI.DocEditor) {
        try {
          const editor = window.Asc?.editor;
          if (editor) editor.destroyEditor();
        } catch (_) {}
      }
    };
  }, [id]);

  if (error) {
    return (
      <div className="page-content" style={{ paddingTop: "140px" }}>
        <Container fluid>
          <Alert color="danger" className="mt-4">
            <i className="ri-error-warning-line me-2"></i>{error}
          </Alert>
          <Button color="secondary" size="sm" onClick={() => navigate(`/documentos/${id}`)}>
            ← Volver al documento
          </Button>
        </Container>
      </div>
    );
  }

  return (
    <div className="page-content" style={{ paddingTop: "140px", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Barra superior del documento */}
      <div
        style={{
          background: "#1e293b",
          color: "#fff",
          padding: "10px 20px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexShrink: 0,
          borderRadius: "8px 8px 0 0",
          zIndex: 10
        }}
      >
        <button
          onClick={() => navigate(`/documentos/${id}`)}
          style={{
            background: "#3d4ed8",
            border: "none",
            color: "#fff",
            borderRadius: 6,
            padding: "5px 14px",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600
          }}
        >
          ← Volver
        </button>
        <span style={{ fontSize: 14, fontWeight: 600 }}>
          <i className="ri-file-word-line me-1"></i>
          {docName}
        </span>
        {loading && (
          <Spinner size="sm" color="light" className="ms-auto" />
        )}
      </div>

      {/* Contenedor del editor OnlyOffice con espacio superior adecuado */}
      <div style={{ position: "relative", flex: 1, minHeight: "calc(100vh - 210px)", marginTop: "0" }}>
        {loading && (
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%,-50%)", textAlign: "center", zIndex: 5
          }}>
            <Spinner color="primary" style={{ width: 48, height: 48 }} />
            <p className="mt-3 text-muted">Cargando editor...</p>
          </div>
        )}
        <div
          id="onlyoffice-editor"
          ref={editorRef}
          style={{ width: "100%", height: "100%", minHeight: "calc(100vh - 210px)", borderRadius: "0 0 8px 8px", overflow: "hidden" }}
        />
      </div>
    </div>
  );
};

export default Editor;

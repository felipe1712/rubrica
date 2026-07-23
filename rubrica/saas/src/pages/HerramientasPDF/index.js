import React, { useState } from "react";
import { Container, Row, Col, Card, CardBody, Nav, NavItem, NavLink, Badge } from "reactstrap";
import BreadCrumb from "../../Components/Common/BreadCrumb";

const PDF_URL = process.env.REACT_APP_PDF_URL || "https://pdf.rubricalo.com";

const HERRAMIENTAS = [
  {
    categoria: "Organizar",
    icono: "ri-pages-line",
    color: "primary",
    items: [
      { label: "Fusionar PDFs",     path: "/merge-pdfs",   icon: "ri-git-merge-line",    desc: "Combina varios PDFs en uno" },
      { label: "Dividir PDF",       path: "/split-pdfs",   icon: "ri-scissors-line",      desc: "Divide un PDF en partes" },
      { label: "Rotar páginas",     path: "/rotate-pdf",   icon: "ri-refresh-line",       desc: "Rota páginas individuales" },
      { label: "Eliminar páginas",  path: "/remove-pages", icon: "ri-delete-bin-line",    desc: "Borra páginas específicas" },
      { label: "Extraer páginas",   path: "/extract-page", icon: "ri-file-copy-line",     desc: "Extrae páginas seleccionadas" },
      { label: "Ordenar páginas",   path: "/pdf-organizer",icon: "ri-drag-move-2-line",   desc: "Reordena páginas con drag & drop" },
    ]
  },
  {
    categoria: "Convertir",
    icono: "ri-exchange-line",
    color: "success",
    items: [
      { label: "PDF a Word",        path: "/pdf-to-word",  icon: "ri-file-word-line",     desc: "Convierte PDF a DOCX" },
      { label: "PDF a imagen",      path: "/pdf-to-img",   icon: "ri-image-line",          desc: "Exporta páginas como JPG/PNG" },
      { label: "PDF a HTML",        path: "/pdf-to-html",  icon: "ri-code-line",           desc: "Convierte a HTML" },
      { label: "Imagen a PDF",      path: "/img-to-pdf",   icon: "ri-image-2-line",        desc: "Convierte imágenes a PDF" },
      { label: "HTML a PDF",        path: "/html-to-pdf",  icon: "ri-file-pdf-line",       desc: "Convierte HTML a PDF" },
      { label: "Markdown a PDF",    path: "/markdown-to-pdf",icon: "ri-markdown-line",    desc: "Convierte Markdown a PDF" },
    ]
  },
  {
    categoria: "Optimizar",
    icono: "ri-settings-3-line",
    color: "warning",
    items: [
      { label: "Comprimir PDF",     path: "/compress-pdf", icon: "ri-compress-h-line",    desc: "Reduce el tamaño del archivo" },
      { label: "OCR (reconocer texto)", path: "/ocr-pdf",  icon: "ri-scan-line",          desc: "Extrae texto de imágenes escaneadas" },
      { label: "Reparar PDF",       path: "/repair",       icon: "ri-tools-line",          desc: "Repara PDFs corruptos" },
      { label: "Añadir número de páginas", path: "/add-page-numbers", icon: "ri-list-ordered", desc: "Numera las páginas" },
      { label: "Añadir marca de agua", path: "/add-watermark", icon: "ri-drop-line",      desc: "Inserta una marca de agua" },
    ]
  },
  {
    categoria: "Seguridad",
    icono: "ri-shield-line",
    color: "danger",
    items: [
      { label: "Proteger con contraseña", path: "/add-password", icon: "ri-lock-line",   desc: "Cifra el PDF con contraseña" },
      { label: "Quitar contraseña", path: "/remove-password", icon: "ri-lock-unlock-line",desc: "Desprotege el PDF" },
      { label: "Redactar contenido", path: "/sanitize-pdf", icon: "ri-eye-off-line",      desc: "Elimina metadatos ocultos" },
      { label: "Certificar PDF",    path: "/sign",          icon: "ri-award-line",         desc: "Añade firma digital" },
    ]
  },
];

const HerramientasPDF = () => {
  document.title = "Herramientas PDF | Rubricalo";
  const [activeFrame, setActiveFrame] = useState(null);
  const [frameLoading, setFrameLoading] = useState(false);

  const openTool = (path) => {
    setFrameLoading(true);
    setActiveFrame(`${PDF_URL}${path}`);
  };

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="Herramientas PDF" pageTitle="Rubricalo" />

          {!activeFrame ? (
            /* ── Grid de herramientas ── */
            <Row>
              {HERRAMIENTAS.map((cat) => (
                <Col xl={6} key={cat.categoria} className="mb-4">
                  <Card className="h-100">
                    <div className={`card-header bg-${cat.color} bg-opacity-10 d-flex align-items-center gap-2`}>
                      <i className={`${cat.icono} text-${cat.color} fs-5`}></i>
                      <h5 className={`mb-0 text-${cat.color}`}>{cat.categoria}</h5>
                    </div>
                    <CardBody className="p-0">
                      <div className="list-group list-group-flush">
                        {cat.items.map((tool) => (
                          <button
                            key={tool.path}
                            className="list-group-item list-group-item-action d-flex align-items-center gap-3 px-4 py-3 border-0"
                            onClick={() => openTool(tool.path)}
                            style={{ cursor: "pointer" }}
                          >
                            <span className={`avatar-sm rounded bg-${cat.color}-subtle flex-shrink-0`}
                              style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36 }}>
                              <i className={`${tool.icon} text-${cat.color} fs-5`}></i>
                            </span>
                            <div className="text-start">
                              <p className="mb-0 fw-medium">{tool.label}</p>
                              <small className="text-muted">{tool.desc}</small>
                            </div>
                            <i className="ri-arrow-right-s-line ms-auto text-muted"></i>
                          </button>
                        ))}
                      </div>
                    </CardBody>
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            /* ── Vista iframe de la herramienta ── */
            <Row>
              <Col lg={12}>
                <Card>
                  <div className="card-header d-flex align-items-center gap-2">
                    <button
                      className="btn btn-sm btn-light"
                      onClick={() => setActiveFrame(null)}
                    >
                      <i className="ri-arrow-left-line me-1"></i> Volver
                    </button>
                    <span className="text-muted ms-2 small">{activeFrame}</span>
                    <a
                      href={activeFrame}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-outline-secondary ms-auto"
                    >
                      <i className="ri-external-link-line me-1"></i> Abrir en nueva pestaña
                    </a>
                  </div>
                  <CardBody className="p-0 position-relative">
                    {frameLoading && (
                      <div className="position-absolute top-50 start-50 translate-middle text-center" style={{ zIndex: 10 }}>
                        <div className="spinner-border text-primary" role="status"></div>
                        <p className="mt-2 text-muted small">Cargando herramienta...</p>
                      </div>
                    )}
                    <iframe
                      src={activeFrame}
                      title="Herramienta PDF"
                      style={{ width: "100%", height: "calc(100vh - 220px)", border: "none", minHeight: 600 }}
                      onLoad={() => setFrameLoading(false)}
                      allow="fullscreen"
                    />
                  </CardBody>
                </Card>
              </Col>
            </Row>
          )}
        </Container>
      </div>
    </React.Fragment>
  );
};

export default HerramientasPDF;

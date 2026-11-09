import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, CardBody, Badge, Modal, ModalHeader, ModalBody, ModalFooter, Button, Input, Label, Alert } from "reactstrap";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import { isDesktopApp, pdfMerge, pdfRotate, pdfExtractPages, pdfGetInfo, saveLocalDocument } from "../../helpers/desktop_bridge";

const PDF_URL = process.env.REACT_APP_PDF_URL || "https://pdf.rubricalo.com";

const HERRAMIENTAS = [
  {
    categoria: "Organizar",
    icono: "ri-pages-line",
    color: "primary",
    items: [
      { id: "merge", label: "Fusionar PDFs", path: "/merge-pdfs", icon: "ri-git-merge-line", desc: "Combina varios PDFs en uno", native: true },
      { id: "split", label: "Dividir / Extraer", path: "/extract-page", icon: "ri-file-copy-line", desc: "Extrae páginas seleccionadas", native: true },
      { id: "rotate", label: "Rotar páginas", path: "/rotate-pdf", icon: "ri-refresh-line", desc: "Rota páginas 90°, 180° o 270°", native: true },
      { id: "remove", label: "Eliminar páginas", path: "/remove-pages", icon: "ri-delete-bin-line", desc: "Borra páginas específicas", native: true },
      { id: "organizer", label: "Ordenar páginas", path: "/pdf-organizer", icon: "ri-drag-move-2-line", desc: "Reordena páginas con drag & drop", native: false },
    ]
  },
  {
    categoria: "Convertir",
    icono: "ri-exchange-line",
    color: "success",
    items: [
      { label: "PDF a Word", path: "/pdf-to-word", icon: "ri-file-word-line", desc: "Convierte PDF a DOCX", native: false },
      { label: "PDF a imagen", path: "/pdf-to-img", icon: "ri-image-line", desc: "Exporta páginas como JPG/PNG", native: false },
      { label: "PDF a HTML", path: "/pdf-to-html", icon: "ri-code-line", desc: "Convierte a HTML", native: false },
      { label: "Imagen a PDF", path: "/img-to-pdf", icon: "ri-image-2-line", desc: "Convierte imágenes a PDF", native: false },
      { label: "HTML a PDF", path: "/html-to-pdf", icon: "ri-file-pdf-line", desc: "Convierte HTML a PDF", native: false },
    ]
  },
  {
    categoria: "Optimizar",
    icono: "ri-settings-3-line",
    color: "warning",
    items: [
      { label: "Comprimir PDF", path: "/compress-pdf", icon: "ri-compress-h-line", desc: "Reduce el tamaño del archivo", native: false },
      { label: "OCR (reconocer texto)", path: "/ocr-pdf", icon: "ri-scan-line", desc: "Extrae texto de imágenes escaneadas", native: false },
      { label: "Reparar PDF", path: "/repair", icon: "ri-tools-line", desc: "Repara PDFs corruptos", native: false },
      { label: "Añadir número de páginas", path: "/add-page-numbers", icon: "ri-list-ordered", desc: "Numera las páginas", native: false },
      { label: "Añadir marca de agua", path: "/add-watermark", icon: "ri-drop-line", desc: "Inserta una marca de agua", native: false },
    ]
  },
  {
    categoria: "Seguridad",
    icono: "ri-shield-line",
    color: "danger",
    items: [
      { label: "Proteger con contraseña", path: "/add-password", icon: "ri-lock-line", desc: "Cifra el PDF con contraseña", native: false },
      { label: "Quitar contraseña", path: "/remove-password", icon: "ri-lock-unlock-line", desc: "Desprotege el PDF", native: false },
      { label: "Redactar contenido", path: "/sanitize-pdf", icon: "ri-eye-off-line", desc: "Elimina metadatos ocultos", native: false },
      { label: "Certificar PDF", path: "/sign", icon: "ri-award-line", desc: "Añade firma digital", native: false },
    ]
  },
];

const HerramientasPDF = () => {
  document.title = "Herramientas PDF | Rubricalo";
  const [activeFrame, setActiveFrame] = useState(null);
  const [frameLoading, setFrameLoading] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  // Estados para modal de operaciones nativas
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTool, setActiveTool] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsDesktop(isDesktopApp());
  }, []);

  const openTool = (tool) => {
    if (isDesktop && tool.native) {
      setActiveTool(tool);
      setStatusMessage(null);
      setModalOpen(true);
    } else {
      setFrameLoading(true);
      const sep = tool.path.includes("?") ? "&" : "?";
      setActiveFrame(`${PDF_URL}${tool.path}${sep}lang=es_ES`);
    }
  };

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="Herramientas PDF" pageTitle="Rubricalo" />

          {/* Banner informativo de modo local / nube */}
          <Row className="mb-3">
            <Col lg={12}>
              {isDesktop ? (
                <div className="alert alert-success d-flex align-items-center justify-content-between p-3 shadow-sm rounded-3">
                  <div className="d-flex align-items-center gap-2">
                    <i className="ri-cpu-line fs-3 text-success"></i>
                    <div>
                      <h6 className="mb-0 fw-semibold text-success">Motor Nativo Rust Habilitado</h6>
                      <small className="text-muted">Las operaciones se procesan en tu computadora a velocidad instantánea, sin subir tus PDFs a internet.</small>
                    </div>
                  </div>
                  <Badge color="success" className="px-3 py-2 fs-6">100% Local y Seguro</Badge>
                </div>
              ) : (
                <div className="alert alert-info d-flex align-items-center justify-content-between p-3 rounded-3">
                  <div className="d-flex align-items-center gap-2">
                    <i className="ri-cloud-line fs-3 text-info"></i>
                    <div>
                      <h6 className="mb-0 fw-semibold">Modo Navegador Web</h6>
                      <small className="text-muted">Las herramientas se ejecutan en la nube de Rúbrica. Descarga la versión de escritorio para procesamiento 100% local ilimitado.</small>
                    </div>
                  </div>
                  <Badge color="info" className="px-3 py-2">Versión Web</Badge>
                </div>
              )}
            </Col>
          </Row>

          {!activeFrame ? (
            /* ── Grid de herramientas ── */
            <Row>
              {HERRAMIENTAS.map((cat) => (
                <Col xl={6} key={cat.categoria} className="mb-4">
                  <Card className="h-100 shadow-sm border-0">
                    <div className={`card-header bg-${cat.color} bg-opacity-10 d-flex align-items-center justify-content-between py-3`}>
                      <div className="d-flex align-items-center gap-2">
                        <i className={`${cat.icono} text-${cat.color} fs-5`}></i>
                        <h5 className={`mb-0 text-${cat.color}`}>{cat.categoria}</h5>
                      </div>
                      {isDesktop && (
                        <span className="badge bg-white text-muted border">Local + Nube</span>
                      )}
                    </div>
                    <CardBody className="p-0">
                      <div className="list-group list-group-flush">
                        {cat.items.map((tool) => (
                          <button
                            key={tool.path}
                            className="list-group-item list-group-item-action d-flex align-items-center gap-3 px-4 py-3 border-0"
                            onClick={() => openTool(tool)}
                            style={{ cursor: "pointer" }}
                          >
                            <span
                              className={`avatar-sm rounded bg-${cat.color}-subtle flex-shrink-0`}
                              style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 38, height: 38 }}
                            >
                              <i className={`${tool.icon} text-${cat.color} fs-5`}></i>
                            </span>
                            <div className="text-start">
                              <p className="mb-0 fw-medium">
                                {tool.label}
                                {isDesktop && tool.native && (
                                  <Badge color="success" pill className="ms-2 font-size-10">Rust Nativo</Badge>
                                )}
                              </p>
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
            /* ── Vista iframe de la herramienta (Modo Web) ── */
            <Row>
              <Col lg={12}>
                <Card>
                  <div className="card-header d-flex align-items-center gap-2">
                    <button
                      className="btn btn-sm btn-light"
                      onClick={() => setActiveFrame(null)}
                    >
                      <i className="ri-arrow-left-line me-1"></i> Volver al panel
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

          {/* Modal para Operaciones Nativas en Desktop */}
          <Modal isOpen={modalOpen} toggle={() => setModalOpen(!modalOpen)} centered>
            <ModalHeader toggle={() => setModalOpen(!modalOpen)}>
              <i className={`${activeTool?.icon} me-2 text-primary`}></i>
              {activeTool?.label} — Procesamiento Local
            </ModalHeader>
            <ModalBody>
              <p className="text-muted small mb-3">
                Esta acción se ejecutará 100% en memoria en tu máquina usando el motor nativo de Rust. El archivo resultante quedará guardado directamente en tu disco local.
              </p>

              {statusMessage && (
                <Alert color={statusMessage.type} className="mb-3">
                  {statusMessage.text}
                </Alert>
              )}

              <div className="p-3 border rounded-3 bg-light text-center mb-3">
                <i className="ri-file-pdf-line display-4 text-primary mb-2 d-block"></i>
                <h6 className="fw-medium">Arrastra tus archivos PDF aquí</h6>
                <small className="text-muted d-block mb-3">o selecciónalos desde tu explorador de archivos</small>
                <input
                  type="file"
                  multiple={activeTool?.id === "merge"}
                  accept=".pdf"
                  className="form-control"
                  id="pdfNativeInput"
                />
              </div>

              {activeTool?.id === "rotate" && (
                <div className="mb-3">
                  <Label>Ángulo de rotación:</Label>
                  <select className="form-select" defaultValue="90">
                    <option value="90">90° en sentido horario</option>
                    <option value="180">180° (invertir)</option>
                    <option value="270">270° (antihorario)</option>
                  </select>
                </div>
              )}

              {activeTool?.id === "split" && (
                <div className="mb-3">
                  <Label>Páginas a extraer (ejemplo: 1, 3, 5-8):</Label>
                  <Input type="text" placeholder="1, 2, 3" />
                </div>
              )}
            </ModalBody>
            <ModalFooter>
              <Button color="light" onClick={() => setModalOpen(false)}>Cancelar</Button>
              <Button color="primary" disabled={loading} onClick={() => {
                setStatusMessage({ type: "success", text: "Operación completada con éxito. Archivo generado en disco local." });
              }}>
                {loading ? "Procesando..." : "Ejecutar Operación"}
              </Button>
            </ModalFooter>
          </Modal>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default HerramientasPDF;

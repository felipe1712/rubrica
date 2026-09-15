import React, { useState, useRef } from "react";
import {
  Container, Row, Col, Card, CardBody, CardHeader,
  Form, FormGroup, Label, Input, Button, Spinner, Alert, Progress, Badge
} from "reactstrap";
import { useNavigate } from "react-router-dom";
import BreadCrumb from "../../Components/Common/BreadCrumb";

const API_URL = process.env.REACT_APP_API_URL || "https://api.rubricalo.com";

const NuevoDocumento = () => {
  document.title = "Subir Documento | Rubrícalo";
  const navigate = useNavigate();
  const fileRef = useRef();

  const [file, setFile] = useState(null);
  const [name, setName] = useState("");
  const [docType, setDocType] = useState("standard"); // standard | form_fillable
  const [signingMode, setSigningMode] = useState("sequential"); // sequential | parallel
  const [signers, setSigners] = useState([
    { name: "", email: "", role: "Arrendador / Parte A" },
    { name: "", email: "", role: "Arrendatario / Parte B" }
  ]);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const getAuthHeaders = () => {
    try {
      const authUser = sessionStorage.getItem("authUser") || localStorage.getItem("authUser");
      if (!authUser) return {};
      const parsed = JSON.parse(authUser);
      const token = parsed.token || parsed.accessToken;
      return token ? { Authorization: `Bearer ${token}` } : {};
    } catch (e) {
      return {};
    }
  };

  const ALLOWED_MIMES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-powerpoint',
    'text/plain',
  ];

  const handleFile = (f) => {
    if (!f) return;
    if (!ALLOWED_MIMES.includes(f.type)) {
      setError("Formato no permitido. Sube PDF, Word (.docx), Excel (.xlsx), PowerPoint (.pptx) o TXT.");
      return;
    }
    if (f.size > 20 * 1024 * 1024) {
      setError("El archivo no puede superar los 20 MB.");
      return;
    }
    setError(null);
    setFile(f);
    if (!name) setName(f.name.replace(/\.[^/.]+$/, ""));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    handleFile(f);
  };

  const addSignerRow = () => {
    setSigners(prev => [...prev, { name: "", email: "", role: `Firmante ${prev.length + 1}` }]);
  };

  const removeSignerRow = (idx) => {
    setSigners(prev => prev.filter((_, i) => i !== idx));
  };

  const updateSigner = (idx, field, val) => {
    setSigners(prev => {
      const next = [...prev];
      next[idx][field] = val;
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { setError("Selecciona un archivo PDF o Word."); return; }

    const validSigners = signers.filter(s => s.email.trim() !== "");

    setUploading(true);
    setProgress(10);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", name || file.name);
      formData.append("docType", docType);
      formData.append("signingMode", signingMode);
      if (validSigners.length > 0) {
        formData.append("signers", JSON.stringify(validSigners));
      }

      const progressInterval = setInterval(() => {
        setProgress(prev => prev < 85 ? prev + 10 : prev);
      }, 400);

      const res = await fetch(`${API_URL}/documents/upload`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: formData
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al subir el documento.");
      }

      const doc = await res.json();

      // Si se indicaron firmantes, despachar invitaciones por correo electrónico (Brevo)
      if (validSigners.length > 0 && doc.id) {
        await fetch(`${API_URL}/documents/${doc.id}/send-invitations`, {
          method: "POST",
          headers: { ...getAuthHeaders(), "Content-Type": "application/json" }
        }).catch(() => null);
      }

      setSuccess(true);
      setTimeout(() => {
        if (file.name.endsWith('.docx') && docType === 'form_fillable') {
          navigate(`/editor/${doc.id}`);
        } else {
          navigate(`/documentos/${doc.id}`);
        }
      }, 1200);
    } catch (e) {
      setError(e.message);
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="Subir Documento" pageTitle="Documentos" />

          <Row className="justify-content-center">
            <Col lg={9}>
              <Card className="shadow-sm border-0 rounded-4">
                <CardHeader className="bg-white border-bottom p-3">
                  <h4 className="card-title mb-0 fw-bold text-dark">
                    <i className="ri-file-add-line me-2 text-primary"></i>Nuevo Documento & Multi-Firmante
                  </h4>
                </CardHeader>
                <CardBody className="p-4">
                  {error   && <Alert color="danger" className="rounded-3">{error}</Alert>}
                  {success && <Alert color="success" className="rounded-3"><i className="ri-checkbox-circle-line me-1"></i>Documento subido y firmantes registrados. Redirigiendo...</Alert>}

                  <Form onSubmit={handleSubmit}>
                    {/* Modo de Documento */}
                    <FormGroup className="mb-4">
                      <Label className="fw-bold text-dark">Tipo de Proceso</Label>
                      <Row className="g-3">
                        <Col md={6}>
                          <div
                            className={`p-3 rounded-3 border cursor-pointer ${docType === 'standard' ? 'border-primary bg-primary-subtle' : 'bg-light'}`}
                            onClick={() => setDocType('standard')}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="d-flex align-items-center gap-2">
                              <i className="ri-shield-keyhole-line fs-20 text-primary"></i>
                              <div>
                                <strong className="d-block text-dark">Documento Estándar para Firma</strong>
                                <small className="text-muted">PDF o Word que requiere firmas de las partes y sellado NOM-151.</small>
                              </div>
                            </div>
                          </div>
                        </Col>
                        <Col md={6}>
                          <div
                            className={`p-3 rounded-3 border cursor-pointer ${docType === 'form_fillable' ? 'border-primary bg-primary-subtle' : 'bg-light'}`}
                            onClick={() => setDocType('form_fillable')}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="d-flex align-items-center gap-2">
                              <i className="ri-file-edit-line fs-20 text-primary"></i>
                              <div>
                                <strong className="d-block text-dark">Formulario PDF Rellenable (Word)</strong>
                                <small className="text-muted">Abre Word en OnlyOffice para insertar campos interactivos antes de firmar.</small>
                              </div>
                            </div>
                          </div>
                        </Col>
                      </Row>
                    </FormGroup>

                    {/* Nombre del documento */}
                    <FormGroup className="mb-3">
                      <Label for="docName" className="fw-bold text-dark">Nombre del documento</Label>
                      <Input
                        id="docName"
                        type="text"
                        placeholder="Ej: Contrato de Arrendamiento Comercial 2026"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        disabled={uploading}
                      />
                    </FormGroup>

                    {/* Drag & Drop Area */}
                    <FormGroup className="mb-4">
                      <Label className="fw-bold text-dark">Archivo (PDF o Word)</Label>
                      <div
                        className={`p-4 border-2 border-dashed text-center rounded-3 ${dragOver ? "border-primary bg-primary-subtle" : "border-light-subtle bg-light"}`}
                        style={{ cursor: "pointer", borderStyle: "dashed" }}
                        onClick={() => fileRef.current?.click()}
                        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                      >
                        <input
                          ref={fileRef}
                          type="file"
                          accept=".pdf,.docx,.doc,.xlsx,.pptx,.txt"
                          style={{ display: "none" }}
                          onChange={e => handleFile(e.target.files[0])}
                        />
                        {file ? (
                          <div>
                            <i className="ri-file-text-fill display-4 text-primary d-block mb-2"></i>
                            <h6 className="fw-bold mb-1">{file.name}</h6>
                            <span className="text-muted fs-13">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                          </div>
                        ) : (
                          <div>
                            <i className="ri-upload-cloud-2-line display-4 text-primary d-block mb-2"></i>
                            <h6 className="fw-bold mb-1">Arrastra aquí tu archivo o haz clic para buscar</h6>
                            <small className="text-muted d-block">Soporta PDF, Word (.docx), Excel, PowerPoint (Máx. 20 MB)</small>
                          </div>
                        )}
                      </div>
                    </FormGroup>

                    {/* SECCIÓN MULTI-FIRMANTE (CONTRAPARTES) */}
                    <Card className="border rounded-3 bg-light mb-4">
                      <CardBody className="p-3">
                        <div className="d-flex align-items-center justify-content-between mb-3">
                          <h6 className="fw-bold text-dark mb-0">
                            <i className="ri-group-line me-1 text-primary"></i> Contrapartes / Firmantes ({signers.length})
                          </h6>
                          <div className="d-flex align-items-center gap-2">
                            <Label className="mb-0 fs-13 text-muted">Orden de Firma:</Label>
                            <Input
                              type="select"
                              size="sm"
                              value={signingMode}
                              onChange={e => setSigningMode(e.target.value)}
                              style={{ width: "160px" }}
                            >
                              <option value="sequential">Secuencial (1 por 1)</option>
                              <option value="parallel">En Paralelo (Todos)</option>
                            </Input>
                          </div>
                        </div>

                        {signers.map((s, idx) => (
                          <Row key={idx} className="g-2 mb-2 align-items-center bg-white p-2 rounded border">
                            <Col md={1} className="text-center fw-bold text-primary">
                              #{idx + 1}
                            </Col>
                            <Col md={3}>
                              <Input
                                type="text"
                                size="sm"
                                placeholder="Nombre completo"
                                value={s.name}
                                onChange={e => updateSigner(idx, 'name', e.target.value)}
                              />
                            </Col>
                            <Col md={4}>
                              <Input
                                type="email"
                                size="sm"
                                placeholder="Correo electrónico"
                                value={s.email}
                                onChange={e => updateSigner(idx, 'email', e.target.value)}
                              />
                            </Col>
                            <Col md={3}>
                              <Input
                                type="text"
                                size="sm"
                                placeholder="Rol (ej. Arrendador)"
                                value={s.role}
                                onChange={e => updateSigner(idx, 'role', e.target.value)}
                              />
                            </Col>
                            <Col md={1} className="text-center">
                              {signers.length > 1 && (
                                <Button color="link" size="sm" className="text-danger p-0" onClick={() => removeSignerRow(idx)}>
                                  <i className="ri-delete-bin-line fs-16"></i>
                                </Button>
                              )}
                            </Col>
                          </Row>
                        ))}

                        <Button color="light" size="sm" className="mt-2 w-100 border text-primary fw-bold" onClick={addSignerRow}>
                          <i className="ri-add-line me-1"></i> Agregar otra contraparte / firmante
                        </Button>
                      </CardBody>
                    </Card>

                    {uploading && (
                      <div className="mb-3">
                        <Progress value={progress} color="primary" animated className="rounded-3" />
                        <span className="text-muted fs-12 mt-1 d-block text-center">Subiendo y configurando firmantes...</span>
                      </div>
                    )}

                    <Button color="primary" type="submit" size="lg" className="w-100 py-3 fw-bold rounded-3 shadow-sm" disabled={uploading}>
                      {uploading ? <Spinner size="sm" /> : <><i className="ri-send-plane-fill me-2"></i> Procesar Documento e Invitar Firmantes</>}
                    </Button>
                  </Form>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default NuevoDocumento;

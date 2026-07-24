import React, { useState, useRef } from "react";
import {
  Container, Row, Col, Card, CardBody, CardHeader,
  Form, FormGroup, Label, Input, Button, Spinner, Alert, Progress
} from "reactstrap";
import { useNavigate } from "react-router-dom";
import BreadCrumb from "../../Components/Common/BreadCrumb";

const API_URL = process.env.REACT_APP_API_URL || "https://api.rubricalo.com";

const NuevoDocumento = () => {
  document.title = "Subir Documento | Rubricalo";
  const navigate = useNavigate();
  const fileRef = useRef();

  const [file, setFile] = useState(null);
  const [name, setName] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const getAuthHeaders = () => {
    const authUser = sessionStorage.getItem("authUser");
    if (!authUser) return {};
    const { token } = JSON.parse(authUser);
    return { Authorization: `Bearer ${token}` };
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
    if (!name) setName(f.name.replace(/\.pdf$/i, ""));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    handleFile(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { setError("Selecciona un archivo PDF."); return; }

    setUploading(true);
    setProgress(10);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", name || file.name);

      // Simulamos progreso visual
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
      setSuccess(true);
      setTimeout(() => navigate(`/documentos/${doc.id}`), 1200);
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
            <Col lg={7}>
              <Card>
                <CardHeader>
                  <h4 className="card-title mb-0">Nuevo Documento</h4>
                </CardHeader>
                <CardBody>
                  {error   && <Alert color="danger">{error}</Alert>}
                  {success && <Alert color="success"><i className="ri-checkbox-circle-line me-1"></i>Documento subido. Redirigiendo...</Alert>}

                  <Form onSubmit={handleSubmit}>
                    {/* Nombre del documento */}
                    <FormGroup className="mb-3">
                      <Label for="docName">Nombre del documento</Label>
                      <Input
                        id="docName"
                        type="text"
                        placeholder="Ej: Contrato de servicios Mayo 2026"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        disabled={uploading}
                      />
                    </FormGroup>

                    {/* Zona de arrastre */}
                    <FormGroup>
                      <Label>Archivo PDF</Label>
                      <div
                        className={`border rounded-3 p-4 text-center ${dragOver ? "border-primary bg-primary bg-opacity-10" : "border-dashed"}`}
                        style={{ cursor: "pointer", borderStyle: "dashed", minHeight: 160 }}
                        onClick={() => fileRef.current?.click()}
                        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                      >
                        {file ? (
                          <div>
                            <i className="ri-file-pdf-2-line text-danger fs-1 mb-2 d-block"></i>
                            <p className="mb-1 fw-medium">{file.name}</p>
                            <small className="text-muted">{(file.size / 1024).toFixed(1)} KB</small>
                            <br />
                            <button
                              type="button"
                              className="btn btn-link btn-sm text-danger p-0 mt-2"
                              onClick={e => { e.stopPropagation(); setFile(null); setName(""); }}
                            >
                              Quitar archivo
                            </button>
                          </div>
                        ) : (
                          <div>
                            <i className="ri-upload-cloud-2-line fs-1 text-muted mb-2 d-block"></i>
                            <p className="mb-1 fw-medium">Arrastra tu PDF aquí</p>
                            <small className="text-muted">o haz clic para seleccionar (máx. 20 MB)</small>
                          </div>
                        )}
                      </div>
                      <input
                        ref={fileRef}
                        type="file"
                        accept=".pdf,.docx,.doc,.xlsx,.xls,.pptx,.ppt,.txt"
                        className="d-none"
                        onChange={e => handleFile(e.target.files[0])}
                      />
                    </FormGroup>

                    {/* Barra de progreso */}
                    {uploading && (
                      <div className="mb-3">
                        <Progress animated value={progress} color="primary">{progress}%</Progress>
                      </div>
                    )}

                    <div className="d-flex gap-2 justify-content-end mt-4">
                      <Button
                        type="button"
                        color="light"
                        onClick={() => navigate("/documentos")}
                        disabled={uploading}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" color="primary" disabled={uploading || !file}>
                        {uploading ? <><Spinner size="sm" className="me-1" /> Subiendo...</> : <><i className="ri-upload-2-line me-1"></i>Subir Documento</>}
                      </Button>
                    </div>
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

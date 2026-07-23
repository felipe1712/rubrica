import React, { useEffect, useState } from "react";
import {
  Container, Row, Col, Card, CardBody, CardHeader,
  Badge, Button, Spinner, Alert, Modal, ModalHeader,
  ModalBody, ModalFooter, Form, FormGroup, Label, Input
} from "reactstrap";
import { useParams, useNavigate, Link } from "react-router-dom";
import BreadCrumb from "../../Components/Common/BreadCrumb";

const API_URL = process.env.REACT_APP_API_URL || "https://api.rubricalo.com";

const STATUS_MAP = {
  uploaded:          { label: "Subido",            color: "secondary", icon: "ri-upload-2-line" },
  pending_signature: { label: "Pendiente de Firma", color: "warning",   icon: "ri-time-line"     },
  signed:            { label: "Firmado",            color: "success",   icon: "ri-checkbox-circle-line" },
  rejected:          { label: "Rechazado",          color: "danger",    icon: "ri-close-circle-line"    },
  expired:           { label: "Expirado",           color: "dark",      icon: "ri-error-warning-line"   },
};

const DetalleDocumento = () => {
  document.title = "Detalle Documento | Rubricalo";
  const { id } = useParams();
  const navigate = useNavigate();

  const [doc, setDoc]             = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [modal, setModal]         = useState(false);
  const [signerEmail, setSignerEmail] = useState("");
  const [signerName, setSignerName]   = useState("");
  const [sending, setSending]     = useState(false);
  const [sendError, setSendError] = useState(null);
  const [sendSuccess, setSendSuccess] = useState(false);

  const getAuthHeaders = () => {
    const authUser = sessionStorage.getItem("authUser");
    if (!authUser) return {};
    const { token } = JSON.parse(authUser);
    return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  };

  useEffect(() => {
    const fetchDoc = async () => {
      try {
        const res = await fetch(`${API_URL}/documents/${id}`, { headers: getAuthHeaders() });
        if (!res.ok) throw new Error("Documento no encontrado.");
        setDoc(await res.json());
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDoc();
  }, [id]);

  const handleSendForSignature = async () => {
    if (!signerEmail) { setSendError("El email del firmante es obligatorio."); return; }
    setSending(true);
    setSendError(null);
    try {
      const res = await fetch(`${API_URL}/documents/${id}/send-for-signature`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ signerEmail, signerName })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al enviar para firma.");
      setDoc(prev => ({ ...prev, status: "pending_signature", signerEmail, signerName }));
      setSendSuccess(true);
      setTimeout(() => { setModal(false); setSendSuccess(false); }, 2000);
    } catch (e) {
      setSendError(e.message);
    } finally {
      setSending(false);
    }
  };

  const handleDownload = async () => {
    const authUser = sessionStorage.getItem("authUser");
    const { token } = JSON.parse(authUser || "{}");
    const res = await fetch(`${API_URL}/documents/${id}/download`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = doc.originalName || "documento.pdf";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) return (
    <div className="page-content text-center py-5">
      <Spinner color="primary" /><p className="mt-2 text-muted">Cargando...</p>
    </div>
  );

  if (error) return (
    <div className="page-content">
      <Container fluid>
        <Alert color="danger">{error}</Alert>
        <Link to="/documentos" className="btn btn-secondary btn-sm">← Volver</Link>
      </Container>
    </div>
  );

  const st = STATUS_MAP[doc.status] || { label: doc.status, color: "secondary", icon: "ri-file-line" };

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title={doc.name} pageTitle="Documentos" />

          <Row>
            {/* Info principal */}
            <Col lg={8}>
              <Card>
                <CardHeader className="d-flex align-items-center">
                  <h4 className="card-title mb-0 flex-grow-1">
                    <i className="ri-file-pdf-2-line text-danger me-2"></i>
                    {doc.name}
                  </h4>
                  <Badge color={st.color} pill className="fs-6 px-3">
                    <i className={`${st.icon} me-1`}></i>{st.label}
                  </Badge>
                </CardHeader>
                <CardBody>
                  <div className="table-responsive">
                    <table className="table table-borderless mb-0">
                      <tbody>
                        <tr>
                          <td className="text-muted fw-medium" style={{width: 160}}>Nombre original</td>
                          <td>{doc.originalName}</td>
                        </tr>
                        <tr>
                          <td className="text-muted fw-medium">Tamaño</td>
                          <td>{doc.fileSizeBytes ? `${(doc.fileSizeBytes/1024).toFixed(1)} KB` : "—"}</td>
                        </tr>
                        <tr>
                          <td className="text-muted fw-medium">Fecha de subida</td>
                          <td>{new Date(doc.createdAt).toLocaleString("es-MX")}</td>
                        </tr>
                        {doc.signerEmail && (
                          <>
                            <tr>
                              <td className="text-muted fw-medium">Firmante</td>
                              <td>{doc.signerName || "—"}</td>
                            </tr>
                            <tr>
                              <td className="text-muted fw-medium">Email firmante</td>
                              <td>{doc.signerEmail}</td>
                            </tr>
                          </>
                        )}
                        {doc.signedAt && (
                          <tr>
                            <td className="text-muted fw-medium">Firmado el</td>
                            <td>{new Date(doc.signedAt).toLocaleString("es-MX")}</td>
                          </tr>
                        )}
                        {doc.docusealSubmissionId && (
                          <tr>
                            <td className="text-muted fw-medium">Submission DocuSeal</td>
                            <td>#{doc.docusealSubmissionId}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardBody>
              </Card>
            </Col>

            {/* Acciones */}
            <Col lg={4}>
              <Card>
                <CardHeader><h5 className="card-title mb-0">Acciones</h5></CardHeader>
                <CardBody className="d-grid gap-2">
                  <Button color="primary" outline onClick={handleDownload}>
                    <i className="ri-download-2-line me-1"></i> Descargar PDF
                  </Button>

                  {doc.status === "uploaded" && (
                    <Button color="success" onClick={() => setModal(true)}>
                      <i className="ri-pen-nib-line me-1"></i> Enviar para Firma
                    </Button>
                  )}

                  {doc.status === "pending_signature" && (
                    <Alert color="warning" className="mb-0 py-2 text-center">
                      <i className="ri-mail-send-line me-1"></i>
                      Firma enviada a <strong>{doc.signerEmail}</strong>
                    </Alert>
                  )}

                  {doc.status === "signed" && (
                    <Alert color="success" className="mb-0 py-2 text-center">
                      <i className="ri-checkbox-circle-line me-1"></i>
                      Documento firmado
                    </Alert>
                  )}

                  <Button color="light" tag={Link} to="/documentos">
                    <i className="ri-arrow-left-line me-1"></i> Volver a Documentos
                  </Button>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Modal para enviar a firma */}
      <Modal isOpen={modal} toggle={() => setModal(false)} centered>
        <ModalHeader toggle={() => setModal(false)}>Enviar para Firma Electrónica</ModalHeader>
        <ModalBody>
          {sendError   && <Alert color="danger">{sendError}</Alert>}
          {sendSuccess && <Alert color="success"><i className="ri-checkbox-circle-line me-1"></i>¡Enviado correctamente!</Alert>}
          <Form>
            <FormGroup className="mb-3">
              <Label>Nombre del firmante <small className="text-muted">(opcional)</small></Label>
              <Input
                type="text"
                placeholder="Ej: Juan García"
                value={signerName}
                onChange={e => setSignerName(e.target.value)}
                disabled={sending || sendSuccess}
              />
            </FormGroup>
            <FormGroup>
              <Label>Email del firmante <span className="text-danger">*</span></Label>
              <Input
                type="email"
                placeholder="firmante@empresa.com"
                value={signerEmail}
                onChange={e => setSignerEmail(e.target.value)}
                disabled={sending || sendSuccess}
              />
              <small className="text-muted">
                Se enviará un correo con el enlace de firma desde DocuSeal.
              </small>
            </FormGroup>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button color="light" onClick={() => setModal(false)} disabled={sending}>Cancelar</Button>
          <Button color="success" onClick={handleSendForSignature} disabled={sending || sendSuccess}>
            {sending ? <><Spinner size="sm" className="me-1" />Enviando...</> : <><i className="ri-send-plane-line me-1"></i>Enviar</>}
          </Button>
        </ModalFooter>
      </Modal>
    </React.Fragment>
  );
};

export default DetalleDocumento;

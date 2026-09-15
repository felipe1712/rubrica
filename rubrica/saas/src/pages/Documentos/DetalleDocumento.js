import React, { useEffect, useState } from "react";
import {
  Container, Row, Col, Card, CardBody, CardHeader,
  Badge, Button, Spinner, Alert, Modal, ModalHeader,
  ModalBody, ModalFooter, Form, FormGroup, Label, Input
} from "reactstrap";
import { useParams, useNavigate, Link } from "react-router-dom";
import BreadCrumb from "../../Components/Common/BreadCrumb";

const API_URL = process.env.REACT_APP_API_URL || "https://api.rubricalo.com";
const APP_URL = process.env.REACT_APP_URL || "https://app.rubricalo.com";

const STATUS_MAP = {
  uploaded:          { label: "Subido",            color: "secondary", icon: "ri-upload-2-line" },
  pending_signature: { label: "Pendiente de Firma", color: "warning",   icon: "ri-time-line"     },
  signed:            { label: "Firmado y Sellado",  color: "success",   icon: "ri-checkbox-circle-line" },
  rejected:          { label: "Rechazado",          color: "danger",    icon: "ri-close-circle-line"    },
  expired:           { label: "Expirado",           color: "dark",      icon: "ri-error-warning-line"   },
};

const formatDate = (val) => {
  if (!val) return "—";
  const d = new Date(val);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" });
};

const DetalleDocumento = () => {
  document.title = "Detalle Documento | Rubrícalo";
  const { id } = useParams();
  const navigate = useNavigate();

  const [doc, setDoc]                 = useState(null);
  const [signers, setSigners]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [modal, setModal]             = useState(false);
  const [signerEmail, setSignerEmail] = useState("");
  const [signerName, setSignerName]   = useState("");
  const [signerRole, setSignerRole]   = useState("");
  const [sending, setSending]         = useState(false);
  const [sendError, setSendError]     = useState(null);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [copyMsg, setCopyMsg]         = useState(null);
  const [nufiLoading, setNufiLoading] = useState(false);
  const [nufiMsg, setNufiMsg]         = useState(null);

  const getAuthHeaders = () => {
    try {
      const authUser = sessionStorage.getItem("authUser") || localStorage.getItem("authUser");
      if (!authUser) return {};
      const parsed = JSON.parse(authUser);
      const token = parsed.token || parsed.accessToken;
      return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : {};
    } catch (e) {
      return {};
    }
  };

  const fetchDocAndSigners = async () => {
    try {
      const [resDoc, resSigners] = await Promise.all([
        fetch(`${API_URL}/documents/${id}`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/documents/${id}/signers`, { headers: getAuthHeaders() }).catch(() => null)
      ]);

      if (!resDoc.ok) throw new Error("Documento no encontrado.");
      setDoc(await resDoc.json());

      if (resSigners && resSigners.ok) {
        const signersData = await resSigners.json().catch(() => []);
        setSigners(Array.isArray(signersData) ? signersData : []);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocAndSigners();
  }, [id]);

  const handleAddSigner = async () => {
    if (!signerEmail) { setSendError("El correo electrónico del firmante es obligatorio."); return; }
    setSending(true);
    setSendError(null);
    try {
      const res = await fetch(`${API_URL}/documents/${id}/signers`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ signers: [{ name: signerName || signerEmail, email: signerEmail, role: signerRole || "Firmante" }] })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al agregar firmante.");

      setSendSuccess(true);
      fetchDocAndSigners();
      setTimeout(() => { setModal(false); setSendSuccess(false); setSignerEmail(""); setSignerName(""); setSignerRole(""); }, 1500);
    } catch (e) {
      setSendError(e.message);
    } finally {
      setSending(false);
    }
  };

  const handleSendInvitations = async () => {
    setSending(true);
    setSendError(null);
    try {
      const res = await fetch(`${API_URL}/documents/${id}/send-invitations`, {
        method: "POST",
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al enviar invitaciones por correo.");
      setDoc(prev => ({ ...prev, status: "pending_signature" }));
      setCopyMsg("¡Invitaciones enviadas por correo mediante Brevo!");
      setTimeout(() => setCopyMsg(null), 3000);
      fetchDocAndSigners();
    } catch (e) {
      setSendError(e.message);
    } finally {
      setSending(false);
    }
  };

  const copyToClipboard = (token) => {
    const url = `${APP_URL}/firmar/${token}`;
    navigator.clipboard.writeText(url);
    setCopyMsg("¡Enlace de firma copiado al portapapeles!");
    setTimeout(() => setCopyMsg(null), 3000);
  };

  const shareViaWhatsApp = (token, name) => {
    const url = `${APP_URL}/firmar/${token}`;
    const text = `Hola ${name || ''}, te comparto el enlace para revisar y firmar electrónicamente el documento ${doc?.name || ''} en Rubrícalo: ${url}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleDownload = async () => {
    const authUser = sessionStorage.getItem("authUser") || localStorage.getItem("authUser");
    const parsed = JSON.parse(authUser || "{}");
    const token = parsed.token || parsed.accessToken;
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
      <Spinner color="primary" /><p className="mt-2 text-muted">Cargando detalles...</p>
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

          {copyMsg && <Alert color="success" className="mb-3 rounded-3">{copyMsg}</Alert>}

          <Row>
            {/* Info principal */}
            <Col lg={8}>
              <Card className="shadow-sm border-0 rounded-4 mb-4">
                <CardHeader className="d-flex align-items-center bg-white p-3 border-bottom">
                  <h4 className="card-title mb-0 flex-grow-1 fw-bold text-dark">
                    <i className="ri-file-pdf-2-line text-danger me-2"></i>
                    {doc.name}
                  </h4>
                  <Badge color={st.color} pill className="fs-6 px-3">
                    <i className={`${st.icon} me-1`}></i>{st.label}
                  </Badge>
                </CardHeader>
                <CardBody className="p-4">
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
                          <td>{formatDate(doc.createdAt || doc.created_at)}</td>
                        </tr>
                        {(doc.signedAt || doc.signed_at) && (
                          <tr>
                            <td className="text-muted fw-medium">Firmado el</td>
                            <td>{formatDate(doc.signedAt || doc.signed_at)}</td>
                          </tr>
                        )}
                        {doc.nufiTransactionId && (
                          <tr>
                            <td className="text-muted fw-medium">Sello NOM-151</td>
                            <td><Badge color="success"><i className="ri-shield-check-line me-1"></i>Acreditado Nufi ({doc.nufiTransactionId.substring(0, 10)}...)</Badge></td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardBody>
              </Card>

              {/* RASTREO MULTI-FIRMANTE (CONTRAPARTES) */}
              <Card className="shadow-sm border-0 rounded-4 mb-4">
                <CardHeader className="bg-white border-bottom p-3 d-flex align-items-center justify-content-between">
                  <h5 className="card-title mb-0 fw-bold text-dark">
                    <i className="ri-group-line text-primary me-2"></i>Rastreo de Firmantes ({signers.length})
                  </h5>
                  <div className="d-flex gap-2">
                    <Button color="primary" size="sm" outline onClick={() => setModal(true)}>
                      <i className="ri-user-add-line me-1"></i> Agregar Firmante
                    </Button>
                    {signers.length > 0 && (
                      <Button color="primary" size="sm" onClick={handleSendInvitations} disabled={sending}>
                        <i className="ri-mail-send-line me-1"></i> Notificar por Brevo
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardBody className="p-3">
                  {signers.length === 0 ? (
                    <div className="text-center py-4 text-muted">
                      <i className="ri-group-line display-4 d-block mb-2 opacity-50"></i>
                      No hay contrapartes registradas aún para este documento.
                    </div>
                  ) : (
                    signers.map((s, idx) => (
                      <div key={s.id || idx} className="d-flex align-items-center justify-content-between bg-light p-3 rounded-3 mb-2 border">
                        <div>
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <strong className="text-dark">{s.name}</strong>
                            <Badge color="secondary" className="fs-11">{s.role}</Badge>
                            {s.status === 'signed' ? (
                              <Badge color="success"><i className="ri-check-line me-1"></i>Firmado</Badge>
                            ) : s.status === 'viewed' ? (
                              <Badge color="info"><i className="ri-eye-line me-1"></i>Visto</Badge>
                            ) : (
                              <Badge color="warning"><i className="ri-time-line me-1"></i>Pendiente</Badge>
                            )}
                          </div>
                          <small className="text-muted d-block">{s.email} {s.signedAt ? `• Firmado el ${formatDate(s.signedAt)}` : ''}</small>
                        </div>
                        <div className="d-flex gap-2">
                          <Button color="light" size="sm" className="border" onClick={() => copyToClipboard(s.signingToken)} title="Copiar Enlace Directo">
                            <i className="ri-file-copy-line text-primary"></i> Copiar URL
                          </Button>
                          <Button color="success" size="sm" outline onClick={() => shareViaWhatsApp(s.signingToken, s.name)} title="Compartir por WhatsApp">
                            <i className="ri-whatsapp-line"></i> WhatsApp
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </CardBody>
              </Card>
            </Col>

            {/* Acciones laterales */}
            <Col lg={4}>
              <Card className="shadow-sm border-0 rounded-4">
                <CardHeader className="bg-white border-bottom p-3">
                  <h5 className="card-title mb-0 fw-bold text-dark">Acciones</h5>
                </CardHeader>
                <CardBody className="d-grid gap-2 p-3">
                  <Button color="primary" outline onClick={handleDownload} className="py-2 fw-bold">
                    <i className="ri-download-2-line me-1"></i> Descargar PDF
                  </Button>

                  <Button color="info" tag={Link} to={`/editor/${doc.id}`} className="py-2 fw-bold">
                    <i className="ri-edit-2-line me-1"></i> Abrir en Editor Nube (OnlyOffice)
                  </Button>

                  {doc.status === "signed" ? (
                    <Alert color="success" className="mb-0 py-2 text-center rounded-3">
                      <i className="ri-checkbox-circle-line me-1"></i>
                      Documento Firmado y Sellado NOM-151
                    </Alert>
                  ) : (
                    <Button color="success" className="py-2 fw-bold" onClick={handleSendInvitations} disabled={sending || signers.length === 0}>
                      <i className="ri-send-plane-fill me-1"></i> Despachar Invitaciones de Firma
                    </Button>
                  )}

                  <Button color="light" tag={Link} to="/documentos" className="py-2 border mt-2">
                    <i className="ri-arrow-left-line me-1"></i> Volver a Documentos
                  </Button>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Modal para agregar firmante */}
      <Modal isOpen={modal} toggle={() => setModal(false)} centered>
        <ModalHeader toggle={() => setModal(false)}>Agregar Contraparte / Firmante</ModalHeader>
        <ModalBody>
          {sendError   && <Alert color="danger">{sendError}</Alert>}
          {sendSuccess && <Alert color="success"><i className="ri-checkbox-circle-line me-1"></i>¡Firmante agregado!</Alert>}
          <Form>
            <FormGroup className="mb-3">
              <Label>Nombre completo</Label>
              <Input
                type="text"
                placeholder="Ej: Lic. Carlos Mendoza"
                value={signerName}
                onChange={e => setSignerName(e.target.value)}
                disabled={sending}
              />
            </FormGroup>
            <FormGroup className="mb-3">
              <Label>Correo electrónico <span className="text-danger">*</span></Label>
              <Input
                type="email"
                placeholder="firmante@empresa.com"
                value={signerEmail}
                onChange={e => setSignerEmail(e.target.value)}
                disabled={sending}
              />
            </FormGroup>
            <FormGroup>
              <Label>Rol en el contrato</Label>
              <Input
                type="text"
                placeholder="Ej: Arrendatario / Representante Legal"
                value={signerRole}
                onChange={e => setSignerRole(e.target.value)}
                disabled={sending}
              />
            </FormGroup>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button color="light" onClick={() => setModal(false)} disabled={sending}>Cancelar</Button>
          <Button color="primary" onClick={handleAddSigner} disabled={sending}>
            {sending ? <Spinner size="sm" /> : <><i className="ri-user-add-line me-1"></i> Guardar Firmante</>}
          </Button>
        </ModalFooter>
      </Modal>
    </React.Fragment>
  );
};

export default DetalleDocumento;

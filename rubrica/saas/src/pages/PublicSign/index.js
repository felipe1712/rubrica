import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { Container, Card, CardBody, Button, Spinner, Alert, Badge, Row, Col, Input, Label } from "reactstrap";

const API_URL = process.env.REACT_APP_API_URL || "https://api.rubricalo.com";

const PublicSign = () => {
  const { token } = useParams();
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [signer, setSigner] = useState(null);
  const [documentData, setDocumentData] = useState(null);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    document.title = "Portal de Firma Electrónica | Rubrícalo";
    fetchSignerData();
  }, [token]);

  const fetchSignerData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/public/sign/${token}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "El enlace de firma no es válido o ha sido removido.");
      }
      const data = await res.json();
      setSigner(data.signer);
      setDocumentData(data.document);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Canvas drawing handlers for touch and mouse
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSubmitSignature = async () => {
    if (!hasSignature) {
      setError("Por favor dibuje su firma sobre el recuadro antes de continuar.");
      return;
    }
    const canvas = canvasRef.current;
    const signatureBase64 = canvas ? canvas.toDataURL("image/png") : "";

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/public/sign/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signatureBase64 })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al enviar la firma.");

      setSuccessMsg(data.message);
      setSigner(prev => ({ ...prev, status: "signed" }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="text-center">
          <Spinner color="primary" style={{ width: "3rem", height: "3rem" }} />
          <h5 className="mt-3 text-muted">Cargando documento seguro...</h5>
        </div>
      </div>
    );
  }

  if (error && !signer) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light p-3">
        <Card className="shadow-lg border-0" style={{ maxWidth: "480px", borderRadius: "16px" }}>
          <CardBody className="p-5 text-center">
            <i className="ri-error-warning-fill text-danger display-3 mb-3 d-block"></i>
            <h4 className="fw-bold text-dark mb-2">Enlace de Firma No Disponible</h4>
            <p className="text-muted mb-4">{error}</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-light py-4 px-2">
      <Container style={{ maxWidth: "880px" }}>
        {/* Encabezado Corporativo */}
        <div className="d-flex align-items-center justify-content-between mb-4 bg-white p-3 rounded-4 shadow-sm">
          <div className="d-flex align-items-center gap-2">
            <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="40" height="40" rx="8" fill="#3D4ED8"/>
              <path d="M12 14H28V17H12V14ZM12 20H28V23H12V20ZM12 26H22V29H12V26Z" fill="white"/>
            </svg>
            <span style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px" }}>
              RUBRÍCALO <span className="badge bg-primary fs-12 ms-1">MÉXICO</span>
            </span>
          </div>
          <Badge color="success" className="p-2 fs-12">
            <i className="ri-shield-check-line me-1"></i> NOM-151 Acreditado
          </Badge>
        </div>

        {/* Tarjeta Principal */}
        <Card className="border-0 shadow-sm rounded-4 overflow-hidden mb-4">
          <CardBody className="p-4">
            <h4 className="fw-bold text-dark mb-1">{documentData?.name}</h4>
            <p className="text-muted fs-14 mb-3">
              Firmante invitado: <strong>{signer?.name}</strong> ({signer?.email}) &bull; <span className="badge bg-secondary-subtle text-secondary">{signer?.role}</span>
            </p>

            {error && <Alert color="danger" className="border-0 rounded-3">{error}</Alert>}
            {successMsg && (
              <Alert color="success" className="border-0 rounded-3 p-4 text-center">
                <i className="ri-checkbox-circle-fill display-4 text-success d-block mb-2"></i>
                <h5 className="fw-bold text-success">¡Documento Firmado Exitosamente!</h5>
                <p className="mb-0 text-muted">{successMsg}</p>
              </Alert>
            )}

            {/* Visor del Documento PDF */}
            <div className="border rounded-3 overflow-hidden mb-4" style={{ height: "420px", background: "#f8fafc" }}>
              <iframe
                src={`${API_URL}/public/documents/${documentData?.id}/file`}
                title={documentData?.name}
                width="100%"
                height="100%"
                style={{ border: "none" }}
              />
            </div>

            {/* Sección de Estampado de Firma */}
            {signer?.status !== "signed" ? (
              <div className="bg-white p-4 rounded-4 border">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <Label className="fw-bold text-dark mb-0 fs-15">
                    <i className="ri-edit-line me-1 text-primary"></i> Estampe su firma autógrafa digital abajo:
                  </Label>
                  <Button color="link" size="sm" className="text-danger text-decoration-none p-0" onClick={clearCanvas}>
                    <i className="ri-delete-bin-line me-1"></i> Borrar y Reintentar
                  </Button>
                </div>

                <div className="border rounded-3 p-1 bg-white mb-3" style={{ touchAction: "none" }}>
                  <canvas
                    ref={canvasRef}
                    width={700}
                    height={180}
                    style={{ width: "100%", height: "180px", cursor: "crosshair", background: "#f8fafc", borderRadius: "8px" }}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                </div>

                <Button
                  color="primary"
                  size="lg"
                  className="w-100 py-3 fw-bold rounded-3 shadow-sm"
                  onClick={handleSubmitSignature}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Spinner size="sm" className="me-2" /> Registrando Firma y Sellando NOM-151...
                    </>
                  ) : (
                    <>
                      <i className="ri-check-double-line me-2"></i> Confirmar y Firmar Documento Legal
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="text-center py-3">
                <Badge color="success" className="fs-14 p-2">
                  <i className="ri-check-line me-1"></i> Firma estampada correctamente el {signer?.signedAt ? new Date(signer.signedAt).toLocaleString() : "hoy"}
                </Badge>
              </div>
            )}
          </CardBody>
        </Card>
      </Container>
    </div>
  );
};

export default PublicSign;

import React, { useState, useEffect } from 'react';
import {
  Container, Row, Col, Card, CardBody, CardHeader, Table, Badge, Button, Alert
} from 'reactstrap';
import BreadCrumb from '../../Components/Common/BreadCrumb';

const Facturas = () => {
  document.title = "Facturación | Rubrícalo";

  const [planName, setPlanName] = useState("Estándar");
  const [planPrice, setPlanPrice] = useState("499");
  const [companyName, setCompanyName] = useState("Mi Empresa");
  const [rfc, setRfc] = useState("XAXX010101000");

  const [invoices, setInvoices] = useState([
    {
      id: "FACT-2026-0089",
      date: "01 Sep 2026",
      concept: "Suscripción Plan Estándar (Renovación Mensual)",
      amount: "$499.00 MXN",
      status: "Pagada",
      pdfUrl: "#",
      xmlUrl: "#"
    },
    {
      id: "FACT-2026-0054",
      date: "01 Ago 2026",
      concept: "Suscripción Plan Estándar (Renovación Mensual)",
      amount: "$499.00 MXN",
      status: "Pagada",
      pdfUrl: "#",
      xmlUrl: "#"
    },
    {
      id: "FACT-2026-0012",
      date: "01 Jul 2026",
      concept: "Suscripción Plan Estándar (Inicio de Contratación)",
      amount: "$499.00 MXN",
      status: "Pagada",
      pdfUrl: "#",
      xmlUrl: "#"
    }
  ]);

  useEffect(() => {
    const raw = sessionStorage.getItem("authUser") || localStorage.getItem("authUser");
    if (raw) {
      try {
        const obj = JSON.parse(raw);
        if (obj.tenant) {
          setCompanyName(obj.tenant.name || "Mi Empresa");
          const plan = obj.tenant.plan?.toLowerCase();
          if (plan === "pro") {
            setPlanName("Pro");
            setPlanPrice("1,299");
          } else if (plan === "enterprise") {
            setPlanName("Enterprise");
            setPlanPrice("2,999");
          }
        }
      } catch (e) {}
    }
  }, []);

  const handleDownloadInvoice = (invoiceId, type) => {
    alert(`Descargando comprobante fiscal ${invoiceId} en formato ${type.toUpperCase()}`);
  };

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="Facturación" pageTitle="Dashboard" />

          {/* TARJETA RESUMEN DE PLAN Y DATOS FISCALES */}
          <Row className="mb-4">
            <Col lg={7}>
              <Card className="shadow-sm border-0 h-100" style={{ borderRadius: "12px" }}>
                <CardBody className="p-4 d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <h5 className="fw-bold text-dark mb-0">Detalle de Suscripción Activa</h5>
                      <Badge color="success" className="p-2 fs-12">Suscripción Activa</Badge>
                    </div>
                    <div className="p-3 rounded bg-light border mb-3">
                      <Row>
                        <Col sm={6}>
                          <span className="text-muted fs-12 d-block">Plan Contratado</span>
                          <strong className="fs-16 text-primary" style={{ color: "#3d4ed8" }}>Plan {planName}</strong>
                        </Col>
                        <Col sm={6} className="text-sm-end">
                          <span className="text-muted fs-12 d-block">Monto Recurrente</span>
                          <strong className="fs-16 text-dark">${planPrice} MXN / mes</strong>
                        </Col>
                      </Row>
                    </div>
                    <p className="text-muted fs-13 mb-0">
                      <i className="ri-secure-payment-line me-1 text-success"></i> Cobros procesados de forma segura mediante <strong>Stripe Billing</strong>.
                    </p>
                  </div>
                </CardBody>
              </Card>
            </Col>

            <Col lg={5}>
              <Card className="shadow-sm border-0 h-100" style={{ borderRadius: "12px" }}>
                <CardBody className="p-4">
                  <h5 className="fw-bold text-dark mb-3">Datos de Facturación Registrados</h5>
                  <div className="mb-2">
                    <small className="text-muted d-block">Razón Social:</small>
                    <strong className="text-dark">{companyName}</strong>
                  </div>
                  <div className="mb-2">
                    <small className="text-muted d-block">RFC Registrado:</small>
                    <code className="fs-14 text-primary">{rfc}</code>
                  </div>
                  <div className="mb-0">
                    <small className="text-muted d-block">Uso de CFDI:</small>
                    <span className="fs-13">G03 - Gastos en general</span>
                  </div>
                </CardBody>
              </Card>
            </Col>
          </Row>

          {/* TABLA DE FACTURAS EMITIDAS */}
          <Row>
            <Col lg={12}>
              <Card className="shadow-sm border-0" style={{ borderRadius: "12px" }}>
                <CardHeader className="bg-white border-bottom p-3">
                  <h5 className="fw-bold text-dark mb-0">
                    <i className="ri-bill-line me-2 text-primary"></i>
                    Historial de Facturas y Comprobantes Fiscales (CFDI)
                  </h5>
                </CardHeader>
                <CardBody className="p-4">
                  <div className="table-responsive">
                    <Table className="table-hover align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Folio Factura</th>
                          <th>Fecha de Emisión</th>
                          <th>Concepto</th>
                          <th>Monto Total</th>
                          <th>Estado</th>
                          <th className="text-end">Comprobantes CFDI</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoices.map((inv) => (
                          <tr key={inv.id}>
                            <td><code className="fw-bold text-primary">{inv.id}</code></td>
                            <td>{inv.date}</td>
                            <td className="fw-medium">{inv.concept}</td>
                            <td className="fw-bold">{inv.amount}</td>
                            <td><Badge color="success">{inv.status}</Badge></td>
                            <td className="text-end">
                              <Button
                                size="sm"
                                color="light"
                                className="me-2 text-primary fw-bold"
                                onClick={() => handleDownloadInvoice(inv.id, "pdf")}
                              >
                                <i className="ri-file-pdf-line me-1"></i> PDF
                              </Button>
                              <Button
                                size="sm"
                                color="light"
                                className="text-success fw-bold"
                                onClick={() => handleDownloadInvoice(inv.id, "xml")}
                              >
                                <i className="ri-code-s-slash-line me-1"></i> XML
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default Facturas;

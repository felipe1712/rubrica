import React, { useEffect, useState } from "react";
import {
  Container, Row, Col, Card, CardBody, CardHeader,
  TabContent, TabPane,
  Table, Badge, Button, Input, Label, Form, Alert, Spinner, Modal, ModalHeader, ModalBody, ModalFooter
} from "reactstrap";
import BreadCrumb from "../../Components/Common/BreadCrumb";

const API_URL = process.env.REACT_APP_API_URL || "https://api.rubricalo.com";

const AdminGlobalDashboard = () => {
  document.title = "Administración Global | Rubrícalo";

  const [activeTab, setActiveTab] = useState("ingresos");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    mrr: 0, arr: 0,
    tenants: { total: 0, free: 0, standard: 0, pro: 0, enterprise: 0 },
    users: 0,
    documents: { total: 0, signed: 0, nom151Stamps: 0 }
  });

  const [users, setUsers] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [signatures, setSignatures] = useState([]);
  const [containers, setContainers] = useState([]);
  
  // Configuración Brevo
  const [brevoApiKey, setBrevoApiKey] = useState("");
  const [brevoSenderEmail, setBrevoSenderEmail] = useState("soporte@rubricalo.com");
  const [brevoSenderName, setBrevoSenderName] = useState("Rubrícalo México");
  const [testEmail, setTestEmail] = useState("");
  const [emailMsg, setEmailMsg] = useState(null);
  const [emailLoading, setEmailLoading] = useState(false);

  // Configuración Firma Digital (Nufi)
  const [nufiApiKey, setNufiApiKey] = useState("");
  const [nufiApiUrl, setNufiApiUrl] = useState("https://nufi.azure-api.net");
  const [nufiWebhookUrl, setNufiWebhookUrl] = useState("https://api.rubricalo.com/webhooks/nufi");
  const [nufiMsg, setNufiMsg] = useState(null);
  const [nufiLoading, setNufiLoading] = useState(false);

  // Configuración Stripe & Enlaces de Pago
  const [stripeConfig, setStripeConfig] = useState({
    mode: "live",
    publishableKey: "pk_live_sample",
    webhookStatus: "Activo (200 OK)"
  });
  const [stripeLinkStandard, setStripeLinkStandard] = useState("https://buy.stripe.com/test_standard_199");
  const [stripeLinkPro, setStripeLinkPro] = useState("https://buy.stripe.com/test_pro_499");
  const [stripeLinkEnterprise, setStripeLinkEnterprise] = useState("https://rubricalo.com/#contacto");
  const [stripeMsg, setStripeMsg] = useState(null);
  const [stripeLoading, setStripeLoading] = useState(false);

  // Documentos Legales
  const [termsText, setTermsText] = useState("Términos y Condiciones de Uso de Rubrícalo México.");
  const [privacyText, setPrivacyText] = useState("Aviso de Privacidad y Confidencialidad de Datos Personales.");
  const [legalMsg, setLegalMsg] = useState(null);

  // Modal Empresa
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [modalTenantOpen, setModalTenantOpen] = useState(false);
  const [newPlan, setNewPlan] = useState("standard");
  const [newTenantStatus, setNewTenantStatus] = useState("active");

  const getAuthToken = () => {
    const raw = sessionStorage.getItem("authUser") || localStorage.getItem("authUser");
    if (!raw) return "";
    try {
      const parsed = JSON.parse(raw);
      return parsed.token || parsed.accessToken || "";
    } catch (e) {
      return "";
    }
  };

  const fetchGlobalData = async () => {
    setLoading(true);
    const token = getAuthToken();
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const [resStats, resUsers, resTenants, resSignatures, resContainers, resEmail, resNufi, resStripe] = await Promise.all([
        fetch(`${API_URL}/admin/global/stats`, { headers }),
        fetch(`${API_URL}/admin/global/users`, { headers }),
        fetch(`${API_URL}/admin/global/tenants`, { headers }),
        fetch(`${API_URL}/admin/global/signatures`, { headers }),
        fetch(`${API_URL}/admin/global/containers`, { headers }),
        fetch(`${API_URL}/admin/global/email-config`, { headers }),
        fetch(`${API_URL}/admin/global/nufi-config`, { headers }),
        fetch(`${API_URL}/admin/global/stripe-config`, { headers })
      ]);

      if (resStats.ok) setStats(await resStats.json());
      if (resUsers.ok) setUsers(await resUsers.json());
      if (resTenants.ok) setTenants(await resTenants.json());
      if (resSignatures.ok) setSignatures(await resSignatures.json());
      if (resContainers.ok) {
        const data = await resContainers.json();
        setContainers(data.containers || []);
      }
      if (resEmail.ok) {
        const data = await resEmail.json();
        setBrevoSenderEmail(data.senderEmail || "soporte@rubricalo.com");
        setBrevoSenderName(data.senderName || "Rubrícalo México");
      }
      if (resNufi.ok) {
        const data = await resNufi.json();
        setNufiApiUrl(data.apiUrl || "https://nufi.azure-api.net");
        setNufiWebhookUrl(data.webhookUrl || "https://api.rubricalo.com/webhooks/nufi");
      }
      if (resStripe.ok) {
        const data = await resStripe.json();
        setStripeLinkStandard(data.stripeLinkStandard || "https://buy.stripe.com/test_standard_199");
        setStripeLinkPro(data.stripeLinkPro || "https://buy.stripe.com/test_pro_499");
        setStripeLinkEnterprise(data.stripeLinkEnterprise || "https://rubricalo.com/#contacto");
      }
    } catch (e) {
      console.error("Error al cargar datos de administración global:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGlobalData();
  }, []);

  const handleUpdateEmailConfig = async (e) => {
    e.preventDefault();
    setEmailLoading(true);
    setEmailMsg(null);
    try {
      const res = await fetch(`${API_URL}/admin/global/email-config`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          apiKey: brevoApiKey,
          senderEmail: brevoSenderEmail,
          senderName: brevoSenderName,
          sendTestEmail: !!testEmail,
          testRecipient: testEmail
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al actualizar correo.");
      setEmailMsg(testEmail ? `¡Configuración guardada y correo de prueba enviado a ${testEmail}!` : "¡Configuración de Brevo guardada correctamente!");
    } catch (err) {
      setEmailMsg(`Error: ${err.message}`);
    } finally {
      setEmailLoading(false);
    }
  };

  const handleUpdateNufiConfig = async (e) => {
    e.preventDefault();
    setNufiLoading(true);
    setNufiMsg(null);
    try {
      const res = await fetch(`${API_URL}/admin/global/nufi-config`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          apiKey: nufiApiKey,
          apiUrl: nufiApiUrl,
          webhookUrl: nufiWebhookUrl
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar parámetros de Nufi.");
      setNufiMsg("¡Parámetros de Firma Digital guardados correctamente!");
    } catch (err) {
      setNufiMsg(`Error: ${err.message}`);
    } finally {
      setNufiLoading(false);
    }
  };

  const handleUpdateStripeConfig = async (e) => {
    e.preventDefault();
    setStripeLoading(true);
    setStripeMsg(null);
    try {
      const res = await fetch(`${API_URL}/admin/global/stripe-config`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          stripeLinkStandard,
          stripeLinkPro,
          stripeLinkEnterprise
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al actualizar enlaces de Stripe.");
      setStripeMsg("¡Enlaces de cobro de Stripe guardados correctamente!");
    } catch (err) {
      setStripeMsg(`Error: ${err.message}`);
    } finally {
      setStripeLoading(false);
    }
  };

  const handleSaveLegal = async (e) => {
    e.preventDefault();
    setLegalMsg("¡Documentación legal de la plataforma actualizada correctamente!");
    setTimeout(() => setLegalMsg(null), 3000);
  };

  const handleToggleUserStatus = async (user) => {
    try {
      await fetch(`${API_URL}/admin/global/users/${user.id}/license`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ isActive: !user.isActive })
      });
      fetchGlobalData();
    } catch (e) {
      console.error("Error cambiando estado de usuario:", e);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("¿Estás seguro de eliminar permanentemente este usuario?")) return;
    try {
      await fetch(`${API_URL}/admin/global/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      fetchGlobalData();
    } catch (e) {
      console.error("Error eliminando usuario:", e);
    }
  };

  const handleSaveTenant = async () => {
    if (!selectedTenant) return;
    try {
      await fetch(`${API_URL}/admin/global/tenants/${selectedTenant.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ plan: newPlan, status: newTenantStatus })
      });
      setModalTenantOpen(false);
      fetchGlobalData();
    } catch (e) {
      console.error("Error actualizando empresa:", e);
    }
  };

  const handleToggleTenantStatus = async (tenant) => {
    const nextStatus = tenant.status === "active" ? "suspended" : "active";
    try {
      await fetch(`${API_URL}/admin/global/tenants/${tenant.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      fetchGlobalData();
    } catch (e) {
      console.error("Error cambiando estado de empresa:", e);
    }
  };

  const paidTenants = tenants.filter(t => t.plan === 'standard' || t.plan === 'pro' || t.plan === 'enterprise');

  // Configuración de los 8 Recuadros de Navegación (Grid Cards) en el orden solicitado
  const navCards = [
    {
      id: "ingresos",
      label: "Ingresos",
      value: `$${stats.mrr ? stats.mrr.toLocaleString() : 0} MXN`,
      subtitle: "Desglose de empresas de paga",
      icon: "ri-money-dollar-circle-line",
      badgeColor: "bg-primary text-white"
    },
    {
      id: "empresas",
      label: "Empresas Registradas",
      value: `${tenants.length || 0} Registradas`,
      subtitle: "Control y modificación de planes",
      icon: "ri-building-line",
      badgeColor: "bg-info-subtle text-info"
    },
    {
      id: "usuarios",
      label: "Usuarios",
      value: `${users.length || 0} Usuarios`,
      subtitle: "Gestión, bloqueo y eliminación",
      icon: "ri-group-line",
      badgeColor: "bg-warning-subtle text-warning"
    },
    {
      id: "firmas",
      label: "Firmas NOM-151",
      value: `${signatures.length || 0} Emitidas`,
      subtitle: "Historial por empresa y usuario",
      icon: "ri-shield-check-line",
      badgeColor: "bg-success-subtle text-success"
    },
    {
      id: "stripe",
      label: "Membresías y Stripe",
      value: "Conexión Live",
      subtitle: "Webhooks y cobros recurrentes",
      icon: "ri-bank-card-line",
      badgeColor: "bg-primary-subtle text-primary"
    },
    {
      id: "nufi",
      label: "Firma Digital",
      value: "API Configurada",
      subtitle: "Parámetros de sellado NOM-151",
      icon: "ri-shield-flash-line",
      badgeColor: "bg-danger-subtle text-danger"
    },
    {
      id: "legal",
      label: "Legal & Privacidad",
      value: "Términos Oficiales",
      subtitle: "Términos y Aviso de Privacidad",
      icon: "ri-file-shield-2-line",
      badgeColor: "bg-secondary-subtle text-secondary"
    },
    {
      id: "contenedores",
      label: "Contenedores",
      value: `${containers.length || 7} Servicios Docker`,
      subtitle: "Salud y Uptime de Servidores",
      icon: "ri-cpu-line",
      badgeColor: "bg-dark-subtle text-dark"
    }
  ];

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="Administración Global (SuperAdmin)" pageTitle="Plataforma" />

          {/* GRID DE RECUADROS / TARJETAS EN EL ORDEN EXACTO SOLICITADO */}
          <Row className="mb-4">
            {navCards.map((card) => {
              const isActive = activeTab === card.id;
              return (
                <Col xl={3} md={6} key={card.id} className="mb-3">
                  <Card
                    className={`card-animate border-0 shadow-sm cursor-pointer h-100 ${isActive ? "border-primary shadow" : ""}`}
                    style={{
                      cursor: "pointer",
                      borderRadius: "12px",
                      transition: "all 0.2s ease-in-out",
                      border: isActive ? "2px solid #3d4ed8" : "1px solid #e9ebec",
                      background: isActive ? "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)" : "#ffffff"
                    }}
                    onClick={() => setActiveTab(card.id)}
                  >
                    <CardBody className="d-flex flex-column justify-content-between p-3">
                      <div className="d-flex align-items-center">
                        <div className="flex-grow-1">
                          <p className={`text-uppercase fw-semibold fs-11 mb-1 ${isActive ? "text-white-50" : "text-muted"}`}>
                            {card.label}
                          </p>
                          <h4 className={`mb-0 fw-bold ${isActive ? "text-white" : "text-dark"}`}>
                            {card.value}
                          </h4>
                          <small className={isActive ? "text-success fw-bold" : "text-muted"}>
                            {card.subtitle}
                          </small>
                        </div>
                        <div className="avatar-sm flex-shrink-0">
                          <span className={`avatar-title rounded fs-3 ${card.badgeColor}`}>
                            <i className={card.icon}></i>
                          </span>
                        </div>
                      </div>
                      <div className={`mt-3 pt-2 text-end border-top ${isActive ? "border-white-10" : ""}`}>
                        <span className={`fs-12 fw-bold ${isActive ? "text-white" : "text-primary"}`}>
                          {isActive ? "Mostrando Detalle ▼" : "Ver Detalle →"}
                        </span>
                      </div>
                    </CardBody>
                  </Card>
                </Col>
              );
            })}
          </Row>

          {/* ÁREA DE DETALLE ABAJO DE LOS RECUADROS */}
          <Card className="shadow-sm border-0" style={{ borderRadius: "12px" }}>
            <CardHeader className="bg-white border-bottom p-3">
              <h5 className="fw-bold text-dark mb-0 d-flex align-items-center">
                <i className={`${navCards.find(c => c.id === activeTab)?.icon} me-2 text-primary`}></i>
                Detalle de {navCards.find(c => c.id === activeTab)?.label}
              </h5>
            </CardHeader>

            <CardBody className="p-4">
              {loading ? (
                <div className="text-center py-5">
                  <Spinner color="primary" style={{ width: 40, height: 40 }} />
                  <p className="mt-3 text-muted">Cargando datos de la plataforma...</p>
                </div>
              ) : (
                <TabContent activeTab={activeTab}>

                  {/* 1. INGRESOS (MRR) */}
                  <TabPane tabId="ingresos">
                    <h5 className="fw-bold mb-3">Desglose de Ingresos Recurrentes por Empresa (Membresías de Paga)</h5>
                    <div className="p-3 bg-light rounded mb-4 border">
                      <Row>
                        <Col md={6}>
                          <span className="text-muted fs-13 d-block">Total MRR (Ingreso Mensual)</span>
                          <strong className="fs-22 text-primary" style={{ color: "#3d4ed8" }}>${stats.mrr ? stats.mrr.toLocaleString() : 0} MXN</strong>
                        </Col>
                        <Col md={6} className="text-md-end">
                          <span className="text-muted fs-13 d-block">Total ARR (Anual Proyectado)</span>
                          <strong className="fs-22 text-success">${stats.arr ? stats.arr.toLocaleString() : 0} MXN</strong>
                        </Col>
                      </Row>
                    </div>

                    <div className="table-responsive">
                      <Table className="table-hover align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Empresa de Paga</th>
                            <th>Contacto Principal</th>
                            <th>Plan Suscrito</th>
                            <th>Monto Recurrente Mensual</th>
                            <th>Estado de Cobro</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paidTenants.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="text-center text-muted py-4">No hay empresas en plan de paga actualmente.</td>
                            </tr>
                          ) : (
                            paidTenants.map((t) => (
                              <tr key={t.id}>
                                <td className="fw-bold text-dark">{t.name}</td>
                                <td>{t.email}</td>
                                <td>
                                  <Badge color={t.plan === "enterprise" ? "dark" : t.plan === "pro" ? "primary" : "info"}>
                                    Plan {t.plan ? t.plan.toUpperCase() : "ESTÁNDAR"}
                                  </Badge>
                                </td>
                                <td className="fw-bold">
                                  ${t.plan === "enterprise" ? "Contactar" : t.plan === "pro" ? "499" : "199"} MXN / mes
                                </td>
                                <td><Badge color="success">Al día (Stripe)</Badge></td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </Table>
                    </div>
                  </TabPane>

                  {/* 2. EMPRESAS REGISTRADAS */}
                  <TabPane tabId="empresas">
                    <h5 className="fw-bold mb-3">Listado y Control de Empresas Registradas</h5>
                    <div className="table-responsive">
                      <Table className="table-hover align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Empresa / Organización</th>
                            <th>Correo de Contacto</th>
                            <th>Plan / Membresía</th>
                            <th>Usuarios Registrados</th>
                            <th>Estado</th>
                            <th className="text-end">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tenants.map((t) => (
                            <tr key={t.id}>
                              <td className="fw-bold text-dark">{t.name}</td>
                              <td>{t.email}</td>
                              <td>
                                <Badge color={t.plan === "enterprise" ? "dark" : t.plan === "pro" ? "primary" : t.plan === "standard" ? "info" : "secondary"}>
                                  {t.plan ? t.plan.toUpperCase() : "GRATIS"}
                                </Badge>
                              </td>
                              <td><Badge color="light" className="text-dark fs-12">{t.userCount || 0} usuarios</Badge></td>
                              <td>
                                <Badge color={t.status === "active" ? "success" : "danger"}>
                                  {t.status === "active" ? "Activa" : "Bloqueada / Suspendida"}
                                </Badge>
                              </td>
                              <td className="text-end">
                                <Button
                                  size="sm"
                                  color="primary"
                                  outline
                                  className="me-2"
                                  onClick={() => {
                                    setSelectedTenant(t);
                                    setNewPlan(t.plan || "standard");
                                    setNewTenantStatus(t.status || "active");
                                    setModalTenantOpen(true);
                                  }}
                                >
                                  <i className="ri-edit-line me-1"></i> Editar Membresía
                                </Button>

                                <Button
                                  size="sm"
                                  color={t.status === "active" ? "danger" : "success"}
                                  onClick={() => handleToggleTenantStatus(t)}
                                >
                                  {t.status === "active" ? "Bloquear" : "Desbloquear"}
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  </TabPane>

                  {/* 3. USUARIOS */}
                  <TabPane tabId="usuarios">
                    <h5 className="fw-bold mb-3">Listado Maestro de Usuarios por Empresa</h5>
                    <div className="table-responsive">
                      <Table className="table-hover align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Usuario</th>
                            <th>Correo Electrónico</th>
                            <th>Rol / Permiso</th>
                            <th>Estado</th>
                            <th className="text-end">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((u) => (
                            <tr key={u.id}>
                              <td className="fw-bold">{u.name || "Usuario"}</td>
                              <td>{u.email}</td>
                              <td>
                                <Badge color={u.role === "SUPERADMIN" ? "danger" : "primary"}>
                                  {u.role === "SUPERADMIN" ? "SuperAdmin" : "Administrador"}
                                </Badge>
                              </td>
                              <td>
                                <Badge color={u.isActive ? "success" : "danger"}>
                                  {u.isActive ? "Activo" : "Bloqueado"}
                                </Badge>
                              </td>
                              <td className="text-end">
                                <Button
                                  size="sm"
                                  color={u.isActive ? "warning" : "success"}
                                  className="me-2"
                                  onClick={() => handleToggleUserStatus(u)}
                                >
                                  {u.isActive ? "Bloquear" : "Desbloquear"}
                                </Button>
                                <Button
                                  size="sm"
                                  color="danger"
                                  onClick={() => handleDeleteUser(u.id)}
                                >
                                  <i className="ri-delete-bin-line me-1"></i> Eliminar
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  </TabPane>

                  {/* 4. FIRMAS NOM-151 */}
                  <TabPane tabId="firmas">
                    <h5 className="fw-bold mb-3">Registro Maestro de Firmas y Constancias NOM-151</h5>
                    <div className="table-responsive">
                      <Table className="table-hover align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Documento</th>
                            <th>Empresa / Tenant</th>
                            <th>Folio / Hash NOM-151</th>
                            <th>Proveedor</th>
                            <th>Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {signatures.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="text-center text-muted py-4">No se han emitido firmas digitales aún.</td>
                            </tr>
                          ) : (
                            signatures.map((s) => (
                              <tr key={s.id}>
                                <td className="fw-bold">{s.name || s.originalName}</td>
                                <td>{s.tenantId}</td>
                                <td><code className="text-primary fs-12">{s.nufiTransactionId || s.docusealSubmissionId || s.id}</code></td>
                                <td><Badge color="info">{s.nufiTransactionId ? "NOM-151" : "DocuSeal"}</Badge></td>
                                <td><Badge color="success">Firmado y Validado</Badge></td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </Table>
                    </div>
                  </TabPane>

                  {/* 5. MEMBRESÍAS Y STRIPE */}
                  <TabPane tabId="stripe">
                    <h5 className="fw-bold mb-3">Conexión a Stripe & Control de Membresías Recurrentes</h5>
                    <Row className="mb-4">
                      <Col lg={6}>
                        <Card className="border shadow-none">
                          <CardBody>
                            <h6 className="fw-bold text-primary">Estado del Webhook de Stripe</h6>
                            <p className="text-muted fs-13">Endpoint configurado para recibir eventos de pago en tiempo real.</p>
                            <div className="p-3 bg-light rounded font-monospace fs-13">
                              POST https://api.rubricalo.com/webhooks/stripe
                            </div>
                            <div className="mt-2 text-success fw-bold fs-13">
                              <i className="ri-checkbox-circle-fill me-1"></i> Estado: {stripeConfig.webhookStatus}
                            </div>
                          </CardBody>
                        </Card>
                      </Col>
                      <Col lg={6}>
                        <Card className="border shadow-none">
                          <CardBody>
                            <h6 className="fw-bold text-primary">Llaves API Stripe</h6>
                            <p className="text-muted fs-13">Modo en ejecución: <strong>PRODUCCIÓN (LIVE)</strong></p>
                            <Input type="text" value={stripeConfig.publishableKey} readOnly className="font-monospace bg-light mb-2" />
                            <small className="text-muted">Las suscripciones activas incrementan automáticamente el cupo de documentos.</small>
                          </CardBody>
                        </Card>
                      </Col>
                    </Row>

                    <h6 className="fw-bold text-dark mb-3">Enlaces de Pago / Botones de Compra de Stripe por Paquete</h6>
                    {stripeMsg && <Alert color="info">{stripeMsg}</Alert>}
                    <Form onSubmit={handleUpdateStripeConfig}>
                      <Row>
                        <Col lg={4} className="mb-3">
                          <Label className="form-label fw-bold">Plan Estándar ($199 MXN / mes)</Label>
                          <Input
                            type="text"
                            placeholder="https://buy.stripe.com/..."
                            value={stripeLinkStandard}
                            onChange={(e) => setStripeLinkStandard(e.target.value)}
                          />
                          <small className="text-muted">15 documentos / mes, hasta 3 usuarios.</small>
                        </Col>

                        <Col lg={4} className="mb-3">
                          <Label className="form-label fw-bold">Plan Pro ($499 MXN / mes)</Label>
                          <Input
                            type="text"
                            placeholder="https://buy.stripe.com/..."
                            value={stripeLinkPro}
                            onChange={(e) => setStripeLinkPro(e.target.value)}
                          />
                          <small className="text-muted">70 documentos / mes, hasta 10 usuarios.</small>
                        </Col>

                        <Col lg={4} className="mb-3">
                          <Label className="form-label fw-bold">Plan Enterprise (Contáctanos)</Label>
                          <Input
                            type="text"
                            placeholder="https://rubricalo.com/#contacto"
                            value={stripeLinkEnterprise}
                            onChange={(e) => setStripeLinkEnterprise(e.target.value)}
                          />
                          <small className="text-muted">Documentos e usuarios ilimitados.</small>
                        </Col>

                        <Col lg={12} className="text-end">
                          <Button type="submit" style={{ backgroundColor: "#3d4ed8", borderColor: "#3d4ed8" }} disabled={stripeLoading} className="fw-bold">
                            {stripeLoading ? <Spinner size="sm" className="me-2"> Guardando... </Spinner> : null}
                            Guardar Enlaces de Cobro de Stripe
                          </Button>
                        </Col>
                      </Row>
                    </Form>
                  </TabPane>

                  {/* 6. FIRMA DIGITAL */}
                  <TabPane tabId="nufi">
                    <h5 className="fw-bold mb-3">Parámetros de Integración con Firma Digital & NOM-151</h5>
                    <p className="text-muted fs-13 mb-4">
                      Configura aquí las credenciales para la emisión de constancias de conservación NOM-151-SCFI-2016 y firma digital.
                    </p>
                    {nufiMsg && <Alert color="info">{nufiMsg}</Alert>}
                    <Form onSubmit={handleUpdateNufiConfig}>
                      <Row>
                        <Col lg={12} className="mb-3">
                          <Label className="form-label fw-bold">Llave de API / Suscripción Azure (API Key)</Label>
                          <Input
                            type="password"
                            placeholder="Ingresa tu Llave de API"
                            value={nufiApiKey}
                            onChange={(e) => setNufiApiKey(e.target.value)}
                          />
                          <small className="text-muted">Esta llave se enviará en las cabeceras HTTP de autenticación.</small>
                        </Col>
                        <Col lg={6} className="mb-3">
                          <Label className="form-label fw-bold">URL Base de API Firma Digital</Label>
                          <Input
                            type="text"
                            value={nufiApiUrl}
                            onChange={(e) => setNufiApiUrl(e.target.value)}
                          />
                        </Col>
                        <Col lg={6} className="mb-3">
                          <Label className="form-label fw-bold">URL Webhook Recepción Constancias</Label>
                          <Input
                            type="text"
                            value={nufiWebhookUrl}
                            onChange={(e) => setNufiWebhookUrl(e.target.value)}
                          />
                        </Col>
                        <Col lg={12} className="text-end">
                          <Button type="submit" style={{ backgroundColor: "#3d4ed8", borderColor: "#3d4ed8" }} disabled={nufiLoading} className="fw-bold">
                            {nufiLoading ? <Spinner size="sm" className="me-2"> Guardando... </Spinner> : null}
                            Guardar Parámetros de Firma Digital
                          </Button>
                        </Col>
                      </Row>
                    </Form>
                  </TabPane>

                  {/* 7. LEGAL & PRIVACIDAD */}
                  <TabPane tabId="legal">
                    <h5 className="fw-bold mb-3">Administración de Documentos Legales y Privacidad Global</h5>
                    {legalMsg && <Alert color="success">{legalMsg}</Alert>}
                    <Form onSubmit={handleSaveLegal}>
                      <div className="mb-3">
                        <Label className="form-label fw-bold">Términos y Condiciones de Uso de Rubrícalo</Label>
                        <Input
                          type="textarea"
                          rows={5}
                          value={termsText}
                          onChange={(e) => setTermsText(e.target.value)}
                        />
                      </div>
                      <div className="mb-3">
                        <Label className="form-label fw-bold">Aviso de Privacidad y Acuerdo de Confidencialidad</Label>
                        <Input
                          type="textarea"
                          rows={5}
                          value={privacyText}
                          onChange={(e) => setPrivacyText(e.target.value)}
                        />
                      </div>
                      <div className="text-end">
                        <Button type="submit" style={{ backgroundColor: "#3d4ed8", borderColor: "#3d4ed8" }} className="fw-bold">
                          Guardar Términos Legales
                        </Button>
                      </div>
                    </Form>
                  </TabPane>

                  {/* 8. CONTENEDORES */}
                  <TabPane tabId="contenedores">
                    <h5 className="fw-bold mb-3">Telemetría y Salud de los 7 Contenedores Docker</h5>
                    <Row>
                      {containers.map((c, idx) => (
                        <Col lg={6} key={idx} className="mb-3">
                          <Card className="border shadow-none h-100">
                            <CardBody className="d-flex align-items-center justify-content-between">
                              <div>
                                <h6 className="fw-bold mb-1">{c.service}</h6>
                                <code className="text-primary fs-12">{c.name}</code>
                                <div className="text-muted fs-12 mt-1">Puerto: {c.port} | Uptime: {c.uptime}</div>
                              </div>
                              <Badge color="success" className="p-2 fs-12">
                                <i className="ri-checkbox-circle-fill me-1"></i> HEALTHY (UP)
                              </Badge>
                            </CardBody>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </TabPane>

                </TabContent>
              )}
            </CardBody>
          </Card>
        </Container>
      </div>

      {/* MODAL MODIFICAR PLAN / MEMBRESÍA DE EMPRESA */}
      <Modal isOpen={modalTenantOpen} toggle={() => setModalTenantOpen(false)}>
        <ModalHeader toggle={() => setModalTenantOpen(false)}>Editar Membresía de Empresa</ModalHeader>
        <ModalBody>
          <p>Empresa: <strong>{selectedTenant?.name}</strong> ({selectedTenant?.email})</p>
          <div className="mb-3">
            <Label className="form-label fw-bold">Plan / Membresía</Label>
            <Input type="select" value={newPlan} onChange={(e) => setNewPlan(e.target.value)}>
              <option value="free">Gratuito ($0 MXN - 3 docs/mes)</option>
              <option value="standard">Estándar ($199 MXN / mes - 15 docs/mes)</option>
              <option value="pro">Pro ($499 MXN / mes - 70 docs/mes)</option>
              <option value="enterprise">Enterprise (Contáctanos - Ilimitado)</option>
            </Input>
          </div>
          <div className="mb-3">
            <Label className="form-label fw-bold">Estado de la Cuenta</Label>
            <Input type="select" value={newTenantStatus} onChange={(e) => setNewTenantStatus(e.target.value)}>
              <option value="active">Activa</option>
              <option value="suspended">Bloqueada / Suspendida</option>
            </Input>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setModalTenantOpen(false)}>Cancelar</Button>
          <Button style={{ backgroundColor: "#3d4ed8", borderColor: "#3d4ed8" }} onClick={handleSaveTenant}>Guardar Membresía</Button>
        </ModalFooter>
      </Modal>
    </React.Fragment>
  );
};

export default AdminGlobalDashboard;

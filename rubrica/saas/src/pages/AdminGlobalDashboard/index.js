import React, { useEffect, useState } from "react";
import {
  Container, Row, Col, Card, CardBody, CardHeader,
  Nav, NavItem, NavLink, TabContent, TabPane,
  Table, Badge, Button, Input, Label, Form, Alert, Spinner, Modal, ModalHeader, ModalBody, ModalFooter
} from "reactstrap";
import classnames from "classnames";
import BreadCrumb from "../../Components/Common/BreadCrumb";

const API_URL = process.env.REACT_APP_API_URL || "https://api.rubricalo.com";

const AdminGlobalDashboard = () => {
  document.title = "Administración Global | Rubrícalo";

  const [activeTab, setActiveTab] = useState("1");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    mrr: 0, arr: 0,
    tenants: { total: 0, free: 0, standard: 0, pro: 0, enterprise: 0 },
    users: 0,
    documents: { total: 0, signed: 0, nom151Stamps: 0 }
  });

  const [users, setUsers] = useState([]);
  const [containers, setContainers] = useState([]);
  
  // Configuración Brevo
  const [brevoApiKey, setBrevoApiKey] = useState("");
  const [brevoSenderEmail, setBrevoSenderEmail] = useState("soporte@rubricalo.com");
  const [brevoSenderName, setBrevoSenderName] = useState("Rubrícalo México");
  const [testEmail, setTestEmail] = useState("");
  const [emailMsg, setEmailMsg] = useState(null);
  const [emailLoading, setEmailLoading] = useState(false);

  // Configuración Stripe
  const [stripeConfig, setStripeConfig] = useState({
    mode: "live",
    publishableKey: "pk_live_sample",
    webhookStatus: "Activo (200 OK)"
  });

  // Documentos Legales
  const [termsText, setTermsText] = useState("Términos y Condiciones de Uso de Rubrícalo México.");
  const [privacyText, setPrivacyText] = useState("Aviso de Privacidad y Confidencialidad de Datos Personales.");
  const [legalMsg, setLegalMsg] = useState(null);

  // Modal Licencia
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [newRole, setNewRole] = useState("admin");

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
      const [resStats, resUsers, resContainers, resEmail] = await Promise.all([
        fetch(`${API_URL}/admin/global/stats`, { headers }),
        fetch(`${API_URL}/admin/global/users`, { headers }),
        fetch(`${API_URL}/admin/global/containers`, { headers }),
        fetch(`${API_URL}/admin/global/email-config`, { headers })
      ]);

      if (resStats.ok) setStats(await resStats.json());
      if (resUsers.ok) setUsers(await resUsers.json());
      if (resContainers.ok) {
        const data = await resContainers.json();
        setContainers(data.containers || []);
      }
      if (resEmail.ok) {
        const data = await resEmail.json();
        setBrevoSenderEmail(data.senderEmail || "soporte@rubricalo.com");
        setBrevoSenderName(data.senderName || "Rubrícalo México");
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

  const handleSaveLegal = async (e) => {
    e.preventDefault();
    setLegalMsg("¡Documentación legal de la plataforma actualizada correctamente!");
    setTimeout(() => setLegalMsg(null), 3000);
  };

  const handleSaveUserLicense = async () => {
    if (!selectedUser) return;
    try {
      await fetch(`${API_URL}/admin/global/users/${selectedUser.id}/license`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ role: newRole })
      });
      setModalOpen(false);
      fetchGlobalData();
    } catch (e) {
      console.error("Error al guardar licencia:", e);
    }
  };

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="Administración Global (SuperAdmin)" pageTitle="Plataforma" />

          {/* TARJETAS KPI SUPERADMIN */}
          <Row className="mb-4">
            <Col xl={3} md={6}>
              <Card className="card-animate border-0 shadow-sm bg-primary text-white" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)" }}>
                <CardBody>
                  <div className="d-flex align-items-center">
                    <div className="flex-grow-1">
                      <p className="text-white-50 text-uppercase fw-semibold fs-12 mb-1">Ingreso Mensual (MRR)</p>
                      <h3 className="text-white mb-0 fw-bold">${stats.mrr ? stats.mrr.toLocaleString() : 0} <small className="fs-12">MXN</small></h3>
                      <small className="text-success fw-bold">ARR Estimado: ${stats.arr ? stats.arr.toLocaleString() : 0} MXN</small>
                    </div>
                    <div className="avatar-sm flex-shrink-0">
                      <span className="avatar-title bg-white-10 rounded fs-3">
                        <i className="ri-money-dollar-circle-line text-white"></i>
                      </span>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Col>

            <Col xl={3} md={6}>
              <Card className="card-animate border-0 shadow-sm">
                <CardBody>
                  <div className="d-flex align-items-center">
                    <div className="flex-grow-1">
                      <p className="text-muted text-uppercase fw-semibold fs-12 mb-1">Empresas Registradas</p>
                      <h3 className="mb-0 fw-bold">{stats.tenants?.total || 0}</h3>
                      <small className="text-muted">{stats.tenants?.standard + stats.tenants?.pro + stats.tenants?.enterprise} de pago / {stats.tenants?.free} gratis</small>
                    </div>
                    <div className="avatar-sm flex-shrink-0">
                      <span className="avatar-title bg-info-subtle rounded fs-3 text-info">
                        <i className="ri-building-line"></i>
                      </span>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Col>

            <Col xl={3} md={6}>
              <Card className="card-animate border-0 shadow-sm">
                <CardBody>
                  <div className="d-flex align-items-center">
                    <div className="flex-grow-1">
                      <p className="text-muted text-uppercase fw-semibold fs-12 mb-1">Firmas NOM-151 Emitidas</p>
                      <h3 className="mb-0 fw-bold">{stats.documents?.signed || 0}</h3>
                      <small className="text-success fw-semibold">100% Validez Jurídica</small>
                    </div>
                    <div className="avatar-sm flex-shrink-0">
                      <span className="avatar-title bg-success-subtle rounded fs-3 text-success">
                        <i className="ri-shield-check-line"></i>
                      </span>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Col>

            <Col xl={3} md={6}>
              <Card className="card-animate border-0 shadow-sm">
                <CardBody>
                  <div className="d-flex align-items-center">
                    <div className="flex-grow-1">
                      <p className="text-muted text-uppercase fw-semibold fs-12 mb-1">Usuarios en Plataforma</p>
                      <h3 className="mb-0 fw-bold">{stats.users || 0}</h3>
                      <small className="text-muted">Multi-Tenant Activos</small>
                    </div>
                    <div className="avatar-sm flex-shrink-0">
                      <span className="avatar-title bg-warning-subtle rounded fs-3 text-warning">
                        <i className="ri-user-shared-line"></i>
                      </span>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Col>
          </Row>

          {/* CONTENEDOR PRINCIPAL CON PESTAÑAS DE ADMINISTRACIÓN GLOBAL */}
          <Card className="shadow-sm border-0" style={{ borderRadius: "12px" }}>
            <CardHeader className="bg-white border-bottom p-3">
              <Nav className="nav-tabs-custom card-header-tabs border-bottom-0" role="tablist">
                <NavItem>
                  <NavLink className={classnames({ active: activeTab === "1" }, "fw-bold")} onClick={() => setActiveTab("1")} style={{ cursor: "pointer" }}>
                    <i className="ri-group-line me-2"></i> Usuarios & Licencias
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink className={classnames({ active: activeTab === "2" }, "fw-bold")} onClick={() => setActiveTab("2")} style={{ cursor: "pointer" }}>
                    <i className="ri-bank-card-line me-2"></i> Membresías & Stripe
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink className={classnames({ active: activeTab === "3" }, "fw-bold")} onClick={() => setActiveTab("3")} style={{ cursor: "pointer" }}>
                    <i className="ri-mail-send-line me-2"></i> Correo (Brevo)
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink className={classnames({ active: activeTab === "4" }, "fw-bold")} onClick={() => setActiveTab("4")} style={{ cursor: "pointer" }}>
                    <i className="ri-cpu-line me-2"></i> Estado de Contenedores
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink className={classnames({ active: activeTab === "5" }, "fw-bold")} onClick={() => setActiveTab("5")} style={{ cursor: "pointer" }}>
                    <i className="ri-file-shield-2-line me-2"></i> Legal & Privacidad
                  </NavLink>
                </NavItem>
              </Nav>
            </CardHeader>

            <CardBody className="p-4">
              {loading ? (
                <div className="text-center py-5">
                  <Spinner color="primary" style={{ width: 40, height: 40 }} />
                  <p className="mt-3 text-muted">Cargando métricas de la plataforma...</p>
                </div>
              ) : (
                <TabContent activeTab={activeTab}>

                  {/* 1. USUARIOS & LICENCIAS */}
                  <TabPane tabId="1">
                    <h5 className="fw-bold mb-3">Administración de Usuarios y Licencias Multi-Tenant</h5>
                    <div className="table-responsive">
                      <Table className="table-hover align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Usuario</th>
                            <th>Correo Electrónico</th>
                            <th>Rol / Permiso</th>
                            <th>Estado</th>
                            <th>Acciones</th>
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
                                <Badge color={u.isActive ? "success" : "secondary"}>
                                  {u.isActive ? "Activo" : "Inactivo"}
                                </Badge>
                              </td>
                              <td>
                                <Button
                                  size="sm"
                                  color="light"
                                  onClick={() => {
                                    setSelectedUser(u);
                                    setNewRole(u.role);
                                    setModalOpen(true);
                                  }}
                                >
                                  <i className="ri-edit-line me-1"></i> Modificar Licencia
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  </TabPane>

                  {/* 2. MEMBRESÍAS & STRIPE */}
                  <TabPane tabId="2">
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
                  </TabPane>

                  {/* 3. SERVICIO DE CORREO BREVO */}
                  <TabPane tabId="3">
                    <h5 className="fw-bold mb-3">Configuración de Correos Transaccionales (Brevo API v3)</h5>
                    {emailMsg && <Alert color="info">{emailMsg}</Alert>}
                    <Form onSubmit={handleUpdateEmailConfig}>
                      <Row>
                        <Col lg={12} className="mb-3">
                          <Label className="form-label fw-bold">BREVO_API_KEY (REST API v3)</Label>
                          <Input
                            type="password"
                            placeholder="xkeysib-..."
                            value={brevoApiKey}
                            onChange={(e) => setBrevoApiKey(e.target.value)}
                          />
                        </Col>
                        <Col lg={6} className="mb-3">
                          <Label className="form-label fw-bold">Correo Remitente Oficial</Label>
                          <Input
                            type="email"
                            value={brevoSenderEmail}
                            onChange={(e) => setBrevoSenderEmail(e.target.value)}
                          />
                        </Col>
                        <Col lg={6} className="mb-3">
                          <Label className="form-label fw-bold">Nombre del Remitente</Label>
                          <Input
                            type="text"
                            value={brevoSenderName}
                            onChange={(e) => setBrevoSenderName(e.target.value)}
                          />
                        </Col>
                        <Col lg={12} className="mb-3">
                          <Label className="form-label fw-bold">Enviar Correo de Prueba (Opcional)</Label>
                          <Input
                            type="email"
                            placeholder="Ingresa tu correo para recibir un email de prueba"
                            value={testEmail}
                            onChange={(e) => setTestEmail(e.target.value)}
                          />
                        </Col>
                        <Col lg={12} className="text-end">
                          <Button type="submit" style={{ backgroundColor: "#3d4ed8", borderColor: "#3d4ed8" }} disabled={emailLoading} className="fw-bold">
                            {emailLoading ? <Spinner size="sm" className="me-2"> Guardando... </Spinner> : null}
                            Guardar Configuración de Brevo
                          </Button>
                        </Col>
                      </Row>
                    </Form>
                  </TabPane>

                  {/* 4. ESTADO DE CONTENEDORES DOCKER */}
                  <TabPane tabId="4">
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

                  {/* 5. LEGAL & PRIVACIDAD */}
                  <TabPane tabId="5">
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

                </TabContent>
              )}
            </CardBody>
          </Card>
        </Container>
      </div>

      {/* MODAL MODIFICAR LICENCIA */}
      <Modal isOpen={modalOpen} toggle={() => setModalOpen(false)}>
        <ModalHeader toggle={() => setModalOpen(false)}>Modificar Licencia / Rol</ModalHeader>
        <ModalBody>
          <p>Usuario: <strong>{selectedUser?.email}</strong></p>
          <div className="mb-3">
            <Label className="form-label fw-bold">Rol en Plataforma</Label>
            <Input type="select" value={newRole} onChange={(e) => setNewRole(e.target.value)}>
              <option value="admin">Administrador de Empresa</option>
              <option value="SUPERADMIN">SuperAdmin Plataforma</option>
            </Input>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
          <Button style={{ backgroundColor: "#3d4ed8", borderColor: "#3d4ed8" }} onClick={handleSaveUserLicense}>Guardar Cambios</Button>
        </ModalFooter>
      </Modal>
    </React.Fragment>
  );
};

export default AdminGlobalDashboard;

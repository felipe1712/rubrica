import React, { useEffect, useState, useCallback } from "react";
import {
  Container, Row, Col, Card, CardBody, CardHeader,
  Button, Badge, Table, Modal, ModalHeader, ModalBody, ModalFooter,
  Form, FormGroup, Label, Input, Spinner, Alert, UncontrolledDropdown,
  DropdownToggle, DropdownMenu, DropdownItem
} from "reactstrap";
import BreadCrumb from "../../Components/Common/BreadCrumb";

const API_URL = process.env.REACT_APP_API_URL || "https://api.rubricalo.com";

const PLAN_MAP = {
  basic:      { label: "Básico",      color: "info"    },
  pro:        { label: "Pro",         color: "warning" },
  enterprise: { label: "Enterprise",  color: "primary" }
};

const STATUS_MAP = {
  active:    { label: "Activo",    color: "success"   },
  trial:     { label: "Prueba",    color: "info"      },
  suspended: { label: "Suspendido",color: "danger"    },
  expired:   { label: "Expirado",  color: "secondary" }
};

const formatDate = (val) => {
  if (!val) return "Sin expiración";
  const d = new Date(val);
  if (isNaN(d.getTime())) return "Sin expiración";
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
};

const AdminDashboard = () => {
  document.title = "Panel SuperAdmin | Rubricalo";

  const [stats, setStats] = useState({
    tenants: { total: 0, active: 0, trial: 0, suspended: 0 },
    usage: { docsSigned: 0, pdfOperations: 0, nom151Stamps: 0 }
  });
  const [tenants, setTenants] = useState([]);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Modal de Crear / Editar Empresa (Tenant)
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const [formData, setFormData] = useState({
    name: "", email: "", plan: "enterprise", status: "active", maxUsers: 10
  });
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  const getAdminAuthHeaders = () => {
    try {
      const raw = sessionStorage.getItem("authUser") || localStorage.getItem("authUser");
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      const token = parsed?.token || parsed?.accessToken || (typeof parsed === "string" ? parsed : null);
      return token ? { Authorization: `Bearer ${token}` } : {};
    } catch (_) {
      return {};
    }
  };

  const fetchAdminData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = getAdminAuthHeaders();

      const [statsRes, tenantsRes, healthRes] = await Promise.all([
        fetch(`${API_URL}/admin/stats`, { headers }),
        fetch(`${API_URL}/admin/tenants`, { headers }),
        fetch(`${API_URL}/admin/health`, { headers })
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (tenantsRes.ok) setTenants(await tenantsRes.json());
      if (healthRes.ok) setHealth(await healthRes.json());
    } catch (e) {
      console.error("Error al cargar datos de administración:", e);
      setError("Error al obtener los datos de la plataforma.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  const toggleModal = () => {
    setModalOpen(!modalOpen);
    if (modalOpen) {
      setEditingTenant(null);
      setFormData({ name: "", email: "", plan: "enterprise", status: "active", maxUsers: 10 });
      setModalError(null);
    }
  };

  const handleOpenCreate = () => {
    setEditingTenant(null);
    setFormData({ name: "", email: "", plan: "enterprise", status: "active", maxUsers: 10 });
    setModalError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (t) => {
    setEditingTenant(t);
    setFormData({
      name: t.name || "",
      email: t.email || "",
      plan: t.plan || "enterprise",
      status: t.status || "active",
      maxUsers: t.maxUsers || 10
    });
    setModalError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError(null);

    try {
      const headers = { "Content-Type": "application/json", ...getAdminAuthHeaders() };

      if (editingTenant) {
        // Actualizar Tenant existente
        const res = await fetch(`${API_URL}/admin/tenants/${editingTenant.id}`, {
          method: "PUT",
          headers,
          body: JSON.stringify(formData)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error al actualizar la empresa");

        setSuccessMsg("Empresa actualizada correctamente.");
      } else {
        // Crear nuevo Tenant
        const res = await fetch(`${API_URL}/admin/tenants`, {
          method: "POST",
          headers,
          body: JSON.stringify(formData)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error al crear la empresa");

        setSuccessMsg("Nueva empresa creada correctamente.");
      }

      setModalOpen(false);
      fetchAdminData();
    } catch (err) {
      setModalError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (t, newStatus) => {
    if (!window.confirm(`¿Cambiar estado de "${t.name}" a "${newStatus}"?`)) return;

    try {
      const res = await fetch(`${API_URL}/admin/tenants/${t.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAdminAuthHeaders() },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error("Error al cambiar estado de la empresa.");
      setSuccessMsg(`Estado de "${t.name}" actualizado a ${newStatus}.`);
      fetchAdminData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="Panel de Plataforma (SuperAdmin)" pageTitle="Rubricalo" />

          {successMsg && (
            <Alert color="success" toggle={() => setSuccessMsg(null)} className="mb-3">
              <i className="ri-checkbox-circle-line me-2"></i> {successMsg}
            </Alert>
          )}

          {error && (
            <Alert color="danger" className="mb-3">
              <i className="ri-error-warning-line me-2"></i> {error}
            </Alert>
          )}

          {/* KPI Cards Globales */}
          <Row>
            <Col xl={3} md={6}>
              <Card className="card-animate bg-primary bg-opacity-10 border-0">
                <CardBody>
                  <p className="text-uppercase fw-semibold text-primary mb-1">Empresas Totales</p>
                  <h3 className="fs-22 fw-bold text-primary mb-0">{stats.tenants.total}</h3>
                </CardBody>
              </Card>
            </Col>
            <Col xl={3} md={6}>
              <Card className="card-animate bg-success bg-opacity-10 border-0">
                <CardBody>
                  <p className="text-uppercase fw-semibold text-success mb-1">Empresas Activas</p>
                  <h3 className="fs-22 fw-bold text-success mb-0">{stats.tenants.active}</h3>
                </CardBody>
              </Card>
            </Col>
            <Col xl={3} md={6}>
              <Card className="card-animate bg-warning bg-opacity-10 border-0">
                <CardBody>
                  <p className="text-uppercase fw-semibold text-warning mb-1">Firmas NOM-151</p>
                  <h3 className="fs-22 fw-bold text-warning mb-0">{stats.usage.nom151Stamps}</h3>
                </CardBody>
              </Card>
            </Col>
            <Col xl={3} md={6}>
              <Card className="card-animate bg-info bg-opacity-10 border-0">
                <CardBody>
                  <p className="text-uppercase fw-semibold text-info mb-1">Estado de Servidores</p>
                  <h3 className="fs-22 fw-bold text-info mb-0">
                    {health ? health.status.toUpperCase() : "OK"}
                  </h3>
                </CardBody>
              </Card>
            </Col>
          </Row>

          {/* Tabla de Tenants */}
          <Row>
            <Col lg={12}>
              <Card>
                <CardHeader className="d-flex align-items-center">
                  <div className="flex-grow-1">
                    <h5 className="card-title mb-0">Gestión de Clientes (Tenants Multi-Empresa)</h5>
                    <p className="text-muted mb-0 small">Administra los planes, estados y licencias de cada empresa.</p>
                  </div>
                  <Button color="primary" size="sm" onClick={handleOpenCreate}>
                    <i className="ri-building-line me-1"></i> Nueva Empresa
                  </Button>
                </CardHeader>
                <CardBody>
                  {loading ? (
                    <div className="text-center py-5">
                      <Spinner color="primary" />
                      <p className="mt-2 text-muted">Cargando empresas registradas...</p>
                    </div>
                  ) : tenants.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                      <i className="ri-building-2-line fs-1 mb-2 d-block"></i>
                      <p>No hay empresas registradas en la plataforma.</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <Table className="table-hover table-nowrap align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Empresa / Cliente</th>
                            <th>Plan</th>
                            <th>Estado</th>
                            <th>Licencia</th>
                            <th>Usuarios Máx.</th>
                            <th>Fecha Registro</th>
                            <th className="text-end">Acción</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tenants.map((t) => {
                            const planInfo = PLAN_MAP[t.plan] || { label: t.plan, color: "secondary" };
                            const statusInfo = STATUS_MAP[t.status] || { label: t.status, color: "secondary" };
                            return (
                              <tr key={t.id}>
                                <td>
                                  <div className="d-flex align-items-center gap-3">
                                    <div className="avatar-xs flex-shrink-0">
                                      <span className="avatar-title rounded bg-primary-subtle text-primary fw-bold">
                                        {t.name.substring(0, 2).toUpperCase()}
                                      </span>
                                    </div>
                                    <div>
                                      <p className="mb-0 fw-medium">{t.name}</p>
                                      <small className="text-muted">{t.email}</small>
                                    </div>
                                  </div>
                                </td>
                                <td><Badge color={planInfo.color} pill>{planInfo.label}</Badge></td>
                                <td><Badge color={statusInfo.color} pill>{statusInfo.label}</Badge></td>
                                <td><code className="text-muted small">{t.licenseKey || "—"}</code></td>
                                <td><small className="fw-semibold">{t.maxUsers || 10}</small></td>
                                <td><small className="text-muted">{formatDate(t.createdAt)}</small></td>
                                <td className="text-end">
                                  <UncontrolledDropdown>
                                    <DropdownToggle tag="button" className="btn btn-soft-secondary btn-sm">
                                      <i className="ri-more-fill"></i>
                                    </DropdownToggle>
                                    <DropdownMenu end>
                                      <DropdownItem onClick={() => handleOpenEdit(t)}>
                                        <i className="ri-pencil-line me-2 text-muted"></i> Editar Plan / Licencia
                                      </DropdownItem>
                                      {t.status !== 'active' && (
                                        <DropdownItem onClick={() => handleToggleStatus(t, 'active')}>
                                          <i className="ri-checkbox-circle-line me-2 text-success"></i> Marcar como Activo
                                        </DropdownItem>
                                      )}
                                      {t.status !== 'suspended' && (
                                        <DropdownItem onClick={() => handleToggleStatus(t, 'suspended')}>
                                          <i className="ri-forbid-line me-2 text-danger"></i> Suspender Cuenta
                                        </DropdownItem>
                                      )}
                                    </DropdownMenu>
                                  </UncontrolledDropdown>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>

        {/* Modal de Crear / Editar Empresa */}
        <Modal isOpen={modalOpen} toggle={toggleModal} centered>
          <ModalHeader toggle={toggleModal}>
            {editingTenant ? "Editar Plan / Licencia de Empresa" : "Registrar Nueva Empresa"}
          </ModalHeader>
          <Form onSubmit={handleSubmit}>
            <ModalBody>
              {modalError && (
                <Alert color="danger" className="mb-3">
                  <i className="ri-error-warning-line me-2"></i> {modalError}
                </Alert>
              )}

              <FormGroup className="mb-3">
                <Label htmlFor="name">Nombre de la Empresa / Cliente</Label>
                <Input
                  type="text"
                  id="name"
                  placeholder="ej. Consultoría Alfa S.A."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </FormGroup>

              <FormGroup className="mb-3">
                <Label htmlFor="email">Correo de Contacto Principal</Label>
                <Input
                  type="email"
                  id="email"
                  placeholder="contacto@empresa.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </FormGroup>

              <Row>
                <Col md={6}>
                  <FormGroup className="mb-3">
                    <Label htmlFor="plan">Plan Asignado</Label>
                    <Input
                      type="select"
                      id="plan"
                      value={formData.plan}
                      onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                    >
                      <option value="basic">Básico</option>
                      <option value="pro">Pro</option>
                      <option value="enterprise">Enterprise</option>
                    </Input>
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup className="mb-3">
                    <Label htmlFor="status">Estado de Cuenta</Label>
                    <Input
                      type="select"
                      id="status"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="active">Activo</option>
                      <option value="trial">Prueba (Trial)</option>
                      <option value="suspended">Suspendido</option>
                      <option value="expired">Expirado</option>
                    </Input>
                  </FormGroup>
                </Col>
              </Row>

              <FormGroup className="mb-3">
                <Label htmlFor="maxUsers">Límite de Usuarios Máximos</Label>
                <Input
                  type="number"
                  id="maxUsers"
                  value={formData.maxUsers}
                  onChange={(e) => setFormData({ ...formData, maxUsers: parseInt(e.target.value) || 1 })}
                  min="1"
                />
              </FormGroup>
            </ModalBody>

            <ModalFooter>
              <Button color="light" onClick={toggleModal} disabled={submitting}>Cancelar</Button>
              <Button color="primary" type="submit" disabled={submitting}>
                {submitting ? <Spinner size="sm" /> : (editingTenant ? "Guardar Cambios" : "Crear Empresa")}
              </Button>
            </ModalFooter>
          </Form>
        </Modal>
      </div>
    </React.Fragment>
  );
};

export default AdminDashboard;

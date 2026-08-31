import React, { useEffect, useState, useCallback } from "react";
import {
  Container, Row, Col, Card, CardBody, CardHeader,
  Button, Badge, Table, Modal, ModalHeader, ModalBody, ModalFooter,
  Form, FormGroup, Label, Input, Spinner, Alert, UncontrolledDropdown,
  DropdownToggle, DropdownMenu, DropdownItem
} from "reactstrap";
import BreadCrumb from "../../Components/Common/BreadCrumb";

const API_URL = process.env.REACT_APP_API_URL || "https://api.rubricalo.com";

const ROLE_MAP = {
  admin:  { label: "Administrador", color: "primary" },
  member: { label: "Miembro",       color: "info"    },
  viewer: { label: "Solo Lectura",  color: "secondary"}
};

const formatDate = (val) => {
  if (!val) return "Nunca";
  const d = new Date(val);
  if (isNaN(d.getTime())) return "Nunca";
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
};

const Usuarios = () => {
  document.title = "Usuarios del Equipo | Rubricalo";

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Modal de creación / edición
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ name: "", email: "", password: "", role: "member" });
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [createdPasswordNotice, setCreatedPasswordNotice] = useState(null);

  const getAuthHeaders = () => {
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

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/users`, { headers: getAuthHeaders() });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Error al cargar los usuarios del equipo");
      }
      const data = await res.json();
      setUsers(data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleModal = () => {
    setModalOpen(!modalOpen);
    if (modalOpen) {
      setEditingUser(null);
      setFormData({ name: "", email: "", password: "", role: "member" });
      setModalError(null);
    }
  };

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({ name: "", email: "", password: "", role: "member" });
    setModalError(null);
    setCreatedPasswordNotice(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setFormData({ name: user.name || "", email: user.email || "", password: "", role: user.role || "member" });
    setModalError(null);
    setCreatedPasswordNotice(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError(null);
    setCreatedPasswordNotice(null);

    try {
      if (editingUser) {
        // Actualizar usuario existente
        const res = await fetch(`${API_URL}/users/${editingUser.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          body: JSON.stringify({
            name: formData.name,
            role: formData.role,
            ...(formData.password ? { password: formData.password } : {})
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error al actualizar el usuario");

        setSuccessMsg("Usuario actualizado correctamente.");
        setModalOpen(false);
        fetchUsers();
      } else {
        // Crear nuevo usuario
        const res = await fetch(`${API_URL}/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          body: JSON.stringify(formData)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error al invitar al usuario");

        if (data.temporaryPassword) {
          setCreatedPasswordNotice(`Usuario creado. Contraseña temporal: ${data.temporaryPassword}`);
        } else {
          setSuccessMsg("Usuario creado exitosamente.");
          setModalOpen(false);
        }
        fetchUsers();
      }
    } catch (err) {
      setModalError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (user) => {
    const actionName = user.isActive ? "desactivar" : "activar";
    if (!window.confirm(`¿Seguro que deseas ${actionName} la cuenta de "${user.name || user.email}"?`)) return;

    try {
      const res = await fetch(`${API_URL}/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ isActive: !user.isActive })
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Error al ${actionName} el usuario`);
      }
      setSuccessMsg(`Usuario ${user.isActive ? 'desactivado' : 'activado'} correctamente.`);
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="Usuarios del Equipo" pageTitle="Rubricalo" />

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

          <Row>
            <Col lg={12}>
              <Card>
                <CardHeader className="d-flex align-items-center">
                  <div className="flex-grow-1">
                    <h5 className="card-title mb-0">Miembros de la Organización</h5>
                    <p className="text-muted mb-0 small">Administra los accesos y permisos de tu equipo.</p>
                  </div>
                  <Button color="primary" size="sm" onClick={handleOpenCreate}>
                    <i className="ri-user-add-line me-1"></i> Invitar Usuario
                  </Button>
                </CardHeader>
                <CardBody>
                  {loading ? (
                    <div className="text-center py-5">
                      <Spinner color="primary" />
                      <p className="mt-2 text-muted">Cargando equipo...</p>
                    </div>
                  ) : users.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                      <i className="ri-group-line fs-1 mb-2 d-block"></i>
                      <p>Aún no hay otros miembros registrados en tu equipo.</p>
                      <Button color="primary" size="sm" onClick={handleOpenCreate}>
                        <i className="ri-user-add-line me-1"></i> Invitar Primer Usuario
                      </Button>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <Table className="table-hover table-nowrap align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Usuario</th>
                            <th>Rol</th>
                            <th>Estado</th>
                            <th>Último Acceso</th>
                            <th>Fecha de Registro</th>
                            <th className="text-end">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((u) => {
                            const roleInfo = ROLE_MAP[u.role] || { label: u.role, color: "secondary" };
                            return (
                              <tr key={u.id}>
                                <td>
                                  <div className="d-flex align-items-center gap-3">
                                    <div className="avatar-xs flex-shrink-0">
                                      <span className="avatar-title rounded-circle bg-primary-subtle text-primary fw-bold">
                                        {(u.name || u.email).substring(0, 2).toUpperCase()}
                                      </span>
                                    </div>
                                    <div>
                                      <p className="mb-0 fw-medium">{u.name}</p>
                                      <small className="text-muted">{u.email}</small>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <Badge color={roleInfo.color} pill>
                                    {roleInfo.label}
                                  </Badge>
                                </td>
                                <td>
                                  {u.isActive ? (
                                    <Badge color="success" pill className="badge-soft-success">Activo</Badge>
                                  ) : (
                                    <Badge color="danger" pill className="badge-soft-danger">Inactivo</Badge>
                                  )}
                                </td>
                                <td><small className="text-muted">{formatDate(u.lastLoginAt)}</small></td>
                                <td><small className="text-muted">{formatDate(u.createdAt)}</small></td>
                                <td className="text-end">
                                  <UncontrolledDropdown>
                                    <DropdownToggle tag="button" className="btn btn-soft-secondary btn-sm">
                                      <i className="ri-more-fill"></i>
                                    </DropdownToggle>
                                    <DropdownMenu end>
                                      <DropdownItem onClick={() => handleOpenEdit(u)}>
                                        <i className="ri-pencil-line me-2 text-muted"></i> Editar Rol / Datos
                                      </DropdownItem>
                                      <DropdownItem onClick={() => handleToggleStatus(u)}>
                                        {u.isActive ? (
                                          <><i className="ri-user-unfollow-line me-2 text-warning"></i> Desactivar Acceso</>
                                        ) : (
                                          <><i className="ri-user-follow-line me-2 text-success"></i> Reactivar Acceso</>
                                        )}
                                      </DropdownItem>
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

        {/* Modal de Invitar / Editar Usuario */}
        <Modal isOpen={modalOpen} toggle={toggleModal} centered>
          <ModalHeader toggle={toggleModal}>
            {editingUser ? "Editar Usuario del Equipo" : "Invitar Nuevo Usuario"}
          </ModalHeader>
          <Form onSubmit={handleSubmit}>
            <ModalBody>
              {modalError && (
                <Alert color="danger" className="mb-3">
                  <i className="ri-error-warning-line me-2"></i> {modalError}
                </Alert>
              )}

              {createdPasswordNotice && (
                <Alert color="success" className="mb-3">
                  <i className="ri-key-line me-2"></i> {createdPasswordNotice}
                </Alert>
              )}

              <FormGroup className="mb-3">
                <Label htmlFor="name">Nombre Completo</Label>
                <Input
                  type="text"
                  id="name"
                  placeholder="ej. Ana Martínez"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </FormGroup>

              <FormGroup className="mb-3">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  type="email"
                  id="email"
                  placeholder="ej. ana@empresa.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!!editingUser}
                  required
                />
              </FormGroup>

              <FormGroup className="mb-3">
                <Label htmlFor="role">Rol / Permisos</Label>
                <Input
                  type="select"
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="admin">Administrador (Acceso completo)</option>
                  <option value="member">Miembro (Crear y firmar documentos)</option>
                  <option value="viewer">Solo Lectura (Ver documentos)</option>
                </Input>
              </FormGroup>

              <FormGroup className="mb-3">
                <Label htmlFor="password">
                  {editingUser ? "Nueva Contraseña (Opcional)" : "Contraseña (Opcional - se generará una si se deja vacío)"}
                </Label>
                <Input
                  type="password"
                  id="password"
                  placeholder={editingUser ? "Dejar vacío para no cambiar" : "Mínimo 6 caracteres"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </FormGroup>
            </ModalBody>

            <ModalFooter>
              {createdPasswordNotice ? (
                <Button color="secondary" onClick={toggleModal}>Cerrar</Button>
              ) : (
                <>
                  <Button color="light" onClick={toggleModal} disabled={submitting}>Cancelar</Button>
                  <Button color="primary" type="submit" disabled={submitting}>
                    {submitting ? <Spinner size="sm" /> : (editingUser ? "Guardar Cambios" : "Invitar Usuario")}
                  </Button>
                </>
              )}
            </ModalFooter>
          </Form>
        </Modal>
      </div>
    </React.Fragment>
  );
};

export default Usuarios;

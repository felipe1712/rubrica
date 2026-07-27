import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Container, Row, Col, Card, CardBody, CardHeader,
  Button, Badge, Table, Spinner, Alert, UncontrolledTooltip,
  Input, Nav, NavItem, NavLink
} from "reactstrap";
import { Link } from "react-router-dom";
import BreadCrumb from "../../Components/Common/BreadCrumb";

const API_URL = process.env.REACT_APP_API_URL || "https://api.rubricalo.com";

const STATUS_MAP = {
  uploaded:          { label: "Subido",       color: "secondary", icon: "ri-upload-2-line" },
  pending_signature: { label: "Pend. Firma",  color: "warning",   icon: "ri-time-line" },
  signed:            { label: "Firmado",      color: "success",   icon: "ri-checkbox-circle-line" },
  rejected:          { label: "Rechazado",    color: "danger",    icon: "ri-close-circle-line" },
  expired:           { label: "Expirado",     color: "dark",      icon: "ri-error-warning-line" },
};

const formatSize = (bytes) => {
  if (!bytes || isNaN(bytes)) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (val) => {
  if (!val) return "—";
  const d = new Date(val);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
};

const fileIcon = (name) => {
  const safeName = name || "";
  const ext = safeName.includes(".") ? safeName.split(".").pop().toLowerCase() : "";
  if (["docx", "doc"].includes(ext)) return { icon: "ri-file-word-line", color: "text-primary" };
  if (["xlsx", "xls"].includes(ext)) return { icon: "ri-file-excel-line", color: "text-success" };
  if (["pptx", "ppt"].includes(ext)) return { icon: "ri-file-ppt-line", color: "text-warning" };
  if (ext === "txt") return { icon: "ri-file-text-line", color: "text-secondary" };
  return { icon: "ri-file-pdf-2-line", color: "text-danger" };
};

const Documentos = () => {
  document.title = "Documentos | Rubricalo";

  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const getAuthHeaders = () => {
    try {
      const raw = sessionStorage.getItem("authUser") || localStorage.getItem("authUser");
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      const token = parsed?.token || parsed?.accessToken || (typeof parsed === "string" ? parsed : null);
      return token ? { Authorization: `Bearer ${token}` } : {};
    } catch (e) {
      return {};
    }
  };

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/documents`, { headers: getAuthHeaders() });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || `Error ${res.status}: No se pudieron obtener los documentos.`);
      }

      if (Array.isArray(data)) {
        setDocs(data);
      } else {
        setDocs([]);
      }
    } catch (e) {
      console.error("Error al obtener documentos:", e);
      setError(e.message || "Error al conectar con el servidor.");
      setDocs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`¿Eliminar "${name || "este documento"}"? Esta acción no se puede deshacer.`)) return;
    setDeleting(id);
    try {
      const res = await fetch(`${API_URL}/documents/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Error al eliminar.");
      }
      setDocs(prev => prev.filter(d => d && d.id !== id));
    } catch (e) {
      alert(e.message || "Error al eliminar el documento.");
    } finally {
      setDeleting(null);
    }
  };

  // Filtrado reactivo por pestaña de estado y búsqueda por nombre/email
  const filteredDocs = useMemo(() => {
    let list = Array.isArray(docs) ? docs : [];

    if (activeTab !== "all") {
      list = list.filter(d => (d?.status || "").toLowerCase() === activeTab.toLowerCase());
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(d =>
        (d?.name || "").toLowerCase().includes(q) ||
        (d?.originalName || "").toLowerCase().includes(q) ||
        (d?.signerEmail || "").toLowerCase().includes(q) ||
        (d?.signerName || "").toLowerCase().includes(q)
      );
    }

    return list;
  }, [docs, activeTab, searchQuery]);

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="Documentos" pageTitle="Rubricalo" />

          <Row>
            <Col lg={12}>
              <Card>
                <CardHeader className="d-flex align-items-center flex-wrap gap-2">
                  <h4 className="card-title mb-0 flex-grow-1">Mis Documentos</h4>
                  <div className="d-flex align-items-center gap-2">
                    <Button color="light" size="sm" onClick={fetchDocs} disabled={loading} title="Recargar listado">
                      <i className={`ri-refresh-line ${loading ? "spin" : ""}`}></i>
                    </Button>
                    <Link to="/documentos/nuevo" className="btn btn-primary btn-sm">
                      <i className="ri-add-line me-1"></i> Subir Documento
                    </Link>
                  </div>
                </CardHeader>
                <CardBody>
                  {error && (
                    <Alert color="danger" className="d-flex align-items-center justify-content-between mb-4">
                      <div>
                        <i className="ri-error-warning-line me-2 fs-5"></i>
                        {error}
                      </div>
                      <Button color="danger" outline size="sm" onClick={fetchDocs}>
                        <i className="ri-refresh-line me-1"></i> Reintentar
                      </Button>
                    </Alert>
                  )}

                  {/* Filtros de estado y Búsqueda */}
                  <Row className="mb-3 align-middle g-2">
                    <Col md={7} lg={8}>
                      <Nav tabs className="nav-tabs-custom card-header-tabs border-bottom-0">
                        <NavItem>
                          <NavLink
                            className={activeTab === "all" ? "active fw-semibold text-primary" : "text-muted"}
                            style={{ cursor: "pointer" }}
                            onClick={() => setActiveTab("all")}
                          >
                            Todos ({Array.isArray(docs) ? docs.length : 0})
                          </NavLink>
                        </NavItem>
                        <NavItem>
                          <NavLink
                            className={activeTab === "uploaded" ? "active fw-semibold text-primary" : "text-muted"}
                            style={{ cursor: "pointer" }}
                            onClick={() => setActiveTab("uploaded")}
                          >
                            Subidos
                          </NavLink>
                        </NavItem>
                        <NavItem>
                          <NavLink
                            className={activeTab === "pending_signature" ? "active fw-semibold text-warning" : "text-muted"}
                            style={{ cursor: "pointer" }}
                            onClick={() => setActiveTab("pending_signature")}
                          >
                            Pendientes
                          </NavLink>
                        </NavItem>
                        <NavItem>
                          <NavLink
                            className={activeTab === "signed" ? "active fw-semibold text-success" : "text-muted"}
                            style={{ cursor: "pointer" }}
                            onClick={() => setActiveTab("signed")}
                          >
                            Firmados
                          </NavLink>
                        </NavItem>
                      </Nav>
                    </Col>
                    <Col md={5} lg={4}>
                      <div className="search-box">
                        <Input
                          type="text"
                          className="form-control"
                          placeholder="Buscar por nombre o firmante..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                    </Col>
                  </Row>

                  {loading ? (
                    <div className="text-center py-5">
                      <Spinner color="primary" />
                      <p className="mt-2 text-muted mb-0">Cargando documentos...</p>
                    </div>
                  ) : filteredDocs.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                      <i className="ri-file-search-line fs-1 mb-2 d-block text-secondary"></i>
                      <h5>No se encontraron documentos</h5>
                      <p className="mb-3 text-muted fs-13">
                        {searchQuery || activeTab !== "all"
                          ? "Intenta ajustando tus términos de búsqueda o filtros de estado."
                          : "Aún no has subido ningún documento a tu cuenta."}
                      </p>
                      {searchQuery || activeTab !== "all" ? (
                        <Button color="light" size="sm" onClick={() => { setSearchQuery(""); setActiveTab("all"); }}>
                          Limpiar Filtros
                        </Button>
                      ) : (
                        <Link to="/documentos/nuevo" className="btn btn-primary btn-sm">
                          <i className="ri-upload-2-line me-1"></i> Subir primer documento
                        </Link>
                      )}
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <Table className="table-hover table-nowrap mb-0 align-middle">
                        <thead className="table-light">
                          <tr>
                            <th>Documento</th>
                            <th>Tamaño</th>
                            <th>Estado</th>
                            <th>Firmante</th>
                            <th>Fecha</th>
                            <th className="text-end">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredDocs.map((doc) => {
                            if (!doc || !doc.id) return null;
                            const statusKey = (doc.status || "").toLowerCase();
                            const st = STATUS_MAP[statusKey] || { label: doc.status || "Subido", color: "secondary", icon: "ri-file-line" };
                            const fi = fileIcon(doc.originalName || doc.name);

                            return (
                              <tr key={doc.id}>
                                <td>
                                  <div className="d-flex align-items-center gap-2">
                                    <i className={`${fi.icon} ${fi.color} fs-3`}></i>
                                    <div>
                                      <Link to={`/documentos/${doc.id}`} className="mb-0 fw-medium text-dark text-decoration-none">
                                        {doc.name || "Sin nombre"}
                                      </Link>
                                      {doc.originalName && (
                                        <small className="text-muted d-block">{doc.originalName}</small>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <small className="text-muted">{formatSize(doc.fileSizeBytes)}</small>
                                </td>
                                <td>
                                  <Badge color={st.color} pill className="px-2 py-1">
                                    <i className={`${st.icon} me-1`}></i>
                                    {st.label}
                                  </Badge>
                                </td>
                                <td>
                                  {doc.signerEmail ? (
                                    <div>
                                      <p className="mb-0 fs-13">{doc.signerName || doc.signerEmail}</p>
                                      {doc.signerName && doc.signerEmail && (
                                        <small className="text-muted">{doc.signerEmail}</small>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-muted">—</span>
                                  )}
                                </td>
                                <td>
                                  <small className="text-muted">{formatDate(doc.createdAt || doc.created_at)}</small>
                                </td>
                                <td className="text-end">
                                  <div className="d-flex gap-2 justify-content-end">
                                    <Link
                                      to={`/documentos/${doc.id}`}
                                      className="btn btn-sm btn-soft-primary"
                                      id={`view-${doc.id}`}
                                    >
                                      <i className="ri-eye-line"></i>
                                    </Link>
                                    <UncontrolledTooltip target={`view-${doc.id}`}>Ver detalles</UncontrolledTooltip>

                                    <button
                                      className="btn btn-sm btn-soft-danger"
                                      id={`del-${doc.id}`}
                                      onClick={() => handleDelete(doc.id, doc.name)}
                                      disabled={deleting === doc.id}
                                    >
                                      {deleting === doc.id ? (
                                        <Spinner size="sm" />
                                      ) : (
                                        <i className="ri-delete-bin-line"></i>
                                      )}
                                    </button>
                                    <UncontrolledTooltip target={`del-${doc.id}`}>Eliminar</UncontrolledTooltip>
                                  </div>
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
      </div>
    </React.Fragment>
  );
};

export default Documentos;


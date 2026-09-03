import React, { useEffect, useState, useCallback } from "react";
import { Col, Container, Row, Card, CardBody, CardHeader, Table, Badge, Spinner, Alert, Button } from "reactstrap";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import { Link } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL || "https://api.rubricalo.com";

const STATUS_MAP = {
  uploaded:          { label: "Subido",       color: "secondary", icon: "ri-upload-2-line" },
  pending_signature: { label: "Pend. Firma",  color: "warning",   icon: "ri-time-line" },
  signed:            { label: "Firmado",      color: "success",   icon: "ri-checkbox-circle-line" },
  rejected:          { label: "Rechazado",    color: "danger",    icon: "ri-close-circle-line" },
  expired:           { label: "Expirado",     color: "dark",      icon: "ri-error-warning-line" },
};

const formatDate = (val) => {
  if (!val) return "—";
  const d = new Date(val);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
};

// Widgets de Rubricalo
const StatCard = ({ icon, title, value, sub, color }) => (
  <Card className="card-animate">
    <CardBody>
      <div className="d-flex align-items-center">
        <div className="flex-grow-1 overflow-hidden">
          <p className="text-uppercase fw-medium text-muted text-truncate mb-0">{title}</p>
        </div>
      </div>
      <div className="d-flex align-items-end justify-content-between mt-4">
        <div>
          <h4 className="fs-22 fw-semibold ff-secondary mb-4">
            <span>{value ?? 0}</span>
          </h4>
          <span className={"badge bg-" + color + " me-1"}>{sub}</span>
        </div>
        <div className={"avatar-sm flex-shrink-0"}>
          <span className={"avatar-title rounded fs-3 bg-" + color + "-subtle"}>
            <i className={"text-" + color + " " + icon}></i>
          </span>
        </div>
      </div>
    </CardBody>
  </Card>
);

const DashboardEcommerce = () => {
  document.title = "Dashboard | Rubricalo";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    stats: { totalDocs: 0, pendingDocs: 0, totalSigned: 0, activeUsers: 0 },
    recentActivity: []
  });

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

  const fetchDashboardStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/documents/dashboard-stats`, {
        headers: getAuthHeaders()
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(json?.error || `Error ${res.status}: No se pudieron obtener los datos del dashboard.`);
      }

      if (json) {
        setData({
          stats: {
            totalDocs: json.stats?.totalDocs ?? 0,
            pendingDocs: json.stats?.pendingDocs ?? 0,
            totalSigned: json.stats?.totalSigned ?? 0,
            activeUsers: json.stats?.activeUsers ?? 0,
          },
          recentActivity: Array.isArray(json.recentActivity) ? json.recentActivity : []
        });
      }
    } catch (e) {
      console.error("Error al cargar estadísticas del dashboard:", e);
      setError(e.message || "Error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("authUser") || localStorage.getItem("authUser");
      if (raw) {
        const parsed = JSON.parse(raw);
        const u = parsed.user || {};
        if (u.role === 'SUPERADMIN' || u.isSuperAdmin) {
          window.location.href = "/admin/global";
          return;
        }
      }
    } catch (e) {}

    fetchDashboardStats();
  }, [fetchDashboardStats]);

  const stats = data.stats || { totalDocs: 0, pendingDocs: 0, totalSigned: 0, activeUsers: 0 };
  const recentDocs = Array.isArray(data.recentActivity) ? data.recentActivity : [];

  const statsCards = [
    { icon: "ri-file-text-line",       title: "Documentos Totales",  value: stats.totalDocs,   sub: "Total",    color: "primary" },
    { icon: "ri-pen-nib-line",         title: "Pendientes de Firma", value: stats.pendingDocs, sub: "Pendiente", color: "warning" },
    { icon: "ri-checkbox-circle-line", title: "Firmados",            value: stats.totalSigned, sub: "Acumulado", color: "success" },
    { icon: "ri-group-line",           title: "Usuarios Activos",    value: stats.activeUsers, sub: "Activos",   color: "info" },
  ];

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="Dashboard" pageTitle="Rubricalo" />

          {error && (
            <Alert color="danger" className="d-flex align-items-center justify-content-between mb-4">
              <div>
                <i className="ri-error-warning-line me-2 fs-5"></i>
                {error}
              </div>
              <Button color="danger" outline size="sm" onClick={fetchDashboardStats}>
                <i className="ri-refresh-line me-1"></i> Reintentar
              </Button>
            </Alert>
          )}

          {/* KPI Cards */}
          <Row>
            {statsCards.map((s, i) => (
              <Col xl={3} md={6} key={i}>
                <StatCard {...s} />
              </Col>
            ))}
          </Row>

          <Row>
            {/* Accesos rápidos */}
            <Col xl={4}>
              <Card className="h-100">
                <CardHeader>
                  <h4 className="card-title mb-0">Acciones Rápidas</h4>
                </CardHeader>
                <CardBody>
                  <div className="d-grid gap-2">
                    <Link to="/documentos/nuevo" className="btn btn-primary btn-sm py-2">
                      <i className="ri-upload-2-line me-1"></i> Subir Documento
                    </Link>
                    <Link to="/documentos" className="btn btn-outline-secondary btn-sm py-2">
                      <i className="ri-file-list-3-line me-1"></i> Ver Mis Documentos
                    </Link>
                    <Link to="/herramientas-pdf" className="btn btn-outline-info btn-sm py-2">
                      <i className="ri-tools-line me-1"></i> Herramientas PDF
                    </Link>
                    <Link to="/soporte" className="btn btn-outline-secondary btn-sm py-2">
                      <i className="ri-customer-service-2-line me-1"></i> Soporte
                    </Link>
                  </div>
                </CardBody>
              </Card>
            </Col>

            {/* Actividad reciente */}
            <Col xl={8}>
              <Card className="h-100">
                <CardHeader className="d-flex align-items-center">
                  <h4 className="card-title mb-0 flex-grow-1">Actividad Reciente</h4>
                  <div className="d-flex gap-2">
                    <Button color="light" size="sm" onClick={fetchDashboardStats} disabled={loading} title="Actualizar">
                      <i className={`ri-refresh-line ${loading ? "spin" : ""}`}></i>
                    </Button>
                    <Link to="/documentos" className="btn btn-sm btn-soft-primary">
                      Ver todos
                    </Link>
                  </div>
                </CardHeader>
                <CardBody>
                  {loading ? (
                    <div className="text-center py-4">
                      <Spinner color="primary" size="sm" />
                      <span className="ms-2 text-muted">Cargando actividad...</span>
                    </div>
                  ) : recentDocs.length === 0 ? (
                    <div className="text-center py-4 text-muted">
                      <i className="ri-file-search-line fs-1 mb-2 d-block text-secondary"></i>
                      <p className="mb-3">No hay actividad reciente. Sube tu primer documento para comenzar.</p>
                      <Link to="/documentos/nuevo" className="btn btn-primary btn-sm">
                        <i className="ri-add-line me-1"></i> Subir Documento
                      </Link>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <Table className="table-hover table-nowrap mb-0 align-middle">
                        <thead className="table-light">
                          <tr>
                            <th>Documento</th>
                            <th>Estado</th>
                            <th>Fecha</th>
                            <th className="text-end">Acción</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentDocs.map((doc) => {
                            if (!doc || !doc.id) return null;
                            const statusKey = (doc.status || "").toLowerCase();
                            const st = STATUS_MAP[statusKey] || { label: doc.status || "Subido", color: "secondary", icon: "ri-file-line" };

                            return (
                              <tr key={doc.id}>
                                <td>
                                  <div className="d-flex align-items-center gap-2">
                                    <i className="ri-file-text-line text-primary fs-4"></i>
                                    <div>
                                      <p className="mb-0 fw-medium">{doc.name || "Sin nombre"}</p>
                                      {doc.originalName && (
                                        <small className="text-muted">{doc.originalName}</small>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <Badge color={st.color} pill className="px-2 py-1">
                                    <i className={`${st.icon} me-1`}></i>
                                    {st.label}
                                  </Badge>
                                </td>
                                <td>
                                  <small className="text-muted">{formatDate(doc.createdAt || doc.created_at)}</small>
                                </td>
                                <td className="text-end">
                                  <Link to={`/documentos/${doc.id}`} className="btn btn-sm btn-soft-secondary">
                                    Ver
                                  </Link>
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

export default DashboardEcommerce;


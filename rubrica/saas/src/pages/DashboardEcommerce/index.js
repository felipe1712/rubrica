import React, { useEffect, useState, useCallback } from "react";
import { Col, Container, Row, Card, CardBody, CardHeader, Table, Badge, Spinner } from "reactstrap";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import { Link } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL || "https://api.rubricalo.com";

const STATUS_MAP = {
  uploaded:          { label: "Subido",       color: "secondary" },
  pending_signature: { label: "Pend. Firma",  color: "warning"   },
  signed:            { label: "Firmado",      color: "success"   },
  rejected:          { label: "Rechazado",    color: "danger"    },
  expired:           { label: "Expirado",     color: "dark"      },
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
            <span>{value}</span>
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
  const [data, setData] = useState({
    stats: { totalDocs: 0, pendingDocs: 0, totalSigned: 0, activeUsers: 0 },
    recentActivity: []
  });

  const getAuthHeaders = () => {
    const authUser = sessionStorage.getItem("authUser");
    if (!authUser) return {};
    const { token } = JSON.parse(authUser);
    return { Authorization: `Bearer ${token}` };
  };

  const fetchDashboardStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/documents/dashboard-stats`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error("Error al cargar estadísticas del dashboard:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  const statsCards = [
    { icon: "ri-file-text-line",       title: "Documentos Totales",  value: data.stats.totalDocs,   sub: "Total",    color: "primary" },
    { icon: "ri-pen-nib-line",         title: "Pendientes de Firma", value: data.stats.pendingDocs, sub: "Pendiente", color: "warning" },
    { icon: "ri-checkbox-circle-line", title: "Firmados",            value: data.stats.totalSigned, sub: "Acumulado", color: "success" },
    { icon: "ri-group-line",           title: "Usuarios Activos",    value: data.stats.activeUsers, sub: "Activos",   color: "info" },
  ];

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="Dashboard" pageTitle="Rubricalo" />

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
                  <Link to="/documentos" className="btn btn-sm btn-soft-primary">
                    Ver todos
                  </Link>
                </CardHeader>
                <CardBody>
                  {loading ? (
                    <div className="text-center py-4">
                      <Spinner color="primary" size="sm" />
                      <span className="ms-2 text-muted">Cargando actividad...</span>
                    </div>
                  ) : data.recentActivity.length === 0 ? (
                    <div className="text-center py-4 text-muted">
                      <i className="ri-file-search-line fs-1 mb-2 d-block"></i>
                      <p>No hay actividad reciente. Sube tu primer documento para comenzar.</p>
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
                          {data.recentActivity.map((doc) => {
                            const st = STATUS_MAP[doc.status] || { label: doc.status, color: "secondary" };
                            return (
                              <tr key={doc.id}>
                                <td>
                                  <div className="d-flex align-items-center gap-2">
                                    <i className="ri-file-text-line text-primary fs-4"></i>
                                    <div>
                                      <p className="mb-0 fw-medium">{doc.name}</p>
                                      <small className="text-muted">{doc.originalName}</small>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <Badge color={st.color} pill>
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

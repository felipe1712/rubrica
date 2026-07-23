import React, { useEffect, useState, useCallback } from "react";
import {
  Container, Row, Col, Card, CardBody, CardHeader,
  Button, Badge, Table, Spinner, Alert, UncontrolledTooltip
} from "reactstrap";
import { Link } from "react-router-dom";
import BreadCrumb from "../../Components/Common/BreadCrumb";

const API_URL = process.env.REACT_APP_API_URL || "https://api.rubricalo.com";

const STATUS_MAP = {
  uploaded:          { label: "Subido",       color: "secondary" },
  pending_signature: { label: "Pend. Firma",  color: "warning"   },
  signed:            { label: "Firmado",      color: "success"   },
  rejected:          { label: "Rechazado",    color: "danger"    },
  expired:           { label: "Expirado",     color: "dark"      },
};

const formatSize = (bytes) => {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const Documentos = () => {
  document.title = "Documentos | Rubricalo";

  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const getAuthHeaders = () => {
    const authUser = sessionStorage.getItem("authUser");
    if (!authUser) return {};
    const { token } = JSON.parse(authUser);
    return { Authorization: `Bearer ${token}` };
  };

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/documents`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Error al cargar los documentos");
      const data = await res.json();
      setDocs(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) return;
    setDeleting(id);
    try {
      await fetch(`${API_URL}/documents/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });
      setDocs(prev => prev.filter(d => d.id !== id));
    } catch (e) {
      alert("Error al eliminar el documento.");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="Documentos" pageTitle="Rubricalo" />

          <Row>
            <Col lg={12}>
              <Card>
                <CardHeader className="d-flex align-items-center">
                  <h4 className="card-title mb-0 flex-grow-1">Mis Documentos</h4>
                  <Link to="/documentos/nuevo" className="btn btn-primary btn-sm">
                    <i className="ri-add-line me-1"></i> Subir Documento
                  </Link>
                </CardHeader>
                <CardBody>
                  {error && <Alert color="danger">{error}</Alert>}

                  {loading ? (
                    <div className="text-center py-5">
                      <Spinner color="primary" />
                      <p className="mt-2 text-muted">Cargando documentos...</p>
                    </div>
                  ) : docs.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                      <i className="ri-file-search-line fs-1 mb-2 d-block"></i>
                      <p className="mb-3">Aún no has subido ningún documento.</p>
                      <Link to="/documentos/nuevo" className="btn btn-primary btn-sm">
                        <i className="ri-upload-2-line me-1"></i> Subir primer documento
                      </Link>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <Table className="table-hover table-nowrap mb-0 align-middle">
                        <thead className="table-light">
                          <tr>
                            <th>Nombre</th>
                            <th>Tamaño</th>
                            <th>Estado</th>
                            <th>Firmante</th>
                            <th>Fecha</th>
                            <th className="text-end">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {docs.map((doc) => {
                            const st = STATUS_MAP[doc.status] || { label: doc.status, color: "secondary" };
                            return (
                              <tr key={doc.id}>
                                <td>
                                  <div className="d-flex align-items-center gap-2">
                                    <i className="ri-file-pdf-2-line text-danger fs-4"></i>
                                    <div>
                                      <p className="mb-0 fw-medium">{doc.name}</p>
                                      <small className="text-muted">{doc.originalName}</small>
                                    </div>
                                  </div>
                                </td>
                                <td>{formatSize(doc.fileSizeBytes)}</td>
                                <td>
                                  <Badge color={st.color} className="badge-soft-" pill>
                                    {st.label}
                                  </Badge>
                                </td>
                                <td>
                                  {doc.signerEmail ? (
                                    <div>
                                      <p className="mb-0">{doc.signerName || doc.signerEmail}</p>
                                      <small className="text-muted">{doc.signerEmail}</small>
                                    </div>
                                  ) : (
                                    <span className="text-muted">—</span>
                                  )}
                                </td>
                                <td>
                                  <small>{new Date(doc.createdAt).toLocaleDateString("es-MX")}</small>
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
                                      {deleting === doc.id
                                        ? <Spinner size="sm" />
                                        : <i className="ri-delete-bin-line"></i>}
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

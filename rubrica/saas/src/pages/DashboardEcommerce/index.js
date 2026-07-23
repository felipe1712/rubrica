import React, { useEffect, useState } from "react";
import { Col, Container, Row, Card, CardBody, CardHeader } from "reactstrap";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import { Link } from "react-router-dom";

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

  // Datos de ejemplo – se conectarán al API más adelante
  const stats = [
    { icon: "ri-file-text-line",    title: "Documentos Totales",   value: "0", sub: "Total",    color: "primary" },
    { icon: "ri-pen-nib-line",      title: "Pendientes de Firma",  value: "0", sub: "Pendiente", color: "warning" },
    { icon: "ri-checkbox-circle-line", title: "Firmados Hoy",      value: "0", sub: "Hoy",       color: "success" },
    { icon: "ri-group-line",        title: "Usuarios Activos",     value: "0", sub: "Activos",   color: "info" },
  ];

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="Dashboard" pageTitle="Rubricalo" />

          {/* KPI Cards */}
          <Row>
            {stats.map((s, i) => (
              <Col xl={3} md={6} key={i}>
                <StatCard {...s} />
              </Col>
            ))}
          </Row>

          <Row>
            {/* Accesos rápidos */}
            <Col xl={4}>
              <Card>
                <CardHeader>
                  <h4 className="card-title mb-0">Acciones Rápidas</h4>
                </CardHeader>
                <CardBody>
                  <div className="d-grid gap-2">
                    <Link to="/documentos/nuevo" className="btn btn-primary btn-sm">
                      <i className="ri-upload-2-line me-1"></i> Subir Documento
                    </Link>
                    <Link to="/documentos" className="btn btn-outline-secondary btn-sm">
                      <i className="ri-file-list-3-line me-1"></i> Ver Mis Documentos
                    </Link>
                    <Link to="/soporte" className="btn btn-outline-secondary btn-sm">
                      <i className="ri-customer-service-2-line me-1"></i> Soporte
                    </Link>
                  </div>
                </CardBody>
              </Card>
            </Col>

            {/* Actividad reciente */}
            <Col xl={8}>
              <Card>
                <CardHeader>
                  <h4 className="card-title mb-0">Actividad Reciente</h4>
                </CardHeader>
                <CardBody>
                  <div className="text-center py-4 text-muted">
                    <i className="ri-file-search-line fs-1 mb-2 d-block"></i>
                    <p>No hay actividad reciente. Sube tu primer documento para comenzar.</p>
                    <Link to="/documentos/nuevo" className="btn btn-primary btn-sm">
                      <i className="ri-add-line me-1"></i> Subir Documento
                    </Link>
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

export default DashboardEcommerce;

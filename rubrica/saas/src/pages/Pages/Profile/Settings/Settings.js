import React, { useState, useEffect } from 'react';
import {
  Card, CardBody, CardHeader, Col, Container, Form, Input, Label, Nav, NavItem, NavLink, Row, TabContent, TabPane, Button, Alert, Spinner
} from 'reactstrap';
import classnames from "classnames";
import BreadCrumb from '../../../../Components/Common/BreadCrumb';

const API_URL = process.env.REACT_APP_API_URL || "https://api.rubricalo.com";

const Settings = () => {
    document.title = "Perfil | Rubrícalo";

    const [activeTab, setActiveTab] = useState("1");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [role, setRole] = useState("Administrador");

    // Formulario de cambio de contraseña
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [pwdLoading, setPwdLoading] = useState(false);
    const [pwdSuccess, setPwdSuccess] = useState(null);
    const [pwdError, setPwdError] = useState(null);

    useEffect(() => {
        const raw = sessionStorage.getItem("authUser") || localStorage.getItem("authUser");
        if (raw) {
            try {
                const obj = JSON.parse(raw);
                if (obj.user) {
                    setName(obj.user.name || "");
                    setEmail(obj.user.email || "");
                    setRole(obj.user.role === "SUPERADMIN" ? "SuperAdmin" : "Administrador");
                }
                if (obj.tenant) {
                    setCompanyName(obj.tenant.name || "");
                }
            } catch (e) {}
        }
    }, []);

    const tabChange = (tab) => {
        if (activeTab !== tab) setActiveTab(tab);
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setPwdError(null);
        setPwdSuccess(null);

        if (!newPassword || newPassword.length < 6) {
            setPwdError("La nueva contraseña debe tener al menos 6 caracteres.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setPwdError("La confirmación de la contraseña no coincide.");
            return;
        }

        setPwdLoading(true);
        try {
            const raw = sessionStorage.getItem("authUser") || localStorage.getItem("authUser");
            const token = raw ? JSON.parse(raw).token : "";

            const res = await fetch(`${API_URL}/users/change-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ oldPassword, newPassword })
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "No se pudo actualizar la contraseña.");
            }

            setPwdSuccess("¡Contraseña actualizada correctamente!");
            setOldPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (err) {
            setPwdError(err.message || "Error al actualizar la contraseña.");
        } finally {
            setPwdLoading(false);
        }
    };

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Perfil" pageTitle="Dashboard" />

                    <Row className="justify-content-center">
                        <Col lg={10} xl={9}>
                            <Card className="shadow-sm border-0" style={{ borderRadius: "12px" }}>
                                <CardHeader className="bg-white border-bottom p-3" style={{ borderRadius: "12px 12px 0 0" }}>
                                    <Nav className="nav-tabs-custom card-header-tabs border-bottom-0" role="tablist">
                                        <NavItem>
                                            <NavLink
                                                className={classnames({ active: activeTab === "1" }, "fw-bold cursor-pointer")}
                                                onClick={() => tabChange("1")}
                                                style={{ cursor: "pointer", padding: "10px 20px" }}
                                            >
                                                <i className="ri-user-line me-2"></i>
                                                Datos Personales
                                            </NavLink>
                                        </NavItem>
                                        <NavItem>
                                            <NavLink
                                                className={classnames({ active: activeTab === "2" }, "fw-bold cursor-pointer")}
                                                onClick={() => tabChange("2")}
                                                style={{ cursor: "pointer", padding: "10px 20px" }}
                                            >
                                                <i className="ri-key-2-line me-2"></i>
                                                Cambiar Contraseña
                                            </NavLink>
                                        </NavItem>
                                    </Nav>
                                </CardHeader>

                                <CardBody className="p-4">
                                    <TabContent activeTab={activeTab}>
                                        {/* TAB 1: DATOS PERSONALES */}
                                        <TabPane tabId="1">
                                            <Form onSubmit={(e) => e.preventDefault()}>
                                                <Row>
                                                    <Col lg={6}>
                                                        <div className="mb-3">
                                                            <Label htmlFor="nameInput" className="form-label fw-semibold">Nombre Completo</Label>
                                                            <Input
                                                                type="text"
                                                                className="form-control"
                                                                id="nameInput"
                                                                value={name}
                                                                onChange={(e) => setName(e.target.value)}
                                                                placeholder="Ingresa tu nombre"
                                                            />
                                                        </div>
                                                    </Col>
                                                    <Col lg={6}>
                                                        <div className="mb-3">
                                                            <Label htmlFor="emailInput" className="form-label fw-semibold">Correo Electrónico</Label>
                                                            <Input
                                                                type="email"
                                                                className="form-control bg-light"
                                                                id="emailInput"
                                                                value={email}
                                                                readOnly
                                                            />
                                                        </div>
                                                    </Col>
                                                    <Col lg={6}>
                                                        <div className="mb-3">
                                                            <Label htmlFor="companyInput" className="form-label fw-semibold">Empresa / Organización</Label>
                                                            <Input
                                                                type="text"
                                                                className="form-control bg-light"
                                                                id="companyInput"
                                                                value={companyName}
                                                                readOnly
                                                            />
                                                        </div>
                                                    </Col>
                                                    <Col lg={6}>
                                                        <div className="mb-3">
                                                            <Label htmlFor="roleInput" className="form-label fw-semibold">Rol en la Plataforma</Label>
                                                            <Input
                                                                type="text"
                                                                className="form-control bg-light"
                                                                id="roleInput"
                                                                value={role}
                                                                readOnly
                                                            />
                                                        </div>
                                                    </Col>
                                                    <Col lg={12} className="mt-3 text-end">
                                                        <Button
                                                            type="button"
                                                            style={{ backgroundColor: "#3d4ed8", borderColor: "#3d4ed8" }}
                                                            className="fw-bold px-4"
                                                        >
                                                            Guardar Cambios
                                                        </Button>
                                                    </Col>
                                                </Row>
                                            </Form>
                                        </TabPane>

                                        {/* TAB 2: CAMBIAR CONTRASEÑA */}
                                        <TabPane tabId="2">
                                            {pwdSuccess && <Alert color="success" className="mb-3">{pwdSuccess}</Alert>}
                                            {pwdError && <Alert color="danger" className="mb-3">{pwdError}</Alert>}

                                            <Form onSubmit={handlePasswordChange}>
                                                <Row>
                                                    <Col lg={12}>
                                                        <div className="mb-3">
                                                            <Label htmlFor="oldPasswordInput" className="form-label fw-semibold">Contraseña Actual</Label>
                                                            <Input
                                                                type="password"
                                                                className="form-control"
                                                                id="oldPasswordInput"
                                                                placeholder="Ingresa tu contraseña actual"
                                                                value={oldPassword}
                                                                onChange={(e) => setOldPassword(e.target.value)}
                                                            />
                                                        </div>
                                                    </Col>
                                                    <Col lg={6}>
                                                        <div className="mb-3">
                                                            <Label htmlFor="newPasswordInput" className="form-label fw-semibold">Nueva Contraseña</Label>
                                                            <Input
                                                                type="password"
                                                                className="form-control"
                                                                id="newPasswordInput"
                                                                placeholder="Mínimo 6 caracteres"
                                                                value={newPassword}
                                                                onChange={(e) => setNewPassword(e.target.value)}
                                                            />
                                                        </div>
                                                    </Col>
                                                    <Col lg={6}>
                                                        <div className="mb-3">
                                                            <Label htmlFor="confirmPasswordInput" className="form-label fw-semibold">Confirmar Nueva Contraseña</Label>
                                                            <Input
                                                                type="password"
                                                                className="form-control"
                                                                id="confirmPasswordInput"
                                                                placeholder="Confirma la nueva contraseña"
                                                                value={confirmPassword}
                                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                            />
                                                        </div>
                                                    </Col>
                                                    <Col lg={12} className="mt-3 text-end">
                                                        <Button
                                                            type="submit"
                                                            disabled={pwdLoading}
                                                            style={{ backgroundColor: "#3d4ed8", borderColor: "#3d4ed8" }}
                                                            className="fw-bold px-4"
                                                        >
                                                            {pwdLoading ? <Spinner size="sm" className="me-2"> Actualizando... </Spinner> : null}
                                                            Actualizar Contraseña
                                                        </Button>
                                                    </Col>
                                                </Row>
                                            </Form>
                                        </TabPane>
                                    </TabContent>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </React.Fragment>
    );
};

export default Settings;
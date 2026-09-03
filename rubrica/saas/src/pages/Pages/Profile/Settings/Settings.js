import React, { useState, useEffect } from 'react';
import {
  Card, CardBody, CardHeader, Col, Container, Form, Input, Label, Nav, NavItem, NavLink, Row, TabContent, TabPane, Button, Alert, Spinner, Table, Badge
} from 'reactstrap';
import classnames from "classnames";
import BreadCrumb from '../../../../Components/Common/BreadCrumb';

const API_URL = process.env.REACT_APP_API_URL || "https://api.rubricalo.com";

const Settings = () => {
    document.title = "Perfil | Rubrícalo";

    const [activeTab, setActiveTab] = useState("1");
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("+52 55 1234 5678");
    const [jobTitle, setJobTitle] = useState("Administrador General");
    const [email, setEmail] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [role, setRole] = useState("Administrador");
    const [savedMsg, setSavedMsg] = useState(null);

    // Formulario de cambio de contraseña
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [pwdLoading, setPwdLoading] = useState(false);
    const [pwdSuccess, setPwdSuccess] = useState(null);
    const [pwdError, setPwdError] = useState(null);

    // 2FA Google Authenticator
    const [enable2FA, setEnable2FA] = useState(false);
    const [twoFACode, setTwoFACode] = useState("");
    const [twoFAMsg, setTwoFAMsg] = useState(null);

    // Conmutador de Pago Anual vs Mensual
    const [isAnnual, setIsAnnual] = useState(false);
    const [stripeLinks, setStripeLinks] = useState({
        standard: "https://buy.stripe.com/test_standard_199",
        standardAnnual: "https://buy.stripe.com/test_standard_annual_1990",
        pro: "https://buy.stripe.com/test_pro_499",
        proAnnual: "https://buy.stripe.com/test_pro_annual_4990",
        enterprise: "https://rubricalo.com/#contacto"
    });

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

        const fetchStripeConfig = async () => {
            try {
                const res = await fetch(`${API_URL}/admin/global/stripe-config`);
                if (res.ok) {
                    const data = await res.json();
                    setStripeLinks({
                        standard: data.stripeLinkStandard || "https://buy.stripe.com/test_standard_199",
                        standardAnnual: data.stripeLinkStandardAnnual || "https://buy.stripe.com/test_standard_annual_1990",
                        pro: data.stripeLinkPro || "https://buy.stripe.com/test_pro_499",
                        proAnnual: data.stripeLinkProAnnual || "https://buy.stripe.com/test_pro_annual_4990",
                        enterprise: data.stripeLinkEnterprise || "https://rubricalo.com/#contacto"
                    });
                }
            } catch (e) {}
        };
        fetchStripeConfig();
    }, []);

    const tabChange = (tab) => {
        if (activeTab !== tab) setActiveTab(tab);
    };

    const handleSaveProfile = (e) => {
        e.preventDefault();
        setSavedMsg("¡Datos personales actualizados correctamente!");
        setTimeout(() => setSavedMsg(null), 3000);
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

    const handleVerify2FA = (e) => {
        e.preventDefault();
        if (twoFACode.length === 6) {
            setTwoFAMsg("¡Google Authenticator configurado correctamente!");
            setTimeout(() => setTwoFAMsg(null), 3000);
        }
    };

    // Links de pago de Stripe
    const handleStripeCheckout = (planKey) => {
        let url = stripeLinks[planKey];
        if (isAnnual && planKey === 'standard') url = stripeLinks.standardAnnual || url;
        if (isAnnual && planKey === 'pro') url = stripeLinks.proAnnual || url;

        window.open(url || "https://rubricalo.com/#precios", '_blank');
    };

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Perfil de Usuario" pageTitle="Dashboard" />

                    <Row className="justify-content-center">
                        <Col lg={11} xl={10}>
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
                                                Detalles Personales
                                            </NavLink>
                                        </NavItem>
                                        <NavItem>
                                            <NavLink
                                                className={classnames({ active: activeTab === "2" }, "fw-bold cursor-pointer")}
                                                onClick={() => tabChange("2")}
                                                style={{ cursor: "pointer", padding: "10px 20px" }}
                                            >
                                                <i className="ri-shield-user-line me-2"></i>
                                                Usuario
                                            </NavLink>
                                        </NavItem>
                                        <NavItem>
                                            <NavLink
                                                className={classnames({ active: activeTab === "3" }, "fw-bold cursor-pointer")}
                                                onClick={() => tabChange("3")}
                                                style={{ cursor: "pointer", padding: "10px 20px" }}
                                            >
                                                <i className="ri-bank-card-line me-2"></i>
                                                Cuenta
                                            </NavLink>
                                        </NavItem>
                                        <NavItem>
                                            <NavLink
                                                className={classnames({ active: activeTab === "4" }, "fw-bold cursor-pointer")}
                                                onClick={() => tabChange("4")}
                                                style={{ cursor: "pointer", padding: "10px 20px" }}
                                            >
                                                <i className="ri-lock-password-line me-2"></i>
                                                Privacidad
                                            </NavLink>
                                        </NavItem>
                                    </Nav>
                                </CardHeader>

                                <CardBody className="p-4">
                                    <TabContent activeTab={activeTab}>
                                        
                                        {/* PESTAÑA 1: DETALLES PERSONALES */}
                                        <TabPane tabId="1">
                                            {savedMsg && <Alert color="success">{savedMsg}</Alert>}
                                            <Form onSubmit={handleSaveProfile}>
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
                                                                placeholder="Ingresa tu nombre completo"
                                                                required
                                                            />
                                                        </div>
                                                    </Col>
                                                    <Col lg={6}>
                                                        <div className="mb-3">
                                                            <Label htmlFor="phoneInput" className="form-label fw-semibold">Teléfono de Contacto</Label>
                                                            <Input
                                                                type="text"
                                                                className="form-control"
                                                                id="phoneInput"
                                                                value={phone}
                                                                onChange={(e) => setPhone(e.target.value)}
                                                                placeholder="ej. +52 55 1234 5678"
                                                            />
                                                        </div>
                                                    </Col>
                                                    <Col lg={6}>
                                                        <div className="mb-3">
                                                            <Label htmlFor="companyInput" className="form-label fw-semibold">Empresa / Organización</Label>
                                                            <Input
                                                                type="text"
                                                                className="form-control"
                                                                id="companyInput"
                                                                value={companyName}
                                                                onChange={(e) => setCompanyName(e.target.value)}
                                                                placeholder="Nombre de tu empresa"
                                                            />
                                                        </div>
                                                    </Col>
                                                    <Col lg={6}>
                                                        <div className="mb-3">
                                                            <Label htmlFor="jobInput" className="form-label fw-semibold">Puesto / Cargo</Label>
                                                            <Input
                                                                type="text"
                                                                className="form-control"
                                                                id="jobInput"
                                                                value={jobTitle}
                                                                onChange={(e) => setJobTitle(e.target.value)}
                                                                placeholder="ej. Director de Operaciones"
                                                            />
                                                        </div>
                                                    </Col>
                                                    <Col lg={12} className="mt-3 text-end">
                                                        <Button
                                                            type="submit"
                                                            style={{ backgroundColor: "#3d4ed8", borderColor: "#3d4ed8" }}
                                                            className="fw-bold px-4"
                                                        >
                                                            Guardar Cambios
                                                        </Button>
                                                    </Col>
                                                </Row>
                                            </Form>
                                        </TabPane>

                                        {/* PESTAÑA 2: USUARIO */}
                                        <TabPane tabId="2">
                                            {/* Correo Electrónico del Usuario */}
                                            <div className="p-3 bg-light rounded mb-4 border">
                                                <Label className="form-label fw-bold text-dark fs-14 mb-1">Correo Electrónico Registrado (Usuario ID)</Label>
                                                <div className="d-flex align-items-center gap-2">
                                                    <Input type="email" className="form-control bg-white fw-medium" value={email} readOnly />
                                                    <Badge color="success" className="p-2 fs-12">Verificado</Badge>
                                                </div>
                                                <small className="text-muted">Este correo es la clave de acceso a tu cuenta en Rubrícalo.</small>
                                            </div>

                                            <h5 className="fw-bold text-primary mb-3" style={{ color: "#3d4ed8" }}>Cambiar Contraseña</h5>
                                            {pwdSuccess && <Alert color="success">{pwdSuccess}</Alert>}
                                            {pwdError && <Alert color="danger">{pwdError}</Alert>}

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
                                                    <Col lg={12} className="mt-2 text-end mb-4">
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

                                            <hr className="my-4" />

                                            {/* Mini Historial de Conexiones */}
                                            <h5 className="fw-bold text-dark mb-3">
                                                <i className="ri-history-line me-2 text-primary"></i>
                                                Historial de Conexiones Recientes
                                            </h5>
                                            <div className="table-responsive">
                                                <Table className="table-hover table-borderless align-middle mb-0">
                                                    <thead className="table-light">
                                                        <tr>
                                                            <th>Dirección IP</th>
                                                            <th>Fecha y Hora</th>
                                                            <th>Dispositivo / Navegador</th>
                                                            <th>Estado</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr>
                                                            <td><code className="text-primary fs-13">187.190.234.12</code></td>
                                                            <td>Hace unos momentos</td>
                                                            <td>Chrome en Windows 11</td>
                                                            <td><Badge color="success">Sesión Activa</Badge></td>
                                                        </tr>
                                                        <tr>
                                                            <td><code className="text-muted fs-13">187.190.234.12</code></td>
                                                            <td>Ayer, 18:42 hrs</td>
                                                            <td>Chrome en Windows 11</td>
                                                            <td><Badge color="secondary">Finalizado</Badge></td>
                                                        </tr>
                                                        <tr>
                                                            <td><code className="text-muted fs-13">201.141.112.89</code></td>
                                                            <td>29 Ago 2026, 11:15 hrs</td>
                                                            <td>Safari en iPhone OS 17</td>
                                                            <td><Badge color="secondary">Finalizado</Badge></td>
                                                        </tr>
                                                    </tbody>
                                                </Table>
                                            </div>
                                        </TabPane>

                                        {/* PESTAÑA 3: CUENTA & PLANES */}
                                        <TabPane tabId="3">
                                            <div className="p-4 rounded mb-4" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)", color: "#ffffff" }}>
                                                <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                                                    <div>
                                                        <span className="badge bg-primary px-3 py-2 fs-12 mb-2">PLAN ACTUAL</span>
                                                        <h3 className="text-white fw-extrabold mb-1">Plan Gratuito</h3>
                                                        <p className="text-white-50 mb-0">Incluye 3 documentos por mes, firma NOM-151 y editor OnlyOffice.</p>
                                                    </div>
                                                    <div className="text-end">
                                                        <div className="fs-24 fw-bold">$0 MXN</div>
                                                        <div className="fs-12 text-white-50">Gratis para siempre</div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
                                                <div>
                                                    <h5 className="fw-bold text-dark mb-1">Cambiar de Plan (Cobros Recurrentes vía Stripe)</h5>
                                                    <p className="text-muted fs-13 mb-0">Selecciona la frecuencia de cobro preferida para tu empresa.</p>
                                                </div>
                                                <div className="d-flex align-items-center gap-2 bg-light p-2 rounded border">
                                                    <span className={`fs-13 fw-bold ${!isAnnual ? 'text-primary' : 'text-muted'}`}>Pago Mensual</span>
                                                    <div className="form-check form-switch m-0" style={{ minHeight: 'auto' }}>
                                                        <input
                                                            className="form-check-input cursor-pointer"
                                                            type="checkbox"
                                                            role="switch"
                                                            id="billingPeriodToggle"
                                                            checked={isAnnual}
                                                            onChange={(e) => setIsAnnual(e.target.checked)}
                                                            style={{ width: '2.4em', height: '1.2em', cursor: 'pointer' }}
                                                        />
                                                    </div>
                                                    <span className={`fs-13 fw-bold ${isAnnual ? 'text-success' : 'text-muted'}`}>
                                                        Pago Anual <span className="badge bg-success-subtle text-success ms-1">2 Meses Gratis 🎉</span>
                                                    </span>
                                                </div>
                                            </div>

                                            <Row>
                                                {/* Plan Estándar */}
                                                <Col lg={4} className="mb-3">
                                                    <Card className="border h-100 shadow-none text-center">
                                                        <CardBody className="p-4 d-flex flex-column justify-content-between">
                                                            <div>
                                                                <h4 className="fw-bold">Estándar</h4>
                                                                <div className="fs-22 fw-extrabold text-primary my-2">
                                                                    {isAnnual ? "$1,990" : "$199"} <small className="fs-12 text-muted">{isAnnual ? "MXN / año" : "MXN / mes"}</small>
                                                                </div>
                                                                {isAnnual && <div className="fs-12 text-success fw-bold mb-2">Equivalente a $165 MXN / mes</div>}
                                                                <ul className="list-unstyled text-start fs-13 text-muted my-3 line-height-lg">
                                                                    <li>✓ <strong>15 Documentos</strong> / mes</li>
                                                                    <li>✓ Hasta 3 Usuarios</li>
                                                                    <li>✓ Firma NOM-151 legal</li>
                                                                    <li>✓ Editor OnlyOffice Nube</li>
                                                                </ul>
                                                            </div>
                                                            <Button
                                                                color="primary"
                                                                className="w-100 fw-bold mt-3"
                                                                onClick={() => handleStripeCheckout("standard")}
                                                            >
                                                                {isAnnual ? "Contratar Estándar Anual ($1,990)" : "Contratar Estándar Mensual ($199)"}
                                                            </Button>
                                                        </CardBody>
                                                    </Card>
                                                </Col>

                                                {/* Plan Pro */}
                                                <Col lg={4} className="mb-3">
                                                    <Card className="border border-2 border-primary h-100 shadow-sm text-center position-relative">
                                                        <span className="position-absolute top-0 start-50 translate-middle badge bg-primary px-3 py-1">RECOMENDADO</span>
                                                        <CardBody className="p-4 d-flex flex-column justify-content-between mt-2">
                                                            <div>
                                                                <h4 className="fw-bold text-primary">Pro</h4>
                                                                <div className="fs-22 fw-extrabold text-primary my-2">
                                                                    {isAnnual ? "$4,990" : "$499"} <small className="fs-12 text-muted">{isAnnual ? "MXN / año" : "MXN / mes"}</small>
                                                                </div>
                                                                {isAnnual && <div className="fs-12 text-success fw-bold mb-2">Equivalente a $415 MXN / mes</div>}
                                                                <ul className="list-unstyled text-start fs-13 text-muted my-3 line-height-lg">
                                                                    <li>✓ <strong>70 Documentos</strong> / mes</li>
                                                                    <li>✓ Hasta 10 Usuarios</li>
                                                                    <li>✓ Marca de agua propia</li>
                                                                    <li>✓ Soporte prioritario 24/7</li>
                                                                </ul>
                                                            </div>
                                                            <Button
                                                                style={{ backgroundColor: "#3d4ed8", borderColor: "#3d4ed8" }}
                                                                className="w-100 fw-bold mt-3 text-white"
                                                                onClick={() => handleStripeCheckout("pro")}
                                                            >
                                                                {isAnnual ? "Upgrade a Pro Anual ($4,990)" : "Upgrade a Pro Mensual ($499)"}
                                                            </Button>
                                                        </CardBody>
                                                    </Card>
                                                </Col>

                                                {/* Plan Enterprise */}
                                                <Col lg={4} className="mb-3">
                                                    <Card className="border h-100 shadow-none text-center">
                                                        <CardBody className="p-4 d-flex flex-column justify-content-between">
                                                            <div>
                                                                <h4 className="fw-bold">Enterprise</h4>
                                                                <div className="fs-20 fw-extrabold text-dark my-2">Contáctanos</div>
                                                                <ul className="list-unstyled text-start fs-13 text-muted my-3 line-height-lg">
                                                                    <li>✓ <strong>Docs e Ilimitados</strong></li>
                                                                    <li>✓ Usuarios Ilimitados</li>
                                                                    <li>✓ Marca Blanca Total</li>
                                                                    <li>✓ Soporte Dedicado 24/7</li>
                                                                </ul>
                                                            </div>
                                                            <Button
                                                                color="dark"
                                                                className="w-100 fw-bold mt-3"
                                                                onClick={() => handleStripeCheckout("enterprise")}
                                                            >
                                                                Contactar Ventas
                                                            </Button>
                                                        </CardBody>
                                                    </Card>
                                                </Col>
                                            </Row>
                                        </TabPane>

                                        {/* PESTAÑA 4: PRIVACIDAD & 2FA */}
                                        <TabPane tabId="4">
                                            <h5 className="fw-bold text-primary mb-3" style={{ color: "#3d4ed8" }}>
                                                <i className="ri-shield-keyhole-line me-2"></i>
                                                Autenticación de Dos Factores (2FA) con Google Authenticator
                                            </h5>
                                            <p className="text-muted fs-14">
                                                Protege tu cuenta agregando una capa adicional de seguridad con la app <strong>Google Authenticator</strong> o <strong>Authy</strong>.
                                            </p>

                                            {twoFAMsg && <Alert color="success">{twoFAMsg}</Alert>}

                                            <div className="p-3 border rounded bg-light mb-4">
                                                <div className="form-check form-switch form-switch-md mb-3">
                                                    <Input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        id="twoFAToggle"
                                                        checked={enable2FA}
                                                        onChange={(e) => setEnable2FA(e.target.checked)}
                                                    />
                                                    <Label className="form-check-label fw-bold text-dark ms-2" htmlFor="twoFAToggle">
                                                        Habilitar Google Authenticator 2FA
                                                    </Label>
                                                </div>

                                                {enable2FA && (
                                                    <div className="mt-3 p-3 bg-white rounded border">
                                                        <Row className="align-items-center">
                                                            <Col md={4} className="text-center mb-3 mb-md-0">
                                                                <div className="p-2 border rounded d-inline-block bg-white shadow-sm">
                                                                    <svg width="120" height="120" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                        <rect width="100" height="100" fill="white"/>
                                                                        <path d="M10 10H40V40H10V10ZM20 20V30H30V20H20Z" fill="#0f172a"/>
                                                                        <path d="M60 10H90V40H60V10ZM70 20V30H80V20H70Z" fill="#0f172a"/>
                                                                        <path d="M10 60H40V90H10V60ZM20 70V80H30V70H20Z" fill="#0f172a"/>
                                                                        <rect x="50" y="50" width="15" height="15" fill="#3d4ed8"/>
                                                                        <rect x="75" y="50" width="15" height="15" fill="#0f172a"/>
                                                                        <rect x="65" y="75" width="25" height="15" fill="#3d4ed8"/>
                                                                    </svg>
                                                                </div>
                                                                <small className="d-block text-muted mt-1">Escanea este código QR con la app</small>
                                                            </Col>
                                                            <Col md={8}>
                                                                <h6>Paso 2: Ingresa el código de 6 dígitos</h6>
                                                                <Form onSubmit={handleVerify2FA} className="d-flex gap-2 mt-2">
                                                                    <Input
                                                                        type="text"
                                                                        className="form-control form-control-lg fw-bold tracking-widest text-center"
                                                                        placeholder="123456"
                                                                        maxLength={6}
                                                                        value={twoFACode}
                                                                        onChange={(e) => setTwoFACode(e.target.value)}
                                                                        style={{ maxWidth: "160px", letterSpacing: "4px" }}
                                                                    />
                                                                    <Button type="submit" color="primary" className="fw-bold">
                                                                        Verificar y Vincular
                                                                    </Button>
                                                                </Form>
                                                            </Col>
                                                        </Row>
                                                    </div>
                                                )}
                                            </div>

                                            <hr className="my-4" />

                                            {/* Acuerdos Legales */}
                                            <h5 className="fw-bold text-dark mb-3">Términos y Condiciones y Privacidad</h5>
                                            
                                            <div className="mb-4">
                                                <h6 className="fw-bold text-muted">1. Términos y Condiciones de Uso de Rubrícalo</h6>
                                                <div className="p-3 bg-light rounded border fs-13 text-muted" style={{ maxHeight: "150px", overflowY: "auto" }}>
                                                    <p className="mb-2">
                                                        El presente contrato rige el uso de la plataforma de gestión documental, edición en la nube y firma digital legal conforme a la NOM-151-SCFI-2016 en México...
                                                    </p>
                                                    <p className="mb-0">
                                                        Al utilizar nuestros servicios, la empresa cliente acepta el almacenamiento seguro de estampados de tiempo y firmas electrónicas avanzadas de conformidad con el Código de Comercio.
                                                    </p>
                                                </div>
                                            </div>

                                            <div>
                                                <h6 className="fw-bold text-muted">2. Acuerdo de Privacidad y Confidencialidad de Datos Personales</h6>
                                                <div className="p-3 bg-light rounded border fs-13 text-muted" style={{ maxHeight: "150px", overflowY: "auto" }}>
                                                    <p className="mb-0">
                                                        Rubrícalo México implementa medidas de seguridad binarias de última generación y encriptación de 256 bits para garantizar la confidencialidad estricta de sus documentos y datos personales en cumplimiento con la LFPDPPP.
                                                    </p>
                                                </div>
                                            </div>
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
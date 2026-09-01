import React, { useEffect, useState } from 'react';
import { Card, CardBody, Col, Container, Input, Label, Row, Button, Form, FormFeedback, Alert, Spinner } from 'reactstrap';
import ParticlesAuth from "../AuthenticationInner/ParticlesAuth";

// redux
import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import withRouter from "../../Components/Common/withRouter";

// Formik validation
import * as Yup from "yup";
import { useFormik } from "formik";

// actions
import { apiError } from "../../slices/auth/login/reducer";
import { createSelector } from 'reselect';

const Login = (props) => {
    const dispatch = useDispatch();
    const selectLayoutState = (state) => state.Account;
    const selectLayoutProperties = createSelector(
        selectLayoutState,
        (layout) => ({
            user: layout.user,
            errorMsg: layout.errorMsg,
            loading: layout.loading,
            error: layout.error,
        })
    );

    const { user, errorMsg, error } = useSelector(selectLayoutProperties);

    const [userLogin] = useState([]);
    const [passwordShow, setPasswordShow] = useState(false);
    const [loginError, setLoginError] = useState(null);

    useEffect(() => {
        if (user && (user.token || user.user)) {
            window.location.href = "/dashboard";
            return;
        }
        const authUser = sessionStorage.getItem("authUser") || localStorage.getItem("authUser");
        if (authUser) {
            try {
                const parsed = JSON.parse(authUser);
                if (parsed && (parsed.token || parsed.user)) {
                    window.location.href = "/dashboard";
                }
            } catch (e) {}
        }
    }, [user]);

    const validation = useFormik({
        enableReinitialize: true,
        initialValues: {
            email: userLogin.email || "demo@rubricalo.com",
            password: userLogin.password || "rubricalo123",
        },
        validationSchema: Yup.object({
            email: Yup.string().required("Ingresa tu correo electrónico"),
            password: Yup.string().required("Ingresa tu contraseña"),
        }),
        onSubmit: async (values, { setSubmitting }) => {
            setLoginError(null);
            try {
                const apiUrl = process.env.REACT_APP_API_URL || "https://api.rubricalo.com";
                const res = await fetch(`${apiUrl}/auth/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: values.email, password: values.password }),
                });
                const data = await res.json();
                if (res.ok && data.token) {
                    sessionStorage.setItem("authUser", JSON.stringify(data));
                    localStorage.setItem("authUser", JSON.stringify(data));
                    window.location.href = "/dashboard";
                } else {
                    setLoginError(data.error || "Credenciales inválidas");
                    dispatch(apiError(data.error || "Credenciales inválidas"));
                }
            } catch (err) {
                setLoginError("Error de conexión con el servidor: " + err.message);
                dispatch(apiError("Error de conexión con el servidor"));
            } finally {
                setSubmitting(false);
            }
        }
    });

    document.title = "Iniciar Sesión | Rúbricalo";

    return (
        <React.Fragment>
            <ParticlesAuth>
                <div className="auth-page-content">
                    <Container>
                        <Row>
                            <Col lg={12}>
                                <div className="text-center mt-sm-5 mb-4 text-white-50">
                                    <div>
                                        <a href="https://rubricalo.com" className="d-inline-flex align-items-center gap-2 text-decoration-none">
                                            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <rect width="40" height="40" rx="8" fill="#3D4ED8"/>
                                                <path d="M12 14H28V17H12V14ZM12 20H28V23H12V20ZM12 26H22V29H12V26Z" fill="white"/>
                                            </svg>
                                            <span style={{ fontSize: "1.8rem", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.5px" }}>
                                                RÚBRICALO
                                            </span>
                                        </a>
                                    </div>
                                    <p className="mt-2 fs-15 text-white-50">Plataforma Empresarial de Firma Digital y Gestión Documental</p>
                                </div>
                            </Col>
                        </Row>

                        <Row className="justify-content-center">
                            <Col md={8} lg={6} xl={5}>
                                <Card className="mt-4 border-0 shadow-lg" style={{ borderRadius: "12px" }}>
                                    <CardBody className="p-4">
                                        <div className="text-center mt-2">
                                            <h4 className="fw-bold text-primary" style={{ color: "#3d4ed8" }}>¡Bienvenido a Rúbricalo!</h4>
                                            <p className="text-muted">Ingresa tus credenciales para acceder a tu plataforma.</p>
                                        </div>
                                        {(loginError || error) ? (<Alert color="danger" className="mt-3"> {loginError || error} </Alert>) : null}
                                        <div className="p-2 mt-4">
                                            <Form
                                                onSubmit={(e) => {
                                                    e.preventDefault();
                                                    validation.handleSubmit();
                                                    return false;
                                                }}
                                                action="#">

                                                <div className="mb-3">
                                                    <Label htmlFor="email" className="form-label fw-semibold">Correo Electrónico</Label>
                                                    <Input
                                                        name="email"
                                                        className="form-control form-control-lg"
                                                        placeholder="ej. demo@rubricalo.com"
                                                        type="email"
                                                        onChange={validation.handleChange}
                                                        onBlur={validation.handleBlur}
                                                        value={validation.values.email || ""}
                                                        invalid={
                                                            validation.touched.email && validation.errors.email ? true : false
                                                        }
                                                    />
                                                    {validation.touched.email && validation.errors.email ? (
                                                        <FormFeedback type="invalid">{validation.errors.email}</FormFeedback>
                                                    ) : null}
                                                </div>

                                                <div className="mb-3">
                                                    <div className="float-end">
                                                        <Link to="/forgot-password" className="text-muted small">¿Olvidaste tu contraseña?</Link>
                                                    </div>
                                                    <Label className="form-label fw-semibold" htmlFor="password-input">Contraseña</Label>
                                                    <div className="position-relative auth-pass-inputgroup mb-3">
                                                        <Input
                                                            name="password"
                                                            value={validation.values.password || ""}
                                                            type={passwordShow ? "text" : "password"}
                                                            className="form-control form-control-lg pe-5"
                                                            placeholder="Ingresa tu contraseña"
                                                            onChange={validation.handleChange}
                                                            onBlur={validation.handleBlur}
                                                            invalid={
                                                                validation.touched.password && validation.errors.password ? true : false
                                                            }
                                                        />
                                                        {validation.touched.password && validation.errors.password ? (
                                                            <FormFeedback type="invalid">{validation.errors.password}</FormFeedback>
                                                        ) : null}
                                                        <button className="btn btn-link position-absolute end-0 top-0 text-decoration-none text-muted" type="button" onClick={() => setPasswordShow(!passwordShow)} id="password-addon"><i className="ri-eye-fill align-middle"></i></button>
                                                    </div>
                                                </div>

                                                <div className="form-check">
                                                    <Input className="form-check-input" type="checkbox" value="" id="auth-remember-check" />
                                                    <Label className="form-check-label" htmlFor="auth-remember-check">Recordarme en este equipo</Label>
                                                </div>

                                                <div className="mt-4">
                                                    <Button
                                                        disabled={validation.isSubmitting}
                                                        className="btn btn-lg w-100 fw-bold"
                                                        style={{ backgroundColor: "#3d4ed8", borderColor: "#3d4ed8", color: "#ffffff" }}
                                                        type="submit"
                                                    >
                                                        {validation.isSubmitting ? <Spinner size="sm" className='me-2'> Validando... </Spinner> : null}
                                                        Iniciar Sesión
                                                    </Button>
                                                </div>
                                            </Form>
                                        </div>
                                    </CardBody>
                                </Card>

                                <div className="mt-4 text-center">
                                    <p className="mb-0 text-white-50">
                                        ¿Aún no tienes cuenta?{" "}
                                        <a href="https://rubricalo.com#precios" className="fw-bold text-white text-decoration-underline">
                                            Registrar Mi Empresa
                                        </a>
                                    </p>
                                </div>

                            </Col>
                        </Row>
                    </Container>
                </div>
            </ParticlesAuth>
        </React.Fragment>
    );
};

export default withRouter(Login);
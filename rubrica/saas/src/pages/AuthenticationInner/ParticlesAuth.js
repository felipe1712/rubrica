import React from 'react';
import withRouter from '../../Components/Common/withRouter';

const ParticlesAuth = ({ children }) => {
    return (
        <React.Fragment>
            <div className="auth-page-wrapper pt-5" style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
                {/* Banner Azul con Degradado idéntico a la Landing Page */}
                <div
                    className="auth-one-bg-position"
                    style={{
                        background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)",
                        paddingBottom: "140px",
                        position: "relative"
                    }}
                >
                    <div className="bg-overlay" style={{ opacity: 0.15, background: "radial-gradient(circle at 50% 50%, #3d4ed8 0%, transparent 70%)" }}></div>

                    {/* Desvanecimiento en Curva SVG */}
                    <div className="shape" style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 1 }}>
                        <svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 1440 120" style={{ fill: "#f8fafc", width: "100%", height: "auto" }}>
                            <path d="M 0,36 C 144,53.6 432,123.2 720,124 C 1008,124.8 1296,56.8 1440,40L1440 140L0 140z"></path>
                        </svg>
                    </div>
                </div>

                {/* Contenido Principal (Formulario de Login) */}
                <div style={{ marginTop: "-170px", position: "relative", zIndex: 2 }}>
                    {children}
                </div>

                {/* Footer Corporativo Rubrícalo */}
                <footer className="footer" style={{ background: "transparent", position: "relative", zIndex: 2, padding: "30px 0 20px" }}>
                    <div className="container">
                        <div className="row">
                            <div className="col-lg-12">
                                <div className="text-center">
                                    <p className="mb-0 text-muted" style={{ fontSize: "0.95rem" }}>
                                        &copy; {new Date().getFullYear()} <strong>Rubrícalo México</strong> — Todos los derechos reservados.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </React.Fragment>
    );
};

export default withRouter(ParticlesAuth);
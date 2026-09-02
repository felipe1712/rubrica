import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from 'reactstrap';

const ProfileDropdown = () => {
    const [userName, setUserName] = useState("Usuario");
    const [userRole, setUserRole] = useState("Administrador");
    const [isProfileDropdown, setIsProfileDropdown] = useState(false);

    useEffect(() => {
        const raw = sessionStorage.getItem("authUser") || localStorage.getItem("authUser");
        if (raw) {
            try {
                const obj = JSON.parse(raw);
                if (obj.user) {
                    setUserName(obj.user.name || obj.user.email || "Usuario");
                    setUserRole(obj.user.role === "SUPERADMIN" ? "SuperAdmin" : (obj.tenant?.name || "Administrador"));
                } else if (obj.name) {
                    setUserName(obj.name);
                }
            } catch (e) {}
        }
    }, []);

    const toggleProfileDropdown = () => {
        setIsProfileDropdown(!isProfileDropdown);
    };

    return (
        <React.Fragment>
            <Dropdown isOpen={isProfileDropdown} toggle={toggleProfileDropdown} className="ms-sm-3 header-item topbar-user bg-transparent">
                <DropdownToggle
                    tag="button"
                    type="button"
                    className="btn border-0 d-flex align-items-center py-1 px-3"
                    style={{
                        backgroundColor: "rgba(255, 255, 255, 0.12)",
                        border: "1px solid rgba(255, 255, 255, 0.25)",
                        borderRadius: "10px",
                        backdropFilter: "blur(8px)",
                        WebkitBackdropFilter: "blur(8px)",
                        transition: "all 0.3s ease"
                    }}
                >
                    <span className="d-flex align-items-center">
                        {/* Foto genérica: silueta de persona en blanco sobre círculo azul corporativo */}
                        <div
                            className="rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                            style={{
                                width: "34px",
                                height: "34px",
                                backgroundColor: "#3d4ed8",
                                border: "2px solid rgba(255,255,255,0.4)",
                                flexShrink: 0
                            }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z" fill="white"/>
                                <path d="M12 14C7.58172 14 4 16.6863 4 20C4 20.5523 4.44772 21 5 21H19C19.5523 21 20 20.5523 20 20C20 16.6863 16.4183 14 12 14Z" fill="white"/>
                            </svg>
                        </div>
                        <span className="text-start ms-2">
                            <span className="d-none d-xl-inline-block ms-1 fw-bold text-white fs-14 user-name-text">{userName}</span>
                            <span className="d-none d-xl-block ms-1 fs-12 text-white-50 user-name-sub-text">{userRole}</span>
                        </span>
                    </span>
                </DropdownToggle>
                <DropdownMenu className="dropdown-menu-end shadow-lg border-0 mt-2" style={{ borderRadius: "10px", minWidth: "200px" }}>
                    <h6 className="dropdown-header text-primary fw-bold" style={{ color: "#3d4ed8" }}>¡Hola, {userName}!</h6>
                    
                    {/* 1. Perfil (Unificado con Ajustes de Cuenta y Cambio de Contraseña) */}
                    <DropdownItem className='p-0'>
                        <Link to="/pages-profile-settings" className="dropdown-item py-2 px-3">
                            <i className="ri-user-3-line text-muted fs-16 align-middle me-2"></i>
                            <span className="align-middle fw-medium">Perfil</span>
                        </Link>
                    </DropdownItem>

                    <div className="dropdown-divider my-1"></div>

                    {/* 2. Cerrar Sesión */}
                    <DropdownItem className='p-0'>
                        <Link to="/logout" className="dropdown-item py-2 px-3 text-danger">
                            <i className="ri-logout-box-r-line fs-16 align-middle me-2 text-danger"></i>
                            <span className="align-middle fw-bold">Cerrar Sesión</span>
                        </Link>
                    </DropdownItem>
                </DropdownMenu>
            </Dropdown>
        </React.Fragment>
    );
};

export default ProfileDropdown;
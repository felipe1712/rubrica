import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Navdata = () => {
  const history = useNavigate();

  const [isDocumentos, setIsDocumentos] = useState(false);
  const [isSoporte, setIsSoporte] = useState(false);
  const [iscurrentState, setIscurrentState] = useState("AdminGlobal");

  function updateIconSidebar(e) {
    if (e && e.target && e.target.getAttribute("sub-items")) {
      const ul = document.getElementById("two-column-menu");
      const iconItems = ul ? ul.querySelectorAll(".nav-icon.active") : [];
      iconItems.forEach((item) => item.classList.remove("active"));
      e.target.classList.add("active");
    }
  }

  useEffect(() => {
    document.body.classList.remove("twocolumn-panel");
    if (iscurrentState !== "Documentos") setIsDocumentos(false);
    if (iscurrentState !== "Soporte")    setIsSoporte(false);
  }, [history, iscurrentState, isDocumentos, isSoporte]);

  // Verificar rol y plan del usuario autenticado
  const raw = sessionStorage.getItem("authUser") || localStorage.getItem("authUser");
  let isSuperAdmin = false;
  let isFreePlan = false;

  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      const user = parsed.user || parsed;
      const tenant = parsed.tenant || user.tenant;

      if (user.role === 'SUPERADMIN' || user.isSuperAdmin || parsed.isSuperAdmin) {
        isSuperAdmin = true;
      }

      const planName = (tenant?.plan || user.plan || "").toLowerCase();
      if (!planName || planName === 'free' || planName === 'gratis' || planName === 'trial') {
        if (planName !== 'standard' && planName !== 'pro' && planName !== 'enterprise') {
          isFreePlan = true;
        }
      }
    } catch (e) {}
  }

  // SI ES SUPERADMINISTRADOR: El menú superior contiene ÚNICAMENTE la opción "Administración Global"
  if (isSuperAdmin) {
    const adminMenuItem = [
      {
        id: "admin-global",
        label: "Administración Global",
        icon: "ri-shield-keyhole-line",
        link: "/",
        stateVariables: iscurrentState === "AdminGlobal",
      }
    ];
    return <React.Fragment>{adminMenuItem}</React.Fragment>;
  }

  // PARA USUARIOS REGULARES DE LA PLATAFORMA:
  const menuItems = [
    {
      label: "Menu",
      isHeader: true,
    },
    {
      id: "dashboard",
      label: "Dashboard",
      icon: "ri-dashboard-2-line",
      link: "/dashboard",
      click: function (e) {
        e.preventDefault();
        setIscurrentState("Dashboard");
      },
      stateVariables: iscurrentState === "Dashboard",
    },
    {
      id: "documentos",
      label: "Documentos",
      icon: "ri-file-text-line",
      link: "/#",
      click: function (e) {
        e.preventDefault();
        setIsDocumentos(!isDocumentos);
        setIscurrentState("Documentos");
        updateIconSidebar(e);
      },
      stateVariables: isDocumentos,
      subItems: [
        { id: "mis-documentos", label: "Mis Documentos", link: "/documentos", parentId: "documentos" },
        { id: "nuevo-documento", label: "Subir Documento", link: "/documentos/nuevo", parentId: "documentos" },
      ],
    },
    {
      id: "herramientas-pdf",
      label: "Herramientas PDF",
      icon: "ri-tools-line",
      link: "/herramientas-pdf",
      click: function (e) {
        e.preventDefault();
        setIscurrentState("HerramientasPDF");
      },
      stateVariables: iscurrentState === "HerramientasPDF",
    },
    {
      id: "usuarios",
      label: "Usuarios",
      icon: "ri-group-line",
      link: "/usuarios",
      click: function (e) {
        e.preventDefault();
        setIscurrentState("Usuarios");
      },
      stateVariables: iscurrentState === "Usuarios",
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: "ri-bar-chart-2-line",
      link: "/analytics",
      click: function (e) {
        e.preventDefault();
        setIscurrentState("Analytics");
      },
      stateVariables: iscurrentState === "Analytics",
    },
  ];

  // Si el usuario tiene un paquete de pago, se agrega la opción "Facturación"
  if (!isFreePlan) {
    menuItems.push({
      id: "facturas",
      label: "Facturación",
      icon: "ri-bill-line",
      link: "/facturas",
      click: function (e) {
        e.preventDefault();
        setIscurrentState("Facturas");
      },
      stateVariables: iscurrentState === "Facturas",
    });
  }

  return <React.Fragment>{menuItems}</React.Fragment>;
};

export default Navdata;

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Navdata = () => {
  const history = useNavigate();

  const [isDocumentos, setIsDocumentos] = useState(false);
  const [isSoporte, setIsSoporte] = useState(false);
  const [iscurrentState, setIscurrentState] = useState("Dashboard");

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
    {
      id: "facturas",
      label: "Facturacion",
      icon: "ri-bill-line",
      link: "/facturas",
      click: function (e) {
        e.preventDefault();
        setIscurrentState("Facturas");
      },
      stateVariables: iscurrentState === "Facturas",
    },
    {
      label: "Cuenta",
      isHeader: true,
    },
    {
      id: "soporte",
      label: "Soporte",
      icon: "ri-customer-service-2-line",
      link: "/soporte",
      click: function (e) {
        e.preventDefault();
        setIsSoporte(!isSoporte);
        setIscurrentState("Soporte");
        updateIconSidebar(e);
      },
      stateVariables: isSoporte,
      subItems: [
        { id: "tickets-list", label: "Mis Tickets", link: "/soporte", parentId: "soporte" },
      ],
    },
    {
      id: "configuracion",
      label: "Configuracion",
      icon: "ri-settings-3-line",
      link: "/settings",
      click: function (e) {
        e.preventDefault();
        setIscurrentState("Configuracion");
      },
      stateVariables: iscurrentState === "Configuracion",
    },
    {
      id: "perfil",
      label: "Mi Perfil",
      icon: "ri-user-3-line",
      link: "/profile",
      click: function (e) {
        e.preventDefault();
        setIscurrentState("Perfil");
      },
      stateVariables: iscurrentState === "Perfil",
    },
  ];

  return <React.Fragment>{menuItems}</React.Fragment>;
};

export default Navdata;

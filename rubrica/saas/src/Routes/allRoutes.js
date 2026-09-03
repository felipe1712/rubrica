import React from "react";
import { Navigate } from "react-router-dom";

// Dashboard
import DashboardEcommerce from "../pages/DashboardEcommerce";

// Documentos
import Documentos from "../pages/Documentos";
import NuevoDocumento from "../pages/Documentos/NuevoDocumento";
import DetalleDocumento from "../pages/Documentos/DetalleDocumento";
import HerramientasPDF from "../pages/HerramientasPDF";
import Editor from "../pages/Editor";

// Authentication pages
import Login from "../pages/Authentication/Login";
import Logout from "../pages/Authentication/Logout";
import Register from "../pages/Authentication/Register";
import ForgetPasswordPage from "../pages/Authentication/ForgetPassword";
import UserProfile from "../pages/Authentication/user-profile";

// Soporte / Tickets
import ListView from "../pages/SupportTickets/ListView";
import TicketsDetails from "../pages/SupportTickets/TicketsDetails";

// Equipo y Plataforma SuperAdmin
import Usuarios from "../pages/Usuarios";
import AdminDashboard from "../pages/AdminDashboard";
import AdminGlobalDashboard from "../pages/AdminGlobalDashboard";

// Pages
import Facturas from "../pages/Facturas";
import Settings from "../pages/Pages/Profile/Settings/Settings";
import Basic404 from "../pages/AuthenticationInner/Errors/Basic404";
import Error500 from "../pages/AuthenticationInner/Errors/Error500";
import Maintenance from "../pages/Pages/Maintenance/Maintenance";
import ComingSoon from "../pages/Pages/ComingSoon/ComingSoon";

export const isSuperAdminSession = () => {
  if (typeof window === "undefined") return false;
  if (window.location.hostname.startsWith("admin")) return true;
  try {
    const raw = sessionStorage.getItem("authUser") || localStorage.getItem("authUser");
    if (raw) {
      const parsed = JSON.parse(raw);
      const user = parsed.user || parsed.admin || parsed;
      if (user.role === 'SUPERADMIN' || user.isSuperAdmin || parsed.isSuperAdmin) return true;
    }
  } catch (e) {}
  return false;
};

// Componente inteligente de redirección raíz (se evalúa en tiempo de renderizado de React)
const RootRedirect = () => {
  if (isSuperAdminSession()) {
    return <AdminGlobalDashboard />;
  }
  return <Navigate to="/dashboard" replace />;
};

const DashboardOrAdmin = () => {
  if (isSuperAdminSession()) {
    return <AdminGlobalDashboard />;
  }
  return <DashboardEcommerce />;
};

const authProtectedRoutes = [
  // Ruta raíz inteligente
  { path: "/", exact: true, component: <RootRedirect /> },

  // Dashboard (SuperAdmin ve AdminGlobalDashboard, cliente ve DashboardEcommerce)
  { path: "/dashboard", component: <DashboardOrAdmin /> },
  { path: "/index",     component: <DashboardOrAdmin /> },

  // SuperAdmin Dashboard (Plataforma)
  { path: "/admin",               component: <AdminGlobalDashboard /> },
  { path: "/admin/dashboard",     component: <AdminGlobalDashboard /> },
  { path: "/admin/global",        component: <AdminGlobalDashboard /> },

  // Documentos
  { path: "/documentos",          component: <Documentos /> },
  { path: "/documentos/nuevo",    component: <NuevoDocumento /> },
  { path: "/documentos/:id",      component: <DetalleDocumento /> },

  // Herramientas PDF
  { path: "/herramientas-pdf",    component: <HerramientasPDF /> },

  // Editor de documentos (OnlyOffice)
  { path: "/editor/:id",          component: <Editor /> },

  // Usuarios del Equipo (Tenant)
  { path: "/usuarios",            component: <Usuarios /> },

  // Facturación
  { path: "/facturas", component: <Facturas /> },

  // Soporte
  { path: "/soporte",     component: <ListView /> },
  { path: "/soporte/:id", component: <TicketsDetails /> },

  // Perfil y configuracion
  { path: "/profile",                 component: <UserProfile /> },
  { path: "/pages-profile",           component: <UserProfile /> },
  { path: "/perfil",                  component: <UserProfile /> },
  { path: "/settings",                component: <Settings /> },
  { path: "/pages-profile-settings",  component: <Settings /> },
  { path: "/cambiar-password",        component: <Settings /> },

  // Catch-all
  { path: "*", component: <RootRedirect /> }
];

const publicRoutes = [
  { path: "/login",           component: <Login /> },
  { path: "/logout",          component: <Logout /> },
  { path: "/register",        component: <Register /> },
  { path: "/forgot-password", component: <ForgetPasswordPage /> },
  { path: "/maintenance",     component: <Maintenance /> },
  { path: "/coming-soon",     component: <ComingSoon /> },
  { path: "/404",             component: <Basic404 /> },
  { path: "/500",             component: <Error500 /> },
];

export { authProtectedRoutes, publicRoutes };

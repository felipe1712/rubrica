import React from "react";
import { Navigate } from "react-router-dom";

// Dashboard
import DashboardEcommerce from "../pages/DashboardEcommerce";

// Authentication pages
import Login from "../pages/Authentication/Login";
import Logout from "../pages/Authentication/Logout";
import Register from "../pages/Authentication/Register";
import ForgetPasswordPage from "../pages/Authentication/ForgetPassword";
import UserProfile from "../pages/Authentication/user-profile";

// Soporte / Tickets
import ListView from "../pages/SupportTickets/ListView";
import TicketsDetails from "../pages/SupportTickets/TicketsDetails";

// Pages
import Settings from "../pages/Pages/Profile/Settings/Settings";
import Basic404 from "../pages/AuthenticationInner/Errors/Basic404";
import Error500 from "../pages/AuthenticationInner/Errors/Error500";
import Maintenance from "../pages/Pages/Maintenance/Maintenance";
import ComingSoon from "../pages/Pages/ComingSoon/ComingSoon";

const authProtectedRoutes = [
  // Dashboard principal
  { path: "/dashboard", component: <DashboardEcommerce /> },
  { path: "/index",     component: <DashboardEcommerce /> },

  // Soporte
  { path: "/soporte",     component: <ListView /> },
  { path: "/soporte/:id", component: <TicketsDetails /> },

  // Perfil y configuracion
  { path: "/profile",  component: <UserProfile /> },
  { path: "/settings", component: <Settings /> },

  // Catch-all -> dashboard
  { path: "/", exact: true, component: <Navigate to="/dashboard" /> },
  { path: "*",              component: <Navigate to="/dashboard" /> },
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

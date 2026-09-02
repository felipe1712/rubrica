import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { logoutUser } from "../../slices/thunks";
import withRouter from "../../Components/Common/withRouter";

const Logout = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    // 1. Borrar completamente la sesión y tokens almacenados
    sessionStorage.removeItem("authUser");
    localStorage.removeItem("authUser");
    sessionStorage.clear();
    localStorage.clear();

    // 2. Notificar al estado global
    dispatch(logoutUser());

    // 3. Redirigir inmediatamente a la página principal (Landing Page)
    window.location.href = "https://rubricalo.com";
  }, [dispatch]);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      backgroundColor: "#0f172a",
      color: "#ffffff",
      fontFamily: "system-ui, -apple-system, sans-serif"
    }}>
      <svg width="45" height="45" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: "15px" }}>
        <rect width="40" height="40" rx="8" fill="#3D4ED8"/>
        <path d="M12 14H28V17H12V14ZM12 20H28V23H12V20ZM12 26H22V29H12V26Z" fill="white"/>
      </svg>
      <h4 style={{ fontWeight: 700, margin: 0 }}>Cerrando sesión de Rubrícalo...</h4>
      <p style={{ color: "#94a3b8", fontSize: "0.9rem", marginTop: "8px" }}>Redirigiendo a la página principal</p>
    </div>
  );
};

export default withRouter(Logout);
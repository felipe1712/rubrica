import React from "react";
import { Link } from "react-router-dom";
import ProfileDropdown from "../Components/Common/ProfileDropdown";
import { changeSidebarVisibility } from "../slices/thunks";
import { useSelector, useDispatch } from "react-redux";
import { createSelector } from "reselect";

const Header = ({ headerClass }) => {
  const dispatch = useDispatch();

  const sidebarVisibilityData = createSelector(
    (state) => state.Layout,
    (layout) => layout.sidebarVisibilitytype
  );
  const sidebarVisibilitytype = useSelector(sidebarVisibilityData);

  const toogleMenuBtn = () => {
    const windowSize = document.documentElement.clientWidth;
    dispatch(changeSidebarVisibility("show"));

    if (windowSize > 767) {
      const icon = document.querySelector(".hamburger-icon");
      if (icon) icon.classList.toggle("open");
    }

    if (document.documentElement.getAttribute("data-layout") === "horizontal") {
      document.body.classList.contains("menu")
        ? document.body.classList.remove("menu")
        : document.body.classList.add("menu");
    }

    if (
      sidebarVisibilitytype === "show" &&
      (document.documentElement.getAttribute("data-layout") === "vertical" ||
        document.documentElement.getAttribute("data-layout") === "semibox")
    ) {
      if (windowSize < 1025 && windowSize > 767) {
        document.body.classList.remove("vertical-sidebar-enable");
        document.documentElement.getAttribute("data-sidebar-size") === "sm"
          ? document.documentElement.setAttribute("data-sidebar-size", "")
          : document.documentElement.setAttribute("data-sidebar-size", "sm");
      } else if (windowSize > 1025) {
        document.body.classList.remove("vertical-sidebar-enable");
        document.documentElement.getAttribute("data-sidebar-size") === "lg"
          ? document.documentElement.setAttribute("data-sidebar-size", "sm")
          : document.documentElement.setAttribute("data-sidebar-size", "lg");
      } else if (windowSize <= 767) {
        document.body.classList.add("vertical-sidebar-enable");
        document.documentElement.setAttribute("data-sidebar-size", "lg");
      }
    }

    if (document.documentElement.getAttribute("data-layout") === "twocolumn") {
      document.body.classList.contains("twocolumn-panel")
        ? document.body.classList.remove("twocolumn-panel")
        : document.body.classList.add("twocolumn-panel");
    }
  };

  return (
    <React.Fragment>
      <style>{`
        .topbar-user {
          background-color: transparent !important;
          background: transparent !important;
        }
        .topbar-user .btn {
          background-color: rgba(255, 255, 255, 0.12) !important;
          border: 1px solid rgba(255, 255, 255, 0.25) !important;
          border-radius: 10px !important;
        }
        .topbar-user .btn:hover {
          background-color: rgba(255, 255, 255, 0.22) !important;
          border-color: rgba(255, 255, 255, 0.4) !important;
        }
      `}</style>
      <header
        id="page-topbar"
        className={headerClass}
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)",
          boxShadow: "0 4px 15px rgba(0,0,0,0.25)",
          borderBottom: "1px solid rgba(255,255,255,0.1)"
        }}
      >
        <div className="layout-width">
          <div className="navbar-header d-flex align-items-center justify-content-between">

            {/* LOGO CORPORATIVO RUBRICALO & HAMBURGER */}
            <div className="d-flex align-items-center gap-3">
              <div className="navbar-brand-box horizontal-logo bg-transparent p-0 border-0">
                <Link to="/dashboard" className="d-inline-flex align-items-center gap-2 text-decoration-none py-1">
                  <svg width="34" height="34" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="40" height="40" rx="8" fill="#3D4ED8"/>
                    <path d="M12 14H28V17H12V14ZM12 20H28V23H12V20ZM12 26H22V29H12V26Z" fill="white"/>
                  </svg>
                  <span style={{ fontSize: "1.4rem", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.5px" }}>
                    RUBRÍCALO
                  </span>
                </Link>
              </div>

              {/* Boton menu lateral */}
              <button
                onClick={toogleMenuBtn}
                type="button"
                className="btn btn-sm px-2 fs-16 header-item vertical-menu-btn topnav-hamburger text-white"
                id="topnav-hamburger-icon"
                style={{ color: "#ffffff" }}
              >
                <span className="hamburger-icon open">
                  <span style={{ backgroundColor: "#ffffff" }}></span>
                  <span style={{ backgroundColor: "#ffffff" }}></span>
                  <span style={{ backgroundColor: "#ffffff" }}></span>
                </span>
              </button>
            </div>

            {/* PERFIL DE USUARIO */}
            <div className="d-flex align-items-center">
              <ProfileDropdown />
            </div>

          </div>
        </div>
      </header>
    </React.Fragment>
  );
};

export default Header;

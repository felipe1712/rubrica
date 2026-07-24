import React from "react";
import { Link } from "react-router-dom";
import ProfileDropdown from "../Components/Common/ProfileDropdown";
import { changeSidebarVisibility } from "../slices/thunks";
import { useSelector, useDispatch } from "react-redux";
import { createSelector } from "reselect";

// Logos — se reemplazaran con los de Rubricalo
import logoSm   from "../assets/images/logo-sm.png";
import logoDark from "../assets/images/logo-dark.png";
import logoLight from "../assets/images/logo-light.png";

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

    if (windowSize > 767)
      document.querySelector(".hamburger-icon").classList.toggle("open");

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
      <header id="page-topbar" className={headerClass}>
        <div className="layout-width">
          <div className="navbar-header">

            {/* LOGO */}
            <div className="d-flex align-items-center">
              <div className="navbar-brand-box horizontal-logo">
                <Link to="/" className="logo logo-dark">
                  <span className="logo-sm">
                    <img src={logoSm} alt="Rubricalo" height="22" />
                  </span>
                  <span className="logo-lg">
                    <img src={logoDark} alt="Rubricalo" height="22" />
                  </span>
                </Link>
                <Link to="/" className="logo logo-light">
                  <span className="logo-sm">
                    <img src={logoSm} alt="Rubricalo" height="22" />
                  </span>
                  <span className="logo-lg">
                    <img src={logoLight} alt="Rubricalo" height="22" />
                  </span>
                </Link>
              </div>

              {/* Hamburger */}
              <button
                onClick={toogleMenuBtn}
                type="button"
                className="btn btn-sm px-3 fs-16 header-item vertical-menu-btn topnav-hamburger"
                id="topnav-hamburger-icon"
              >
                <span className="hamburger-icon">
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
              </button>
            </div>

            {/* Solo perfil de usuario */}
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

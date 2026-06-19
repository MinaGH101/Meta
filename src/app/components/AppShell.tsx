import { CSSProperties, ReactNode } from "react";
import { useNavigate } from "react-router";
import { Sun, Moon, User } from "lucide-react";
import { useDark, useAuth } from "../context";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import logo from "../assets/meta_logo.png";
import StaggeredMenu from "./ui/StaggeredMenu";

interface Props {
  children: ReactNode;
  transparent?: boolean;
  centerContent?: ReactNode;
}

export function AppShell({
  children,
  transparent = false,
  centerContent,
}: Props) {
  const { dark, toggleDark } = useDark();
  const { user } = useAuth();
  const navigate = useNavigate();

  const bg = dark ? "#1a1919" : "#f0efef";
  const muted = dark ? "rgba(255,255,255,0.58)" : "rgba(0,0,0,0.55)";
  const border = dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)";
  const gold = dark ? "#d4af37" : "#b88925";
  const text = dark ? "#f5ead2" : "#2a1717";

  const navLinks = [
    { label: "درباره ما", ariaLabel: "درباره ما", link: "/about" },
    { label: "تماس با ما", ariaLabel: "تماس با ما", link: "/contact" },
    { label: "طراحی", ariaLabel: "طراحی", link: "/tarrahi" },
    { label: "نظارت", ariaLabel: "نظارت", link: "/nezarat" },
    { label: "اجرا", ariaLabel: "اجرا", link: "/ejra" },
  ];

  const barStyle: CSSProperties = transparent
    ? {
        background: "transparent",
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 30,
      }
    : {
        background: bg,
        borderBottom: "none",
        boxShadow: "none",
        position: "sticky",
        top: 0,
        zIndex: 30,
      };

  return (
    <div
      className="flex flex-col min-h-screen w-full"
      dir="rtl"
      style={{
        fontFamily: "var(--app-font-family)",
        background: bg,
        color: text,
        position: "relative",
      }}
    >
      <style>{`
        .meta-staggered-main-menu {
          --meta-menu-bg: ${dark ? "#1a1919" : "#f0efef"};
          --meta-menu-text: ${gold};
          --meta-menu-hover: ${dark ? "#ffffff" : "#BD3039"};
          --meta-menu-border: ${dark ? "rgba(212,175,55,0.28)" : "rgba(184,137,37,0.28)"};
          --meta-menu-shadow: ${dark ? "-24px 0 60px rgba(0,0,0,0.45)" : "-24px 0 60px rgba(139,26,42,0.18)"};
        }

        .meta-staggered-main-menu.staggered-menu-wrapper {
          position: static !important;
          width: auto !important;
          height: auto !important;
          min-width: 0 !important;
          min-height: 0 !important;
          z-index: auto !important;
          overflow: visible !important;
          pointer-events: auto !important;
        }

        .meta-staggered-main-menu .staggered-menu-header {
          position: static !important;
          width: auto !important;
          height: auto !important;
          padding: 0 !important;
          background: transparent !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          pointer-events: auto !important;
          z-index: 1002 !important;
        }

        .meta-staggered-main-menu[data-open] .staggered-menu-header {
          position: fixed !important;
          top: 1rem !important;
          right: 0 !important;
          width: clamp(220px, 22vw, 300px) !important;
          padding: 0 1rem !important;
          justify-content: flex-start !important;
          direction: rtl !important;
        }

        .meta-staggered-main-menu .sm-logo {
          display: none !important;
        }

        .meta-staggered-main-menu .sm-toggle {
          width: 2.25rem !important;
          min-width: 2.25rem !important;
          height: 2.25rem !important;
          padding: 0 0.15rem !important;
          background: transparent !important;
          border: none !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 0 !important;
          cursor: pointer !important;
          color: ${transparent ? (dark ? "rgba(255,255,255,0.86)" : "rgba(80,30,30,0.82)") : muted} !important;
          font-family: var(--app-font-family) !important;
          font-size: 0.72rem !important;
          line-height: 1 !important;
          z-index: 1003 !important;
        }

        .meta-staggered-main-menu[data-open] .sm-toggle {
          color: var(--meta-menu-text) !important;
        }

        .meta-staggered-main-menu .sm-icon {
          width: 18px !important;
          height: 18px !important;
          flex-basis: 18px !important;
        }

        .meta-staggered-main-menu .sm-icon-line {
          height: 2px !important;
          background: currentColor !important;
        }

        .meta-staggered-main-menu .sm-prelayers,
        .meta-staggered-main-menu .staggered-menu-panel {
          position: fixed !important;
          top: 0 !important;
          right: 0 !important;
          left: auto !important;
          bottom: 0 !important;
          width: clamp(220px, 22vw, 300px) !important;
          height: 100dvh !important;
          pointer-events: none !important;
          visibility: hidden !important;
        }

        .meta-staggered-main-menu[data-open] .sm-prelayers,
        .meta-staggered-main-menu[data-open] .staggered-menu-panel {
          visibility: visible !important;
        }

        .meta-staggered-main-menu .sm-prelayers {
          z-index: 999 !important;
        }

        .meta-staggered-main-menu .staggered-menu-panel {
          z-index: 1000 !important;
          background: var(--meta-menu-bg) !important;
          color: var(--meta-menu-text) !important;
          border-left: 1px solid var(--meta-menu-border) !important;
          box-shadow: var(--meta-menu-shadow) !important;
          padding: 0 !important;
          overflow-x: hidden !important;
          overflow-y: auto !important;
          pointer-events: auto !important;
          opacity: 1 !important;
          direction: rtl !important;
        }

        .meta-staggered-main-menu .sm-panel-inner {
          min-height: 100% !important;
          padding: 4.75rem 1.15rem 1.5rem !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: flex-start !important;
          gap: 1rem !important;
          text-align: right !important;
          font-family: var(--app-font-family) !important;
        }

        .meta-staggered-main-menu .sm-panel-list {
          list-style: none !important;
          padding: 0 !important;
          margin: 0 !important;
          display: flex !important;
          flex-direction: column !important;
          gap: 0.25rem !important;
        }

        .meta-staggered-main-menu .sm-panel-itemWrap {
          overflow: hidden !important;
        }

        .meta-staggered-main-menu .sm-panel-item {
          display: block !important;
          max-width: 100% !important;
          color: var(--meta-menu-text) !important;
          text-decoration: none !important;
          font-family: var(--app-font-family) !important;
          font-size: clamp(0.88rem, 0.95vw, 1.05rem) !important;
          font-weight: 600 !important;
          line-height: 1.4 !important;
          letter-spacing: 0 !important;
          text-transform: none !important;
          padding: 0.38rem 0 !important;
          white-space: normal !important;
          overflow-wrap: anywhere !important;
        }

        .meta-staggered-main-menu .sm-panel-item:hover {
          color: var(--meta-menu-hover) !important;
        }

        @media (max-width: 768px) {
          .app-shell-topbar.has-center-content {
            display: grid !important;
            grid-template-columns: 1fr auto;
            grid-template-areas:
              "main-menu user-actions"
              "section-tabs section-tabs";
            row-gap: 0.55rem;
            align-items: center;
            padding-bottom: 0.65rem !important;
            width: 100%;
            max-width: 100vw;
            box-sizing: border-box;
            overflow: visible;
          }

          .app-shell-topbar.has-center-content .app-shell-main-menu {
            grid-area: main-menu;
            justify-self: start;
          }

          .app-shell-topbar.has-center-content .app-shell-user-actions {
            grid-area: user-actions;
            justify-self: end;
          }

          .app-shell-topbar.has-center-content .app-shell-center-slot {
            grid-area: section-tabs;
            position: static !important;
            transform: none !important;
            justify-self: stretch;
            width: 100%;
            max-width: 100%;
            min-width: 0;
            display: flex;
            justify-content: center;
            overflow: hidden;
            z-index: 1;
          }

          .app-shell-topbar.has-center-content .section-tabs-responsive {
            width: 100%;
            max-width: calc(100vw - 2.5rem);
            min-width: 0;
            box-sizing: border-box;
            overflow-x: auto;
            overflow-y: hidden;
            justify-content: flex-start;
            gap: 1rem;
            padding: 0 0.25rem;
            scrollbar-width: none;
          }

          .app-shell-topbar.has-center-content .section-tabs-responsive::-webkit-scrollbar {
            display: none;
          }

          .meta-staggered-main-menu .sm-prelayers,
          .meta-staggered-main-menu .staggered-menu-panel {
            width: 50vw !important;
            min-width: 50vw !important;
            max-width: 50vw !important;
          }

          .meta-staggered-main-menu .sm-panel-inner {
            padding: 4.75rem 1rem 1.5rem !important;
          }

          .meta-staggered-main-menu .sm-panel-item {
            font-size: clamp(0.95rem, 4vw, 1.2rem) !important;
          }
        }


        /* FINAL: menu icon + panel placement/size fixes */
        .meta-staggered-main-menu {
          --meta-main-menu-width: clamp(190px, 18vw, 250px);
        }

        .meta-staggered-main-menu .sm-toggle-textWrap {
          display: none !important;
        }

        .meta-staggered-main-menu .sm-toggle {
          width: 34px !important;
          min-width: 34px !important;
          height: 34px !important;
          padding: 0 !important;
          gap: 0 !important;
          background: transparent !important;
          border: none !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
        }

        .meta-staggered-main-menu .sm-icon {
          position: relative !important;
          display: block !important;
          width: 22px !important;
          height: 16px !important;
          flex: 0 0 22px !important;
          transform: none !important;
        }

        .meta-staggered-main-menu .sm-icon-line {
          position: absolute !important;
          left: 0 !important;
          width: 22px !important;
          height: 2px !important;
          background: currentColor !important;
          border-radius: 999px !important;
          transform: none !important;
          transform-origin: center !important;
          transition: top 0.25s ease, transform 0.25s ease, opacity 0.2s ease !important;
        }

        .meta-staggered-main-menu .sm-icon-line-1 {
          top: 0 !important;
        }

        .meta-staggered-main-menu .sm-icon-line-2 {
          top: 7px !important;
        }

        .meta-staggered-main-menu .sm-icon-line-3 {
          top: 14px !important;
        }

        .meta-staggered-main-menu[data-open] .sm-icon-line-1 {
          top: 7px !important;
          transform: rotate(45deg) !important;
        }

        .meta-staggered-main-menu[data-open] .sm-icon-line-2 {
          opacity: 0 !important;
        }

        .meta-staggered-main-menu[data-open] .sm-icon-line-3 {
          top: 7px !important;
          transform: rotate(-45deg) !important;
        }

        .meta-staggered-main-menu[data-open] .staggered-menu-header {
          position: fixed !important;
          top: 0 !important;
          right: 0 !important;
          left: auto !important;
          width: var(--meta-main-menu-width) !important;
          height: 4rem !important;
          padding: 0 !important;
          margin: 0 !important;
          display: block !important;
          pointer-events: none !important;
          box-sizing: border-box !important;
          z-index: 1004 !important;
        }

        .meta-staggered-main-menu[data-open] .sm-toggle {
          position: absolute !important;
          top: 1rem !important;
          right: 1rem !important;
          color: var(--meta-menu-text) !important;
          pointer-events: auto !important;
          z-index: 1005 !important;
        }

        .meta-staggered-main-menu .sm-prelayers,
        .meta-staggered-main-menu .staggered-menu-panel {
          width: var(--meta-main-menu-width) !important;
          min-width: var(--meta-main-menu-width) !important;
          max-width: var(--meta-main-menu-width) !important;
        }

        .meta-staggered-main-menu .sm-panel-inner {
          padding: 4.25rem 0.95rem 1.25rem !important;
          gap: 0.7rem !important;
        }

        .meta-staggered-main-menu .sm-panel-list {
          gap: 0.15rem !important;
        }

        .meta-staggered-main-menu .sm-panel-item {
          font-size: clamp(0.76rem, 0.72vw, 0.92rem) !important;
          line-height: 1.45 !important;
          letter-spacing: 0 !important;
          text-transform: none !important;
          padding: 0.28rem 0 !important;
        }

        @media (max-width: 768px) {
          .meta-staggered-main-menu {
            --meta-main-menu-width: 50vw;
          }

          .meta-staggered-main-menu[data-open] .staggered-menu-header,
          .meta-staggered-main-menu .sm-prelayers,
          .meta-staggered-main-menu .staggered-menu-panel {
            width: 50vw !important;
            min-width: 50vw !important;
            max-width: 50vw !important;
          }

          .meta-staggered-main-menu .sm-panel-inner {
            padding: 4.25rem 0.8rem 1.25rem !important;
          }

          .meta-staggered-main-menu .sm-panel-item {
            font-size: clamp(0.8rem, 3.2vw, 1rem) !important;
          }
        }

      `}</style>

      <div
        className={`app-shell-topbar flex items-center justify-between px-5 py-4${centerContent ? " has-center-content" : ""}`}
        style={{ ...barStyle, position: barStyle.position, minHeight: 65 }}
      >
        <div
          className="app-shell-main-menu flex items-center gap-3"
          style={{ position: "relative" }}
        >
          <StaggeredMenu
            className="meta-staggered-main-menu"
            position="right"
            items={navLinks}
            displaySocials={false}
            displayItemNumbering={false}
            logoUrl=""
            colors={
              dark
                ? ["#2a070d", "#4b0f18", "#d4af37"]
                : ["#f5e7cd", "#d4af37", "#BD3039"]
            }
            menuButtonColor={
              transparent
                ? dark
                  ? "rgba(255,255,255,0.86)"
                  : "rgba(80,30,30,0.82)"
                : muted
            }
            openMenuButtonColor={gold}
            accentColor={gold}
            changeMenuColorOnOpen
            closeOnClickAway
          />

          <button
            onClick={() => navigate("/")}
            className="h-9 flex items-center justify-center transition-all duration-300"
            style={{
              color: transparent
                ? dark
                  ? "rgba(255,255,255,0.86)"
                  : "rgba(80,30,30,0.82)"
                : muted,
              background: "transparent",
              border: "none",
              cursor: "pointer",
            }}
            aria-label="خانه"
            title="خانه"
          >
            <img
              src={logo}
              alt="Meta Holding"
              style={{
                height: 50,
                width: "auto",
                display: "block",
              }}
            />
          </button>
        </div>

        <div
          className="app-shell-center-slot"
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 2,
          }}
        >
          {centerContent}
        </div>

        <div className="app-shell-user-actions flex items-center gap-2">
          <button
            onClick={toggleDark}
            className="w-8 h-8 flex items-center justify-center rounded-full"
            style={{
              color: transparent
                ? dark
                  ? "rgba(255,255,255,0.75)"
                  : "rgba(80,30,30,0.7)"
                : muted,
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
            aria-label="تغییر تم"
          >
            {dark ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          <button
            onClick={() => navigate(user ? "/profile" : "/auth")}
            className="w-9 h-9 rounded-full flex items-center justify-center overflow-hidden transition-all"
            style={{
              border: `1.5px solid ${transparent ? (dark ? "rgba(255,255,255,0.5)" : "rgba(100,50,50,0.4)") : border}`,
              background: "none",
              cursor: "pointer",
              padding: 0,
            }}
            aria-label="پروفایل"
          >
            {user ? (
              <ImageWithFallback
                src={user.avatar}
                alt={user.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <User
                size={16}
                style={{
                  color: transparent
                    ? dark
                      ? "rgba(255,255,255,0.7)"
                      : "rgba(80,30,30,0.6)"
                    : muted,
                }}
              />
            )}
          </button>
        </div>
      </div>

      {children}
    </div>
  );
}

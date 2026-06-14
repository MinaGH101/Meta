import { useState, ReactNode } from "react";
import { useNavigate } from "react-router";
import { Sun, Moon, X, Menu, User } from "lucide-react";
import { useDark, useAuth } from "../context";
import { ImageWithFallback } from "./figma/ImageWithFallback";

const ACCENT = "#8b1a2a";

interface Props {
  children: ReactNode;
  transparent?: boolean;
}

export function AppShell({ children, transparent = false }: Props) {
  const { dark, toggleDark } = useDark();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const bg = dark ? "#1a0808" : "#f7f0f0";
  const text = dark ? "#f0e0e0" : "#2a0f0f";
  const muted = dark ? "rgba(240,200,200,0.5)" : "rgba(100,50,50,0.5)";
  const border = dark ? "rgba(240,180,180,0.12)" : "rgba(150,80,80,0.15)";
  const drawerBg = dark ? "#1a0808" : "#faf4f4";

  const navLinks = [
    { label: "درباره ما", path: "/about" },
    { label: "تماس با ما", path: "/contact" },
  ];

  const barStyle: React.CSSProperties = transparent
    ? { background: "transparent", position: "absolute", top: 0, left: 0, right: 0, zIndex: 30 }
    : {
        background: bg,
        borderBottom: `1px solid ${border}`,
        position: "sticky",
        top: 0,
        zIndex: 30,
      };

  return (
    <div
      className="flex flex-col min-h-screen w-full"
      dir="rtl"
      style={{ fontFamily: "'Vazirmatn', sans-serif", background: bg, color: text, position: "relative" }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-4" style={barStyle}>
        {/* Left side: hamburger menu */}
        <button
          onClick={() => setMenuOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-full transition-colors"
          style={{
            color: transparent ? (dark ? "rgba(255,255,255,0.8)" : "rgba(80,30,30,0.8)") : muted,
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
          aria-label="منو"
        >
          <Menu size={20} />
        </button>

        {/* Center: logo text */}
        <button
          onClick={() => navigate("/")}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: transparent ? (dark ? "rgba(255,255,255,0.7)" : "rgba(80,30,30,0.6)") : muted,
            fontSize: "0.72rem",
            letterSpacing: "0.18em",
            fontFamily: "'Vazirmatn', sans-serif",
          }}
        >
          META HOLDING
        </button>

        {/* Right side: dark toggle + profile */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleDark}
            className="w-8 h-8 flex items-center justify-center rounded-full"
            style={{
              color: transparent ? (dark ? "rgba(255,255,255,0.75)" : "rgba(80,30,30,0.7)") : muted,
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
                  color: transparent ? (dark ? "rgba(255,255,255,0.7)" : "rgba(80,30,30,0.6)") : muted,
                }}
              />
            )}
          </button>
        </div>
      </div>

      {/* Page content */}
      {children}

      {/* Menu drawer overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-50 flex"
          dir="rtl"
          style={{ fontFamily: "'Vazirmatn', sans-serif" }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)" }}
            onClick={() => setMenuOpen(false)}
          />

          {/* Drawer from right (start side in RTL) */}
          <div
            className="relative mr-auto flex flex-col"
            style={{
              width: 280,
              height: "100%",
              background: drawerBg,
              borderLeft: `1px solid ${border}`,
              padding: "1.5rem",
              zIndex: 10,
            }}
          >
            {/* Close */}
            <div className="flex items-center justify-between mb-8">
              <button
                onClick={() => setMenuOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full"
                style={{ color: muted, background: "none", border: "none", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
              <span style={{ color: muted, fontSize: "0.75rem", letterSpacing: "0.15em" }}>MENU</span>
            </div>

            {/* Red accent line */}
            <div style={{ width: 36, height: 2, background: ACCENT, borderRadius: 1, marginBottom: "1.5rem" }} />

            {/* Nav links */}
            <nav className="flex flex-col gap-1">
              {navLinks.map(link => (
                <button
                  key={link.path}
                  onClick={() => { navigate(link.path); setMenuOpen(false); }}
                  className="text-right py-3 px-2 transition-colors rounded"
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: text,
                    fontSize: "1.05rem",
                    fontWeight: 500,
                    fontFamily: "'Vazirmatn', sans-serif",
                    borderBottom: `1px solid ${border}`,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = ACCENT)}
                  onMouseLeave={e => (e.currentTarget.style.color = text)}
                >
                  {link.label}
                </button>
              ))}
            </nav>

            {/* Bottom section links */}
            <div className="mt-auto flex flex-col gap-3">
              {[
                { label: "طراحی", path: "/tarrahi" },
                { label: "نظارت", path: "/nezarat" },
                { label: "اجرا", path: "/ejra" },
              ].map(link => (
                <button
                  key={link.path}
                  onClick={() => { navigate(link.path); setMenuOpen(false); }}
                  className="text-right"
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: muted,
                    fontSize: "0.85rem",
                    fontFamily: "'Vazirmatn', sans-serif",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = ACCENT)}
                  onMouseLeave={e => (e.currentTarget.style.color = muted)}
                >
                  {link.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

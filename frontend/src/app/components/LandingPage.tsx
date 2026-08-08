import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { AppShell } from "./AppShell";
import { apiFetch, PageContent } from "../api";
import { useDark } from "../context";
import logo from "../assets/meta_logo.png";

const LANDING_COLORS = {
  backgroundGradient:
    "linear-gradient(145deg, #240408 0%, #4b070d 38%, #BD3039 100%)",
  gold: "#d8b45f",
  goldSoft: "rgba(216, 180, 95, 0.72)",
  goldHoverBackground: "rgba(216, 180, 95, 0.12)",
  goldHoverBorder: "rgba(216, 180, 95, 0.85)",
  shadow: "rgba(0, 0, 0, 0.38)",
};

export function LandingPage() {
  const navigate = useNavigate();
  const { dark } = useDark();
  const [page, setPage] = useState<PageContent | null>(null);
  useEffect(() => { apiFetch<PageContent>("/page-content/landing").then(setPage).catch(() => undefined); }, []);
  return (
    <AppShell transparent hideFooter>
      {/* Full-screen hero — sits under the transparent AppShell bar */}
      <div
        className="fixed inset-0 w-full h-full"
        style={{
          zIndex: 0,
          background: dark
            ? "radial-gradient(circle at 72% 28%, rgba(189,48,57,.34) 0%, rgba(95,13,22,.16) 24%, transparent 48%), radial-gradient(circle at 18% 82%, rgba(189,48,57,.16) 0%, transparent 36%), #09090b"
            : LANDING_COLORS.backgroundGradient,
          color: LANDING_COLORS.gold,
          transition: "background 0.6s ease, color 0.4s ease",
        }}
      >
        <style>{`
          .landing-brand-lockup {
            display: flex;
            align-items: center;
            justify-content: center;
            direction: ltr;
            gap: clamp(.55rem, 1vw, .8rem);
            min-height: clamp(58px, 5vw, 72px);
            line-height: 1;
          }
          .landing-brand-logo {
            width: auto;
            height: clamp(58px, 5vw, 72px);
            display: block;
            transform: translateY(-6px);
          }
          .landing-brand-holding {
            display: block;
            font-size: clamp(1.65rem, 1.6vw, 1.05rem);
            font-weight: 550;
            line-height: 1;
            letter-spacing: .3em;
            white-space: nowrap;
            padding: 6px 0 0 5px;
          }
        `}</style>

        {/* Soft gradient depth */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 50% 35%, rgba(255, 210, 120, 0.08) 0%, rgba(255, 210, 120, 0.02) 28%, transparent 58%)",
          }}
        />

        {/* Center content */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-7"
          dir="rtl"
          style={{ fontFamily: "var(--app-font-family)" }}
        >

          <p
            className="landing-brand-lockup"
            dir="ltr"
            style={{
              color: LANDING_COLORS.goldSoft,
              fontWeight: 400,
              margin: 0,
              transition: "color 0.4s",
            }}
          >
            <img className="landing-brand-logo" src={logo} alt="Meta" />
            <span className="landing-brand-holding">HOLDING</span>
          </p>

                    <h1
            style={{
              color: LANDING_COLORS.gold,
              fontSize: "clamp(2.2rem, 5vw, 3.5rem)",
              fontWeight: 700,
              letterSpacing: "0.02em",
              textShadow: `0 2px 28px ${LANDING_COLORS.shadow}`,
              margin: 0,
              transition: "color 0.4s",
            }}
          >
            {page?.title || "هلدینگ متا"}
          </h1>

          {/* Buttons */}
          <div className="flex flex-row gap-4 mt-2">
            {[
              { label: "طراحی", path: "/tarrahi" },
              { label: "نظارت", path: "/nezarat" },
              { label: "اجرا", path: "/ejra" },
            ].map(({ label, path }) => (
              <button
                key={label}
                onClick={() => navigate(path)}
                className="px-8 py-2 transition-all duration-200"
                style={{
                  border: "1px solid transparent",
                  background: "transparent",
                  color: LANDING_COLORS.gold,
                  borderRadius: 2,
                  fontSize: "0.95rem",
                  fontFamily: "var(--app-font-family)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = LANDING_COLORS.goldHoverBackground;
                  e.currentTarget.style.borderColor = LANDING_COLORS.goldHoverBorder;
                  e.currentTarget.style.color = LANDING_COLORS.gold;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.borderColor = "transparent";
                  e.currentTarget.style.color = LANDING_COLORS.gold;
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

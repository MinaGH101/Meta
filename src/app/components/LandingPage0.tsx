import { useNavigate } from "react-router";
import { useDark } from "../context";
import { AppShell } from "./AppShell";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import bgImage from "../../static/images/2.jpg"

const BG_URL = bgImage;

export function LandingPage() {
  const { dark } = useDark();
  const navigate = useNavigate();

  return (
    <AppShell transparent>
      {/* Full-screen hero — sits under the transparent AppShell bar */}
      <div
        className="fixed inset-0 w-full h-full"
        style={{ zIndex: 0 }}
      >
        {/* Background image */}
        <ImageWithFallback
          src={BG_URL}
          alt="ساختمان هلدینگ متا"
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            filter: dark ? "brightness(0.55) saturate(0.7)" : "brightness(1.05) saturate(0.3) sepia(0.15)",
            transition: "filter 0.6s ease",
          }}
        />

        {/* Color overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: dark
              ? "linear-gradient(160deg, rgba(138, 21, 56, 0.60) 0%, rgba(138, 21, 56, 0.40) 40%, rgba(29, 4, 12, 0.6) 100%)"
              : "linear-gradient(160deg, rgba(209,192,194,0.7) 0%, rgba(233,215,216,0.7) 50%, rgba(93,3,15,0.75) 100%)",
            transition: "background 0.6s ease",
          }}
        />

        {/* Center content */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-7"
          dir="rtl"
          style={{ fontFamily: "var(--app-font-family)" }}
        >
          <h1
            style={{
              color: dark ? "#ffffff" : "#3a1010",
              fontSize: "clamp(2.2rem, 5vw, 3.5rem)",
              fontWeight: 700,
              letterSpacing: "0.02em",
              textShadow: dark ? "0 2px 32px rgba(0,0,0,0.6)" : "0 2px 16px rgba(180,100,100,0.15)",
              margin: 0,
              transition: "color 0.4s",
            }}
          >
            هلدینگ متا
          </h1>
          <p
            style={{
              color: dark ? "rgba(255,255,255,0.75)" : "rgba(70,30,30,0.7)",
              fontSize: "clamp(0.78rem, 1.3vw, 0.95rem)",
              fontWeight: 400,
              letterSpacing: "0.3em",
              margin: 0,
              transition: "color 0.4s",
            }}
          >
            META HOLDING
          </p>

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
                  border: `1px solid ${dark ? "rgba(255,255,255,0.6)" : "rgba(80,30,30,0.45)"}`,
                  background: dark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.45)",
                  color: dark ? "rgba(255,255,255,0.92)" : "rgba(60,20,20,0.9)",
                  borderRadius: 2,
                  fontSize: "0.95rem",
                  fontFamily: "var(--app-font-family)",
                  cursor: "pointer",
                  backdropFilter: "blur(6px)",
                  transition: "all 0.2s",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = dark
                    ? "rgba(255,255,255,0.15)"
                    : "rgba(80,30,30,0.12)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = dark
                    ? "rgba(255,255,255,0.06)"
                    : "rgba(255,255,255,0.45)";
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

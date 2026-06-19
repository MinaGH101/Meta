import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { AppShell } from "./AppShell";
import { useDark, useAuth } from "../context";
import { Eye, EyeOff, LogIn, UserPlus } from "lucide-react";

import bgImage from "../../static/images/27.jpg"
const BG_URL = bgImage;

const ACCENT = "#BD3039";

export function AuthPage() {
  const { dark } = useDark();
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add("auth-transparent-topbar");
    return () => document.body.classList.remove("auth-transparent-topbar");
  }, []);

  const [tab, setTab] = useState<"signin" | "register">("signin");
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "", phone: "" });
  const [error, setError] = useState("");

  const text = dark ? "#f8eeee" : "#271014";
  const muted = dark ? "rgba(255,235,235,0.68)" : "rgba(40,16,20,0.58)";
  const border = dark ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.42)";
  const card = dark ? "rgba(0,0,0,0.42)" : "rgba(255,255,255,0.58)";
  const inputBg = dark ? "rgba(0,0,0,0.28)" : "rgba(255,255,255,0.68)";
  const pageBackground = dark
    ? `linear-gradient(135deg, rgba(0,0,0,0.84), rgba(20,4,7,0.68), rgba(0,0,0,0.88)), url(${BG_URL})`
    : `linear-gradient(135deg, rgba(255,255,255,0.82), rgba(255,245,247,0.58), rgba(139,26,42,0.22)), url(${BG_URL})`;

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: inputBg,
    border: `1px solid ${border}`,
    borderRadius: 4,
    padding: "10px 14px",
    color: text,
    fontSize: "0.88rem",
    fontFamily: "var(--app-font-family)",
    outline: "none",
    boxSizing: "border-box",
  };

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) { setError("لطفاً ایمیل و رمز عبور را وارد کنید"); return; }
    login(form.email.split("@")[0], form.email);
    navigate("/");
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) { setError("لطفاً تمام فیلدهای الزامی را پر کنید"); return; }
    if (form.password !== form.confirmPassword) { setError("رمز عبور با تکرار آن مطابقت ندارد"); return; }
    login(form.name, form.email);
    navigate("/");
  };

  return (
    <AppShell transparent>
      <style>{`
        body.auth-transparent-topbar header,
        body.auth-transparent-topbar .app-shell-header,
        body.auth-transparent-topbar .meta-header,
        body.auth-transparent-topbar [data-app-header],
        body.auth-transparent-topbar [data-topbar] {
          background: transparent !important;
          background-color: transparent !important;
          border-bottom: none !important;
          box-shadow: none !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
        }
      `}</style>
      {/* Full-screen background like LandingPage — starts from the very top behind the transparent top bar */}
      <div
        className="fixed inset-0 w-full h-full"
        style={{
          zIndex: 0,
          backgroundImage: pageBackground,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />

      <div
        className="relative flex flex-col items-center justify-center flex-1 px-4 py-12"
        dir="rtl"
        style={{
          zIndex: 1,
          fontFamily: "var(--app-font-family)",
          color: text,
          minHeight: "100vh",
          boxSizing: "border-box",
        }}
      >
        <div
          className="w-full flex flex-col gap-6 rounded p-8"
          style={{
            maxWidth: 440,
            background: card,
            border: `1px solid ${border}`,
            backdropFilter: "blur(22px) saturate(145%)",
            WebkitBackdropFilter: "blur(22px) saturate(145%)",
            boxShadow: dark
              ? "0 28px 80px rgba(0,0,0,0.45)"
              : "0 28px 80px rgba(45,15,20,0.16)",
          }}
        >
          {/* Logo / title */}
          <div className="flex flex-col items-center gap-2 mb-2">
            <div
              className="rounded-full flex items-center justify-center mb-1"
              style={{ width: 48, height: 48, border: `1.5px solid ${ACCENT}`, color: ACCENT }}
            >
              <span style={{ fontSize: "1rem", fontWeight: 700 }}>M</span>
            </div>
            <h1 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0, textAlign: "center" }}>هلدینگ متا</h1>
            <p style={{ color: muted, fontSize: "0.78rem", margin: 0 }}>
              {tab === "signin" ? "به حساب کاربری خود وارد شوید" : "یک حساب جدید بسازید"}
            </p>
          </div>

          {/* Tabs */}
          <div
            className="flex rounded overflow-hidden"
            style={{ border: `1px solid ${border}` }}
          >
            {[
              { id: "signin", label: "ورود", icon: <LogIn size={14} /> },
              { id: "register", label: "ثبت‌نام", icon: <UserPlus size={14} /> },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => { setTab(t.id as "signin" | "register"); setError(""); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 transition-all"
                style={{
                  background: tab === t.id ? ACCENT : "transparent",
                  color: tab === t.id ? "#fff" : muted,
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  fontFamily: "var(--app-font-family)",
                  fontWeight: tab === t.id ? 600 : 400,
                }}
              >
                {t.icon}{t.label}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div
              className="px-4 py-2.5 rounded text-center"
              style={{ background: "rgba(139,26,42,0.15)", border: `1px solid rgba(139,26,42,0.3)`, color: ACCENT, fontSize: "0.82rem" }}
            >
              {error}
            </div>
          )}

          {/* Sign In form */}
          {tab === "signin" && (
            <form onSubmit={handleSignIn} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label style={{ fontSize: "0.78rem", color: muted }}>ایمیل</label>
                <input
                  type="email"
                  style={inputStyle}
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="example@email.com"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label style={{ fontSize: "0.78rem", color: muted }}>رمز عبور</label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    style={{ ...inputStyle, paddingLeft: 40 }}
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="رمز عبور"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="absolute top-1/2 -translate-y-1/2 left-3"
                    style={{ background: "none", border: "none", color: muted, cursor: "pointer", padding: 0 }}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded flex items-center justify-center gap-2 mt-1 transition-colors"
                style={{
                  background: ACCENT,
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.92rem",
                  fontFamily: "var(--app-font-family)",
                  fontWeight: 600,
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "#a02030")}
                onMouseLeave={e => (e.currentTarget.style.background = ACCENT)}
              >
                <LogIn size={16} />
                ورود
              </button>
            </form>
          )}

          {/* Register form */}
          {tab === "register" && (
            <form onSubmit={handleRegister} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label style={{ fontSize: "0.78rem", color: muted }}>نام و نام خانوادگی *</label>
                <input style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="علی رضایی" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label style={{ fontSize: "0.78rem", color: muted }}>ایمیل *</label>
                <input type="email" style={inputStyle} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="example@email.com" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label style={{ fontSize: "0.78rem", color: muted }}>شماره موبایل</label>
                <input style={inputStyle} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="۰۹۱۲۳۴۵۶۷۸۹" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label style={{ fontSize: "0.78rem", color: muted }}>رمز عبور *</label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    style={{ ...inputStyle, paddingLeft: 40 }}
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="حداقل ۸ کاراکتر"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="absolute top-1/2 -translate-y-1/2 left-3"
                    style={{ background: "none", border: "none", color: muted, cursor: "pointer", padding: 0 }}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label style={{ fontSize: "0.78rem", color: muted }}>تکرار رمز عبور *</label>
                <input
                  type="password"
                  style={inputStyle}
                  value={form.confirmPassword}
                  onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                  placeholder="رمز عبور را تکرار کنید"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded flex items-center justify-center gap-2 mt-1 transition-colors"
                style={{
                  background: ACCENT,
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.92rem",
                  fontFamily: "var(--app-font-family)",
                  fontWeight: 600,
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "#a02030")}
                onMouseLeave={e => (e.currentTarget.style.background = ACCENT)}
              >
                <UserPlus size={16} />
                ثبت‌نام
              </button>
            </form>
          )}
        </div>
      </div>
    </AppShell>
  );
}

import { useNavigate } from "react-router";
import { AppShell } from "./AppShell";
import { useDark, useAuth } from "../context";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { LogOut, User, Phone, Mail, MessageCircle, Edit2 } from "lucide-react";

const ACCENT = "#8b1a2a";

const mockMessages = [
  { id: 1, subject: "استعلام قیمت پروژه ویلا", date: "۱۴۰۳/۰۳/۱۵", status: "پاسخ داده شد", preview: "با سلام، برای طراحی ویلا در شمال استعلام قیمت می‌خواستم..." },
  { id: 2, subject: "مشاوره طراحی داخلی", date: "۱۴۰۳/۰۲/۲۸", status: "در حال بررسی", preview: "درباره طراحی داخلی آپارتمان ۱۸۰ متری سوال داشتم..." },
  { id: 3, subject: "همکاری در پروژه تجاری", date: "۱۴۰۳/۰۱/۱۰", status: "پاسخ داده شد", preview: "جهت همکاری در پروژه مجتمع تجاری تماس می‌گیرم..." },
];

export function ProfilePage() {
  const { dark } = useDark();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const bg = dark ? "#1a0808" : "#f7f0f0";
  const text = dark ? "#f0e0e0" : "#2a0f0f";
  const muted = dark ? "rgba(240,200,200,0.5)" : "rgba(100,50,50,0.5)";
  const border = dark ? "rgba(240,180,180,0.1)" : "rgba(150,80,80,0.12)";
  const card = dark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.7)";

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <AppShell>
      <div
        className="flex flex-col"
        dir="rtl"
        style={{ fontFamily: "'Vazirmatn', sans-serif", background: bg, color: text, minHeight: "calc(100vh - 65px)" }}
      >
        {/* Header */}
        <div
          className="flex flex-col md:flex-row items-start md:items-center justify-between px-10 py-10 gap-6"
          style={{ borderBottom: `1px solid ${border}` }}
        >
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div
              className="rounded-full overflow-hidden flex-shrink-0"
              style={{ width: 80, height: 80, border: `2px solid ${ACCENT}` }}
            >
              <ImageWithFallback
                src={user.avatar}
                alt={user.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div style={{ width: 3, height: 22, background: ACCENT, borderRadius: 2 }} />
                <h1 style={{ fontSize: "1.4rem", fontWeight: 700, margin: 0 }}>{user.name}</h1>
              </div>
              <p style={{ color: muted, fontSize: "0.82rem", margin: 0 }}>کاربر هلدینگ متا</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              className="flex items-center gap-2 px-5 py-2 rounded transition-colors"
              style={{
                background: card,
                border: `1px solid ${border}`,
                color: text,
                cursor: "pointer",
                fontSize: "0.85rem",
                fontFamily: "'Vazirmatn', sans-serif",
              }}
            >
              <Edit2 size={14} />
              ویرایش پروفایل
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-5 py-2 rounded transition-colors"
              style={{
                background: "rgba(139,26,42,0.15)",
                border: `1px solid rgba(139,26,42,0.3)`,
                color: ACCENT,
                cursor: "pointer",
                fontSize: "0.85rem",
                fontFamily: "'Vazirmatn', sans-serif",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(139,26,42,0.25)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(139,26,42,0.15)")}
            >
              <LogOut size={14} />
              خروج از حساب
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-0 flex-1">
          {/* Personal info */}
          <div
            className="flex flex-col gap-5 p-10"
            style={{ width: "100%", maxWidth: 360, borderLeft: `1px solid ${border}` }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div style={{ width: 3, height: 20, background: ACCENT, borderRadius: 2 }} />
              <h2 style={{ fontSize: "1rem", fontWeight: 600, margin: 0 }}>اطلاعات شخصی</h2>
            </div>

            {[
              { icon: <User size={16} />, label: "نام کامل", value: user.name },
              { icon: <Mail size={16} />, label: "ایمیل", value: user.email },
              { icon: <Phone size={16} />, label: "شماره موبایل", value: user.phone },
            ].map(item => (
              <div
                key={item.label}
                className="flex items-center gap-3 p-4 rounded"
                style={{ background: card, border: `1px solid ${border}` }}
              >
                <div style={{ color: ACCENT }}>{item.icon}</div>
                <div>
                  <p style={{ color: muted, fontSize: "0.7rem", margin: "0 0 2px 0" }}>{item.label}</p>
                  <p style={{ fontSize: "0.88rem", margin: 0, fontWeight: 500 }}>{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Message history */}
          <div className="flex flex-col p-10 flex-1">
            <div className="flex items-center gap-3 mb-6">
              <div style={{ width: 3, height: 20, background: ACCENT, borderRadius: 2 }} />
              <h2 style={{ fontSize: "1rem", fontWeight: 600, margin: 0 }}>تاریخچه پیام‌ها</h2>
              <span
                className="rounded-full flex items-center justify-center"
                style={{ width: 20, height: 20, background: ACCENT, color: "#fff", fontSize: "0.68rem" }}
              >
                {mockMessages.length}
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {mockMessages.map(msg => (
                <div
                  key={msg.id}
                  className="flex flex-col gap-2 p-5 rounded cursor-pointer transition-colors"
                  style={{ background: card, border: `1px solid ${border}` }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(139,26,42,0.4)")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = border)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2 flex-1">
                      <MessageCircle size={15} style={{ color: ACCENT, flexShrink: 0 }} />
                      <span style={{ fontWeight: 600, fontSize: "0.88rem" }}>{msg.subject}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span
                        className="px-2 py-0.5 rounded-full"
                        style={{
                          fontSize: "0.68rem",
                          background: msg.status === "پاسخ داده شد"
                            ? "rgba(139,26,42,0.15)"
                            : "rgba(180,140,60,0.15)",
                          color: msg.status === "پاسخ داده شد" ? ACCENT : "#b8963c",
                          border: `1px solid ${msg.status === "پاسخ داده شد" ? "rgba(139,26,42,0.3)" : "rgba(180,140,60,0.3)"}`,
                        }}
                      >
                        {msg.status}
                      </span>
                      <span style={{ color: muted, fontSize: "0.72rem" }}>{msg.date}</span>
                    </div>
                  </div>
                  <p style={{ color: muted, fontSize: "0.78rem", margin: 0, paddingRight: 22 }}>
                    {msg.preview}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

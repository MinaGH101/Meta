import { useState } from "react";
import { AppShell } from "./AppShell";
import { useDark } from "../context";
import { MapPin, Phone, Mail, Clock, Send } from "lucide-react";

const ACCENT = "#8b1a2a";

export function ContactPage() {
  const { dark } = useDark();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);

  const bg = dark ? "#1a0808" : "#f7f0f0";
  const text = dark ? "#f0e0e0" : "#2a0f0f";
  const muted = dark ? "rgba(240,200,200,0.5)" : "rgba(100,50,50,0.5)";
  const border = dark ? "rgba(240,180,180,0.1)" : "rgba(150,80,80,0.12)";
  const card = dark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.7)";
  const inputBg = dark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.8)";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setForm({ name: "", email: "", subject: "", message: "" });
    setTimeout(() => setSent(false), 4000);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: inputBg,
    border: `1px solid ${border}`,
    borderRadius: 4,
    padding: "10px 14px",
    color: text,
    fontSize: "0.88rem",
    fontFamily: "'Vazirmatn', sans-serif",
    outline: "none",
    boxSizing: "border-box",
  };

  const contactInfo = [
    { icon: <MapPin size={18} />, label: "آدرس", value: "تهران، خیابان ولیعصر، برج آرمان، طبقه ۱۲" },
    { icon: <Phone size={18} />, label: "تلفن", value: "۰۲۱-۸۸۷۶۵۴۳۲" },
    { icon: <Mail size={18} />, label: "ایمیل", value: "info@metaholding.ir" },
    { icon: <Clock size={18} />, label: "ساعات کاری", value: "شنبه تا چهارشنبه، ۹ تا ۱۷" },
  ];

  return (
    <AppShell>
      <div
        className="flex flex-col"
        dir="rtl"
        style={{ fontFamily: "'Vazirmatn', sans-serif", background: bg, color: text, minHeight: "calc(100vh - 65px)" }}
      >
        {/* Header */}
        <div className="px-10 py-12" style={{ borderBottom: `1px solid ${border}` }}>
          <div className="flex items-center gap-3 mb-3">
            <div style={{ width: 3, height: 36, background: ACCENT, borderRadius: 2 }} />
            <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 700, margin: 0 }}>تماس با ما</h1>
          </div>
          <p style={{ color: muted, fontSize: "0.88rem", margin: 0, paddingRight: 18 }}>
            برای مشاوره، همکاری یا هرگونه سوال با ما در تماس باشید.
          </p>
        </div>

        {/* Content */}
        <div className="flex flex-col md:flex-row gap-0 flex-1">
          {/* Info panel */}
          <div
            className="flex flex-col gap-6 p-10"
            style={{ width: "100%", maxWidth: 380, borderLeft: `1px solid ${border}` }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div style={{ width: 3, height: 20, background: ACCENT, borderRadius: 2 }} />
              <h2 style={{ fontSize: "1rem", fontWeight: 600, margin: 0 }}>اطلاعات تماس</h2>
            </div>
            {contactInfo.map(item => (
              <div key={item.label} className="flex items-start gap-3">
                <div
                  className="flex items-center justify-center rounded-full flex-shrink-0 mt-0.5"
                  style={{ width: 36, height: 36, background: dark ? "rgba(139,26,42,0.2)" : "rgba(139,26,42,0.1)", color: ACCENT }}
                >
                  {item.icon}
                </div>
                <div>
                  <p style={{ color: muted, fontSize: "0.72rem", margin: "0 0 3px 0" }}>{item.label}</p>
                  <p style={{ fontSize: "0.85rem", margin: 0, color: text }}>{item.value}</p>
                </div>
              </div>
            ))}

            {/* Map placeholder */}
            <div
              className="rounded mt-2 flex items-center justify-center"
              style={{ height: 140, background: card, border: `1px solid ${border}`, color: muted, fontSize: "0.8rem" }}
            >
              <div className="flex flex-col items-center gap-2">
                <MapPin size={24} style={{ color: ACCENT }} />
                <span>نقشه موقعیت</span>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="flex flex-col p-10 flex-1">
            <div className="flex items-center gap-3 mb-6">
              <div style={{ width: 3, height: 20, background: ACCENT, borderRadius: 2 }} />
              <h2 style={{ fontSize: "1rem", fontWeight: 600, margin: 0 }}>ارسال پیام</h2>
            </div>

            {sent && (
              <div
                className="mb-5 px-4 py-3 rounded flex items-center gap-2"
                style={{ background: "rgba(139,26,42,0.15)", border: `1px solid rgba(139,26,42,0.3)`, color: ACCENT, fontSize: "0.88rem" }}
              >
                <Send size={15} />
                پیام شما با موفقیت ارسال شد. به زودی با شما تماس می‌گیریم.
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4" style={{ maxWidth: 520 }}>
              <div className="flex gap-4">
                <div className="flex flex-col gap-1.5 flex-1">
                  <label style={{ fontSize: "0.78rem", color: muted }}>نام و نام خانوادگی</label>
                  <input
                    style={inputStyle}
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="مثال: علی رضایی"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5 flex-1">
                  <label style={{ fontSize: "0.78rem", color: muted }}>ایمیل</label>
                  <input
                    type="email"
                    style={inputStyle}
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="example@email.com"
                    required
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label style={{ fontSize: "0.78rem", color: muted }}>موضوع</label>
                <input
                  style={inputStyle}
                  value={form.subject}
                  onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  placeholder="موضوع پیام خود را بنویسید"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label style={{ fontSize: "0.78rem", color: muted }}>پیام</label>
                <textarea
                  rows={5}
                  style={{ ...inputStyle, resize: "vertical" }}
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="پیام خود را بنویسید..."
                  required
                />
              </div>
              <button
                type="submit"
                className="flex items-center gap-2 justify-center px-8 py-3 rounded transition-all duration-200"
                style={{
                  background: ACCENT,
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  fontFamily: "'Vazirmatn', sans-serif",
                  fontWeight: 500,
                  alignSelf: "flex-start",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "#a02030")}
                onMouseLeave={e => (e.currentTarget.style.background = ACCENT)}
              >
                <Send size={16} />
                ارسال پیام
              </button>
            </form>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

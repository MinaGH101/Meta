import { AppShell } from "./AppShell";
import { useDark } from "../context";

const ACCENT = "#8b1a2a";

const team = [
  { name: "مهندس کاوه صادقی", role: "مدیرعامل و معمار ارشد", exp: "۲۰ سال سابقه" },
  { name: "مهندس نیلوفر حسینی", role: "معمار داخلی", exp: "۱۲ سال سابقه" },
  { name: "مهندس رضا مرادی", role: "مهندس سازه", exp: "۱۵ سال سابقه" },
  { name: "مهندس سارا کریمی", role: "طراح محوطه", exp: "۸ سال سابقه" },
];

const stats = [
  { value: "۱۵+", label: "سال تجربه" },
  { value: "۲۸۰+", label: "پروژه تکمیل‌شده" },
  { value: "۴۰+", label: "جوایز ملی و بین‌المللی" },
  { value: "۱۲", label: "متخصص در تیم" },
];

export function AboutPage() {
  const { dark } = useDark();

  const bg = dark ? "#1a0808" : "#f7f0f0";
  const text = dark ? "#f0e0e0" : "#2a0f0f";
  const muted = dark ? "rgba(240,200,200,0.5)" : "rgba(100,50,50,0.5)";
  const border = dark ? "rgba(240,180,180,0.1)" : "rgba(150,80,80,0.12)";
  const card = dark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.7)";

  return (
    <AppShell>
      <div
        className="flex flex-col"
        dir="rtl"
        style={{ fontFamily: "'Vazirmatn', sans-serif", background: bg, color: text, minHeight: "calc(100vh - 65px)" }}
      >
        {/* Hero section */}
        <div
          className="flex flex-col items-end px-10 py-14"
          style={{ borderBottom: `1px solid ${border}` }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div style={{ width: 3, height: 36, background: ACCENT, borderRadius: 2 }} />
            <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 700, margin: 0 }}>درباره ما</h1>
          </div>
          <p style={{ color: muted, fontSize: "0.9rem", lineHeight: 2, maxWidth: 620, textAlign: "right" }}>
            هلدینگ متا با بیش از پانزده سال سابقه در زمینه طراحی معماری، نظارت و اجرای پروژه‌های ساختمانی،
            یکی از معتبرترین مجموعه‌های فعال در حوزه ساخت و ساز ایران است. رویکرد ما ترکیب خلاقیت معماری
            با دقت مهندسی و پایبندی به اصول پایداری است.
          </p>
        </div>

        {/* Stats */}
        <div
          className="grid grid-cols-2 md:grid-cols-4"
          style={{ borderBottom: `1px solid ${border}` }}
        >
          {stats.map((s, i) => (
            <div
              key={i}
              className="flex flex-col items-center justify-center py-10 gap-2"
              style={{ borderLeft: i < 3 ? `1px solid ${border}` : "none" }}
            >
              <span style={{ fontSize: "2.2rem", fontWeight: 700, color: ACCENT }}>{s.value}</span>
              <span style={{ color: muted, fontSize: "0.82rem" }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Mission */}
        <div className="px-10 py-12" style={{ borderBottom: `1px solid ${border}` }}>
          <div className="flex items-center gap-3 mb-6">
            <div style={{ width: 3, height: 24, background: ACCENT, borderRadius: 2 }} />
            <h2 style={{ fontSize: "1.2rem", fontWeight: 600, margin: 0 }}>ماموریت ما</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "طراحی خلاقانه",
                body: "ایجاد فضاهایی که هم از نظر عملکردی بی‌نقص و هم از نظر بصری الهام‌بخش باشند. هر پروژه داستانی منحصر به فرد دارد که ما آن را با زبان معماری روایت می‌کنیم.",
              },
              {
                title: "کیفیت بی‌سازش",
                body: "از انتخاب متریال تا جزئیات اجرایی، هیچ‌چیز را به شانس واگذار نمی‌کنیم. نظارت دقیق در هر مرحله تضمین‌کننده کیفیت نهایی کار است.",
              },
              {
                title: "پایداری و آینده",
                body: "طراحی با آگاهی از تأثیر بر محیط‌زیست. استفاده از انرژی‌های پاک، متریال بازیافتی و راهکارهای هوشمند برای ساخت آینده‌ای بهتر.",
              },
            ].map(item => (
              <div
                key={item.title}
                className="flex flex-col gap-3 p-6 rounded"
                style={{ background: card, border: `1px solid ${border}` }}
              >
                <h3 style={{ fontSize: "1rem", fontWeight: 600, margin: 0, color: text }}>{item.title}</h3>
                <p style={{ color: muted, fontSize: "0.82rem", lineHeight: 1.9, margin: 0 }}>{item.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Team */}
        <div className="px-10 py-12">
          <div className="flex items-center gap-3 mb-6">
            <div style={{ width: 3, height: 24, background: ACCENT, borderRadius: 2 }} />
            <h2 style={{ fontSize: "1.2rem", fontWeight: 600, margin: 0 }}>تیم ما</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {team.map(member => (
              <div
                key={member.name}
                className="flex flex-col items-center gap-3 p-5 rounded text-center"
                style={{ background: card, border: `1px solid ${border}` }}
              >
                <div
                  className="rounded-full flex items-center justify-center"
                  style={{ width: 56, height: 56, background: dark ? "rgba(139,26,42,0.25)" : "rgba(139,26,42,0.12)", color: ACCENT, fontSize: "1.4rem", fontWeight: 700 }}
                >
                  {member.name[0]}
                </div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: "0.88rem", margin: "0 0 4px 0" }}>{member.name}</p>
                  <p style={{ color: muted, fontSize: "0.76rem", margin: "0 0 2px 0" }}>{member.role}</p>
                  <p style={{ color: ACCENT, fontSize: "0.72rem", margin: 0 }}>{member.exp}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

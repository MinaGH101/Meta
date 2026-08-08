import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { AppShell } from "./AppShell";
import { useDark, useAuth } from "../context";
import { ADMIN_URL, ContactMessage, apiFetch, mediaUrl } from "../api";
import { LogOut, User, Phone, Mail, MessageCircle, Shield, Upload } from "lucide-react";

const ACCENT = "#BD3039";
const statusLabel: Record<string, string> = { new: "جدید", reviewing: "در حال بررسی", answered: "پاسخ داده شد", closed: "بسته" };

export function ProfilePage() {
  const { dark } = useDark();
  const { user, loading, logout, updateProfile, uploadAvatar } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ full_name: "", phone: "", password: "" });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
    if (user) {
      setForm({ full_name: user.full_name, phone: user.phone || "", password: "" });
      apiFetch<ContactMessage[]>("/contact/mine").then(setMessages).catch(() => setMessages([]));
    }
  }, [loading, user]);

  if (!user) return null;
  const bg = dark ? "#1a1919" : "#f0efef";
  const text = dark ? "#f0e0e0" : "#2a0f0f";
  const muted = dark ? "rgba(240,200,200,0.5)" : "rgba(100,50,50,0.5)";
  const border = dark ? "rgba(240,180,180,0.1)" : "rgba(150,80,80,0.12)";
  const card = dark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.7)";
  const input = { background: card, border: `1px solid ${border}`, color: text, borderRadius: 4, padding: "9px 10px", width: "100%", boxSizing: "border-box" as const, fontFamily: "inherit" };

  return <AppShell><div dir="rtl" style={{ fontFamily: "var(--app-font-family)", background: bg, color: text, minHeight: "calc(100vh - 65px)" }}>
    <div className="w-full mx-auto" style={{ maxWidth: 1180 }}>
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between px-5 md:px-10 py-10 gap-6" style={{ borderBottom: `1px solid ${border}` }}>
      <div className="flex items-center gap-5"><img src={mediaUrl(user.avatar_url) || "/meta-avatar.svg"} alt={user.full_name} style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", border: `2px solid ${ACCENT}` }}/><div><h1 style={{ margin: 0 }}>{user.full_name}</h1><p style={{ color: muted }}>{user.role === "admin" ? "مدیر وب‌سایت" : "کاربر هلدینگ متا"}</p></div></div>
      <div className="flex gap-3">{user.role === "admin" && <button onClick={() => window.location.assign(ADMIN_URL)} style={{ background: card, color: text, border: `1px solid ${border}`, padding: "9px 14px", borderRadius: 4, cursor: "pointer" }}><Shield size={14}/> پنل مدیریت</button>}<button onClick={() => setEditing(v => !v)} style={{ background: card, color: text, border: `1px solid ${border}`, padding: "9px 14px", borderRadius: 4, cursor: "pointer" }}>ویرایش پروفایل</button><button onClick={async () => { await logout(); navigate("/auth"); }} style={{ background: "rgba(189,48,57,.15)", color: ACCENT, border: "none", padding: "9px 14px", borderRadius: 4, cursor: "pointer" }}><LogOut size={14}/> خروج</button></div>
    </div>
    {error && <div style={{ margin: 20, color: "#ff8f98" }}>{error}</div>}
    <div className="flex flex-col md:flex-row">
      <aside className="p-10 flex flex-col gap-4" style={{ width: "100%", maxWidth: 380, borderLeft: `1px solid ${border}` }}>
        {editing ? <form onSubmit={async e => { e.preventDefault(); try { setError(""); const payload: Record<string,string> = { full_name: form.full_name, phone: form.phone }; if (form.password) payload.password = form.password; await updateProfile(payload); if (avatarFile) await uploadAvatar(avatarFile); setAvatarFile(null); setEditing(false); } catch (err) { setError(err instanceof Error ? err.message : "خطا"); } }} className="flex flex-col gap-3"><input style={input} value={form.full_name} onChange={e => setForm(f => ({...f,full_name:e.target.value}))} placeholder="نام کامل"/><input style={input} value={form.phone} onChange={e => setForm(f => ({...f,phone:e.target.value}))} placeholder="تلفن"/><label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "9px 10px", color: text, background: card, border: `1px solid ${border}`, borderRadius: 4, cursor: "pointer" }}><Upload size={15}/><span>{avatarFile ? avatarFile.name : "انتخاب تصویر پروفایل"}</span><input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={e => setAvatarFile(e.target.files?.[0] || null)}/></label><input type="password" style={input} value={form.password} onChange={e => setForm(f => ({...f,password:e.target.value}))} placeholder="رمز جدید (اختیاری)"/><button style={{ background: ACCENT, color: "white", border: 0, padding: 10, borderRadius: 4, cursor: "pointer" }}>ذخیره</button></form> : [<><User size={16}/><span>{user.full_name}</span></>,<><Mail size={16}/><span>{user.email || "—"}</span></>,<><Phone size={16}/><span>{user.phone || "—"}</span></>].map((item,i)=><div key={i} className="flex items-center gap-3 p-4" style={{ background: card, border: `1px solid ${border}` }}>{item}</div>)}
      </aside>
      <section className="p-10 flex-1"><h2>تاریخچه پیام‌ها ({messages.length})</h2><div className="flex flex-col gap-3">{messages.map(msg => <div key={msg.id} className="p-5" style={{ background: card, border: `1px solid ${border}` }}><div className="flex justify-between"><strong><MessageCircle size={14}/> {msg.subject}</strong><span style={{ color: ACCENT }}>{statusLabel[msg.status]}</span></div><p style={{ color: muted }}>{msg.message}</p>{msg.admin_reply && <p style={{ borderTop: `1px solid ${border}`, paddingTop: 10 }}>پاسخ: {msg.admin_reply}</p>}</div>)}</div></section>
    </div>
    </div>
  </div></AppShell>;
}

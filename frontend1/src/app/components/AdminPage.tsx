import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { ImagePlus, LogOut, Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import { AppShell } from "./AppShell";
import { useAuth, useDark } from "../context";
import {
  apiFetch, mediaUrl, type ApiUser, type ContactMessage, type EjraProject,
  type NezaratProject, type NezaratRegion, type NezaratTableRow, type PageContent,
  type ProjectImage, type TarahiCategory, type TarahiProject,
} from "../api";

type Tab = "projects" | "taxonomy" | "table" | "pages" | "messages" | "users";
type Section = "tarahi" | "nezarat" | "ejra";
type ManagedProject = TarahiProject | NezaratProject | EjraProject;

const sectionLabels: Record<Section, string> = { tarahi: "طراحی", nezarat: "نظارت", ejra: "اجرا" };
const emptyProject = {
  id: "", slug: "", name: "", metraj: "", location: "", description: "", state: "open",
  year: "", display_order: 0, category_id: "", region_id: "", orientation: "",
};
const emptyTableRow = {
  id: "", table_status: "live", region: "", metraj: "", allowed_floors: "",
  project_stage: "", year: "", address: "", referral_date: "", description: "",
  display_order: 0, is_published: true,
};

export function AdminPage() {
  const { dark } = useDark();
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("projects");
  const [section, setSection] = useState<Section>("tarahi");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [tarahiProjects, setTarahiProjects] = useState<TarahiProject[]>([]);
  const [nezaratProjects, setNezaratProjects] = useState<NezaratProject[]>([]);
  const [ejraProjects, setEjraProjects] = useState<EjraProject[]>([]);
  const [categories, setCategories] = useState<TarahiCategory[]>([]);
  const [regions, setRegions] = useState<NezaratRegion[]>([]);
  const [tableRows, setTableRows] = useState<NezaratTableRow[]>([]);
  const [pages, setPages] = useState<PageContent[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [projectForm, setProjectForm] = useState({ ...emptyProject });
  const [tableForm, setTableForm] = useState({ ...emptyTableRow });
  const [newCategory, setNewCategory] = useState({ slug: "", name: "", description: "", display_order: 0, is_active: true });
  const [newRegion, setNewRegion] = useState({ slug: "", name: "", display_order: 0, is_active: true });
  const [pageKey, setPageKey] = useState("landing");
  const [pageForm, setPageForm] = useState({ title: "", content: "{}", is_published: true });

  const palette = {
    bg: dark ? "#151313" : "#f4f1f1", card: dark ? "#211e1e" : "#fff", card2: dark ? "#292424" : "#f7f3f3",
    text: dark ? "#f7eded" : "#271315", muted: dark ? "rgba(255,235,235,.58)" : "rgba(50,20,20,.56)",
    border: dark ? "rgba(255,255,255,.10)" : "rgba(80,20,20,.12)", accent: "#BD3039",
  };
  const inputStyle: CSSProperties = { width: "100%", boxSizing: "border-box", background: palette.card2, color: palette.text, border: `1px solid ${palette.border}`, borderRadius: 4, padding: "9px 10px", fontFamily: "var(--app-font-family)", fontSize: ".82rem" };
  const buttonStyle: CSSProperties = { border: "none", borderRadius: 4, padding: "9px 14px", cursor: "pointer", fontFamily: "var(--app-font-family)", display: "inline-flex", gap: 7, alignItems: "center", justifyContent: "center" };

  const projects = useMemo<ManagedProject[]>(() => section === "tarahi" ? tarahiProjects : section === "nezarat" ? nezaratProjects : ejraProjects, [section, tarahiProjects, nezaratProjects, ejraProjects]);
  const selectedProject = useMemo(() => projects.find(item => item.id === projectForm.id) || null, [projects, projectForm.id]);

  async function loadAll() {
    setBusy(true); setError("");
    try {
      const [tp, np, ep, c, r, tr, pg, m, u] = await Promise.all([
        apiFetch<TarahiProject[]>("/admin/tarahi/projects"),
        apiFetch<NezaratProject[]>("/admin/nezarat/projects"),
        apiFetch<EjraProject[]>("/admin/ejra/projects"),
        apiFetch<TarahiCategory[]>("/admin/tarahi/categories"),
        apiFetch<NezaratRegion[]>("/admin/nezarat/regions"),
        apiFetch<NezaratTableRow[]>("/admin/nezarat/table"),
        apiFetch<PageContent[]>("/admin/page-contents"),
        apiFetch<ContactMessage[]>("/admin/contacts"),
        apiFetch<ApiUser[]>("/admin/users"),
      ]);
      setTarahiProjects(tp); setNezaratProjects(np); setEjraProjects(ep); setCategories(c); setRegions(r);
      setTableRows(tr); setPages(pg); setMessages(m); setUsers(u);
    } catch (err) { setError(err instanceof Error ? err.message : "خطا در دریافت اطلاعات"); }
    finally { setBusy(false); }
  }

  async function action(work: () => Promise<void>, success: string) {
    setBusy(true); setError(""); setNotice("");
    try { await work(); setNotice(success); }
    catch (err) { setError(err instanceof Error ? err.message : "عملیات ناموفق بود"); }
    finally { setBusy(false); }
  }

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
    if (!loading && user?.role === "admin") void loadAll();
  }, [loading, user]);

  useEffect(() => {
    setProjectForm({ ...emptyProject });
  }, [section]);

  useEffect(() => {
    const page = pages.find(item => item.key === pageKey);
    setPageForm(page ? { title: page.title, content: JSON.stringify(page.content, null, 2), is_published: page.is_published } : { title: "", content: "{}", is_published: true });
  }, [pageKey, pages]);

  function selectProject(item: ManagedProject | null) {
    if (!item) { setProjectForm({ ...emptyProject }); return; }
    setProjectForm({
      id: item.id, slug: item.slug, name: item.name, metraj: item.metraj || "", location: item.location || "",
      description: item.description, state: item.state, year: item.year || "", display_order: item.display_order,
      category_id: "category_id" in item ? item.category_id : "", region_id: "region_id" in item ? item.region_id : "",
      orientation: "orientation" in item ? item.orientation || "" : "",
    });
  }

  function projectPayload() {
    const base = {
      slug: projectForm.slug.trim(), name: projectForm.name.trim(), metraj: projectForm.metraj || null,
      location: projectForm.location || null, description: projectForm.description, state: projectForm.state,
      year: projectForm.year || null, display_order: Number(projectForm.display_order),
    };
    if (section === "tarahi") return { ...base, category_id: projectForm.category_id };
    if (section === "nezarat") return { ...base, region_id: projectForm.region_id, orientation: projectForm.orientation || null };
    return base;
  }

  async function saveProject() {
    await action(async () => {
      const endpoint = `/admin/${section}/projects`;
      await apiFetch(projectForm.id ? `${endpoint}/${projectForm.id}` : endpoint, { method: projectForm.id ? "PATCH" : "POST", body: JSON.stringify(projectPayload()) });
      setProjectForm({ ...emptyProject }); await loadAll();
    }, "پروژه ذخیره شد");
  }

  async function deleteProject() {
    if (!projectForm.id || !confirm("پروژه و تمام تصاویر آن حذف شود؟")) return;
    await action(async () => { await apiFetch(`/admin/${section}/projects/${projectForm.id}`, { method: "DELETE" }); setProjectForm({ ...emptyProject }); await loadAll(); }, "پروژه حذف شد");
  }

  async function uploadImages(files: FileList) {
    if (!projectForm.id || files.length === 0) return;
    await action(async () => {
      const projectHasImages = (selectedProject?.images.length || 0) > 0;
      for (const [index, file] of Array.from(files).entries()) {
        const form = new FormData();
        form.append("file", file);
        form.append("is_cover", String(!projectHasImages && index === 0));
        await apiFetch(`/admin/${section}/projects/${projectForm.id}/images`, { method: "POST", body: form });
      }
      await loadAll();
    }, files.length === 1 ? "تصویر آپلود شد" : `${files.length} تصویر آپلود شد`);
  }

  async function saveImage(image: ProjectImage) {
    await action(async () => { await apiFetch(`/admin/${section}/images/${image.id}`, { method: "PATCH", body: JSON.stringify(image) }); await loadAll(); }, "تصویر ذخیره شد");
  }

  async function deleteImage(image: ProjectImage) {
    if (!confirm("تصویر حذف شود؟")) return;
    await action(async () => { await apiFetch(`/admin/${section}/images/${image.id}`, { method: "DELETE" }); await loadAll(); }, "تصویر حذف شد");
  }

  function patchImage(imageId: string, patch: Partial<ProjectImage>) {
    const patchList = <T extends ManagedProject>(list: T[]) => list.map(project => ({ ...project, images: project.images.map(image => image.id === imageId ? { ...image, ...patch } : image) })) as T[];
    if (section === "tarahi") setTarahiProjects(patchList);
    else if (section === "nezarat") setNezaratProjects(patchList);
    else setEjraProjects(patchList);
  }

  async function saveCategory(item?: TarahiCategory) {
    await action(async () => {
      if (item) await apiFetch(`/admin/tarahi/categories/${item.id}`, { method: "PATCH", body: JSON.stringify(item) });
      else { await apiFetch("/admin/tarahi/categories", { method: "POST", body: JSON.stringify(newCategory) }); setNewCategory({ slug: "", name: "", description: "", display_order: 0, is_active: true }); }
      await loadAll();
    }, "دسته‌بندی ذخیره شد");
  }

  async function saveRegion(item?: NezaratRegion) {
    await action(async () => {
      if (item) await apiFetch(`/admin/nezarat/regions/${item.id}`, { method: "PATCH", body: JSON.stringify(item) });
      else { await apiFetch("/admin/nezarat/regions", { method: "POST", body: JSON.stringify(newRegion) }); setNewRegion({ slug: "", name: "", display_order: 0, is_active: true }); }
      await loadAll();
    }, "منطقه ذخیره شد");
  }

  async function deleteTaxonomy(kind: "category" | "region", id: string) {
    if (!confirm("این مورد حذف شود؟")) return;
    const path = kind === "category" ? `/admin/tarahi/categories/${id}` : `/admin/nezarat/regions/${id}`;
    await action(async () => { await apiFetch(path, { method: "DELETE" }); await loadAll(); }, "حذف شد");
  }

  async function saveTableRow() {
    await action(async () => {
      const payload = { ...tableForm, id: undefined, referral_date: tableForm.referral_date || null, display_order: Number(tableForm.display_order) };
      await apiFetch(tableForm.id ? `/admin/nezarat/table/${tableForm.id}` : "/admin/nezarat/table", { method: tableForm.id ? "PATCH" : "POST", body: JSON.stringify(payload) });
      setTableForm({ ...emptyTableRow }); await loadAll();
    }, "ردیف جدول ذخیره شد");
  }

  async function deleteTableRow() {
    if (!tableForm.id || !confirm("ردیف حذف شود؟")) return;
    await action(async () => { await apiFetch(`/admin/nezarat/table/${tableForm.id}`, { method: "DELETE" }); setTableForm({ ...emptyTableRow }); await loadAll(); }, "ردیف حذف شد");
  }

  async function savePage() {
    let content: Record<string, unknown>;
    try { content = JSON.parse(pageForm.content || "{}"); } catch { setError("JSON محتوای صفحه معتبر نیست"); return; }
    await action(async () => { await apiFetch(`/admin/page-contents/${pageKey}`, { method: "PUT", body: JSON.stringify({ title: pageForm.title, content, is_published: pageForm.is_published }) }); await loadAll(); }, "محتوای صفحه ذخیره شد");
  }

  async function saveMessage(item: ContactMessage) {
    await action(async () => { await apiFetch(`/admin/contacts/${item.id}`, { method: "PATCH", body: JSON.stringify({ status: item.status, admin_reply: item.admin_reply || null }) }); await loadAll(); }, "پیام ذخیره شد");
  }

  async function saveUser(item: ApiUser) {
    await action(async () => { await apiFetch(`/admin/users/${item.id}`, { method: "PATCH", body: JSON.stringify({ role: item.role, is_active: item.is_active }) }); await loadAll(); }, "کاربر ذخیره شد");
  }

  if (loading) return null;
  if (!user) return null;
  if (user.role !== "admin") return <AppShell><main style={{ padding: 40 }}>دسترسی مدیریت ندارید.</main></AppShell>;

  const Card = ({ children, style }: { children: ReactNode; style?: CSSProperties }) => <section style={{ background: palette.card, border: `1px solid ${palette.border}`, borderRadius: 4, padding: 16, ...style }}>{children}</section>;

  return <AppShell><main dir="rtl" style={{ minHeight: "calc(100vh - 65px)", padding: "22px clamp(12px,3vw,40px)", background: palette.bg, color: palette.text }}>
    <style>{`.admin-tabs{display:flex;gap:6px;flex-wrap:wrap}.admin-grid{display:grid;grid-template-columns:minmax(230px,30%) 1fr;gap:14px}.admin-fields{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.admin-list{max-height:68vh;overflow:auto}.admin-table{width:100%;border-collapse:collapse;font-size:.78rem}.admin-table th,.admin-table td{padding:8px;border-bottom:1px solid ${palette.border};text-align:right;vertical-align:top}@media(max-width:850px){.admin-grid{grid-template-columns:1fr}.admin-fields{grid-template-columns:1fr}.admin-table{display:block;overflow:auto}}`}</style>
    <header style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 16 }}>
      <div><h1 style={{ margin: 0, fontSize: "1.35rem" }}>پنل مدیریت محتوا</h1><small style={{ color: palette.muted }}>{user.email}</small></div>
      <div style={{ display: "flex", gap: 7 }}><button style={{ ...buttonStyle, background: palette.card, color: palette.text }} onClick={() => void loadAll()}><RefreshCw size={15}/></button><button style={{ ...buttonStyle, background: palette.card, color: palette.text }} onClick={() => void logout()}><LogOut size={15}/>خروج</button></div>
    </header>
    {error && <div style={{ padding: 10, marginBottom: 10, background: "rgba(189,48,57,.14)", color: palette.accent }}>{error}</div>}
    {notice && <div style={{ padding: 10, marginBottom: 10, background: "rgba(48,150,90,.14)" }}>{notice}</div>}
    <div className="admin-tabs" style={{ marginBottom: 14 }}>
      {(["projects","taxonomy","table","pages","messages","users"] as Tab[]).map(item => <button key={item} style={{ ...buttonStyle, background: tab === item ? palette.accent : palette.card, color: tab === item ? "white" : palette.text }} onClick={() => setTab(item)}>{({projects:"پروژه‌ها و تصاویر",taxonomy:"دسته‌ها و مناطق",table:"جدول نظارت",pages:"محتوای صفحات",messages:"پیام‌ها",users:"کاربران"} as Record<Tab,string>)[item]}</button>)}
    </div>

    {tab === "projects" && <>
      <div className="admin-tabs" style={{ marginBottom: 10 }}>{(["tarahi","nezarat","ejra"] as Section[]).map(item => <button key={item} style={{ ...buttonStyle, background: section === item ? palette.accent : palette.card, color: section === item ? "white" : palette.text }} onClick={() => setSection(item)}>{sectionLabels[item]}</button>)}</div>
      <div className="admin-grid">
        <Card><button style={{ ...buttonStyle, width: "100%", background: palette.accent, color: "white", marginBottom: 8 }} onClick={() => selectProject(null)}><Plus size={14}/>پروژه جدید</button><div className="admin-list">{projects.map(item => <button key={item.id} onClick={() => selectProject(item)} style={{ width: "100%", padding: 10, marginBottom: 5, textAlign: "right", background: palette.card2, color: palette.text, border: `1px solid ${projectForm.id === item.id ? palette.accent : palette.border}` }}>{item.name}<small style={{ display: "block", color: palette.muted }}>{item.state === "open" ? "باز" : "بسته"}</small></button>)}</div></Card>
        <Card><div className="admin-fields">
          <label>نام پروژه<input style={inputStyle} value={projectForm.name} onChange={e => setProjectForm(f => ({...f,name:e.target.value}))}/></label>
          <label>Slug<input dir="ltr" style={inputStyle} value={projectForm.slug} onChange={e => setProjectForm(f => ({...f,slug:e.target.value}))}/></label>
          <label>متراژ<input style={inputStyle} value={projectForm.metraj} onChange={e => setProjectForm(f => ({...f,metraj:e.target.value}))}/></label>
          <label>موقعیت<input style={inputStyle} value={projectForm.location} onChange={e => setProjectForm(f => ({...f,location:e.target.value}))}/></label>
          <label>سال<input style={inputStyle} value={projectForm.year} onChange={e => setProjectForm(f => ({...f,year:e.target.value}))}/></label>
          <label>وضعیت<select style={inputStyle} value={projectForm.state} onChange={e => setProjectForm(f => ({...f,state:e.target.value}))}><option value="open">باز</option><option value="closed">بسته</option></select></label>
          {section === "tarahi" && <label>دسته‌بندی<select style={inputStyle} value={projectForm.category_id} onChange={e => setProjectForm(f => ({...f,category_id:e.target.value}))}><option value="">انتخاب کنید</option>{categories.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}
          {section === "nezarat" && <><label>منطقه<select style={inputStyle} value={projectForm.region_id} onChange={e => setProjectForm(f => ({...f,region_id:e.target.value}))}><option value="">انتخاب کنید</option>{regions.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>گرایش<input style={inputStyle} value={projectForm.orientation} onChange={e => setProjectForm(f => ({...f,orientation:e.target.value}))}/></label></>}
          <label>ترتیب<input type="number" style={inputStyle} value={projectForm.display_order} onChange={e => setProjectForm(f => ({...f,display_order:Number(e.target.value)}))}/></label>
        </div><label style={{ display: "block", marginTop: 10 }}>توضیحات<textarea rows={5} style={inputStyle} value={projectForm.description} onChange={e => setProjectForm(f => ({...f,description:e.target.value}))}/></label>
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}><button disabled={busy} style={{ ...buttonStyle, background: palette.accent, color: "white" }} onClick={() => void saveProject()}><Save size={15}/>ذخیره</button>{projectForm.id && <button style={{ ...buttonStyle, background: "transparent", color: palette.accent }} onClick={() => void deleteProject()}><Trash2 size={15}/>حذف</button>}</div>
        {selectedProject && <div style={{ marginTop: 18 }}><label style={{ ...buttonStyle, background: palette.card2, color: palette.text, cursor: "pointer" }}><ImagePlus size={15}/>آپلود تصویر<input hidden multiple type="file" accept="image/jpeg,image/png,image/webp" onChange={e => e.target.files && void uploadImages(e.target.files)}/></label><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: 10, marginTop: 12 }}>{selectedProject.images.map(image => <div key={image.id} style={{ background: palette.card2, border: `1px solid ${image.is_cover ? palette.accent : palette.border}`, padding: 7 }}><img src={mediaUrl(image.file_url)} alt={image.alt_text || ""} style={{ width: "100%", aspectRatio: "16/10", objectFit: "cover" }}/><input style={{...inputStyle,marginTop:6}} placeholder="متن جایگزین" value={image.alt_text || ""} onChange={e => patchImage(image.id,{alt_text:e.target.value})}/><input style={{...inputStyle,marginTop:6}} placeholder="توضیح تصویر" value={image.caption || ""} onChange={e => patchImage(image.id,{caption:e.target.value})}/><input type="number" style={{...inputStyle,marginTop:6}} value={image.display_order} onChange={e => patchImage(image.id,{display_order:Number(e.target.value)})}/><label style={{display:"block",marginTop:6}}><input type="checkbox" checked={image.is_cover} onChange={e => patchImage(image.id,{is_cover:e.target.checked})}/> کاور</label><div style={{display:"flex",gap:5,marginTop:6}}><button style={{...buttonStyle,padding:6,flex:1,background:palette.card,color:palette.text}} onClick={() => void saveImage(image)}><Save size={13}/></button><button style={{...buttonStyle,padding:6,background:"transparent",color:palette.accent}} onClick={() => void deleteImage(image)}><Trash2 size={13}/></button></div></div>)}</div></div>}
        </Card>
      </div>
    </>}

    {tab === "taxonomy" && <div className="admin-grid">
      <Card>
        <h2 style={{fontSize:"1rem"}}>دسته‌بندی‌های طراحی</h2>
        <div className="admin-fields">
          <input style={inputStyle} placeholder="slug" value={newCategory.slug} onChange={e=>setNewCategory(f=>({...f,slug:e.target.value}))}/>
          <input style={inputStyle} placeholder="نام" value={newCategory.name} onChange={e=>setNewCategory(f=>({...f,name:e.target.value}))}/>
          <input style={inputStyle} placeholder="توضیح" value={newCategory.description} onChange={e=>setNewCategory(f=>({...f,description:e.target.value}))}/>
          <input type="number" style={inputStyle} placeholder="ترتیب" value={newCategory.display_order} onChange={e=>setNewCategory(f=>({...f,display_order:Number(e.target.value)}))}/>
          <label><input type="checkbox" checked={newCategory.is_active} onChange={e=>setNewCategory(f=>({...f,is_active:e.target.checked}))}/> فعال</label>
        </div>
        <button style={{...buttonStyle,marginTop:8,background:palette.accent,color:"white"}} onClick={()=>void saveCategory()}><Plus size={14}/>افزودن</button>
        {categories.map(item=><div key={item.id} style={{background:palette.card2,border:`1px solid ${palette.border}`,padding:8,marginTop:8}}>
          <div className="admin-fields">
            <input style={inputStyle} value={item.name} onChange={e=>setCategories(all=>all.map(x=>x.id===item.id?{...x,name:e.target.value}:x))}/>
            <input dir="ltr" style={inputStyle} value={item.slug} onChange={e=>setCategories(all=>all.map(x=>x.id===item.id?{...x,slug:e.target.value}:x))}/>
            <input style={inputStyle} placeholder="توضیح" value={item.description||""} onChange={e=>setCategories(all=>all.map(x=>x.id===item.id?{...x,description:e.target.value}:x))}/>
            <input type="number" style={inputStyle} value={item.display_order} onChange={e=>setCategories(all=>all.map(x=>x.id===item.id?{...x,display_order:Number(e.target.value)}:x))}/>
            <label><input type="checkbox" checked={item.is_active} onChange={e=>setCategories(all=>all.map(x=>x.id===item.id?{...x,is_active:e.target.checked}:x))}/> فعال</label>
          </div>
          <div style={{display:"flex",gap:6,marginTop:7}}><button style={{...buttonStyle,padding:7,background:palette.card,color:palette.text}} onClick={()=>void saveCategory(item)}><Save size={13}/>ذخیره</button><button style={{...buttonStyle,padding:7,background:"transparent",color:palette.accent}} onClick={()=>void deleteTaxonomy("category",item.id)}><Trash2 size={13}/>حذف</button></div>
        </div>)}
      </Card>
      <Card>
        <h2 style={{fontSize:"1rem"}}>مناطق نظارت</h2>
        <div className="admin-fields">
          <input dir="ltr" style={inputStyle} placeholder="slug مانند 1 یا lavasan" value={newRegion.slug} onChange={e=>setNewRegion(f=>({...f,slug:e.target.value}))}/>
          <input style={inputStyle} placeholder="نام" value={newRegion.name} onChange={e=>setNewRegion(f=>({...f,name:e.target.value}))}/>
          <input type="number" style={inputStyle} placeholder="ترتیب" value={newRegion.display_order} onChange={e=>setNewRegion(f=>({...f,display_order:Number(e.target.value)}))}/>
          <label><input type="checkbox" checked={newRegion.is_active} onChange={e=>setNewRegion(f=>({...f,is_active:e.target.checked}))}/> فعال</label>
        </div>
        <button style={{...buttonStyle,marginTop:8,background:palette.accent,color:"white"}} onClick={()=>void saveRegion()}><Plus size={14}/>افزودن</button>
        {regions.map(item=><div key={item.id} style={{background:palette.card2,border:`1px solid ${palette.border}`,padding:8,marginTop:8}}>
          <div className="admin-fields">
            <input style={inputStyle} value={item.name} onChange={e=>setRegions(all=>all.map(x=>x.id===item.id?{...x,name:e.target.value}:x))}/>
            <input dir="ltr" style={inputStyle} value={item.slug} onChange={e=>setRegions(all=>all.map(x=>x.id===item.id?{...x,slug:e.target.value}:x))}/>
            <input type="number" style={inputStyle} value={item.display_order} onChange={e=>setRegions(all=>all.map(x=>x.id===item.id?{...x,display_order:Number(e.target.value)}:x))}/>
            <label><input type="checkbox" checked={item.is_active} onChange={e=>setRegions(all=>all.map(x=>x.id===item.id?{...x,is_active:e.target.checked}:x))}/> فعال</label>
          </div>
          <div style={{display:"flex",gap:6,marginTop:7}}><button style={{...buttonStyle,padding:7,background:palette.card,color:palette.text}} onClick={()=>void saveRegion(item)}><Save size={13}/>ذخیره</button><button style={{...buttonStyle,padding:7,background:"transparent",color:palette.accent}} onClick={()=>void deleteTaxonomy("region",item.id)}><Trash2 size={13}/>حذف</button></div>
        </div>)}
      </Card>
    </div>}

    {tab === "table" && <div className="admin-grid"><Card><button style={{...buttonStyle,width:"100%",background:palette.accent,color:"white",marginBottom:8}} onClick={()=>setTableForm({...emptyTableRow})}><Plus size={14}/>ردیف جدید</button><div className="admin-list">{tableRows.map(item=><button key={item.id} onClick={()=>setTableForm({...emptyTableRow,...item,referral_date:item.referral_date||""})} style={{width:"100%",padding:9,marginBottom:5,background:palette.card2,color:palette.text,border:`1px solid ${tableForm.id===item.id?palette.accent:palette.border}`,textAlign:"right"}}>{item.table_status==="live"?"جاری":"پایان‌یافته"} — {item.region||item.address||"بدون عنوان"}</button>)}</div></Card><Card><div className="admin-fields"><label>نوع جدول<select style={inputStyle} value={tableForm.table_status} onChange={e=>setTableForm(f=>({...f,table_status:e.target.value}))}><option value="live">جاری</option><option value="ended">پایان‌یافته</option></select></label><label>منطقه<input style={inputStyle} value={tableForm.region} onChange={e=>setTableForm(f=>({...f,region:e.target.value}))}/></label><label>متراژ<input style={inputStyle} value={tableForm.metraj} onChange={e=>setTableForm(f=>({...f,metraj:e.target.value}))}/></label><label>طبقات مجاز<input style={inputStyle} value={tableForm.allowed_floors} onChange={e=>setTableForm(f=>({...f,allowed_floors:e.target.value}))}/></label><label>مرحله پروژه<input style={inputStyle} value={tableForm.project_stage} onChange={e=>setTableForm(f=>({...f,project_stage:e.target.value}))}/></label><label>سال<input style={inputStyle} value={tableForm.year} onChange={e=>setTableForm(f=>({...f,year:e.target.value}))}/></label><label>تاریخ ارجاع<input type="date" style={inputStyle} value={tableForm.referral_date} onChange={e=>setTableForm(f=>({...f,referral_date:e.target.value}))}/></label><label>ترتیب<input type="number" style={inputStyle} value={tableForm.display_order} onChange={e=>setTableForm(f=>({...f,display_order:Number(e.target.value)}))}/></label><label><input type="checkbox" checked={tableForm.is_published} onChange={e=>setTableForm(f=>({...f,is_published:e.target.checked}))}/> منتشر شود</label></div><label style={{display:"block",marginTop:8}}>آدرس<textarea rows={3} style={inputStyle} value={tableForm.address} onChange={e=>setTableForm(f=>({...f,address:e.target.value}))}/></label><label style={{display:"block",marginTop:8}}>توضیحات<textarea rows={3} style={inputStyle} value={tableForm.description} onChange={e=>setTableForm(f=>({...f,description:e.target.value}))}/></label><div style={{display:"flex",gap:8,marginTop:10}}><button style={{...buttonStyle,background:palette.accent,color:"white"}} onClick={()=>void saveTableRow()}><Save size={15}/>ذخیره</button>{tableForm.id&&<button style={{...buttonStyle,background:"transparent",color:palette.accent}} onClick={()=>void deleteTableRow()}><Trash2 size={15}/>حذف</button>}</div></Card></div>}

    {tab === "pages" && <Card><select style={inputStyle} value={pageKey} onChange={e=>setPageKey(e.target.value)}>{["landing","tarrahi","nezarat","ejra","about","contact"].map(key=><option key={key}>{key}</option>)}</select><input style={{...inputStyle,marginTop:10}} value={pageForm.title} onChange={e=>setPageForm(f=>({...f,title:e.target.value}))}/><label style={{display:"block",marginTop:10}}><input type="checkbox" checked={pageForm.is_published} onChange={e=>setPageForm(f=>({...f,is_published:e.target.checked}))}/> منتشر شود</label><textarea rows={20} dir="ltr" style={{...inputStyle,marginTop:10,fontFamily:"monospace"}} value={pageForm.content} onChange={e=>setPageForm(f=>({...f,content:e.target.value}))}/><button style={{...buttonStyle,marginTop:10,background:palette.accent,color:"white"}} onClick={()=>void savePage()}><Save size={15}/>ذخیره</button></Card>}

    {tab === "messages" && <Card><table className="admin-table"><thead><tr><th>فرستنده</th><th>پیام</th><th>پاسخ</th><th>وضعیت</th><th></th></tr></thead><tbody>{messages.map(item=><tr key={item.id}><td>{item.name}<br/><small>{item.email}</small></td><td><strong>{item.subject}</strong><div>{item.message}</div></td><td><textarea rows={4} style={inputStyle} value={item.admin_reply||""} onChange={e=>setMessages(all=>all.map(x=>x.id===item.id?{...x,admin_reply:e.target.value}:x))}/></td><td><select style={inputStyle} value={item.status} onChange={e=>setMessages(all=>all.map(x=>x.id===item.id?{...x,status:e.target.value as ContactMessage["status"]}:x))}><option value="new">جدید</option><option value="reviewing">درحال بررسی</option><option value="answered">پاسخ داده شد</option><option value="closed">بسته</option></select></td><td><button style={{...buttonStyle,padding:7,background:palette.card2,color:palette.text}} onClick={()=>void saveMessage(item)}><Save size={13}/></button></td></tr>)}</tbody></table></Card>}

    {tab === "users" && <Card><table className="admin-table"><thead><tr><th>نام</th><th>ایمیل</th><th>نقش</th><th>فعال</th><th></th></tr></thead><tbody>{users.map(item=><tr key={item.id}><td>{item.full_name}</td><td dir="ltr">{item.email}</td><td><select style={inputStyle} value={item.role} onChange={e=>setUsers(all=>all.map(x=>x.id===item.id?{...x,role:e.target.value as ApiUser["role"]}:x))}><option value="user">کاربر</option><option value="admin">مدیر</option></select></td><td><input type="checkbox" checked={item.is_active} onChange={e=>setUsers(all=>all.map(x=>x.id===item.id?{...x,is_active:e.target.checked}:x))}/></td><td><button style={{...buttonStyle,padding:7,background:palette.card2,color:palette.text}} onClick={()=>void saveUser(item)}><Save size={13}/></button></td></tr>)}</tbody></table></Card>}
  </main></AppShell>;
}

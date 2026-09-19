import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router";
import {
  CheckCircle2,
  ExternalLink,
  ImagePlus,
  Layers3,
  LogOut,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { AppShell } from "./AppShell";
import { ADMIN_URL, apiFetch, mediaUrl, type ApiUser, type ContactMessage, type EjraProject, type NezaratProject, type NezaratRegion, type NezaratTableRow, type PageContent, type ProjectImage, type TarahiProject, type TarahiProjectSection } from "../api";
import { useAuth, useDark } from "../context";

type Tab = "projects" | "regions" | "table" | "pages" | "messages" | "users";
type Section = "tarahi" | "nezarat" | "ejra";
type ManagedProject = TarahiProject | NezaratProject | EjraProject;

interface ProjectDraft {
  id: string;
  slug: string;
  name: string;
  metraj: string;
  location: string;
  description: string;
  state: "open" | "closed";
  year: string;
  display_order: number;
  region_id: string;
  orientation: string;
}

interface SectionDraft {
  id: string;
  slug: string;
  name: string;
  description: string;
  display_order: number;
}

const sectionLabels: Record<Section, string> = {
  tarahi: "طراحی",
  nezarat: "نظارت",
  ejra: "اجرا",
};

const emptyProject: ProjectDraft = {
  id: "",
  slug: "",
  name: "",
  metraj: "",
  location: "",
  description: "",
  state: "open",
  year: "",
  display_order: 0,
  region_id: "",
  orientation: "",
};

const emptySection: SectionDraft = {
  id: "",
  slug: "",
  name: "",
  description: "",
  display_order: 0,
};

const emptyTableRow = {
  id: "",
  table_status: "live",
  region: "",
  metraj: "",
  allowed_floors: "",
  project_stage: "",
  year: "",
  address: "",
  referral_date: "",
  description: "",
  display_order: 0,
  is_published: true,
};

const pageKeys = ["landing", "tarrahi", "nezarat", "ejra", "about", "contact"];

function slugify(value: string) {
  return value.trim().replace(/\s+/g, "-").replace(/[\/\\?#]+/g, "-").replace(/^-+|-+$/g, "");
}

function sortImages(images: ProjectImage[]) {
  return [...images].sort((a, b) => a.display_order - b.display_order);
}

function projectImages(project: ManagedProject | null) {
  if (!project) return [];
  if ("sections" in project) return sortImages(project.images).filter(image => image.is_cover);
  return sortImages(project.images);
}

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
  const [regions, setRegions] = useState<NezaratRegion[]>([]);
  const [tableRows, setTableRows] = useState<NezaratTableRow[]>([]);
  const [pages, setPages] = useState<PageContent[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [projectForm, setProjectForm] = useState<ProjectDraft>({ ...emptyProject });
  const [sectionForm, setSectionForm] = useState<SectionDraft>({ ...emptySection });
  const [initialSections, setInitialSections] = useState("معماری\nسازه\nبرق");
  const [regionForm, setRegionForm] = useState({ slug: "", name: "", display_order: 0, is_active: true });
  const [tableForm, setTableForm] = useState({ ...emptyTableRow });
  const [pageKey, setPageKey] = useState("landing");
  const [pageForm, setPageForm] = useState({ title: "", content: "{}", is_published: true });

  const projects = useMemo<ManagedProject[]>(
    () => section === "tarahi" ? tarahiProjects : section === "nezarat" ? nezaratProjects : ejraProjects,
    [ejraProjects, nezaratProjects, section, tarahiProjects],
  );
  const selectedProject = useMemo(() => projects.find(item => item.id === projectForm.id) || null, [projectForm.id, projects]);
  const tarahiProject = selectedProject && "sections" in selectedProject ? selectedProject : null;
  const selectedImages = projectImages(selectedProject);

  const colors = {
    bg: dark ? "#171514" : "#f2efec",
    panel: dark ? "#211f1e" : "#fff",
    panel2: dark ? "#292625" : "#f8f5f2",
    field: dark ? "#181615" : "#fff",
    text: dark ? "#f6ede4" : "#261615",
    muted: dark ? "rgba(246,237,228,.58)" : "rgba(38,22,21,.56)",
    border: dark ? "rgba(246,237,228,.12)" : "rgba(80,30,30,.12)",
    accent: "#BD3039",
    gold: dark ? "#d4af37" : "#ad7f25",
  };

  async function loadAll() {
    setBusy(true);
    setError("");
    try {
      const [tp, np, ep, r, tr, pg, m, u] = await Promise.all([
        apiFetch<TarahiProject[]>("/admin/tarahi/projects"),
        apiFetch<NezaratProject[]>("/admin/nezarat/projects"),
        apiFetch<EjraProject[]>("/admin/ejra/projects"),
        apiFetch<NezaratRegion[]>("/admin/nezarat/regions"),
        apiFetch<NezaratTableRow[]>("/admin/nezarat/table"),
        apiFetch<PageContent[]>("/admin/page-contents"),
        apiFetch<ContactMessage[]>("/admin/contacts"),
        apiFetch<ApiUser[]>("/admin/users"),
      ]);
      setTarahiProjects(tp);
      setNezaratProjects(np);
      setEjraProjects(ep);
      setRegions(r);
      setTableRows(tr);
      setPages(pg);
      setMessages(m);
      setUsers(u);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در دریافت اطلاعات");
    } finally {
      setBusy(false);
    }
  }

  async function run(work: () => Promise<void>, success: string) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await work();
      setNotice(success);
    } catch (err) {
      setError(err instanceof Error ? err.message : "عملیات ناموفق بود");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
    if (!loading && user?.role === "admin") void loadAll();
  }, [loading, navigate, user]);

  useEffect(() => {
    setProjectForm({ ...emptyProject });
    setSectionForm({ ...emptySection });
  }, [section]);

  useEffect(() => {
    const page = pages.find(item => item.key === pageKey);
    setPageForm(page
      ? { title: page.title, content: JSON.stringify(page.content, null, 2), is_published: page.is_published }
      : { title: "", content: "{}", is_published: true });
  }, [pageKey, pages]);

  function selectProject(project: ManagedProject | null) {
    setSectionForm({ ...emptySection });
    if (!project) {
      setProjectForm({ ...emptyProject });
      setInitialSections("معماری\nسازه\nبرق");
      return;
    }
    setProjectForm({
      id: project.id,
      slug: project.slug,
      name: project.name,
      metraj: project.metraj || "",
      location: project.location || "",
      description: project.description || "",
      state: project.state,
      year: project.year || "",
      display_order: project.display_order,
      region_id: "region_id" in project ? project.region_id : "",
      orientation: "orientation" in project ? project.orientation || "" : "",
    });
  }

  function projectPayload() {
    const base = {
      slug: slugify(projectForm.slug || projectForm.name),
      name: projectForm.name.trim(),
      metraj: projectForm.metraj.trim() || null,
      location: projectForm.location.trim() || null,
      description: projectForm.description,
      state: projectForm.state,
      year: projectForm.year.trim() || null,
      display_order: Number(projectForm.display_order),
    };
    if (section === "nezarat") return { ...base, region_id: projectForm.region_id, orientation: projectForm.orientation.trim() || null };
    return base;
  }

  async function persistProject() {
    const endpoint = `/admin/${section}/projects`;
    const wasNew = !projectForm.id;
    const saved = await apiFetch<ManagedProject>(projectForm.id ? `${endpoint}/${projectForm.id}` : endpoint, {
      method: projectForm.id ? "PATCH" : "POST",
      body: JSON.stringify(projectPayload()),
    });
    if (wasNew && section === "tarahi") {
      for (const [index, name] of initialSections.split(/\r?\n/).map(item => item.trim()).filter(Boolean).entries()) {
        await apiFetch(`/admin/tarahi/projects/${saved.id}/sections`, {
          method: "POST",
          body: JSON.stringify({
            name,
            slug: slugify(name),
            description: null,
            display_order: index,
          }),
        });
      }
    }
    setProjectForm(form => ({ ...form, id: saved.id }));
    return saved;
  }

  async function saveProject() {
    await run(async () => {
      const saved = await persistProject();
      await loadAll();
      setProjectForm(form => ({ ...form, id: saved.id }));
    }, "پروژه ذخیره شد و برای ادامه ویرایش باز ماند");
  }

  async function deleteProject() {
    if (!projectForm.id || !confirm("پروژه و تمام تصاویر آن حذف شود؟")) return;
    await run(async () => {
      await apiFetch(`/admin/${section}/projects/${projectForm.id}`, { method: "DELETE" });
      setProjectForm({ ...emptyProject });
      await loadAll();
    }, "پروژه حذف شد");
  }

  async function ensureProject() {
    if (projectForm.id) return projectForm.id;
    const saved = await persistProject();
    return saved.id;
  }

  async function uploadImages(files: FileList | null, options: { cover?: boolean; sectionId?: string } = {}) {
    if (!files?.length) return;
    await run(async () => {
      const projectId = await ensureProject();
      const hasImages = (selectedProject?.images.length || 0) > 0;
      for (const [index, file] of Array.from(files).entries()) {
        const form = new FormData();
        form.append("file", file);
        form.append("is_cover", String(options.cover || (section !== "tarahi" && !hasImages && index === 0)));
        if (options.sectionId) form.append("section_id", options.sectionId);
        await apiFetch(`/admin/${section}/projects/${projectId}/images`, { method: "POST", body: form });
      }
      await loadAll();
    }, files.length === 1 ? "تصویر آپلود شد" : `${files.length} تصویر آپلود شد`);
  }

  async function saveImage(image: ProjectImage, patch: Partial<ProjectImage> = {}) {
    await run(async () => {
      const payload = {
        alt_text: patch.alt_text ?? image.alt_text ?? null,
        caption: patch.caption ?? image.caption ?? null,
        display_order: patch.display_order ?? image.display_order,
        is_cover: patch.is_cover ?? image.is_cover,
      };
      await apiFetch(`/admin/${section}/images/${image.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      await loadAll();
    }, "تصویر ذخیره شد");
  }

  async function deleteImage(image: ProjectImage) {
    if (!confirm("تصویر حذف شود؟")) return;
    await run(async () => {
      await apiFetch(`/admin/${section}/images/${image.id}`, { method: "DELETE" });
      await loadAll();
    }, "تصویر حذف شد");
  }

  function patchImage(imageId: string, patch: Partial<ProjectImage>) {
    const patchProject = <T extends ManagedProject>(project: T) => ({
      ...project,
      images: project.images.map(image => image.id === imageId ? { ...image, ...patch } : image),
      ...("sections" in project ? {
        sections: project.sections.map(item => ({
          ...item,
          images: item.images.map(image => image.id === imageId ? { ...image, ...patch } : image),
        })),
      } : {}),
    }) as T;
    if (section === "tarahi") setTarahiProjects(items => items.map(patchProject));
    if (section === "nezarat") setNezaratProjects(items => items.map(patchProject));
    if (section === "ejra") setEjraProjects(items => items.map(patchProject));
  }

  async function saveSection(item?: TarahiProjectSection) {
    await run(async () => {
      const projectId = await ensureProject();
      const draft = item ? {
        name: item.name,
        slug: slugify(item.slug || item.name),
        description: item.description || null,
        display_order: item.display_order,
      } : {
        name: sectionForm.name.trim(),
        slug: slugify(sectionForm.slug || sectionForm.name),
        description: sectionForm.description.trim() || null,
        display_order: Number(sectionForm.display_order),
      };
      if (!draft.name) throw new Error("نام بخش الزامی است");
      if (item) {
        await apiFetch(`/admin/tarahi/sections/${item.id}`, { method: "PATCH", body: JSON.stringify(draft) });
      } else {
        await apiFetch(`/admin/tarahi/projects/${projectId}/sections`, { method: "POST", body: JSON.stringify(draft) });
        setSectionForm({ ...emptySection });
      }
      await loadAll();
    }, "بخش تصاویر ذخیره شد");
  }

  async function deleteSection(id: string) {
    if (!confirm("این بخش و تصاویر داخل آن حذف شود؟")) return;
    await run(async () => {
      await apiFetch(`/admin/tarahi/sections/${id}`, { method: "DELETE" });
      await loadAll();
    }, "بخش حذف شد");
  }

  async function saveRegion(item?: NezaratRegion) {
    await run(async () => {
      if (item) {
        await apiFetch(`/admin/nezarat/regions/${item.id}`, { method: "PATCH", body: JSON.stringify(item) });
      } else {
        await apiFetch("/admin/nezarat/regions", { method: "POST", body: JSON.stringify({ ...regionForm, slug: slugify(regionForm.slug || regionForm.name) }) });
        setRegionForm({ slug: "", name: "", display_order: 0, is_active: true });
      }
      await loadAll();
    }, "منطقه ذخیره شد");
  }

  async function deleteRegion(id: string) {
    if (!confirm("این منطقه حذف شود؟")) return;
    await run(async () => {
      await apiFetch(`/admin/nezarat/regions/${id}`, { method: "DELETE" });
      await loadAll();
    }, "منطقه حذف شد");
  }

  async function saveTableRow() {
    await run(async () => {
      const payload = { ...tableForm, id: undefined, referral_date: tableForm.referral_date || null, display_order: Number(tableForm.display_order) };
      await apiFetch(tableForm.id ? `/admin/nezarat/table/${tableForm.id}` : "/admin/nezarat/table", {
        method: tableForm.id ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });
      setTableForm({ ...emptyTableRow });
      await loadAll();
    }, "ردیف جدول ذخیره شد");
  }

  async function savePage() {
    let content: Record<string, unknown>;
    try {
      content = JSON.parse(pageForm.content || "{}");
    } catch {
      setError("JSON محتوای صفحه معتبر نیست");
      return;
    }
    await run(async () => {
      await apiFetch(`/admin/page-contents/${pageKey}`, { method: "PUT", body: JSON.stringify({ title: pageForm.title, content, is_published: pageForm.is_published }) });
      await loadAll();
    }, "محتوای صفحه ذخیره شد");
  }

  async function saveMessage(item: ContactMessage) {
    await run(async () => {
      await apiFetch(`/admin/contacts/${item.id}`, { method: "PATCH", body: JSON.stringify({ status: item.status, admin_reply: item.admin_reply || null }) });
      await loadAll();
    }, "پیام ذخیره شد");
  }

  async function saveUser(item: ApiUser) {
    await run(async () => {
      await apiFetch(`/admin/users/${item.id}`, { method: "PATCH", body: JSON.stringify({ role: item.role, is_active: item.is_active }) });
      await loadAll();
    }, "کاربر ذخیره شد");
  }

  if (loading) return null;
  if (!user) return null;
  if (user.role !== "admin") return <AppShell><main style={{ padding: 40 }}>دسترسی مدیریت ندارید.</main></AppShell>;

  const totalProjects = tarahiProjects.length + nezaratProjects.length + ejraProjects.length;

  return (
    <AppShell hideFooter>
      <main className="admin-shell" dir="rtl">
        <style>{`
          .admin-shell{min-height:calc(100dvh - 65px);background:${colors.bg};color:${colors.text};padding:18px clamp(12px,2.5vw,34px);font-family:var(--app-font-family)}
          .admin-top{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:16px}.admin-title h1{margin:0;font-size:1.28rem}.admin-title p{margin:.25rem 0 0;color:${colors.muted};font-size:.76rem}.admin-actions,.admin-tabs,.admin-sections,.admin-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
          .admin-button{border:1px solid ${colors.border};background:${colors.panel};color:${colors.text};border-radius:7px;min-height:38px;padding:8px 12px;display:inline-flex;align-items:center;justify-content:center;gap:7px;cursor:pointer;font:800 .78rem var(--app-font-family);text-decoration:none}.admin-button.primary{background:${colors.accent};border-color:${colors.accent};color:white}.admin-button.gold{border-color:rgba(212,175,55,.45);color:${colors.gold}}.admin-button.ghost{background:transparent}.admin-button.danger{background:transparent;color:${colors.accent};border-color:rgba(189,48,57,.36)}.admin-button:disabled{opacity:.55;cursor:wait}
          .admin-grid{display:grid;grid-template-columns:290px minmax(0,1fr);gap:14px}.admin-card{background:${colors.panel};border:1px solid ${colors.border};border-radius:8px;padding:14px;box-shadow:0 14px 34px rgba(0,0,0,${dark ? ".18" : ".05"})}.admin-card h2,.admin-card h3{margin:0 0 10px}.admin-card h2{font-size:.98rem}.admin-card h3{font-size:.88rem}.admin-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:14px}.admin-kpi{background:${colors.panel};border:1px solid ${colors.border};border-radius:8px;padding:12px}.admin-kpi strong{display:block;font-size:1.25rem}.admin-kpi span{color:${colors.muted};font-size:.72rem}
          .admin-tabs{margin-bottom:12px}.admin-tab{border:1px solid ${colors.border};background:${colors.panel};color:${colors.muted};border-radius:7px;padding:9px 12px;cursor:pointer;font:850 .78rem var(--app-font-family)}.admin-tab.active{background:${colors.accent};border-color:${colors.accent};color:#fff}.admin-section-pill{border:1px solid ${colors.border};background:${colors.panel2};color:${colors.text};border-radius:999px;padding:7px 12px;cursor:pointer;font:800 .75rem var(--app-font-family)}.admin-section-pill.active{background:${colors.text};color:${colors.bg}}
          .admin-list{display:grid;gap:7px;max-height:calc(100dvh - 330px);overflow:auto;padding-inline-end:2px}.admin-project-item{display:grid;grid-template-columns:54px 1fr;gap:9px;text-align:right;border:1px solid ${colors.border};background:${colors.panel2};color:${colors.text};border-radius:7px;padding:8px;cursor:pointer}.admin-project-item.active{border-color:${colors.accent};box-shadow:0 0 0 1px ${colors.accent} inset}.admin-thumb{width:54px;height:46px;border-radius:5px;background:#111;object-fit:cover}.admin-item-title{font-weight:900;font-size:.78rem}.admin-item-meta{color:${colors.muted};font-size:.67rem;margin-top:2px}
          .admin-form{display:grid;gap:12px}.admin-fields{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.admin-field{display:grid;gap:5px;color:${colors.muted};font-size:.72rem;font-weight:800}.admin-field.full{grid-column:1/-1}.admin-field.span2{grid-column:span 2}.admin-input{width:100%;box-sizing:border-box;border:1px solid ${colors.border};background:${colors.field};color:${colors.text};border-radius:6px;min-height:40px;padding:9px 10px;font:inherit}.admin-input:focus{outline:3px solid rgba(189,48,57,.13);border-color:${colors.accent}}textarea.admin-input{min-height:94px;resize:vertical}.admin-help{color:${colors.muted};font-size:.7rem;line-height:1.8;margin:0}
          .admin-media-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:10px}.admin-media{border:1px solid ${colors.border};background:${colors.panel2};border-radius:8px;padding:8px}.admin-media img{display:block;width:100%;height:124px;object-fit:contain;background:#111;border-radius:5px}.admin-section-card{border:1px solid ${colors.border};background:${colors.panel2};border-radius:8px;padding:12px;margin-top:10px}.admin-drop{border:1px dashed ${colors.accent};color:${colors.accent};border-radius:7px;min-height:40px;display:inline-flex;align-items:center;justify-content:center;gap:7px;padding:8px 12px;cursor:pointer;background:rgba(189,48,57,.06);font-weight:900}.admin-drop input{display:none}
          .admin-table{width:100%;border-collapse:collapse;font-size:.76rem}.admin-table th,.admin-table td{border-bottom:1px solid ${colors.border};padding:9px;text-align:right;vertical-align:top}.admin-table th{color:${colors.muted};background:${colors.panel2}}.admin-scroll{overflow:auto}.admin-alert{border-radius:7px;padding:10px 12px;margin-bottom:10px;border:1px solid}.admin-alert.ok{border-color:rgba(35,122,81,.4);background:rgba(35,122,81,.1)}.admin-alert.err{border-color:rgba(189,48,57,.42);background:rgba(189,48,57,.1);color:${colors.accent}}
          @media(max-width:980px){.admin-grid,.admin-kpis{grid-template-columns:1fr}.admin-list{max-height:none}.admin-fields{grid-template-columns:1fr}.admin-field.span2{grid-column:auto}.admin-top{align-items:flex-start;flex-direction:column}}
        `}</style>

        <header className="admin-top">
          <div className="admin-title">
            <h1>پنل مدیریت متا</h1>
            <p>{user.email || user.phone || user.full_name}</p>
          </div>
          <div className="admin-actions">
            <button className="admin-button" onClick={() => void loadAll()} disabled={busy}><RefreshCw size={15}/> تازه‌سازی</button>
            <a className="admin-button gold" href={ADMIN_URL} target="_blank" rel="noreferrer"><ExternalLink size={15}/> پنل پشتیبان</a>
            <button className="admin-button ghost" onClick={() => void logout()}><LogOut size={15}/> خروج</button>
          </div>
        </header>

        {error && <div className="admin-alert err">{error}</div>}
        {notice && <div className="admin-alert ok"><CheckCircle2 size={15}/> {notice}</div>}

        <section className="admin-kpis">
          <div className="admin-kpi"><strong>{totalProjects}</strong><span>کل پروژه‌ها</span></div>
          <div className="admin-kpi"><strong>{tarahiProjects.length}</strong><span>طراحی</span></div>
          <div className="admin-kpi"><strong>{nezaratProjects.length}</strong><span>نظارت</span></div>
          <div className="admin-kpi"><strong>{ejraProjects.length}</strong><span>اجرا</span></div>
        </section>

        <nav className="admin-tabs">
          {[
            ["projects", "پروژه‌ها"],
            ["regions", "مناطق"],
            ["table", "جدول نظارت"],
            ["pages", "صفحات"],
            ["messages", "پیام‌ها"],
            ["users", "کاربران"],
          ].map(([key, label]) => (
            <button key={key} className={`admin-tab${tab === key ? " active" : ""}`} onClick={() => setTab(key as Tab)}>{label}</button>
          ))}
        </nav>

        {tab === "projects" && (
          <>
            <div className="admin-sections" style={{ marginBottom: 12 }}>
              {(["tarahi", "nezarat", "ejra"] as Section[]).map(item => (
                <button key={item} className={`admin-section-pill${section === item ? " active" : ""}`} onClick={() => setSection(item)}>{sectionLabels[item]}</button>
              ))}
            </div>
            <div className="admin-grid">
              <aside className="admin-card">
                <button className="admin-button primary" style={{ width: "100%", marginBottom: 10 }} onClick={() => selectProject(null)}><Plus size={15}/> پروژه جدید</button>
                <div className="admin-list">
                  {projects.map(project => {
                    const thumb = projectImages(project)[0] || project.images[0];
                    return (
                      <button key={project.id} className={`admin-project-item${projectForm.id === project.id ? " active" : ""}`} onClick={() => selectProject(project)}>
                        {thumb ? <img className="admin-thumb" src={mediaUrl(thumb.file_url)} alt="" /> : <span className="admin-thumb" />}
                        <span>
                          <span className="admin-item-title">{project.name}</span>
                          <span className="admin-item-meta">{project.state === "open" ? "باز" : "بسته"} · {project.images.length} تصویر</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </aside>

              <section className="admin-card">
                <div className="admin-form">
                  <div className="admin-row" style={{ justifyContent: "space-between" }}>
                    <h2>{projectForm.id ? "ویرایش پروژه" : "پروژه جدید"}</h2>
                    <div className="admin-row">
                      <button className="admin-button primary" disabled={busy} onClick={() => void saveProject()}><Save size={15}/> ذخیره و ادامه</button>
                      {projectForm.id && <button className="admin-button danger" onClick={() => void deleteProject()}><Trash2 size={15}/> حذف</button>}
                    </div>
                  </div>

                  <div className="admin-fields">
                    <label className="admin-field">نام پروژه<input className="admin-input" value={projectForm.name} onChange={e => setProjectForm(f => ({ ...f, name: e.target.value }))}/></label>
                    <label className="admin-field">شناسه URL<input dir="ltr" className="admin-input" value={projectForm.slug} placeholder="خودکار" onChange={e => setProjectForm(f => ({ ...f, slug: e.target.value }))}/></label>
                    <label className="admin-field">وضعیت<select className="admin-input" value={projectForm.state} onChange={e => setProjectForm(f => ({ ...f, state: e.target.value as ProjectDraft["state"] }))}><option value="open">باز</option><option value="closed">بسته</option></select></label>
                    <label className="admin-field">متراژ<input className="admin-input" value={projectForm.metraj} onChange={e => setProjectForm(f => ({ ...f, metraj: e.target.value }))}/></label>
                    <label className="admin-field">موقعیت<input className="admin-input" value={projectForm.location} onChange={e => setProjectForm(f => ({ ...f, location: e.target.value }))}/></label>
                    <label className="admin-field">سال<input className="admin-input" value={projectForm.year} onChange={e => setProjectForm(f => ({ ...f, year: e.target.value }))}/></label>
                    {section === "nezarat" && <label className="admin-field">منطقه<select className="admin-input" value={projectForm.region_id} onChange={e => setProjectForm(f => ({ ...f, region_id: e.target.value }))}><option value="">انتخاب کنید</option>{regions.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}
                    {section === "nezarat" && <label className="admin-field">گرایش<input className="admin-input" value={projectForm.orientation} onChange={e => setProjectForm(f => ({ ...f, orientation: e.target.value }))}/></label>}
                    <label className="admin-field">ترتیب<input type="number" className="admin-input" value={projectForm.display_order} onChange={e => setProjectForm(f => ({ ...f, display_order: Number(e.target.value) }))}/></label>
                    <label className="admin-field full">توضیحات<textarea className="admin-input" value={projectForm.description} onChange={e => setProjectForm(f => ({ ...f, description: e.target.value }))}/></label>
                  </div>

                  {section === "tarahi" && !projectForm.id && (
                    <label className="admin-field full">بخش‌های اولیه تصاویر
                      <textarea className="admin-input" value={initialSections} onChange={e => setInitialSections(e.target.value)} />
                      <p className="admin-help">هر بخش در یک خط ساخته می‌شود. بعد از ذخیره، می‌توانید برای هر بخش تصویر اضافه کنید.</p>
                    </label>
                  )}

                  {section === "tarahi" ? (
                    <>
                      <div className="admin-section-card">
                        <h3>کاور پروژه</h3>
                        <label className="admin-drop"><ImagePlus size={15}/> آپلود کاور<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => void uploadImages(e.target.files, { cover: true })}/></label>
                        {!!selectedImages.length && <div className="admin-media-grid" style={{ marginTop: 10 }}>{selectedImages.map(image => (
                          <ImageEditor key={image.id} image={image} onPatch={patch => patchImage(image.id, patch)} onSave={() => void saveImage(image)} onDelete={() => void deleteImage(image)} />
                        ))}</div>}
                      </div>

                      <div className="admin-section-card">
                        <h3>بخش جدید</h3>
                        <div className="admin-fields">
                          <label className="admin-field">نام بخش<input className="admin-input" value={sectionForm.name} placeholder="معماری" onChange={e => setSectionForm(f => ({ ...f, name: e.target.value }))}/></label>
                          <label className="admin-field">شناسه<input dir="ltr" className="admin-input" value={sectionForm.slug} placeholder="خودکار" onChange={e => setSectionForm(f => ({ ...f, slug: e.target.value }))}/></label>
                          <label className="admin-field">ترتیب<input type="number" className="admin-input" value={sectionForm.display_order} onChange={e => setSectionForm(f => ({ ...f, display_order: Number(e.target.value) }))}/></label>
                          <label className="admin-field full">توضیح<textarea className="admin-input" value={sectionForm.description} onChange={e => setSectionForm(f => ({ ...f, description: e.target.value }))}/></label>
                        </div>
                        <button className="admin-button primary" onClick={() => void saveSection()}><Plus size={15}/> افزودن بخش</button>
                      </div>

                      {tarahiProject?.sections.map(item => (
                        <TarahiSectionCard
                          key={item.id}
                          section={item}
                          colors={colors}
                          onChange={next => setTarahiProjects(all => all.map(project => project.id === tarahiProject.id ? { ...project, sections: project.sections.map(sectionItem => sectionItem.id === item.id ? { ...sectionItem, ...next } : sectionItem) } : project))}
                          onSave={() => void saveSection(item)}
                          onDelete={() => void deleteSection(item.id)}
                          onUpload={files => void uploadImages(files, { sectionId: item.id })}
                          onPatchImage={(imageId, patch) => patchImage(imageId, patch)}
                          onSaveImage={image => void saveImage(image)}
                          onDeleteImage={image => void deleteImage(image)}
                        />
                      ))}
                    </>
                  ) : (
                    <div className="admin-section-card">
                      <h3>تصاویر پروژه</h3>
                      <label className="admin-drop"><UploadCloud size={15}/> آپلود تصاویر<input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={e => void uploadImages(e.target.files)}/></label>
                      {!!selectedImages.length && <div className="admin-media-grid" style={{ marginTop: 10 }}>{selectedImages.map(image => (
                        <ImageEditor key={image.id} image={image} onPatch={patch => patchImage(image.id, patch)} onSave={() => void saveImage(image)} onDelete={() => void deleteImage(image)} />
                      ))}</div>}
                    </div>
                  )}
                </div>
              </section>
            </div>
          </>
        )}

        {tab === "regions" && (
          <section className="admin-card">
            <h2>مناطق نظارت</h2>
            <div className="admin-fields">
              <label className="admin-field">نام<input className="admin-input" value={regionForm.name} onChange={e => setRegionForm(f => ({ ...f, name: e.target.value }))}/></label>
              <label className="admin-field">شناسه<input dir="ltr" className="admin-input" value={regionForm.slug} onChange={e => setRegionForm(f => ({ ...f, slug: e.target.value }))}/></label>
              <label className="admin-field">ترتیب<input type="number" className="admin-input" value={regionForm.display_order} onChange={e => setRegionForm(f => ({ ...f, display_order: Number(e.target.value) }))}/></label>
            </div>
            <button className="admin-button primary" style={{ marginTop: 10 }} onClick={() => void saveRegion()}><Plus size={15}/> افزودن منطقه</button>
            <div className="admin-scroll" style={{ marginTop: 14 }}>
              <table className="admin-table"><thead><tr><th>نام</th><th>شناسه</th><th>ترتیب</th><th>فعال</th><th></th></tr></thead><tbody>
                {regions.map(item => <tr key={item.id}><td><input className="admin-input" value={item.name} onChange={e => setRegions(all => all.map(x => x.id === item.id ? { ...x, name: e.target.value } : x))}/></td><td><input dir="ltr" className="admin-input" value={item.slug} onChange={e => setRegions(all => all.map(x => x.id === item.id ? { ...x, slug: e.target.value } : x))}/></td><td><input type="number" className="admin-input" value={item.display_order} onChange={e => setRegions(all => all.map(x => x.id === item.id ? { ...x, display_order: Number(e.target.value) } : x))}/></td><td><input type="checkbox" checked={item.is_active} onChange={e => setRegions(all => all.map(x => x.id === item.id ? { ...x, is_active: e.target.checked } : x))}/></td><td><div className="admin-row"><button className="admin-button" onClick={() => void saveRegion(item)}><Save size={14}/></button><button className="admin-button danger" onClick={() => void deleteRegion(item.id)}><Trash2 size={14}/></button></div></td></tr>)}
              </tbody></table>
            </div>
          </section>
        )}

        {tab === "table" && (
          <div className="admin-grid">
            <aside className="admin-card">
              <button className="admin-button primary" style={{ width: "100%" }} onClick={() => setTableForm({ ...emptyTableRow })}><Plus size={15}/> ردیف جدید</button>
              <div className="admin-list" style={{ marginTop: 10 }}>{tableRows.map(item => <button key={item.id} className={`admin-project-item${tableForm.id === item.id ? " active" : ""}`} style={{ gridTemplateColumns: "1fr" }} onClick={() => setTableForm({ ...emptyTableRow, ...item, referral_date: item.referral_date || "" })}><span className="admin-item-title">{item.table_status === "live" ? "جاری" : "پایان‌یافته"} - {item.region || item.address || "بدون عنوان"}</span></button>)}</div>
            </aside>
            <section className="admin-card">
              <div className="admin-fields">
                <label className="admin-field">نوع<select className="admin-input" value={tableForm.table_status} onChange={e => setTableForm(f => ({ ...f, table_status: e.target.value }))}><option value="live">جاری</option><option value="ended">پایان‌یافته</option></select></label>
                {(["region", "metraj", "allowed_floors", "project_stage", "year"] as const).map(key => <label key={key} className="admin-field">{key}<input className="admin-input" value={tableForm[key]} onChange={e => setTableForm(f => ({ ...f, [key]: e.target.value }))}/></label>)}
                <label className="admin-field">تاریخ ارجاع<input type="date" className="admin-input" value={tableForm.referral_date} onChange={e => setTableForm(f => ({ ...f, referral_date: e.target.value }))}/></label>
                <label className="admin-field">ترتیب<input type="number" className="admin-input" value={tableForm.display_order} onChange={e => setTableForm(f => ({ ...f, display_order: Number(e.target.value) }))}/></label>
                <label className="admin-field full">آدرس<textarea className="admin-input" value={tableForm.address} onChange={e => setTableForm(f => ({ ...f, address: e.target.value }))}/></label>
                <label className="admin-field full">توضیحات<textarea className="admin-input" value={tableForm.description} onChange={e => setTableForm(f => ({ ...f, description: e.target.value }))}/></label>
              </div>
              <button className="admin-button primary" style={{ marginTop: 10 }} onClick={() => void saveTableRow()}><Save size={15}/> ذخیره ردیف</button>
            </section>
          </div>
        )}

        {tab === "pages" && (
          <section className="admin-card">
            <div className="admin-fields">
              <label className="admin-field">صفحه<select className="admin-input" value={pageKey} onChange={e => setPageKey(e.target.value)}>{pageKeys.map(key => <option key={key}>{key}</option>)}</select></label>
              <label className="admin-field span2">عنوان<input className="admin-input" value={pageForm.title} onChange={e => setPageForm(f => ({ ...f, title: e.target.value }))}/></label>
              <label className="admin-field full">JSON<textarea dir="ltr" className="admin-input" style={{ minHeight: 360, fontFamily: "monospace" }} value={pageForm.content} onChange={e => setPageForm(f => ({ ...f, content: e.target.value }))}/></label>
            </div>
            <button className="admin-button primary" style={{ marginTop: 10 }} onClick={() => void savePage()}><Save size={15}/> ذخیره صفحه</button>
          </section>
        )}

        {tab === "messages" && (
          <section className="admin-card admin-scroll">
            <table className="admin-table"><thead><tr><th>فرستنده</th><th>پیام</th><th>پاسخ</th><th>وضعیت</th><th></th></tr></thead><tbody>
              {messages.map(item => <tr key={item.id}><td>{item.name}<br/><span className="admin-help">{item.email}</span></td><td><strong>{item.subject}</strong><p>{item.message}</p></td><td><textarea className="admin-input" value={item.admin_reply || ""} onChange={e => setMessages(all => all.map(x => x.id === item.id ? { ...x, admin_reply: e.target.value } : x))}/></td><td><select className="admin-input" value={item.status} onChange={e => setMessages(all => all.map(x => x.id === item.id ? { ...x, status: e.target.value as ContactMessage["status"] } : x))}><option value="new">جدید</option><option value="reviewing">درحال بررسی</option><option value="answered">پاسخ داده شد</option><option value="closed">بسته</option></select></td><td><button className="admin-button" onClick={() => void saveMessage(item)}><Save size={14}/></button></td></tr>)}
            </tbody></table>
          </section>
        )}

        {tab === "users" && (
          <section className="admin-card admin-scroll">
            <table className="admin-table"><thead><tr><th>نام</th><th>ایمیل</th><th>نقش</th><th>فعال</th><th></th></tr></thead><tbody>
              {users.map(item => <tr key={item.id}><td>{item.full_name}</td><td dir="ltr">{item.email || item.phone || "—"}</td><td><select className="admin-input" value={item.role} onChange={e => setUsers(all => all.map(x => x.id === item.id ? { ...x, role: e.target.value as ApiUser["role"] } : x))}><option value="user">کاربر</option><option value="admin">مدیر</option></select></td><td><input type="checkbox" checked={item.is_active} onChange={e => setUsers(all => all.map(x => x.id === item.id ? { ...x, is_active: e.target.checked } : x))}/></td><td><button className="admin-button" onClick={() => void saveUser(item)}><Save size={14}/></button></td></tr>)}
            </tbody></table>
          </section>
        )}
      </main>
    </AppShell>
  );
}

function ImageEditor({ image, onPatch, onSave, onDelete }: {
  image: ProjectImage;
  onPatch: (patch: Partial<ProjectImage>) => void;
  onSave: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="admin-media">
      <img src={mediaUrl(image.file_url)} alt={image.alt_text || ""} />
      <input className="admin-input" style={{ marginTop: 8 }} placeholder="متن جایگزین" value={image.alt_text || ""} onChange={e => onPatch({ alt_text: e.target.value })}/>
      <input className="admin-input" style={{ marginTop: 7 }} placeholder="توضیح تصویر" value={image.caption || ""} onChange={e => onPatch({ caption: e.target.value })}/>
      <input type="number" className="admin-input" style={{ marginTop: 7 }} value={image.display_order} onChange={e => onPatch({ display_order: Number(e.target.value) })}/>
      <label className="admin-row" style={{ marginTop: 7 }}><input type="checkbox" checked={image.is_cover} onChange={e => onPatch({ is_cover: e.target.checked })}/> کاور</label>
      <div className="admin-row" style={{ marginTop: 8 }}>
        <button className="admin-button" onClick={onSave}><Save size={14}/></button>
        <button className="admin-button danger" onClick={onDelete}><Trash2 size={14}/></button>
      </div>
    </article>
  );
}

function TarahiSectionCard({ section, colors, onChange, onSave, onDelete, onUpload, onPatchImage, onSaveImage, onDeleteImage }: {
  section: TarahiProjectSection;
  colors: { border: string };
  onChange: (patch: Partial<TarahiProjectSection>) => void;
  onSave: () => void;
  onDelete: () => void;
  onUpload: (files: FileList | null) => void;
  onPatchImage: (imageId: string, patch: Partial<ProjectImage>) => void;
  onSaveImage: (image: ProjectImage) => void;
  onDeleteImage: (image: ProjectImage) => void;
}) {
  return (
    <section className="admin-section-card">
      <div className="admin-fields">
        <label className="admin-field">نام بخش<input className="admin-input" value={section.name} onChange={e => onChange({ name: e.target.value })}/></label>
        <label className="admin-field">شناسه<input dir="ltr" className="admin-input" value={section.slug} onChange={e => onChange({ slug: e.target.value })}/></label>
        <label className="admin-field">ترتیب<input type="number" className="admin-input" value={section.display_order} onChange={e => onChange({ display_order: Number(e.target.value) })}/></label>
        <label className="admin-field full">توضیح<textarea className="admin-input" value={section.description || ""} onChange={e => onChange({ description: e.target.value })}/></label>
      </div>
      <div className="admin-row" style={{ marginTop: 10 }}>
        <button className="admin-button" onClick={onSave}><Save size={14}/> ذخیره بخش</button>
        <label className="admin-drop"><ImagePlus size={14}/> آپلود تصاویر<input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={(e: ChangeEvent<HTMLInputElement>) => onUpload(e.target.files)}/></label>
        <button className="admin-button danger" onClick={onDelete}><Trash2 size={14}/> حذف بخش</button>
      </div>
      <div className="admin-media-grid" style={{ marginTop: 10, borderTop: section.images.length ? `1px solid ${colors.border}` : 0, paddingTop: section.images.length ? 10 : 0 }}>
        {sortImages(section.images).map(image => (
          <ImageEditor key={image.id} image={image} onPatch={patch => onPatchImage(image.id, patch)} onSave={() => onSaveImage(image)} onDelete={() => onDeleteImage(image)} />
        ))}
      </div>
    </section>
  );
}

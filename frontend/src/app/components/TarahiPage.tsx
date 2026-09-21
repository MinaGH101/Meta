import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AppShell } from "./AppShell";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import Masonry from "./ui/Masonry";
import { ResponsiveProjectModal } from "./ResponsiveProjectModal";
import { PageContent, TarahiProject, apiFetch, projectToView } from "../api";
import { useDark } from "../context";

interface Props {
  section: "tarrahi" | "nezarat" | "ejra";
}

interface ProjectSection {
  id: string;
  slug: string;
  name: string;
  description?: string;
  images: string[];
}

interface Project {
  id: string;
  title: string;
  location: string;
  area: string;
  year: string;
  description: string;
  images: string[];
  thumb: string;
  sections: ProjectSection[];
}

const ACCENT = "#BD3039";

export function TarahiPage({ section }: Props) {
  const { dark } = useDark();
  const [projects, setProjects] = useState<Project[]>([]);
  const [page, setPage] = useState<PageContent | null>(null);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [mobileProject, setMobileProject] = useState<Project | null>(null);
  const [activeSectionId, setActiveSectionId] = useState("");
  const [mobileSectionId, setMobileSectionId] = useState("");
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    let active = true;
    const loadProjects = () => {
      apiFetch<TarahiProject[]>("/tarahi/projects", { cache: "no-store" })
        .then(items => {
          if (!active) return;
          const next = items.map(projectToView) as Project[];
          setProjects(next);
          setSelectedProject(current => current ? next.find(item => item.id === current.id) || null : null);
          setMobileProject(current => current ? next.find(item => item.id === current.id) || null : null);
        })
        .catch(() => { if (active) setProjects([]); });
    };
    loadProjects();
    apiFetch<PageContent>("/page-content/tarrahi")
      .then(setPage)
      .catch(() => null)
      .finally(() => { if (active) setPageLoaded(true); });
    const timer = window.setInterval(loadProjects, 10000);
    window.addEventListener("focus", loadProjects);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener("focus", loadProjects);
    };
  }, []);

  const selectedSection = selectedProject?.sections.find(item => item.id === activeSectionId);
  const selectedImages = selectedSection ? selectedSection.images : selectedProject?.images ?? [];

  useEffect(() => {
    if (selectedProject && !selectedProject.sections.some(item => item.id === activeSectionId)) {
      setActiveSectionId(selectedProject.sections[0]?.id || "");
      setImageIndex(0);
    }
  }, [activeSectionId, selectedProject]);

  useEffect(() => {
    if (mobileProject && !mobileProject.sections.some(item => item.id === mobileSectionId)) {
      setMobileSectionId(mobileProject.sections[0]?.id || "");
      setImageIndex(0);
    }
  }, [mobileProject, mobileSectionId]);

  useEffect(() => {
    setImageIndex(index => Math.min(index, Math.max(selectedImages.length - 1, 0)));
  }, [selectedImages.length]);

  const masonryItems = useMemo(
    () => projects.filter(project => project.thumb).map((project, index) => ({
      id: `${section}-${project.id}`,
      img: project.thumb,
      url: `#${section}-${project.id}`,
      height: index % 3 === 0 ? 680 : index % 3 === 1 ? 500 : 600,
    })),
    [projects, section],
  );

  const bg = dark ? "#1a1919" : "#f0efef";
  const text = dark ? "#ffffff" : "#111111";
  const muted = dark ? "rgba(255,255,255,0.56)" : "rgba(0,0,0,0.56)";
  const border = dark ? "rgba(255,255,255,0.11)" : "rgba(0,0,0,0.11)";
  const intro = pageLoaded ? String(page?.content.intro || "") : "";

  const openProject = (project: Project) => {
    const firstSectionId = project.sections[0]?.id || "";
    setImageIndex(0);
    if (window.matchMedia("(max-width: 900px)").matches) {
      setMobileSectionId(firstSectionId);
      setMobileProject(project);
      return;
    }
    setActiveSectionId(firstSectionId);
    setSelectedProject(project);
  };

  return (
    <AppShell>
      <div className="tarahi-page flex flex-col flex-1" dir="rtl" style={{ fontFamily: "var(--app-font-family)", background: bg, color: text, minHeight: "calc(100dvh - 65px)" }}>
        <style>{`
          .tarahi-page { width: 100%; overflow-x: clip; overscroll-behavior-y: none; }
          .tarahi-layout { min-height: 0; direction: ltr; }
          .tarahi-detail { width: 42%; padding: 2rem; }
          .tarahi-gallery { width: 58%; padding: 2rem 1.5rem 2rem 2rem; }
          .tarahi-masonry { position: relative; width: 100%; min-height: calc(100vh - 210px); }
          .tarahi-masonry a { cursor: pointer; }
          .tarahi-section-tabs {
            display: flex; gap: .45rem; margin: 0 0 1rem; overflow-x: auto;
            padding-bottom: .35rem; scrollbar-width: none;
          }
          .tarahi-section-tabs::-webkit-scrollbar { display: none; }
          .tarahi-section-tab {
            flex: 0 0 auto; padding: .5rem .85rem; color: ${muted}; background: transparent;
            border: 1px solid ${border}; border-radius: 4px; cursor: pointer;
            font: 750 .76rem var(--app-font-family); transition: color .2s ease, background .2s ease;
          }
          .tarahi-section-tab:hover { color: ${text}; border-color: ${ACCENT}; }
          .tarahi-section-tab.active { color: #fff; background: ${ACCENT}; border-color: ${ACCENT}; }
          @media (max-width: 900px) {
            .tarahi-layout { flex: 0 0 auto !important; min-height: 0; overflow: visible !important; }
            .tarahi-detail { display: none !important; }
            .tarahi-gallery { width: 100% !important; overflow: visible !important; padding: 1.25rem 1rem 2rem !important; }
            .tarahi-masonry { min-height: 0; }
          }
          @media (max-width: 520px) {
            .tarahi-gallery { padding: 1rem .75rem 1.5rem !important; }
          }
        `}</style>

        <div className="tarahi-layout flex flex-1 overflow-hidden">
          <aside className="tarahi-detail flex flex-col overflow-y-auto" dir="rtl">
            {selectedProject ? (
              <>
                {!!selectedProject.sections.length && (
                  <nav className="tarahi-section-tabs" aria-label="بخش‌های طراحی پروژه">
                    {selectedProject.sections.map(item => (
                      <button
                        key={item.id}
                        type="button"
                        className={`tarahi-section-tab${item.id === activeSectionId ? " active" : ""}`}
                        onClick={() => {
                          setActiveSectionId(item.id);
                          setImageIndex(0);
                        }}
                      >
                        {item.name}
                      </button>
                    ))}
                  </nav>
                )}
                {!!selectedSection?.description && (
                  <p style={{ color: muted, fontSize: ".76rem", lineHeight: 1.8, margin: "-.35rem 0 .9rem" }}>
                    {selectedSection.description}
                  </p>
                )}

                <div className="relative overflow-hidden mb-4" style={{ borderRadius: 4, aspectRatio: "16/9", background: dark ? "#111" : "#ddd" }}>
                  {selectedImages.length > 0 && (
                    <ImageWithFallback src={selectedImages[imageIndex]} alt={selectedProject.title} className="w-full h-full object-contain" />
                  )}
                  {selectedImages.length > 1 && (
                    <>
                      <button type="button" onClick={() => setImageIndex(index => (index - 1 + selectedImages.length) % selectedImages.length)} className="absolute top-1/2 -translate-y-1/2" style={{ right: 10, width: 32, height: 32, background: "rgba(0,0,0,.48)", border: 0, borderRadius: "50%", color: "#fff", display: "grid", placeItems: "center", cursor: "pointer" }} aria-label="تصویر قبلی">
                        <ChevronRight size={16} />
                      </button>
                      <button type="button" onClick={() => setImageIndex(index => (index + 1) % selectedImages.length)} className="absolute top-1/2 -translate-y-1/2" style={{ left: 10, width: 32, height: 32, background: "rgba(0,0,0,.48)", border: 0, borderRadius: "50%", color: "#fff", display: "grid", placeItems: "center", cursor: "pointer" }} aria-label="تصویر بعدی">
                        <ChevronLeft size={16} />
                      </button>
                    </>
                  )}
                </div>

                {selectedImages.length > 1 && (
                  <div className="flex gap-2 mb-5" style={{ overflowX: "auto", paddingBottom: 4 }}>
                    {selectedImages.map((image, index) => (
                      <button key={`${image}-${index}`} type="button" onClick={() => setImageIndex(index)} style={{ flex: "0 0 auto", width: 64, height: 42, borderRadius: 3, overflow: "hidden", border: index === imageIndex ? `2px solid ${ACCENT}` : `1px solid ${border}`, padding: 0, background: "none", cursor: "pointer" }}>
                        <ImageWithFallback src={image} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  <h3 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0 }}>{selectedProject.title}</h3>
                  <div className="flex flex-wrap gap-5">
                    {[
                      { label: "موقعیت", value: selectedProject.location },
                      { label: "مساحت", value: selectedProject.area },
                      { label: "سال", value: selectedProject.year },
                    ].map(item => (
                      <div key={item.label}>
                        <p style={{ fontSize: ".68rem", color: muted, margin: "0 0 2px" }}>{item.label}</p>
                        <p style={{ fontSize: ".85rem", fontWeight: 500, margin: 0 }}>{item.value}</p>
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize: ".82rem", color: muted, lineHeight: 1.9, margin: 0 }}>{selectedProject.description}</p>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3" style={{ color: muted }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", border: `1px solid ${border}`, display: "grid", placeItems: "center" }}>
                  <span style={{ fontSize: 22 }}>⌗</span>
                </div>
                <p style={{ fontSize: ".82rem", margin: 0 }}>یک پروژه از گالری انتخاب کنید</p>
              </div>
            )}
          </aside>

          <main className="tarahi-gallery flex flex-col overflow-y-auto" dir="rtl">
            <div className="flex items-center gap-3 mb-4">
              <span style={{ width: 3, height: 30, background: ACCENT, borderRadius: 2 }} />
              <h1 style={{ fontSize: "clamp(1.4rem, 2.5vw, 1.9rem)", fontWeight: 700, margin: 0 }}>
                {pageLoaded ? page?.title || "پروژه‌های طراحی" : "\u00a0"}
              </h1>
            </div>
            {intro && (
              <p style={{ color: muted, fontSize: ".8rem", lineHeight: 2, margin: "0 0 1.5rem" }}>{intro}</p>
            )}
            {masonryItems.length > 0 ? (
              <div className="tarahi-masonry" style={{ marginTop: ".25rem" }}>
                <Masonry
                  key={section}
                  items={masonryItems}
                  ease="power1.out"
                  duration={1}
                  stagger={0.1}
                  animateFrom="right"
                  scaleOnHover
                  hoverScale={0.95}
                  blurToFocus
                  colorShiftOnHover
                  onItemClick={item => {
                    const project = projects.find(projectItem => item.id === `${section}-${projectItem.id}`);
                    if (project) openProject(project);
                  }}
                />
              </div>
            ) : (
              <p style={{ color: muted, fontSize: ".82rem" }}>پروژه‌ای برای این بخش ثبت نشده است.</p>
            )}
          </main>
        </div>
      </div>

      <ResponsiveProjectModal
        project={mobileProject}
        imageIndex={imageIndex}
        onImageIndexChange={setImageIndex}
        onClose={() => setMobileProject(null)}
        activeSectionId={mobileSectionId}
        onSectionChange={sectionId => {
          setMobileSectionId(sectionId);
          setImageIndex(0);
        }}
        dark={dark}
      />
    </AppShell>
  );
}

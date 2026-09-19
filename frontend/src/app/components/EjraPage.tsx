import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useDark } from "../context";
import { AppShell } from "./AppShell";
import Masonry from "./ui/Masonry";
import { ResponsiveProjectModal } from "./ResponsiveProjectModal";
import { EjraProject, PageContent, apiFetch, projectToView } from "../api";


interface Props {
  section: "tarrahi" | "nezarat" | "ejra";
}

interface Project {
  id: number | string;
  title: string;
  location: string;
  area: string;
  year: string;
  description: string;
  images: string[];
  thumb: string;
}

const SECTION_CONTENT: Record<
  Props["section"],
  { title: string; description: string }
> = {
  tarrahi: {
    title: "پروژه‌های طراحی",
    description:
      "در فرآیند طراحی، هر پروژه از شناخت دقیق نیازهای کارفرما، ویژگی‌های زمین، شرایط اقلیمی و ضوابط اجرایی آغاز می‌شود. هدف ما ایجاد فضایی است که علاوه بر کیفیت بصری، از نظر عملکرد، آسایش، دوام و امکان اجرا نیز پاسخ‌گو باشد. در این مسیر، پلان، نما، طراحی داخلی، محوطه و جزئیات فنی به‌صورت یکپارچه بررسی می‌شوند تا نتیجه نهایی هویتی منسجم و متناسب با بستر پروژه داشته باشد. مجموعه زیر بخشی از پروژه‌های طراحی‌شده در مقیاس‌ها و کاربری‌های مختلف را نمایش می‌دهد.",
  },
  nezarat: {
    title: "پروژه‌های نظارت",
    description:
      "نظارت مؤثر، حلقه اتصال میان طرح و اجرای صحیح پروژه است. خدمات نظارت ما با تمرکز بر کنترل کیفیت، انطباق عملیات اجرایی با نقشه‌ها و مشخصات فنی، بررسی مصالح، هماهنگی عوامل اجرایی و پایش مستمر پیشرفت پروژه انجام می‌شود. هدف این فرآیند، کاهش خطاهای اجرایی، جلوگیری از دوباره‌کاری و حفظ کیفیت نهایی بنا در تمام مراحل ساخت است. مجموعه زیر بخشی از پروژه‌هایی را نشان می‌دهد که در مراحل مختلف تحت نظارت تخصصی قرار گرفته‌اند.",
  },
  ejra: {
    title: "پروژه‌های اجرا",
    description:
      "اجرای پروژه، مرحله تبدیل ایده و نقشه به یک فضای واقعی، ایمن و ماندگار است. رویکرد ما در اجرا بر برنامه‌ریزی دقیق، مدیریت هماهنگ نیروها و پیمانکاران، کنترل کیفیت مصالح، رعایت جزئیات فنی و پایش زمان و هزینه استوار است. تمامی مراحل، از تجهیز کارگاه و عملیات سازه تا تکمیل نما، محوطه و فضاهای داخلی، با هدف دستیابی به کیفیتی یکپارچه و قابل اتکا مدیریت می‌شوند. گالری زیر نمونه‌ای از پروژه‌های اجرایی مجموعه در کاربری‌ها و مقیاس‌های مختلف است.",
  },
};

const ACCENT = "#BD3039";

export function EjraPage({ section }: Props) {
  const { dark } = useDark();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [mobilePopupProject, setMobilePopupProject] = useState<Project | null>(
    null,
  );
  const [imgIndex, setImgIndex] = useState(0);
  const [projects, setProjects] = useState<Project[]>([]);
  const [page, setPage] = useState<PageContent | null>(null);

  useEffect(() => {
    let active = true;

    const loadProjects = () => {
      apiFetch<EjraProject[]>("/ejra/projects", { cache: "no-store" })
        .then(items => {
          if (!active) return;
          const nextProjects = items.map(projectToView);
          setProjects(nextProjects);
          setSelectedProject(current => current ? nextProjects.find(item => item.id === current.id) || null : null);
          setMobilePopupProject(current => current ? nextProjects.find(item => item.id === current.id) || null : null);
        })
        .catch(() => { if (active) setProjects([]); });
    };

    loadProjects();
    apiFetch<PageContent>("/page-content/ejra").then(setPage).catch(() => null);
    const timer = window.setInterval(loadProjects, 10000);
    window.addEventListener("focus", loadProjects);
    return () => { active = false; window.clearInterval(timer); window.removeEventListener("focus", loadProjects); };
  }, []);

  useEffect(() => {
    const imageCount = selectedProject?.images.length || mobilePopupProject?.images.length || 1;
    setImgIndex(index => Math.min(index, Math.max(imageCount - 1, 0)));
  }, [selectedProject?.images.length, mobilePopupProject?.images.length]);
  const defaultSectionContent = SECTION_CONTENT[section];
  const sectionContent = {
    title: page?.title || defaultSectionContent.title,
    description: String(page?.content.intro || defaultSectionContent.description),
  };
  const masonryItems = useMemo(
    () =>
      projects.map((project, index) => ({
        id: `${section}-${index}-${project.id}`,
        img: project.thumb,
        url: `#${section}-${index}-${project.id}`,
        height: index % 3 === 0 ? 680 : index % 3 === 1 ? 500 : 600,
      })),
    [projects, section],
  );

  const bg = dark ? "#1a1919" : "#f0efef";
  const text = dark ? "#ffffff" : "#111111";
  const muted = dark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.55)";
  const border = dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)";

  const handleProjectSelect = (project: Project) => {
    setImgIndex(0);

    if (window.matchMedia("(max-width: 900px)").matches) {
      setMobilePopupProject(project);
      return;
    }

    setSelectedProject(project);
  };

  return (
    <AppShell>
      <div
        className="flex flex-col flex-1"
        dir="rtl"
        style={{
          fontFamily: "var(--app-font-family)",
          background: bg,
          color: text,
          minHeight: "calc(100vh - 65px)",
        }}
      >
        <style>{`
          .projects-masonry-wrap {
            position: relative;
            width: 100%;
          }

          .projects-masonry-wrap a {
            cursor: pointer;
          }


          @media (max-width: 900px) {
            .section-mobile-stack {
              flex-direction: column !important;
              overflow-y: auto !important;
              overflow-x: hidden !important;
              min-height: auto !important;
            }

            .section-mobile-gallery-column {
              order: 1 !important;
              width: 100% !important;
              max-width: 100% !important;
              border-left: none !important;
              overflow: visible !important;
              padding: 1.25rem 1rem 1rem !important;
            }

            .section-mobile-detail-panel {
              display: none !important;
              order: 2 !important;
              width: 100% !important;
              max-width: 100% !important;
              overflow: visible !important;
              padding: 1rem 1rem 2rem !important;
            }
          }

          @media (max-width: 520px) {
            .section-mobile-gallery-column {
              padding: 1rem 0.75rem 0.75rem !important;
            }

            .section-mobile-detail-panel {
              padding: 0.85rem 0.75rem 1.5rem !important;
            }
          }

        `}</style>
        {/* Main split: detail left, masonry/projects right */}
        <div
          className="section-mobile-stack flex flex-1 overflow-hidden"
          style={{ minHeight: 0, direction: "ltr" }}
        >
          {/* Left panel: project detail */}
          <div
            className="section-mobile-detail-panel flex flex-col overflow-y-auto"
            dir="rtl"
            style={{ width: "42%", padding: "2rem", border: "none" }}
          >
            {selectedProject ? (
              <>
                <div
                  className="relative overflow-hidden mb-4"
                  style={{
                    borderRadius: 4,
                    aspectRatio: "16/9",
                    background: dark ? "#111" : "#ddd",
                  }}
                >
                  <ImageWithFallback
                    src={selectedProject.images[imgIndex]}
                    alt={selectedProject.title}
                    className="w-full h-full object-contain"
                  />
                  {selectedProject.images.length > 1 && (
                    <>
                      <button
                        onClick={() =>
                          setImgIndex(
                            (i) =>
                              (i - 1 + selectedProject.images.length) %
                              selectedProject.images.length,
                          )
                        }
                        className="absolute top-1/2 -translate-y-1/2"
                        style={{
                          right: 10,
                          width: 32,
                          height: 32,
                          background: "rgba(0,0,0,0.45)",
                          border: "none",
                          borderRadius: "50%",
                          color: "#fff",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <ChevronRight size={16} />
                      </button>
                      <button
                        onClick={() =>
                          setImgIndex(
                            (i) => (i + 1) % selectedProject.images.length,
                          )
                        }
                        className="absolute top-1/2 -translate-y-1/2"
                        style={{
                          left: 10,
                          width: 32,
                          height: 32,
                          background: "rgba(0,0,0,0.45)",
                          border: "none",
                          borderRadius: "50%",
                          color: "#fff",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                        {selectedProject.images.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setImgIndex(i)}
                            style={{
                              width: i === imgIndex ? 18 : 6,
                              height: 6,
                              borderRadius: 3,
                              background:
                                i === imgIndex
                                  ? "#fff"
                                  : "rgba(255,255,255,0.4)",
                              border: "none",
                              padding: 0,
                              cursor: "pointer",
                              transition: "width 0.2s",
                            }}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {selectedProject.images.length > 1 && (
                  <div className="flex gap-2 mb-5">
                    {selectedProject.images.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setImgIndex(i)}
                        style={{
                          width: 64,
                          height: 42,
                          borderRadius: 3,
                          overflow: "hidden",
                          border:
                            i === imgIndex
                              ? `2px solid ${ACCENT}`
                              : `1px solid ${border}`,
                          padding: 0,
                          background: "none",
                          cursor: "pointer",
                        }}
                      >
                        <ImageWithFallback
                          src={img}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  <h3
                    style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0 }}
                  >
                    {selectedProject.title}
                  </h3>
                  <div className="flex flex-wrap gap-5">
                    {[
                      { label: "موقعیت", value: selectedProject.location },
                      { label: "مساحت", value: selectedProject.area },
                      { label: "سال", value: selectedProject.year },
                    ].map((item) => (
                      <div key={item.label}>
                        <p
                          style={{
                            fontSize: "0.68rem",
                            color: muted,
                            margin: "0 0 2px 0",
                          }}
                        >
                          {item.label}
                        </p>
                        <p
                          style={{
                            fontSize: "0.85rem",
                            fontWeight: 500,
                            margin: 0,
                          }}
                        >
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                  <p
                    style={{
                      fontSize: "0.82rem",
                      color: muted,
                      lineHeight: 1.9,
                      margin: 0,
                    }}
                  >
                    {selectedProject.description}
                  </p>
                </div>
              </>
            ) : (
              <div
                className="flex flex-col items-center justify-center h-full gap-3"
                style={{ color: muted }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    border: `1px solid ${border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <rect
                      x="3"
                      y="3"
                      width="8"
                      height="8"
                      rx="1"
                      stroke="currentColor"
                      strokeWidth="1.2"
                    />
                    <rect
                      x="13"
                      y="3"
                      width="8"
                      height="8"
                      rx="1"
                      stroke="currentColor"
                      strokeWidth="1.2"
                    />
                    <rect
                      x="3"
                      y="13"
                      width="8"
                      height="8"
                      rx="1"
                      stroke="currentColor"
                      strokeWidth="1.2"
                    />
                    <rect
                      x="13"
                      y="13"
                      width="8"
                      height="8"
                      rx="1"
                      stroke="currentColor"
                      strokeWidth="1.2"
                    />
                  </svg>
                </div>
                <p style={{ fontSize: "0.82rem", margin: 0 }}>
                  یک پروژه از گالری انتخاب کنید
                </p>
              </div>
            )}
          </div>

          {/* Right panel: projects masonry gallery */}
          <div
            className="section-mobile-gallery-column flex flex-col overflow-y-auto"
            dir="rtl"
            style={{
              width: "58%",
              border: "none",
              padding: "2rem 1.5rem 2rem 2rem",
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                style={{
                  width: 3,
                  height: 30,
                  background: ACCENT,
                  borderRadius: 2,
                }}
              />
              <h2
                style={{
                  fontSize: "clamp(1.4rem, 2.5vw, 1.9rem)",
                  fontWeight: 700,
                  margin: 0,
                }}
              >
                {sectionContent.title}
              </h2>
            </div>

            <p
              className="mb-6"
              style={{
                color: muted,
                fontSize: "0.8rem",
                lineHeight: 2,
                margin: "0 0 1.5rem 0",
              }}
            >
              {sectionContent.description}
            </p>

            {projects.length > 0 ? (
              <div
                className="section-mobile-gallery-panel projects-masonry-wrap"
                style={{
                  marginTop: "0.25rem",
                  minHeight: "calc(100vh - 210px)",
                }}
              >
                <Masonry
                  key={section}
                  items={masonryItems}
                  ease="power1.out"
                  duration={1.0}
                  stagger={0.1}
                  animateFrom="right"
                  scaleOnHover
                  hoverScale={0.95}
                  blurToFocus
                  colorShiftOnHover
                  onItemClick={(item) => {
                    const project = projects.find(
                      (projectItem, index) =>
                        item.id === `${section}-${index}-${projectItem.id}`,
                    );
                    if (project) handleProjectSelect(project);
                  }}
                />
              </div>
            ) : (
              <p style={{ color: muted, fontSize: "0.82rem" }}>
                پروژه‌ای برای این بخش ثبت نشده است.
              </p>
            )}
          </div>
        </div>
      </div>

      <ResponsiveProjectModal
        project={mobilePopupProject}
        imageIndex={imgIndex}
        onImageIndexChange={setImgIndex}
        onClose={() => setMobilePopupProject(null)}
        dark={dark}
      />
    </AppShell>
  );
}

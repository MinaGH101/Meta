import { useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface ProjectSection {
  id: string;
  name: string;
  description?: string;
  images: string[];
}

interface ModalProject {
  title: string;
  location: string;
  area: string;
  year: string;
  description: string;
  images: string[];
  sections?: ProjectSection[];
}

interface Props {
  project: ModalProject | null;
  imageIndex: number;
  onImageIndexChange: (index: number) => void;
  onClose: () => void;
  activeSectionId?: string;
  onSectionChange?: (sectionId: string) => void;
  dark: boolean;
}

const ACCENT = "#BD3039";

export function ResponsiveProjectModal({
  project,
  imageIndex,
  onImageIndexChange,
  onClose,
  activeSectionId,
  onSectionChange,
  dark,
}: Props) {
  const activeSection = project?.sections?.find(item => item.id === activeSectionId);
  const images = activeSection ? activeSection.images : project?.images ?? [];
  const currentIndex = Math.min(imageIndex, Math.max(images.length - 1, 0));

  useEffect(() => {
    if (!project) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (images.length < 2) return;
      if (event.key === "ArrowLeft") onImageIndexChange((currentIndex + 1) % images.length);
      if (event.key === "ArrowRight") onImageIndexChange((currentIndex - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentIndex, images.length, onClose, onImageIndexChange, project]);

  if (!project) return null;

  const bg = dark ? "#1a1919" : "#f0efef";
  const text = dark ? "#ffffff" : "#111111";
  const muted = dark ? "rgba(255,255,255,0.58)" : "rgba(0,0,0,0.56)";
  const border = dark ? "rgba(255,255,255,0.11)" : "rgba(0,0,0,0.11)";

  return (
    <div className="responsive-project-modal" role="dialog" aria-modal="true" aria-label={project.title}>
      <style>{`
        .responsive-project-modal { display: none; }
        @media (max-width: 900px) {
          .responsive-project-modal {
            position: fixed; inset: 0; z-index: 120; display: grid;
            background: rgba(4,4,4,.86); backdrop-filter: blur(14px);
          }
          .responsive-project-modal-card {
            width: 100%; height: 100dvh; overflow: hidden; display: grid;
            grid-template-rows: minmax(280px, 58dvh) minmax(0, 1fr);
            color: ${text}; background: ${bg};
          }
          .responsive-project-modal-image { position: relative; min-height: 0; overflow: hidden; display: grid; place-items: center; background: #0c0c0c; }
          .responsive-project-modal-image img { width: auto; height: auto; max-width: 100%; max-height: 100%; object-fit: contain; }
          .responsive-project-modal-info { min-height: 0; overflow-y: auto; padding: 1rem 1.15rem 1.5rem; }
          .responsive-project-modal-info h3 { margin: 0; font-size: 1.18rem; font-weight: 800; }
          .responsive-project-modal-description { margin: .75rem 0 1rem; color: ${muted}; font-size: .76rem; line-height: 1.9; }
          .responsive-project-modal-meta { display: grid; gap: .55rem; }
          .responsive-project-modal-meta-row {
            display: grid; grid-template-columns: 72px 1fr; gap: .5rem;
            padding-bottom: .55rem; border-bottom: 1px solid ${border};
          }
          .responsive-project-modal-meta-label { color: ${muted}; font-size: .7rem; }
          .responsive-project-modal-meta-value { font-size: .79rem; font-weight: 700; }
          .responsive-project-modal-close, .responsive-project-modal-nav {
            position: absolute; z-index: 3; display: grid; place-items: center;
            color: #fff; background: rgba(0,0,0,.55); border: 0; border-radius: 50%; cursor: pointer;
          }
          .responsive-project-modal-close { top: .85rem; left: .85rem; width: 38px; height: 38px; }
          .responsive-project-modal-nav { top: 50%; width: 40px; height: 40px; transform: translateY(-50%); }
          .responsive-project-modal-nav.right { right: .85rem; }
          .responsive-project-modal-nav.left { left: .85rem; }
          .responsive-project-modal-sections {
            display: flex; gap: .45rem; overflow-x: auto; margin: 0 0 .9rem;
            padding: 0 0 .4rem; scrollbar-width: none;
          }
          .responsive-project-modal-sections::-webkit-scrollbar { display: none; }
          .responsive-project-modal-section {
            flex: 0 0 auto; padding: .48rem .8rem; color: ${muted}; background: transparent;
            border: 1px solid ${border}; border-radius: 4px; font: 700 .74rem var(--app-font-family); cursor: pointer;
          }
          .responsive-project-modal-section.active { color: #fff; background: ${ACCENT}; border-color: ${ACCENT}; }
        }
        @media (max-width: 520px) {
          .responsive-project-modal-card { grid-template-rows: minmax(240px, 54dvh) minmax(0, 1fr); }
        }
      `}</style>

      <div className="responsive-project-modal-card" dir="rtl">
        <div className="responsive-project-modal-image">
          {images.length > 0 && (
            <ImageWithFallback src={images[currentIndex]} alt={project.title} className="w-full h-full" />
          )}
          <button type="button" className="responsive-project-modal-close" onClick={onClose} aria-label="بستن">
            <X size={18} />
          </button>
          {images.length > 1 && (
            <>
              <button type="button" className="responsive-project-modal-nav right" onClick={() => onImageIndexChange((currentIndex - 1 + images.length) % images.length)} aria-label="تصویر قبلی">
                <ChevronRight size={19} />
              </button>
              <button type="button" className="responsive-project-modal-nav left" onClick={() => onImageIndexChange((currentIndex + 1) % images.length)} aria-label="تصویر بعدی">
                <ChevronLeft size={19} />
              </button>
            </>
          )}
        </div>

        <div className="responsive-project-modal-info">
          <h3>{project.title}</h3>
          {!!project.sections?.length && (
            <div className="responsive-project-modal-sections" style={{ marginTop: ".8rem" }}>
              {project.sections.map(section => (
                <button
                  key={section.id}
                  type="button"
                  className={`responsive-project-modal-section${section.id === activeSectionId ? " active" : ""}`}
                  onClick={() => onSectionChange?.(section.id)}
                >
                  {section.name}
                </button>
              ))}
            </div>
          )}
          {!!activeSection?.description && (
            <p className="responsive-project-modal-description" style={{ marginTop: 0 }}>
              {activeSection.description}
            </p>
          )}
          <p className="responsive-project-modal-description">{project.description}</p>
          <div className="responsive-project-modal-meta">
            {[
              { label: "موقعیت", value: project.location },
              { label: "مساحت", value: project.area },
              { label: "سال", value: project.year },
            ].map(item => (
              <div key={item.label} className="responsive-project-modal-meta-row">
                <span className="responsive-project-modal-meta-label">{item.label}</span>
                <strong className="responsive-project-modal-meta-value">{item.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

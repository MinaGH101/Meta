import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Images,
  Layers3,
  LoaderCircle,
  MapPin,
  Ruler,
  TableProperties,
  X,
} from "lucide-react";
import { AppShell } from "./AppShell";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import Masonry from "./ui/Masonry";
import { TehranRegionsMap, type TehranMapAreaId } from "./TehranRegionsMap";
import { useDark } from "../context";
import { ExcelCell, NezaratProject, NezaratWorkbook, PageContent, apiFetch, projectToView } from "../api";


interface Props {
  section: "tarrahi" | "nezarat" | "ejra";
}

interface ProjectSheet {
  sheetName: string;
  columns: string[];
  rows: ExcelCell[][];
}

interface RegionAlbumItem {
  id: string;
  img: string;
  images: string[];
  url: string;
  height: number;
  title: string;
  location: string;
  orientation: string;
  area: string;
  year: string;
  description: string;
}

const ACCENT = "#BD3039";

const SECTION_LABELS: Record<Props["section"], string> = {
  tarrahi: "طراحی",
  nezarat: "نظارت",
  ejra: "اجرا",
};

const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

const toPersianNumber = (value: number | string) =>
  String(value).replace(/\d/g, digit => PERSIAN_DIGITS[Number(digit)]);

const getAreaName = (areaId: TehranMapAreaId) => {
  if (areaId === "karaj") return "سایر مناطق تهران";
  if (areaId === "lavasan") return "لواسان";
  if (areaId === "shemshak") return "شمشک";
  return `منطقه ${toPersianNumber(areaId)}`;
};

const formatCellValue = (value: ExcelCell) => {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "بله" : "خیر";
  return String(value);
};



export function NezaratPage({ section }: Props) {
  const { dark } = useDark();
  const mapRef = useRef<HTMLElement | null>(null);
  const albumRef = useRef<HTMLElement | null>(null);
  const tableRef = useRef<HTMLElement | null>(null);

  const [activeSheetIndex, setActiveSheetIndex] = useState(0);
  const [page, setPage] = useState<PageContent | null>(null);
  const [projectSheets, setProjectSheets] = useState<ProjectSheet[]>([]);
  const [excelLoading, setExcelLoading] = useState(true);
  const [excelError, setExcelError] = useState<string | null>(null);

  const [activeAreaId, setActiveAreaId] = useState<TehranMapAreaId | null>(null);
  const [selectedAlbumItem, setSelectedAlbumItem] =
    useState<RegionAlbumItem | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const activeSheet = projectSheets[activeSheetIndex] ?? null;

  const [activeRegionAlbum, setActiveRegionAlbum] = useState<RegionAlbumItem[]>([]);

  const selectedRegionImages = selectedAlbumItem?.images ?? [];

  const bg = dark ? "#1a1919" : "#f0efef";
  const surface = dark ? "#211f1f" : "#ffffff";
  const surfaceSoft = dark ? "#282525" : "#e9e7e7";
  const text = dark ? "#ffffff" : "#111111";
  const muted = dark ? "rgba(255,255,255,0.56)" : "rgba(0,0,0,0.56)";
  const border = dark ? "rgba(255,255,255,0.11)" : "rgba(0,0,0,0.11)";
  const hover = dark ? "rgba(189,48,57,0.07)" : "rgba(189,48,57,0.045)";

  useEffect(() => {
    let active = true;

    const loadTable = () => {
      setExcelLoading(true);
      Promise.all([
        apiFetch<NezaratWorkbook>("/nezarat/table-workbook", { cache: "no-store" }),
        apiFetch<PageContent>("/page-content/nezarat", { cache: "no-store" }).catch(() => null),
      ])
        .then(([workbook, pageContent]) => {
          if (!active) return;
          const nextSheets = (workbook.sheets || [])
            .filter(sheet => sheet.name.trim().toLocaleLowerCase() !== "table")
            .map(sheet => ({
              sheetName: sheet.name,
              columns: sheet.columns,
              rows: sheet.rows,
            }));
          setProjectSheets(nextSheets);
          setActiveSheetIndex(index => Math.min(index, Math.max(nextSheets.length - 1, 0)));
          setPage(pageContent);
          setExcelError(null);
        })
        .catch(error => {
          if (active) setExcelError(error instanceof Error ? error.message : "خطا در دریافت جدول پروژه‌ها");
        })
        .finally(() => { if (active) setExcelLoading(false); });
    };

    loadTable();
    const timer = window.setInterval(loadTable, 10000);
    window.addEventListener("focus", loadTable);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener("focus", loadTable);
    };
  }, []);


  useEffect(() => {
    if (activeAreaId === null) { setActiveRegionAlbum([]); return; }
    let active = true;

    const loadAlbum = () => {
      apiFetch<NezaratProject[]>(`/nezarat/projects?region=${encodeURIComponent(String(activeAreaId))}`, { cache: "no-store" })
        .then(items => {
          if (!active) return;
          const nextAlbum = items.map((item, index) => {
            const view = projectToView(item);
            return {
              id: item.id,
              img: view.thumb,
              images: view.images,
              url: `#${item.slug}`,
              height: index % 3 === 0 ? 650 : index % 3 === 1 ? 490 : 570,
              title: item.name,
              location: item.location || "—",
              orientation: item.orientation || "—",
              area: item.metraj || "—",
              year: item.year || "—",
              description: item.description,
            };
          }).filter(item => item.images.length > 0);
          setActiveRegionAlbum(nextAlbum);
          setSelectedAlbumItem(current => current ? nextAlbum.find(item => item.id === current.id) || null : null);
        })
        .catch(() => { if (active) setActiveRegionAlbum([]); });
    };

    loadAlbum();
    const timer = window.setInterval(loadAlbum, 10000);
    window.addEventListener("focus", loadAlbum);
    return () => { active = false; window.clearInterval(timer); window.removeEventListener("focus", loadAlbum); };
  }, [activeAreaId]);

  useEffect(() => {
    setSelectedImageIndex(index => Math.min(index, Math.max(selectedRegionImages.length - 1, 0)));
  }, [selectedRegionImages.length]);

  useEffect(() => {
    if (!selectedAlbumItem) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedAlbumItem(null);
        return;
      }

      if (selectedRegionImages.length < 2) return;

      if (event.key === "ArrowLeft") {
        setSelectedImageIndex(
          index => (index + 1) % selectedRegionImages.length,
        );
      }

      if (event.key === "ArrowRight") {
        setSelectedImageIndex(
          index =>
            (index - 1 + selectedRegionImages.length) %
            selectedRegionImages.length,
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedAlbumItem, selectedRegionImages.length]);

  const scrollToElement = (element: HTMLElement | null) => {
    if (!element) return;

    const topBarHeight = 65;
    const breathingRoom = 16;
    const targetTop =
      element.getBoundingClientRect().top +
      window.scrollY -
      topBarHeight -
      breathingRoom;

    window.scrollTo({
      top: Math.max(targetTop, 0),
      behavior: "smooth",
    });
  };

  const selectArea = (areaId: TehranMapAreaId) => {
    const selectingSameArea = activeAreaId === areaId;

    setActiveAreaId(areaId);
    setSelectedAlbumItem(null);
    setSelectedImageIndex(0);

    if (selectingSameArea) {
      window.requestAnimationFrame(() => {
        const albumElement =
          albumRef.current ??
          document.getElementById("region-projects-album");
        scrollToElement(albumElement);
      });
    }
  };

  useEffect(() => {
    if (activeAreaId === null) return;

    const timeoutId = window.setTimeout(() => {
      const albumElement =
        albumRef.current ??
        document.getElementById("region-projects-album");

      if (albumElement) {
        scrollToElement(albumElement);
      }
    }, 40);

    return () => window.clearTimeout(timeoutId);
  }, [activeAreaId]);

  const closeAreaAlbum = () => {
    setActiveAreaId(null);
    setSelectedAlbumItem(null);
    setSelectedImageIndex(0);
    window.requestAnimationFrame(() => scrollToElement(mapRef.current));
  };

  const openAlbumItem = (item: RegionAlbumItem) => {
    setSelectedImageIndex(0);
    setSelectedAlbumItem(item);
  };

  const showPreviousImage = () => {
    if (selectedRegionImages.length < 2) return;

    setSelectedImageIndex(
      index =>
        (index - 1 + selectedRegionImages.length) % selectedRegionImages.length,
    );
  };

  const showNextImage = () => {
    if (selectedRegionImages.length < 2) return;

    setSelectedImageIndex(index => (index + 1) % selectedRegionImages.length);
  };

  return (
    <AppShell>
      <main
        dir="rtl"
        style={{
          minHeight: "100vh",
          background: `
            radial-gradient(circle at 18% 12%, ${dark ? "rgba(189,48,57,0.105)" : "rgba(189,48,57,0.07)"} 0, transparent 30%),
            radial-gradient(circle at 82% 58%, ${dark ? "rgba(189,48,57,0.065)" : "rgba(189,48,57,0.045)"} 0, transparent 34%),
            ${bg}
          `,
          color: text,
          fontFamily: "var(--app-font-family)",
        }}
      >
        <style>{`
          html {
            scroll-behavior: smooth;
          }

          .nezarat-page-section {
            width: min(1320px, calc(100% - 3rem));
            margin: 0 auto;
          }

          .projects-overview {
            height: calc(100vh - 65px - 280px);
            min-height: 430px;
            display: flex;
            align-items: stretch;
            justify-content: center;
            padding: 0.85rem 0 0.45rem;
            position: relative;
            overflow: hidden;
            box-sizing: border-box;
          }

          .projects-overview::before {
            content: "";
            position: absolute;
            inset: 0;
            pointer-events: none;
            background: transparent;
          }

          .projects-overview-inner {
            position: relative;
            z-index: 1;
            width: min(1180px, calc(100% - 3rem));
            height: 100%;
            min-height: 0;
            display: flex;
            flex-direction: column;
          }

          .section-heading {
            display: flex;
            justify-content: space-between;
            align-items: end;
            gap: 1rem;
            margin-bottom: 0.7rem;
          }

          .section-kicker {
            margin: 0 0 0.45rem;
            color: ${ACCENT};
            font-size: 0.72rem;
            font-weight: 800;
          }

          .section-title {
            margin: 0;
            font-size: clamp(1.3rem, 2.6vw, 2rem);
            font-weight: 850;
            letter-spacing: -0.04em;
          }

          .section-description {
            max-width: 680px;
            margin: 0.35rem 0 0;
            color: ${muted};
            font-size: 0.72rem;
            line-height: 1.7;
          }

          .projects-table-card {
            flex: 1;
            min-height: 0;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            background: ${surface};
            border: 1px solid ${border};
            border-radius: 4px;
          }

          .projects-tabs {
            display: flex;
            align-items: center;
            gap: 0.3rem;
            padding: 0.42rem;
            background: ${surfaceSoft};
            border-bottom: 1px solid ${border};
          }

          .projects-tab {
            position: relative;
            min-width: 135px;
            padding: 0.52rem 0.8rem;
            color: ${muted};
            background: transparent;
            border: none;
            border-radius: 3px;
            cursor: pointer;
            font-family: inherit;
            font-size: 0.74rem;
            font-weight: 800;
            transition:
              color 180ms ease,
              background 180ms ease;
          }

          .projects-tab:hover {
            color: ${text};
          }

          .projects-tab.active {
            color: #ffffff;
            background: ${ACCENT};
          }

          .projects-tab-count {
            display: inline-grid;
            min-width: 22px;
            height: 22px;
            margin-right: 0.45rem;
            padding: 0 0.35rem;
            place-items: center;
            color: inherit;
            background: ${
              dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.07)"
            };
            border-radius: 999px;
            font-size: 0.65rem;
          }

          .projects-tab.active .projects-tab-count {
            background: rgba(255,255,255,0.18);
          }

          .projects-table-status {
            min-height: 250px;
            display: grid;
            place-items: center;
            padding: 2rem;
            color: ${muted};
            text-align: center;
          }

          .projects-table-status-inner {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.8rem;
            max-width: 520px;
            font-size: 0.78rem;
            line-height: 1.9;
          }

          .projects-table-status .loading-icon {
            color: ${ACCENT};
            animation: projects-loading-spin 900ms linear infinite;
          }

          @keyframes projects-loading-spin {
            to {
              transform: rotate(360deg);
            }
          }

          .projects-table-scroll {
            flex: 1;
            min-height: 0;
            max-height: none;
            overflow: auto;
            scrollbar-width: thin;
            scrollbar-color: ${dark ? "#575151" : "#aaa5a5"} ${surfaceSoft};
          }

          .projects-table-scroll::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }

          .projects-table-scroll::-webkit-scrollbar-track {
            background: ${surfaceSoft};
          }

          .projects-table-scroll::-webkit-scrollbar-thumb {
            background: ${dark ? "#575151" : "#aaa5a5"};
            border: 2px solid ${surfaceSoft};
            border-radius: 3px;
          }

          .projects-table-scroll::-webkit-scrollbar-thumb:hover {
            background: ${ACCENT};
          }

          .projects-table-scroll::-webkit-scrollbar-corner {
            background: ${surfaceSoft};
          }

          .projects-table {
            width: 100%;
            min-width: 760px;
            border-collapse: separate;
            border-spacing: 0;
          }

          .projects-table th,
          .projects-table td {
            padding: 0.65rem 0.85rem;
            text-align: right;
            border-bottom: 1px solid ${border};
            border-left: 1px solid ${border};
            white-space: nowrap;
          }

          .projects-table th:last-child,
          .projects-table td:last-child {
            border-left: none;
          }

          .projects-table th {
            position: sticky;
            top: 0;
            z-index: 2;
            color: ${muted};
            background: ${surfaceSoft};
            font-size: 0.68rem;
            font-weight: 850;
          }

          .projects-table td {
            color: ${text};
            background: ${surface};
            font-size: 0.76rem;
          }

          .projects-table tbody tr:last-child td {
            border-bottom: none;
          }

          .projects-table tbody tr:hover td {
            background: ${hover};
          }

          .regions-section {
            position: sticky;
            top: 65px;
            z-index: 30;
            height: 280px;
            padding: 0.45rem 0 0.75rem;
            box-sizing: border-box;
            background: ${dark ? "rgba(26,25,25,0.97)" : "rgba(240,239,239,0.97)"};
            backdrop-filter: blur(14px);
          }

          .regions-section-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
            margin-bottom: 0.45rem;
          }

          .regions-section-header .section-description {
            display: none;
          }

          .regions-section-header .section-kicker {
            margin-bottom: 0.1rem;
          }

          .regions-section-header .section-title {
            font-size: 1rem;
          }

          .regions-grid {
            display: grid;
            grid-template-columns: repeat(9, minmax(0, 1fr));
            gap: 0.35rem;
          }

          .region-menu-item {
            min-width: 0;
          }

          .region-menu-button {
            width: 100%;
            min-width: 0;
            min-height: 34px;
            padding: 0.28rem 0.45rem;
            color: ${text};
            background: ${dark ? "#201f1f" : "#ffffff"};
            border: 1px solid ${border};
            border-radius: 3px;
            cursor: pointer;
            font-family: var(--app-font-family);
            font-size: 0.65rem;
            font-weight: 800;
            white-space: nowrap;
            transition:
              color 170ms ease,
              background 170ms ease,
              border-color 170ms ease,
              transform 170ms ease;
          }

          .region-menu-button:hover {
            color: ${ACCENT};
            background: ${surfaceSoft};
            border-color: ${ACCENT};
            transform: translateY(-1px);
          }

          .region-menu-button.active {
            color: #ffffff;
            background: ${ACCENT};
            border-color: ${ACCENT};
          }

          .album-section {
            min-height: calc(100vh - 65px);
            padding: 2rem 0 4rem;
            scroll-margin-top: 345px;
          }

          .album-header {
            display: flex;
            align-items: end;
            justify-content: space-between;
            gap: 2rem;
            padding-bottom: 0.6rem;
            margin-bottom: 1.5rem;
          }

          .album-title-row {
            display: flex;
            align-items: center;
            gap: 0.8rem;
          }

          .album-title-icon {
            width: 40px;
            height: 40px;
            display: grid;
            flex: 0 0 auto;
            place-items: center;
            color: ${ACCENT};
            background: ${surfaceSoft};
            border-radius: 4px;
          }

          .album-title {
            margin: 0;
            font-size: clamp(1.45rem, 3vw, 2.15rem);
            font-weight: 850;
            letter-spacing: -0.035em;
          }

          .album-subtitle {
            margin: 0.35rem 0 0;
            color: ${muted};
            font-size: 0.72rem;
          }

          .album-masonry {
            min-height: 600px;
          }

          .album-masonry a {
            cursor: pointer;
          }

          .album-placeholder {
            min-height: 360px;
            display: grid;
            place-items: center;
            color: ${muted};
            border: 1px dashed ${border};
            border-radius: 4px;
            font-size: 0.78rem;
          }

          .album-lightbox {
            position: fixed;
            inset: 0;
            z-index: 100;
            display: grid;
            place-items: center;
            padding: 1rem;
            background: rgba(4, 4, 4, 0.84);
            backdrop-filter: blur(14px);
          }

          .album-lightbox-card {
            position: relative;
            width: min(1120px, 100%);
            height: min(700px, calc(100dvh - 2rem));
            max-height: calc(100dvh - 2rem);
            overflow: hidden;
            display: grid;
            grid-template-columns: minmax(0, 1fr) minmax(350px, 0.48fr);
            background: ${surface};
            border: 1px solid rgba(255,255,255,0.14);
            border-radius: 4px;
          }

          .album-lightbox-image {
            position: relative;
            min-width: 0;
            min-height: 0;
            height: 100%;
            overflow: hidden;
            background: #111111;
          }

          .album-lightbox-image > img {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }

          .album-lightbox-info {
            min-width: 0;
            min-height: 0;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            justify-content: center;
            padding: 2rem;
            color: ${text};
          }

          .album-lightbox-info-kicker {
            margin: 0 0 0.4rem;
            color: ${ACCENT};
            font-size: 0.7rem;
            font-weight: 850;
          }

          .album-lightbox-info h3 {
            margin: 0;
            font-size: 1.25rem;
            font-weight: 850;
          }

          .album-lightbox-info-description {
            margin: 0.7rem 0 1rem;
            color: ${muted};
            font-size: 0.74rem;
            line-height: 1.75;
          }

          .album-project-meta {
            display: grid;
            gap: 0.55rem;
          }

          .album-project-meta-row {
            display: grid;
            grid-template-columns: 22px 64px 1fr;
            align-items: center;
            gap: 0.45rem;
            padding-bottom: 0.55rem;
            border-bottom: 1px solid ${border};
          }

          .album-project-meta-label {
            color: ${muted};
            font-size: 0.68rem;
          }

          .album-project-meta-value {
            font-size: 0.74rem;
            font-weight: 750;
          }

          .album-lightbox-close {
            position: absolute;
            top: 0.85rem;
            left: 0.85rem;
            z-index: 3;
            width: 38px;
            height: 38px;
            display: grid;
            place-items: center;
            color: #ffffff;
            background: rgba(0,0,0,0.52);
            border: none;
            border-radius: 50%;
            cursor: pointer;
          }

          .album-lightbox-nav {
            position: absolute;
            top: 50%;
            z-index: 3;
            width: 40px;
            height: 40px;
            display: grid;
            place-items: center;
            color: #ffffff;
            background: rgba(0,0,0,0.48);
            border: none;
            border-radius: 50%;
            cursor: pointer;
            transform: translateY(-50%);
          }

          .album-lightbox-nav.right {
            right: 1rem;
          }

          .album-lightbox-nav.left {
            left: 1rem;
          }


          @media (max-width: 1100px) {
            .regions-grid {
              grid-template-columns: repeat(6, minmax(0, 1fr));
            }
          }

          @media (max-width: 760px) {
            .map-page-title {
              top: 0.9rem;
              right: 0.9rem;
            }

            .map-page-title-line {
              height: 28px;
            }

            .nezarat-page-section,
            .projects-overview-inner {
              width: min(100% - 1.5rem, 620px);
            }

            .projects-overview {
              height: calc(100svh - 65px - 280px);
              min-height: 390px;
              padding: 0.65rem 0 0.4rem;
            }

            .section-heading,
            .regions-section-header,
            .album-header {
              align-items: flex-start;
              flex-direction: column;
              gap: 0.75rem;
            }

            .projects-tabs {
              overflow-x: auto;
            }

            .projects-tab {
              min-width: 132px;
              flex: 0 0 auto;
            }

            .projects-table-scroll {
              max-height: none;
            }

            .regions-section {
              height: auto;
              min-height: 0;
              padding-bottom: 0.75rem;
            }

            .album-section {
              padding-top: 2.5rem;
            }

            .regions-grid {
              grid-template-columns: repeat(6, minmax(0, 1fr));
              gap: 0.28rem;
            }

            .region-menu-button {
              min-height: 29px;
              padding: 0.18rem 0.2rem;
              font-size: 0.56rem;
            }

            .album-masonry {
              min-height: 420px;
            }

            .album-lightbox {
              padding: 0;
            }

            .album-lightbox-card {
              width: 100%;
              height: 100dvh;
              max-height: 100dvh;
              grid-template-columns: 1fr;
              grid-template-rows: minmax(0, 56dvh) minmax(0, 1fr);
              border: none;
            }

            .album-lightbox-image {
              width: 100%;
              height: 100%;
              min-height: 0;
            }

            .album-lightbox-info {
              justify-content: center;
              padding: 1rem 1.15rem;
            }

            .album-lightbox-info-description {
              margin: 0.45rem 0 0.7rem;
              font-size: 0.68rem;
              line-height: 1.55;
            }

            .album-project-meta {
              gap: 0.35rem;
            }

            .album-project-meta-row {
              padding-bottom: 0.38rem;
            }
          }


          /* Map-first page layout */
          .map-hero-section {
            position: relative;
            height: calc(100svh - 65px);
            min-height: 620px;
            display: grid;
            place-items: center;
            overflow: hidden;
            padding: 0.15rem 0.35rem 4.5rem;
            box-sizing: border-box;
background: transparent;
          }

          .map-hero-inner {
            width: 100%;
            max-width: none;
            height: 100%;
            min-height: 0;
            display: grid;
            place-items: center;
          }

          .map-page-title {
            position: absolute;
            top: clamp(1.2rem, 3vw, 2.2rem);
            right: clamp(1rem, 4vw, 3rem);
            z-index: 5;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            direction: rtl;
          }

          .map-page-title-line {
            width: 3px;
            height: 34px;
            flex: 0 0 auto;
            background: ${ACCENT};
            border-radius: 2px;
          }

          .map-page-title h1 {
            margin: 0;
            color: ${text};
            font-size: clamp(1.35rem, 2.6vw, 2rem);
            font-weight: 850;
            letter-spacing: -0.035em;
          }

          .projects-scroll-button {
            position: absolute;
            right: clamp(0.9rem, 3vw, 2.4rem);
            bottom: clamp(0.9rem, 2.4vw, 1.7rem);
            z-index: 4;
            min-height: 42px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.45rem;
            padding: 0.58rem 0.82rem;
            color: #ffffff;
            background: ${ACCENT};
            border: 1px solid ${ACCENT};
            border-radius: 4px;
            cursor: pointer;
            font-family: var(--app-font-family);
            font-size: 0.72rem;
            font-weight: 850;
            animation: projects-scroll-bounce 1.9s ease-in-out infinite;
            transition: transform 170ms ease, filter 170ms ease;
          }

          .projects-scroll-button:hover {
            transform: translateY(-2px);
            filter: brightness(1.06);
            animation-play-state: paused;
          }

          .projects-scroll-button:focus-visible {
            outline: 2px solid ${dark ? "#ffffff" : "#111111"};
            outline-offset: 3px;
          }

          @keyframes projects-scroll-bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-6px); }
          }

          .area-album-section {
            min-height: min(860px, calc(100svh - 65px));
            padding: 1.35rem 0 4rem;
            scroll-margin-top: 81px;
            background: transparent;
          }

          .area-album-section {
            animation: area-album-reveal 260ms ease-out both;
          }

          @keyframes area-album-reveal {
            from {
              opacity: 0;
              transform: translateY(18px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .area-album-header {
            display: flex;
            flex-direction: column;
            align-items: stretch;
            gap: 1rem;
            padding-bottom: 0.85rem;
            margin-bottom: 1.15rem;
          }

          .album-header-actions {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: flex-start;
            gap: 0.45rem;
            direction: rtl;
          }

          .album-header-icon-button {
            width: 38px;
            height: 38px;
            display: grid;
            place-items: center;
            color: ${text};
            background: ${surface};
            border: 1px solid ${border};
            border-radius: 4px;
            cursor: pointer;
            transition: color 170ms ease, background 170ms ease, border-color 170ms ease;
          }

          .album-header-icon-button:hover {
            color: ${ACCENT};
            background: ${surfaceSoft};
            border-color: ${ACCENT};
          }

          .album-header-icon-button:focus-visible {
            outline: 2px solid ${ACCENT};
            outline-offset: 2px;
          }

          .projects-overview {
            height: calc(100svh - 65px);
            min-height: 560px;
            padding: 1rem 0 0.75rem;
            scroll-margin-top: 81px;
            background: transparent;
          }

          @media (max-width: 760px) {
            .map-hero-section {
              min-height: 500px;
              padding: 0.2rem 0.2rem 4.2rem;
            }

            .projects-scroll-button {
              right: 0.75rem;
              bottom: 0.75rem;
              min-height: 40px;
              padding: 0.52rem 0.7rem;
              font-size: 0.66rem;
            }

            .area-album-section {
              min-height: auto;
              padding: 1rem 0 2.5rem;
            }

            .area-album-header {
              gap: 0.8rem;
              margin-bottom: 0.85rem;
            }

            .album-header-actions {
              gap: 0.35rem;
            }

            .album-header-icon-button {
              width: 36px;
              height: 36px;
            }

            .album-title-row {
              align-items: flex-start;
            }

            .album-title-icon {
              width: 36px;
              height: 36px;
            }

            .projects-overview {
              height: calc(100svh - 65px);
              min-height: 500px;
              padding: 0.7rem 0 0.55rem;
            }
          }

          @media (max-width: 480px) {
            .map-hero-section {
              min-height: 460px;
              padding-inline: 0;
            }

            .projects-scroll-button span {
              display: none;
            }

            .projects-scroll-button {
              width: 42px;
              padding: 0;
            }

            .area-album-section .nezarat-page-section {
              width: min(100% - 1rem, 620px);
            }

            .album-title {
              font-size: 1.25rem;
            }

            .album-subtitle {
              font-size: 0.66rem;
              line-height: 1.7;
            }
          }

        `}</style>

        <section
          ref={mapRef}
          className="map-hero-section"
          aria-label="نقشه پروژه‌های مناطق تهران"
        >
          <header className="map-page-title">
            <span className="map-page-title-line" />
            <h1>پروژه‌های نظارت</h1>
          </header>

          <div className="map-hero-inner">
            <TehranRegionsMap
              activeAreaId={activeAreaId}
              dark={dark}
              onAreaSelect={selectArea}
            />
          </div>

          <button
            type="button"
            className="projects-scroll-button"
            onClick={() => scrollToElement(tableRef.current)}
            aria-label="رفتن به جدول پروژه‌ها"
          >
            <ArrowDown size={19} />
            <span>جدول پروژه‌ها</span>
          </button>
        </section>

        {activeAreaId !== null && (
          <section
            ref={albumRef}
            id="region-projects-album"
            className="album-section area-album-section"
            aria-labelledby="album-title"
          >
            <div className="nezarat-page-section">
              <header className="album-header area-album-header">
                <div className="album-header-actions" aria-label="کنترل‌های آلبوم">
                  <button
                    type="button"
                    className="album-header-icon-button"
                    onClick={() => scrollToElement(mapRef.current)}
                    aria-label="بازگشت به نقشه"
                    title="بازگشت به نقشه"
                  >
                    <ArrowUp size={18} />
                  </button>
                  <button
                    type="button"
                    className="album-header-icon-button"
                    onClick={closeAreaAlbum}
                    aria-label="بستن آلبوم"
                    title="بستن آلبوم"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="album-title-row">
                  <span className="album-title-icon">
                    <Images size={19} />
                  </span>
                  <div>
                    <h2 id="album-title" className="album-title">
                      آلبوم پروژه‌های {getAreaName(activeAreaId)}
                    </h2>
                    <p className="album-subtitle">
                      برای مشاهده جزئیات هر پروژه روی تصویر آن کلیک کنید.
                    </p>
                  </div>
                </div>
              </header>

              <div className="album-masonry">
                <Masonry
                  key={`area-${String(activeAreaId)}`}
                  items={activeRegionAlbum}
                  ease="power1.out"
                  duration={0.8}
                  stagger={0.08}
                  animateFrom="bottom"
                  scaleOnHover
                  hoverScale={0.97}
                  blurToFocus
                  colorShiftOnHover={false}
                  onItemClick={item => {
                    const albumItem = activeRegionAlbum.find(
                      areaItem => areaItem.id === item.id,
                    );

                    if (albumItem) openAlbumItem(albumItem);
                  }}
                />
              </div>
            </div>
          </section>
        )}

        <section
          ref={tableRef}
          id="projects-table-section"
          className="projects-overview"
          aria-labelledby="projects-table-title"
        >
          <div className="projects-overview-inner">
            <header className="section-heading">
              <div>
                <p className="section-kicker">{SECTION_LABELS[section]} پروژه‌ها</p>
                <h1 id="projects-table-title" className="section-title">
                  {page?.title || "جدول پروژه‌های نظارت"}
                </h1>
                <p className="section-description">
                  {String(page?.content.intro || "اطلاعات این جدول مستقیماً از فایل Excel بارگذاری‌شده در پنل مدیریت خوانده می‌شود. هر شیت فایل در یک تب جدا نمایش داده می‌شود.")}
                </p>
              </div>

              <TableProperties size={30} color={ACCENT} strokeWidth={1.4} />
            </header>

            <div className="projects-table-card">
              <div className="projects-tabs" role="tablist" aria-label="شیت‌های جدول پروژه‌ها">
                {projectSheets.map((sheet, index) => {
                  const isActive = activeSheetIndex === index;
                  return (
                    <button
                      key={`${sheet.sheetName}-${index}`}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      className={`projects-tab${isActive ? " active" : ""}`}
                      onClick={() => setActiveSheetIndex(index)}
                    >
                      {sheet.sheetName}
                      {!excelLoading && !excelError && (
                        <span className="projects-tab-count">
                          {toPersianNumber(sheet.rows.length)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {excelLoading && (
                <div className="projects-table-status">
                  <div className="projects-table-status-inner">
                    <LoaderCircle className="loading-icon" size={28} />
                    <span>در حال دریافت اطلاعات پروژه‌ها از سرور...</span>
                  </div>
                </div>
              )}

              {!excelLoading && excelError && (
                <div className="projects-table-status">
                  <div className="projects-table-status-inner">
                    <AlertCircle size={30} color={ACCENT} />
                    <strong style={{ color: text }}>خطا در بارگذاری جدول</strong>
                    <span>{excelError}</span>
                  </div>
                </div>
              )}

              {!excelLoading && !excelError && projectSheets.length === 0 && (
                <div className="projects-table-status">
                  <div className="projects-table-status-inner">
                    <AlertCircle size={28} color={ACCENT} />
                    <span>هنوز فایل اکسل جدول پروژه‌های نظارت از پنل مدیریت بارگذاری نشده است.</span>
                  </div>
                </div>
              )}

              {!excelLoading && !excelError && activeSheet && (
                <>
                  {activeSheet.columns.length > 0 ? (
                    <div className="projects-table-scroll">
                      <table className="projects-table">
                        <thead>
                          <tr>
                            {activeSheet.columns.map((column, columnIndex) => (
                              <th key={`${columnIndex}-${column}`}>{column}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {activeSheet.rows.map((row, rowIndex) => (
                            <tr key={`${activeSheet.sheetName}-${rowIndex}`}>
                              {activeSheet.columns.map((column, columnIndex) => (
                                <td key={`${rowIndex}-${columnIndex}-${column}`}>
                                  {formatCellValue(row[columnIndex] ?? null)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="projects-table-status">
                      <div className="projects-table-status-inner">
                        <AlertCircle size={28} color={ACCENT} />
                        <span>
                          جدول «{activeSheet.sheetName}» هنوز داده‌ای ندارد.
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </section>

        {selectedAlbumItem && selectedRegionImages[selectedImageIndex] && (
          <div
            className="album-lightbox"
            role="dialog"
            aria-modal="true"
            aria-label={selectedAlbumItem.title}
            onMouseDown={event => {
              if (event.currentTarget === event.target) {
                setSelectedAlbumItem(null);
              }
            }}
          >
            <div className="album-lightbox-card">
              <div className="album-lightbox-image">
                <ImageWithFallback
                  src={selectedRegionImages[selectedImageIndex]}
                  alt={selectedAlbumItem.title}
                  className="w-full h-full"
                />

                <button
                  type="button"
                  className="album-lightbox-close"
                  onClick={() => setSelectedAlbumItem(null)}
                  aria-label="بستن"
                >
                  <X size={18} />
                </button>

                {selectedRegionImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      className="album-lightbox-nav right"
                      onClick={showPreviousImage}
                      aria-label="تصویر قبلی"
                    >
                      <ChevronRight size={19} />
                    </button>

                    <button
                      type="button"
                      className="album-lightbox-nav left"
                      onClick={showNextImage}
                      aria-label="تصویر بعدی"
                    >
                      <ChevronLeft size={19} />
                    </button>
                  </>
                )}
              </div>

              <aside className="album-lightbox-info">
                <p className="album-lightbox-info-kicker">
                  {activeAreaId !== null ? getAreaName(activeAreaId) : ""}
                </p>
                <h3>{selectedAlbumItem.title}</h3>
                <p className="album-lightbox-info-description">
                  {selectedAlbumItem.description}
                </p>

                <div className="album-project-meta">
                  {[
                    {
                      icon: <MapPin size={15} color={ACCENT} />,
                      label: "موقعیت",
                      value: selectedAlbumItem.location,
                    },
                    {
                      icon: <Layers3 size={15} color={ACCENT} />,
                      label: "گرایش",
                      value: selectedAlbumItem.orientation,
                    },
                    {
                      icon: <Ruler size={15} color={ACCENT} />,
                      label: "متراژ",
                      value: selectedAlbumItem.area,
                    },
                    {
                      icon: <CalendarDays size={15} color={ACCENT} />,
                      label: "سال",
                      value: selectedAlbumItem.year,
                    },
                  ].map(item => (
                    <div key={item.label} className="album-project-meta-row">
                      {item.icon}
                      <span className="album-project-meta-label">{item.label}</span>
                      <strong className="album-project-meta-value">{item.value}</strong>
                    </div>
                  ))}
                </div>
              </aside>
            </div>
          </div>
        )}
      </main>
    </AppShell>
  );
}

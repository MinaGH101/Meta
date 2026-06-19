import type { CSSProperties } from "react";
import { AppShell } from "./AppShell";
import { useDark } from "../context";
import ChromaGrid from "./ui/ChromaGrid";

import heroImage from "../../static/images/24.jpg";
import detailImage from "../../static/images/11.jpg";

const ACCENT = "#BD3039";

const stats = [
  { value: "۱۵+", label: "سال تجربه" },
  { value: "۲۸۰+", label: "پروژه تکمیل‌شده" },
  { value: "۴۰+", label: "جوایز ملی و بین‌المللی" },
  { value: "۱۲", label: "متخصص در تیم" },
];

const missions = [
  {
    number: "۰۱",
    title: "طراحی خلاقانه",
    body: "ایجاد فضاهایی که هم از نظر عملکردی دقیق و هم از نظر بصری الهام‌بخش باشند؛ هر پروژه برای ما یک روایت معماری مستقل است.",
  },
  {
    number: "۰۲",
    title: "کیفیت بی‌سازش",
    body: "از انتخاب متریال تا جزئیات اجرایی، هر مرحله با نظارت تخصصی، استانداردهای مهندسی و حساسیت بالا پیش می‌رود.",
  },
  {
    number: "۰۳",
    title: "پایداری و آینده",
    body: "طراحی با توجه به محیط‌زیست، مصرف بهینه انرژی، متریال هوشمند و راهکارهایی که ساختمان را برای آینده آماده می‌کنند.",
  },
];

const teamItems = [
  {
    image: "https://i.pravatar.cc/300?img=12",
    title: "dfdfdsf",
    subtitle: "مدیرعامل و معمار ارشد",
    handle: "۲۰ سال سابقه",
    borderColor: "rgba(139, 26, 42, 0.55)",
    gradient: "linear-gradient(145deg, rgba(255,255,255,0.14), #000000)",
    url: "#team-kaveh",
  },
  {
    image: "https://i.pravatar.cc/300?img=47",
    title: "مهندس نیلوفر حسینی",
    subtitle: "معمار داخلی",
    handle: "۱۲ سال سابقه",
    borderColor: "rgba(139, 26, 42, 0.38)",
    gradient: "linear-gradient(145deg, rgba(255,255,255,0.12), #000000)",
    url: "#team-niloufar",
  },
  {
    image: "https://i.pravatar.cc/300?img=15",
    title: "مهندس رضا مرادی",
    subtitle: "مهندس سازه",
    handle: "۱۵ سال سابقه",
    borderColor: "rgba(139, 26, 42, 0.38)",
    gradient: "linear-gradient(145deg, rgba(255,255,255,0.12), #000000)",
    url: "#team-reza",
  },
  {
    image: "https://i.pravatar.cc/300?img=32",
    title: "مهندس سارا کریمی",
    subtitle: "طراح محوطه",
    handle: "۸ سال سابقه",
    borderColor: "rgba(139, 26, 42, 0.38)",
    gradient: "linear-gradient(145deg, rgba(255,255,255,0.12), #000000)",
    url: "#team-sara",
  },
];

export function AboutPage() {
  const { dark } = useDark();

  const bg = dark ? "#1a1919" : "#f0efef";
  const text = dark ? "#f8f3f3" : "#141111";
  const muted = dark ? "rgba(255,255,255,0.58)" : "rgba(20,17,17,0.58)";
  const soft = dark ? "rgba(255,255,255,0.045)" : "rgba(0,0,0,0.035)";
  const glass = dark ? "rgba(255,255,255,0.055)" : "rgba(255,255,255,0.72)";
  const border = dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)";
  const shadow = dark ? "0 24px 80px rgba(0,0,0,0.55)" : "0 24px 80px rgba(35,20,20,0.12)";
  const teamBg = dark ? "rgba(255,255,255,0.045)" : "rgba(245,245,245,0.92)";

  const rootStyle = {
    fontFamily: "var(--app-font-family)",
    background: bg,
    color: text,
    minHeight: "calc(100vh - 65px)",
    "--about-text": text,
    "--about-muted": muted,
    "--about-accent": ACCENT,
    "--about-border": border,
    "--about-glass": glass,
    "--about-soft": soft,
    "--about-shadow": shadow,
    "--about-team-bg": teamBg,
  } as CSSProperties;

  return (
    <AppShell>
      <div className="about-page-redesign" dir="rtl" style={rootStyle}>
        <style>{`
          .about-page-redesign,
          .about-page-redesign * {
            box-sizing: border-box;
          }

          .about-page-redesign {
            position: relative;
            overflow-x: hidden;
            overflow-y: clip;
            isolation: isolate;
          }

          .about-page-redesign img {
            max-width: 100%;
            display: block;
          }

          .about-page-redesign::before,
          .about-page-redesign::after {
            content: "";
            position: fixed;
            pointer-events: none;
            z-index: -1;
            filter: blur(12px);
          }

          .about-page-redesign::before {
            width: clamp(260px, 42vw, 720px);
            height: clamp(260px, 42vw, 720px);
            top: min(-140px, -12vw);
            right: min(-110px, -9vw);
            // background: radial-gradient(circle, rgba(120,120,120,0.08), transparent 68%);
            animation: about-orb-float 10s ease-in-out infinite alternate;
          }

          .about-page-redesign::after {
            width: clamp(220px, 34vw, 580px);
            height: clamp(220px, 34vw, 580px);
            left: min(-110px, -8vw);
            bottom: min(-140px, -10vw);
            // background: radial-gradient(circle, rgba(120,120,120,0.06), transparent 70%);
            animation: about-orb-float 12s ease-in-out infinite alternate-reverse;
          }

          .about-wrap {
            width: min(1480px, calc(100% - clamp(28px, 5vw, 64px)));
            margin: 0 auto;
            padding: clamp(28px, 4.2vw, 54px) 0 clamp(56px, 6vw, 80px);
          }

          .about-hero {
            position: relative;
            display: grid;
            grid-template-columns: minmax(0, 1.03fr) minmax(340px, 0.97fr);
            gap: clamp(18px, 2.4vw, 34px);
            align-items: stretch;
            perspective: 1400px;
          }

          .about-copy,
          .about-visual,
          .about-stat,
          .about-mission-card,
          .about-process-panel {
            transform-style: preserve-3d;
            transition: transform 520ms cubic-bezier(.2,.8,.2,1), box-shadow 520ms ease, border-color 520ms ease, background 520ms ease;
          }

          .about-copy {
            min-height: clamp(420px, 42vw, 520px);
            padding: clamp(24px, 4vw, 58px);
            display: flex;
            flex-direction: column;
            justify-content: center;
            // background: linear-gradient(145deg, var(--about-glass), transparent 125%);
            // border: 1px solid var(--about-border);
            // box-shadow: var(--about-shadow);
            // backdrop-filter: blur(18px) saturate(140%);
            -webkit-backdrop-filter: blur(18px) saturate(140%);
            animation: about-rise 760ms cubic-bezier(.2,.8,.2,1) both;
          }

          .about-copy:hover {
            transform: translateY(-8px) rotateX(2.2deg) rotateY(-2.2deg);
            border-color: rgba(139,26,42,0.36);
          }

          .about-eyebrow {
            display: inline-flex;
            width: fit-content;
            max-width: 100%;
            align-items: center;
            gap: 10px;
            color: var(--about-accent);
            font-size: clamp(0.7rem, 1vw, 0.78rem);
            letter-spacing: 0.14em;
            text-transform: uppercase;
            margin-bottom: clamp(14px, 2vw, 20px);
            white-space: nowrap;
          }

          .about-eyebrow::before {
            content: "";
            width: clamp(28px, 4vw, 46px);
            height: 1px;
            background: currentColor;
            flex: 0 0 auto;
          }

          .about-title {
            margin: 0;
            font-size: clamp(1.8rem, 4.8vw, 4.2rem);
            line-height: 1.05;
            font-weight: 600;
            letter-spacing: -0.025em;
            color: var(--about-accent);
            text-wrap: balance;
          }

          .about-title span {
            color: var(--about-accent);
            text-shadow: none;
          }

          .about-lead {
            margin: clamp(18px, 2vw, 26px) 0 0;
            max-width: 760px;
            color: var(--about-muted);
            font-size: clamp(0.88rem, 1.35vw, 1.12rem);
            line-height: 2.2;
            text-align: justify;
          }

          .about-hero-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            margin-top: clamp(24px, 3vw, 34px);
          }

          .about-pill {
            border: 1px solid var(--about-border);
            background: var(--about-soft);
            color: var(--about-text);
            padding: clamp(10px, 1.2vw, 12px) clamp(13px, 1.6vw, 18px);
            font-size: clamp(0.74rem, 1vw, 0.82rem);
            backdrop-filter: blur(14px);
            -webkit-backdrop-filter: blur(14px);
            transform: translateZ(24px);
          }

          .about-visual {
            min-height: clamp(420px, 42vw, 520px);
            position: relative;
            overflow: hidden;
            border: 1px solid var(--about-border);
            box-shadow: var(--about-shadow);
            animation: about-rise 860ms 80ms cubic-bezier(.2,.8,.2,1) both;
          }

          .about-visual:hover {
            transform: translateY(-10px) rotateX(3deg) rotateY(3deg);
            border-color: rgba(139,26,42,0.32);
          }

          .about-visual img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            filter: grayscale(0.1) contrast(1.04);
            transform: scale(1.05);
            transition: transform 900ms cubic-bezier(.2,.8,.2,1), filter 900ms ease;
          }

          .about-visual:hover img {
            transform: scale(1.12) translateZ(40px);
            filter: grayscale(0) contrast(1.08);
          }

          .about-visual-shade {
            position: absolute;
            inset: 0;
            background: linear-gradient(215deg, rgba(0,0,0,0.04), rgba(0,0,0,0.72));
          }

          .about-floating-note {
            position: absolute;
            right: clamp(14px, 2vw, 24px);
            bottom: clamp(14px, 2vw, 24px);
            width: min(320px, calc(100% - 28px));
            padding: clamp(16px, 2vw, 22px);
            color: #fff;
            background: rgba(0,0,0,0.34);
            border: 1px solid rgba(255,255,255,0.18);
            backdrop-filter: blur(20px) saturate(150%);
            -webkit-backdrop-filter: blur(20px) saturate(150%);
            transform: translateZ(70px);
          }

          .about-floating-note strong {
            display: block;
            font-size: clamp(0.82rem, 1vw, 0.92rem);
            font-weight: 600;
            margin-bottom: 8px;
          }

          .about-floating-note p {
            color: rgba(255,255,255,0.68);
            margin: 0;
            font-size: clamp(0.72rem, 1vw, 0.78rem);
            line-height: 1.9;
          }

          .about-stats {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: clamp(12px, 1.5vw, 16px);
            margin-top: clamp(18px, 2vw, 24px);
            perspective: 1200px;
          }

          .about-stat {
            position: relative;
            min-height: clamp(124px, 11vw, 150px);
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            padding: clamp(18px, 2vw, 24px);
            overflow: hidden;
            background: linear-gradient(145deg, var(--about-glass), transparent 125%);
            border: 1px solid var(--about-border);
            box-shadow: 0 16px 46px rgba(0,0,0,0.06);
            backdrop-filter: blur(16px) saturate(140%);
            -webkit-backdrop-filter: blur(16px) saturate(140%);
            animation: about-rise 720ms cubic-bezier(.2,.8,.2,1) both;
          }

          .about-stat:nth-child(1) { animation-delay: 120ms; }
          .about-stat:nth-child(2) { animation-delay: 180ms; }
          .about-stat:nth-child(3) { animation-delay: 240ms; }
          .about-stat:nth-child(4) { animation-delay: 300ms; }

          .about-stat::before {
            content: "";
            position: absolute;
            inset-inline-start: -36px;
            top: -36px;
            width: 120px;
            height: 120px;
            background: radial-gradient(circle, rgba(0,0,0,0.06), transparent 65%);
            transition: transform 620ms cubic-bezier(.2,.8,.2,1);
          }

          .about-stat:hover {
            transform: translateY(-8px) rotateX(4deg) rotateY(-3deg);
            border-color: rgba(139,26,42,0.34);
          }

          .about-stat:hover::before {
            transform: scale(1.8) translate(10px, 10px);
          }

          .about-stat-value {
            position: relative;
            z-index: 1;
            color: var(--about-accent);
            font-size: clamp(1.35rem, 2.8vw, 2.5rem);
            line-height: 0.9;
            font-weight: 600;
            white-space: nowrap;
          }

          .about-stat-label {
            position: relative;
            z-index: 1;
            color: var(--about-muted);
            margin-top: 12px;
            font-size: clamp(0.78rem, 1vw, 0.85rem);
          }

          .about-section {
            margin-top: clamp(48px, 6vw, 72px);
          }

          .about-section-head {
            display: flex;
            align-items: end;
            justify-content: space-between;
            gap: clamp(16px, 2vw, 22px);
            margin-bottom: clamp(18px, 2vw, 24px);
          }

          .about-kicker {
            margin: 0 0 10px;
            color: var(--about-accent);
            font-size: clamp(0.68rem, 1vw, 0.76rem);
            letter-spacing: 0.16em;
            text-transform: uppercase;
          }

          .about-heading {
            margin: 0;
            font-size: clamp(1.18rem, 2.4vw, 2.15rem);
            line-height: 1.25;
            font-weight: 600;
            color: var(--about-accent);
            letter-spacing: -0.04em;
            text-wrap: balance;
          }

          .about-section-head p {
            max-width: 520px;
            margin: 0;
            color: var(--about-muted);
            line-height: 2;
            font-size: clamp(0.82rem, 1vw, 0.9rem);
          }

          .about-missions {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: clamp(14px, 1.8vw, 18px);
            perspective: 1300px;
          }

          .about-mission-card {
            position: relative;
            min-height: clamp(235px, 24vw, 280px);
            padding: clamp(22px, 2.4vw, 28px);
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            overflow: hidden;
            background: linear-gradient(145deg, var(--about-glass), transparent 130%);
            border: 1px solid var(--about-border);
            box-shadow: 0 22px 60px rgba(0,0,0,0.08);
            backdrop-filter: blur(18px) saturate(140%);
            -webkit-backdrop-filter: blur(18px) saturate(140%);
          }

          .about-mission-card::after {
            content: "";
            position: absolute;
            inset: auto auto -60px -60px;
            width: 180px;
            height: 180px;
            background: radial-gradient(circle, rgba(0,0,0,0.055), transparent 70%);
            transition: transform 650ms cubic-bezier(.2,.8,.2,1);
          }

          .about-mission-card:hover {
            transform: translateY(-10px) rotateX(5deg) rotateY(4deg);
            border-color: rgba(139,26,42,0.34);
          }

          .about-mission-card:hover::after {
            transform: scale(1.75);
          }

          .about-mission-number {
            color: var(--about-accent);
            font-size: 0.78rem;
          }

          .about-mission-card h3 {
            margin: clamp(28px, 4vw, 42px) 0 14px;
            font-size: clamp(0.94rem, 1.1vw, 1.05rem);
            font-weight: 600;
            color: var(--about-accent);
          }

          .about-mission-card p {
            margin: 0;
            color: var(--about-muted);
            line-height: 2;
            font-size: clamp(0.78rem, 1vw, 0.85rem);
          }

          .about-process {
            display: grid;
            grid-template-columns: minmax(320px, 0.92fr) minmax(0, 1.08fr);
            gap: clamp(16px, 2vw, 22px);
            align-items: stretch;
          }

          .about-process-image {
            position: relative;
            min-height: clamp(350px, 38vw, 470px);
            overflow: hidden;
            border: 1px solid var(--about-border);
            box-shadow: var(--about-shadow);
          }

          .about-process-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transform: scale(1.04);
            transition: transform 900ms cubic-bezier(.2,.8,.2,1);
          }

          .about-process-image:hover img {
            transform: scale(1.13);
          }

          .about-process-panel {
            padding: clamp(24px, 4vw, 54px);
            // background: linear-gradient(145deg, var(--about-glass), transparent 130%);
            // border: 1px solid var(--about-border);
            // box-shadow: var(--about-shadow);
            // backdrop-filter: blur(18px) saturate(140%);
            -webkit-backdrop-filter: blur(18px) saturate(140%);
          }

          .about-process-panel:hover {
            transform: translateY(-8px) rotateX(2deg) rotateY(-2deg);
            border-color: rgba(139,26,42,0.34);
          }

          .about-process-list {
            display: grid;
            gap: clamp(14px, 1.8vw, 18px);
            margin-top: clamp(22px, 2.4vw, 28px);
          }

          .about-process-item {
            display: grid;
            grid-template-columns: auto 1fr;
            gap: clamp(12px, 1.4vw, 16px);
            align-items: start;
          }

          .about-process-dot {
            width: clamp(34px, 3vw, 38px);
            height: clamp(34px, 3vw, 38px);
            display: grid;
            place-items: center;
            color: #fff;
            background: var(--about-accent);
            box-shadow: 0 18px 40px rgba(139,26,42,0.28);
            flex: 0 0 auto;
          }

          .about-process-item h3 {
            margin: 0 0 6px;
            font-size: clamp(0.86rem, 1vw, 0.96rem);
            font-weight: 600;
            color: var(--about-accent);
          }

          .about-process-item p {
            margin: 0;
            color: var(--about-muted);
            line-height: 1.9;
            font-size: clamp(0.78rem, 1vw, 0.84rem);
          }

          .about-team-shell {
            position: relative;
            min-height: clamp(560px, 48vw, 650px);
            border: 0;
            // background: var(--about-team-bg);
            box-shadow: none;
            overflow: hidden;
            backdrop-filter: blur(10px);
            // -webkit-backdrop-filter: blur(10px);
          }

          .about-team-shell::before {
            content: "";
            position: absolute;
            inset: 0;
            pointer-events: none;
            // background:
            //   radial-gradient(circle at 75% 15%, rgba(139,26,42,0.075), transparent 32%),
            //   radial-gradient(circle at 15% 85%, rgba(0,0,0,0.045), transparent 34%);
          }

          .about-team-grid {
            position: relative;
            height: clamp(520px, 44vw, 600px);
            direction: ltr;
          }

          .about-team-grid * {
            font-family: var(--app-font-family);
          }

          /* Team card text: force ChromaGrid name/work to be visible under the image. */
          .about-team-grid .chroma-info {
            direction: rtl;
            text-align: right;
            color: var(--about-text) !important;
          }

          .about-team-grid .chroma-info .name {
            margin: 0;
            font-weight: 600 !important;
            color: var(--about-accent) !important;
            font-size: clamp(0.84rem, 1vw, 0.96rem) !important;
            line-height: 1.6 !important;
          }

          .about-team-grid .chroma-info .role {
            margin: 0;
            font-weight: 500 !important;
            color: var(--about-muted) !important;
            font-size: clamp(0.72rem, 0.9vw, 0.8rem) !important;
            line-height: 1.7 !important;
          }

          .about-team-grid .chroma-info .handle,
          .about-team-grid .chroma-info .location {
            font-weight: 500 !important;
            color: var(--about-muted) !important;
            font-size: clamp(0.68rem, 0.85vw, 0.76rem) !important;
          }


          .about-team-grid .chroma-grid,
          .about-team-grid [class*="chroma-grid"],
          .about-team-grid [class*="ChromaGrid"] {
            width: 100%;
            max-width: 100%;
            height: 100%;
          }

          @keyframes about-rise {
            from {
              opacity: 0;
              transform: translateY(28px) rotateX(7deg) scale(.985);
            }
            to {
              opacity: 1;
              transform: translateY(0) rotateX(0) scale(1);
            }
          }

          @keyframes about-orb-float {
            from { transform: translate3d(0,0,0) scale(1); }
            to { transform: translate3d(-28px,28px,0) scale(1.12); }
          }

          @media (max-width: 1180px) {
            .about-hero {
              grid-template-columns: minmax(0, 1fr) minmax(300px, 0.86fr);
            }
          }

          @media (max-width: 1050px) {
            .about-hero,
            .about-process {
              grid-template-columns: 1fr;
            }

            .about-copy,
            .about-visual {
              min-height: auto;
            }

            .about-visual {
              height: clamp(360px, 54vw, 520px);
            }

            .about-stats,
            .about-missions {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .about-section-head {
              align-items: start;
              flex-direction: column;
            }

            .about-team-shell {
              min-height: clamp(640px, 78vw, 780px);
            }

            .about-team-grid {
              height: clamp(620px, 74vw, 740px);
            }
          }

          @media (max-width: 760px) {
            .about-wrap {
              width: min(100% - 28px, 1480px);
              padding-top: 28px;
            }

            .about-title {
              font-size: clamp(2.15rem, 13vw, 4.6rem);
            }

            .about-lead {
              text-align: right;
              line-height: 2.05;
            }

            .about-stats,
            .about-missions {
              grid-template-columns: 1fr;
            }

            .about-stat {
              min-height: 112px;
            }

            .about-process-image {
              min-height: 320px;
            }

            .about-process-item {
              grid-template-columns: 1fr;
            }

            .about-process-dot {
              justify-self: start;
            }

            .about-team-shell {
              min-height: clamp(780px, 160vw, 1020px);
            }

            .about-team-grid {
              height: clamp(760px, 155vw, 980px);
            }
          }

          @media (max-width: 520px) {
            .about-wrap {
              width: min(100% - 20px, 1480px);
              padding-top: 22px;
              padding-bottom: 48px;
            }

            .about-copy {
              padding: 22px;
            }

            .about-hero-actions {
              gap: 8px;
            }

            .about-pill {
              width: 100%;
              text-align: center;
            }

            .about-visual {
              height: 350px;
            }

            .about-floating-note {
              width: calc(100% - 24px);
              right: 12px;
              bottom: 12px;
            }

            .about-mission-card,
            .about-process-panel {
              padding: 20px;
            }

            .about-team-shell {
              min-height: clamp(940px, 230vw, 1180px);
            }

            .about-team-grid {
              height: clamp(910px, 220vw, 1140px);
            }
          }

          @media (max-width: 380px) {
            .about-title {
              font-size: clamp(1.9rem, 15vw, 3rem);
            }

            .about-copy {
              padding: 18px;
            }

            .about-visual {
              height: 310px;
            }

            .about-floating-note p {
              display: none;
            }
          }

          @media (hover: none) and (pointer: coarse) {
            .about-copy:hover,
            .about-visual:hover,
            .about-stat:hover,
            .about-mission-card:hover,
            .about-process-panel:hover {
              transform: none;
            }

            .about-visual:hover img,
            .about-process-image:hover img {
              transform: scale(1.05);
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .about-page-redesign *,
            .about-page-redesign::before,
            .about-page-redesign::after {
              animation: none !important;
              transition-duration: 0.01ms !important;
              scroll-behavior: auto !important;
            }
          }

        `}</style>

        <main className="about-wrap">
          <section className="about-hero" aria-label="درباره هلدینگ متا">
            <div className="about-copy">
              <div className="about-eyebrow">META HOLDING</div>
              <h1 className="about-title">
                درباره <span>متا</span>
              </h1>
              <p className="about-lead">
                هلدینگ متا با بیش از پانزده سال سابقه در زمینه طراحی معماری، نظارت و اجرای پروژه‌های ساختمانی،
                یکی از معتبرترین مجموعه‌های فعال در حوزه ساخت و ساز ایران است. رویکرد ما ترکیب خلاقیت معماری
                با دقت مهندسی، جزئیات اجرایی دقیق و پایبندی به اصول پایداری است.
              </p>
              <div className="about-hero-actions" aria-label="ارزش‌های کلیدی متا">
                <span className="about-pill">معماری آینده‌نگر</span>
                <span className="about-pill">طراحی و اجرا</span>
                <span className="about-pill">کیفیت مهندسی</span>
              </div>
            </div>

            <div className="about-visual" aria-hidden="true">
              <img src={heroImage} alt="" />
              <div className="about-visual-shade" />
              <div className="about-floating-note">
                <strong>فرم، عملکرد و دقت</strong>
                <p>
                  ما پروژه‌ها را از ایده اولیه تا جزئیات اجرایی با یک زبان واحد طراحی، مدیریت و کامل می‌کنیم.
                </p>
              </div>
            </div>
          </section>

          <section className="about-stats" aria-label="آمار هلدینگ متا">
            {stats.map((item) => (
              <article className="about-stat" key={item.label}>
                <span className="about-stat-value">{item.value}</span>
                <span className="about-stat-label">{item.label}</span>
              </article>
            ))}
          </section>

          <section className="about-section" aria-label="ماموریت ما">
            <div className="about-section-head">
              <div>
                <p className="about-kicker">MISSION</p>
                <h2 className="about-heading">ماموریت ما</h2>
              </div>
              <p>
                مأموریت متا ساخت تجربه‌هایی است که میان زیبایی، عملکرد، اقتصاد پروژه و آینده‌پذیری تعادل ایجاد کنند.
              </p>
            </div>

            <div className="about-missions">
              {missions.map((item) => (
                <article className="about-mission-card" key={item.title}>
                  <span className="about-mission-number">{item.number}</span>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.body}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="about-section about-process" aria-label="فرآیند طراحی و اجرا">
            <div className="about-process-image" aria-hidden="true">
              <img src={detailImage} alt="" />
            </div>

            <div className="about-process-panel">
              <p className="about-kicker">PROCESS</p>
              <h2 className="about-heading">از کانسپت تا ساخت</h2>
              <p className="about-lead" style={{ marginTop: 18, fontSize: "0.92rem" }}>
                ما مسیر پروژه را شفاف، مرحله‌به‌مرحله و قابل کنترل پیش می‌بریم؛ از تحلیل نیاز کارفرما و طراحی کانسپت
                تا مدارک فاز دو، انتخاب متریال، نظارت و تحویل نهایی.
              </p>

              <div className="about-process-list">
                {[
                  ["۱", "تحلیل و ایده‌پردازی", "شناخت زمین، نیاز کارفرما، محدودیت‌ها و تبدیل آن‌ها به مسیر طراحی."],
                  ["۲", "طراحی دقیق", "توسعه پلان، نما، جزئیات داخلی و اسناد اجرایی با زبان معماری یکپارچه."],
                  ["۳", "نظارت و اجرا", "کنترل کیفیت، هماهنگی تیم‌ها و پایش پروژه تا رسیدن به خروجی نهایی."],
                ].map(([step, title, body]) => (
                  <div className="about-process-item" key={title}>
                    <div className="about-process-dot">{step}</div>
                    <div>
                      <h3>{title}</h3>
                      <p>{body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="about-section" aria-label="تیم ما">
            <div className="about-section-head">
              <div>
                <p className="about-kicker">TEAM</p>
                <h2 className="about-heading">تیم ما</h2>
              </div>
              <p>
                ترکیبی از معماران، طراحان، مهندسان و مدیران پروژه که هرکدام بخشی از دقت، زیبایی و کیفیت نهایی متا را می‌سازند.
              </p>
            </div>

            <div className="about-team-shell">
              <div className="about-team-grid">
                <ChromaGrid
                  items={teamItems}
                  radius={200}
                  damping={0.35}
                  fadeOut={1.15}
                  ease="power3.out"
                />
              </div>
            </div>
          </section>
        </main>
      </div>
    </AppShell>
  );
}

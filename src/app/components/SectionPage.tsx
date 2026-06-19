import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useDark } from "../context";
import { AppShell } from "./AppShell";
import Masonry from "./ui/Masonry";

import galleryAbbeSublett from "../../static/images/1.jpg";
import galleryAbuDhabi from "../../static/images/2.jpg";
import galleryMoonTower from "../../static/images/3.jpg";
import galleryDanielChen from "../../static/images/4.jpg";
import galleryGrantRitchie from "../../static/images/5.jpg";
import galleryJoakimNadell from "../../static/images/6.jpg";
import galleryLanceAnderson from "../../static/images/7.jpg";
import galleryPatrickTomasso from "../../static/images/8.jpg";
import gallerySimoneHutsch from "../../static/images/9.jpg";
import gallerySorasak from "../../static/images/10.jpg";
import gallerySpiralStaircase from "../../static/images/11.jpg";
import galleryStataCenter from "../../static/images/12.jpg";
import gallery13 from "../../static/images/13.jpg";
import gallery14 from "../../static/images/14.jpg";
import gallery15 from "../../static/images/15.jpg";
import gallery16 from "../../static/images/16.jpg";
import gallery17 from "../../static/images/17.jpg";
import gallery18 from "../../static/images/18.jpg";
import gallery19 from "../../static/images/19.jpg";
import gallery20 from "../../static/images/20.jpg";
import gallery21 from "../../static/images/21.jpg";

interface Props {
  section: "tarrahi" | "nezarat" | "ejra";
}

const TABS = [
  { id: "plan", label: "پلان" },
  { id: "nama", label: "نما" },
  { id: "faz", label: "فاز2" },
  { id: "mahvate", label: "محوطه" },
  { id: "tda", label: "طراحی داخلی" },
];

interface Project {
  id: number;
  title: string;
  location: string;
  area: string;
  year: string;
  description: string;
  images: string[];
  thumb: string;
}

const VILLA_IMGS = [
  galleryAbbeSublett,
  galleryAbuDhabi,
  galleryMoonTower,
  galleryDanielChen,
  galleryGrantRitchie,
  galleryJoakimNadell,
  galleryLanceAnderson,
  galleryPatrickTomasso,
  gallerySimoneHutsch,
  gallerySorasak,
  gallerySpiralStaircase,
  galleryStataCenter,
  gallery13,
  gallery14,
  gallery15,
  gallery16,
  gallery17,
  gallery18,
  gallery19,
  gallery20,
  gallery21,
];

const PROJECTS_BY_SECTION: Record<string, Record<string, Project[]>> = {
  tarrahi: {
    plan: [
      { id: 1, title: "ویلا مدرن شمال", location: "رامسر، مازندران", area: "۴۸۰ متر مربع", year: "۱۴۰۲", description: "پروژه طراحی ویلایی مدرن با تأکید بر ارتباط با طبیعت و استفاده از متریال طبیعی. فضاهای داخلی و خارجی به هم پیوند خورده و دیدگاه‌های بصری به دریا و جنگل را به حداکثر رسانده‌اند.", images: [VILLA_IMGS[1], VILLA_IMGS[1], VILLA_IMGS[2]], thumb: VILLA_IMGS[0] },
      { id: 2, title: "مجتمع مسکونی پارسیان", location: "تهران، الهیه", area: "۲۴۰۰ متر مربع", year: "۱۴۰۱", description: "مجتمع مسکونی لوکس شامل ۱۲ واحد با طراحی معاصر. استفاده از نماهای شیشه‌ای و فلزی همراه با فضای سبز مشترک.", images: [VILLA_IMGS[1], VILLA_IMGS[3], VILLA_IMGS[0]], thumb: VILLA_IMGS[1] },
      { id: 3, title: "ویلا کوهستانی دیزین", location: "دیزین، البرز", area: "۳۲۰ متر مربع", year: "۱۴۰۳", description: "ویلای چهار فصله در دامنه کوه‌های البرز. طراحی با الهام از معماری بومی کوهستانی و به‌کارگیری متریال سنگ و چوب محلی.", images: [VILLA_IMGS[2], VILLA_IMGS[4], VILLA_IMGS[5]], thumb: VILLA_IMGS[2] },
      { id: 4, title: "خانه باغ کرج", location: "کرج، مهرشهر", area: "۵۵۰ متر مربع", year: "۱۴۰۰", description: "خانه باغ با فضای سبز گسترده و استخر روباز. ترکیب معماری مدرن با عناصر سنتی ایرانی در طراحی حیاط و باغ.", images: [VILLA_IMGS[3], VILLA_IMGS[0], VILLA_IMGS[1]], thumb: VILLA_IMGS[3] },
      { id: 5, title: "آپارتمان نیاوران", location: "تهران، نیاوران", area: "۱۸۰ متر مربع", year: "۱۴۰۲", description: "آپارتمان لوکس با طراحی داخلی مینیمال. پنجره‌های بزرگ و بالکن‌های فراخ برای بهره‌مندی از منظره کوه‌های شمال تهران.", images: [VILLA_IMGS[4], VILLA_IMGS[2], VILLA_IMGS[3]], thumb: VILLA_IMGS[4] },
      { id: 6, title: "ویلای ساحلی چالوس", location: "چالوس، مازندران", area: "۴۱۰ متر مربع", year: "۱۴۰۱", description: "ویلای ساحلی دو طبقه با دسترسی مستقیم به دریا. سازه فلزی مقاوم در برابر رطوبت ساحلی با نمای کامپوزیت.", images: [VILLA_IMGS[5], VILLA_IMGS[1], VILLA_IMGS[4]], thumb: VILLA_IMGS[5] },
    ],
    nama: [
      { id: 1, title: "برج تجاری آرمان", location: "تهران، جردن", area: "۸۵۰۰ متر مربع", year: "۱۴۰۲", description: "برج ۱۸ طبقه تجاری-اداری با نمای دو پوسته شیشه‌ای. طراحی نما با توجه به کاهش مصرف انرژی و شرایط اقلیمی تهران.", images: [VILLA_IMGS[8], VILLA_IMGS[3]], thumb: VILLA_IMGS[8] },
      { id: 2, title: "هتل بوتیک ولنجک", location: "تهران، ولنجک", area: "۳۲۰۰ متر مربع", year: "۱۴۰۱", description: "هتل بوتیک ۵ ستاره با نمای سنگ ترکیبی و المان‌های فلزی. طراحی با الهام از معماری مدرن ایرانی.", images: [VILLA_IMGS[6], VILLA_IMGS[4]], thumb: VILLA_IMGS[6] },
      { id: 3, title: "برج تجاری آرمان", location: "تهران، جردن", area: "۸۵۰۰ متر مربع", year: "۱۴۰۲", description: "برج ۱۸ طبقه تجاری-اداری با نمای دو پوسته شیشه‌ای. طراحی نما با توجه به کاهش مصرف انرژی و شرایط اقلیمی تهران.", images: [VILLA_IMGS[11], VILLA_IMGS[3]], thumb: VILLA_IMGS[11] },
      { id: 4, title: "هتل بوتیک ولنجک", location: "تهران، ولنجک", area: "۳۲۰۰ متر مربع", year: "۱۴۰۱", description: "هتل بوتیک ۵ ستاره با نمای سنگ ترکیبی و المان‌های فلزی. طراحی با الهام از معماری مدرن ایرانی.", images: [VILLA_IMGS[17], VILLA_IMGS[17]], thumb: VILLA_IMGS[17] },
      { id: 5, title: "برج تجاری آرمان", location: "تهران، جردن", area: "۸۵۰۰ متر مربع", year: "۱۴۰۲", description: "برج ۱۸ طبقه تجاری-اداری با نمای دو پوسته شیشه‌ای. طراحی نما با توجه به کاهش مصرف انرژی و شرایط اقلیمی تهران.", images: [VILLA_IMGS[15], VILLA_IMGS[3]], thumb: VILLA_IMGS[15] },
      { id: 6, title: "هتل بوتیک ولنجک", location: "تهران، ولنجک", area: "۳۲۰۰ متر مربع", year: "۱۴۰۱", description: "هتل بوتیک ۵ ستاره با نمای سنگ ترکیبی و المان‌های فلزی. طراحی با الهام از معماری مدرن ایرانی.", images: [VILLA_IMGS[9], VILLA_IMGS[4]], thumb: VILLA_IMGS[19] },
    ],
    faz: [
      { id: 1, title: "فاز اول مجتمع پرشین", location: "تهران، پونک", area: "۱۲۰۰۰ متر مربع", year: "۱۴۰۰", description: "فاز اول مجتمع مسکونی شامل ۴ بلوک. طراحی فازبندی برای اجرای مرحله‌به‌مرحله با رعایت یکپارچگی بصری.", images: [VILLA_IMGS[2], VILLA_IMGS[5]], thumb: VILLA_IMGS[2] },
      { id: 2, title: "فاز اول مجتمع پرشین", location: "تهران، پونک", area: "۱۲۰۰۰ متر مربع", year: "۱۴۰۰", description: "فاز اول مجتمع مسکونی شامل ۴ بلوک. طراحی فازبندی برای اجرای مرحله‌به‌مرحله با رعایت یکپارچگی بصری.", images: [VILLA_IMGS[16], VILLA_IMGS[5]], thumb: VILLA_IMGS[16] },
      { id: 3, title: "فاز اول مجتمع پرشین", location: "تهران، پونک", area: "۱۲۰۰۰ متر مربع", year: "۱۴۰۰", description: "فاز اول مجتمع مسکونی شامل ۴ بلوک. طراحی فازبندی برای اجرای مرحله‌به‌مرحله با رعایت یکپارچگی بصری.", images: [VILLA_IMGS[11], VILLA_IMGS[5]], thumb: VILLA_IMGS[11] },
    ],
    mahvate: [
      { id: 1, title: "پارک محله فرشته", location: "تهران، فرشته", area: "۲۲۰۰ متر مربع", year: "۱۴۰۳", description: "طراحی محوطه پارک محله‌ای با تأکید بر فضاهای تعاملی. استفاده از گیاهان بومی و سیستم آبیاری هوشمند.", images: [VILLA_IMGS[3], VILLA_IMGS[0]], thumb: VILLA_IMGS[3] },
      { id: 2, title: "باغ ویلا کهن‌سال", location: "اصفهان، جلفا", area: "۳۵۰۰ متر مربع", year: "۱۴۰۲", description: "بازطراحی باغ تاریخی با حفظ درختان کهن‌سال. ایجاد مسیرهای پیاده و عناصر آبی به سبک باغ ایرانی.", images: [VILLA_IMGS[4], VILLA_IMGS[2]], thumb: VILLA_IMGS[4] },
    ],
    tda: [
      { id: 1, title: "دفتر استارتاپ نوآور", location: "تهران، شریعتی", area: "۴۵۰ متر مربع", year: "۱۴۰۳", description: "طراحی داخلی فضای کار مشترک برای استارتاپ‌ها. فضاهای انعطاف‌پذیر با امکان تغییر چیدمان و استفاده از رنگ‌های پویا.", images: [VILLA_IMGS[14], VILLA_IMGS[3]], thumb: VILLA_IMGS[14] },
      { id: 2, title: "رستوران مدرن پارسی", location: "تهران، ونک", area: "۳۸۰ متر مربع", year: "۱۴۰۲", description: "طراحی داخلی رستوران با ترکیب عناصر سنتی ایرانی و مدرن. نورپردازی موضعی و استفاده از کاشی‌های دست‌ساز.", images: [VILLA_IMGS[12], VILLA_IMGS[4]], thumb: VILLA_IMGS[12] },
      { id: 3, title: "دفتر استارتاپ نوآور", location: "تهران، شریعتی", area: "۴۵۰ متر مربع", year: "۱۴۰۳", description: "طراحی داخلی فضای کار مشترک برای استارتاپ‌ها. فضاهای انعطاف‌پذیر با امکان تغییر چیدمان و استفاده از رنگ‌های پویا.", images: [VILLA_IMGS[13], VILLA_IMGS[21]], thumb: VILLA_IMGS[13] },
      { id: 4, title: "رستوران مدرن پارسی", location: "تهران، ونک", area: "۳۸۰ متر مربع", year: "۱۴۰۲", description: "طراحی داخلی رستوران با ترکیب عناصر سنتی ایرانی و مدرن. نورپردازی موضعی و استفاده از کاشی‌های دست‌ساز.", images: [VILLA_IMGS[20], VILLA_IMGS[13]], thumb: VILLA_IMGS[20] },
    ],
  },
  nezarat: {
    plan: [
      { id: 1, title: "نظارت ساختمان صنعتی شهریار", location: "شهریار، البرز", area: "۶۰۰۰ متر مربع", year: "۱۴۰۲", description: "نظارت عالیه و کارگاهی بر اجرای سازه صنعتی. کنترل کیفیت بتن‌ریزی و جوشکاری سازه فلزی.", images: [VILLA_IMGS[0], VILLA_IMGS[2]], thumb: VILLA_IMGS[0] },
      { id: 2, title: "نظارت برج مسکونی سعادت‌آباد", location: "تهران، سعادت‌آباد", area: "۱۴۰۰۰ متر مربع", year: "۱۴۰۱", description: "نظارت بر اجرای ۲۴ طبقه برج مسکونی. پیاده‌سازی سیستم کنترل کیفیت ISO 9001 در تمام مراحل اجرا.", images: [VILLA_IMGS[1], VILLA_IMGS[4]], thumb: VILLA_IMGS[1] },
    ],
    nama: [
      { id: 1, title: "نظارت نمای شیشه‌ای اداری", location: "تهران، میرداماد", area: "۲۸۰۰ متر مربع", year: "۱۴۰۳", description: "نظارت بر نصب سیستم نمای کرتین وال. کنترل کیفیت اجرا، آب‌بندی و انرژی.", images: [VILLA_IMGS[2], VILLA_IMGS[5]], thumb: VILLA_IMGS[2] },
    ],
    faz: [{ id: 1, title: "نظارت فازبندی مجتمع", location: "تهران، شهرک غرب", area: "۹۵۰۰ متر مربع", year: "۱۴۰۱", description: "نظارت بر اجرای سه‌فازه مجتمع تجاری-مسکونی. هماهنگی بین پیمانکاران مختلف.", images: [VILLA_IMGS[3], VILLA_IMGS[0]], thumb: VILLA_IMGS[3] }],
    mahvate: [{ id: 1, title: "نظارت محوطه‌سازی پارک", location: "کرج، مهرشهر", area: "۴۵۰۰ متر مربع", year: "۱۴۰۲", description: "نظارت بر اجرای محوطه‌آرایی و فضای سبز. کنترل اجرای سیستم آبیاری هوشمند.", images: [VILLA_IMGS[4], VILLA_IMGS[1]], thumb: VILLA_IMGS[4] }],
    tda: [],
  },
  ejra: {
    plan: [
      { id: 1, title: "اجرای ویلای شمال", location: "نوشهر، مازندران", area: "۳۶۰ متر مربع", year: "۱۴۰۳", description: "اجرای کامل ویلای مسکونی از پی تا تحویل. سازه بتنی با سقف تیرچه‌بلوک و نمای سنگ ترکیبی.", images: [VILLA_IMGS[3], VILLA_IMGS[0]], thumb: VILLA_IMGS[3] },
      { id: 2, title: "اجرای مجتمع تجاری کیش", location: "کیش، هرمزگان", area: "۸۵۰۰ متر مربع", year: "۱۴۰۲", description: "اجرای مجتمع تجاری در منطقه آزاد کیش. استفاده از سازه فلزی و اتمام کار در ۱۴ ماه.", images: [VILLA_IMGS[4], VILLA_IMGS[1]], thumb: VILLA_IMGS[4] },
    ],
    nama: [{ id: 1, title: "اجرای نمای سنگی", location: "تهران، قیطریه", area: "۱۲۰۰ متر مربع", year: "۱۴۰۳", description: "اجرای نمای سنگ ترکیبی با سیستم درای‌وال. نصب دقیق و رگلاژ سطح.", images: [VILLA_IMGS[5], VILLA_IMGS[2]], thumb: VILLA_IMGS[5] }],
    faz: [],
    mahvate: [{ id: 1, title: "اجرای محوطه ویلا", location: "لواسان، تهران", area: "۲۸۰۰ متر مربع", year: "۱۴۰۲", description: "اجرای محوطه‌سازی کامل شامل کاشت درختان، سنگ‌فرش و آبنمای ورودی.", images: [VILLA_IMGS[0], VILLA_IMGS[3]], thumb: VILLA_IMGS[0] }],
    tda: [{ id: 1, title: "اجرای دکوراسیون هتل", location: "مشهد، خراسان", area: "۶۵۰ متر مربع", year: "۱۴۰۳", description: "اجرای کامل دکوراسیون داخلی هتل ۴ ستاره. نصب کاغذ دیواری، کابینت و روشنایی.", images: [VILLA_IMGS[1], VILLA_IMGS[4]], thumb: VILLA_IMGS[1] }],
  },
};

const TAB_DESCRIPTIONS: Record<string, string> = {
  plan: "پلان در معماری، بازتاب کامل‌ترین هر پروژه است. ماهیت خلاق، توجه به جزئیات، شناخت همه‌جانبه‌نگرانه و چشم‌انداز‌شناختی در یک ساختار منسجم به تصویری قابل‌فهم تبدیل می‌شود. فارغ از این‌که فضا چقدر پیچیده باشد، ارتباط، کاربری و هدف هر بخش جایگاه درستی دارد.",
  nama: "نما آینه تمام‌نمای هویت یک بنا است. انتخاب مصالح، ترکیب بازشوها، بافت و رنگ همگی داستانی را روایت می‌کنند که پیش از ورود به فضا، با بیننده سخن می‌گوید. طراحی نما با توجه به اقلیم، فرهنگ محلی و اصول پایداری.",
  faz: "برنامه‌ریزی فازبندی پروژه، کلید موفقیت در اجرای پروژه‌های بزرگ است. تقسیم هوشمندانه مراحل اجرا، مدیریت منابع بهینه و حفظ کیفیت در هر مرحله از اصول اساسی رویکرد ما است.",
  mahvate: "محوطه‌آرایی پیوند دهنده معماری با طبیعت است. طراحی فضاهای خارجی، مسیرهای پیاده، آبنماها و فضای سبز همگی بخشی از یک روایت یکپارچه‌اند که تجربه فضایی را کامل می‌کند.",
  tda: "طراحی داخلی فضا را به تجربه‌ای زیسته تبدیل می‌کند. انتخاب مصالح، نورپردازی، مبلمان و جزئیات اجرایی همگی در خدمت کیفیت زندگی و کار در فضا هستند.",
};

const ACCENT = "#BD3039";

export function SectionPage({ section }: Props) {
  const { dark } = useDark();
  const [activeTab, setActiveTab] = useState("plan");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [imgIndex, setImgIndex] = useState(0);

  const projects = PROJECTS_BY_SECTION[section]?.[activeTab] ?? [];
  const masonryItems = useMemo(() => projects.map((project, index) => ({
    id: `${section}-${activeTab}-${project.id}`,
    img: project.thumb,
    url: `#${section}-${activeTab}-${project.id}`,
    height: index % 3 === 0 ? 680 : index % 3 === 1 ? 500 : 600,
  })), [activeTab, projects, section]);

  const bg = dark ? "#1a1919" : "#f0efef";
  const text = dark ? "#ffffff" : "#111111";
  const muted = dark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.55)";
  const border = dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)";

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setSelectedProject(null);
    setImgIndex(0);
  };

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
    setImgIndex(0);
  };

  const topTabs = (
    <nav className="section-tabs-responsive flex items-center justify-center gap-8" dir="rtl" aria-label="Project sections">
      {TABS.map(tab => {
        const active = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className="section-top-tab"
            style={{
              position: "relative",
              padding: "0.72rem 0.15rem",
              minWidth: 72,
              color: active ? ACCENT : muted,
              fontWeight: active ? 800 : 700,
              fontSize: "1rem",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--app-font-family)",
              transition: "color 240ms ease, transform 240ms ease",
            }}
          >
            {tab.label}
            <span
              className="section-tab-line section-tab-line-top"
              style={{ opacity: active ? 1 : undefined, transform: active ? "scaleX(1)" : undefined }}
            />
            <span
              className="section-tab-line section-tab-line-bottom"
              style={{ opacity: active ? 1 : undefined, transform: active ? "scaleX(1)" : undefined }}
            />
          </button>
        );
      })}
    </nav>
  );

  return (
    <AppShell centerContent={topTabs}>
      <div
        className="flex flex-col flex-1"
        dir="rtl"
        style={{ fontFamily: "var(--app-font-family)", background: bg, color: text, minHeight: "calc(100vh - 65px)" }}
      >
        <style>{`
          .section-top-tab:hover {
            color: ${ACCENT} !important;
            transform: translateY(-1px);
          }

          .section-tab-line {
            position: absolute;
            left: 0;
            right: 0;
            height: 1px;
            background: ${ACCENT};
            opacity: 0;
            transform: scaleX(0);
            transition: opacity 240ms ease, transform 240ms ease;
            transform-origin: center;
            pointer-events: none;
          }

          .section-tab-line-top {
            top: 0;
          }

          .section-tab-line-bottom {
            bottom: 0;
          }

          .section-top-tab:hover .section-tab-line {
            opacity: 1;
            transform: scaleX(1);
          }

          .projects-masonry-wrap {
            position: relative;
            width: 100%;
          }

          .projects-masonry-wrap a {
            cursor: pointer;
          }


          @media (max-width: 900px) {
            .section-tabs-responsive {
              width: 100% !important;
              max-width: 100% !important;
              justify-content: flex-start !important;
              overflow-x: auto !important;
              overflow-y: hidden !important;
              white-space: nowrap !important;
              -webkit-overflow-scrolling: touch !important;
              scrollbar-width: none !important;
              padding-left: 0.75rem !important;
              padding-right: 0.75rem !important;
              gap: 0.5rem !important;
              border-bottom: none !important;
            }

            .section-tabs-responsive::-webkit-scrollbar {
              display: none !important;
            }

            .section-tabs-responsive button {
              flex: 0 0 auto !important;
              font-size: 0.74rem !important;
              padding-left: 0.65rem !important;
              padding-right: 0.65rem !important;
            }

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
              order: 2 !important;
              width: 100% !important;
              max-width: 100% !important;
              overflow: visible !important;
              padding: 1rem 1rem 2rem !important;
            }
          }

          @media (max-width: 520px) {
            .section-tabs-responsive button {
              font-size: 0.68rem !important;
              padding-left: 0.45rem !important;
              padding-right: 0.45rem !important;
            }

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
                  style={{ borderRadius: 4, aspectRatio: "16/9", background: dark ? "#111" : "#ddd" }}
                >
                  <ImageWithFallback
                    src={selectedProject.images[imgIndex]}
                    alt={selectedProject.title}
                    className="w-full h-full object-cover"
                  />
                  {selectedProject.images.length > 1 && (
                    <>
                      <button
                        onClick={() => setImgIndex(i => (i - 1 + selectedProject.images.length) % selectedProject.images.length)}
                        className="absolute top-1/2 -translate-y-1/2"
                        style={{ right: 10, width: 32, height: 32, background: "rgba(0,0,0,0.45)", border: "none", borderRadius: "50%", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                      >
                        <ChevronRight size={16} />
                      </button>
                      <button
                        onClick={() => setImgIndex(i => (i + 1) % selectedProject.images.length)}
                        className="absolute top-1/2 -translate-y-1/2"
                        style={{ left: 10, width: 32, height: 32, background: "rgba(0,0,0,0.45)", border: "none", borderRadius: "50%", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                        {selectedProject.images.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setImgIndex(i)}
                            style={{ width: i === imgIndex ? 18 : 6, height: 6, borderRadius: 3, background: i === imgIndex ? "#fff" : "rgba(255,255,255,0.4)", border: "none", padding: 0, cursor: "pointer", transition: "width 0.2s" }}
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
                        style={{ width: 64, height: 42, borderRadius: 3, overflow: "hidden", border: i === imgIndex ? `2px solid ${ACCENT}` : `1px solid ${border}`, padding: 0, background: "none", cursor: "pointer" }}
                      >
                        <ImageWithFallback src={img} alt="" className="w-full h-full object-cover" />
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
                        <p style={{ fontSize: "0.68rem", color: muted, margin: "0 0 2px 0" }}>{item.label}</p>
                        <p style={{ fontSize: "0.85rem", fontWeight: 500, margin: 0 }}>{item.value}</p>
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize: "0.82rem", color: muted, lineHeight: 1.9, margin: 0 }}>
                    {selectedProject.description}
                  </p>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3" style={{ color: muted }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", border: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="3" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.2" />
                    <rect x="13" y="3" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.2" />
                    <rect x="3" y="13" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.2" />
                    <rect x="13" y="13" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.2" />
                  </svg>
                </div>
                <p style={{ fontSize: "0.82rem", margin: 0 }}>یک پروژه از گالری انتخاب کنید</p>
              </div>
            )}
          </div>

          {/* Right panel: projects masonry gallery */}
          <div
            className="section-mobile-gallery-column flex flex-col overflow-y-auto"
            dir="rtl"
            style={{ width: "58%", border: "none", padding: "2rem 1.5rem 2rem 2rem" }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div style={{ width: 3, height: 30, background: ACCENT, borderRadius: 2 }} />
              <h2 style={{ fontSize: "clamp(1.4rem, 2.5vw, 1.9rem)", fontWeight: 700, margin: 0 }}>
                {TABS.find(t => t.id === activeTab)?.label}
              </h2>
            </div>

            <p
              className="mb-6"
              style={{ color: muted, fontSize: "0.8rem", lineHeight: 2, margin: "0 0 1.5rem 0" }}
            >
              {TAB_DESCRIPTIONS[activeTab]}
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
                  key={`${section}-${activeTab}`}
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
                    const project = projects.find(projectItem =>
                      item.id === `${section}-${activeTab}-${projectItem.id}`
                    );
                    if (project) handleProjectSelect(project);
                  }}
                />
              </div>
            ) : (
              <p style={{ color: muted, fontSize: "0.82rem" }}>پروژه‌ای برای این بخش ثبت نشده است.</p>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

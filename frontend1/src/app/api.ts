export const API_BASE = (import.meta.env.VITE_API_URL || "https://metaholding.ir/api/api/v1").replace(/\/$/, "");
export const ADMIN_URL = (import.meta.env.VITE_ADMIN_URL || `${API_BASE.replace(/\/api\/v1$/, "")}/admin/`).replace(/([^:]\/)\/+/g, "$1");
const ACCESS_KEY = "meta_access_token";
const REFRESH_KEY = "meta_refresh_token";

export interface ApiUser {
  id: string;
  full_name: string;
  email: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  role: "admin" | "user";
  is_active: boolean;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: ApiUser;
}

export interface TarahiProjectSection {
  id: string;
  project_id: string;
  slug: string;
  name: string;
  description?: string | null;
  display_order: number;
  images: ProjectImage[];
}

export interface NezaratRegion {
  id: string;
  slug: string;
  name: string;
  display_order: number;
  is_active: boolean;
}

export interface ProjectImage {
  id: string;
  section_id?: string | null;
  file_url: string;
  alt_text?: string | null;
  caption?: string | null;
  display_order: number;
  is_cover: boolean;
}

interface BaseProject {
  id: string;
  slug: string;
  name: string;
  metraj?: string | null;
  location?: string | null;
  description: string;
  state: "open" | "closed";
  year?: string | null;
  display_order: number;
  images: ProjectImage[];
  created_at: string;
  updated_at: string;
}

export interface TarahiProject extends BaseProject {
  sections: TarahiProjectSection[];
}

export interface NezaratProject extends BaseProject {
  region_id: string;
  region: NezaratRegion;
  orientation?: string | null;
}

export interface EjraProject extends BaseProject {}
export type ApiProject = TarahiProject | NezaratProject | EjraProject;

export type ExcelCell = string | number | boolean | null;

export interface NezaratWorkbookSheet {
  name: string;
  columns: string[];
  rows: ExcelCell[][];
}

export interface NezaratWorkbook {
  id?: string | null;
  source_filename?: string | null;
  sheets: NezaratWorkbookSheet[];
  created_at?: string | null;
  updated_at?: string | null;
}

export interface NezaratTableRow {
  id: string;
  table_status: "live" | "ended";
  region?: string | null;
  metraj?: string | null;
  allowed_floors?: string | null;
  project_stage?: string | null;
  year?: string | null;
  address?: string | null;
  referral_date?: string | null;
  description?: string | null;
  display_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface PageContent {
  id: string;
  key: string;
  title: string;
  content: Record<string, unknown>;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContactMessage {
  id: string;
  user_id?: string | null;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "new" | "reviewing" | "answered" | "closed";
  admin_reply?: string | null;
  created_at: string;
  updated_at: string;
}

export function getAccessToken() { return localStorage.getItem(ACCESS_KEY); }
export function getRefreshToken() { return localStorage.getItem(REFRESH_KEY); }
export function saveTokens(pair: TokenPair) {
  localStorage.setItem(ACCESS_KEY, pair.access_token);
  localStorage.setItem(REFRESH_KEY, pair.refresh_token);
}
export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  const response = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (!response.ok) {
    clearTokens();
    return false;
  }
  saveTokens(await response.json());
  return true;
}

export async function apiFetch<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const headers = new Headers(init.headers);
  const isForm = init.body instanceof FormData;
  if (!isForm && init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(`${API_BASE}${path}`, { cache: "no-store", ...init, headers });
  if (response.status === 401 && retry && await refreshAccessToken()) return apiFetch<T>(path, init, false);
  if (!response.ok) {
    let detail = `Request failed (${response.status})`;
    try { detail = (await response.json()).detail || detail; } catch { /* no JSON body */ }
    throw new Error(detail);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function mediaUrl(fileUrl?: string | null): string {
  if (!fileUrl) return "";
  if (/^https?:\/\//.test(fileUrl)) return fileUrl;
  // Existing project images live in frontend/src/static/images and are served by Vite/Nginx.
  if (fileUrl.startsWith("/images/")) return fileUrl;
  // Uploaded images are served by the backend media mount.
  const apiUrl = new URL(API_BASE, window.location.origin);
  return new URL(fileUrl, apiUrl.origin).toString();
}

export function projectToView(project: ApiProject) {
  const sorted = [...project.images].sort((a, b) => a.display_order - b.display_order);
  const isTarahi = "sections" in project;
  const cover = sorted.find(image => image.is_cover) || (isTarahi ? undefined : sorted[0]);
  const region = "region" in project ? project.region.slug : "";
  const orientation = "orientation" in project ? project.orientation || "" : "";
  const sections = "sections" in project
    ? [...project.sections]
        .sort((a, b) => a.display_order - b.display_order)
        .map(section => ({
          id: section.id,
          slug: section.slug,
          name: section.name,
          description: section.description || "",
          images: [...section.images]
            .sort((a, b) => a.display_order - b.display_order)
            .map(image => mediaUrl(image.file_url)),
        }))
    : [];
  return {
    id: project.id,
    slug: project.slug,
    title: project.name,
    location: project.location || "—",
    area: project.metraj || "—",
    year: project.year || "—",
    orientation,
    description: project.description,
    state: project.state,
    images: sorted.map(image => mediaUrl(image.file_url)),
    thumb: mediaUrl(cover?.file_url),
    sections,
    region,
  };
}

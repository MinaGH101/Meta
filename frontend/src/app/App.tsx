import { BrowserRouter, Routes, Route } from "react-router";
import { AppProviders } from "./context";
import { LandingPage } from "./components/LandingPage";
import { TarahiPage } from "./components/TarahiPage"
import { NezaratPage } from "./components/NezaratPage";
import { EjraPage } from "./components/EjraPage";
import { AboutPage } from "./components/AboutPage";
import { ContactPage } from "./components/ContactPage";
import { ProfilePage } from "./components/ProfilePage";
import { AuthPage } from "./components/AuthPage";
import { useEffect } from "react";
import { ADMIN_URL } from "./api";

function BackendAdminRedirect() {
  useEffect(() => { window.location.replace(ADMIN_URL); }, []);
  return null;
}

export default function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/tarrahi" element={<TarahiPage section="tarrahi" />} />
          <Route path="/nezarat" element={<NezaratPage section="nezarat" />} />
          <Route path="/ejra" element={<EjraPage section="ejra" />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/admin" element={<BackendAdminRedirect />} />
        </Routes>
      </BrowserRouter>
    </AppProviders>
  );
}

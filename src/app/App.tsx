import { BrowserRouter, Routes, Route } from "react-router";
import { AppProviders } from "./context";
import { LandingPage } from "./components/LandingPage";
import { SectionPage } from "./components/SectionPage";
import { AboutPage } from "./components/AboutPage";
import { ContactPage } from "./components/ContactPage";
import { ProfilePage } from "./components/ProfilePage";
import { AuthPage } from "./components/AuthPage";

export default function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/tarrahi" element={<SectionPage section="tarrahi" />} />
          <Route path="/nezarat" element={<SectionPage section="nezarat" />} />
          <Route path="/ejra" element={<SectionPage section="ejra" />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/auth" element={<AuthPage />} />
        </Routes>
      </BrowserRouter>
    </AppProviders>
  );
}

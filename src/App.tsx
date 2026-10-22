import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { Footer } from "./components/layout/Footer";
import { Header } from "./components/layout/Header";
import { IconRail } from "./components/layout/IconRail";
import { SvgDefs } from "./components/ui/SvgDefs";
import { usePageMeta } from "./hooks/usePageMeta";
import { useReveal } from "./hooks/useReveal";
import { LEGAL_PAGES } from "./data/legal";
import Home from "./pages/Home";

// La 3D est chargée à part : le site s'affiche sans attendre Three.js
const MascotteCanvas = lazy(() => import("./three/MascotteCanvas"));

// L'accueil est dans le paquet principal ; les autres pages sont chargées à la demande,
// puis préchargées dès que le navigateur est au repos (navigation instantanée ensuite)
const PAGE_LOADERS = {
  projects: () => import("./pages/Projects"),
  projectDetail: () => import("./pages/ProjectDetail"),
  skills: () => import("./pages/Skills"),
  about: () => import("./pages/About"),
  contact: () => import("./pages/Contact"),
  legal: () => import("./pages/Legal"),
  notFound: () => import("./pages/NotFound"),
};
const Projects = lazy(PAGE_LOADERS.projects);
const ProjectDetail = lazy(PAGE_LOADERS.projectDetail);
const Skills = lazy(PAGE_LOADERS.skills);
const About = lazy(PAGE_LOADERS.about);
const Contact = lazy(PAGE_LOADERS.contact);
const Legal = lazy(PAGE_LOADERS.legal);
const NotFound = lazy(PAGE_LOADERS.notFound);

/** Lance `callback` une fois la page chargée et le navigateur au repos */
function whenIdle(callback: () => void): () => void {
  let idleId = 0;
  let timer = 0;
  const schedule = () => {
    // Safari n'a pas requestIdleCallback : simple délai à la place
    const requestIdle = window.requestIdleCallback as typeof window.requestIdleCallback | undefined;
    if (requestIdle) idleId = requestIdle(callback, { timeout: 2500 });
    else timer = window.setTimeout(callback, 1200);
  };
  if (document.readyState === "complete") schedule();
  else window.addEventListener("load", schedule, { once: true });
  return () => {
    window.removeEventListener("load", schedule);
    if (idleId) window.cancelIdleCallback(idleId);
    window.clearTimeout(timer);
  };
}

/** Apparitions au scroll : montées avec la page, donc une fois son code chargé */
function Reveal({ pathname }: { pathname: string }) {
  useReveal(pathname);
  return null;
}

export default function App() {
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const firstRender = useRef(true);

  // Changement de page : retour en haut et focus sur le contenu (sauf au premier chargement)
  usePageMeta(location.pathname);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: "instant" });
    mainRef.current?.focus({ preventScroll: true });
  }, [location.pathname]);

  // La 3D (three.js + modèle, environ 1,3 Mo) attend que la page soit affichée
  const [show3d, setShow3d] = useState(false);
  useEffect(() => whenIdle(() => setShow3d(true)), []);

  useEffect(
    () =>
      whenIdle(() => {
        Object.values(PAGE_LOADERS).forEach((load) => void load());
      }),
    [],
  );

  return (
    <>
      <SvgDefs />
      <a className="skip-link" href="#contenu">
        Aller au contenu
      </a>
      <Header />
      <IconRail />
      {show3d && (
        <Suspense fallback={null}>
          <MascotteCanvas />
        </Suspense>
      )}
      <div className="page-shell">
        {/* La clé relance la transition de page à chaque navigation */}
        <main id="contenu" ref={mainRef} key={location.pathname} className="page" tabIndex={-1}>
          <Suspense fallback={null}>
            <Routes location={location}>
              <Route path="/" element={<Home />} />
              <Route path="/projets" element={<Projects />} />
              <Route path="/projets/:slug" element={<ProjectDetail />} />
              <Route path="/competences" element={<Skills />} />
              <Route path="/a-propos" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              {LEGAL_PAGES.map((page) => (
                <Route key={page.path} path={page.path} element={<Legal page={page} />} />
              ))}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Reveal pathname={location.pathname} />
          </Suspense>
        </main>
        <Footer />
      </div>
    </>
  );
}

import { Button } from "../components/ui/Button";
import { Sparkle } from "../components/ui/Sparkle";

export default function NotFound() {
  return (
    <section className="container not-found" aria-labelledby="not-found-title">
      <Sparkle tone="detail" size={18} style={{ right: "20%", top: "18%" }} />
      <header className="page-head">
        <div className="page-head__text">
          <h1 id="not-found-title">
            Niveau <span className="text-gradient">introuvable</span>
          </h1>
          <p className="lead">Cette page n'existe pas, ou plus. Pas de panique : le hub n'est qu'à un clic.</p>
          <div>
            <Button to="/">Retour au hub</Button>
          </div>
        </div>
        <div className="page-head__mascot" data-mascot-anchor="contact" data-mascot-mood="surprise" data-mascot-gaze="left" />
      </header>
    </section>
  );
}

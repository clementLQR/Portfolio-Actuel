import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Blob } from "../components/ui/Blob";
import { OrganicWave, PixelSparkle } from "../components/ui/Decor";
import { Button } from "../components/ui/Button";
import { ChamferCard } from "../components/ui/ChamferCard";
import { Icon } from "../components/ui/Icon";
import { Sparkle } from "../components/ui/Sparkle";
import { CV, EXTERNAL_LINK, SOCIAL_LINKS } from "../data/navigation";
import { useMascotteStore } from "../three/useMascotteStore";
import "./Contact.scss";

type Field = "name" | "email" | "message";
type Values = Record<Field, string>;
type Errors = Partial<Record<Field, string>>;
type Status = "idle" | "sending" | "success" | "error";

const EMPTY: Values = { name: "", email: "", message: "" };
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(values: Values): Errors {
  const errors: Errors = {};
  if (values.name.trim().length < 2) errors.name = "Indiquez votre nom (2 caractères minimum).";
  if (!values.email.trim()) errors.email = "Indiquez votre adresse e-mail.";
  else if (!EMAIL_PATTERN.test(values.email.trim()))
    errors.email = "Cette adresse e-mail ne semble pas valide (exemple : nom@domaine.fr).";
  if (values.message.trim().length < 20) errors.message = "Votre message doit faire au moins 20 caractères.";
  return errors;
}

const LABELS: Record<Field, string> = { name: "Nom*", email: "E-mail*", message: "Message*" };

export default function Contact() {
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>("idle");
  const formRef = useRef<HTMLFormElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const { setMood, pulseMood, resetMood, say } = useMascotteStore.getState();

  useEffect(
    () => () => {
      useMascotteStore.getState().resetMood();
    },
    [],
  );

  const onChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const field = event.target.name as Field;
    const next = { ...values, [field]: event.target.value };
    setValues(next);
    // Une erreur déjà affichée se met à jour pendant la saisie
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: validate(next)[field] }));
  };

  const onBlur = (field: Field) => {
    if (values[field]) setErrors((prev) => ({ ...prev, [field]: validate(values)[field] }));
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const found = validate(values);
    setErrors(found);

    if (Object.keys(found).length > 0) {
      pulseMood("surprise", 2200);
      say("Oups, il manque quelque chose !", 3000);
      // On amène le focus sur le récapitulatif des erreurs
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }

    // Envoi à la fonction serveur (api/contact.js), qui transmet le message par e-mail
    setStatus("sending");
    setMood("reflechie");
    const honeypot = new FormData(event.currentTarget).get("website");
    fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, website: typeof honeypot === "string" ? honeypot : "" }),
    })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error(`HTTP ${response.status}`))))
      .then((result: { ok?: boolean }) => {
        // Seule la réponse de la fonction serveur compte (pas une page HTML renvoyée par erreur)
        if (!result.ok) throw new Error("Réponse inattendue");
        setStatus("success");
        pulseMood("heureuse", 3500);
        say("Message reçu, merci !", 3500);
        setValues(EMPTY);
        formRef.current?.reset();
      })
      .catch(() => {
        // Le message saisi est conservé : le visiteur peut réessayer ou écrire directement
        setStatus("error");
        pulseMood("surprise", 2500);
        say("Oups, le message n'est pas parti !", 3000);
      });
  };

  const errorList = (Object.keys(errors) as Field[]).filter((field) => errors[field]);

  return (
    <div className="contact container">
      {/* Décor pleine largeur : il passe sous le rail jusqu'au bord de l'écran */}
      <div className="page-decor" aria-hidden="true">
        <OrganicWave corner="bottom-left" tone="warm" width="clamp(220px, 30vw, 480px)" />
        <Blob variant="glow-warm" size="36vw" style={{ right: "-14%", top: "10%" }} />
        <Blob variant="planet-blue" size="clamp(130px, 14vw, 220px)" style={{ left: "-7%", bottom: "6%" }} />
      </div>
      <PixelSparkle tone="highlight" pixel={4} style={{ right: "34%", top: "10%" }} />

      <header className="page-head">
        <div className="page-head__text">
          <h1>
            Me <span className="text-gradient">contacter</span>
          </h1>
          <p className="lead">
            Je cherche un stage en développement web de 11 semaines, de mars à juin 2027. Une proposition ou une simple
            question ? Écrivez-moi, je réponds sous 48 heures.
          </p>
        </div>
        <div
          className="page-head__mascot"
          data-mascot-anchor="contact"
          data-mascot-mood="neutre"
          data-mascot-gaze="down-left"
        />
      </header>

      <div className="contact__layout">
        <ChamferCard tone="cyan-violet" className="contact__card">
          {status === "success" ? (
            <div className="contact__success" role="status">
              <Sparkle tone="highlight" size={26} style={{ right: "12%", top: "16%" }} />
              <Sparkle tone="detail" size={16} style={{ left: "14%", top: "30%" }} delay={0.5} />
              <span className="contact__success-icon">
                <Icon name="check" size={32} />
              </span>
              <h2>Message envoyé&nbsp;!</h2>
              <p className="lead">Merci pour votre message. Je reviens vers vous très vite.</p>
              <Button
                variant="secondary"
                icon={null}
                onClick={() => {
                  setStatus("idle");
                  resetMood();
                }}
              >
                Écrire un autre message
              </Button>
            </div>
          ) : (
            <form
              ref={formRef}
              className="contact__form"
              noValidate
              onSubmit={onSubmit}
              aria-busy={status === "sending"}
            >
              {errorList.length > 0 && (
                <div ref={summaryRef} className="contact__summary" role="alert" tabIndex={-1}>
                  <Icon name="alert" size={20} />
                  <div>
                    <p>
                      {errorList.length === 1
                        ? "Un champ est à corriger :"
                        : `${errorList.length} champs sont à corriger :`}
                    </p>
                    <ul>
                      {errorList.map((field) => (
                        <li key={field}>
                          <a href={`#field-${field}`}>{LABELS[field]}</a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <div className="contact__row">
                {(["name", "email"] as const).map((field) => (
                  <div key={field} className={`field${errors[field] ? " field--error" : ""}`}>
                    <label htmlFor={`field-${field}`} className="field__label">
                      {LABELS[field]}
                    </label>
                    <input
                      id={`field-${field}`}
                      name={field}
                      type={field === "email" ? "email" : "text"}
                      autoComplete={field === "email" ? "email" : "name"}
                      className="field__control"
                      value={values[field]}
                      onChange={onChange}
                      onBlur={() => onBlur(field)}
                      aria-invalid={Boolean(errors[field])}
                      aria-describedby={errors[field] ? `error-${field}` : undefined}
                      required
                    />
                    {errors[field] && (
                      <p id={`error-${field}`} className="field__error">
                        {errors[field]}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <div className={`field${errors.message ? " field--error" : ""}`}>
                <label htmlFor="field-message" className="field__label">
                  {LABELS.message}
                </label>
                <textarea
                  id="field-message"
                  name="message"
                  rows={6}
                  className="field__control"
                  value={values.message}
                  onChange={onChange}
                  onBlur={() => onBlur("message")}
                  aria-invalid={Boolean(errors.message)}
                  aria-describedby={errors.message ? "error-message" : "hint-message"}
                  required
                />
                {errors.message ? (
                  <p id="error-message" className="field__error">
                    {errors.message}
                  </p>
                ) : (
                  <p id="hint-message" className="field__hint">
                    20 caractères minimum. Parlez-moi de votre projet, de vos délais et de votre équipe.
                  </p>
                )}
              </div>

              {/* Champ piège : invisible, seuls les robots le remplissent */}
              <div className="contact__trap" aria-hidden="true">
                <label htmlFor="field-website">Site web</label>
                <input id="field-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
              </div>

              <div className="contact__submit">
                <Button type="submit" disabled={status === "sending"}>
                  {status === "sending" ? "Envoi en cours" : "Envoyer"}
                </Button>
                {status === "error" && (
                  <p className="field__error" role="alert">
                    Le message n'a pas pu être envoyé. Réessayez, ou écrivez-moi directement à{" "}
                    <a href={`mailto:${SOCIAL_LINKS.email}`}>{SOCIAL_LINKS.email}</a>.
                  </p>
                )}
              </div>
            </form>
          )}
        </ChamferCard>

        <aside className="contact__aside" aria-label="Autres moyens de contact">
          <Blob variant="planet-blue" size={96} mail style={{ right: "40%", top: "-20%" }} />
          <p className="label">// Autres canaux</p>
          <ul className="contact__links">
            <li>
              <a href={CV.href} download={CV.fileName} className="contact__link">
                <Icon name="download" size={22} />
                <span>
                  <span className="contact__link-title">Mon CV</span>
                  <span className="contact__link-sub">Télécharger en PDF</span>
                </span>
              </a>
            </li>
            <li>
              <a href={`mailto:${SOCIAL_LINKS.email}`} className="contact__link">
                <Icon name="mail" size={22} />
                <span>
                  <span className="contact__link-title">E-mail</span>
                  <span className="contact__link-sub">{SOCIAL_LINKS.email}</span>
                </span>
              </a>
            </li>
            <li>
              <a href={SOCIAL_LINKS.linkedin} {...EXTERNAL_LINK} className="contact__link">
                <Icon name="linkedin" size={22} />
                <span>
                  <span className="contact__link-title">LinkedIn</span>
                  <span className="contact__link-sub">Parcours et recommandations</span>
                  <span className="visually-hidden"> (nouvel onglet)</span>
                </span>
              </a>
            </li>
            <li>
              <a href={SOCIAL_LINKS.github} {...EXTERNAL_LINK} className="contact__link">
                <Icon name="github" size={22} />
                <span>
                  <span className="contact__link-title">GitHub</span>
                  <span className="contact__link-sub">Code et expérimentations</span>
                  <span className="visually-hidden"> (nouvel onglet)</span>
                </span>
              </a>
            </li>
          </ul>
        </aside>
      </div>
    </div>
  );
}

// Fonction serveur Vercel : reçoit le formulaire de contact et l'envoie par e-mail avec Resend.
// Variables d'environnement (réglages du projet sur Vercel) :
// - RESEND_API_KEY : clé d'API Resend (obligatoire)
// - CONTACT_TO : adresse qui reçoit les messages (par défaut clement.lequeurre@gmail.com)
// - CONTACT_FROM : expéditeur (par défaut l'adresse de test de Resend, valable tant qu'aucun domaine n'est vérifié)
// En local, ces variables sont lues dans le fichier .env (jamais versionné).

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

export async function POST(request) {
  let data;
  try {
    data = await request.json();
  } catch {
    return json(400, { error: "Requête invalide." });
  }

  const name = String(data?.name ?? "").trim();
  const email = String(data?.email ?? "").trim();
  const message = String(data?.message ?? "").trim();
  const website = String(data?.website ?? "");

  // Champ piège invisible : seul un robot le remplit. On fait comme si tout s'était bien passé.
  if (website) return json(200, { ok: true });

  // Mêmes règles que dans le navigateur, revérifiées côté serveur
  if (name.length < 2 || name.length > 100) return json(400, { error: "Nom invalide." });
  if (!EMAIL_PATTERN.test(email) || email.length > 200) return json(400, { error: "Adresse e-mail invalide." });
  if (message.length < 20 || message.length > 5000) return json(400, { error: "Message invalide." });

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return json(500, { error: "Envoi non configuré." });

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.CONTACT_FROM || "Portfolio <onboarding@resend.dev>",
      to: [process.env.CONTACT_TO || "clement.lequeurre@gmail.com"],
      // « Répondre » dans la boîte mail écrit directement au visiteur
      reply_to: email,
      subject: `Portfolio : message de ${name}`,
      // Texte brut uniquement : rien de ce qu'écrit le visiteur n'est interprété comme du HTML
      text: `Nom : ${name}\nE-mail : ${email}\n\n${message}`,
    }),
  });

  if (!response.ok) return json(502, { error: "L'envoi a échoué." });
  return json(200, { ok: true });
}

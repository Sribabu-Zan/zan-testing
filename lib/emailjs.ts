/* ───────────────────────────────────────────────────────────────────────────
   EMAILJS

   EmailJS is a browser-side service: the enquiry form posts straight from the
   visitor to their API, so all three values have to reach the client and all
   three are NEXT_PUBLIC_ by necessity, not by oversight. The "public key" is
   named that way by EmailJS for the same reason — it identifies the account,
   it does not authorise anything on its own.

   That does mean anyone can read these out of the bundle and post to the same
   template. The control for that is not secrecy, it is the allow-list:

     EmailJS dashboard -> Account -> Security -> "Allowed origins"

   Add the production domain and nothing else. Without it, a key lifted from
   the bundle can be used to send from any origin, which is how these accounts
   get burned through their quota by spam.

   The values live in .env.local, which is gitignored; .env.example lists the
   names.
   ─────────────────────────────────────────────────────────────────────────── */

export const emailjsConfig = {
  serviceId: process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID ?? "",
  templateId: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID ?? "",
  publicKey: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY ?? "",
} as const;

/**
 * Whether the form can actually send.
 *
 * Read at render time so a build with no credentials degrades to showing the
 * email address instead of a form that fails on submit. A dead form is worse
 * than no form, because the visitor believes they have made contact and stops
 * trying.
 */
export const emailjsReady =
  Boolean(emailjsConfig.serviceId) &&
  Boolean(emailjsConfig.templateId) &&
  Boolean(emailjsConfig.publicKey);

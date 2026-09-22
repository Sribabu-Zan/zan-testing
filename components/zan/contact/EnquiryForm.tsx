"use client";

import {
  useId,
  useState,
  type FocusEvent,
  type FormEvent,
  type FormEventHandler,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, Loader2, TriangleAlert } from "lucide-react";
import { serviceOptions, site } from "@/constants/zan";
import { Button } from "@/components/zan/ui/Button";
import { rememberLead, trackFormSubmission } from "@/lib/analytics";
import { emailjsConfig, emailjsReady } from "@/lib/emailjs";
import { serviceFromPath } from "@/lib/services";
import { useSiteHref } from "@/lib/useSiteHref";
import { cn } from "@/lib/utils";

/* ───────────────────────────────────────────────────────────────────────────
   The enquiry form, wired to EmailJS.

   It used to set window.location.href to a mailto: URL and then call
   setSent(true) on the next line, unconditionally. On a machine with no mail
   handler — desktop Chrome by default, most locked-down work machines, most
   Android phones — nothing opened and the visitor was told the enquiry had
   been sent. Long project descriptions were also truncated silently by the
   query string. Every one of those enquiries was lost.

   EmailJS posts from the browser straight to their API, so there is no route
   of ours in the path and nothing to deploy server-side. The trade is that the
   credentials are in the bundle; see lib/emailjs.ts for why that is expected
   and what actually protects the account.

   Three things this now does that the mailto did not:

     - It refuses to pretend. With no credentials configured it does not render
       a form at all, it renders the address.
     - It reports failure. A rejected send puts the message back in front of
       the visitor with the address to fall back on, instead of a success state
       that did not happen. The mailto survives, but only as "or email us
       directly", never as a submission.
     - It carries a honeypot. Public forms are found by bots within days; a
       field no human can see is the cheapest filter that does not tax people.

   A send that succeeds goes to /thank-you, which is where the Google Ads
   conversion is counted.

   Validation is still the browser's own constraint API (required, type=email,
   pattern, minLength) with the messages written out inline under each field,
   instead of the native bubbles.
   ─────────────────────────────────────────────────────────────────────────── */

type Field = "name" | "email" | "phone" | "service" | "message";
type Control = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
type State = "idle" | "sending" | "error";

const FIELDS: readonly Field[] = ["name", "email", "phone", "service", "message"];
const NOT_SURE = "Not sure yet";
/** Names the row in the GTM container's reports; one form, one name. */
const FORM_NAME = "enquiry_form";

function isControl(el: unknown): el is Control {
  return el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement;
}

function messageFor(el: Control): string | undefined {
  const v = el.validity;
  if (v.valid) return undefined;
  switch (el.name as Field) {
    case "name":
      return "Please tell us your name.";
    case "email":
      return v.valueMissing
        ? "We need an email address to reply to."
        : "That email address looks incomplete. Check it and try again.";
    case "phone":
      return "Use digits, spaces and + ( ) - only.";
    case "service":
      return `Pick the closest service, or “${NOT_SURE}”.`;
    case "message":
      return v.valueMissing
        ? "A line or two about the project helps us reply properly."
        : "Please add a little more detail (at least 10 characters).";
    default:
      return el.validationMessage;
  }
}

const control =
  "w-full rounded-xl border border-line-strong bg-bg px-4 text-body text-ink placeholder:text-muted " +
  "transition-[border-color,box-shadow] duration-200 hover:border-ink/40 " +
  "focus-visible:border-brand-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20 " +
  "aria-invalid:border-danger aria-invalid:focus-visible:ring-danger/15 " +
  "disabled:cursor-not-allowed disabled:opacity-60";

function FieldShell({
  id,
  label,
  optional,
  error,
  className,
  children,
}: {
  id: string;
  label: string;
  optional?: boolean;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-2", className)}>
      <label htmlFor={id} className="flex items-baseline justify-between gap-3 text-small font-medium text-ink">
        {label}
        {optional && <span className="font-mono text-[0.6875rem] tracking-[0.12em] text-muted uppercase">Optional</span>}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-small text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

/** Nothing to send to: the address, rather than a form that cannot work. */
function EmailFallback({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-3xl border border-line bg-bg p-5 shadow-lift sm:p-8", className)}>
      <h3 className="text-h3 text-ink">Email us directly</h3>
      <p className="mt-3 max-w-[46ch] text-body text-ink-2">
        Tell us what you are building and we will come back within 24 hours.
      </p>
      <a
        href={`mailto:${site.email}`}
        className="mt-5 inline-block text-lead font-medium text-brand-ink underline decoration-current/40 underline-offset-4 hover:decoration-current"
      >
        {site.email}
      </a>
    </div>
  );
}

export function EnquiryForm({
  defaultService,
  className,
}: {
  /**
   * The service to open on, from ?from= on the page that rendered this. The
   * page reads it server-side and passes it down, so the right option is in
   * the HTML rather than snapping into place after hydration.
   */
  defaultService?: string;
  className?: string;
}) {
  const uid = useId();
  const id = (f: Field) => `${uid}-${f}`;
  const pathname = usePathname();
  const router = useRouter();
  const href = useSiteHref();

  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [state, setState] = useState<State>("idle");

  /* The page's answer if it has one, otherwise this page's own path, which
     covers the form being rendered on a service page directly. "" keeps the
     "Choose a service" placeholder and the required check that goes with it. */
  const preset = defaultService || serviceFromPath(pathname);

  const check = (el: Control) => {
    const name = el.name as Field;
    const msg = messageFor(el);
    setErrors((prev) => (prev[name] === msg ? prev : { ...prev, [name]: msg }));
  };

  // A field is judged once the visitor leaves it with something in it, then
  // re-judged as they type so the error clears the moment it is fixed.
  const onBlur = (e: FocusEvent<HTMLFormElement>) => {
    const el = e.target;
    if (!isControl(el) || !el.name) return;
    if (el.value === "" && !errors[el.name as Field]) return;
    check(el);
  };
  const onInput: FormEventHandler<HTMLFormElement> = (e) => {
    const el = e.target;
    if (isControl(el) && errors[el.name as Field]) check(el);
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;

    // Read the form NOW. "sending" re-renders every control with `disabled`,
    // and the HTML spec excludes disabled controls from FormData, so reading
    // after that — which is what happens if this waits on the SDK import
    // first — sends a blank enquiry that EmailJS happily answers 200 to.
    const data = new FormData(form);
    const get = (f: Field) => String(data.get(f) ?? "").trim();

    const next: Partial<Record<Field, string>> = {};
    let firstInvalid: Control | null = null;
    for (const f of FIELDS) {
      const el = form.elements.namedItem(f);
      if (!isControl(el)) continue;
      const msg = messageFor(el);
      if (msg) {
        next[f] = msg;
        firstInvalid ??= el;
      }
    }
    setErrors(next);
    if (firstInvalid) {
      setState("idle");
      firstInvalid.focus();
      return;
    }

    // Honeypot: hidden from people, irresistible to bots. It is answered the
    // same way a real send is, so a bot learns nothing from the response about
    // why nothing arrived.
    if (String(data.get("website") ?? "").trim()) {
      router.push(href("/thank-you"));
      return;
    }

    const lead = { name: get("name"), email: get("email"), phone: get("phone") };
    const chosen = get("service");

    /* The variable names the EmailJS template renders, and only those. The
       template predates this build: it was written for the live site's form,
       which sent name / email / phone / businessName / service / message.
       This form has no business field, so businessName travels empty rather
       than missing, and the page the enquiry came from goes at the head of the
       message, since the form appears in two places. */
    const params = {
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      businessName: "",
      service: chosen,
      message: `Sent from: ${window.location.pathname}\n\n${get("message")}`,
    };

    setState("sending");
    try {
      // Imported here rather than at module scope, so the SDK is fetched when
      // someone actually submits and not by every page that renders the form.
      const emailjs = (await import("@emailjs/browser")).default;
      await emailjs.send(emailjsConfig.serviceId, emailjsConfig.templateId, params, {
        publicKey: emailjsConfig.publicKey,
      });

      trackFormSubmission(FORM_NAME, { ...lead, service: chosen, message: get("message") });
      // What /thank-you reports as user_data for Enhanced Conversions.
      rememberLead({ email: lead.email, phone: lead.phone });
      form.reset();
      router.push(href("/thank-you"));
    } catch (err) {
      // EmailJS rejects with { status, text } — "The template ID not found",
      // a quota message, an origin refusal. Without this the visitor sees the
      // error state and nobody else ever learns why.
      console.error("[EnquiryForm] EmailJS send failed", err);
      setState("error");
    }
  };

  if (!emailjsReady) return <EmailFallback className={className} />;

  const busy = state === "sending";
  const invalid = (f: Field) => (errors[f] ? { "aria-invalid": true, "aria-describedby": `${id(f)}-error` } : {});

  return (
    <form
      noValidate
      onSubmit={onSubmit}
      onBlur={onBlur}
      onInput={onInput}
      aria-labelledby={`${uid}-title`}
      className={cn("relative rounded-3xl border border-line bg-bg p-5 shadow-lift sm:p-8", className)}
    >
      <h3 id={`${uid}-title`} className="text-h3 text-ink">
        Project enquiry
      </h3>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <FieldShell id={id("name")} label="Name" error={errors.name}>
          <input
            id={id("name")}
            name="name"
            type="text"
            autoComplete="name"
            required
            disabled={busy}
            pattern=".*\S.*"
            className={cn(control, "h-12")}
            {...invalid("name")}
          />
        </FieldShell>

        <FieldShell id={id("email")} label="Email" error={errors.email}>
          <input
            id={id("email")}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            disabled={busy}
            className={cn(control, "h-12")}
            {...invalid("email")}
          />
        </FieldShell>

        <FieldShell id={id("phone")} label="Phone" optional error={errors.phone}>
          <input
            id={id("phone")}
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            disabled={busy}
            pattern="[0-9+\s\(\)\-]{6,20}"
            className={cn(control, "h-12")}
            {...invalid("phone")}
          />
        </FieldShell>

        <FieldShell id={id("service")} label="Service" error={errors.service}>
          <div className="relative">
            <select
              id={id("service")}
              name="service"
              required
              disabled={busy}
              /* Uncontrolled, so a choice the visitor makes is theirs to keep;
                 the key is what re-opens it on the right option when a
                 client-side navigation brings a different ?from=. */
              key={preset}
              defaultValue={preset}
              className={cn(control, "h-12 cursor-pointer appearance-none pr-11")}
              {...invalid("service")}
            >
              <option value="" disabled>
                Choose a service
              </option>
              {serviceOptions.map((g) => (
                <optgroup key={g.group} label={g.group}>
                  {g.options.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </optgroup>
              ))}
              <option value={NOT_SURE}>{NOT_SURE}</option>
            </select>
            <ChevronDown
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-muted"
              strokeWidth={2}
            />
          </div>
        </FieldShell>

        <FieldShell id={id("message")} label="Project details" error={errors.message} className="sm:col-span-2">
          <textarea
            id={id("message")}
            name="message"
            required
            disabled={busy}
            minLength={10}
            rows={5}
            className={cn(control, "min-h-36 resize-y py-3 leading-relaxed")}
            {...invalid("message")}
          />
        </FieldShell>
      </div>

      {/* Honeypot. Off-screen rather than display:none, because some bots skip
          fields that are not rendered. Hidden from assistive technology and
          skipped by the keyboard, so no person ever meets it. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor={`${uid}-website`}>Do not fill this in</label>
        <input id={`${uid}-website`} name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="mt-7 flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-small text-muted">We reply within 24 hours.</p>
        <Button
          type="submit"
          size="lg"
          disabled={busy}
          arrow={!busy}
          icon={busy ? <Loader2 aria-hidden="true" className="size-4 shrink-0 animate-spin" /> : undefined}
          className="w-full sm:w-auto"
        >
          {busy ? "Sending" : "Send enquiry"}
        </Button>
      </div>

      <div role="alert" className="empty:hidden">
        {state === "error" && (
          <p className="mt-5 flex items-start gap-2.5 rounded-2xl border border-danger/30 bg-danger/5 px-4 py-3 text-small text-ink-2">
            <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-danger" strokeWidth={2} />
            <span>
              That did not send. Please try again, or email us directly at{" "}
              <a
                href={`mailto:${site.email}`}
                className="font-medium text-brand-ink underline decoration-current/40 underline-offset-4 hover:decoration-current"
              >
                {site.email}
              </a>
              .
            </span>
          </p>
        )}
      </div>
    </form>
  );
}

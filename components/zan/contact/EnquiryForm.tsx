"use client";

import { useId, useState, type FocusEvent, type FormEvent, type FormEventHandler, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { serviceOptions, site } from "@/constants/zan";
import { Button } from "@/components/zan/ui/Button";
import { cn } from "@/lib/utils";

/* ───────────────────────────────────────────────────────────────────────────
   The enquiry form. Nothing leaves the page: on a valid submit it opens the
   visitor's own email app with a message to support@ already written. No
   network request, no third-party service.

   Validation is the browser's own constraint API (required, type=email,
   pattern, minLength) with the messages written out inline under each field,
   instead of the native bubbles.
   ─────────────────────────────────────────────────────────────────────────── */

type Field = "name" | "email" | "phone" | "service" | "message";
type Control = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

const FIELDS: readonly Field[] = ["name", "email", "phone", "service", "message"];
const NOT_SURE = "Not sure yet";

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
  "aria-invalid:border-danger aria-invalid:focus-visible:ring-danger/15";

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

export function EnquiryForm({ className }: { className?: string }) {
  const uid = useId();
  const id = (f: Field) => `${uid}-${f}`;
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [sent, setSent] = useState(false);

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

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
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
      setSent(false);
      firstInvalid.focus();
      return;
    }

    const data = new FormData(form);
    const get = (f: Field) => String(data.get(f) ?? "").trim();
    const service = get("service");
    const subject = `Project enquiry: ${service}`;
    const body = [
      `Name: ${get("name")}`,
      `Email: ${get("email")}`,
      `Phone: ${get("phone") || "Not given"}`,
      `Service: ${service}`,
      "",
      "Message:",
      get("message"),
    ].join("\r\n");

    window.location.href = `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  };

  const invalid = (f: Field) => (errors[f] ? { "aria-invalid": true, "aria-describedby": `${id(f)}-error` } : {});

  return (
    <form
      noValidate
      onSubmit={onSubmit}
      onBlur={onBlur}
      onInput={onInput}
      aria-labelledby={`${uid}-title`}
      className={cn("rounded-3xl border border-line bg-bg p-5 shadow-lift sm:p-8", className)}
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
              defaultValue=""
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
            minLength={10}
            rows={5}
            className={cn(control, "min-h-36 resize-y py-3 leading-relaxed")}
            {...invalid("message")}
          />
        </FieldShell>
      </div>

      <div className="mt-7 flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-small text-muted">Opens in your own email app.</p>
        <Button type="submit" size="lg" className="w-full sm:w-auto">
          Send enquiry
        </Button>
      </div>

      <div role="status" aria-live="polite" className="empty:hidden">
        {sent && (
          <p className="mt-5 rounded-2xl border border-line bg-brand-soft/60 px-4 py-3 text-small text-ink-2">
            Your email app should open with this message. If it didn&rsquo;t, write to{" "}
            <a
              href={`mailto:${site.email}`}
              className="font-medium text-brand-ink underline decoration-current/40 underline-offset-4 hover:decoration-current"
            >
              {site.email}
            </a>
            .
          </p>
        )}
      </div>
    </form>
  );
}

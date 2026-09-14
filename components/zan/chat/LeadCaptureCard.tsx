"use client";

import { useState, type FormEvent } from "react";
import { LoaderCircle, Phone, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════════════════════════════
   CONTACT CAPTURE

   Rendered inline in the transcript when the visitor asks for a person.

   A form, not a conversation, for one reason: a phone number is the field where
   "close enough" is worthless. The team can either dial it or cannot. Asking a
   model to pull a number out of "double seven then eight one" is not a
   foundation for a callback, and a typed field can be validated before it is
   ever promised to anyone.
   ═══════════════════════════════════════════════════════════════════════════ */

export interface ContactDetails {
  name: string;
  phone: string;
  email: string;
}

export function LeadCaptureCard({
  initial,
  placeholder,
  onSubmit,
  onCancel,
}: {
  initial: Partial<ContactDetails>;
  /** An example number in the visitor's region, from region.dialCode. */
  placeholder: string;
  onSubmit: (details: ContactDetails) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial.name ?? "");
  const [phone, setPhone] = useState(initial.phone ?? "");
  const [email, setEmail] = useState(initial.email ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    // Validated here as well as on the server — the point of the round trip is
    // a usable number, so the visitor should hear about a bad one immediately.
    const digits = phone.replace(/\D/g, "");
    if (!name.trim()) return setError("Please add your name.");
    if (digits.length < 8 || digits.length > 15) {
      return setError("Please enter a full number including the country code.");
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return setError("That email address does not look right.");
    }

    setBusy(true);
    try {
      await onSubmit({ name: name.trim(), phone: phone.trim(), email: email.trim() });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send. Please try again.");
      setBusy(false);
    }
  };

  const field =
    "w-full rounded-lg border border-line bg-bg px-3 py-2.5 text-[1rem] text-ink outline-none " +
    "transition-colors placeholder:text-muted focus:border-brand-ink";

  return (
    <div className="mb-2 flex justify-start">
      <form
        onSubmit={submit}
        className="relative w-[92%] rounded-lg rounded-tl-none border border-line bg-bg p-4 shadow-sm"
      >
        <div className="flex items-center gap-2">
          <Phone aria-hidden="true" className="size-4 shrink-0 text-brand-ink" />
          <p className="text-small font-semibold text-ink">Where should we call you?</p>
        </div>
        <p className="mt-1.5 text-small leading-relaxed text-ink-2">
          Our team will reach out on WhatsApp or by phone.
        </p>

        <div className="mt-4 space-y-2.5">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            aria-label="Your name"
            autoComplete="name"
            className={field}
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={placeholder}
            aria-label="Phone or WhatsApp number, including country code"
            autoComplete="tel"
            inputMode="tel"
            className={field}
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email (optional)"
            aria-label="Email address, optional"
            autoComplete="email"
            inputMode="email"
            className={field}
          />
        </div>

        {error && (
          <p role="alert" className="mt-3 text-small text-danger">
            {error}
          </p>
        )}

        <div className="mt-4 flex gap-2">
          <button
            type="submit"
            disabled={busy}
            className={cn(
              "inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full",
              "bg-brand text-small font-medium text-on-brand transition-colors duration-300",
              "hover:bg-brand-dark disabled:opacity-60",
            )}
          >
            {busy && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}
            {busy ? "Sending" : "Request a callback"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="h-11 shrink-0 rounded-full px-4 text-small text-ink-2 transition-colors duration-300 hover:text-ink disabled:opacity-60"
          >
            Not now
          </button>
        </div>

        <p className="mt-3 flex items-start gap-1.5 text-eyebrow leading-relaxed tracking-normal text-ink-2">
          <ShieldCheck aria-hidden="true" className="mt-px size-3 shrink-0" />
          Used only to contact you about this enquiry.
        </p>
      </form>
    </div>
  );
}

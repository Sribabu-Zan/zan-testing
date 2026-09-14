import Image from "next/image";
import { LogoLoop } from "@/components/ui/logo-loop";
import { ButtonLink } from "@/components/zan/ui/Button";
import { SectionHeading } from "@/components/zan/ui/SectionHeading";
import { clients, ctas, partnersIntro, type Client } from "@/constants/zan";

/* ───────────────────────────────────────────────────────────────────────────
   PARTNERS (#partners) — the page's strongest trust signal, so it gets the
   brand veil and the gradient hairline: the four client marks, exactly as
   supplied on white plates, in a marquee that scroll velocity speeds up on
   desktop and a hover stops. Reduced motion: one static, centred row.
   ─────────────────────────────────────────────────────────────────────────── */

function Plate({ client, echo = false }: { client: Client; echo?: boolean }) {
  return (
    <figure className="group/plate flex w-48 flex-col items-center sm:w-56 lg:w-64">
      <div className="relative h-32 w-full overflow-hidden rounded-2xl border border-line bg-bg shadow-lift transition-[translate,box-shadow] duration-500 ease-out-expo group-hover/plate:-translate-y-1.5 group-hover/plate:shadow-float sm:h-36 lg:h-44">
        <Image
          src={client.src}
          alt={echo ? "" : client.name}
          fill
          sizes="(min-width: 1024px) 16rem, 14rem"
          className="scale-[1.28] object-contain"
        />
      </div>
      <figcaption className="mt-3 max-w-full text-balance text-center text-[0.8125rem] leading-snug text-ink-2">
        {client.sector}
      </figcaption>
    </figure>
  );
}

export function Partners() {
  return (
    <section
      id="partners"
      className="relative overflow-clip border-brand-gradient-t bg-brand-veil py-section"
    >
      <div className="container-zan relative">
        <SectionHeading
          eyebrow={partnersIntro.eyebrow}
          title={partnersIntro.title}
          lead={partnersIntro.lead}
          align="center"
        />
      </div>

      <LogoLoop
        className="mt-12 lg:mt-16"
        viewportClassName="py-6"
        ariaLabel="Clients"
        pauseLabel="Pause the client logos"
        itemClassName="px-2 sm:px-3 lg:px-4"
        items={clients.map((c) => (
          <Plate key={c.name} client={c} />
        ))}
        echo={clients.map((c) => (
          <Plate key={c.name} client={c} echo />
        ))}
      />

      <div className="container-zan relative mt-10 flex justify-center lg:mt-14">
        <ButtonLink href={ctas.project.href} size="lg">
          {ctas.project.label}
        </ButtonLink>
      </div>
    </section>
  );
}

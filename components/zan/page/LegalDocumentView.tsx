import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PageHero } from "@/components/zan/page/PageHero";
import { Reveal } from "@/components/zan/page/Reveal";
import { HeroLinks, HeroPanel } from "@/components/zan/page/HeroPanel";
import { legalIntro, legalSlugs, type LegalSlug } from "@/constants/pages";
import { legalDocuments, type LegalBlock } from "@/constants/legal";
import { site } from "@/constants/zan";
import { pageMetadata } from "@/lib/metadata";

/** Title and description for a policy page, so the five routes stay one-liners. */
export function legalMetadata(slug: LegalSlug): Metadata {
  return pageMetadata({
    title: legalDocuments[slug].title,
    description: `${legalDocuments[slug].title} for ${site.name}. ${legalIntro[slug]}`,
  });
}

/**
 * Runs of consecutive `li` blocks become one list. The documents are stored
 * flat (see constants/legal.ts), and a bullet on its own would otherwise lose
 * both its list semantics and its indent.
 */
function group(blocks: readonly LegalBlock[]): ReactNode[] {
  const out: ReactNode[] = [];
  let bullets: string[] = [];

  const flush = () => {
    if (!bullets.length) return;
    out.push(
      <ul key={`ul-${out.length}`} className="mt-4 space-y-2.5 text-body text-ink-2">
        {bullets.map((text, i) => (
          <li key={i} className="flex gap-3">
            <span aria-hidden="true" className="mt-[0.6em] size-1.5 shrink-0 rounded-full bg-brand" />
            <span>{text}</span>
          </li>
        ))}
      </ul>,
    );
    bullets = [];
  };

  for (const block of blocks) {
    if (block.tag === "li") {
      bullets.push(block.text);
      continue;
    }
    flush();
    if (block.tag === "h2") {
      out.push(
        <h2 key={out.length} className="mt-14 font-display text-h2 text-balance text-ink first:mt-0">
          {block.text}
        </h2>,
      );
    } else if (block.tag === "h3") {
      out.push(
        <h3 key={out.length} className="mt-9 font-display text-h3 font-semibold text-ink">
          {block.text}
        </h3>,
      );
    } else if (block.tag === "h4") {
      out.push(
        <h4 key={out.length} className="mt-7 font-mono text-eyebrow text-muted uppercase">
          {block.text}
        </h4>,
      );
    } else {
      out.push(
        <p key={out.length} className="mt-4 text-body text-ink-2">
          {block.text}
        </p>,
      );
    }
  }
  flush();
  return out;
}

/**
 * One of the five policies. The text is legally operative and is rendered
 * exactly as it is stored: this component only decides the typography.
 */
export function LegalDocumentView({ slug }: { slug: LegalSlug }) {
  const doc = legalDocuments[slug];
  return (
    <main id="main">
      <PageHero
        eyebrow="Legal"
        title={[doc.title]}
        lead={legalIntro[slug]}
        trail={[
          { label: "Home", href: "/" },
          { label: doc.title, href: `/${slug}` },
        ]}
        aside={
          <HeroPanel title="The other policies">
            <HeroLinks
              items={legalSlugs
                .filter((s) => s !== slug)
                .map((s) => ({ label: legalDocuments[s].title, href: `/${s}`, note: legalIntro[s] }))}
            />
          </HeroPanel>
        }
      >
        <p className="mt-8 inline-flex items-center gap-2 rounded-full border border-line-strong bg-bg px-4 py-2 text-small text-ink-2">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-brand" />
          Effective {doc.effective}
        </p>
      </PageHero>

      <section className="border-t border-line bg-bg py-[clamp(3.5rem,2.6rem+3.8vw,6rem)]">
        <div className="container-zan">
          <Reveal className="max-w-[72ch]">{group(doc.blocks)}</Reveal>
        </div>
      </section>
    </main>
  );
}

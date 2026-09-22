import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agent Console",
  // Internal tooling must never be indexed, and this is the one place the site
  // deliberately opts out of the SEO work the rest of it does.
  robots: { index: false, follow: false, nocache: true },
};

/**
 * The console sits outside the marketing chrome on purpose: no navbar, no
 * footer, no scroll smoothing. It is a tool, and every pixel of the site's
 * furniture is a pixel of transcript an agent cannot read.
 */
export default function AgentLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-svh bg-surface">{children}</div>;
}

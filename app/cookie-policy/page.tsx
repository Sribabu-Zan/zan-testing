import type { Metadata } from "next";
import { LegalDocumentView, legalMetadata } from "@/components/zan/page/LegalDocumentView";

export function generateMetadata(): Promise<Metadata> {
  return legalMetadata("cookie-policy");
}

export default function CookiePolicyPage() {
  return <LegalDocumentView slug="cookie-policy" />;
}

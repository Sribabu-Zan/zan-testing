import type { Metadata } from "next";
import { LegalDocumentView, legalMetadata } from "@/components/zan/page/LegalDocumentView";

export const metadata: Metadata = legalMetadata("cookie-policy");

export default function CookiePolicyPage() {
  return <LegalDocumentView slug="cookie-policy" />;
}

import type { Metadata } from "next";
import { LegalDocumentView, legalMetadata } from "@/components/zan/page/LegalDocumentView";

export const metadata: Metadata = legalMetadata("terms-of-service");

export default function TermsOfServicePage() {
  return <LegalDocumentView slug="terms-of-service" />;
}

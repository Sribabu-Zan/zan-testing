import type { Metadata } from "next";
import { LegalDocumentView, legalMetadata } from "@/components/zan/page/LegalDocumentView";

export function generateMetadata(): Promise<Metadata> {
  return legalMetadata("terms-of-service");
}

export default function TermsOfServicePage() {
  return <LegalDocumentView slug="terms-of-service" />;
}

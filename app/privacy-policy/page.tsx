import type { Metadata } from "next";
import { LegalDocumentView, legalMetadata } from "@/components/zan/page/LegalDocumentView";

export function generateMetadata(): Promise<Metadata> {
  return legalMetadata("privacy-policy");
}

export default function PrivacyPolicyPage() {
  return <LegalDocumentView slug="privacy-policy" />;
}

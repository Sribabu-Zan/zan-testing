import type { Metadata } from "next";
import { LegalDocumentView, legalMetadata } from "@/components/zan/page/LegalDocumentView";

export const metadata: Metadata = legalMetadata("privacy-policy");

export default function PrivacyPolicyPage() {
  return <LegalDocumentView slug="privacy-policy" />;
}

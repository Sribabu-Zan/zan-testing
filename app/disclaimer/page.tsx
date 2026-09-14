import type { Metadata } from "next";
import { LegalDocumentView, legalMetadata } from "@/components/zan/page/LegalDocumentView";

export const metadata: Metadata = legalMetadata("disclaimer");

export default function DisclaimerPage() {
  return <LegalDocumentView slug="disclaimer" />;
}

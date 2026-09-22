import type { Metadata } from "next";
import { LegalDocumentView, legalMetadata } from "@/components/zan/page/LegalDocumentView";

export function generateMetadata(): Promise<Metadata> {
  return legalMetadata("disclaimer");
}

export default function DisclaimerPage() {
  return <LegalDocumentView slug="disclaimer" />;
}

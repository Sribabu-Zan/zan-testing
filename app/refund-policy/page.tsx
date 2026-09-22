import type { Metadata } from "next";
import { LegalDocumentView, legalMetadata } from "@/components/zan/page/LegalDocumentView";

export function generateMetadata(): Promise<Metadata> {
  return legalMetadata("refund-policy");
}

export default function RefundPolicyPage() {
  return <LegalDocumentView slug="refund-policy" />;
}

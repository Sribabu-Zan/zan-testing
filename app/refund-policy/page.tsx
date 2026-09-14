import type { Metadata } from "next";
import { LegalDocumentView, legalMetadata } from "@/components/zan/page/LegalDocumentView";

export const metadata: Metadata = legalMetadata("refund-policy");

export default function RefundPolicyPage() {
  return <LegalDocumentView slug="refund-policy" />;
}

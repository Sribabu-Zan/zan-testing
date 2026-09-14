"use client";

import Image from "next/image";
import { useRegion } from "@/lib/region";
import { cn } from "@/lib/utils";

/**
 * The region's real lockup: "zan services", or "zan Verse Technology" in the
 * UAE, where that is the trading name. Both files share one aspect ratio, so
 * a region switch never shifts the layout.
 */
export function ZanLogo({ className, eager = false }: { className?: string; eager?: boolean }) {
  const region = useRegion();
  return (
    <Image
      src={region.logo.src}
      alt={region.brandName}
      width={region.logo.width}
      height={region.logo.height}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : undefined}
      sizes="160px"
      className={cn("h-8 w-auto select-none", className)}
      draggable={false}
    />
  );
}

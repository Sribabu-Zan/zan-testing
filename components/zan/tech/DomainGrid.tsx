"use client";

import { motion } from "framer-motion";
import { techDomains } from "@/constants/zan";
import { ZanIcon } from "@/components/zan/ui/icons";

const EASE = [0.16, 1, 0.3, 1] as const;

/** The stack by domain — the accessible, indexable version of the ring above. */
export function DomainGrid() {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {techDomains.map((d, i) => (
        <motion.li
          key={d.id}
          data-reveal
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "0px 0px -8% 0px" }}
          transition={{ duration: 0.7, ease: EASE, delay: (i % 4) * 0.06 }}
          className="flex flex-col rounded-2xl border border-line bg-bg p-6 shadow-lift"
        >
          <div className="flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-ink">
              <ZanIcon name={d.icon} className="size-5" />
            </span>
            <h3 className="text-h3 text-ink">{d.label}</h3>
          </div>
          <p className="mt-4 text-small text-ink-2">{d.blurb}</p>
          <ul className="mt-5 flex flex-wrap gap-1.5" aria-label={`${d.label} stack`}>
            {d.stack.map((s) => (
              <li
                key={s}
                className="rounded-full border border-line bg-surface px-2.5 py-1 font-mono text-[0.6875rem] leading-none text-ink-2"
              >
                {s}
              </li>
            ))}
          </ul>
        </motion.li>
      ))}
    </ul>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { processSteps } from "@/constants/zan";
import { useBrandPalette } from "@/lib/region";
import { cn } from "@/lib/utils";
import { drawScreen, FALLBACK_FONTS, resolveFonts, SCREEN_H, SCREEN_W } from "./screens";
import "./process.css";

const SCALE = 0.5;

/**
 * A laptop built from four CSS planes: the WebGL laptop's stand-in on phones
 * without a capable GPU, and its placeholder while the model loads. Its screen
 * is the same 2D drawing the 3D laptop uses. The turn comes from the
 * --proc-yaw / --proc-pitch custom properties on an ancestor, so scrolling
 * never re-renders it.
 */
export function CssLaptop({ step, hidden = false }: { step: number; hidden?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const palette = useBrandPalette();
  const [fontsReady, setFontsReady] = useState(false);

  useEffect(() => {
    let live = true;
    document.fonts?.ready.then(() => {
      if (live) setFontsReady(true);
    });
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    drawScreen(ctx, processSteps, step, palette, fontsReady ? resolveFonts() : FALLBACK_FONTS);
  }, [step, palette, fontsReady]);

  return (
    <div aria-hidden="true" className={cn("zan-proc-css", hidden && "opacity-0")}>
      <div className="zan-proc-css__floor" />
      <div className="zan-proc-css__rig">
        <div className="zan-proc-css__base">
          <div className="zan-proc-css__keys" />
          <div className="zan-proc-css__pad" />
        </div>
        <div className="zan-proc-css__lid">
          <div className="zan-proc-css__back" />
          <div className="zan-proc-css__front">
            <canvas ref={canvasRef} width={SCREEN_W * SCALE} height={SCREEN_H * SCALE} />
          </div>
        </div>
      </div>
    </div>
  );
}

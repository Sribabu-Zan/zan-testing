"use client";

import { createContext, useContext } from "react";
import type { MotionValue } from "framer-motion";

/**
 * Progress (0..1) of the pinned scroll scene around a component — the hero's
 * FrameToFullscreen provides it, so what is inside the frame can react to the
 * frame's choreography (the project board counts its figures up at full
 * screen). It holds -1 while no pinned scene is running: touch layouts,
 * reduced motion, before hydration.
 */
export const ContainerScrollContext = createContext<MotionValue<number> | null>(null);

export const useContainerScroll = () => useContext(ContainerScrollContext);

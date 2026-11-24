"use client";

import dynamic from "next/dynamic";

/* WebGL scenes are client-only: skip prerendering. */
export const VaultClient = dynamic(() => import("./vault/VaultExperience"), { ssr: false });
export const NeuralClient = dynamic(() => import("./neural/NeuralExperience"), { ssr: false });

"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

const everflowScriptId = "everflow-sdk";
const everflowScriptSrc = "https://www.jk8gcxs.com/scripts/main.js";

function loadEverflowSdk() {
  if (typeof document === "undefined") return Promise.resolve();
  const ef = (window as typeof window & {
    EF?: { conversion?: (payload: Record<string, number | string>) => unknown };
  }).EF;
  if (ef?.conversion) return Promise.resolve();

  return new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById(
      everflowScriptId,
    ) as HTMLScriptElement | null;

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = everflowScriptId;
    script.type = "text/javascript";
    script.async = true;
    script.src = everflowScriptSrc;
    script.onload = () => resolve();
    script.onerror = () => reject();
    document.head.appendChild(script);
  });
}

export default function EverflowConversionTracker() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("everflow_conversion") !== "1") return;
    if (searchParams.get("everflow_source") !== "n1") return;

    const leadId = searchParams.get("lead_id") || "unknown";
    const storageKey = `bf_everflow_conversion_${leadId}`;
    if (window.sessionStorage.getItem(storageKey)) return;

    async function fireConversion() {
      await loadEverflowSdk();

      const ef = (window as typeof window & {
        EF?: {
          conversion?: (payload: Record<string, number | string>) => unknown;
        };
      }).EF;
      if (!ef?.conversion) {
        throw new Error("Everflow conversion SDK is not available.");
      }

      await Promise.resolve(ef.conversion({ offer_id: 3765 }));
      window.sessionStorage.setItem(storageKey, "1");
    }

    void fireConversion().catch((error) => {
      console.error("Everflow conversion failed", error);
    });
  }, [searchParams]);

  return null;
}

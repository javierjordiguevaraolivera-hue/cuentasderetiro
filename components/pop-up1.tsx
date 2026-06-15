"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import {
  createEventId,
  getUtmParams,
  pushGtmEvent,
  type GtmEventPayload,
} from "@/lib/gtm-events";

const defaultPhoneNumber =
  process.env.NEXT_PUBLIC_PAY_PER_CALL_PHONE_NUMBER ||
  process.env.NEXT_PUBLIC_CALL_PHONE_E164 ||
  "+18882882203";
const defaultRingbaCampaignId =
  process.env.NEXT_PUBLIC_RINGBA_CAMPAIGN_ID || "";

const qualificationChecks = [
  { label: "Edad", result: "success" },
  { label: "Elegibilidad por estado y ciudad", result: "success" },
  { label: "Beneficio estimado", result: "success" },
  { label: "Beneficiario en caso de fallecimiento", result: "missing" },
] as const;

type PopUp1Props = {
  open: boolean;
  firstName?: string;
  goal?: string;
  title?: string;
  description?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  leadId?: string;
  applicationNumber?: string;
  phoneNumber?: string;
  ringbaCampaignId?: string;
  ringbaTags?: Record<string, string>;
  continueUrl?: string;
};

function normalizePhoneDigits(value?: string | null) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) return digits;
  if (digits.length === 10) return `1${digits}`;
  return digits;
}

function getRingbaPrintedNumber() {
  if (typeof document === "undefined") return "";

  const phoneNodes = Array.from(
    document.querySelectorAll<HTMLElement>("[data-popup1-ringba-phone]"),
  );

  for (const node of phoneNodes) {
    const href = node instanceof HTMLAnchorElement ? node.href : "";
    const candidates = [href, node.textContent || ""].map(
      normalizePhoneDigits,
    );

    for (const candidate of candidates) {
      if (/^1[2-9]\d{2}[2-9]\d{6}$/.test(candidate)) return candidate;
    }
  }

  return "";
}

function getUrlParams() {
  if (typeof window === "undefined") return {};
  return Object.fromEntries(new URLSearchParams(window.location.search).entries());
}

export function LockIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-[18px] w-[14px] shrink-0 text-[#7b8494]"
      fill="currentColor"
      viewBox="0 0 14 18"
    >
      <path d="M7 0a5 5 0 0 0-5 5v3H1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1h-1V5a5 5 0 0 0-5-5Zm3 8H4V5a3 3 0 0 1 6 0v3Z" />
    </svg>
  );
}

export default function PopUp1({
  open,
  title,
  description,
  primaryLabel = "Hablar con un asesor",
  secondaryLabel = "Continuar con mi aplicación",
  leadId = "",
  applicationNumber = "",
  phoneNumber = defaultPhoneNumber,
  ringbaCampaignId = defaultRingbaCampaignId,
  ringbaTags = {},
  continueUrl = "/thanks/call2",
}: PopUp1Props) {
  const router = useRouter();
  const primaryLinkRef = useRef<HTMLAnchorElement | null>(null);
  const hasSentPrintedNumberRef = useRef(false);
  const printedNumberRef = useRef("");
  const [resolvedCheckCount, setResolvedCheckCount] = useState(0);
  const [showActions, setShowActions] = useState(false);
  const [loadingDotCount, setLoadingDotCount] = useState(1);
  const ringbaScriptUrl = /^CA[a-zA-Z0-9]+$/.test(ringbaCampaignId)
    ? `//b-js.ringba.com/${ringbaCampaignId}`
    : "";

  useEffect(() => {
    if (!open) return;

    router.prefetch(continueUrl);
  }, [continueUrl, open, router]);

  useEffect(() => {
    if (!open) return;

    const basePhoneNumber = normalizePhoneDigits(phoneNumber);

    function sendPrintedNumber(printedNumber: string) {
      if (hasSentPrintedNumberRef.current) return;
      if (!/^1[2-9]\d{2}[2-9]\d{6}$/.test(printedNumber)) return;

      hasSentPrintedNumberRef.current = true;
      printedNumberRef.current = printedNumber;
      primaryLinkRef.current?.setAttribute("href", `tel:+${printedNumber}`);

      try {
        window.sessionStorage.setItem(
          "bf_last_printed_number",
          printedNumber,
        );
        if (leadId) {
          window.sessionStorage.setItem(
            `bf_printed_number_${leadId}`,
            printedNumber,
          );
        }
      } catch {
        // Best effort to keep the following page visually consistent.
      }

      if (!leadId) return;

      void fetch("/api/call-attribution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId,
          funnelId: ringbaTags.funnel_id,
          applicationId: applicationNumber,
          printedNumber,
          page: window.location.pathname || "/",
        }),
        keepalive: true,
      }).catch(() => {
        hasSentPrintedNumberRef.current = false;
      });
    }

    function syncPrimaryPhone() {
      const printedNumber = getRingbaPrintedNumber();
      if (!printedNumber || printedNumber === basePhoneNumber) return;
      sendPrintedNumber(printedNumber);
    }

    const observer = new MutationObserver(syncPrimaryPhone);
    observer.observe(document.body, {
      attributes: true,
      childList: true,
      characterData: true,
      subtree: true,
    });

    const intervalId = window.setInterval(syncPrimaryPhone, 250);
    const timeoutId = window.setTimeout(() => {
      sendPrintedNumber(basePhoneNumber);
      window.clearInterval(intervalId);
      observer.disconnect();
    }, 10000);

    syncPrimaryPhone();

    return () => {
      observer.disconnect();
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, [
    applicationNumber,
    leadId,
    open,
    phoneNumber,
    ringbaTags.funnel_id,
  ]);

  useEffect(() => {
    if (!open) return;

    const timeoutIds: number[] = [
      window.setTimeout(() => {
        setResolvedCheckCount(0);
        setShowActions(false);
      }, 0),
    ];

    qualificationChecks.forEach((_, index) => {
      const stepStart = index * 1900;
      timeoutIds.push(
        window.setTimeout(() => {
          setResolvedCheckCount(index + 1);
        }, stepStart + 1150),
      );
    });
    timeoutIds.push(
      window.setTimeout(() => {
        setShowActions(true);
      }, qualificationChecks.length * 1900),
    );

    return () => {
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const intervalId = window.setInterval(() => {
      setLoadingDotCount((count) => (count >= 3 ? 1 : count + 1));
    }, 800);

    return () => window.clearInterval(intervalId);
  }, [open]);

  if (!open) return null;

  const serializedRingbaTags = JSON.stringify({
    ...getUrlParams(),
    ...(leadId ? { lead_id: leadId } : {}),
    ...ringbaTags,
    btn_source: "pop_up",
  });
  const isQualificationComplete =
    resolvedCheckCount === qualificationChecks.length;

  function handleCallClick() {
    const ringbaWindow = window as Window & {
      _rgba_tags?: Array<Record<string, string>>;
    };
    ringbaWindow._rgba_tags = ringbaWindow._rgba_tags || [];
    ringbaWindow._rgba_tags.push({ btn_source: "pop_up" });

    const printedNumber =
      printedNumberRef.current || normalizePhoneDigits(phoneNumber);
    const eventPayload: GtmEventPayload = {
      event_id: createEventId("contact"),
      funnel_id: ringbaTags.funnel_id || "popup",
      lead_id: leadId || undefined,
      external_id: leadId || undefined,
      ringba_phone_number: printedNumber,
      country: "us",
      ...getUtmParams(),
    };

    pushGtmEvent("Contact", eventPayload);
  }

  function handleContinueClick() {
    router.push(continueUrl);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4">
      <Script id="pop-up1-ringba-tags" strategy="afterInteractive">
        {`
          window._rgba_tags = window._rgba_tags || [];
          window._rgba_tags.push(${serializedRingbaTags});
        `}
      </Script>
      {ringbaScriptUrl ? (
        <Script
          id="pop-up1-ringba-number-pool"
          src={ringbaScriptUrl}
          strategy="afterInteractive"
        />
      ) : null}
      <style jsx>{`
        @keyframes popup1-call-wave {
          0%,
          18% {
            opacity: 0;
          }
          28%,
          70% {
            opacity: 1;
          }
          82%,
          100% {
            opacity: 0;
          }
        }

        .popup1-call-wave {
          animation: popup1-call-wave 3.2s ease-in-out infinite;
          stroke-width: 3;
        }

        .popup1-call-wave-2 {
          animation-delay: 0.4s;
        }

        .popup1-call-wave-3 {
          animation-delay: 0.8s;
        }

        @media (prefers-reduced-motion: reduce) {
          .popup1-call-wave {
            animation: none;
            opacity: 1;
          }
        }
      `}</style>

      <a
        aria-hidden="true"
        className="pointer-events-none absolute h-px w-px overflow-hidden opacity-0"
        data-popup1-ringba-phone
        href={`tel:${phoneNumber}`}
        tabIndex={-1}
      >
        {phoneNumber}
      </a>

      <div
        aria-modal="true"
        className="w-full max-w-[420px] rounded-[18px] bg-white p-6 text-center shadow-[0_24px_70px_rgba(0,0,0,0.24)] transition-[background-image] duration-700"
        role="dialog"
        style={{
          backgroundImage: isQualificationComplete
            ? "radial-gradient(circle at center, #ffffff 42%, #ffffff 62%, rgba(254,226,226,0.52) 100%)"
            : "none",
        }}
      >
        {isQualificationComplete ? (
          <div className="mx-auto mb-5 flex h-[64px] w-[64px] animate-[fade-up_.3s_ease-out] items-center justify-center rounded-full bg-[#fee2e2] text-[#ef4444]">
            <svg
              aria-hidden="true"
              className="h-8 w-8"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="3.4"
              viewBox="0 0 24 24"
            >
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </div>
        ) : (
          <Image
            alt="Procesando solicitud"
            className="mx-auto mb-5 h-[64px] w-[64px]"
            height={300}
            priority
            src="/media/vT8DJ.gif"
            unoptimized
            width={300}
          />
        )}

        <h2 className="flex items-baseline justify-center text-[24px] font-black leading-[1.12] tracking-[-0.015em] text-[#101820]">
          {title ? (
            title
          ) : (
            <>
              <span>Verificando elegibilidad</span>
              <span className="inline-block w-[0.9em] text-left">
                {".".repeat(loadingDotCount)}
              </span>
            </>
          )}
        </h2>

        {isQualificationComplete ? (
          <div className="mx-auto mt-4 flex max-w-[300px] items-center justify-center gap-2 text-[#273449]">
            <span className="relative flex h-7 w-8 shrink-0 items-center justify-center text-[#f5b800]">
              <svg
                aria-hidden="true"
                className="absolute h-7 w-8"
                fill="currentColor"
                viewBox="0 0 24 22"
              >
                <path d="M10.3 2.8a2 2 0 0 1 3.4 0l9.1 15.4a2 2 0 0 1-1.7 3H2.9a2 2 0 0 1-1.7-3l9.1-15.4Z" />
              </svg>
              <span className="relative mt-1 text-[15px] font-black leading-none text-white">
                !
              </span>
            </span>
            <span className="text-[15px] font-black leading-tight">
              No se agregó un beneficiario.
            </span>
          </div>
        ) : null}

        {description ? (
          <p className="mt-4 text-[16px] leading-[1.45] text-[#5d6674]">
            {description}
          </p>
        ) : (
          <div className="mt-5 grid gap-2 text-left" aria-live="polite">
            {qualificationChecks.slice(0, resolvedCheckCount).map((check) => {
              const isMissing = check.result === "missing";

              return (
                <div
                  className="flex min-h-10 animate-[fade-up_.3s_ease-out] items-center justify-between gap-3 rounded-xl border border-[#e4eaf1] bg-white/75 px-3 py-2"
                  key={check.label}
                >
                  <span className="text-[13px] font-bold text-[#273449]">
                    {check.label}
                  </span>
                  <span
                    aria-label={isMissing ? "Pendiente" : "Verificado"}
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white ${
                      isMissing ? "bg-[#ef4444]" : "bg-[#16a34a]"
                    }`}
                  >
                    {isMissing ? (
                      <svg
                        aria-hidden="true"
                        className="h-3 w-3"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeWidth="3"
                        viewBox="0 0 24 24"
                      >
                        <path d="m7 7 10 10M17 7 7 17" />
                      </svg>
                    ) : (
                      <svg
                        aria-hidden="true"
                        className="h-3.5 w-3.5"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="3"
                        viewBox="0 0 24 24"
                      >
                        <path d="m5 12 4 4L19 6" />
                      </svg>
                    )}
                  </span>
                </div>
              );
            })}

            {resolvedCheckCount < qualificationChecks.length ? (
              <div className="flex min-h-10 animate-[fade-up_.3s_ease-out] items-center justify-between gap-3 rounded-xl border border-[#e4eaf1] bg-white/75 px-3 py-2">
                <span className="text-[13px] font-bold text-[#273449]">
                  Verificando{" "}
                  {qualificationChecks[
                    resolvedCheckCount
                  ].label.toLowerCase()}
                </span>
                <span
                  aria-label="Verificando"
                  className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-[#d6dee8] border-t-[#2d6cdf]"
                />
              </div>
            ) : null}
          </div>
        )}

        {showActions ? (
          <div className="mt-6 grid animate-[fade-up_.35s_ease-out] gap-3">
            <a
              className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-[#16a34a] px-5 text-center text-[16px] font-black leading-none !text-white shadow-[0_10px_22px_rgba(22,163,74,0.24)] transition hover:bg-[#12813c] hover:!text-white"
              data-popup1-ringba-phone
              href={`tel:${phoneNumber}`}
              onClick={handleCallClick}
              ref={primaryLinkRef}
            >
              <svg
                aria-hidden="true"
                className="h-6 w-6 shrink-0"
                fill="none"
                stroke="#ffffff"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                viewBox="0 0 36 32"
              >
                <path d="M7.2 5.5 11 4.3l3.1 6.1-2.4 1.8a18.6 18.6 0 0 0 7.8 7.8l1.8-2.4 6.1 3.1-1.2 3.8c-.5 1.5-2 2.4-3.5 2.1C12.9 24.9 5.3 17.3 3.6 7.5c-.3-1.5.6-3 2.1-3.5l1.5-.5" />
                <path
                  className="popup1-call-wave"
                  d="M20.5 12c1.8.5 3.2 1.9 3.7 3.7"
                />
                <path
                  className="popup1-call-wave popup1-call-wave-2"
                  d="M22 7.2c3.4.9 6.1 3.6 7 7"
                />
                <path
                  className="popup1-call-wave popup1-call-wave-3"
                  d="M23.5 2.7c5.2 1.1 9.3 5.2 10.4 10.4"
                />
              </svg>
              <span className="text-white">{primaryLabel}</span>
            </a>

            <button
              className="mx-auto inline-flex min-h-8 items-center justify-center gap-1.5 px-2 text-center text-[14px] font-bold leading-none text-[#5d6674] transition hover:text-[#273449]"
              onClick={handleContinueClick}
              type="button"
            >
              <Image
                alt=""
                className="h-[18px] w-[14px] shrink-0 object-contain"
                height={980}
                src="/media/clipart2254363.png"
                width={752}
              />
              <span className="underline decoration-1 underline-offset-4">
                {secondaryLabel}
              </span>
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

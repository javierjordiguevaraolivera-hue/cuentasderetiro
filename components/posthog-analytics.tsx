"use client";

import posthog from "posthog-js";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const posthogHost =
  process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

type FunnelEventDetail = Record<string, unknown>;

const funnelStepEventNames: Record<number, string> = {
  1: "funnel_step_goal",
  2: "funnel_step_age",
  3: "funnel_step_zip",
  4: "funnel_step_name",
  5: "funnel_step_contact",
};

function captureEvent(name: string, properties?: FunnelEventDetail) {
  if (!posthogKey) return;
  posthog.capture(name, properties);
}

export default function PostHogAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!posthogKey) return;

    posthog.init(posthogKey, {
      api_host: posthogHost,
      capture_pageview: false,
      capture_pageleave: true,
      autocapture: false,
      person_profiles: "identified_only",
    });

    function onFunnelStep(event: Event) {
      const detail = (event as CustomEvent<FunnelEventDetail>).detail || {};
      const step = detail.step;
      captureEvent("funnel_step_complete", detail);

      if (typeof step === "number") {
        captureEvent(
          funnelStepEventNames[step] || `funnel_step_${step}`,
          detail,
        );
      }

      if (step === 5 && typeof detail.lead_id === "string" && detail.lead_id) {
        const fullName = [detail.first_name, detail.last_name]
          .filter((value) => typeof value === "string" && value.trim())
          .join(" ");

        posthog.identify(detail.lead_id, {
          ...(fullName ? { name: fullName, $name: fullName } : {}),
          first_name: detail.first_name,
          last_name: detail.last_name,
          email: detail.email,
          phone: detail.phone_number,
          phone_number: detail.phone_number,
          funnel_id: detail.funnel_id,
          insurance_goal: detail.insurance_goal,
          age_group: detail.age_group,
          state: detail.state,
          zip_code: detail.zip_code,
          sale_path: detail.salePath,
          lead_status: detail.lead_status,
        });
      }
    }

    function onFunnelRejected(event: Event) {
      const detail = (event as CustomEvent<FunnelEventDetail>).detail || {};
      captureEvent("funnel_rejected", detail);
    }

    function onFunnelError(event: Event) {
      const detail = (event as CustomEvent<FunnelEventDetail>).detail || {};
      captureEvent("funnel_error", detail);
    }

    function onUnhandledError(event: ErrorEvent) {
      captureEvent("browser_error", {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    }

    function onUnhandledRejection(event: PromiseRejectionEvent) {
      captureEvent("browser_unhandled_rejection", {
        reason:
          event.reason instanceof Error
            ? event.reason.message
            : String(event.reason || ""),
      });
    }

    window.addEventListener("funnel:step-complete", onFunnelStep);
    window.addEventListener("funnel:rejected", onFunnelRejected);
    window.addEventListener("funnel:error", onFunnelError);
    window.addEventListener("error", onUnhandledError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    return () => {
      window.removeEventListener("funnel:step-complete", onFunnelStep);
      window.removeEventListener("funnel:rejected", onFunnelRejected);
      window.removeEventListener("funnel:error", onFunnelError);
      window.removeEventListener("error", onUnhandledError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  useEffect(() => {
    if (!posthogKey || !pathname) return;

    const queryString = searchParams.toString();
    const currentUrl =
      window.location.origin + pathname + (queryString ? `?${queryString}` : "");

    posthog.capture("$pageview", {
      $current_url: currentUrl,
      pathname,
    });
  }, [pathname, searchParams]);

  return null;
}

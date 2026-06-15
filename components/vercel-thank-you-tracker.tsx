"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { pageview, track } from "@vercel/analytics";

export default function VercelThankYouTracker({
  thankYouType,
}: {
  thankYouType: "lead" | "call";
}) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const funnelId = searchParams.get("funnel_id");
    if (funnelId !== "iul-v4" && funnelId !== "iul-v5") return;

    const funnelVersion = funnelId === "iul-v5" ? "v5" : "v4";
    const eventName = `${funnelVersion}_thankyou_${thankYouType}`;

    track(eventName, {
      funnel_id: funnelId,
      thank_you_type: thankYouType,
      lead_id_present: Boolean(searchParams.get("lead_id")),
    });
    pageview({
      route: `/${funnelId}/${eventName}`,
      path: `/${funnelId}/${eventName}`,
    });
  }, [searchParams, thankYouType]);

  return null;
}

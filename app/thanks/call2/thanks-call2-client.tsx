"use client";

import { useSearchParams } from "next/navigation";
import BenchCall2Page from "./bench-call2-page";

export default function ThanksCall2Client() {
  const searchParams = useSearchParams();

  return (
    <BenchCall2Page
      ageGroup={searchParams.get("age_group") || ""}
      applicationNumber={searchParams.get("application_number") || ""}
      firstName={searchParams.get("first_name") || ""}
      funnelId={searchParams.get("funnel_id") || ""}
      insuranceGoal={searchParams.get("insurance_goal") || ""}
      leadId={searchParams.get("lead_id") || ""}
      phoneNumber={searchParams.get("ppc_phone") || ""}
      ringbaCampaignId={searchParams.get("ringba_campaign_id") || ""}
    />
  );
}

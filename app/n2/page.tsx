import type { Metadata } from "next";
import { headers } from "next/headers";
import FunnelStepOneN2 from "../funnel-step-one-n2";
import {
  getUsStateName,
  lookupRepresentativeZipForState,
  lookupUsPostalCode,
} from "../lib/us-location";
import { siteConfig } from "../site-config";

const popupPreviewToken = "Antonymd07v";

function decodeVercelHeader(value: string | null) {
  if (!value) return null;

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export const metadata: Metadata = {
  title: "Explora opciones para tu retiro",
  description:
    "Responde unas preguntas breves para conocer opciones generales relacionadas con tus metas de retiro.",
  alternates: {
    canonical: "/n2",
  },
};

function getCaseInsensitiveSearchParam(
  searchParams: Record<string, string | string[] | undefined>,
  name: string,
) {
  const entry = Object.entries(searchParams).find(
    ([key]) => key.toLowerCase() === name.toLowerCase(),
  );
  const value = entry?.[1];

  return (Array.isArray(value) ? value[0] : value)?.trim() || "";
}

export default async function N2Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const requestHeaders = await headers();
  const resolvedSearchParams = await searchParams;
  const sub1 = getCaseInsensitiveSearchParam(resolvedSearchParams, "sub1");
  const sub2 = getCaseInsensitiveSearchParam(resolvedSearchParams, "sub2");
  const popupPreviewEnabled =
    resolvedSearchParams.preview === "1" &&
    resolvedSearchParams.token === popupPreviewToken;
  const phoneHref = process.env.NEXT_PUBLIC_CALL_PHONE_E164 || "+18005550199";
  const vercelLocation = {
    country: requestHeaders.get("x-vercel-ip-country"),
    state: requestHeaders.get("x-vercel-ip-country-region"),
    city: requestHeaders.get("x-vercel-ip-city"),
    postalCode: requestHeaders.get("x-vercel-ip-postal-code"),
  };
  const isUsLocation = vercelLocation.country?.toUpperCase() === "US";
  const postalLocation =
    isUsLocation && vercelLocation.postalCode && !vercelLocation.state
      ? await lookupUsPostalCode(vercelLocation.postalCode)
      : isUsLocation && vercelLocation.state && !vercelLocation.postalCode
        ? await lookupRepresentativeZipForState(vercelLocation.state)
        : null;
  const initialLocation = {
    ...vercelLocation,
    state: vercelLocation.state ?? postalLocation?.state ?? null,
    stateName:
      postalLocation?.stateName ?? getUsStateName(vercelLocation.state),
    city: decodeVercelHeader(vercelLocation.city) ?? postalLocation?.city ?? null,
    postalCode: vercelLocation.postalCode ?? postalLocation?.zipCode ?? null,
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: `${siteConfig.url}/n2`,
    description: siteConfig.description,
    inLanguage: "es-US",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <FunnelStepOneN2
        initialLocation={initialLocation}
        phoneHref={`tel:${phoneHref}`}
        popupPreviewEnabled={popupPreviewEnabled}
        sub1={sub1}
        sub2={sub2}
      />
    </>
  );
}

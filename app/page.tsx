import type { Metadata } from "next";
import { headers } from "next/headers";
import FunnelStepOne from "./funnel-step-one";
import {
  lookupRepresentativeZipForState,
  lookupUsPostalCode,
} from "./lib/us-location";
import { siteConfig } from "./site-config";

export const metadata: Metadata = {
  title: "Explora opciones para tu retiro",
  description:
    "Responde unas preguntas breves para conocer opciones generales relacionadas con tus metas de retiro.",
  alternates: {
    canonical: "/",
  },
};

export default async function Home() {
  const requestHeaders = await headers();
  const phoneHref = process.env.NEXT_PUBLIC_CALL_PHONE_E164 || "+18005550199";
  const phoneDisplay =
    process.env.NEXT_PUBLIC_CALL_PHONE_DISPLAY || "1-800-555-0199";
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
    postalCode: vercelLocation.postalCode ?? postalLocation?.zipCode ?? null,
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    inLanguage: "es-US",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <FunnelStepOne
        initialLocation={initialLocation}
        phoneDisplay={phoneDisplay}
        phoneHref={`tel:${phoneHref}`}
      />
    </>
  );
}

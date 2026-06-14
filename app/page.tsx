import type { Metadata } from "next";
import FunnelStepOne from "./funnel-step-one";
import { siteConfig } from "./site-config";

export const metadata: Metadata = {
  title: "Explora opciones para tu retiro",
  description:
    "Responde unas preguntas breves para conocer opciones generales relacionadas con tus metas de retiro.",
  alternates: {
    canonical: "/",
  },
};

export default function Home() {
  const phoneHref = process.env.NEXT_PUBLIC_CALL_PHONE_E164 || "+18005550199";
  const phoneDisplay =
    process.env.NEXT_PUBLIC_CALL_PHONE_DISPLAY || "1-800-555-0199";

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
        phoneDisplay={phoneDisplay}
        phoneHref={`tel:${phoneHref}`}
      />
    </>
  );
}

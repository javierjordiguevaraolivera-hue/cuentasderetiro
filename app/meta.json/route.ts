import { siteConfig } from "../site-config";

export function GET() {
  return Response.json(
    {
      name: siteConfig.name,
      domain: siteConfig.url,
      language: "es-US",
      purpose:
        "Contenido educativo general sobre cuentas de retiro y preparación para evaluar opciones.",
      operator: siteConfig.name,
      contact: siteConfig.email,
      collectsData: false,
      prohibitedData: [
        "passwords",
        "bank_account_credentials",
        "full_social_security_numbers",
      ],
      disclosures: {
        governmentAffiliation: false,
        financialInstitution: false,
        fiduciaryOrInvestmentAdvisor: false,
        guaranteesResults: false,
      },
      policies: {
        privacy: `${siteConfig.url}/privacidad`,
        terms: `${siteConfig.url}/terminos`,
      },
      robots: `${siteConfig.url}/robots.txt`,
      sitemap: `${siteConfig.url}/sitemap.xml`,
      lastUpdated: "2026-06-13",
      note: "Este manifiesto es informativo y no es un requisito ni una certificación de Meta.",
    },
    {
      headers: {
        "Cache-Control": "public, max-age=0, s-maxage=86400",
      },
    },
  );
}

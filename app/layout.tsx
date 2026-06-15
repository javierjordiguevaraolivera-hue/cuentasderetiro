import type { Metadata } from "next";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { siteConfig } from "./site-config";

const lato = localFont({
  src: [
    {
      path: "../public/fonts/lato-400.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/lato-700.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-lato",
  display: "swap",
});

const metaDomainVerification = process.env.META_DOMAIN_VERIFICATION;

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "Cuentas de Retiro | Explora opciones para tu futuro",
    template: "%s | Cuentas de Retiro",
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  alternates: {
    canonical: "/",
  },
  keywords: [
    "cuentas de retiro",
    "planificación para el retiro",
    "ahorro para el retiro",
    "educación financiera",
  ],
  authors: [{ name: siteConfig.name, url: siteConfig.url }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  formatDetection: {
    address: false,
    email: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "es_US",
    url: "/",
    siteName: siteConfig.name,
    title: "Cuentas de Retiro | Explora opciones para tu futuro",
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: "Cuentas de Retiro | Explora opciones para tu futuro",
    description: siteConfig.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  verification: metaDomainVerification
    ? {
        other: {
          "facebook-domain-verification": metaDomainVerification,
        },
      }
    : undefined,
  category: "finance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-US" className={`${lato.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}

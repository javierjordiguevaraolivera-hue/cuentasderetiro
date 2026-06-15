import type { MetadataRoute } from "next";
import { siteConfig } from "./site-config";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["/iul-v4", "/iul-v5", "/privacidad", "/terminos"];

  return pages.map((path, index) => ({
    url: `${siteConfig.url}${path}`,
    lastModified: new Date("2026-06-13"),
    changeFrequency: index === 0 ? "weekly" : "yearly",
    priority: index === 0 ? 1 : 0.4,
  }));
}

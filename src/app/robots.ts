import type { MetadataRoute } from "next";
import { SITE_CONFIG } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/api",
          "/dashboard",
          "/login",
          "/forgot-password",
          "/reset-password",
          "/change-password",
          "/unsubscribe",
          "/requests",
          "/donate/thank-you",
        ],
      },
    ],
    sitemap: `https://${SITE_CONFIG.domain}/sitemap.xml`,
  };
}

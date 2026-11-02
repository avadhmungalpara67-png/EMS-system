import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* This app is entirely auth-gated and per-user (dashboard, profile,
   * employee list/search), so there's no static shell worth prerendering.
   * Cache Components / instant navigation is off to avoid annotating
   * every route with `export const instant = false`. */
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

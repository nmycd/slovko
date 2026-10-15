import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // Lesson pictures have a content hash in their names (illustrations/tools/render-plan.ts),
  // so a file never changes: browsers and the CDN can keep it forever.
  async headers() {
    return [
      {
        source: "/illustrations/:file*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
  // Word review was a course tab before it became a card beside the course.
  async redirects() {
    return [{ source: "/learn/review", destination: "/learn", permanent: false }];
  },
  partialPrefetching: true,
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

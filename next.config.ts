import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent Turbopack from bundling pdf-parse/pdfjs-dist so the
  // pdf.worker.mjs path resolves correctly from node_modules at runtime.
  serverExternalPackages: ['pdf-parse', 'pdfjs-dist'],
};

export default nextConfig;

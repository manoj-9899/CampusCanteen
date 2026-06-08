import type { NextConfig } from "next";
import os from "os";
import path from "path";

function getLocalIPv4s(): string[] {
  const ips: string[] = ["localhost", "127.0.0.1"];
  const interfaces = os.networkInterfaces();
  for (const iface of Object.values(interfaces)) {
    for (const addr of iface ?? []) {
      if (addr.family === "IPv4" && !addr.internal) {
        ips.push(addr.address);
      }
    }
  }
  return ips;
}

const projectRoot = path.resolve(__dirname);

const nextConfig: NextConfig = {
  // Pin workspace root — without this, Next.js picks C:\Users\manoj\package-lock.json
  // and can serve a completely different app on localhost:3000.
  turbopack: {
    root: projectRoot,
  },
  outputFileTracingRoot: projectRoot,
  // Allow phone/tablet on same Wi‑Fi to load the dev app (Next.js 16 blocks LAN by default)
  allowedDevOrigins: getLocalIPv4s(),
  // Hide the Next.js dev-tools badge (bottom corner) during screenshots / demo
  devIndicators: false,
};

export default nextConfig;

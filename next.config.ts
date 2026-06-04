import type { NextConfig } from "next";
import os from "os";

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

const nextConfig: NextConfig = {
  // Allow phone/tablet on same Wi‑Fi to load the dev app (Next.js 16 blocks LAN by default)
  allowedDevOrigins: getLocalIPv4s(),
  // Hide the Next.js dev-tools badge (bottom corner) during screenshots / demo
  devIndicators: false,
};

export default nextConfig;

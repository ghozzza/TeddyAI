/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Hybrid deploy: the FE can run on Vercel while the autonomous agent's data
  // (decision log + performance) lives on the VPS where twak runs. When
  // AGENT_DATA_ORIGIN points at the VPS, proxy those read-only routes to it so
  // Agent Activity + Wallet Performance still show real live data. Unset on the
  // VPS itself (it serves them locally). Market/analyze stay native to Vercel so
  // the Copilot keeps working even if the VPS is down.
  async rewrites() {
    const origin = process.env.AGENT_DATA_ORIGIN;
    if (!origin) return [];
    const base = origin.replace(/\/$/, "");
    return [
      { source: "/api/history", destination: `${base}/api/history` },
      { source: "/api/performance", destination: `${base}/api/performance` },
    ];
  },
  // wagmi / walletconnect pull in optional deps that should not break the build
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    // MetaMask SDK references a React Native storage module that doesn't exist on web
    config.resolve.alias = {
      ...config.resolve.alias,
      "@react-native-async-storage/async-storage": false,
    };
    return config;
  },
};

export default nextConfig;

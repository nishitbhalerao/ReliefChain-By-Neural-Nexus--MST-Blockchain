/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["reliefchain-shared"],
  webpack: (config) => {
    // Suppress optional-dependency warnings from @metamask/sdk and pino
    // that wagmi/WalletConnect try to require but don't actually need at runtime.
    config.resolve.fallback = {
      ...config.resolve.fallback,
      encoding: false,
      "pino-pretty": false,
    };
    return config;
  },
};

module.exports = nextConfig;

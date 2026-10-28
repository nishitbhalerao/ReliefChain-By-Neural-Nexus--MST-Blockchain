import { createConfig, http } from "wagmi";
import { injected, walletConnect } from "wagmi/connectors";
import { mstMainnet, mstTestnet } from "./chains";

const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

// Target BridgeKey specifically via its EIP-6963 rdns identifier.
// If BridgeKey is not found (e.g. during SSR or when not installed), the
// connector falls back to whatever window.ethereum is present.
const bridgeKeyConnector = injected({
  shimDisconnect: false,
  target() {
    // EIP-6963: prefer the BridgeKey provider by its reverse-DNS name.
    // window.ethereum is used as a fallback for environments without EIP-6963.
    if (typeof window === "undefined") return undefined as any;
    const providers: any[] = (window as any).ethereum?.providers ?? [];
    const bridgeKey = providers.find(
      (p: any) => p.isBridgeKey || p.info?.rdns === "com.mstblockchain.bridgekey"
    );
    if (bridgeKey) return { id: "bridgekey", name: "BridgeKey", provider: bridgeKey };
    // Single-provider case — trust whatever is injected
    return { id: "injected", name: "BridgeKey", provider: (window as any).ethereum };
  },
});

export const wagmiConfig = createConfig({
  ssr: true,
  chains: [mstTestnet, mstMainnet],
  connectors: [
    bridgeKeyConnector,
    ...(walletConnectProjectId
      ? [walletConnect({ projectId: walletConnectProjectId })]
      : []),
  ],
  transports: {
    [mstTestnet.id]: http("/api/rpc/testnet"),
    [mstMainnet.id]: http("/api/rpc/mainnet"),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}

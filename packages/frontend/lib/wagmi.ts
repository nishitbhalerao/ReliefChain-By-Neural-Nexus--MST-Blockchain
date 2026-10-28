import { createConfig, http } from "wagmi";
import { injected, walletConnect } from "wagmi/connectors";
import { mstMainnet, mstTestnet } from "./chains";

const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

export const wagmiConfig = createConfig({
  ssr: true,
  chains: [mstTestnet, mstMainnet],
  connectors: [
    // shimDisconnect: false — prevents wagmi from auto-requesting permissions
    // on mount, which causes the MetaMask permission-request spam loop.
    injected({ shimDisconnect: false }),
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

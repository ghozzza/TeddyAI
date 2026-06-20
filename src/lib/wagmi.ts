import { http, createConfig } from "wagmi";
import { bsc, bscTestnet } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";

const wcProjectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID;
export const activeChain = process.env.NEXT_PUBLIC_CHAIN === "bscTestnet" ? bscTestnet : bsc;

export const wagmiConfig = createConfig({
  chains: [activeChain],
  ssr: true,
  connectors: [
    injected(),
    ...(wcProjectId ? [walletConnect({ projectId: wcProjectId, showQrModal: true })] : []),
  ],
  transports: {
    [bsc.id]: http(),
    [bscTestnet.id]: http(),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}

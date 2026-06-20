import { http, createConfig } from "wagmi";
import { bsc, bscTestnet } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";

const wcProjectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID;
export const activeChain = process.env.NEXT_PUBLIC_CHAIN === "bscTestnet" ? bscTestnet : bsc;

// WalletConnect touches indexedDB on init, which doesn't exist during SSR —
// only register it in the browser. (Injected works fine on both.)
const isBrowser = typeof window !== "undefined";

export const wagmiConfig = createConfig({
  chains: [activeChain],
  ssr: true,
  connectors: [
    injected(),
    ...(wcProjectId && isBrowser ? [walletConnect({ projectId: wcProjectId, showQrModal: true })] : []),
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

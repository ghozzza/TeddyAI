"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <Button variant="outline" size="sm" onClick={() => disconnect()}>
        <span className="h-2 w-2 rounded-full bg-success" />
        {address.slice(0, 6)}…{address.slice(-4)}
      </Button>
    );
  }

  const injected = connectors.find((c) => c.type === "injected") ?? connectors[0];

  return (
    <Button
      size="sm"
      onClick={() => injected && connect({ connector: injected })}
      disabled={isPending || !injected}
    >
      <Wallet className="h-4 w-4" />
      {isPending ? "Connecting…" : "Connect Wallet"}
    </Button>
  );
}

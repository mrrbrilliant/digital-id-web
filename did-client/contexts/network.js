import React, { createContext, useCallback, useEffect, useState } from "react";
import { EvmRpcProvider } from "@selendra/eth-providers";

// @ts-ignore
export const NetworkContext = createContext();
NetworkContext.displayName = "NetworkContext";

const networkAddress = process.env.NEXT_PUBLIC_WSS_ADDRESS || "";

export default function NetworkProvider({ children }) {
  const [network, setNework] = useState(null);

  const initProvider = useCallback(async () => {
    const provider = EvmRpcProvider.from(networkAddress);
    await provider.isReady();
    setNework(provider);
  }, [setNework]);

  useEffect(() => {
    if (!network) {
      initProvider();
    }
  }, [network, initProvider]);

  return <NetworkContext.Provider value={network}>{children}</NetworkContext.Provider>;
}

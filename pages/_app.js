import "../styles/globals.css";
import "react-toastify/dist/ReactToastify.min.css";
import React, { useEffect, useState } from "react";
import { ThemeProvider, useTheme } from "next-themes";
import { ToastContainer, toast } from "react-toastify";

// Contexts
import NetworkProvider from "../contexts/network";
import WalletProvider from "../contexts/wallet";
import ProfileProvider from "../contexts/profile";
import BalanceProvider from "../contexts/balance";
import ContractProvider from "../contexts/contract";
import DataProvider from "../contexts/data";

// Components
import Layout from "../components/layout";
// import Notifications from "../components/notifications";
import UnlockWallet from "../components/unlockWallet";

export function SafeHydrate({ children }) {
  const [isSSR, setIsSSR] = useState(true);
  useEffect(() => {
    setIsSSR(false);
  }, []);
  return <div suppressHydrationWarning>{!isSSR && children}</div>;
}

function MyApp({ Component, pageProps }) {
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const _theme = window.localStorage.getItem("theme") || "";
    if (!_theme) {
      window.localStorage.setItem("theme", "light");
      setTheme("light");
      return;
    }
    setTheme(_theme);
  }, [setTheme]);

  return (
    <SafeHydrate>
      <ThemeProvider attribute="data-theme" defaultTheme={"light"}>
        <ToastContainer />

        <NetworkProvider>
          <WalletProvider>
            <ContractProvider>
              <BalanceProvider>
                <ProfileProvider>
                  <DataProvider>
                    <Layout>
                      <UnlockWallet />
                      <Component {...pageProps} />
                    </Layout>
                  </DataProvider>
                </ProfileProvider>
              </BalanceProvider>
            </ContractProvider>
          </WalletProvider>
        </NetworkProvider>
      </ThemeProvider>
    </SafeHydrate>
  );
}

export default MyApp;

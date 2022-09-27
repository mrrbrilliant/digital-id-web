import { useCallback, useState } from "react";
import { useRouter } from "next/router";
import React, { useContext, useEffect } from "react";
import Navbar from "./navBar";

import { WalletContext } from "../contexts/wallet";
import Scanner from "./scan";

const Layout = ({ children }) => {
  const [openQr, setOpenQr] = useState(false);
  const { encryptedWallet, checkingAuth, evmWallet, toggleAuthenticationRequest, show } = useContext(WalletContext);
  const router = useRouter();
  const path = router.pathname;

  function toggleQr() {
    setOpenQr(!openQr);
  }

  const unlock = useCallback(() => {
    if (window.location.pathname.includes("/credentials")) {
      return;
    }

    if (window.location.pathname.includes("/profile")) {
      return;
    }
    if (encryptedWallet) {
      if (!checkingAuth && !evmWallet && !show) {
        toggleAuthenticationRequest();
      }
    }
  }, [encryptedWallet, checkingAuth, evmWallet, toggleAuthenticationRequest, show, path]);

  useEffect(() => {
    unlock();
  }, [unlock]);

  return (
    <div className="h-auto min-h-screen relative">
      <Navbar toggleQr={toggleQr} />
      <div className="w-full md:px-6 lg:px-[10vw] xl:px-[20vw] py-6 z-0">{children}</div>
      {openQr ? <Scanner toggleQr={toggleQr} isOn={openQr} /> : null}
    </div>
  );
};
export default Layout;

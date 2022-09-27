import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { DataContext } from "./data";
import { WalletContext } from "./wallet";
import { useRouter } from "next/router";

export const ProfileContext = createContext();

export default function ProfileProvider({ children }) {
  const { evmAddress, substrateAddress } = useContext(WalletContext);
  const { isDataReady, credentials, schemas } = useContext(DataContext);
  const [profile, setProfile] = useState(null);
  const router = useRouter();

  const chectMasterDID = useCallback(() => {
    const myCredentials = credentials.filter((credential) => credential.owner === evmAddress);
    const masterDID = myCredentials.filter((credential) => credential.parent === 1);
    if (evmAddress && substrateAddress && masterDID.length === 0) {
      const s = schemas.filter((schema) => schema.did === 1);
      if (s.length > 0) {
        if (window.location.pathname !== "/organizations/0/schemas/1/mint_credential") {
          return router.push("/organizations/0/schemas/1/mint_credential");
        }
      }
    }
    setProfile(masterDID[0]);
  }, [credentials, router]);

  useEffect(() => {
    if (isDataReady && !profile) chectMasterDID();
  }, [isDataReady, profile, chectMasterDID]);

  return <ProfileContext.Provider value={{ profile, setProfile }}>{children}</ProfileContext.Provider>;
}

import React, { createContext, useContext, useEffect, useState } from "react";
// import names from "random-names-generator";
import { WalletContext } from "./wallet";

export const ProfileContext = createContext();

export default function ProfileProvider({ children }) {
  const { evmAddress } = useContext(WalletContext);
  const [profile, setProfile] = useState({});

  useEffect(() => {
    if (evmAddress && !profile.avatar) {
      setProfile({
        ...profile,
        full_name: "Unknown",
        avatar: `https://avatars.dicebear.com/api/micah/${evmAddress}.svg`,
      });
    }
  }, [evmAddress, profile, setProfile]);

  return <ProfileContext.Provider value={{ profile, setProfile }}>{children}</ProfileContext.Provider>;
}

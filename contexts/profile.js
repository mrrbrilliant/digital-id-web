import React, { createContext, useContext, useEffect, useState } from "react";
// import names from "random-names-generator";
import { WalletContext } from "./wallet";

export const ProfileContext = createContext();

export default function ProfileProvider({ children }) {
  const { publicKey } = useContext(WalletContext);
  const [profile, setProfile] = useState({});

  useEffect(() => {
    if (publicKey && !profile.avatar) {
      setProfile({
        ...profile,
        full_name: "Unknown",
        avatar: `https://avatars.dicebear.com/api/micah/${publicKey}.svg`,
      });
    }
  }, [publicKey, profile, setProfile]);

  return <ProfileContext.Provider value={{ profile, setProfile }}>{children}</ProfileContext.Provider>;
}

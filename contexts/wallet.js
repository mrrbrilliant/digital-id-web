import React, { createContext, useState, useEffect, useContext } from "react";
import { ethers } from "ethers";
import { useRouter } from "next/router";
import { NetworkContext } from "./network";
// @ts-ignore
export const WalletContext = createContext();
WalletContext.displayName = "WalletContext";

export default function WalletProvider({ children }) {
  const network = useContext(NetworkContext);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [encryptedWallet, setEncryptedWallet] = useState(null);
  const [publicKey, setPublicKey] = useState(null);
  const [privateKey, setPrivateKey] = useState("");
  const [wallet, setWallet] = useState(null);
  const [show, setShow] = useState(false);
  const [cb, setCb] = useState();
  const router = useRouter();
  const path = router.pathname;

  function createWallet({ password, mnemonic }) {
    const _wallet = ethers.Wallet.fromMnemonic(mnemonic).connect(network);
    // @ts-ignore

    _wallet
      .encrypt(password, {
        scrypt: {
          N: 4096,
        },
      })
      .then((encryptedWallet) => {
        window.localStorage.setItem("encryptedWallet", encryptedWallet);
        setEncryptedWallet(encryptedWallet);

        setWallet(_wallet);
        setPrivateKey(_wallet.privateKey);
        setPublicKey(_wallet.address);
        window.localStorage.setItem("publicKey", _wallet.address);

        router.push("/");
      });
  }

  async function unlockWallet({ password }) {
    return new Promise((resolve, reject) => {
      try {
        const _wallet = ethers.Wallet.fromEncryptedJsonSync(encryptedWallet, password).connect(network);
        if (_wallet) {
          setPublicKey(_wallet.address);
          setPrivateKey(_wallet.privateKey);
          window.localStorage.setItem("publicKey", _wallet.address);
          window.sessionStorage.setItem("privateKey", _wallet.privateKey);
          // @ts-ignore
          setWallet(_wallet);
          return resolve(true);
        }
      } catch (error) {
        return reject(error);
      }
    });
  }

  function lockWallet() {
    setPrivateKey(null);
    setWallet(null);
    window.sessionStorage.removeItem("privateKey");
    router.push("/unlock");
  }

  function forgetWallet() {
    window.localStorage.removeItem("encryptedWallet");
    router.replace("/createWallet");
  }

  function toggleAuthenticationRequest() {
    setShow(!show);
  }

  useEffect(() => {
    if (checkingAuth) {
      // setEncryptedWallet(initalEncryptedWallet);
      const initialEncryptedWallet = window.localStorage.getItem("encryptedWallet") || null;
      const initialPublicKey = window.localStorage.getItem("publicKey") || null;

      setEncryptedWallet(initialEncryptedWallet);
      setPublicKey(initialPublicKey);
      setCheckingAuth(false);
    }
  }, [checkingAuth, setEncryptedWallet, setPublicKey, setCheckingAuth]);

  useEffect(() => {
    if (path !== "/profile") {
      if (!checkingAuth) {
        if (!publicKey && !encryptedWallet) {
          if (router.pathname !== "/createWallet") {
            router.replace("/createWallet");
          }
          return;
        }
      }
    }
  }, [checkingAuth, publicKey, encryptedWallet, router, path]);

  const value = {
    wallet,
    encryptedWallet,
    checkingAuth,
    createWallet,
    unlockWallet,
    lockWallet,
    forgetWallet,
    publicKey,
    privateKey,
    show,
    cb,
    setCb,
    toggleAuthenticationRequest,
  };
  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

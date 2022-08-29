import React, { createContext, useState, useEffect, useContext } from "react";
import { ethers } from "ethers";
import { useRouter } from "next/router";
import { options } from "@selendra/api";
import { ApiPromise, WsProvider, Keyring } from "@polkadot/api";
// import { cryptoWaitReady } from "@polkadot/util-crypto";

import { createClaimSignature } from "@selendra/eth-transactions";
import { NetworkContext } from "./network";
import axios from "axios";
import { toast } from "react-toastify";
// @ts-ignore
export const WalletContext = createContext();
WalletContext.displayName = "WalletContext";

export default function WalletProvider({ children }) {
  const network = useContext(NetworkContext);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [encryptedWallet, setEncryptedWallet] = useState(null);
  const [evmAddress, setEvmAddress] = useState(null);
  const [evmPrivateKey, setEvmPrivateKey] = useState("");
  const [evmWallet, setEvmWallet] = useState(null);
  const [substrateAddress, setSubstrateAddress] = useState(null);
  const [substrateWallet, setSubstrateWallet] = useState(null);
  const [show, setShow] = useState(false);
  const [cb, setCb] = useState();
  const router = useRouter();
  const path = router.pathname;

  async function createEvmWallet({ password, mnemonic }) {
    const _evmWallet = ethers.Wallet.fromMnemonic(mnemonic).connect(network);
    const encryptedWallet = await _evmWallet.encrypt(password, {
      scrypt: {
        N: 4096,
      },
    });
    window.localStorage.setItem("encryptedWallet", encryptedWallet);
    window.localStorage.setItem("evmAddress", _evmWallet.address);
    return _evmWallet;
  }

  async function createSubstrateWallet({ mnemonic }) {
    // await initWasm();
    // await cryptoWaitReady();
    const keyring = new Keyring({
      type: "sr25519",
      ss58Format: 204,
    });

    const _substrateWallet = keyring.addFromMnemonic(mnemonic);
    window.localStorage.setItem("substrateAddress", _substrateWallet.address);
    return _substrateWallet;
  }

  async function requestInitialAirdrop(substrateAddress) {
    const req = await axios
      .post("https://api-faucet.selendra.org/api/claim/testnet", {
        address: substrateAddress,
      })
      .then((res) => res.data);
    return req.success;
  }

  async function bindAccount({ evmProvider, evmWallet, substrateWallet }) {
    try {
      const substrateProvider = process.env.NEXT_PUBLIC_WSS_ADDRESS || "";
      const provider = new WsProvider(substrateProvider);
      // await cryptoWaitReady();
      const api = new ApiPromise(options({ provider }));
      await api.isReadyOrError;
      const chainId = parseInt(api.consts.evmAccounts.chainId.toString());
      const genesisHash = api.genesisHash.toString();
      const balance = await evmProvider.getBalance(evmWallet.address);

      if (parseFloat(balance) > 0) {
        throw new Error("Account already exit, please use new evm account");
      }
      const signature = createClaimSignature(evmWallet.privateKey, {
        salt: genesisHash,
        chainId: chainId,
        substrateAddress: substrateWallet.address,
      });
      const hash = await api.tx.evmAccounts.claimAccount(evmWallet.address, signature).signAndSend(substrateWallet);

      return hash;
    } catch (error) {
      toast.error(`Error! ${error.toString()}`);
      throw error;
    }
  }

  async function createWallet({ password, mnemonic }) {
    const toaster = toast.loading("Creating EVM Wallet");
    try {
      const _evmWallet = await createEvmWallet({ password, mnemonic });
      toast.update(toaster, { render: "Creating Substrate Wallet", isLoading: true });
      const _substrateWallet = await createSubstrateWallet({ mnemonic });
      toast.update(toaster, { render: "Claiming initial airdrop!", isLoading: true });
      const claimed = await requestInitialAirdrop(_substrateWallet.address);
      if (claimed) {
        toast.update(toaster, { render: "Binding EVM and Substrate address.", isLoading: true });
        setTimeout(async () => {
          const hash = await bindAccount({
            evmProvider: network,
            evmWallet: _evmWallet,
            substrateWallet: _substrateWallet,
          });
          if (hash) {
            toast.update(toaster, {
              render: "Successfully bond accounts.",
              isLoading: false,
              type: "success",
              autoClose: 5000,
            });
          }
          const encryptedWallet = window.localStorage.getItem("encryptedWallet");
          setEncryptedWallet(encryptedWallet);
          setEvmWallet(_evmWallet);
          setEvmPrivateKey(_evmWallet.evmPrivateKey);
          setEvmAddress(_evmWallet.address);
          setSubstrateAddress(_substrateWallet.address);
          setSubstrateWallet(_substrateWallet);
        }, 10000);
      } else {
        toast.update(toaster, { render: "Failed to claim airdrop.", isLoading: false, autoClose: 5000 });
      }
    } catch (error) {
      toast.update(toaster, { render: `Error! ${error.toString()}`, isLoading: false, type: "error", autoClose: 5000 });
      console.log(error);
    }
  }

  async function unlockWallet({ password }) {
    return await new Promise(async (resolve, reject) => {
      try {
        const _evmWallet = ethers.Wallet.fromEncryptedJsonSync(encryptedWallet, password).connect(network);
        if (_evmWallet) {
          window.localStorage.setItem("evmAddress", _evmWallet.address);
          window.sessionStorage.setItem("evmPrivateKey", _evmWallet.privateKey);
          setEvmAddress(_evmWallet.address);
          setEvmPrivateKey(_evmWallet.evmPrivateKey);
          setEvmWallet(_evmWallet);
          await createSubstrateWallet({ mnemonic: _evmWallet.mnemonic.phrase });
          return resolve(true);
        }
      } catch (error) {
        console.log(error);
        return reject(error);
      }
    });
  }

  function lockWallet() {
    setEvmPrivateKey(null);
    setEvmWallet(null);
    window.sessionStorage.removeItem("evmPrivateKey");
    router.push("/unlock");
  }

  function forgetWallet() {
    window.localStorage.removeItem("encryptedWallet");
    window.sessionStorage.removeItem("evmPrivateKey");
    window.localStorage.removeItem("evmAddress");
    window.localStorage.removeItem("substrateAddress");
    window.location.replace("/createWallet");
  }

  function exportWallet() {
    const blob = new Blob([encryptedWallet], { type: "application/json" });
    const a = document.createElement("a");
    a.download = `${evmAddress}.json`;
    a.href = URL.createObjectURL(blob);
    a.addEventListener("click", (e) => {
      setTimeout(() => URL.revokeObjectURL(a.href), 30 * 1000);
    });
    a.click();
  }

  function toggleAuthenticationRequest() {
    setShow(!show);
  }

  useEffect(() => {
    if (checkingAuth) {
      const initialEncryptedWallet = window.localStorage.getItem("encryptedWallet") || null;
      const initialEvmAddress = window.localStorage.getItem("evmAddress") || null;
      const initialSubstrateAddress = window.localStorage.getItem("substrateAddress") || null;

      setEncryptedWallet(initialEncryptedWallet);
      setEvmAddress(initialEvmAddress);
      setSubstrateAddress(initialSubstrateAddress);
      setCheckingAuth(false);
    }
  }, [checkingAuth, setEncryptedWallet, setEvmAddress, setSubstrateAddress, setCheckingAuth]);

  useEffect(() => {
    if (path !== "/profile") {
      if (!checkingAuth) {
        if (!evmAddress && !substrateAddress && !encryptedWallet) {
          if (router.pathname !== "/createWallet") {
            router.replace("/createWallet");
          }
          return;
        }
      }
    }
  }, [checkingAuth, evmAddress, substrateAddress, encryptedWallet, router, path]);

  const value = {
    evmWallet,
    encryptedWallet,
    checkingAuth,
    createWallet,
    unlockWallet,
    lockWallet,
    forgetWallet,
    evmAddress,
    evmPrivateKey,
    substrateAddress,
    substrateWallet,
    show,
    cb,
    setCb,
    toggleAuthenticationRequest,
    exportWallet,
  };
  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

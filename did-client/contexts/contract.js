import React, { createContext, useRef, useState, useContext, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import WalletProvider, { WalletContext } from "./wallet";

import artificat from "../public/Identity.json";
import { NetworkContext } from "./network";

// @ts-ignore
export const ContractContext = createContext();
ContractContext.displayName = "ContractContext";

const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDR || "";

export default function ContractProvider({ children }) {
  const network = useContext(NetworkContext);
  const { evmWallet, evmAddress } = useContext(WalletContext);
  const [contract, setContract] = useState(null);
  // const [contractRO, setContractRO] = useState(null);
  // const [contractRW, setContractRW] = useState(null);
  // const [contractPub, setContractPub] = useState(null);

  // useEffect(() => {
  //   if (evmWallet && !contractRW) {
  //     const _contract_rw = new ethers.Contract(contractAddress, artificat.abi, evmWallet);
  //     setContractRW(_contract_rw);
  //   }
  // }, [evmWallet, setContractRW, contractRW]);

  // useEffect(() => {
  //   if (evmAddress && network && !contractRO) {
  //     const _contract_ro = new ethers.Contract(contractAddress, artificat.abi, network);
  //     setContractRO(_contract_ro);
  //   }
  // }, [evmAddress, network, setContractRO, contractRO]);

  // useEffect(() => {
  //   if (network && !contractPub) {
  //     const _contract_pub = new ethers.Contract(contractAddress, artificat.abi, network);
  //     setContractPub(_contract_pub);
  //   }
  // }, [network, contractPub, setContractPub]);

  useEffect(() => {
    if (network && evmWallet && !contract) {
      const _contract = new ethers.Contract(contractAddress, artificat.abi, evmWallet);
      setContract(_contract);
    }
  }, [contract, evmWallet, network]);

  useEffect(() => {
    if (network && evmWallet && contract && contract["provider"] === null) {
      const _evmWallet = evmWallet.connect(network);
      contract.connect(_evmWallet);
      console.log("reconnect", contract.provider);
    }
  });

  useEffect(() => {
    if (network && evmWallet && contract) {
      console.log(contract);
    }
  }, [contract, network, evmWallet]);

  const value = {
    contract,
  };
  return <ContractContext.Provider value={value}>{children}</ContractContext.Provider>;
}

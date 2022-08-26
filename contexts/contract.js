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
  const { wallet, publicKey } = useContext(WalletContext);
  const [contract, setContract] = useState(null);
  // const [contractRO, setContractRO] = useState(null);
  // const [contractRW, setContractRW] = useState(null);
  // const [contractPub, setContractPub] = useState(null);

  // useEffect(() => {
  //   if (wallet && !contractRW) {
  //     const _contract_rw = new ethers.Contract(contractAddress, artificat.abi, wallet);
  //     setContractRW(_contract_rw);
  //   }
  // }, [wallet, setContractRW, contractRW]);

  // useEffect(() => {
  //   if (publicKey && network && !contractRO) {
  //     const _contract_ro = new ethers.Contract(contractAddress, artificat.abi, network);
  //     setContractRO(_contract_ro);
  //   }
  // }, [publicKey, network, setContractRO, contractRO]);

  // useEffect(() => {
  //   if (network && !contractPub) {
  //     const _contract_pub = new ethers.Contract(contractAddress, artificat.abi, network);
  //     setContractPub(_contract_pub);
  //   }
  // }, [network, contractPub, setContractPub]);

  useEffect(() => {
    if (network && wallet && !contract) {
      const _contract = new ethers.Contract(contractAddress, artificat.abi, wallet);
      setContract(_contract);
    }
  }, [contract, wallet, network]);

  useEffect(() => {
    if (network && wallet && contract && contract["provider"] === null) {
      const _wallet = wallet.connect(network);
      contract.connect(_wallet);
      console.log("reconnect");
    }
  });

  useEffect(() => {
    if (network && wallet && contract) {
      console.log(contract);
    }
  }, [contract, network, wallet]);

  const value = {
    contract,
  };
  return <ContractContext.Provider value={value}>{children}</ContractContext.Provider>;
}

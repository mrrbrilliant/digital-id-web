import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { NetworkContext } from "./network";
import { WalletContext } from "./wallet";
// import { NotificationContext } from "./notification";
import { v4 as uid } from "uuid";
import { toast } from "react-toastify";

export const BalanceContext = createContext();

export default function BalanceProvider({ children }) {
  const network = useContext(NetworkContext);
  const { evmAddress, evmWallet } = useContext(WalletContext);
  // const { notify, hide } = useContext(NotificationContext);

  const [balance, setBalance] = useState("0");

  async function transfer({ to, amount }) {
    const toaster = toast.loading(`Transfering ${amount} to ${to}`);
    try {
      const network_gas = await network.getGasPrice();
      const gas_price = ethers.utils.hexlify(network_gas);
      const gas_limit = "0x100000";

      const transaction_config = {
        from: evmAddress,
        to,
        value: ethers.utils.parseEther(amount),
        gasLimit: ethers.utils.hexlify(gas_limit),
        gasPrice: gas_price,
      };

      evmWallet.sendTransaction(transaction_config).then(async (tx, error) => {
        if (error) {
          toast.update(toaster, {
            render: `Transaction failed. ${error.toString()}`,
            type: "error",
            isLoading: false,
            autoClose: 5000,
          });
          return false;
        }

        await tx.wait();
        toast.update(toaster, {
          render: `Transferred ${amount} SEL to ${to}`,
          type: "success",
          isLoading: false,
          autoClose: 5000,
        });
      });
      network.getBalance(evmAddress).then((balance) => {
        const balanceInEth = ethers.utils.formatEther(balance);
        setBalance(balanceInEth);
      });
      return true;
    } catch (error) {
      toast.update(toaster, {
        render: `Transaction failed. ${error.toString()}`,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
      return false;
    }
  }

  const fetchBalance = useCallback(() => {
    network.getBalance(evmAddress).then((balance) => {
      const balanceInEth = ethers.utils.formatEther(balance);
      setBalance(balanceInEth);
    });
  }, [network, setBalance, evmAddress]);

  useEffect(() => {
    if (network && evmAddress) {
      network.getBalance(evmAddress).then((balance) => {
        const balanceInEth = ethers.utils.formatEther(balance);
        setBalance(balanceInEth);
      });
    }
  }, [network, evmAddress]);

  const value = {
    balance,
    transfer,
    fetchBalance,
  };
  return <BalanceContext.Provider value={value}>{children}</BalanceContext.Provider>;
}

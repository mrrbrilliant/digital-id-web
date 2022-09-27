import { options } from "@selendra/api";
import { ApiPromise, WsProvider, Keyring } from "@polkadot/api";
import { createClaimSignature } from "@selendra/eth-transactions";
import { toast } from "react-toastify";

export const bindAccount = async ({ substrateProvider, evmPrivateKey, evmAddress, evmProvider, mnemonic }) => {
  try {
    const provider = new WsProvider(substrateProvider);
    const api = new ApiPromise(options({ provider }));
    await api.isReadyOrError;

    const keyring = new Keyring({
      type: "sr25519",
      ss58Format: 204,
    });

    const substrateWallet = keyring.addFromMnemonic(mnemonic);
    const genesisHash = api.genesisHash.toString();
    const chainId = parseInt(api.consts.evmAccounts.chainId.toString());
    const balance = await evmProvider.getBalance(evmAddress);

    if (parseFloat(balance) > 0) {
      throw new Error("Account already exit, please use new evm account");
    }
    const signature = createClaimSignature(evmPrivateKey, {
      salt: genesisHash,
      chainId: chainId,
      substrateAddress: substrateWallet.address,
    });
    const hash = await api.tx.evmAccounts.claimAccount(evmAddress, signature).signAndSend(substrateWallet);

    return hash;
  } catch (error) {
    toast.error(`Error! ${error.toString()}`);
    console.log(error);
  }
};

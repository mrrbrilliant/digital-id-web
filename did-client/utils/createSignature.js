import { ethers } from "ethers";

export function create_signature({ evmPrivateKey, genesisHash, chainId, substrateAddress }) {
  const evmWallet = new ethers.Wallet(evmPrivateKey);
  const signature = createClaimSignature(evmWallet.evmPrivateKey, {
    salt: genesisHash,
    chainId: chainId,
    substrateAddress: substrateAddress,
  });

  return signature;
}

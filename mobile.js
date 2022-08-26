import { ethers } from "ethers";
import { EvmRpcProvider } from "@selendra/eth-providers";
import artifact from "./public/Identity.json";

const network = process.env.NEXT_PUBLIC_WSS_ADDRESS || "";
const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDR || "";
const ipfs = process.env.NEXT_PUBLIC_IPFS_ADDRESS || "";

const ipfs_address = (cid) => `${ipfs}/files/${cid}`;

/**
 * @param {string} privateKey - EVM privateKey
 * @param {string} ipfsHash - hash of json document after uploaded to ipfs
 */
async function mintOrganization(privateKey, ipfsHash) {
  const provider = EvmRpcProvider.from(network);
  await provider.isReady();
  const wallet = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(contractAddress, artifact.abi, wallet);
  try {
    const tx = await contract.mintOrganization(ipfsHash);
    await tx.wait();
    return true;
  } catch (error) {
    throw error;
  }
}

/**
 * @param {string} privateKey - EVM privateKey
 * @param {string} ipfsHash - hash of json document after uploaded to ipfs
 * @param {number} schemaState - all credential based on this schema will use this state
 * @param {number} orgDid - organization id (did)
 */
async function mintSchema(privateKey, ipfsHash, schemaState, orgDid) {
  const provider = EvmRpcProvider.from(network);
  await provider.isReady();
  const wallet = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(contractAddress, artifact.abi, wallet);
  try {
    const tx = await contract.mintSchema(ipfsHash, schemaState, orgDid);
    await tx.wait();
    return true;
  } catch (error) {
    throw error;
  }
}

/**
 * @param {string} privateKey - EVM privateKey
 * @param {string} ipfsHash - hash of json document after uploaded to ipfs
 * @param {number} schemaDid - schema id that credential based on
 */
async function mintCredential(privateKey, ipfsHash, schemaDid) {
  const provider = EvmRpcProvider.from(network);
  await provider.isReady();
  const wallet = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(contractAddress, artifact.abi, wallet);
  try {
    const tx = await contract.mintDocument(ipfsHash, schemaDid);
    await tx.wait();
    return true;
  } catch (error) {
    throw error;
  }
}

/**
 * @param {string} privateKey - EVM privateKey
 * @param {number} credentialDid - id of credential to transfer
 * @param {string} receiverAddress - EVM Address of reciever
 */
async function transferCredential(privateKey, credentialDid, receiverAddress) {
  const provider = EvmRpcProvider.from(network);
  await provider.isReady();
  const wallet = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(contractAddress, artifact.abi, wallet);
  try {
    const tx = await contract.transferCredential(credentialDid, receiverAddress);
    await tx.wait();
    return true;
  } catch (error) {
    throw error;
  }
}

/**
 * @param {string} privateKey - EVM privateKey
 * @param {number} orgDid - organization id to be transfer
 * @param {string} receiverAddress - EVM Address of reciever
 */
async function transferOrganzation(privateKey, orgDid, receiverAddress) {
  const provider = EvmRpcProvider.from(network);
  await provider.isReady();
  const wallet = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(contractAddress, artifact.abi, wallet);
  try {
    const transfer = await contract.transferOrganzation(orgDid, receiverAddress);
    await transfer.wait();
    return true;
  } catch (error) {
    throw error;
  }
}

/**
 * @param {string} privateKey - EVM privateKey
 * @param {string} schemaDid - schema id to be transfer
 * @param {number} orgDid - new organization address to receive schema
 * @param {string} receiverAddress - EVM Address of reciever
 */
async function transferSchema(privateKey, schemaDid, orgDid, receiverAddress) {
  const provider = EvmRpcProvider.from(network);
  await provider.isReady();
  const wallet = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(contractAddress, artifact.abi, wallet);
  try {
    const tx = await contract.transferSchema(schemaDid, orgDid, receiverAddress);
    await tx.wait();
    return true;
  } catch (error) {
    throw error;
  }
}

/**
 * @param {string} privateKey - EVM privateKey
 * @param {number} credentialDid - credential id to be verify
 * @param {number} orgDid - organization id to verify your credential
 */
async function requestVerify(privateKey, credentialDid, orgDid) {
  const provider = EvmRpcProvider.from(network);
  await provider.isReady();
  const wallet = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(contractAddress, artifact.abi, wallet);
  try {
    const tx = await contract.attestRequest(credentialDid, orgDid);
    await tx.wait();
    return true;
  } catch (error) {
    throw error;
  }
}

/**
 * @param {string} privateKey - EVM privateKey
 * @param {number} credentialDid - credential id to cancel request
 * @param {number} orgDid - organization id to verify your credential
 */
async function cancelRequestVerify(privateKey, credentialDid, orgDid) {
  const provider = EvmRpcProvider.from(network);
  await provider.isReady();
  const wallet = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(contractAddress, artifact.abi, wallet);
  try {
    const tx = await contract.attestCancel(credentialDid, orgDid);
    await tx.wait();
    return true;
  } catch (error) {
    throw error;
  }
}

/**
 * @param {string} privateKey - EVM privateKey
 * @param {number} credentialDid - credential id to approve
 * @param {number} orgDid - organization id to verify your credential
 * @param {boolean} approveStatus - approve or not?
 */
async function VerificationApproval(privateKey, credentialDid, orgDid, approveStatus) {
  const provider = EvmRpcProvider.from(network);
  await provider.isReady();
  const wallet = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(contractAddress, artifact.abi, wallet);
  try {
    const tx = await contract.attestValidate(credentialDid, orgDid, approveStatus);
    await tx.wait();
    return true;
  } catch (error) {
    throw error;
  }
}

/**
 * @param {string} privateKey - EVM privateKey
 * @param {number} credentialDid - credential id to be burn
 */
async function burnCredential(privateKey, credentialDid) {
  const provider = EvmRpcProvider.from(network);
  await provider.isReady();
  const wallet = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(contractAddress, artifact.abi, wallet);
  try {
    const burn = await contract.burn(credentialDid);
    await burn.wait();
    return true;
  } catch (error) {
    throw error;
  }
}

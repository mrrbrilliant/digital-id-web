import _ from "lodash";
import axios from "axios";
import { ethers } from "ethers";
import { EvmRpcProvider } from "@selendra/eth-providers";
import artifact from "../../public/Identity.json";

const network = process.env.NEXT_PUBLIC_WSS_ADDRESS || "";
const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDR || "";
const ipfs = process.env.NEXT_PUBLIC_IPFS_ADDRESS || "";

const ipfs_address = (cid) => `${ipfs}/files/${cid}`;

export default async function handler(req, res) {
  const { did } = req.query;

  const provider = EvmRpcProvider.from(network);
  await provider.isReady();
  const contract = new ethers.Contract(contractAddress, artifact.abi, provider);

  const cid = await contract.getContentOf(did);
  const owner = await contract.getOwnerOf(cid);
  const meta = await contract.getMetaOf(did);
  const state = meta["state"];
  const ctype = meta["ctype"];
  const parent = meta["parent"].toNumber();
  try {
    const details = await axios.get(ipfs_address(cid)).then((res) => res.data);
    const data = { did, cid, owner, ctype, state, parent, details };
    await provider.disconnect();
    res.status(200).json(data);
  } catch (error) {
    res.status(200).json({});
  }
}

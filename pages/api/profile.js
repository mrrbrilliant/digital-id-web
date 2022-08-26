import { ethers } from "ethers";
import CTypeManagement from "../../CreadentialManagement.json";

const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDR || "";

const provider = new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_WSS_ADDRESS);
const contract = new ethers.Contract(contractAddress, CTypeManagement.abi, provider);

const toNumber = (number) => {
  const toUnit = ethers.utils.formatEther(number).toString();
  const roundedCount = Math.round(parseFloat(toUnit) * 10 ** 18);
  return roundedCount;
};

const DocMeta = async (id) => {
  return await contract._credentiallMetadata(id);
};
const getDocs = async (address) => {
  const docsById = await contract.credentialsList(address);
  if (docsById.length === 0) {
    return [];
  }

  const data = await Promise.all(
    docsById.map(async (docId) => {
      const row = await DocMeta(toNumber(docId));
      const r = {};
      Object.keys(row).forEach((k) => {
        if (isNaN(parseInt(k))) {
          r[k] = row[k];
        }
      });
      return { id: toNumber(docId), ...r };
    })
  );

  return data;
};

export default async function handler(req, res) {
  const { user } = req.query;
  const data = await getDocs(user);
  const doc = data.filter((d) => d.name === "Master Digital ID");

  const propertyURI = doc[0].propertyURI;
  const info = await fetch(propertyURI).then((res) => res.json());

  res.status(200).json({ ...info });
}

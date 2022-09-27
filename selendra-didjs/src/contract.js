import config from "./config";
import Kumandra from "./storage";
import { ethers, BigNumber } from "ethers";
import { EvmRpcProvider } from "@selendra/eth-providers";
import _ from "lodash";

const Contract = async function (privateKey = "") {
  const kmd = Kumandra();
  const provider = EvmRpcProvider.from(config.providerAddress);
  await provider.isReady();

  let contract = new ethers.Contract(config.contractAddress, config.abi, provider);

  if (privateKey !== "") {
    const wallet = new ethers.Wallet(privateKey, provider);
    contract = contract.connect(wallet);
  }

  function requireSigner() {
    if (!contract.signer) throw new Error("Mutation requires signer!");
  }

  async function getAllDids() {
    try {
      const _lastID = await contract.lastID();
      const lastID = ethers.BigNumber.from(_lastID).toNumber();
      const dids = [];

      for (let i = 0; i < lastID; i++) {
        dids.push(i);
      }

      const details = await Promise.all(
        dids.map(async (did) => {
          const cid = await contract.getContentOf(did);
          const owner = await contract.getOwnerOf(cid);
          const details = await kmd.get(cid);
          const meta = await contract.getMetaOf(did);
          const state = meta["state"];
          const ctype = meta["ctype"];
          const parent = meta["parent"].toNumber();

          return { did, cid, owner, ctype, state, parent, details };
        })
      ).then((data) => data);
      const data = _.groupBy(details, (detail) => {
        switch (detail.ctype) {
          case 0:
            return "organizations";
          case 1:
            return "schemas";
          default:
            return "credentials";
        }
      });

      return data;
    } catch (error) {
      return error;
    }
  }

  return {
    contract,
    query: {
      getLastId() {
        return contract.lastID().then((bn) => BigNumber.from(bn).toNumber());
      },
      getAssetsOf(address = ethers.constants.AddressZero) {
        return contract.getAssetsOf(address).then((data) => data.map((bn) => BigNumber.from(bn).toNumber()));
      },
      getOwnerOf(cid) {
        return contract.getOwnerOf(cid).then((data) => data);
      },
      getContentOf(did = 0) {
        return contract.getContentOf(did).then((data) => data);
      },
      getMetaOf(did = 0) {
        return contract.getMetaOf(did).then((data) => ({
          ctype: data["ctype"],
          parent: BigNumber.from(data["parent"]).toNumber(),
          state: data["state"],
        }));
      },
      async getDid(did = 0) {
        try {
          const cid = await contract.getContentOf(did);
          const owner = await contract.getOwnerOf(cid);
          const meta = await contract.getMetaOf(did);
          const state = meta["state"];
          const ctype = meta["ctype"];
          const parent = meta["parent"].toNumber();
          const details = await kmd.get(cid);
          const data = { did, cid, owner, ctype, state, parent, details };
          return data;
        } catch (error) {
          return error;
        }
      },

      async getOrganizations() {
        const dids = await getAllDids();
        return dids["organizations"];
      },
      async getSchemasByOrg(did) {
        const dids = await getAllDids();
        return dids["schemas"].filter((schema) => schema.parent === did);
      },
      async getCredentialsByOrg(did) {
        const dids = await getAllDids();
        const schemas = dids["schemas"].filter((schema) => schema.parent === did).map((schema) => schema.did);
        return dids["credentials"].filter((credential) => schemas.includes(credential.parent));
      },
      async getAllOrgData(did) {
        const dids = await getAllDids();
        const org = dids["organizations"].filter((org) => org.did == did)[0];
        const schemas = dids["schemas"]
          .filter((schema) => schema.parent === did)
          .map((schema) => {
            const credentials = dids["credentials"].filter((credential) => credential.parent === schema.did);
            schema["credentials"] = credentials;
            return schema;
          });
        org["schemas"] = schemas;
        return org;
      },
    },
    isReadWrite() {
      try {
        requireSigner();
        return true;
      } catch (error) {
        return false;
      }
    },
    mutate: {
      async mintOrganization(ipfsHash) {
        try {
          requireSigner();
          const tx = await contract.mintOrganization(ipfsHash);
          await tx.wait();
          return true;
        } catch (error) {
          throw error;
        }
      },
      async mintSchema(ipfsHash, schemaState, orgDid) {
        try {
          requireSigner();
          const tx = await contract.mintSchema(ipfsHash, schemaState, orgDid);
          await tx.wait();
          return true;
        } catch (error) {
          throw error;
        }
      },
      async mintCredential(ipfsHash, schemaDid) {
        try {
          requireSigner();
          const tx = await contract.mintDocument(ipfsHash, schemaDid);
          await tx.wait();
          return true;
        } catch (error) {
          throw error;
        }
      },
      async transferCredential(credentialDid, receiverAddress) {
        try {
          requireSigner();
          const tx = await contract.transferCredential(credentialDid, receiverAddress);
          await tx.wait();
          return true;
        } catch (error) {
          throw error;
        }
      },
      async transferOrganzation(orgDid, receiverAddress) {
        try {
          requireSigner();
          const transfer = await contract.transferOrganzation(orgDid, receiverAddress);
          await transfer.wait();
          return true;
        } catch (error) {
          throw error;
        }
      },
      async transferSchema(schemaDid, orgDid, receiverAddress) {
        try {
          requireSigner();
          const tx = await contract.transferSchema(schemaDid, orgDid, receiverAddress);
          await tx.wait();
          return true;
        } catch (error) {
          throw error;
        }
      },
      async requestVerify(credentialDid, orgDid) {
        try {
          requireSigner();
          const tx = await contract.attestRequest(credentialDid, orgDid);
          await tx.wait();
          return true;
        } catch (error) {
          throw error;
        }
      },
      async cancelRequestVerify(credentialDid, orgDid) {
        try {
          requireSigner();
          const tx = await contract.attestCancel(credentialDid, orgDid);
          await tx.wait();
          return true;
        } catch (error) {
          throw error;
        }
      },
      async VerificationApproval(credentialDid, orgDid, approveStatus) {
        try {
          requireSigner();
          const tx = await contract.attestValidate(credentialDid, orgDid, approveStatus);
          await tx.wait();
          return true;
        } catch (error) {
          throw error;
        }
      },
      async burnCredential(credentialDid) {
        try {
          requireSigner();
          const burn = await contract.burn(credentialDid);
          await burn.wait();
          return true;
        } catch (error) {
          throw error;
        }
      },
    },
  };
};

export default Contract;

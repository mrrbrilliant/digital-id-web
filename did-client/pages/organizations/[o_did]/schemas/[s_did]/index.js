/* eslint-disable @next/next/no-img-element */
import React, { useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";

// import Badge from "../../../components/badge";
import { toast } from "react-toastify";
import Modal from "../../../../../components/modal";

// Contexts
import { DataContext } from "../../../../../contexts/data";
import { ContractContext } from "../../../../../contexts/contract";
import { WalletContext } from "../../../../../contexts/wallet";

export default function CredentialsOfSchema() {
  // Contexts
  const { contract } = useContext(ContractContext);
  const { organizations, schemas, credentials: allCredentails, isDataReady } = useContext(DataContext);
  const { evmAddress } = useContext(WalletContext);
  // States
  const [schema, setSchema] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [credentials, setCredentials] = useState(null);
  const [showTransferSchema, setShowTransferSchema] = useState(false);
  const [toTransferSchema, setToTransferSchema] = useState({
    orgId: "",
    ownerAddress: "",
  });
  const [isOwner, setIsOwner] = useState(false);

  // NEXT
  const router = useRouter();
  const { o_did, s_did } = router.query;

  const thisSchema = schemas.filter((s) => s.did == s_did)[0];
  const thisOrganization = organizations.filter((o) => o.did == o_did)[0];
  const theseCredentials = allCredentails.filter((c) => c.parent == s_did);

  function handleTransferChange(e) {
    const { name, value } = e.target;
    setToTransferSchema({ ...toTransferSchema, [name]: value });
  }
  function toggleTransferSchema() {
    setShowTransferSchema(!showTransferSchema);
  }

  async function handleTranserSchema() {
    const toaster = toast.loading(`Transfering schema`);
    try {
      const tx = await contract.transferSchema(s_did, toTransferSchema.orgId, toTransferSchema.ownerAddress);
      await tx.wait();
      toast.update(toaster, {
        render: "Transfered schema successfully.",
        isLoading: false,
        type: "success",
        autoClose: 3000,
      });
    } catch (error) {
      console.log(error);
      toast.update(toaster, {
        render: `Failed ${error.toString()}`,
        isLoading: false,
        type: "error",
        autoClose: 5000,
      });
    }
    setShowTransferSchema(false);
  }
  // Validate schema exists
  useEffect(() => {
    if (isDataReady && thisSchema && thisSchema.length === 0) {
      router.push(`/organizations/${o_did}`);
    }
  }, [isDataReady, thisSchema, router, o_did]);

  // Validate organization exists
  useEffect(() => {
    if (isDataReady && thisOrganization && thisOrganization.length === 0) {
      router.push(`/organizations`);
    }
  }, [isDataReady, thisOrganization, router]);

  useEffect(() => {
    if (isDataReady && !credentials) {
      setCredentials(theseCredentials);
    }
  }, [isDataReady, credentials, setCredentials, theseCredentials]);

  useEffect(() => {
    if (isDataReady && thisOrganization && !organization) {
      setOrganization(thisOrganization);
    }
  }, [isDataReady, thisOrganization, organization, setOrganization]);

  useEffect(() => {
    if (isDataReady && thisSchema && !schema) {
      setSchema(thisSchema);
    }
  }, [isDataReady, thisSchema, schema, setSchema]);

  useEffect(() => {
    if (organization && evmAddress && o_did) {
      if (organization.owner === evmAddress) {
        setIsOwner(true);
      }
    }
  }, [o_did, evmAddress, organization]);

  return (
    <div>
      {isOwner && (
        <Modal open={showTransferSchema} toggle={toggleTransferSchema}>
          <h3 className="font-bold text-lg mb-6">Transfer Organization</h3>
          <div>
            <label className="label" htmlFor="to">
              <span className="label-text uppercase">Owner address</span>
              <span className="label-text-alt font-mono">0X000000000000000000000000000000000000</span>
            </label>
            <input
              className="input input-bordered w-full font-mono"
              type="text"
              name="ownerAddress"
              value={toTransferSchema.ownerAddress}
              onChange={handleTransferChange}
              disabled={!isOwner}
            />
            <label className="label" htmlFor="to">
              <span className="label-text uppercase">Organization DID</span>
              <span className="label-text-alt font-mono"></span>
            </label>
            <input
              className="input input-bordered w-full font-mono"
              type="number"
              name="orgId"
              step={1}
              min={0}
              value={toTransferSchema.orgId}
              onChange={handleTransferChange}
              disabled={!isOwner}
            />
          </div>
          <div className="modal-action">
            <button className="btn btn-error" onClick={handleTranserSchema}>
              Transfer
            </button>
            <button className="btn btn-info" onClick={toggleTransferSchema}>
              Cancel
            </button>
          </div>
        </Modal>
      )}
      <div className="flex place-items-center p-6 md:p-0">
        <h1 className="text-3xl font-bold my-6">{schema?.details.title}</h1>
        <div className="flex-grow flex place-content-end">
          {isOwner && (
            <button className="btn btn-warning btn-sm" onClick={toggleTransferSchema}>
              Transfer Schema
            </button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 p-6 md:p-0">
        {credentials &&
          credentials.length > 0 &&
          credentials.map((credential) => (
            <DocumentCard
              key={credential.did}
              credential={credential}
              schema={schema}
              organization={organization}
              isOwner={isOwner}
            />
          ))}

        {credentials && credentials.length === 0 && "No data"}
      </div>
    </div>
  );
}

const DocumentCard = ({ credential, schema, organization, isOwner }) => {
  const { contract } = useContext(ContractContext);
  const [verified, setVerified] = useState();

  const isRevokable = credential.state === 1 || credential.state === 3;

  async function handleRevoke(status) {
    const toaster = toast.loading("Verifying identity");
    try {
      const revoke = await contract.attestValidate(credential.did, organization.did, status);
      await revoke.wait();
      toast.update(toaster, { render: "Identity verified", isLoading: false, type: "success", autoClose: 5000 });
      setVerified(undefined);
    } catch (error) {
      console.log(error);
      toast.update(toaster, { render: "Failed to verify identity!", isLoading: false, type: "error", autoClose: 5000 });
    }
  }

  const verification = useCallback(async () => {
    const v = await contract.verify(credential.did);
    setVerified(v);
  }, [contract, setVerified, credential]);

  return (
    <div className=" rounded-2xl p-6  border-gray-100 bg-base-100 relative overflow-hidden">
      <div className="flex flex-col ">
        <div className="flex-row place-content-center gap-4 hidden md:flex">
          <div className="form-control">
            <label className="label pl-0">
              <span className="label-text font-bold">DID</span>
            </label>
            <textarea
              className="w-full focus:outline-none resize-none bg-transparent font-mono text-xs"
              readOnly
              value={credential.did}
            />
          </div>
          <div className="form-control flex-grow">
            <label className="label pl-0">
              <span className="label-text font-bold">CID</span>
            </label>
            <textarea
              className="w-full focus:outline-none resize-none bg-transparent font-mono text-xs"
              readOnly
              value={credential.cid}
            />
          </div>

          <div className="form-control flex-grow">
            <label className="label pl-0">
              <span className="label-text font-bold">Owner</span>
            </label>
            <a
              href={`/profile?address=${credential.owner}`}
              target="_blank"
              className="btn-link cursor-pointer font-mono text-xs"
            >
              {credential.owner}
            </a>
          </div>
          <div className="form-control flex-grow">
            <label className="label pl-0">
              <span className="label-text font-bold">Status</span>
            </label>
            {credential.isVerified && <div className="font-bold text-xs text-success">Verified</div>}
            {!credential.isVerified && <div className="font-bold text-xs text-error">Unverified</div>}
          </div>
          <div className="flex flex-row place-items-center place-content-center gap-6">
            <a
              className="py-2 px-4 rounded-2xl btn btn-primary"
              href={`/credentials/${credential.did}`}
              target="_blank"
            >
              Detail
            </a>
            {isOwner && (
              <>
                {!credential.isVerified && (
                  <button
                    className="py-2 px-4 btn btn-warning rounded-2xl"
                    onClick={() => {
                      handleRevoke(1);
                    }}
                  >
                    Verify
                  </button>
                )}
                {isRevokable && (
                  <button
                    className="py-2 px-4 flex-grow btn btn-warning rounded-2xl"
                    onClick={() => {
                      credential.isVerified && handleRevoke(0);
                      !credential.isVerified && handleRevoke(1);
                    }}
                  >
                    {credential.isVerified ? "Revoke" : "Unrevoke"}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <div className="md:hidden flex flex-col gap-4">
        <div className="flex flex-row place-content-between">
          <p className="font-bold text-sm">DID: </p>
          <p className="text-sm font-mono">{credential.did}</p>
        </div>
        <div className="flex flex-row place-content-between">
          <p className="font-bold text-sm">Status: </p>
          {credential.isVerified && <p className="font-bold text-xs text-success">Verified</p>}
          {!credential.isVerified && <p className="font-bold text-xs text-error">Unverified</p>}
        </div>
        <div className="flex flex-row place-content-between">
          <p className="font-bold text-sm">Address: </p>
          <p className="text-sm font-mono">{credential.owner}</p>
        </div>
        <div className="flex flex-row place-content-between ">
          <p className="font-bold text-sm">CID: </p>
          <p className="text-sm font-mono">{credential.cid}</p>
        </div>
        <div className="w-full flex flex-row place-items-stretch place-content-stretch gap-6">
          <button className="py-2 px-4 rounded-2xl btn btn-sm btn-primary flex-grow">Detail</button>
          {isOwner && (
            <>
              {!credential.isVerified && (
                <button
                  className="py-2 px-4 btn btn-warning btn-sm rounded-2xl flex-grow"
                  onClick={() => {
                    handleRevoke(1);
                  }}
                >
                  Verify
                </button>
              )}
              {isRevokable && (
                <button
                  className="py-2 px-4 flex-grow btn btn-sm btn-warning rounded-2xl"
                  onClick={() => {
                    credential.isVerified && handleRevoke(0);
                    !credential.isVerified && handleRevoke(1);
                  }}
                >
                  {credential.isVerified ? "Revoke" : "Unrevoke"}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { ethers } from "ethers";
import Link from "next/link";
import Image from "next/image";
import Modal from "../../../components/modal";
import { VscEllipsis, VscTrash } from "react-icons/vsc";
import { VscVerified, VscUnverified, VscKebabVertical } from "react-icons/vsc";
// import BtnWithAuth from "../../hooks/useAuthCallback";

import { toast } from "react-toastify";

// Context
import { ContractContext } from "../../../contexts/contract";
import { DataContext } from "../../../contexts/data";
import { WalletContext } from "../../../contexts/wallet";

const initialToBurnSchema = { title: "", did: null };

export default function Org() {
  const { organizations, schemas: allSchemas, isDataReady } = useContext(DataContext);
  const { evmAddress } = useContext(WalletContext);
  const { contract } = useContext(ContractContext);

  const [showBurnOrganization, setShowBurnOrganization] = useState(false);
  const [showBurnSchema, setShowBurnSchema] = useState(false);
  const [toBurnSchema, setToBurnSchema] = useState(initialToBurnSchema);
  const [showTransferOrganization, setShowTransferOrganization] = useState(false);
  const [toTransferOrganization, setToTransferOrganization] = useState("");

  const [isOwner, setIsOwner] = useState();
  const [organization, setOrganization] = useState();
  const [schemas, setShemas] = useState();

  const router = useRouter();
  const { o_did } = router.query;

  function toggleBurnSchemaModal() {
    setShowBurnSchema(!showBurnSchema);
  }

  function toggleBurnOrganizationModal() {
    setShowBurnOrganization(!showBurnOrganization);
  }

  function toggleTransferOrganization() {
    setShowTransferOrganization(!showTransferOrganization);
  }

  const handleBurnOrganization = async () => {
    const toast_id = toast.loading("Burning organization!");
    try {
      const burn = await contract.burn(o_did);
      await burn.wait();
      toast.update(toast_id, { render: "Organization burnt!", type: "success", isLoading: false, autoClose: 2000 });
    } catch (error) {
      toast.update(toast_id, {
        render: `Failed! ${error.message.toString()}`,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    }
    setShowBurnOrganization(false);
  };

  async function handleBurnSchema() {
    const toaster = toast.loading(`Burning organization schema`);
    try {
      const burn = await contract.burn(toBurnSchema.did);
      await burn.wait();
      toast.update(toaster, { render: "Burnt successfully.", isLoading: false, type: "success", autoClose: 3000 });
    } catch (error) {
      toast.update(toaster, {
        render: `Failed to burn organization schema!`,
        isLoading: false,
        type: "error",
        autoClose: 5000,
      });
    }
    setShowBurnSchema(false);
    setToBurnSchema(initialToBurnSchema);
  }

  async function handleTransferOrganization() {
    if (schemas && schemas.length > 0) {
      toast.error("Please transfer all of the schemas to other organization first or either burn them.");
      return;
    }
    const toaster = toast.loading(`Transfering organization`);
    try {
      const tx = await contract.transferOrganzation(o_did, toTransferOrganization);
      await tx.wait();
      toast.update(toaster, {
        render: "Transfered organization successfully.",
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
    setShowTransferOrganization(false);
  }

  const schemaByOrg = allSchemas.filter((s) => s.parent == o_did);
  const initOrgData = useCallback(() => {
    const org = organizations.filter((o) => o.did == o_did);
    if (org.length === 0) router.push("/organizations");
    setOrganization(org[0]);
  }, [organizations, o_did, router, setOrganization]);

  const initSchemasData = useCallback(() => {
    if (allSchemas.length === 0) setShemas([]);
    const _schemas = schemaByOrg;
    setShemas(_schemas);
  }, [allSchemas, schemaByOrg, setShemas]);

  const checkOwership = useCallback(() => {
    const ownership = evmAddress === organization.owner;
    setIsOwner(ownership);
  }, [evmAddress, organization]);

  useEffect(() => {
    if (isDataReady && organizations.length > 0 && typeof organization === "undefined") initOrgData();
  }, [isDataReady, organizations, organization, initOrgData]);

  useEffect(() => {
    if (isDataReady && typeof schemas === "undefined") initSchemasData();
  }, [isDataReady, schemas, initSchemasData]);

  useEffect(() => {
    if (typeof organization !== "undefined" && typeof isOwner === "undefined") checkOwership();
  });

  if (!organization) {
    return <div>Loading...</div>;
  }
  return (
    <>
      {/* toggleBurnSchemaModal */}
      <Modal open={showBurnSchema} toggle={toggleBurnSchemaModal}>
        <h3 className="font-bold text-lg">Caution!</h3>
        <p className="py-4">You are about to remove this type! This is irriversable! Are you sure</p>
        <div className="modal-action">
          <button className="btn btn-error" onClick={handleBurnSchema}>
            Remove
          </button>
          <button className="btn btn-info" onClick={toggleBurnSchemaModal}>
            Cancel
          </button>
        </div>
      </Modal>
      <Modal open={showBurnOrganization} toggle={toggleBurnOrganizationModal}>
        <h3 className="font-bold text-lg">Caution!</h3>
        <p className="py-4">
          You are about to remove {organization.details.name || "a organization"}! This is irriversable! Are you sure
        </p>
        <div className="modal-action">
          <button className="btn btn-error" onClick={handleBurnOrganization}>
            Remove
          </button>
          <button className="btn btn-info" onClick={toggleBurnOrganizationModal}>
            Cancel
          </button>
        </div>
      </Modal>
      {isOwner && (
        <Modal open={showTransferOrganization} toggle={toggleTransferOrganization}>
          <h3 className="font-bold text-lg mb-6">Transfer Organization</h3>
          <div>
            <label className="label" htmlFor="to">
              <span className="label-text uppercase">Owner address</span>
              <span className="label-text-alt font-mono">0X000000000000000000000000000000000000</span>
            </label>
            <input
              className="input input-bordered w-full font-mono"
              type="text"
              name="to"
              value={toTransferOrganization}
              onChange={(e) => setToTransferOrganization(e.target.value)}
              disabled={!isOwner}
            />
          </div>
          <div className="modal-action">
            <button className="btn btn-error" onClick={handleTransferOrganization}>
              Transfer
            </button>
            <button className="btn btn-info" onClick={toggleTransferOrganization}>
              Cancel
            </button>
          </div>
        </Modal>
      )}
      <div className="flex justify-between rounded-xl">
        <h1 className="font-bold text-xl px-4 md:px-0">{organization.details.name}</h1>

        <div className="hidden md:block">
          {isOwner && (
            <div>
              <label
                className="btn btn-sm btn-warning rounded-xl modal-button ml-2"
                onClick={toggleTransferOrganization}
              >
                Transfer Organzation
              </label>
              <label
                className="btn btn-error btn-sm rounded-xl modal-button ml-2"
                onClick={toggleBurnOrganizationModal}
              >
                Burn Organzation
              </label>

              <Link href={`/organizations/${o_did}/mint_schema`}>
                <label className="btn btn-info btn-sm rounded-xl modal-button ml-2" htmlFor="my-modal-3">
                  Mint Schema
                </label>
              </Link>
            </div>
          )}
        </div>

        <div className="dropdown dropdown-end block md:hidden">
          <label tabIndex={0} className="btn btn-sm flex place-content-center place-items-start btn-circle mr-4">
            <VscKebabVertical size={24} />
          </label>
          <ul tabIndex={0} className="dropdown-content menu p-0 shadow bg-base-200 rounded-box w-52">
            <li>
              <label
                className="btn btn-sm btn-warning rounded-xl modal-button ml-2"
                onClick={toggleTransferOrganization}
              >
                Transfer Organzation
              </label>
            </li>
            <li>
              <label
                className="btn btn-error btn-sm rounded-xl modal-button ml-2"
                onClick={toggleBurnOrganizationModal}
              >
                Burn Organzation
              </label>
            </li>
            <li>
              <Link href={`/organizations/${o_did}/mint_schema`}>
                <label className="btn btn-info btn-sm rounded-xl modal-button ml-2" htmlFor="my-modal-3">
                  Mint Schema
                </label>
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <br />

      <div
        className="grid gap-6 mt-4 p-4 md:p-0"
        style={{
          gridTemplateColumns: "repeat(auto-fill, minmax(280, 1fr))",
        }}
      >
        {schemas &&
          schemas.map((schema) => {
            return (
              <TypeCard
                key={schema.cid}
                type={schema}
                isOwner={isOwner}
                orgId={o_did}
                setToBurnSchema={setToBurnSchema}
                toggleBurnSchemaModal={toggleBurnSchemaModal}
              />
            );
          })}
      </div>
      <br />
    </>
  );
}

const TypeCard = ({ type, isOwner, orgId, setToBurnSchema, toggleBurnSchemaModal }) => {
  function handleBurnSchema() {
    setToBurnSchema({ did: type.did, title: type.details.title });
    toggleBurnSchemaModal();
  }

  return (
    <div className="w-auto rounded-xl p-3  border-gray-100 bg-base-100 relative">
      <div className="flex space-x-4 p-4">
        <div className="w-40 h-40 text-center hidden md:block">
          <Image
            className="w-40 h-40 mx-auto object-contain"
            src={type.details.images[0]}
            alt=""
            width={160}
            height={160}
            layout="responsive"
            objectFit="contain"
          />
        </div>
        <div className="flex flex-col gap-4">
          <h4 className="text-xl font-semibold">{type.details.title}</h4>
          <p className="flex-grow">{type.details.description}</p>
          <div className="flex gap-4 place-items-end">
            {isOwner && (
              <Link href={`/organizations/${orgId}/schemas/${type.did}/mint_credential`}>
                <button className="btn py-2 px-4 text-white leading-none rounded-xl font-bold  bg-primarypink hover:bg-opacity-75  uppercase">
                  Create
                </button>
              </Link>
            )}

            {!isOwner && (
              <Link href={`/organizations/${orgId}/schemas/${type.did}/mint_credential`}>
                <button className="btn py-2 px-4 text-white leading-none rounded-xl font-bold  bg-primarypink hover:bg-opacity-75  uppercase">
                  Request
                </button>
              </Link>
            )}

            <Link href={`/organizations/${orgId}/schemas/${type?.did}`}>
              <button className="btn py-2 px-4 text-white leading-none rounded-xl font-bold  bg-primarypink hover:bg-opacity-75  uppercase">
                Details
              </button>
            </Link>
          </div>
        </div>
      </div>
      {isOwner && (
        <div className="dropdown dropdown-end absolute top-3 right-3">
          <label tabIndex={0} className="btn btn-sm btn-circle m-1">
            <VscEllipsis size={24} />
          </label>
          <ul tabIndex={0} className="dropdown-content menu p-0 shadow bg-base-200 rounded-box w-52">
            <li>
              <a className="btn btn-error text-error-content justify-start rounded-box" onClick={handleBurnSchema}>
                <VscTrash size={18} /> Delete
              </a>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

// const DocumentCard = ({ res, setIsCheckUnverifiedDocs }) => {
//   const { organizations, isOrgLoading, credentialTypes, createDocument } = React.useContext(DataContext);
//   const { evmWallet } = useContext(WalletContext);

//   const [typeDetail, setTypeDetail] = useState();
//   const [orgDetail, setOrgDetail] = useState();
//   const [docDetail, setDocDetail] = useState();
//   const [cType, setCType] = useState();

//   function toNumber(number) {
//     const toUnit = ethers.utils.formatEther(number).toString();
//     const roundedCount = Math.round(parseFloat(toUnit) * 10 ** 18);
//     return roundedCount;
//   }

//   async function getCType() {
//     const id = toNumber(res.ctypeId);
//     const ct = credentialTypes.filter((c) => c.id === id)[0];

//     const orgId = toNumber(ct.orgId);

//     const ctDetail = await fetch(ct.propertiesURI)
//       .then((res) => res.json())
//       .then((data) => data)
//       .catch((error) => console.log(error));

//     const doc = await fetch(res.propertyURI)
//       .then((res) => res.json())
//       .then((data) => data)
//       .catch((error) => console.log(error));

//     const org = organizations.filter((o) => toNumber(o.id) === orgId)[0];

//     setTypeDetail(ctDetail);
//     setOrgDetail(org);
//     setDocDetail(doc);
//     setCType(ct);
//   }

//   const handleCreateDoc = async () => {
//     const { ctypeId, to, name, propertyURI, propertyHash, _id } = res;
//     createDocument({ ctypeId, to, name, propertyURI, propertyHash });
//     deletePendingRequest(_id);
//     setIsCheckUnverifiedDocs(true);
//   };

//   const deletePendingRequest = async (id) => {
//     const signer = new ethers.Wallet(evmWallet.evmPrivateKey);
//     const signature = await signer.signMessage("decentralized_identity");

//     var myHeaders = new Headers();
//     myHeaders.append("Authorization", signature);
//     myHeaders.append("Content-Type", "application/json");

//     const raw = JSON.stringify({
//       id: id,
//     });

//     const requestOptions = {
//       method: "POST",
//       headers: myHeaders,
//       body: raw,
//       redirect: "follow",
//     };

//     fetch("https://attestation.koompi.org/claims/delete", requestOptions)
//       .then((response) => response.text())
//       .then((result) => {
//         setIsCheckUnverifiedDocs(true);
//       })
//       .catch((error) => console.log("error", error));
//   };

//   useEffect(() => {
//     getCType();
//   }, []);

//   useEffect(() => {
//     console.log(res);
//   }, [res]);

//   return (
//     <div className=" rounded-lg p-6  border-gray-100 bg-base-100 relative overflow-hidden">
//       <div className="flex flex-col place-items-start place-content-start">
//         {typeDetail && typeDetail.images && (
//           <div className="w-full  h-max flex place-content-center place-items-center mb-4">
//             <img className="w-auto max-h-64" src={typeDetail.images[0]} alt="" />
//           </div>
//         )}
//         <div className="w-full flex flex-col flex-grow space-y-2">
//           <h4 className="text-2xl font-semibold">{res.name}</h4>
//           <Badge status={res.status} />
//           <div className="font-normal text-sm">BY: {orgDetail?.name}</div>
//           <textarea className="w-full mt-2 focus:outline-none resize-none" value={res.propertyHash} readOnly />
//           <div className="flex space-x-4">
//             <button className="p-2 flex-grow text-white leading-none rounded font-bold mt-2 btn btn-info btn-sm hover:bg-opacity-75 text-xs uppercase">
//               Detail
//             </button>
//             <button
//               className="p-2 text-white leading-none rounded font-bold mt-2 btn btn-success btn-sm hover:bg-opacity-75 text-xs uppercase"
//               onClick={handleCreateDoc}
//             >
//               Approve
//             </button>
//             <button
//               className="p-2 text-white leading-none rounded font-bold mt-2 btn btn-error btn-sm hover:bg-opacity-75 text-xs uppercase"
//               onClick={(e) => deletePendingRequest(res._id)}
//             >
//               Reject
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

function Badge({ status }) {
  if (status) {
    return (
      <div className="badge badge-success gap-2 p-4 pr-8 absolute -right-4 top-4 font-bold">
        <VscVerified size={24} />
        Verified
      </div>
    );
  }

  return (
    <div className="badge badge-error gap-2 p-4 pr-8 absolute -right-4 top-4 font-bold">
      <VscUnverified size={24} />
      Verification pending
    </div>
  );
}

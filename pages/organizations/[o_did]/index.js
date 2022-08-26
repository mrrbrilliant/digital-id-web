import React, { useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { ethers } from "ethers";
import Link from "next/link";
import Image from "next/image";
import Modal from "../../../components/modal";
import { VscEllipsis, VscTrash } from "react-icons/vsc";
import { VscVerified, VscUnverified } from "react-icons/vsc";
// import BtnWithAuth from "../../hooks/useAuthCallback";

import { toast } from "react-toastify";

// Context
import { ContractContext } from "../../../contexts/contract";
import { DataContext } from "../../../contexts/data";
import { WalletContext } from "../../../contexts/wallet";

const initialToBurnSchema = { title: "", did: null };

export default function Org() {
  const { organizations, schemas: allSchemas, isDataReady } = useContext(DataContext);
  const { publicKey } = useContext(WalletContext);
  const { contract } = useContext(ContractContext);

  const [showBurnOrganization, setShowBurnOrganization] = useState(false);
  const [showBurnSchema, setShowBurnSchema] = useState(false);
  const [toBurnSchema, setToBurnSchema] = useState(initialToBurnSchema);

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
    const title = toBurnSchema.title;
    const toaster = toast.loading(`Burning "${title}" schema`);
    try {
      const burn = await contract.burn(toBurnSchema.did);
      await burn.wait();
      toast.update(toaster, { render: "Burnt successfully.", isLoading: false, type: "success", autoClose: 3000 });
    } catch (error) {
      toast.update(toaster, {
        render: `Failed to burn "${title}" schema!`,
        isLoading: false,
        type: "error",
        autoClose: 5000,
      });
    }
    setShowBurnSchema(false);
    setToBurnSchema(initialToBurnSchema);
  }

  const schemaByOrg = allSchemas.filter((s) => s.parent == o_did);
  const initOrgData = useCallback(() => {
    const org = organizations.filter((o) => o.did == o_did);
    if (org.length === 0) router.push("/organizations");
    setOrganization(org[0]);
  }, [organizations, o_did, router, setOrganization]);

  const initSchemasData = useCallback(() => {
    if (allSchemas.length === 0) setShemas([]);
    const _schemas = allSchemas.filter((s) => s.details.parent == o_did);
    setShemas(_schemas);
  }, [allSchemas, o_did, setShemas]);

  const checkOwership = useCallback(() => {
    const ownership = publicKey === organization.owner;
    setIsOwner(ownership);
  }, [publicKey, organization]);

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
      <div className="flex justify-between  rounded-xl">
        <h1 className="font-bold text-xl p-2">{organization.details.name}</h1>

        {isOwner && (
          <div>
            <label
              className="btn btn-error btn-outline rounded-xl modal-button ml-2"
              onClick={toggleBurnOrganizationModal}
            >
              Burn Organzation
            </label>

            <Link href={`/organizations/${o_did}/mint_schema`}>
              <label className="btn bg-primary rounded-xl modal-button ml-2" htmlFor="my-modal-3">
                Mint Schema
              </label>
            </Link>
          </div>
        )}
      </div>

      <br />
      {/* <div>
        <pre>{JSON.stringify(allSchemas, null, 4)}</pre>
      </div> */}
      <div className="grid grid-cols-2 mt-3 gap-7">
        {allSchemas &&
          schemaByOrg.map((schema) => {
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
      {/* {isOwner && unVerifiedDocs.length > 0 && (
        <div className="my-10">
          <h3 className="font-bold text-xl p-2">Attestation Requests</h3>
          <div className="grid grid-cols-3 mt-6 gap-6 ">
            {unVerifiedDocs &&
              unVerifiedDocs.map((res, index) => {
                return <DocumentCard key={index} res={res} setIsCheckUnverifiedDocs={setIsCheckUnverifiedDocs} />;
              })}
          </div>
        </div>
      )} */}
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
    <div className=" rounded-xl p-3  border-gray-100 bg-base-100 relative">
      <div className="flex space-x-4 p-4">
        <div className="w-40 h-40 text-center">
          {/* <Image
            className="w-40 h-40 mx-auto object-contain"
            src={
              type?.images?.length > 0
                ? `${type?.images[0]}`
                : "https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/MoEYS_%28Cambodia%29.svg/1200px-MoEYS_%28Cambodia%29.svg.png"
            }
            alt=""
            width={160}
            height={160}
            layout="responsive"
            objectFit="contain"
          /> */}
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
        <div className="relative">
          <h4 className="text-xl font-semibold">{type.details.title}</h4>
          <p className="text-lg mt-2">{type.details.description}</p>
          <div className="absolute bottom-0 flex gap-4">
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

const DocumentCard = ({ res, setIsCheckUnverifiedDocs }) => {
  const { organizations, isOrgLoading, credentialTypes, createDocument } = React.useContext(DataContext);
  const { wallet } = useContext(WalletContext);

  const [typeDetail, setTypeDetail] = useState();
  const [orgDetail, setOrgDetail] = useState();
  const [docDetail, setDocDetail] = useState();
  const [cType, setCType] = useState();

  function toNumber(number) {
    const toUnit = ethers.utils.formatEther(number).toString();
    const roundedCount = Math.round(parseFloat(toUnit) * 10 ** 18);
    return roundedCount;
  }

  async function getCType() {
    const id = toNumber(res.ctypeId);
    const ct = credentialTypes.filter((c) => c.id === id)[0];

    const orgId = toNumber(ct.orgId);

    const ctDetail = await fetch(ct.propertiesURI)
      .then((res) => res.json())
      .then((data) => data)
      .catch((error) => console.log(error));

    const doc = await fetch(res.propertyURI)
      .then((res) => res.json())
      .then((data) => data)
      .catch((error) => console.log(error));

    const org = organizations.filter((o) => toNumber(o.id) === orgId)[0];

    setTypeDetail(ctDetail);
    setOrgDetail(org);
    setDocDetail(doc);
    setCType(ct);
  }

  const handleCreateDoc = async () => {
    const { ctypeId, to, name, propertyURI, propertyHash, _id } = res;
    createDocument({ ctypeId, to, name, propertyURI, propertyHash });
    deletePendingRequest(_id);
    setIsCheckUnverifiedDocs(true);
  };

  const deletePendingRequest = async (id) => {
    const signer = new ethers.Wallet(wallet.privateKey);
    const signature = await signer.signMessage("decentralized_identity");

    var myHeaders = new Headers();
    myHeaders.append("Authorization", signature);
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({
      id: id,
    });

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow",
    };

    fetch("https://attestation.koompi.org/claims/delete", requestOptions)
      .then((response) => response.text())
      .then((result) => {
        setIsCheckUnverifiedDocs(true);
      })
      .catch((error) => console.log("error", error));
  };

  useEffect(() => {
    getCType();
  }, []);

  useEffect(() => {
    console.log(res);
  }, [res]);

  return (
    <div className=" rounded-lg p-6  border-gray-100 bg-base-100 relative overflow-hidden">
      <div className="flex flex-col place-items-start place-content-start">
        {typeDetail && typeDetail.images && (
          <div className="w-full  h-max flex place-content-center place-items-center mb-4">
            <img className="w-auto max-h-64" src={typeDetail.images[0]} alt="" />
          </div>
        )}
        <div className="w-full flex flex-col flex-grow space-y-2">
          <h4 className="text-2xl font-semibold">{res.name}</h4>
          <Badge status={res.status} />
          <div className="font-normal text-sm">BY: {orgDetail?.name}</div>
          <textarea className="w-full mt-2 focus:outline-none resize-none" value={res.propertyHash} readOnly />
          <div className="flex space-x-4">
            <button className="p-2 flex-grow text-white leading-none rounded font-bold mt-2 btn btn-info btn-sm hover:bg-opacity-75 text-xs uppercase">
              Detail
            </button>
            <button
              className="p-2 text-white leading-none rounded font-bold mt-2 btn btn-success btn-sm hover:bg-opacity-75 text-xs uppercase"
              onClick={handleCreateDoc}
            >
              Approve
            </button>
            <button
              className="p-2 text-white leading-none rounded font-bold mt-2 btn btn-error btn-sm hover:bg-opacity-75 text-xs uppercase"
              onClick={(e) => deletePendingRequest(res._id)}
            >
              Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

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

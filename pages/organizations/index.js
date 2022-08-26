import React, { useState, useEffect, useContext, useCallback } from "react";
import Link from "next/link";
import Modal from "../../components/modal";
import { v4 as uid } from "uuid";
import { VscChevronDown } from "react-icons/vsc";
import Image from "next/image";
// import BtnWithAuth from "../../hooks/useAuthCallback";
import { toast } from "react-toastify";

// Context
import { WalletContext } from "../../contexts/wallet";
import { DataContext } from "../../contexts/data";
import { ContractContext } from "../../contexts/contract";

const initialState = {
  name: "",
  type: "",
  docURL: "",
  docHash: "",
  ownerId: "",
};

const Organizations = () => {
  // Context
  const { publicKey } = useContext(WalletContext);
  const { organizations } = useContext(DataContext);
  const { contract } = useContext(ContractContext);

  // const { setCb, toggleAuthenticationRequest, wallet } = useContext(WalletContext);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  // const [createModalOpendoc, setCreateModalOpendoc] = useState(false);
  // const [createModalOpenType, setCreateModalOpenType] = useState(false);

  const [extension, setExtension] = useState({
    logo: "",
    website: "",
  });
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [createOrgForm, setCreateOrgForm] = useState({
    name: "",
    description: "",
    website: "",
    logo: "",
  });

  // Functions
  function toggleCreateOpenModal() {
    setCreateModalOpen(!createModalOpen);
  }

  // const [state, setState] = useState(initialState);
  // const [createCtypeForm, setCreateCtypeForm] = useState({
  //   id: uid(),
  //   organizationId: -1,
  //   propertiesURI: "",
  //   propertiesHash: "",
  //   transferable: false,
  //   revokable: false,
  //   expirable: false,
  //   lifespan: 0,
  // });

  function handleLogoChange(e) {
    const { name, value, files } = e.target;
    const id = toast.loading("Uploading the logo.");
    if (files.length === 0) return;
    setIsUploadingImages(true);

    let formData = new FormData();
    formData.append("logo", files[0], files[0].name);
    var requestOptions = {
      method: "POST",
      body: formData,
    };
    fetch("https://gateway.kumandra.org/api/add", requestOptions)
      .then((response) => response.text())
      .then((response) => {
        const data = response.split("\n");

        let urls = [];
        for (let i = 0; i < data.length; i++) {
          if (data[i] !== "") {
            let _d = JSON.parse(data[i]);
            urls.push(`https://gateway.kumandra.org/files/${_d.Hash}`);
          }
        }
        setCreateOrgForm({ ...createOrgForm, logo: urls[0] });
        toast.update(id, { render: "Logo upload completed.", type: "success", isLoading: false, autoClose: 2000 });
      })
      .catch((error) => {
        toast.update(id, { render: "Logo upload failed.", type: "error", isLoading: false, autoClose: 5000 });
        return null;
      });
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCreateOrgForm({ ...createOrgForm, [name]: value });
  };

  function uploadJson() {
    const id = toast.loading("Creating CID.");
    const str = JSON.stringify(createOrgForm);
    const strblob = new Blob([str], { type: "text/plain" });

    const formdata = new FormData();
    formdata.append("file", strblob, "file.json");

    const requestOptions = {
      method: "POST",
      body: formdata,
    };

    return fetch("https://gateway.kumandra.org/api/add", requestOptions)
      .then((response) => response.text())
      .then((result) => {
        const data = result.split("\n");
        toast.update(id, { render: "CID created.", type: "success", isLoading: false, autoClose: 2000 });
        return data.filter((d) => d !== "");
      })
      .catch((error) => {
        toast.update(id, { render: "CID creation failed.", type: "error", isLoading: false, autoClose: 5000 });
        throw error;
      });
  }
  const handleCreateOrg = async (e) => {
    e.preventDefault();
    const id = toast.loading("Minting organization.");

    try {
      const json = await uploadJson();
      const _cid = JSON.parse(json[0]);
      const cid = _cid.Hash;

      const org = await contract.mintOrganization(cid);
      await org.wait();
      toast.update(id, { render: "Success! Organization minted.", type: "success", isLoading: false, autoClose: 2000 });
      toggleCreateOpenModal();
    } catch (error) {
      toast.update(id, { render: `Failed! ${error.toString()}`, type: "error", isLoading: false, autoClose: 5000 });
    }
  };

  useEffect(() => {
    console.log(organizations);
  }, [organizations]);

  const ownOrgs = organizations.filter((org) => org.owner === publicKey);
  const otherOrgs = organizations.filter((org) => org.owner !== publicKey);

  return (
    <div>
      {/* =================>create organization Modal<================== */}
      <Modal open={createModalOpen} toggle={toggleCreateOpenModal}>
        <form className="form-control w-full" onSubmit={handleCreateOrg}>
          {createOrgForm.logo && (
            <div className="w-full absolute -top-20 left-0 flex place-items-center place-content-center">
              <div className="avatar">
                <div className="w-28 rounded-full ring-4 ring-primary ring-offset-base-100 ring-offset-4">
                  <img src={createOrgForm.logo} alt="" />
                </div>
              </div>
            </div>
          )}

          <label className="label">
            <span className="label-text text-lg">What is your organization name?</span>
          </label>
          <input
            type="text"
            placeholder="Selendra"
            className=" w-full p-2 rounded input input-bordered autofill:bg-transparent"
            name="name"
            value={createOrgForm.name}
            onChange={handleChange}
          />

          <label className="label">
            <span className="label-text text-lg">Describe your organization.</span>
          </label>
          <textarea
            className="h-24 w-full p-2 rounded input input-bordered autofill:bg-transparent"
            placeholder="Interoperable Nominated Proof-of-Stake network for developing and running Substrate-based and EVM compatible blockchain applications."
            name="description"
            value={createOrgForm.description}
            onChange={handleChange}
            maxLength={512}
          />

          <label className="label">
            <span className="label-text text-lg">Your organization website</span>
          </label>
          <input
            type="text"
            placeholder="https://selendra.org"
            className=" w-full p-2 rounded input input-bordered autofill:bg-transparent"
            name="website"
            onChange={handleChange}
          />
          <label className="label">
            <span className="label-text text-lg">Your organization logo</span>
          </label>
          <input
            type="file"
            className="input input-bordered w-full flex place-content-center h-full p-2 rounded autofill:bg-transparent"
            name="logo"
            onChange={handleLogoChange}
          />

          <input type="submit" className="btn btn-primary mt-4" value="Create" />
        </form>
      </Modal>

      {/* ===================owner Organization======================= */}
      <div className="flex flex-col gap-6">
        <div className="flex place-content-center place-items-center">
          <h3 className="font-bold flex-grow">My Organizations</h3>
          <div className="flex justify-end  rounded-xl space-x-4">
            {/* <BtnWithAuth callback={toggleCreateOpenModal} className="">
            </BtnWithAuth> */}
            <label className="btn btn-primary rounded-xl modal-button" onClick={toggleCreateOpenModal}>
              Create Organizations
            </label>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-7">
          {organizations &&
            ownOrgs.map((org, index) => {
              return (
                <div key={index} className="w-auto bg-base-100 p-4 rounded-xl transform transition-all duration-300">
                  <div className="flex items-center space-x-4">
                    <Image
                      className="flex-none w-14 h-14 rounded-full object-cover"
                      src={org.details.logo || `https://avatars.dicebear.com/api/male/${org.cid}.svg`}
                      width={96}
                      height={96}
                      alt=""
                    />

                    <p className="font-bold">{org.details.name}</p>
                  </div>
                  <div className="align-middle">
                    <div className="py-2 flex items-center align-middle overflow-hidden">
                      <div className=" border-t w-full border-gray-300"></div>
                      <p className="mx-4 text-center">Report</p>
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                  </div>
                  <br />
                  <div className="flex items-center space-x-4 mb-2">
                    <h1>Asset types :</h1>
                    <p className="font-bold">80</p>
                  </div>

                  <div className="flex items-center space-x-4 mb-2">
                    <h1>Assets created :</h1>
                    <p className="font-bold">80</p>
                  </div>

                  <div className="flex items-center space-x-4">
                    <h1>Holders :</h1>
                    <p className="font-bold">80</p>
                  </div>

                  <div className="mt-4 cursor-pointer">
                    <Link href={`/organizations/${org.did}`} as={`/organizations/${org.did}`}>
                      <p className="w-full bg-primary text-white font-semibold text-center p-2 rounded-md hover:bg-opacity-80">
                        Detail
                      </p>
                    </Link>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* =========================>other organization======================= */}

      <div className="py-6">
        <h3 className="font-bold">Other Organizations</h3>
      </div>
      <div className="grid grid-cols-4 gap-7 mt-4">
        {organizations &&
          otherOrgs.map((org, index) => {
            return (
              <div key={index} className="w-auto bg-base-100 p-4 rounded-xl transform transition-all duration-300">
                <div className="flex items-center space-x-4">
                  <Image
                    className="flex-none w-14 h-14 rounded-full object-cover"
                    src={org.details.logo || `https://avatars.dicebear.com/api/male/${org.cid}.svg`}
                    width={96}
                    height={96}
                    alt=""
                  />

                  <p className="font-bold">{org.details.name}</p>
                </div>
                <div className="align-middle">
                  <div className="py-2 flex items-center align-middle overflow-hidden">
                    <div className=" border-t w-full border-gray-300"></div>
                    <p className="mx-4 text-center">Report</p>
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                </div>
                <br />
                <div className="flex items-center space-x-4 mb-2">
                  <h1>Asset types :</h1>
                  <p className="font-bold">80</p>
                </div>

                <div className="flex items-center space-x-4 mb-2">
                  <h1>Assets created :</h1>
                  <p className="font-bold">80</p>
                </div>

                <div className="flex items-center space-x-4">
                  <h1>Holders :</h1>
                  <p className="font-bold">80</p>
                </div>

                <div className="mt-4 cursor-pointer">
                  <Link href={`/organizations/${org.did}`} as={`/organizations/${org.did}`}>
                    <p className="w-full bg-primary text-white font-semibold text-center p-2 rounded-md hover:bg-opacity-80">
                      Detail
                    </p>
                  </Link>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default Organizations;

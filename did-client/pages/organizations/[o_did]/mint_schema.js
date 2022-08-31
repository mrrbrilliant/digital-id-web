/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect, useContext, useCallback } from "react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import { v4 as uid } from "uuid";
import { VscClose } from "react-icons/vsc";

// Contexts
import { ContractContext } from "../../../contexts/contract";
import { DataContext } from "../../../contexts/data";
import { WalletContext } from "../../../contexts/wallet";

// components
import Modal from "../../../components/modal";
import StateOption from "../../../components/stateOption";
import StateDetail from "../../../components/stateDetail";

// Constants
import STATES from "../../../constants/meta-states";
import CONTENT_TYPES from "../../../constants/json-content-types";

const initialScheme = {
  $id: "https://selendra.org/schema.json",
  $schema: "https://json-schema.org/draft/2020-12/schema",
  title: "",
  description: "",
  ownerId: "",
  images: [],
};

const initialState = () => ({
  id: uid(),
  name: "",
  type: "",
  descriptions: "",
});

const MintSchema = () => {
  const router = useRouter();
  // Contexts
  const { contract } = useContext(ContractContext);
  const { organizations, isDataReady } = useContext(DataContext);
  const { evmWallet, evmAddress, toggleAuthenticationRequest, show } = useContext(WalletContext);
  // States
  const [currentOrganization, setCurrentOrganization] = useState();
  const [schema, setSchema] = useState(initialScheme);
  const [propsArray, setPropsArray] = useState([initialState()]);
  const [propsObject, setPropsObject] = useState({});

  const [confirmMintSchemaModal, setConfirmMintSchemaModal] = useState(false);
  const [valid, setValid] = useState(false);

  const [stateNumber, setStateNumber] = useState(0);
  const ctype = 1;
  const { o_did: parent } = router.query;

  function toggleMintSchemaModal() {
    setConfirmMintSchemaModal(!confirmMintSchemaModal);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setSchema({ ...schema, [name]: value });
  }

  function removeProp(id) {
    setPropsArray((prev) => prev.filter((n) => n.id !== id));
  }

  function handleAddOption(data, id) {
    // @ts-ignore
    if (data !== "") {
      setPropsArray((prev) => prev.map((n) => (n.id === id ? { ...n, options: [...n.options, data] } : n)));
    }
  }

  function handleRemoveOption(data, id) {
    setPropsArray((prev) =>
      prev.map((n) => (n.id === id ? { ...n, options: n.options.filter((o) => o !== data) } : n))
    );
  }

  function addProp() {
    setPropsArray((prev) => [...prev, initialState()]);
  }

  function handlePropsChange(e, id) {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setPropsArray((prev) => prev.map((n) => (n.id === id ? { ...n, [name]: checked } : n)));
      return;
    }
    if (name === "type") {
      const v = JSON.parse(value);
      setPropsArray((prev) => prev.map((n) => (n.id === id ? { ...n, [name]: v.value, label: v.label } : n)));
      return;
    }
    setPropsArray((prev) => prev.map((n) => (n.id === id ? { ...n, [name]: value } : n)));
  }

  async function prepareSchema() {
    const _org = currentOrganization.details.name.trim().replace(/\s/g, "").toLocaleLowerCase();
    const _title = schema.title.trim().replace(/\s/g, "").toLocaleLowerCase();

    const _schema = schema;
    _schema["$id"] = `https://did.kumandra.org/${_org}/${_title}.schema.json`;
    _schema["properties"] = propsObject;
    return _schema;
  }

  function handleSelectFiles(e) {
    e.preventDefault();
    const files = e.target.files;
    let _files = [];

    for (let i = 0; i < files.length; i++) {
      _files.push(files[i]);
    }
    handleUploadImages(_files);
  }

  function handleUploadImages(_images) {
    if (_images.length === 0) return;

    let formData = new FormData();
    for (let i = 0; i < _images.length; i++) {
      formData.append(i.toString(), _images[i], _images[i].name);
    }

    var requestOptions = {
      method: "POST",
      body: formData,
    };

    return fetch("https://gateway.kumandra.org/api/add", requestOptions)
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
        setSchema({ ...schema, images: urls });
      })
      .catch((error) => null);
  }

  async function upload(formData) {
    const _title = schema.title.replace(/\s/g, "").toLocaleLowerCase();

    const str = JSON.stringify(formData);
    var strblob = new Blob([str], { type: "text/plain" });

    var formdata = new FormData();
    formdata.append("file", strblob, `${_title}.schema.json`);

    var requestOptions = {
      method: "POST",
      body: formdata,
    };

    return await fetch("https://gateway.kumandra.org/api/add", requestOptions)
      .then((response) => response.text())
      .then((result) => {
        const data = result.split("\n");
        const _obj = JSON.parse(data[0]);
        return _obj.Hash;
      })
      .catch((error) => false);
  }

  const arrayToObject = React.useCallback(() => {
    const obj = {};
    for (let i = 0; i < propsArray.length; i++) {
      const name = propsArray[i].name;
      const type = propsArray[i].type;
      const description = propsArray[i].descriptions;
      const label = propsArray[i].label;
      obj[name] = { type, description, label };
    }
    return obj;
  }, [propsArray]);

  const handleMintSchema = async () => {
    toggleMintSchemaModal();
    const toaster = toast.loading(`Preparing schema minting`);
    try {
      const _schema = await prepareSchema();
      toast.update(toaster, {
        render: `Registering CID to decentralized storage...`,
        type: "info",
        isLoading: true,
      });
      const cid = await upload(_schema);
      console.log(cid);
      toast.update(toaster, { render: `Minting ${cid}...`, type: "info", isLoading: true });
      console.log(contract.provider);
      const mintSchema = await contract.mintSchema(cid, stateNumber, parent);
      await mintSchema.wait();
      toast.update(toaster, {
        render: `Minted successfully!`,
        type: "success",
        isLoading: false,
        autoClose: 4000,
      });
    } catch (error) {
      console.log(error);
      toast.update(toaster, {
        render: `Minting failed!`,
        type: "error",
        isLoading: false,
        autoClose: 8000,
      });
    }
  };

  function hanldeStateNumberChange(e) {
    const { value } = e.target;
    setStateNumber(value);
  }

  const validateCreate = useCallback(() => {
    const _valid_schema = schema.description !== "" && schema.ownerId !== "" && schema.images.length > 0;
    const _props = propsArray.map((a) => (a.name !== "" && a.type !== "" && a.descriptions !== "" ? true : false));
    const _valid_props = _props.filter((x) => !x);
    const _valid = _valid_schema && (_valid_props.length === 0 ? true : false);
    setValid(_valid);
  }, [schema, propsArray, setValid]);

  const setOwnerAddress = useCallback(() => {
    setSchema({ ...schema, ownerId: evmAddress });
  }, [setSchema, schema, evmAddress]);

  const setCurrentOrgInfo = useCallback(() => {
    const _org = organizations.filter((o) => o.did == parent);
    if (_org.length === 0) router.push("/organizations");
    setCurrentOrganization(_org[0]);
  }, [organizations, parent, router, setCurrentOrganization]);

  useEffect(() => {
    validateCreate();
  }, [validateCreate]);

  useEffect(() => {
    const o = arrayToObject();
    setPropsObject(o);
  }, [arrayToObject]);

  useEffect(() => {
    if (isDataReady && organizations && organizations.length > 0 && typeof currentOrganization === "undefined")
      setCurrentOrgInfo();
  }, [isDataReady, organizations, currentOrganization, setCurrentOrgInfo]);

  useEffect(() => {
    if (evmAddress && schema.ownerId === "") setOwnerAddress();
  }, [evmAddress, schema, setOwnerAddress]);

  useEffect(() => {
    if (!evmWallet && !show) toggleAuthenticationRequest();
  }, [evmWallet, toggleAuthenticationRequest, show]);

  return (
    <div className="">
      <Modal open={confirmMintSchemaModal} toggle={toggleMintSchemaModal}>
        <h3 className="font-bold text-lg">Caution!</h3>
        <p className="py-4">Are you sure? Please double check!</p>
        <div className="modal-action">
          <button className="btn btn-success flex-grow" onClick={handleMintSchema}>
            Create
          </button>
          <button className="btn btn-error flex-grow" onClick={toggleMintSchemaModal}>
            Cancel
          </button>
        </div>
      </Modal>

      <div className="bg-base-100 p-6 rounded-lg">
        <form>
          <div>
            <h1 className="font-bold text-2xl mb-6">Documents Template</h1>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="flex flex-col space-y-4">
              <div>
                <label className="label">
                  <span className="label-text">Title</span>
                </label>
                <input
                  name="title"
                  value={schema.title}
                  onChange={handleChange}
                  className="w-full p-2 input input-bordered"
                />
              </div>
              <div>
                <label className="label">
                  <span className="label-text">Description</span>
                </label>
                <textarea
                  rows={6}
                  name="description"
                  value={schema.description}
                  onChange={handleChange}
                  className="w-full p-2 textarea textarea-bordered"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 ">
              <div className="flex">
                <h3 className="flex-grow label-text">Logo</h3>
                {schema.images && schema.images.length > 0 && (
                  <button
                    className="btn btn-xs btn-error rounded-xl"
                    onClick={() => setSchema({ ...schema, images: [] })}
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="w-fulll h-full flex-grow space-x-4 bg-base-200 rounded-lg">
                {!schema.images ||
                  (schema.images.length === 0 && (
                    <label
                      className="btn btn-ghost h-full rounded-xl modal-button flex place-content-center place-items-center"
                      htmlFor="formFile"
                    >
                      Add Logo
                    </label>
                  ))}
                <input
                  type="file"
                  id="formFile"
                  placeholder="No files chosen"
                  className="input input-bordered hidden"
                  multiple={false}
                  onChange={handleSelectFiles}
                />

                {schema.images && schema.images.length > 0 && (
                  <div className="carousel carousel-center h-64 p-4 space-x-4 rounded-box justify-center">
                    {schema.images.map((img, index) => {
                      return (
                        <div key={index} className="carousel-item">
                          <img src={img} alt="" className="rounded-box w-full" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <h1 className="font-bold text-2xl my-6">Category</h1>
          </div>
          <div className="w-full h-16 grid grid-cols-5 gap-6 my-6">
            {STATES.map((data) => (
              <StateOption
                key={data.value}
                data={data}
                stateNumber={stateNumber}
                hanldeStateNumberChange={hanldeStateNumberChange}
              />
            ))}
          </div>
          {stateNumber > 1 && stateNumber < 4 && (
            <div className="my-6">
              <label className="label">
                <span className="label-text">How many days will this document expired after creating date?</span>
              </label>
              <input
                name="lifespan"
                type="number"
                step={1}
                min={1}
                // value={createCtypeForm.lifespan}
                onChange={handleCtypeFormChange}
                className="w-full p-2 input input-bordered"
              />
              <label className="label">
                <span className="label-text text-error font-bold">
                  Caution! This document will expire in {createCtypeForm.lifespan} days after created!
                </span>
              </label>
            </div>
          )}
          {STATES.map((data) => (
            <StateDetail key={data.value} data={data} stateNumber={stateNumber} />
          ))}

          <div className="my-6">
            <h1 className="font-bold text-2xl my-6">Properties</h1>
          </div>

          {propsArray.map((property) => (
            <NewProperty
              key={property.id}
              data={property}
              removeProp={removeProp}
              handlePropsChange={handlePropsChange}
              handleAddOption={handleAddOption}
              handleRemoveOption={handleRemoveOption}
            />
          ))}
        </form>
        <button className="w-full btn btn-outline font-bold rounded-lg no-animation h-12 my-6" onClick={addProp}>
          Add property
        </button>
        <button onClick={toggleMintSchemaModal} className="btn btn-block border-none" disabled={!valid}>
          SUBMIT
        </button>
      </div>
    </div>
  );
};

export default MintSchema;

const NewProperty = ({ data, removeProp, handlePropsChange, handleAddOption, handleRemoveOption }) => {
  const [newOption, setNewOption] = useState("");

  function handleChange(e) {
    const { value } = e.target;
    setNewOption(value);
  }

  function handleAdd() {
    handleAddOption(newOption, data.id);
    setNewOption("");
  }

  const [selected, setSelected] = useState(CONTENT_TYPES[0].value);

  return (
    <div className="h-max">
      <div className="grid grid-cols-3 gap-7 mt-3">
        <div>
          <label className="label">
            <span className="label-text">Field name</span>
          </label>

          <input
            name="name"
            value={data.name}
            onChange={(e) => handlePropsChange(e, data.id)}
            className="w-full input input-bordered"
          />
        </div>
        <div>
          <label className="label">
            <span className="label-text">Content type</span>
          </label>
          <div className="relative inline-block w-full">
            <select
              name="type"
              className="w-full input input-bordered"
              defaultValue={data.type}
              onChange={(e) => handlePropsChange(e, data.id)}
            >
              <option value={""}>Choose a type</option>
              {CONTENT_TYPES.map((option) => (
                <option key={option.label} value={JSON.stringify(option)}>
                  {option.label}
                </option>
              ))}
            </select>

            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                <path
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                  fillRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>
        <div className="flex place-content-center">
          <div className="w-full">
            <label className="label">
              <span className="label-text">Description</span>
            </label>

            <textarea
              name="descriptions"
              rows={1}
              value={data.descriptions}
              onChange={(e) => handlePropsChange(e, data.id)}
              className="w-full textarea textarea-bordered"
            />
          </div>
          <div className="px-2">
            <button className="btn btn-xs btn-error btn-circle mt-12" onClick={() => removeProp(data.id)}>
              <VscClose size={22} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

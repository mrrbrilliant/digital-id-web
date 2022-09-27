/* eslint-disable @next/next/no-img-element */
import React, { useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/router";
import ZSchema from "z-schema";

import Papa from "papaparse";

// Contexts
import { ContractContext } from "../../../../../contexts/contract";
import { DataContext } from "../../../../../contexts/data";
import { WalletContext } from "../../../../../contexts/wallet";
import { toast } from "react-toastify";

export default function MintCredential() {
  const { organizations, schemas, isDataReady, fetchData } = useContext(DataContext);
  const { evmWallet, evmAddress, evmPrivateKey, toggleRequest, show } = useContext(WalletContext);
  const { contract } = useContext(ContractContext);

  const [formData, setFormData] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [isOwner, setIsOwner] = useState();
  const [tableHeaders, setTableHeaders] = useState([]);
  const [attachments, setAttachments] = useState();
  const [csvContent, setCsvContent] = useState("");
  const [bulkData, setBulkData] = useState([]);

  const [document, setDocument] = useState({
    ctypeId: -1,
    to: "",
    name: "",
    propertyURI: "",
    propertyHash: "",
  });

  // States
  const [organization, setOrganization] = useState(null);
  const [schema, setSchema] = useState(null);

  const router = useRouter();
  const { o_did: orgId, s_did: schemaId } = router.query;
  const thisOrganization = organizations.filter((o) => o.did == orgId);
  const thisSchema = schemas.filter((s) => s.did == schemaId);
  // Functions
  function handleFormChange(e) {
    const { name, value, type, checked } = e.target;

    if (type === "number") {
      setFormData({ ...formData, [name]: parseInt(value) || 0 });
      return;
    }
    setFormData({ ...formData, [name]: value });
  }
  function validate() {
    const validator = new ZSchema({
      ignoreUnresolvableReferences: true,
      noEmptyStrings: true,
      noExtraKeywords: false,
      noEmptyArrays: true,
    });
    const _schema = schema.details;
    const valid = validator.validate(formData, _schema);
    const _errors = validator.getLastErrors();
    if (_errors) {
      setValidationErrors(_errors);
      return false;
    }
    if (valid) {
      return true;
    }
  }
  function uploadCID() {
    const str = JSON.stringify(formData);
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
        return data.filter((d) => d !== "");
      })
      .catch((error) => {
        throw error;
      });
  }

  const handleMintCredential = async () => {
    const toaster = toast.loading("Validating credential");
    const _validate = validate();
    if (!_validate) {
      toast.update(toaster, { render: "Validation failed", isLoading: false, autoClose: 10000, type: "error" });
      validationErrors.forEach((e) => toast.error(`${e.path}: ${e.message}`, { autoClose: 10000 }));
      return;
    }

    if (_validate) {
      try {
        toast.update(toaster, { render: "Uplading CID to decentralized storage.", isLoading: true });
        const data = await uploadCID();
        if (data) {
          const _data = JSON.parse(data[0]);
          const CID = _data.Hash;
          toast.update(toaster, { render: "Minting credential.", isLoading: true });
          const mint = await contract.mintDocument(CID, schemaId);
          await mint.wait();
          toast.update(toaster, { render: "Minting credential.", isLoading: false, type: "success", autoClose: 3000 });
          await fetchData();
          router.push(`/organizations/${orgId}/schemas/${schemaId}`);
        }
      } catch (error) {
        toast.update(toaster, {
          render: `Minting falied, ${error.message.toString()}`,
          isLoading: false,
          autoClose: 10000,
          type: "error",
        });
      }
    }
  };
  // useCallback =============================
  const initiateFormData = useCallback(() => {
    const fd = {};
    Object.keys(schema.details.properties).forEach((key) => {
      let defaultValue;
      switch (schema.details.properties[key].type) {
        case "number":
          defaultValue = 0;
          break;
        case "array":
          defaultValue = [];
          break;
        case "boolean":
          defaultValue = false;
          break;
        case "object":
          defaultValue = {};
          break;
        default:
          defaultValue = "";
      }
      fd[key] = defaultValue;
    });
    setFormData(fd);
  }, [schema, setFormData]);

  // useEffects ==============================
  // Validate schema exists
  useEffect(() => {
    if (isDataReady && thisSchema.length === 0) {
      router.push(`/organizations/${orgId}`);
    }
  }, [isDataReady, thisSchema, router, orgId]);

  // Validate organization exists
  useEffect(() => {
    if (isDataReady && thisOrganization.length === 0) {
      router.push(`/organizations`);
    }
  }, [isDataReady, thisOrganization, router]);

  // Validate owner
  useEffect(() => {
    if (isDataReady && thisOrganization.length > 0 && thisSchema.length > 0) {
      if (
        thisOrganization[0].owner === evmAddress &&
        thisSchema[0].owner === evmAddress &&
        typeof isOwner === "undefined"
      ) {
        setIsOwner(true);
      }
    }
  }, [isDataReady, thisOrganization, thisSchema, evmAddress, isOwner, setIsOwner]);

  useEffect(() => {
    if (isDataReady && thisOrganization.length !== 0 && !organization) {
      setOrganization(thisOrganization[0]);
    }
  }, [isDataReady, thisOrganization, organization, setOrganization]);

  useEffect(() => {
    if (isDataReady && thisSchema.length > 0 && !schema) {
      setSchema(thisSchema[0]);
    }
  }, [isDataReady, thisSchema, schema, setSchema]);

  useEffect(() => {
    if (isDataReady && schema && !formData) initiateFormData();
  }, [isDataReady, schema, formData, initiateFormData]);

  function handleSelectFiles(e) {
    const files = e.target.files;
    let _files = [];

    for (let i = 0; i < files.length; i++) {
      _files.push(files[i]);
    }

    setAttachments(_files[0]);
  }

  function parseCSV(_csvContent) {
    const lines = Papa.parse(_csvContent.trim());
    return lines;
  }

  function uploadWithParams(data) {
    const str = JSON.stringify(data);
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
        return data.filter((d) => d !== "");
      })
      .catch((error) => {
        throw error;
      });
  }

  async function bulkCreate(data) {
    const valids = [];
    const invalids = [];
    for (let row = 0; row < data.length; row++) {
      const { ownerAddress, ...others } = data[row];
      const validator = new ZSchema({
        ignoreUnresolvableReferences: true,
        noEmptyStrings: true,
        noExtraKeywords: false,
        noEmptyArrays: true,
      });

      const valid = validator.validate(others, schema);
      const _errors = validator.getLastErrors();
      if (_errors) {
        console.log(_errors);
        invalids.push(data[row]);
      }
      if (valid) {
        valids.push(data[row]);
      }
    }

    if (invalids.length > 0) {
      console.log("INVALIDS: ", invalids);
      return;
    }
    const faileds = [];
    let successCount = 0;
    let failedCount = 0;
    const progress = toast.loading(`Progress 0 of ${valids.length}`);
    const success = toast.loading(`Success 0 of ${valids.length}`);
    const failed = toast.loading(`Failed 0 of ${valids.length}`);
    let isReady = false;
    for (let row = 0; row < valids.length; row++) {
      setTimeout(async () => {
        const { ownerAddress, ...others } = valids[row];

        try {
          toast.update(progress, { render: `Progress ${row + 1} of ${valids.length}` });
          const data = await uploadWithParams(others);
          if (data) {
            const _data = JSON.parse(data[0]);
            const CID = _data.Hash;
            const mint = await contract.mintDocument(CID, schemaId);
            await mint.wait();
            const _successCount = successCount + 1;
            if (row === valids.length - 1) {
              toast.update(progress, { render: `Done!`, isLoading: false, autoClose: 5000, type: "info" });
              toast.update(success, {
                render: `Success ${_successCount} of ${valids.length}`,
                isLoading: false,
                type: "success",
                autoClose: 5000,
              });
              toast.update(failed, {
                render: `Failed ${failedCount} of ${valids.length}`,
                isLoading: false,
                type: "error",
                autoClose: 5000,
              });
            } else {
              toast.update(success, {
                render: `Success ${_successCount} of ${valids.length}`,
                isLoading: true,
                type: "success",
              });
            }
            successCount = _successCount;
          }
        } catch (error) {
          faileds.push(valids[row]);

          const _failedCount = failedCount + 1;
          if (row === valids.length - 1) {
            toast.update(progress, { render: `Done!`, isLoading: false, autoClose: 5000, type: "info" });
            toast.update(success, {
              render: `Success ${successCount} of ${valids.length}`,
              isLoading: false,
              type: "success",
              autoClose: 5000,
            });
            toast.update(failed, {
              render: `Failed ${_failedCount} of ${valids.length}`,
              isLoading: false,
              type: "error",
              autoClose: 5000,
            });
          } else {
            toast.update(failed, {
              render: `Failed ${_failedCount} of ${valids.length}`,
              isLoading: true,
              type: "error",
            });
          }
          toast.error(error.toString());
          failedCount = _failedCount;
        }
        if (row === valids.length - 1) {
          toast.dismiss(progress);
          toast.dismiss(success);
          toast.dismiss(failed);
          await fetchData();
          router.push(`/organizations/${orgId}/schemas/${schemaId}`);
        }
      }, row * 10000);
    }
  }

  useEffect(() => {
    if (attachments) {
      const file_reader = new FileReader();
      let file = "";
      file_reader.onloadend = (data) => {
        const d = data.target?.result;
        setCsvContent(d);
      };
      file_reader.readAsText(attachments);
    }
  }, [attachments]);

  useEffect(() => {
    if (csvContent !== "") {
      const result = parseCSV(csvContent);

      const [headers, ...body] = result.data;
      const data = [];

      setTableHeaders(headers);

      for (let row = 0; row < body.length; row++) {
        const obj = {};
        for (let col = 0; col < body[row].length; col++) {
          obj[headers[col]] = body[row][col];
        }
        data.push(obj);
      }
      let keys = [];

      Object.keys(schema.details.properties).forEach((property) => {
        const t = schema["details"]["properties"][property]["type"];

        keys.push(property);
      });

      if (keys.length === 0) {
        return;
      }

      for (let key = 0; key < keys.length; key++) {
        for (let d = 0; d < data.length; d++) {
          const row = data[d][keys[key]];
          const isarray = Array.isArray(row);
          console.log("row:", isarray, row);

          if (isarray) {
            const _row = row.split(",").filter((r) => r !== "");
            data[d][keys[key]] = _row;
            continue;
          }

          data[d][keys[key]] = row;
        }
      }
      setBulkData(data);
    }
  }, [csvContent, schema]);

  return (
    <div className="w-full">
      <div className="flex place-content-between place-items-center mb-10">
        <h1 className="uppercase font-bold text-xl">{document.name}</h1>
        <label className="btn btn-info" htmlFor="csv">
          Import CSV
        </label>
      </div>

      {bulkData.length === 0 && (
        <div>
          <label className="label" htmlFor="to">
            <span className="label-text uppercase font-bold">Owner address</span>
            <span className="label-text-alt font-mono">0X000000000000000000000000000000000000</span>
          </label>
          <input
            className="input input-bordered w-full font-mono"
            type="text"
            name="to"
            value={document.to}
            disabled={!isOwner}
          />
          <label className="label" htmlFor="to"></label>
          <input
            id="csv"
            name="csv"
            className="input input-bordered w-full hidden"
            type="file"
            accept=".csv"
            onChange={handleSelectFiles}
          />
        </div>
      )}

      {bulkData.length === 0 &&
        formData &&
        schema?.details?.properties &&
        Object.keys(schema?.details?.properties).map((key) => {
          return (
            <div key={key} className="mb-4">
              <label className="label" htmlFor={key}>
                <span className="label-text uppercase font-bold">{key}</span>
                <span className="label-text-alt">{schema?.details?.properties[key]?.description}</span>
              </label>

              <InputType
                properties={schema?.details?.properties}
                name={key}
                value={formData[key]}
                handleFormChange={handleFormChange}
              />
            </div>
          );
        })}

      <div className="overflow-x-auto">
        <table className="table table-compact w-full font-mono text-xs">
          <thead>
            <tr>
              <th></th>
              {tableHeaders.map((h) => (
                <th key={h} className="normal-case text-xs px-0">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bulkData.length > 0 &&
              bulkData.map((row, index) => (
                <tr key={index}>
                  <td className="text-xs">{index + 1}</td>
                  {Object.entries(row).map((k) => (
                    <td key={k[1]} className="text-xs p-0">
                      <input type="text" className="w-[98%] h-full py-1" value={k[1]} />
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {bulkData.length > 0 && (
        <div className="w-full flex justify-end space-x-4 mt-8">
          {isOwner && (
            <button className="btn btn-block btn-primary" onClick={() => bulkCreate(bulkData)}>
              Create all
            </button>
          )}
        </div>
      )}

      {bulkData.length === 0 && (
        <div className="w-full flex justify-end space-x-4 mt-8">
          <button className="btn btn-block btn-primary" onClick={handleMintCredential}>
            Create
          </button>
        </div>
      )}
    </div>
  );
}

function InputType({ properties, name, value, handleFormChange }) {
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [images, setImages] = useState([]);

  const type = properties[name]?.type || "string";
  const label = properties[name]?.label;

  function handleUploadImages(e) {
    if (e) e.preventDefault();

    console.log(e.target);

    setIsUploadingImages(true);

    let formData = new FormData();
    for (let i = 0; i < e.target.files.length; i++) {
      formData.append(i.toString(), e.target.files[i], e.target.files[i].name);
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
        setImages(urls);
        handleFormChange({ target: { name: e.target.name, value: urls } });
      })
      .catch((error) => null);
  }

  const str_input = (
    <input className="input input-bordered w-full" type="text" name={name} value={value} onChange={handleFormChange} />
  );
  const int_input = (
    <input
      className="input input-bordered w-full"
      type="number"
      name={name}
      value={value}
      onChange={handleFormChange}
    />
  );
  const boolean_input = (
    <input
      className="input input-bordered w-full"
      type="checkbox"
      name={name}
      checked={value}
      onChange={(e) => handleFormChange(e)}
    />
  );

  const images_input = (
    <div className="flex flex-col space-y-4">
      <div className="w-full h-auto input input-bordered">
        <label htmlFor={name} className="w-full h-12 flex place-content-center place-items-center cursor-pointer">
          <input className="hidden" type="file" id={name} name={name} multiple={true} onChange={handleUploadImages} />
          Select images
        </label>
      </div>
      {images && images.length > 0 && (
        <div className="grid grid-cols-4 gap-4 rounded-box">
          {images.map((img, index) => {
            return (
              <div key={index} className="rounded-lg overflow-hidden flex place-items-center place-content-center">
                <img src={img} alt="" className="h-full w-auto" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  if (type === "integer" || type === "number") {
    return int_input;
  }

  if (type === "boolean") {
    return boolean_input;
  }

  if (type === "array" && label === "Images") {
    return images_input;
  }

  return str_input;
}

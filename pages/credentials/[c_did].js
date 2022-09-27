import React, { useCallback, useState, useEffect, useContext } from "react";
import { useRouter } from "next/router";
import axios from "axios";

import { DataContext } from "../../contexts/data";
import { ContractContext } from "../../contexts/contract";
import Badge from "../../components/badge";

export default function CredentialDID() {
  const { organizations, schemas, credentials: allCredentails, isDataReady } = useContext(DataContext);

  const [data, setData] = useState();
  const router = useRouter();
  const { c_did } = router.query;

  const init = useCallback(async () => {
    try {
      const data = await axios.get(`/api/did?did=${c_did}`).then((res) => res.data);
      setData(data);
    } catch (error) {}
  }, [setData, c_did]);

  useEffect(() => {
    if (c_did && typeof data === "undefined") {
      init();
    }
  }, [c_did, init]);

  return (
    <div className="w-full flex place-content-center place-items-center">
      {data && <DocumentCard key={data.did} credential={data} schemas={schemas} organizations={organizations} />}
    </div>
  );
}
const DocumentCard = ({ credential, schemas, organizations }) => {
  const { fetchData } = useContext(DataContext);
  const { contract } = useContext(ContractContext);
  const [schema, setSchema] = useState();
  const [organization, setOrganization] = useState();
  const [verified, setVerified] = useState();

  const thisSchema = schemas.filter((s) => s.did === credential.parent)[0];
  const thisOrganization = organizations.filter((o) => o.did === thisSchema.parent)[0];
  const [transferTo, setTransferTo] = useState("");
  const [openTransfer, setOpenTransfer] = useState(false);
  const [checkedImage, setCheckedImage] = useState(false);
  const [images, setImages] = useState([]);

  async function handleTranser() {
    const toaster = toast.loading("Transfering credential");
    try {
      if (transferTo === "") {
        throw new Error("Invalid receiver address");
      }
      if (!ethers.utils.isAddress(transferTo)) {
        throw new Error("Invalid receiver address");
      }

      const tx = await contract.transferCredential(credential.did, transferTo);
      await tx.wait();
      setTransferTo("");
      setOpenTransfer(false);
      fetchData();
      toast.update(toaster, { render: "Transfered successfully!", isLoading: false, type: "success", autoClose: 5000 });
    } catch (error) {
      toast.update(toaster, { render: error.toString(), isLoading: false, type: "error", autoClose: 5000 });
    }
  }

  const findImage = useCallback(() => {
    if (typeof schema !== "undefined" && credential) {
      Object.entries(schema.details.properties).forEach((entry, index) => {
        if (entry[1]["label"] && entry[1]["label"] === "Images") {
          if (credential.details[entry[0]] && credential.details[entry[0]].length > 0) {
            setImages([...images, ...credential.details[entry[0]]]);
          }
        }
      });
    }
    setCheckedImage(true);
  }, [schema, credential, images, setImages]);

  useEffect(() => {
    if (credential && schemas && typeof schema === "undefined") {
      setSchema(thisSchema);
    }
  }, [credential, schemas, schema, setSchema, thisSchema]);

  useEffect(() => {
    if (typeof schema !== "undefined" && typeof organization === "undefined") {
      setOrganization(thisOrganization);
    }
  }, [schema, organization, setOrganization, thisOrganization]);

  useEffect(() => {
    if (organization && schema && credential && !checkedImage) {
      findImage();
    }
  }, [organization, schema, credential, checkedImage, findImage]);

  return (
    <div className="w-full md:w-[20vw] rounded-2xl p-4 border-gray-100 bg-base-100 relative overflow-hidden">
      <div className="h-full flex flex-col place-content-between">
        {images && images.length > 0 && (
          <div className="w-full h-max flex-grow flex place-content-center place-items-center mb-4 rounded-xl overflow-hidden relative">
            <img className="w-full h-auto " src={images[0]} alt="" width={100} height={100} />
          </div>
        )}

        {images && images.length === 0 && (
          <div className="w-full flex-grow h-max flex place-content-center place-items-center mb-4 rounded-xl overflow-hidden">
            <img className="w-full h-auto" src={schema?.details.images[0]} alt="" />
          </div>
        )}

        <div className="w-full flex flex-col space-y-4">
          <div>
            <Badge status={credential.isVerified} />
            <h4 className="text-xl font-semibold uppercase">{schema?.details.title}</h4>
            <div className="font-bold text-xs text-gray-500">{organization?.details.name}</div>
          </div>
          <textarea
            className="w-full mt-2 focus:outline-none credentialize-none text-xs font-mono bg-transparent"
            value={credential.cid}
            readOnly
          />

          <div className="grid grid-cols-3 text-xs gap-y-2 overflow-x-hidden">
            {credential &&
              Object.entries(credential.details).map((e, i) => (
                <React.Fragment key={e[0]}>
                  {e[1]["label"] !== "Images" && <div> {_.startCase(e[0])} :</div>}
                  {e[1]["label"] !== "Images" && (
                    <div className="w-full col-span-2 font-medium text-right bg-transparent resize-none text-ellipsis">
                      {credential.details[e[0]]}
                    </div>
                  )}
                </React.Fragment>
              ))}
          </div>

          {openTransfer && (
            <>
              <textarea
                className="w-full textarea textarea-error mt-2 focus:outline-none credentialize-none"
                placeholder="Transfer to"
                value={transferTo}
                onChange={(e) => setTransferTo(e.target.value)}
              />
              <div className="flex space-x-2">
                <button
                  className="p-2 text-white w-32 leading-none rounded font-bold mt-2 bg-primarypink hover:bg-opacity-75 text-xs uppercase"
                  onClick={(e) => {
                    setTransferTo("");
                    setOpenTransfer(false);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="p-2 text-white w-32 leading-none rounded font-bold mt-2 bg-primarypink hover:bg-opacity-75 text-xs uppercase"
                  onClick={handleTranser}
                >
                  Confirm
                </button>
              </div>
            </>
          )}
          {!openTransfer && (
            <div className="flex space-x-2">
              {credential && credential.state == 4 && (
                <button
                  className="p-2 btn btn-primary btn-sm flex-grow text-white w-32 leading-none rounded-xl font-bold mt-2 bg-primarypink hover:bg-opacity-75 text-xs uppercase"
                  onClick={() => setOpenTransfer(true)}
                >
                  Transfer
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

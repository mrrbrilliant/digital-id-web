import React, { useState, useEffect, useCallback, useContext } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import _ from "lodash";
import ethers from "ethers";
import { DataContext } from "../contexts/data";
import { ContractContext } from "../contexts/contract";
import Badge from "../components/badge";
import { toast } from "react-toastify";
import { QRCode } from "react-qrcode-logo";
import { ContactContext } from "../contexts/contact";

export default function UserProfile() {
  const { addContact, contacts, removeContact } = useContext(ContactContext);
  const { organizations, schemas } = useContext(DataContext);
  const [isIncontact, setIsInContact] = useState();
  const [data, setData] = useState();
  const [masterId, setMasterId] = useState();
  const router = useRouter();
  const { address } = router.query;

  const checkContact = useCallback(() => {
    const exist = contacts.filter((contact) => contact.owner == address);
    if (exist.length === 0) {
      setIsInContact(false);
      return;
    }
    setIsInContact(true);
  }, [contacts, address, setIsInContact]);

  const initMasterID = useCallback(async () => {
    try {
      const _data = await axios.get(`/api/masterId?address=${address}`).then((res) => res.data);
      console.log("_data", _data);
      setMasterId(_data);
    } catch (error) {
      if (error) {
        setMasterId({
          did: -1,
          cid: "",
          owner: address,
          ctype: 2,
          state: 0,
          parent: 1,
          isVerified: true,
          details: {
            name: "Unknow",
            full_name: "Unknow",
            gender: "Unknow",
            email: "Unknow",
            avatar: [`https://avatars.dicebear.com/api/micah/${address}.svg`],
          },
        });
      }
    }
  }, [setMasterId, address]);

  const init = useCallback(async () => {
    try {
      const _data = await axios.get(`/api/assetsOf?address=${address}`).then((res) => res.data);
      setData(_data);
    } catch (error) {}
  }, [setData, address]);

  useEffect(() => {
    if (address && typeof masterId === "undefined") {
      initMasterID();
    }
  }, [address, masterId, initMasterID]);

  useEffect(() => {
    if (address && typeof data === "undefined") {
      init();
    }
  }, [data, init, address]);

  useEffect(() => {
    if (contacts && address && typeof isIncontact === "undefined") {
      checkContact();
    }
  }, [contacts, address, isIncontact, checkContact]);

  return (
    <div>
      <div className="w-full flex rounded-xl bg-gradient-to-r from-green-400 to-blue-500 text-gray-800">
        <div className="w-64">
          <div className="w-full h-full flex flex-col place-content-center place-items-center gap-4">
            <div className="avatar">
              <div className="w-28 bg-base-100 rounded-full ring ring-primary ring-offset-base-100 bg-opacity-50 backdrop-blur ring-offset-2">
                <img
                  src={masterId ? masterId.details.avatar[0] : `https://avatars.dicebear.com/api/micah/${address}.svg`}
                  alt=""
                  className="w-[120px] h-auto"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="stat flex-grow p-6 overflow-x-hidden place-content-center gap-2">
          <div>
            <div className="flex mb-4 text-3xl font-bold">{masterId && masterId?.details.full_name}</div>
            <p className="text-xs font-normal font-mono">EVM: {address}</p>
          </div>
          {masterId && masterId.details.full_name !== "Unknow" && !isIncontact && (
            <button
              className="w-max btn bg-opacity-50 backdrop-blur-sm border-none"
              onClick={() => {
                addContact(masterId);
                setIsInContact(true);
              }}
            >
              Add Contact
            </button>
          )}

          {masterId && masterId.details.full_name !== "Unknow" && isIncontact && (
            <button
              className="w-max btn bg-opacity-50 backdrop-blur-sm border-none"
              onClick={() => {
                removeContact(masterId.did);
                setIsInContact(false);
              }}
            >
              Remove Contact
            </button>
          )}
        </div>

        <div className="p-4">
          <div className="rounded-xl overflow-hidden">
            <QRCode value={address} eyeRadius={5} size={120} />
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-6 gap-6 ">
        {data &&
          data["credentials"].length > 0 &&
          data["credentials"].map((credential) => {
            return (
              <DocumentCard
                key={credential.did}
                credential={credential}
                schemas={schemas}
                organizations={organizations}
              />
            );
          })}
      </div>
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
    <div className="rounded-2xl p-4 border-gray-100 bg-base-100 relative overflow-hidden">
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

          <div className="grid grid-cols-3 text-xs">
            {credential &&
              Object.entries(credential.details).map(
                (e, i) =>
                  i < 3 && (
                    <React.Fragment key={e[0]}>
                      {e[1]["label"] !== "Images" && <div> {_.startCase(e[0])} :</div>}
                      {e[1]["label"] !== "Images" && (
                        <div className="col-span-2 font-medium uppercase text-right">{credential.details[e[0]]}</div>
                      )}
                    </React.Fragment>
                  )
              )}
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
              {credential && Object.entries(credential.details).length > 3 && (
                <button className="p-2 flex-grow btn btn-secondary btn-sm text-xs uppercase">Detail</button>
              )}

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

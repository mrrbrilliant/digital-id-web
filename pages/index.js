import React, { useState, useEffect, useCallback, useContext } from "react";
import { VscLock } from "react-icons/vsc";
import { QRCode } from "react-qrcode-logo";
import { toast } from "react-toastify";
import _ from "lodash";
import Badge from "../components/badge";

// Contents
import { WalletContext } from "../contexts/wallet";
import { BalanceContext } from "../contexts/balance";
import { DataContext } from "../contexts/data";
import { ContractContext } from "../contexts/contract";
import { ethers } from "ethers";
import { NetworkContext } from "../contexts/network";

export default function Home() {
  // Contexts
  const { evmAddress, evmPrivateKey, evmWallet, substrateAddress, toggleAuthenticationRequest } =
    useContext(WalletContext);
  const network = useContext(NetworkContext);
  const { balance, transfer, fetchBalance } = useContext(BalanceContext);
  const { organizations, schemas, credentials, isDataReady, fetchData } = useContext(DataContext);
  // States
  const [showTransfer, setShowTransfer] = useState(false);
  const [showReceive, setShowReceive] = useState(false);
  const [transferData, setTransferData] = useState({
    to: "",
    amount: 0,
  });
  const [validationErrors, setValidationErrors] = useState({
    to: "",
    amount: "",
  });
  const [validationChecked, setValidationChecked] = useState({
    to: false,
    amount: false,
  });
  const [myCredentials, setMyCredentials] = useState();
  const [checkedBalance, setCheckedBalance] = useState(false);

  // Functions
  function toggleTransfer() {
    setShowReceive(false);
    setShowTransfer(!showTransfer);
  }
  function toggleReceive() {
    setShowTransfer(false);
    setShowReceive(!showReceive);
  }
  function handleTransferChange(e) {
    const { name, value } = e.target;
    setTransferData({ ...transferData, [name]: value });
    setValidationChecked({ ...validationChecked, [name]: false });
  }

  async function handleTransfer(e) {
    e.preventDefault();
    const tx = await transfer({ ...transferData });
    if (tx) {
      setTransferData({
        to: "",
        amount: 0,
      });
      setValidationChecked({
        to: false,
        amount: false,
      });
      setShowReceive(false);
      setShowTransfer(false);
    }
  }

  const getMyCredentials = useCallback(() => {
    const mine = credentials.filter((c) => c.owner === evmAddress);
    setMyCredentials(mine);
  }, [credentials, setMyCredentials, evmAddress]);
  useEffect(() => {
    if (isDataReady && credentials.length > 0 && typeof myCredentials === "undefined") {
      getMyCredentials();
    }
  }, [isDataReady, credentials, myCredentials, getMyCredentials]);

  useEffect(() => {
    if (network && evmAddress && !checkedBalance) {
      fetchBalance();
      setCheckedBalance(true);
    }
  }, [network, evmAddress, checkedBalance, setCheckedBalance, fetchBalance]);

  return (
    <div className="flex flex-col gap-6">
      <div className="w-full stats bg-base-100">
        <div className="stat">
          <div className="stat-title">Current balance</div>
          <div className="stat-value">
            <div className="flex mb-4">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "SEL",
                maximumFractionDigits: 6,
              }).format(balance)}
              {!evmPrivateKey && (
                <span>
                  <VscLock fontSize={32} onClick={toggleAuthenticationRequest} />
                </span>
              )}
            </div>
            {evmAddress && <p className="text-xs font-normal font-mono">EVM: {evmAddress}</p>}
            {substrateAddress && <p className="text-xs font-normal font-mono">SEL: {substrateAddress}</p>}
          </div>
          <div className="stat-actions flex gap-6">
            <a
              className="btn btn-sm btn-success flex-grow"
              href="https://faucet.selendra.org/testnet"
              rel="noreferrer"
              target="_blank"
            >
              Deposit
            </a>
            <button className="btn btn-sm btn-primary flex-grow" onClick={toggleTransfer}>
              Transfer
            </button>
            <button className="btn btn-sm btn-secondary flex-grow" onClick={toggleReceive}>
              Receive
            </button>
          </div>
        </div>
      </div>
      {showTransfer && (
        <form className="flex flex-col gap-6 bg-base-100 p-6 rounded-xl" onSubmit={handleTransfer}>
          <div className="flex flex-col">
            <label className="label">
              <span className="label-text">Receiver addcredentials</span>
              <span className="label-text-alt">0x</span>
            </label>

            <input
              type="text"
              name="to"
              className="input input-bordered font-mono"
              placeholder="0x0000000000000000000000000000000000000000"
              value={transferData.to}
              onChange={handleTransferChange}
            />

            {validationErrors.to !== "" && (
              <label className="label">
                <span className="label-text text-error">{validationErrors.to}</span>
              </label>
            )}
          </div>
          <div className="flex flex-col">
            <label className="label">
              <span className="label-text">Amount to be transfered</span>
              <span className="label-text-alt">SEL</span>
            </label>
            <input
              type="number"
              step={0.000001}
              min={0.000001}
              name="amount"
              className="input input-bordered"
              value={transferData.amount}
              onChange={handleTransferChange}
            />
            {validationErrors.amount !== "" && (
              <label className="label">
                <span className="label-text text-error">{validationErrors.amount}</span>
              </label>
            )}
          </div>
          <input
            type="submit"
            name="submit"
            value="SEND"
            className="btn btn-primary"
            disabled={validationErrors.to !== "" || validationErrors.amount !== ""}
          />
        </form>
      )}

      {showReceive && (
        <div className="bg-base-100 rounded-xl p-6 flex flex-col gap-6 place-content-center place-items-center">
          <QRCode value={evmAddress} eyeRadius={5} size={250} />
        </div>
      )}

      <div className="mb-8">
        <div>
          <h3 className="font-bold text-xl">My Documents</h3>
        </div>
        <div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-6 gap-6 ">
            {myCredentials &&
              myCredentials.length > 0 &&
              myCredentials.map((credential, index) => {
                return (
                  <DocumentCard key={index} credential={credential} schemas={schemas} organizations={organizations} />
                );
              })}
          </div>
        </div>
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

  const verification = useCallback(async () => {
    const v = await contract.verify(credential.did);
    setVerified(v);
  }, [contract, setVerified, credential]);

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

  useEffect(() => {
    if (contract && contract.provider && typeof verified === "undefined") {
      verification();
    }
  }, [contract, verified, verification]);

  return (
    <div className="rounded-2xl p-4 border-gray-100 bg-base-100 relative overflow-hidden">
      <div className="h-full flex flex-col place-content-between">
        {images && images.length > 0 && (
          <div className="w-full h-max flex-grow flex place-content-center place-items-center mb-4 rounded-xl overflow-hidden relative">
            <img className="w-full h-auto " src={images[0]} alt="" layout="fixed" width={100} height={100} />
          </div>
        )}

        {images && images.length === 0 && (
          <div className="w-full flex-grow h-max flex place-content-center place-items-center mb-4 rounded-xl overflow-hidden">
            <img className="w-full h-auto" src={schema?.details.images[0]} alt="" />
          </div>
        )}
        {/* {toNumber(credential.ctypeId)} */}
        <div className="w-full flex flex-col space-y-4">
          <div>
            <Badge status={verified} />
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

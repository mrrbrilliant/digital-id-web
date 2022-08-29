import React, { useEffect, useState, useContext, useCallback } from "react";
import { QrReader } from "react-qr-reader";

import { useRouter } from "next/router";
import { WalletContext } from "../contexts/wallet";

export default function Scanner({ toggleQr, isOn }) {
  const { evmWallet, show, toggleAuthenticationRequest, evmAddress } = useContext(WalletContext);
  const [data, setData] = useState({
    id: "",
    link: "",
  });
  const [emitLock, setEmitLock] = useState(false);
  const router = useRouter();

  const submit = useCallback(
    ({ id, signature, evmAddress }) => {
      const myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");

      const raw = JSON.stringify({
        id,
        signature: `Web3 ${signature}`,
        evmAddress,
      });

      const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow",
      };

      fetch(data.link, requestOptions)
        .then((response) => response.json())
        .then((result) => {
          console.log(result);
          setEmitLock(false);
          toggleQr();
        })
        .catch((error) => console.log("error", error));
    },
    [data.link, setEmitLock, toggleQr]
  );

  const signMessage = useCallback(
    (msg) => {
      return evmWallet.signMessage(msg).then((msg) => msg);
    },
    [evmWallet]
  );

  function handleJson(result) {
    let valid = false;
    try {
      let json = JSON.parse(result);
      valid = true;
    } catch (e) {}

    return valid && setData(JSON.parse(result?.text));
  }

  useEffect(() => {
    if (data) {
      if (data.id && !emitLock) {
        setEmitLock(true);
        signMessage(data.id).then((msg) => {
          submit({ id: data.id, signature: msg, evmAddress });
        });
      }
    }
  }, [data, emitLock, setEmitLock, signMessage, submit, evmAddress]);

  useEffect(() => {
    if (!evmWallet && !show) {
      toggleAuthenticationRequest();
    }
  }, [evmWallet, toggleAuthenticationRequest, show]);

  if (!isOn) null;

  return (
    <div
      className="w-full h-full flex place-content-center place-items-center fixed top-0 left-0 backdrop-blur-md z-auto"
      onClick={toggleQr}
    >
      <div
        className="scanbox w-[350px] h-[350px] flex place-content-center place-items-center  rounded-3xl overflow-hidden border-8 bg-primary bg-opacity-30 border-primary border-opacity-30"
        onClick={(e) => e.stopPropagation()}
      >
        {isOn && (
          <QrReader
            scanDelay={500}
            constraints={{ facingMode: "environment" }}
            onResult={(result, error) => {
              if (!!result) {
                handleJson(result);
              }

              if (!!error) {
                console.info(error);
              }
            }}
            className=" w-[500px] scale-[140%]"
          />
        )}
      </div>
    </div>
  );
}

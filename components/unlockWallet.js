import React, { useEffect, useState, useContext, useCallback } from "react";
import { ContractContext } from "../contexts/contract";
import { WalletContext } from "../contexts/wallet";

export default function UnlockWallet() {
  const { wallet, unlockWallet, toggleAuthenticationRequest, show, cb } = useContext(WalletContext);
  const { contractRW } = useContext(ContractContext);
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState(null);

  function handleChange(e) {
    const { value } = e.target;
    setPassword(value);
  }

  function handleSubmit(e) {
    setError(null);
    e.preventDefault();
    unlockWallet({ password })
      .then((data) => {
        if (data) {
          setUnlocked(true);
          toggleAuthenticationRequest();
        }
      })
      .catch((err) => {
        setError(err.toString());
      });
  }

  // ✅ Promise check
  function isPromise(p) {
    if (typeof p === "object" && typeof p.then === "function") {
      return true;
    }

    return false;
  }

  // ✅ Check if return value is promise
  const returnsPromise = useCallback((f) => {
    if (f.constructor.name === "AsyncFunction" || (typeof f === "function" && isPromise(f()))) {
      console.log("✅ Function returns promise");
      return true;
    }

    console.log("⛔️ Function does NOT return promise");
    return false;
  }, []);

  useEffect(() => {
    if (cb) {
      if (unlocked && contractRW) {
        if (returnsPromise(cb)) {
          cb().then(() => {});
          return;
        }
        cb();
      }
    }
  }, [unlocked, wallet, contractRW, cb, returnsPromise]);

  if (show) {
    return (
      <div className="w-screen min-h-screen fixed top-0 left-0 z-50 flex place-items-center place-content-center bg-base-300 bg-opacity-60 backdrop-blur-md">
        <div className="card w-96 bg-base-100 shadow-xl p-6">
          <div className="card-body p-0">
            <a className="label font-bold">UNLOCK WALLET</a>
            <form className="form-control w-full" onSubmit={handleSubmit}>
              <div>
                <label className="label">
                  <span className="label-text">Password to unlock your wallet</span>
                </label>
                <input
                  type="password"
                  placeholder="xxxxxx"
                  className="input input-bordered w-full"
                  name="password"
                  value={password}
                  onChange={handleChange}
                />
                {error && (
                  <label className="label">
                    <span className="label-text text-error">{error}</span>
                  </label>
                )}
              </div>
              <label className="label mt-2">
                <input type="submit" value="UNLOCK" className="w-full btn btn-primary text-primary-content" />
              </label>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return <div></div>;
}

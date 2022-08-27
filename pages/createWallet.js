import React, { useContext, useState, useEffect } from "react";
import { WalletContext } from "../contexts/wallet";
import { ethers } from "ethers";
import { useRouter } from "next/router";
import axios from "axios";
import { BalanceContext } from "../contexts/balance";

const initalState = {
  password: "",
  confirm: "",
  mnemonic: "",
  saved: false,
};

export default function CreateWallet() {
  const { evmWallet, evmAddress, encryptedWallet, checkingAuth, createWallet } = useContext(WalletContext);
  const [isProcessing, setIsProcessing] = useState(false);
  const [form, setForm] = useState(initalState);
  const router = useRouter();

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setForm({ ...form, [name]: checked });
      return;
    }
    setForm({ ...form, [name]: value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (form.password && form.mnemonic) {
      setIsProcessing(true);
      createWallet({ password: form.password, mnemonic: form.mnemonic });
    }
  }

  useEffect(() => {
    if (!form.mnemonic) {
      const mnemonic = ethers.Wallet.createRandom().mnemonic.phrase;
      setForm({ ...form, mnemonic });
    }
  }, [setForm, form]);

  useEffect(() => {
    if (!checkingAuth) {
      if (evmAddress && encryptedWallet) {
        window.location.replace("/");
        return;
      }
    }
  }, [checkingAuth, encryptedWallet, evmAddress, router]);

  return (
    <div className="w-full h-[80vh] flex place-items-center place-content-center">
      <div className="card w-96 shadow-xl p-6 bg-base-100">
        <div className="card-body p-0">
          <a className="label font-bold">CREATE WALLET</a>
          <form className="form-control w-full" onSubmit={handleSubmit}>
            {/* password */}
            <label className="label">
              <span className="label-text">Password to secure your wallet</span>
            </label>
            <input
              type="password"
              placeholder="xxxxxx"
              className="input input-bordered w-full"
              name="password"
              value={form.password}
              onChange={handleChange}
            />
            {/* confirm password */}
            <label className="label">
              <span className="label-text">Confirm password</span>
            </label>
            <input
              type="password"
              placeholder="xxxxxx"
              className="input input-bordered w-full"
              name="confirm"
              value={form.confirm}
              onChange={handleChange}
            />
            <label className="label">
              <span className="label-text">Mnemonic seeds</span>
            </label>
            <textarea
              className="textarea textarea-bordered"
              name="mnemonic"
              value={form.mnemonic}
              onChange={handleChange}
            ></textarea>
            <label className="label cursor-pointer mt-2">
              <span className="label-text">I have kept my seeds</span>
              <input type="checkbox" className="checkbox" name="saved" checked={form.saved} onChange={handleChange} />
            </label>
            <label className="label mt-2">
              <input
                type="submit"
                value="CREATE"
                className={
                  isProcessing
                    ? "w-full btn btn-primary text-primary-content loading"
                    : "w-full btn btn-primary text-primary-content"
                }
                disabled={
                  !form.saved ||
                  !form.mnemonic ||
                  !form.password ||
                  !form.confirm ||
                  form.password !== form.confirm ||
                  isProcessing
                }
              />
            </label>
          </form>
        </div>
      </div>
    </div>
  );
}

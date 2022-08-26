/* eslint-disable @next/next/no-img-element */
import React, { useContext } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTheme } from "next-themes";
import { MdOutlineLightMode, MdOutlineNightlight, MdOutlineQrCodeScanner } from "react-icons/md";
import { VscSignOut, VscSettingsGear, VscPerson, VscScreenFull } from "react-icons/vsc";

import { ProfileContext } from "../contexts/profile";

const navigation = [
  { name: "Organization", href: "/organizations" },
  { name: "Contacts", href: "/contacts" },
];

const Navbar = ({ toggleQr }) => {
  const { theme, setTheme } = useTheme();
  const { profile } = useContext(ProfileContext);

  function classNames(...classes) {
    return classes.filter(Boolean).join(" ");
  }

  function toggleTheme() {
    if (theme === "dark") {
      setTheme("light");
    }

    if (theme === "light") {
      setTheme("dark");
    }
  }

  const router = useRouter();
  return (
    <div className="h-20 navbar bg-base-100 md:px-6 lg:px-[10vw] xl:px-[15vw]">
      <div className="dropdown">
        <label tabIndex={0} className="btn btn-ghost lg:hidden">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
          </svg>
        </label>
        <ul
          tabIndex={0}
          className="menu dropdown-content mt-5 p-2 shadow bg-base-200 rounded-box w-[30vw] bg-opacity-60 backdrop-blur-lg"
        >
          {navigation.map((item) => (
            <li key={item.name}>
              <Link href={item.href}>
                <a
                  className={classNames(
                    router.pathname == `${item.href}`
                      ? "bg-gray-900 text-white"
                      : "text-base-content  hover:bg-gray-700 hover:text-white",
                    "p-4 rounded-md"
                  )}
                >
                  {item.name}
                </a>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex-1">
        <Link href="/">
          <a className="btn btn-ghost normal-case text-xl ">Digital ID</a>
        </Link>
        <div className="flex space-x-4 pl-16 lg:visible invisible">
          {navigation.map((item) => (
            <Link key={item.name} href={item.href}>
              <a
                className={classNames(
                  router.pathname == `${item.href}`
                    ? "bg-gray-900 text-white"
                    : "text-base-content  hover:bg-gray-700 hover:text-white",
                  "px-3 py-2 rounded-md text-sm font-semibold"
                )}
              >
                {item.name}
              </a>
            </Link>
          ))}
        </div>
      </div>
      <div className="flex flex-row gap-4 place-items-center">
        <button className="btn btn-circle bg-opacity-50 border-none" onClick={toggleQr}>
          <MdOutlineQrCodeScanner size={24} />
        </button>

        <label className="btn btn-circle swap swap-rotate bg-opacity-50 border-none">
          <input type="checkbox" onChange={toggleTheme} defaultChecked={theme === "light"} />
          <MdOutlineNightlight className="swap-on fill-current w-6 h-6" />
          <MdOutlineLightMode className="swap-off fill-current w-6 h-6" />
        </label>

        <div className="dropdown dropdown-end">
          <label tabIndex={0} className="btn btn-block btn-circle avatar border-none">
            <div className="h-full rounded-full">
              <img src={profile ? profile.avatar : "https://api.lorem.space/image/face?hash=33791"} alt="" />
            </div>
          </label>
          <ul
            tabIndex={0}
            className=" mt-3 dropdown-content menu p-2 shadow-xl bg-base-100 rounded-box w-52 backdrop-blur-md bg-opacity-90 flex space-y-2"
          >
            <li>
              <a className="flex gap-4">
                <VscPerson size={24} /> Profile
              </a>
            </li>
            <li>
              <a className="flex gap-4">
                <VscSettingsGear size={24} /> Settings
              </a>
            </li>
            <li>
              <a className="flex gap-4">
                <VscSignOut size={24} /> Logout
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Navbar;

import React from "react";

export default function Modal({ children, open, toggle }) {
  return (
    <div
      className={
        open
          ? `w-full h-screen bg-base-content bg-opacity-20 filter backdrop-blur-2xl backdrop-brightness-50 fixed top-0 left-0 z-50 flex place-content-center place-items-center`
          : "hidden"
      }
      onClick={toggle}
    >
      <div
        className={` w-full max-w-xl h-auto m-4 bg-base-100 absolute bg-opacity-100 rounded-lg shadow-lg p-8`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

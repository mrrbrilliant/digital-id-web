import React, { useContext } from "react";
import { ContactContext } from "../contexts/contact";
import { DataContext } from "../contexts/data";
import { VscTrash } from "react-icons/vsc";
import _ from "lodash";
export default function Contacts() {
  const { contacts } = useContext(ContactContext);
  const { organizations, schemas } = useContext(DataContext);

  if (typeof contacts === "undefined") {
    return <div>Loading...</div>;
  }
  return (
    <div className="flex flex-col mt-6 gap-6 ">
      {contacts &&
        contacts.map((contact) => {
          return (
            <DocumentCard key={contact.did} credential={contact} schemas={schemas} organizations={organizations} />
          );
        })}
    </div>
  );
}

const DocumentCard = ({ credential }) => {
  const { removeContact } = useContext(ContactContext);

  return (
    <div className="h-full flex flex-row place-content-center bg-base-100 p-4 rounded-xl gap-6">
      <div className="avatar">
        <div className="w-20 h-20 aspect-square bg-base-100 rounded-full ring ring-primary ring-offset-base-100 bg-opacity-50 backdrop-blur ring-offset-2">
          <img src={credential.details.avatar[0]} alt="" className="w-20 aspect-square h-auto" />
        </div>
      </div>

      <div className="w-full flex flex-col place-content-center">
        <h1 className="font-bold">{credential.details.full_name}</h1>
        <p className="text-xs font-mono">{credential.owner}</p>
      </div>
      <div className="w-full flex flex-row place-content-end place-items-center gap-4">
        <button className="btn btn-error btn-square" onClick={() => removeContact(credential.did)}>
          <VscTrash size={20} />
        </button>
        <a href={`/profile?address=${credential.owner}`} target="_blank" className="w-max btn btn-primary">
          Profile
        </a>
      </div>
    </div>
  );
};

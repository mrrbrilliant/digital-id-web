import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { DataContext } from "./data";
import { WalletContext } from "./wallet";
import { useRouter } from "next/router";

export const ContactContext = createContext();

export default function ContactProvider({ children }) {
  const [contacts, setContacts] = useState();

  const init = useCallback(() => {
    const _contact_list = window.localStorage.getItem("contacts") || null;
    if (!_contact_list) {
      window.localStorage.setItem("contacts", JSON.stringify([]));
      setContacts([]);
      return;
    }
    const contact_list = JSON.parse(_contact_list);
    setContacts(contact_list);
  }, [setContacts]);

  const addContact = useCallback(
    (contact) => {
      const new_contacts = [...contacts, contact];
      window.localStorage.setItem("contacts", JSON.stringify(new_contacts));
      init();
    },
    [contacts, init]
  );

  const removeContact = useCallback(
    (did) => {
      const new_contacts = contacts.filter((contact) => contact.did !== did);
      window.localStorage.setItem("contacts", JSON.stringify(new_contacts));
      init();
    },
    [contacts, init]
  );

  useEffect(() => {
    if (typeof contacts === "undefined") {
      init();
    }
  }, [contacts, init]);

  return <ContactContext.Provider value={{ contacts, addContact, removeContact }}>{children}</ContactContext.Provider>;
}

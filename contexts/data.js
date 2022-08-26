import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { WalletContext } from "./wallet";
import axios from "axios";
import _ from "lodash";

// @ts-ignore
export const DataContext = createContext();
DataContext.displayName = "DataContext";

export default function DataProvider({ children }) {
  // Contexts
  const { publicKey } = useContext(WalletContext);
  // States
  const [isDataReady, setIsDataReady] = useState(false);
  const [data, setData] = useState();
  const [organizations, setOrganizations] = useState([]);
  const [schemas, setSchemas] = useState([]);
  const [credentials, setCredentials] = useState([]);

  const fetchData = useCallback(async () => {
    const _data = await axios.get("/api/dids").then((res) => res.data);
    setOrganizations(_.get(_data, "organizations", []));
    setSchemas(_.get(_data, "schemas", []));
    setCredentials(_.get(_data, "credentials", []));
    setData(_data);
    console.log(_data);
    setIsDataReady(true);
  }, [setData, setIsDataReady, setOrganizations, setSchemas, setCredentials]);

  useEffect(() => {
    if (typeof data === "undefined") {
      fetchData();
    }
  }, [data, fetchData]);
  const value = {
    data,
    organizations,
    schemas,
    credentials,
    isDataReady,
    fetchData,
  };
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

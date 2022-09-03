import config from "./config";
import Contract from "./contract";
import Storage from "./storage";

const DigitalIdentity = async function (privateKey = "") {
  const storage = await Storage();
  const contract = await Contract(privateKey);

  return {
    storage,
    contract,
  };
};

export default DigitalIdentity;

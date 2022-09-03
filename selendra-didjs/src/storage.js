import axios from "axios";
import config from "./config";
export default function Storage() {
  const api = axios.create({
    baseURL: config.api,
  });

  return {
    get(cid = "") {
      return api
        .get(`/files/${cid}`)
        .then((response) => response.data)
        .catch((error) => error);
    },
    addJson(jsonString = "{}") {
      const form = new FormData();
      const json = new Blob([jsonString], { type: "application/json" });
      form.append("1", json, "file.json");
      return api
        .post(`/api/add`, form)
        .then((response) => response.data)
        .catch((error) => error);
    },
    addFile(file, file_name) {
      const form = new FormData();
      form.append("1", file, file_name);
      return api
        .post(`/api/add`, form)
        .then((response) => response.data)
        .catch((error) => error);
    },
  };
}

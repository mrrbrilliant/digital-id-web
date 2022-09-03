import "./style.css";
// import javascriptLogo from "./javascript.svg";
import DID from "selendra-did";
import { ethers } from "ethers";

async function main() {
  const did = await DID("25f56672c9e2d8288defbdb53a34d30428f4ae2def28cc0f500f11f96ce230b8");
  console.log(did.contract.isReadWrite());
  // const hagn_org = await did.storage.addJson(
  //   JSON.stringify({
  //     name: "Jiren",
  //     website: "https://www.facebook.com/MasterofKyubi",
  //     logo: "https://www.facebook.com/photo.php?fbid=2806880242925207&set=pb.100008097763650.-2207520000..&type=3",
  //     description: "Personal blog",
  //   })
  // );
  // console.log(hagn_org);
  // console.log(await did.contract.mutate.mintOrganization(hagn_org["Hash"]));
  // console.log(await did.contract.query.getOwnerOf(hagn_org));
  // console.log(await did.contract.query.getAssetsOf("0x68449677f02c7de878ed10C7225A193BA08b362d"));
  console.log(await did.contract.query.getDid(0));
  console.log(await did.contract.query.getDid(8));
  // console.log(await did.contract.query.getOrganizations());
  console.log(await did.contract.mutate.burnCredential(7));
}

main();

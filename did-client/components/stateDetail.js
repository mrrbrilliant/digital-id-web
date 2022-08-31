import React from "react";
import { VscInfo } from "react-icons/vsc";
import { v4 as uid } from "uuid";
export default function StateDetail({ data, stateNumber }) {
  return (
    <div
      key={data.value}
      className="alert alert-warning bg-opacity-50 select-none"
      style={{
        display: stateNumber != data.value ? "none" : "inherit",
      }}
    >
      <div>
        <VscInfo size={32} />
        <div>
          <h3 className="font-bold">{data.name}</h3>
          <div className="text-sm">
            <p>{data.description}</p>
            <br />
            <ul className="flex space-x-2">
              <li className="font-bold">Examples: </li>
              {data.examples.map((ex) => (
                <li key={uid()}>{ex}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

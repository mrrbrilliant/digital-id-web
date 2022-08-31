import React from "react";

export default function StateOption({ data, stateNumber, hanldeStateNumberChange }) {
  return (
    <label
      key={data.value}
      htmlFor={`radio-${data.value}`}
      className="h-full input input-bordered rounded-xl overflow-hidden flex place-items-center p-6 cursor-pointer relative select-none"
    >
      <input
        type="checkbox"
        id={`radio-${data.value}`}
        name={`radio-${data.value}`}
        className="checkbox checkbox-accent peer z-10"
        value={data.value}
        checked={stateNumber == data.value}
        onChange={hanldeStateNumberChange}
      />
      <span className="ml-6 flex-grow z-10 peer-checked:font-bold">{data.name}</span>

      <div className="w-full h-full left-0 top-0 absolute peer-checked:bg-accent opacity-20 z-0"></div>
    </label>
  );
}

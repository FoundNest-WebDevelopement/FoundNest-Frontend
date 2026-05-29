export default function GateDropDown({

  defaultOption,
  value,
  options = [],
  onChange,
  setLabel
}) {
  return (
    <fieldset className="fieldset">


      <select
        className="select  bg-[#F2F2F2] rounded-md text-xs w-full "
        value={value}
        onChange={(e) => {
          const selectedId = e.target.value;

          const selectedOption = options.find(
            (option) =>
              String(option.gate_id) === selectedId
          );

          onChange(selectedId);

          if (setLabel) {
            setLabel(selectedOption?.gate_name || "");
          }
        }}
        required
      >

        <option disabled value="" >
          {defaultOption}
        </option>

        {options.map((option) => (
          <option
            key={option.gate_id}
            value={option.gate_id}
          >
            {option.gate_name}
          </option>
        ))}

      </select>

    </fieldset>
  );
}
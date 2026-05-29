export default function OfficeDropDown({
  defaultOption,
  value,
  options = [],
  onChange,
  setLabel
}) {
  return (
    <fieldset className="fieldset">

      <select
        className="select bg-[#F2F2F2] rounded-md text-xs w-full"
        value={value}
        onChange={(e) => {
          const selectedId = e.target.value;

          const selectedOption = options.find(
            (option) =>
              String(option.office_id) === selectedId
          );

          onChange(selectedId);

          if (setLabel) {
            setLabel(selectedOption?.office_name || "");
          }
        }}
        required
      >

        <option disabled value="">
          {defaultOption}
        </option>

        {options.map((option) => (
          <option
            key={option.office_id}
            value={option.office_id}
          >
            {option.office_name}
          </option>
        ))}

      </select>

    </fieldset>
  );
}

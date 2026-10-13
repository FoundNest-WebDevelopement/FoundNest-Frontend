export default function StudentSpacedDrowDown({

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
              String(option.shared_space_id) === selectedId
          );

          onChange(selectedId);

          if (setLabel) {
            setLabel(selectedOption?.shared_space_name || "");
          }
        }}
        required
      >

        <option disabled value="" >
          {defaultOption}
        </option>

        {options.map((option) => (
          <option
            key={option.shared_space_id}
            value={option.shared_space_id}
          >
            {option.shared_space_name}
          </option>
        ))}

      </select>

    </fieldset>
  );
}
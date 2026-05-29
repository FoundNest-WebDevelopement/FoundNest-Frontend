export default function StatusDropDown({

  defaultOption,
  value,
  options = [],
  onChange
}) {
  return (
    <fieldset className="fieldset">


      <select
        className="select  bg-[#F2F2F2] rounded-md text-xs w-full "
        value={value}
        onChange={(e) => {onChange(e.target.value), console.log(e.target.value)}}
        required
      >


        {options.map((option) => (
          <option
            key={option}
            value={option}
          >
            {option}
          </option>
        ))}

      </select>

    </fieldset>
  );
}
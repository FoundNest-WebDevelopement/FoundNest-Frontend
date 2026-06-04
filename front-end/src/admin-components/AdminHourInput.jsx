export default function AdminHourInput(
    {title,
  value,
  onChange,
  error,
disabled,
reqField,
}
){
    return(
        <>
     <fieldset className="fieldset">

      <legend className={`fieldset-legend font-medium text-sm`}>
        {title}
         {reqField&&<span className="text-primary">*</span>}
      </legend>

      <div className={`rounded-md ${error ? "p-1 border border-red-600" : ""}`}>

        <input
          type="time"
          className="input bg-white text-sm rounded-md w-full border border-[#DDD9CF]"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />

      </div>

    </fieldset>
        </>
    )
}
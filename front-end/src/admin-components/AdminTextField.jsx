export default function AdminTextField({
                        title,placeholder,
                        value,
                        onChange=() => {},
                        error,
                        reqField,
                        textSize,
                    }) {
    return (
        <>
            <fieldset className="fieldset ">
                <legend className={`fieldset-legend text-sm font-medium`}>
                    {title} 
                    {reqField&&<span className="text-primary">*</span>}
                </legend>
                <div className={`rounded-md ${error? "p-1  border border-red-600":""} `}>
                    <input type="text" className="input border border-[#DDD9CF] bg-white rounded-md text-sm w-full" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
                </div>
            </fieldset>
        </>
    )
}
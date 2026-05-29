export default function AdminTextField({title,placeholder,value,onChange=() => {},error}) {
    return (
        <>
            <fieldset className="fieldset ">
                <legend className="fieldset-legend text-sm font-medium">{title}</legend>
                <div className={`rounded-md ${error? "p-1  border border-red-600":""} `}>
                    <input type="text" className="input border border-[#DDD9CF] bg-white rounded-md text-sm w-full" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
                </div>
            </fieldset>
        </>
    )
}
export default function TextField({title,placeholder,value,onChange=() => {},error, maxLength}) {
    return (
        <>
            <fieldset className="fieldset ">
                <legend className="fieldset-legend ">{title}</legend>
                <div className={`rounded-md ${error? "p-1  border border-red-600":""}`}>
                    <input 
                        type="text" 
                        className="input bg-white rounded-md text-xs w-full" 
                        placeholder={placeholder} 
                        value={value} 
                        onChange={(e) => onChange(e.target.value)}
                        maxLength={maxLength}
                         />
                        
                        
                </div>
            </fieldset>
        </>
    )
}
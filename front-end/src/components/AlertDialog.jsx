export default function AlertDialog({message, b1Label, b2Label, b1OnClick, b2OnClick,}){
    return(
        <>
            <div className="fixed inset-y-0 left-1/2 w-full max-w-3xl -translate-x-1/2 bg-black/20 flex items-center justify-center">
            <div className="h-fit w-70 bg-white rounded-xl flex flex-col ">
                <div className="h-fit w-full flex items-center  p-5 ">
                    <p className=" text-xs font-medium">
                     {message}
                    </p>
                </div>
                <hr className="border-(--color-tertiary) opacity-30" />
                <div className="flex h-fit w-full ">
                <button className=" w-1/2 text-xs bg-black/10  text-black rounded-bl-xl font-medium" onClick={b1OnClick}>{b1Label}</button>
                <button className="bg-primary w-1/2 text-white text-xs rounded-br-xl font-medium p-4" onClick={b2OnClick}>{b2Label}</button>
                </div>
            </div>
        </div>
        </>
    )
}
export default function AlertDialog({message, b1Label, b2Label, b1OnClick, b2OnClick,}){
    return(
        <>
            <div className="fixed  inset-0 w-screen h-screen bg-black/20 flex items-center justify-center">
            <div className="h-fit w-70 bg-white rounded-xl flex flex-col">
                <div className="h-fit w-full flex items-center  p-3">
                    <p className=" text-sm font-medium">
                     {message}
                    </p>
                </div>
                <hr className="border-(--color-tertiary) opacity-30" />
                <div className="flex h-10 w-full ">
                <button className=" w-1/2 text-sm text-primary rounded-br-xl font-medium" onClick={b1OnClick}>{b1Label}</button>
                <button className="bg-primary w-1/2 text-white text-sm rounded-br-xl font-medium" onClick={b2OnClick}>{b2Label}</button>
                </div>
            </div>
        </div>
        </>
    )
}
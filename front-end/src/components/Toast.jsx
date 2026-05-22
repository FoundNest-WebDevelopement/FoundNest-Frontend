
export default function Toast({message, icon}){
    return(
        <>
     
            <div className="h-fit w-full rounded-full bg-white  flex p-2 items-center">
                <img src={icon} alt="icon" className="h-7" />
                <div className="w-full text-sm flex justify-center">
                    <p>{message}</p>
                </div>
            </div>
 
        </>
    )
}
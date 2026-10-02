export default function Loading({label}){
    return(
        <>
        <div className="fixed inset-y-0 left-1/2 w-full max-w-3xl -translate-x-1/2 bg-black/20 flex items-center justify-center z-3000">
            <div className="h-fit w-fit flex flex-col justify-center items-center gap-2">
                <div className="w-15 h-15 border-6 border-white border-t-primary rounded-full animate-spin"></div>
                 <p className=" text-md text-white font-bold"> {label}</p>
            </div>
        </div>
        </>
    )
}
export default function ButtonNegative({label, onClick}){
    return(
        <>
            <button className="btn border-2 border-(--color-primary) rounded-lg btn-xs sm:btn-sm md:btn-md lg:btn-lg xl:btn-xl font-light text-(--color-primary) text-md py-3 px-4"
            onClick={onClick}
            >{label}</button>
        </>
    )
}
export default function ButtonPositive({label,enable, onClick}){
    return(
        <>
             <button className={`btn ${enable? "":"opacity-20"} border-(--color-primary) rounded-lg btn-xs sm:btn-sm md:btn-md lg:btn-lg xl:btn-xl font-light text-white bg-(--color-primary) text-md py-3 px-4`} 
                disabled={!enable}
                onClick={onClick}
             >{label}</button>
        </>
    )
}
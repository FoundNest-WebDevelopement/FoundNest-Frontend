export default function PageLabelWithReturn({ label, onClick }) {
    return (
        <>
            <div className="flex py-2 bg-(--color-primary) shadow-sm rounded-b-xl  mt-13 gap-2 items-center px-2">
                <button className=" btn border-0 btn-circle bg-white/50 "
                        onClick={onClick}
                    >
                    <i className="fa-solid fa-arrow-left text-white text-lg"></i>
                </button>
                <p className=" text-md font-bold mx-2 text-white">{label}</p>
            </div>
        </>
    )
}
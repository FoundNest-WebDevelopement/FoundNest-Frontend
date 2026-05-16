export default function PageLabel({label}) {
    return (
        <>
            <div className="flex py-4 bg-(--color-primary) shadow-sm rounded-b-xl  mt-13">
                <p className=" text-md font-bold mx-2 text-white">{label}</p>
            </div>
            
        </>
    );
}
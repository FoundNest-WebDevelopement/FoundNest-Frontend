export default function PageLabel({label}) {
    return (
        <>
            <div className="navbar bg-(--color-primary) shadow-sm rounded-b-xl">
                <p className=" text-lg font-bold mx-2 text-white">{label}</p>
            </div>
        </>
    );
}
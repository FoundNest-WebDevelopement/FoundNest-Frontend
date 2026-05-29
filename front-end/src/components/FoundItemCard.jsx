import formatDateTime from "../utils/formatDateTime.js";

export default function FoundItemCard({data, onClick}){
    return(
        <>
             <div className="w-full h-fit border border-[#4B2D23]/40 rounded-xl shadow-[0_4px_4px_0px_rgba(0,0,0,0.25)] flex flex-col bg-white cursor-pointer"
                onClick={()=>{onClick(data.found_report_id)}}>
                                        <div className="h-25 bg-[#AE7365]/50 flex items-center justify-center rounded-t-xl relative">
                                                <img src={data.image_url} alt="item" className=" w-full h-full object-contain" />
                                                <div className="absolute text-black text-[9px] bg-white px-2 rounded-full font-medium py-1 bottom-1 right-1 border border-[#AE7365]/50 ">
                                                    <p>{data.category_name}</p>
                                                </div>
                                        </div>
                                        <div className="flex flex-col p-2 gap-1">
                                            <div>
                                                <p className="text-[11px] font-medium">{data.item_name}</p>
                                                <hr className="border-(--color-tertiary) mt-1 opacity-30" />
                                            </div>
                                            <div className="text-[11px] flex gap-1 items-center">
                                                <i className="fa-solid fa-calendar "></i>
                                                <p>{formatDateTime(data.found_date)}</p>
                                            </div>
                                            <div className="text-[11px] flex gap-1 ">
                                                <i className="fa-solid fa-location-dot"></i>
                                                <p>{data.location_found}</p>
                                            </div>
                                        </div>
                                    </div>

        </>
    )
}
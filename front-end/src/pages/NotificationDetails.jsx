import { useEffect, useState } from "react"
import Loading from "../components/Loading";
import { useNavigate, useParams } from "react-router-dom";
import PageLabelWithReturn from "../components/PageLabelWithReturn";
import messageIconSolid from "../assets/message_icon_solid.png"
import formatDateTime from "../utils/formatDateTime.js";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import  { Calendar,  MapPin} from "lucide-react"

export default function NotificationDetails(){

const {id} = useParams();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState();
    const [notification, setNotification] = useState();
    const API_URL = import.meta.env.VITE_API_URL;
useEffect(() => {
  const fetchNotifications = async () => {
    try {
      setIsLoading(true);

      const response = await fetchWithAuth(
        `${API_URL}/api/notifications/${id}`
      );

      const data = await response.json();

      setNotification(data);

    } catch (err) {
      console.error(err);

    } finally {
      setIsLoading(false);
    }
  };

  fetchNotifications();
}, [id, API_URL]);

const formatItemId = (id) => {
        return `SI-${String(id).padStart(5, "0")}`;
    };

const handleReturn = ()=> {
    navigate(`/notifications`);
}
    return(
        <>
              {notification &&
                    (
                        <>
                             <PageLabelWithReturn label="Match Found" onClick={handleReturn} />
                                    <div className="bg-(--color-secondary)  min-h-screen px-4 pt-10 flex flex-col gap-13 ">
                                        <div className="bg-white h-fit w-full rounded-lg shadow-[0_4px_4px_0px_rgba(0,0,0,0.25)] flex flex-col ">
                                            <div className="relative h-10 w-full">
                                                <img src={messageIconSolid} alt="logo" className="absolute left-0 -top-1/2 h-14 w-14" />
                                                <p className="absolute right-4 top-4 text-xs ">{formatDateTime(notification.created_at)}</p>
                                            </div>
                                            <div className="flex flex-col gap-4 mt-2 px-4">
                                                <p className="font-bold w-full text-center">Potential Match Found</p>
                                                <hr className="border-(--color-tertiary) mt-1 opacity-30" />
                                            </div>
                                            <div className="px-4 flex flex-col w-full items-center gap-3 py-5">
                                                <div className="w-50 h-fit border border-[#4B2D23]/40 rounded-xl shadow-[0_4px_4px_0px_rgba(0,0,0,0.25)] flex flex-col ">
                                                    <div className="h-30 bg-[#AE7365]/50 flex items-center justify-center rounded-t-xl relative">
                                                        <img src={notification.found_item_image} alt="item" className="w-full h-full object-contain" />
                                                        <div className="absolute text-black text-[9px] bg-white px-2 rounded-full font-medium py-1 bottom-1 right-1 border">
                                                            <p>{notification.found_category_name}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col p-4 gap-2">
                                                       
                                                        <div>
                                                            <p className="text-xs font-medium text-primary">{notification.item_id ? formatItemId(notification.item_id) : ""}</p>
                                                            <p className="text-xs font-medium">{notification.found_item_name}</p>
                                                            <hr className="border-(--color-tertiary) mt-1 opacity-30" />
                                                        </div>
                                                        <div className="text-xs flex gap-1">
                                                            <Calendar size={15}/>
                                                            <p>{formatDateTime(notification.found_date)}</p>
                                                        </div>
                                                        <div className="text-xs flex gap-1">
                                                            <MapPin size={15}/>
                                                            <p>{notification.location_found}</p>
                                                        </div>
                                                    </div>
                                                </div>
    
                                                <div className="text-sm">
                                                    <p className="font-medium text-justify">Great news! A recently submitted item closely matches your lost report for <span className="font-semibold">{notification.found_item_name}</span></p>
                                                </div>
                                            </div>
                                        </div>
                                        <button className="w-full h-10 bg-primary self-end font-medium text-white text-sm rounded-lg"> Verify this Match </button>
                                    </div>
                        </>
                    )
              }
                                    {isLoading &&
                                    (
                                        <>
                                            <PageLabelWithReturn label="Match Found" onClick={() => {  }} />
                                          <div className="bg-(--color-secondary)  min-h-screen px-4 pt-10 flex flex-col gap-13 ">
    
                                        <Loading label="Please wait..."/>
                                        </div>
                                        </>
                                    )

                                    }
            
        </>
    )
}
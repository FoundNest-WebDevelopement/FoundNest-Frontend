import PageLabel from "../components/PageLabel";
import PageLabel2 from "../components/PageLabel2";
import NotificationCard from "../components/NotificationCard";
import formatNotificationDate from "../utils/fotmatNotifications.js";
import formatDateTime from "../utils/formatDateTime.js";
import { useEffect, useState } from "react";
import PageLabelWithReturn from "../components/PageLabelWithReturn.jsx";
import messageIconSolid from "../assets/message_icon_solid.png"
import Loading from "../components/Loading.jsx";
import emptyImage from "../assets/empty_image.png"

export default function Notification() {
    const API_URL = import.meta.env.VITE_API_URL;
    const userId = 2;
    const [notifications, setNotifications] = useState();
    const [notificationId, setNotificationId] = useState();
    const [isLoading, setIsLoading] = useState(false);
    const [viewMatch, setViewMatch] = useState(false);
    const [notificationIndex, setNotificationIndex] = useState();
    
    const handleNotificationClick = (id, index) => {
        setViewMatch(true);
        setNotificationId(id)
        setNotificationIndex(index);

    }

    useEffect(() => {
        fetch(`${API_URL}/api/notifications/${userId}`)
            .then((res) => res.json())
            .then((data) => {
                console.log(data);
                setNotifications(data);
            })
            .catch((err) => {
                console.error(err);
            });
    }, [])

    const handleViewItem = () => {
        setIsLoading(true);

    }
    return (
        <>

            {!viewMatch && notifications &&

                (
                    <>
                        <PageLabel label="Notifications" />
                        <div className="bg-(--color-secondary)  min-h-screen px-4">
                            {notifications.length==0?
                                (
                                    <>
                                        <div className="w-full pt-40 justify-center">
                                            <img src={emptyImage} alt="nothing here yet" className="h-70 " />
                                        </div>
                                    </>
                                ):
                                (
                                    <>
                                        <PageLabel2 label="Latest" />
                                        {notifications.map((notification, index) => (
                                            <NotificationCard key={index} position={index} id={notification.notification_id} onCLick={handleNotificationClick} title={notification.title} date={formatNotificationDate(notification.created_at)} message={notification.message} />
                                        ))}
                                                </>
                                )

                            }
                            
                        </div>
                    </>

                )

            }
            {viewMatch && notifications && notifications[notificationIndex] &&
                (
                    <>
                        <PageLabelWithReturn label="Match Found" onClick={() => { setViewMatch(false) }} />
                        <div className="bg-(--color-secondary)  min-h-screen px-4 pt-10 flex flex-col gap-13 ">
                            <div className="bg-white h-fit w-full rounded-lg shadow-[0_4px_4px_0px_rgba(0,0,0,0.25)] flex flex-col ">
                                <div className="relative h-10 w-full">
                                    <img src={messageIconSolid} alt="logo" className="absolute left-0 -top-1/2 h-14 w-14" />
                                    <p className="absolute right-4 top-4 text-xs ">{formatDateTime(notifications[notificationIndex].found_date)}</p>

                                </div>
                                <div className="flex flex-col gap-4 mt-2 px-4">
                                    <p className="font-bold w-full text-center">Potential Match Found</p>
                                    <hr className="border-(--color-tertiary) mt-1 opacity-30" />
                                </div>
                                <div className="px-4 flex flex-col w-full items-center gap-3 py-5">
                                    <div className="w-50 h-55 border border-[#4B2D23]/40 rounded-xl shadow-[0_4px_4px_0px_rgba(0,0,0,0.25)] flex flex-col ">
                                        <div className="h-30 bg-[#AE7365]/50 flex items-center justify-center rounded-t-xl relative">
                                                <img src={notifications[notificationIndex].found_item_image} alt="item" className="w-full h-full object-contain" />
                                                <div className="absolute text-black text-[9px] bg-white px-2 rounded-full font-medium py-1 bottom-1 right-1 border">
                                                    <p>{notifications[notificationIndex].found_category_name}</p>
                                                </div>
                                        </div>
                                        <div className="flex flex-col p-4 gap-2">
                                            <div>
                                                <p className="text-xs font-medium">{notifications[notificationIndex].found_item_name}</p>
                                                <hr className="border-(--color-tertiary) mt-1 opacity-30" />
                                            </div>
                                            <div className="text-xs flex gap-1">
                                                <i className="fa-solid fa-calendar "></i>
                                                <p>{formatDateTime(notifications[notificationIndex].found_date)}</p>
                                            </div>
                                            <div className="text-xs flex gap-1">
                                                <i className="fa-solid fa-location-dot"></i>
                                                <p>{notifications[notificationIndex].location_found}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-sm">
                                        <p className="font-medium text-justify">Great news! A recently submitted item closely matches your lost report for <span className="font-semibold">{notifications[notificationIndex].found_item_name}</span></p>
                                    </div>

                                </div>
                            </div>
                            <button className="w-full h-10 bg-primary self-end font-medium text-white text-sm rounded-lg"> Verify this Match </button>
                          
                        </div>

                    </>
                ) 
          

            }
            {!notifications &&
                (
                    <>
                    <div className="bg-(--color-secondary)  min-h-screen px-4">
                       <Loading label="Please wait.."/>  
                       </div>
                    </>
                )

            }



        </>
    )
}
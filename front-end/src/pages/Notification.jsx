import PageLabel from "../components/PageLabel";
import PageLabel2 from "../components/PageLabel2";
import NotificationCard from "../components/NotificationCard";
import formatNotificationDate from "../utils/fotmatNotifications.js";

import { useEffect, useState } from "react";
import PageLabelWithReturn from "../components/PageLabelWithReturn.jsx";

import Loading from "../components/Loading.jsx";
import emptyImage from "../assets/empty_image.png"
import { useNavigate } from "react-router-dom";

export default function Notification() {
    const API_URL = import.meta.env.VITE_API_URL;
    const navigate = useNavigate();
    const userId = localStorage.getItem("user_id");
    
    

    const [notifications, setNotifications] = useState();
    const [notificationId, setNotificationId] = useState();
    const [isLoading, setIsLoading] = useState(true);
    const [notificationIndex, setNotificationIndex] = useState();

    const handleNotificationClick = async (id, index) => {
  try {
    setIsLoading(true);
    const token = localStorage.getItem("token");
    await fetch(
      `${API_URL}/api/notifications/${id}/read`,
      {
        method: "PATCH",
        Authorization : `Bearer ${token}`
      }
    );

    setNotificationId(id);
    setNotificationIndex(index);

    navigate(`/notifications/${id}`);

  } catch (err) {
    console.error(err);
  } finally {
    setIsLoading(false);
  }
};

    useEffect(() => {
        const token = localStorage.getItem("token")
        fetch(`${API_URL}/api/notifications/user/${userId}`,
                   {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
        )
            .then((res) => res.json())
            .then((data) => {
                console.log(data);
                setNotifications(data);
                if(data){
                    setIsLoading(false);
                }
            })
            .catch((err) => {
                console.error(err);
                setIsLoading(false);
            });
    }, [])


    return (
        <>

            {notifications &&

                (
                    <>
                        <PageLabel label="Notifications" />
                        <div className="bg-(--color-secondary)  min-h-screen px-4">
                            {notifications.length == 0 ?
                                (
                                    <>
                                        <div className="w-full pt-40 justify-center">
                                            <img src={emptyImage} alt="nothing here yet" className="h-70 " />
                                        </div>
                                    </>
                                ) :
                                (
                                    <>
                                        <PageLabel2 label="Latest" />
                                        {notifications.map((notification, index) => (
                                            <NotificationCard key={index} position={index}
                                                id={notification.notification_id}
                                                onCLick={handleNotificationClick}
                                                title={notification.title}
                                                date={formatNotificationDate(notification.created_at)}
                                                message={notification.message}
                                                isRead={notification.is_read}
                                            />
                                        ))}
                                    </>
                                )

                            }

                        </div>
                    </>

                )

            }
            {isLoading &&
                (
                    <>
                        <div className="bg-(--color-secondary)  min-h-screen px-4">
                            <Loading label="Please wait.." />
                        </div>
                    </>
                )

            }



        </>
    )
}
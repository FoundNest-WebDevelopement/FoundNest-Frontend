
import { useNavigate } from "react-router-dom";
import SuperAdminNotificationItem from "./SuperAdminNotificationItem";


export default function SuperAdminNotificationDropdown({
    notifications,
    setIsNotifOpen,
    markAllAsRead,
    markAdminNotificationAsRead,
    notifCount
}) {
    const navigate = useNavigate();

    const handleNotificationClick = (notification) => {
        const routes = {
            locked_account: `/super_admin/user_management?userId=${notification.account_locked_id}`
        };
        navigate(routes[notification.category] || "/super-admin");
        markAdminNotificationAsRead(notification.notification_id);
        setIsNotifOpen(false);

    };

    return (
        <div className="absolute right-0 top-full w-120 mt-2 bg-white rounded-lg border border-[#DDD9CF] overflow-hidden z-50">
            <div className="flex justify-between items-center p-4">
                <p className="text-primary text-xl font-semibold">
                    Notifications
                </p>

                <button
                    onClick={markAllAsRead}
                    disabled={notifCount <= 0}
                    className={`text-primary underline cursor-pointer transition-transform duration-100
     enabled:active:scale-95 disabled:opacity-40`}
     
                >
                    Mark all as read
                </button>
            </div>

            <div className="h-100 overflow-y-auto">
                {notifications.length === 0 ? (
                    <div className="py-8 text-center text-gray-500">
                        No notifications
                    </div>
                ) : (
                    notifications?.map((notification) => (
                        <SuperAdminNotificationItem
                            key={notification.notification_id}
                            notification={notification}
                            onClick={handleNotificationClick}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
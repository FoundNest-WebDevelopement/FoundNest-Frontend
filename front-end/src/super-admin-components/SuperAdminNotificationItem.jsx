import { Lock, Bell } from "lucide-react";

import formatNotificationDate from "../utils/fotmatNotifications";

const defaultConfig = {
    icon: Bell,
    iconColor: "text-gray-500",
};

const notificationConfig = {
    locked_account: {
        icon: Lock,
        iconColor: "text-primary",
    }
};

export default function SuperAdminNotificationItem({
    notification,
    onClick
}) {
    const config =
        notificationConfig[notification.category] ||
        defaultConfig

    const Icon = config.icon;

    return (
        <button
            onClick={() => onClick(notification)}
            className={`w-full flex p-2 border border-[#DDD9CF] text-left transition hover:bg-gray-50
                ${!notification.is_read ? "bg-[#FFFCF2]" : "bg-white"}
            `}
        >
            <div className="px-4 pt-2">
                <Icon size={25} className={config.iconColor} />
            </div>

            <div className="flex-1 flex flex-col text-xs text-[#6B5C42] gap-2">
                <p className="font-semibold text-sm text-black">
                    {notification.title}
                </p>

                <p>{notification.message}</p>

                <p className="italic">{formatNotificationDate(notification.created_at)}</p>
            </div>

            {!notification.is_read && (
                <div className="pr-2">
                    <i className="fa-solid fa-circle text-[#800000] text-xs"></i>
                </div>
            )}
        </button>
    );
}
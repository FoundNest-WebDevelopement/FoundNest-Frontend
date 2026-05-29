import messageIcon from "../assets/message_icon.png"

export default function NotificationCard({title, date, message, id, onCLick, position}){
    return(
        <>
        <div className="h-fit w-full rounded-xl bg-white flex items-center p-3 my-2 shadow-[0_4px_4px_0px_rgba(0,0,0,0.25)]"
            onClick={() => {onCLick(id, position), console.log(id, position)} }>
                    <img src={messageIcon} alt="" className="mr-3 h-7 w-7"/>
                    <div className="h-full w-full flex flex-col">
                        <div className="flex justify-between">
                            <p className="text-sm font-medium">{title}</p>
                            <div className="flex">
                                <p className="text-xs text-(--color-tertiary) opacity-80">{date}</p>
                                <i className="fa-solid fa-circle text-(--color-quaternary) text-xs ml-2 "></i>
                            </div>
                        </div>
                        <p className="font-md text-(--color-tertiary) opacity-80 text-xs">{message}</p>
                    </div>
                </div>
        </>
    )
}
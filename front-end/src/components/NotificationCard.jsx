import messageIcon from "../assets/message_icon.png"

export default function NotificationCard(){
    return(
        <>
        <div className="h-fit w-full rounded-xl bg-white flex items-center p-3 my-2">
                    <img src={messageIcon} alt="" className="mr-3 h-7 w-7"/>
                    <div className="h-full w-full flex flex-col">
                        <div className="flex justify-between">
                            <p className="text-sm font-medium">Match Found!</p>
                            <div className="flex">
                                <p className="text-xs text-(--color-tertiary) opacity-80">2 minutes ago</p>
                                <i className="fa-solid fa-circle text-(--color-quaternary) text-xs ml-2 "></i>
                            </div>
                        </div>
                        <p className="font-md text-(--color-tertiary) opacity-80 text-xs">A potential match for your Black Umbrella...</p>
                    </div>
                </div>
        </>
    )
}
import PageLabel from "../components/PageLabel";
import PageLabel2 from "../components/PageLabel2";
import NotificationCard from "../components/NotificationCard";

export default function Notification(){
    return(
        <>
            <PageLabel label="Notifications"/>
            <div className="bg-(--color-secondary)  min-h-screen px-4">
                <PageLabel2 label="Latest"/>
                <NotificationCard/>
                <NotificationCard/>
            </div>
        </>
    )
}
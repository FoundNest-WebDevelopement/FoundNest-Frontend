import { useEffect, useState } from "react";
import PageLabelWithReturn from "../components/PageLabelWithReturn";
import { useNavigate, useParams } from "react-router-dom";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import ReportCard from "../components/ReportCard";
import Loading from "../components/Loading";

export default function ReportHistory() {
    const API_URL = import.meta.env.VITE_API_URL;

    const { id } = useParams();

    const [isLoadingReports, setIsLoadingReports] = useState(false);
    const [reports, setReports] = useState([]);
    const [error, setError] = useState(null);

    const navigate = useNavigate();

    const fetchReports = async () => {
        try {
            setIsLoadingReports(true);
            setError(null);
            const response = await fetchWithAuth(`${API_URL}/api/lost-reports/user/${id}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Cannot fetch reports");
            }

            setReports(data);
        } catch (err) {
            console.log(err);
            setError(err.message);
        } finally {
            setIsLoadingReports(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, [id]);

    return (
        <>
            <PageLabelWithReturn label="Report History" onClick={()=> navigate("/profile")}/>
            <div className="bg-(--color-secondary) min-h-screen p-4 flex flex-col gap-3 pb-25">
                {isLoadingReports && (
                    <Loading/>
                )}

                {!isLoadingReports && error && (
                    <p className="text-center text-sm text-red-500">{error}</p>
                )}

                {!isLoadingReports && !error && reports.length === 0 && (
                    <p className="text-center text-sm text-primary">No reports found.</p>
                )}

                {!isLoadingReports && !error && reports.map((report) => (
                    <ReportCard
                        key={report.lost_report_id}
                        imageSrc={report.image_url}
            
                        reportId={report.lost_report_id}
                        itemName={report.item_name}
                        dateReported={report.date_reported}
                        dateCancelled={report.date_cancelled}
                        // onEdit={() => console.log("edit", report._id)}
                        onCancel={fetchReports}
                        
                    />
                ))}
            </div>
            
        </>
    );
}
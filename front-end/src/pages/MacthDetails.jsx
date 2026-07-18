import { useNavigate, useParams } from "react-router-dom";
import PageLabelWithReturn from "../components/PageLabelWithReturn";
import { useEffect, useRef, useState } from "react";
import Loading from "../components/Loading";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import HorizontalBreak from "../components/HorizontalBreak";

export default function MatchDetails() {

    const API_URL = import.meta.env.VITE_API_URL;

    const navigate = useNavigate();
    const { id } = useParams();
    const { reportId } = useParams();

    const userId = localStorage.getItem("user_id")

    const [match, setMatch] = useState(null);
    const [loading, setLoading] = useState(true);
    const [foundDate, setFoundDate] = useState("");
    const [timeFound, setTimeFound] = useState("");
    const [lostDate, setLostDate] = useState("");
    const [timeLost, setTimeLost] = useState("");
    const [howToClaim, setHowToClaim] = useState(false);
    const [claimSteps, setClaimSteps] = useState([]);
    const [isLoadingSteps, setIsLoadingSteps] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState(null);

    const sheetRef = useRef(null);
    const touchStartRef = useRef(0);
    const isDraggingRef = useRef(false);
    const dragYRef = useRef(0);
    const [isDragging, setIsDragging] = useState(false);
    const [dragY, setDragY] = useState(0);

    const fetchMatchDetails = async () => {
        try {
            const response = await fetchWithAuth(
                `${API_URL}/api/match-records/${id}/match`
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to fetch match");
            }

            setMatch(data);
            setFoundDate(data?.found_date.split("T")[0])
            setTimeFound(data?.found_date.split("T")[1].split(".")[0])
            setLostDate(data?.lost_date.split("T")[0])
            setTimeLost(data?.lost_date.split("T")[1].split(".")[0])

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchClaimSteps = async () => {
        try {
            setIsLoadingSteps(true);
            const response = await fetchWithAuth(`${API_URL}/api/policies`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to fetch claim process.");
            }

            const claimPolicy = data.find(
                (policy) => policy.policy_name === "Item Claim Process"
            );

            if (claimPolicy) {
                const parsedSteps = JSON.parse(claimPolicy.policy_value);
                setClaimSteps(parsedSteps);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoadingSteps(false);
        }
    };


    useEffect(() => {
        if (id) {
            window.scrollTo(0, 0);
            fetchMatchDetails();
            fetchClaimSteps();
        }
    }, [id]);




    const formatItemId = (id) => {
        return `SI-${String(id).padStart(5, "0")}`;
    };
    const formatReportId = (id) => {
        return `RPT-${String(id).padStart(5, "0")}`;
    };

    const renderValue = (value) => {
        if (value === null || value === undefined || value === "") {
            return <span className="italic text-gray-400">Not specified</span>;
        }
        return <span>{value}</span>;
    };

    const parseValue = (value) => {
        if (value === null || value === undefined || value === "") return null;

        if (typeof value === "string") {

            const trimmed = value.trim();
            const looksLikeJson =
                (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
                (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
                (trimmed.startsWith('"') && trimmed.endsWith('"'));

            if (looksLikeJson) {
                try {
                    const parsed = JSON.parse(trimmed);
                    if (Array.isArray(parsed)) {
                        return parsed.filter(Boolean).join(", ");
                    }
                    return parsed;
                } catch {
                    return value;
                }
            }
        }

        return value;
    };

    useEffect(() => {
        if (howToClaim) {
            document.documentElement.style.overflow = "hidden";
            document.body.style.overflow = "hidden";
        } else {
            document.documentElement.style.overflow = "";
            document.body.style.overflow = "";
        }
        return () => {
            document.documentElement.style.overflow = "";
            document.body.style.overflow = "";
        };
    }, [howToClaim]);




    const handlePointerDown = (e) => {
        touchStartRef.current = e.clientY;
        isDraggingRef.current = true;
        setIsDragging(true);
        e.target.setPointerCapture(e.pointerId); 
    };

    const handlePointerMove = (e) => {
        if (!isDraggingRef.current) return;
        const delta = e.clientY - touchStartRef.current;
        if (delta > 0) {
            dragYRef.current = delta;
            setDragY(delta);
        }
    };

    const handlePointerUp = (e) => {
        isDraggingRef.current = false;
        setIsDragging(false);

        try {
            e.target.releasePointerCapture(e.pointerId);
        } catch (err) { } // Safety catch for mobile edge cases

        if (dragYRef.current > 100) {
            setHowToClaim(false);
        }
        dragYRef.current = 0;
        setDragY(0);
    };

    const comparisonRows = [
        { label: "ID", your: formatReportId(match?.lost_report_id), match: formatItemId(match?.userId) },
        { label: "Category", your: match?.lost_category_name, match: match?.found_category_name },
        { label: "Item Name", your: match?.lost_item_name, match: match?.found_item_name },
        { label: "Description", your: match?.lost_description, match: match?.found_description },
        { label: "Contents", your: match?.lost_contents, match: match?.found_contents },
        { label: "Date Lost", your: lostDate, match: foundDate },
        { label: "Time Lost/Found", your: timeLost, match: timeFound },
        { label: "Lost/Found At", your: parseValue(match?.location_lost), match: parseValue(match?.location_found) },
        { label: "Specific Location", your: match?.lost_specific_location, match: match?.found_specific_location },
        { label: "Currently At", your: match?.lost_office_name, match: match?.found_office_name },
    ];
    

        if (loading) {
        return (<>
            <PageLabelWithReturn />
            <div className="bg-(--color-secondary) min-h-screen p-4 flex flex-col gap-3 pb-25">

                <Loading />
            </div>

        </>);
    }




    return (
        <>
            <PageLabelWithReturn label={`Potential Match ${formatItemId(match?.found_item_id)}`} onClick={() => {reportId? navigate(`/notifications/${reportId}/verify`) : navigate(`/profile/report-history/${userId}`)}} />
            <div className="bg-(--color-secondary) min-h-screen p-4 flex flex-col gap-3 pb-25">
                <div className="flex w-full my-2 items-center gap-3">
                    <hr className="border-(--color-tertiary) border rounded-full  opacity-30 flex-1" />
                    <p className="w-fit  text-lg font-medium shrink-0">Image Comparison</p>
                    <hr className="border-(--color-tertiary) border rounded-full  opacity-30 flex-1" />
                </div>
                <div className="w-full rounded-lg h-fit bg-white flex">
                    <div className="flex-1 h-full flex flex-col items-center p-3 gap-2">
                        <p className="font-medium">Your Image</p>
                        <div className="w-full h-50 rounded-lg relative"
                             onClick={()=>{setSelectedPhoto(match.found_image_url), setHowToClaim(true)}}>
                            <img src={match.found_image_url} alt={match.found_item_name} className="w-full h-full rounded-lg" />
                            <div className="text-lg rounded-full p-4 bg-black/70 absolute bottom-3 right-3">
                                <i className="fa-solid fa-up-right-and-down-left-from-center text-white "></i>
                            </div>
                        </div>

                    </div>

                    <div className="flex-1 h-full flex flex-col items-center p-3 gap-2">
                        <p className="font-medium">Potential Match</p>
                        <div className="w-full h-50 rounded-lg relative"
                            onClick={()=>{setSelectedPhoto(match.lost_image_url), setHowToClaim(true)}}>
                            <img src={match.lost_image_url} alt={match.lost_item_name} className="w-full h-full rounded-lg" />
                            <div className="text-lg rounded-full p-4 bg-black/70 absolute bottom-3 right-3">
                                <i className="fa-solid fa-up-right-and-down-left-from-center text-white"></i>
                            </div>
                        </div>

                    </div>

                    <div>

                    </div>

                </div>
                <div className="flex w-full my-2 items-center gap-3">
                    <hr className="border-(--color-tertiary) border rounded-full  opacity-30 flex-1" />
                    <p className="w-fit text-lg font-medium shrink-0">Item Description Comparison</p>
                    <hr className="border-(--color-tertiary) border rounded-full  opacity-30 flex-1" />
                </div>




                <table className="w-full text-sm border-collapse">
                    <thead>
                        <tr className="bg-amber-100">
                            <th className="p-2 w-1/3"></th>
                            <th className="p-2 font-semibold text-amber-900 text-left">Your Report</th>
                            <th className="p-2 font-semibold text-amber-900 text-left">Potential Match</th>
                        </tr>
                    </thead>
                    <tbody>
                        {comparisonRows.map((row, idx) => (
                            <tr
                                key={row.label}
                                className={idx % 2 === 0 ? "bg-white" : "bg-amber-50/60"}
                            >
                                <td className="p-2 font-medium text-gray-700 align-top border-t border-amber-100">
                                    {row.label}
                                </td>
                                <td className="p-2 align-top border-t border-amber-100">
                                    {renderValue(row.your)}
                                </td>
                                <td className="p-2 align-top border-t border-amber-100">
                                    {renderValue(row.match)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <HorizontalBreak />
                <div className=" flex flex-col mt-4 pb-15  gap-2">
                    <button className="border border-primary rounded-lg h-10 text-white bg-primary text-xs w-full "
                        onClick={() => { setHowToClaim(true) }}
                    >How to claim?</button>
                    <button className="border border-primary rounded-lg h-10 text-primary bg-white text-xs w-full ">View Office Location</button>
                </div>




            </div>

            {howToClaim && (
                <div className="fixed inset-0 bg-black/20 flex items-end justify-center z-10">
                    <div
                        ref={sheetRef}

                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerCancel={handlePointerUp}

                        className="bg-white w-full max-w-full p-4 rounded-t-4xl flex flex-col gap-2 pb-22"
                        style={{
                            transform: `translateY(${dragY}px)`,
                            transition: isDragging ? "none" : "transform 0.25s ease-out",
                            touchAction: "none",
                        }}
                    >
                        <hr className="border-(--color-tertiary) border-3 rounded-full mx-22 my-2 opacity-30" />
                        <div className="text-lg font-semibold w-full text-center mb-2">
                            <p>How to Claim?</p>
                        </div>
                        <div className="text-xs w-full flex flex-col gap-2">
                            {isLoadingSteps && <p className="text-center py-4">Loading steps...</p>}
                            {!isLoadingSteps && claimSteps.map((step, index) => (
                                <div key={index} className="flex flex-col gap-2">
                                    <p className="font-semibold">Step {index + 1}: {step.title}</p>
                                    <p>{step.description}</p>
                                </div>
                            ))}
                            {!isLoadingSteps && claimSteps.length === 0 && (
                                <p className="text-center py-4">No claim instructions available.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {selectedPhoto && 
               <div className="fixed  inset-0 w-screen h-screen bg-black/75 flex items-center justify-center z-4001">
                    <div className="relative w-full h-full flex items-center ">
                        <button className="absolute top-2 right-2 text-3xl text-white"
                            onClick={()=>{setSelectedPhoto(null), setHowToClaim(false)}}
                        ><i className="fa-regular fa-circle-xmark"></i></button>
                    <img src={selectedPhoto}  className="w-full h-100"/>
                    </div>
               </div>

              }

        </>
    );
}
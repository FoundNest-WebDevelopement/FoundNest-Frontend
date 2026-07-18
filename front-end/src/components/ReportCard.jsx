import { useState, useEffect } from "react";
import formatDateTime from "../utils/formatDataTimeNew";
import { useNavigate } from "react-router-dom";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import toast from "react-hot-toast";
import Toast from "../components/Toast";
import InfoIcon from "../assets/info_icon.png"
import Loading from "./Loading";
import FoundItemCard from "./FoundItemCard";

export default function ReportCard({
    imageSrc = "",
    reportId,
    itemName,
    dateReported,
    onEdit,
    onCancel,
    dateCancelled,
    navBack = null,
}) {
    const API_URL = import.meta.env.VITE_API_URL;
    const [openMatches, setOpenMatches] = useState(false);
    const [openCancel, setOpenCancel] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [selectedReason, setSelectedReason] = useState("");
    const navigate = useNavigate();


    const [matches, setMatches] = useState([]);
    const [isLoadingMatches, setIsLoadingMatches] = useState(false);
    const [matchesLoaded, setMatchesLoaded] = useState(false);

     //format rpt  id
    const formatReportId = (id) => {
        return `RPT-${String(id).padStart(5, "0")}`;
    };

    const formatItemId = (id) => {
        return `SI-${String(id).padStart(5, "0")}`;
    };


    const cancelReasons = [
  { 
    id: 1, 
    label: 'I found it myself!',
    isActive: true 
  },
  { 
    id: 2, 
    label: 'I’m no longer looking for it.',
    isActive: true 
  },
  { 
    id: 3, 
    label: 'I duplicated a report.',
    isActive: true 
  }
];


const options = cancelReasons.map(reason => (
  <option key={reason.id} value={reason.code}>
    {reason.label}
  </option>
));

const handleCancelReport = async () => {

    if (!selectedReason) {
    toast.custom((e) => (
          <Toast icon={InfoIcon} message="Please select a reason" />
        ));
         return;
      }
   
      setIsCancelling(true);

    try{
        const response = await fetchWithAuth(`${API_URL}/api/lost-reports/${reportId}/cancel`,{
            method:"PUT",
            body: JSON.stringify({
                reason:selectedReason,
            }),
        })

        const data = await response.json();

        if(!response.ok){
            throw new Error(data.message || "Failed to cancel Report")
        }


        setOpenCancel(false);
        setSelectedReason("");

        onCancel?.();

        toast.custom((e) => (
          <Toast icon={InfoIcon} message="Report successfully cancelled" />
        ));

        

    }catch(err){
        console.log(err.message)
    }finally{
        setIsCancelling(false);
    }
}

const closeModal = () => {
    setSelectedReason("");
    setOpenCancel(false);
};

const fetchMatches = async () => {
    if (matchesLoaded) return;

    setIsLoadingMatches(true);

    try {
        const response = await fetchWithAuth(
            `${API_URL}/api/match-records/${reportId}/lost-report`
        );

        if (!response.ok) {
            throw new Error("Failed to fetch matches");
        }

        const data = await response.json();

        setMatches(data);
        setMatchesLoaded(true);

    } catch (err) {
        console.error(err);

        toast.custom(() => (
            <Toast
                icon={InfoIcon}
                message={err.message || "Failed to load matches."}
            />
        ));
    } finally {
        setIsLoadingMatches(false);
    }
};

useEffect(() => {
    if (reportId) {
        fetchMatches();
    }
}, [reportId]);


const normalizedMatches = matches?.map(match => ({
     match_id: match.match_id,
    found_report_id: match.found_report_id,
    item_id: match.found_item_id,
    image_url: match.found_image_url,
    item_name: match.found_item_name,
    category_name: match.found_category_name,
    found_date: match.found_date,
    location_found: match.location_found,
}));


    return (
       <>
         <div className="w-full h-fit bg-white flex flex-col p-4 rounded-xl">
            <div className="flex gap-2">
                <div className="h-32 w-1/2 bg-[#AE7365]/50 flex items-center justify-center rounded-xl relative">
                    {imageSrc &&
                    <img src={imageSrc} alt="item" className="w-full h-full object-contain" />
                    }
                </div>
                <div className="w-1/2 flex flex-col gap-1">
                    {!matches.length <= 0 && !dateCancelled && (
                        <div className="p-1 rounded-full bg-(--color-quaternary) text-[10px] flex justify-center">
                            <p>Potential Match Found!</p>
                        </div>
                    )}
                    <div className="flex flex-col">
                        <p className="text-[10px] text-[#4B2D23]/80">Report ID:</p>
                        <p className="text-xs font-semibold">{formatReportId(reportId)}</p>
                    </div>
                    <div className="flex flex-col">
                        <p className="text-[10px] text-[#4B2D23]/80">Lost Item Name:</p>
                        <p className="text-xs font-semibold">{itemName}</p>
                    </div>
                    <div className="flex flex-col">
                        <p className="text-[10px] text-[#4B2D23]/80">Date Reported:</p>
                        <p className="text-xs font-semibold">{formatDateTime(dateReported)}</p>
                    </div>
                </div>
            </div>

            {!dateCancelled && 
                <hr className="border-(--color-tertiary) border rounded-full my-2 opacity-30" />
            }

            {!matches.length <= 0 && !dateCancelled &&
                <div className="flex flex-col">
                <button
                    className="flex gap-1 items-center justify-center bg-(--color-quaternary) text-primary rounded-lg text-xs py-2"
                    onClick={() => setOpenMatches(!openMatches)}
                >
                    <p>View Matches <span>({matches.length})</span></p> <i className={`fa-solid fa-angle-${openMatches ? "up" : "down"}`}></i>
                </button>
            </div>

            }

            {openMatches && (
                <div className="bg-secondary rounded-lg w-full my-2 p-2 ">
                    {isLoadingMatches ? (
                        <p className="text-xs text-center">
                            Loading matches...
                        </p>
                    ) : normalizedMatches.length === 0 ? (
                        <p className="text-xs text-center">
                            No matches found.
                        </p>
                    ) : (
                        <div className=" gap-4 grid grid-cols-2 overflow-y-auto">
                            {normalizedMatches.map((match) => (
                                <FoundItemCard
                                    key={match.found_report_id}
                                    data={match}
                                    match={true}
                                    onClick={() => {navBack? navigate(`/profile/match-details/${match.match_id}/${reportId}`) : navigate(`/profile/match-details/${match.match_id}`)}}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {!dateCancelled && 
            <div className="flex gap-1 mt-2">
                <button
                    className="flex gap-1 items-center justify-center bg-white border border-primary text-primary rounded-lg text-xs py-2 flex-1"
                    onClick={ ()=> {navBack? navigate(`/report/${reportId}/${reportId}`) : navigate(`/report/${reportId}`)}}
                >
                    <i className="fa-regular fa-pen-to-square"></i> <p>Edit Report</p>
                </button>
                <button
                    className="flex gap-1 items-center justify-center bg-primary text-white rounded-lg text-xs py-2 flex-1"
                    onClick={()=>setOpenCancel(true)}
                >
                    <p>Cancel Report</p>
                </button>
            </div>


            }
            {openCancel &&

                <div className="fixed  inset-0 w-screen h-screen bg-black/20 flex items-center justify-center z-2000">
            <div className="h-fit w-70 bg-white rounded-xl flex flex-col">
                <div className="h-fit w-full flex flex-col  rounded-t-xl bg-white p-6">
                    <p className=" text-lg font-medium">
                     Wait! May we know why you are cancelling?
                    </p>
                    <hr className="border-(--color-tertiary) opacity-30 my-2" />
                    <div className="flex flex-col gap-1">
                        {cancelReasons
                            .filter(reason => reason.isActive) 
                            .map((reason) => (
                                <div key={reason.id} style={{ marginBottom: '8px' }}>
                                <label style={{ cursor: 'pointer' }}>
                                    <input
                                    type="radio"
                                    value={reason.label}
                                    checked={selectedReason === reason.label}
                                    onChange={(e) => setSelectedReason(e.target.value)}
                                    style={{ marginRight: '8px' }}
                                    />
                                    {reason.label}
                                </label>
                                </div>
                            ))}
                    </div>


                </div>
                <hr className="border-(--color-tertiary) opacity-30" />
                <div className="flex h-10 w-full ">
                <button className=" w-1/2 text-sm text-primary rounded-br-xl font-medium" onClick={closeModal}>No, keep it</button>
                <button className="bg-primary w-1/2 text-white text-sm rounded-br-xl font-medium" 
                onClick={handleCancelReport}>Confirm Cancel</button>
                </div>
            </div>
        </div>
            }
        </div>
        {isCancelling && 
        <Loading/>

        }
       </>
      

        
    );
}
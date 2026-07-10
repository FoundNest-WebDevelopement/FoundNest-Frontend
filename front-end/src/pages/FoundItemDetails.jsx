import { useEffect, useRef, useState } from "react";
import HorizontalBreak from "../components/HorizontalBreak";
import PageLabelWithReturn from "../components/PageLabelWithReturn";
import formatDateTime from "../utils/formatDateTime";
import { useNavigate, useParams } from "react-router-dom";
import Loading from "../components/Loading";
import AlertDialog from "../components/AlertDialog";
import { fetchWithAuth } from "../utils/fetchWithAuth";

export default function FoundItemDetails(){
const { id } = useParams();
const API_URL = import.meta.env.VITE_API_URL;
const navigate = useNavigate();
const [report,setReport] = useState();


const [claimSteps, setClaimSteps] = useState([]);
const [isLoadingSteps, setIsLoadingSteps] = useState(false);

const [selectedPhoto, setSelectedPhoto] = useState(null);
const [howToClaim, setHowToClaim] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);

const handleTouchStart = (e) => {
  touchStartRef.current = e.touches[0].clientY;
  setIsDragging(true);
};

const handleTouchMove = (e) => {
  const delta = e.touches[0].clientY - touchStartRef.current;
  if (delta > 0) setDragY(delta);
};

const handleTouchEnd = () => {
  setIsDragging(false);
  if (dragY > 100) {
    setHowToClaim(false);
  }
  setDragY(0);
};



    useEffect(() => {
        const token = localStorage.getItem("token")
        fetchWithAuth(`${API_URL}/api/found-reports/${id}`

        )
            .then((res) => res.json())
            .then((data) => {
                setReport(data);
            })
            .catch((err) => {
                console.error(err);
            });
    }, [])

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
    

      const sheetRef = useRef(null);
  const touchStartRef = useRef(0);
  const dragYRef = useRef(0);


 
    useEffect(() => {
        fetchClaimSteps();
    }, []);

    const handleReturn = () => {
        navigate(`/find`)
    }

      const formatItemId = (id) => {
        return `SI-${String(id).padStart(5, "0")}`;
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
    e.target.setPointerCapture(e.pointerId); // Locks the pointer to the sheet
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
    } catch (err) {} // Safety catch for mobile edge cases

    if (dragYRef.current > 100) {
      setHowToClaim(false);
    }
    dragYRef.current = 0;
    setDragY(0);
  };



const renderValue = (value) => {
    const parsed = parseValue(value);
    if (parsed === null || parsed === undefined || parsed === "") {
        return <span className="italic text-gray-400">Not specified</span>;
    }
    return <span>{parsed}</span>;
};




    return(
        <>

            <div inert={howToClaim}>
             <PageLabelWithReturn label="Item Details" onClick={() => {}} onClick={handleReturn}/>
              <div className="bg-(--color-secondary)  min-h-screen w-full px-2 flex flex-col ">
                {report?
                    (<>
                    <div className="w-full h-fit flex flex-col gap-2 mt-2 ">
                    <div className="bg-[#AE7365]/50  w-full h-70 rounded-lg relative"
                        onClick={()=>{setSelectedPhoto(report.image_url), setHowToClaim(true)}}>
                      <img src={report.image_url} alt="item" className="w-full h-full object-contain" />
                      <div className="text-xl rounded-full p-4 bg-black/70 absolute bottom-3 right-3">
                        <i className="fa-solid fa-up-right-and-down-left-from-center text-white"></i>
                      </div>
                </div>
                <div className="bg-white  w-full rounded-t-lg flex flex-col p-4 px-6 text-lg pb-10">
                    <p className="font-semibold">{report.item_name}</p>
                    <HorizontalBreak/>
                    <div className="w-full my-1 flex flex-col text-sm gap-2">
                        <div>
                        <p >Item ID</p>
                        <p className="font-medium">{formatItemId(report.item_id)}</p>
                        </div>
                        <div>
                        <p >Category</p>
                        <p className="font-medium">{report.category_name}</p>
                        </div>
                        <div>
                        <p >Location Found</p>
                        <p className=" font-medium">{report.location_found}</p>
                        </div>
                        <div>
                        <p >Date & Time Found</p>
                        <p className="font-medium">{formatDateTime(report.found_date)}</p>
                        </div>
                        <div>
                                             <p >Current Location</p>
                        <p className="font-medium">{report.office_name}</p>
                        </div>
                    </div>
                    <HorizontalBreak/>
                    <div className=" flex flex-col mt-4 pb-15  gap-2">
                        <button className="border border-primary rounded-lg h-10 text-white bg-primary text-xs w-full "
                                onClick={() => {setHowToClaim(true)}}
                            >How to claim?</button>
                    <button className="border border-primary rounded-lg h-10 text-primary bg-white text-xs w-full ">View Office Location</button>
                    </div>
                </div>
                </div>
                    </>)
                    :
                    (
                        <>
                            <Loading/>
                        </>
                    )

                }
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
                    <img src={selectedPhoto} alt={report.item_name} className="w-full h-100"/>
                    </div>
               </div>

              }
             
        </>
    )
}
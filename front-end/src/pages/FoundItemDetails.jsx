import { useEffect, useState } from "react";
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
const [touchStart, setTouchStart] = useState(0);

const [claimSteps, setClaimSteps] = useState([]);
const [isLoadingSteps, setIsLoadingSteps] = useState(false);

const handleTouchStart = (e) => {
  setTouchStart(e.touches[0].clientY);
};

const handleTouchEnd = (e) => {
  const touchEnd = e.changedTouches[0].clientY;

  if (touchEnd - touchStart > 100) {
    setHowToClaim(false);
  }
};
const [howToClaim,setHowToClaim] = useState(false);
    useEffect(() => {
        const token = localStorage.getItem("token")
        fetchWithAuth(`${API_URL}/api/found-reports/${id}`

        )
            .then((res) => res.json())
            .then((data) => {
                console.log(data);
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
 
    useEffect(() => {
        fetchClaimSteps();
    }, []);

    const handleReturn = () => {
        navigate(`/find`)
    }



    return(
        <>
             <PageLabelWithReturn label="Item Details" onClick={() => {}} onClick={handleReturn}/>
              <div className="bg-(--color-secondary)  min-h-screen w-full px-2 flex flex-col">
                {report?
                    (<>
                    <div className="w-full h-fit flex flex-col gap-2 mt-2 ">
                    <div className="bg-[#AE7365]/50  w-full h-70 rounded-lg">
                      <img src={report.image_url} alt="item" className="w-full h-full object-contain" />
                </div>
                <div className="bg-white h-100 w-full rounded-t-lg flex flex-col p-4 px-6 text-lg">
                    <p className="font-semibold">{report.item_name}</p>
                    <HorizontalBreak/>
                    <div className="w-full my-1 flex flex-col text-sm gap-2">
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
                    <div className=" flex flex-col mt-4 gap-2">
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
                   {howToClaim &&
                (<>
                    <div className="fixed inset-0 bg-black/20 flex items-end justify-center z-10 transition-transform
duration-100">
                                         
                                    <div className="bg-white w-full max-w-full p-4 rounded-t-4xl flex flex-col gap-2  pb-22"
                                         onTouchStart={handleTouchStart}
                                            onTouchEnd={handleTouchEnd}>
                                                  <hr className="border-(--color-tertiary) border-3 rounded-full mx-22 my-2 opacity-30" />       
                                        <div className="text-lg font-semibold w-full text-center mb-2">
                                            <p >How to Claim?</p>
                                        </div>
                                      <div className="text-xs w-full flex flex-col gap-2">
                                          {isLoadingSteps && (
                                              <p className="text-center py-4">Loading steps...</p>
                                          )}
 
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
                </>)
 
                }

              </div>
        </>
    )
}
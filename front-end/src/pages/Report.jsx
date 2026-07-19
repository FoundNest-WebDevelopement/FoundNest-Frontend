import ButtonPositive from "../components/ButtonPositive";
import DropDown from "../components/DropDown";
import HorizontalBreak from "../components/HorizontalBreak";
import Horizontal from "../components/HorizontalBreak";
import PageLabel from "../components/PageLabel";
import PageLabel2 from "../components/PageLabel2";
import { useState, useRef, useEffect } from "react"
import TextField from "../components/TextField";
import TextArea from "../components/TextArea";
import DateInput from "../components/DateInput";
import HourInput from "../components/HourInput";
import { CircleAlert } from "lucide-react"
import ButtonNegative from "../components/ButtonNegative";
import heart from "../assets/heart.png"
import Loading from "../components/Loading";
import AlertDialog from "../components/AlertDialog";
import Toast from "../components/Toast";
import InfoIcon from "../assets/info_icon.png"
import toast from "react-hot-toast";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import { useNavigate, useParams } from "react-router-dom";
import PageLabelWithReturn from "../components/PageLabelWithReturn";

export default function Report() {

  const API_URL = import.meta.env.VITE_API_URL;
  const userID = localStorage.getItem("user_id");

  const navigate = useNavigate();

  //locations
  const [gates, setGates] = useState([]);
  const [sharedSpaces, setSharedSpaces] = useState([]);
  const [locations, setLocations] = useState([]);

  // --- DROPDOWN UI STATES ---
  const [openLocations, setOpenLocations] = useState(false);
  const [openCollgeBuilding, setOpenCollgeBuilding] = useState(false);
  const [openSharedSpaces, setOpenSharedSpaces] = useState(false);
  const [openGates, setOpenGates] = useState(false);
  const [openOthers, setOpenOthers] = useState(false);
  const [dsiableOtherLcoations, setdDisableOtherLcoations] = useState(false);

  const { id } = useParams();
  const { reportId } = useParams();
  const { mode } = useParams();

  const navBack = () => {
    if(mode == "view" && reportId){
      navigate(`/notifications/${reportId}/verify`)
    }
    else{
      navigate(`/profile/report-history/${userID}`)
    }
  
  }




  


  const getDropdownLabel = () => {
    if (totalLocations === 0) return "Select Locations";
    if (totalLocations === 1) {
      if (cantRemember) return "Can't remember";
      if (selectedCollegeBuilding.length === 1) return selectedCollegeBuilding[0];
      if (selectedSharedSpaces.length === 1) return selectedSharedSpaces[0];
      if (selectedGates.length === 1) return selectedGates[0];
      if (selectedOthers.length === 1) return selectedOthers[0];
    }
    return `Locations (${totalLocations})`;
  };

  // SELECTED DATA STATES
  const [selectedCollegeBuilding, setSelectedCollegeBuilding] = useState([]);
  const [selectedSharedSpaces, setSelectedSharedSpaces] = useState([]);
  const [selectedGates, setSelectedGates] = useState([]);
  const [selectedOthers, setSelectedOthers] = useState([]);
  const [cantRemember, setCantRemember] = useState(false);

  const sanitizeInput = (value, maxLength) =>
  value
    .replace(/\s+/g, " ")      
    .replace(/[<>]/g, "")    
    .slice(0, maxLength);

  const totalLocations =
    selectedCollegeBuilding.length +
    selectedSharedSpaces.length +
    selectedGates.length +
    selectedOthers.length +
    (cantRemember ? 1 : 0);

  // CHECKBOX TOGGLE HANDLERS 
  const handleCollgeClick = (officeName) => {
    setSelectedCollegeBuilding((prev) =>
      prev.includes(officeName)
        ? prev.filter((name) => name !== officeName)
        : [...prev, officeName]
    );
  };

  const handleSharedSpaceClick = (spaceName) => {
    setSelectedSharedSpaces((prev) =>
      prev.includes(spaceName)
        ? prev.filter((name) => name !== spaceName)
        : [...prev, spaceName]
    );
  };

  const handleGateClick = (gateName) => {
    setSelectedGates((prev) =>
      prev.includes(gateName)
        ? prev.filter((name) => name !== gateName)
        : [...prev, gateName]
    );
  };



  //new
  const [createdReportID, setCreatedReportID] = useState(null);
  const [createdItemID, setCreatedItemID] = useState(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [categoryID, setCategoryID] = useState("");
  const [image, setImage] = useState(null);
  const [categories, setCategories] = useState([]);
  const [itemName, setItemName] = useState("");
  const [description, setDescription] = useState("");
  const [contents, setContents] = useState("");
  const [dateLost, setDateLost] = useState("");
  const [timeLost, setTimeLost] = useState("");
  const [locationLost, setLocationLost] = useState("");
  const [specificlocation, setSpecificLocation] = useState("");
  const [rawLocations, setRawLocations] = useState([]);

  const [lostReport, setLostReport] = useState();

  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [showSubmitConfirmation, setShowSubmitConfirmation] = useState(false);

  const [isCancel, setIsCancel] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [nextPage, setNextPage] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const isPage1Valid =
    categoryID &&
    itemName &&
    description;
  const isPage2Valid =
    dateLost &&
    timeLost;

  function isValidPastOrToday(dateStr) {
    if (!dateStr) return false;
    const chosen = new Date(dateStr);
    if (isNaN(chosen.getTime())) return false;
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return chosen <= today;
  }

  function isTimeNotFuture(dateStr, timeStr) {
    if (!dateStr || !timeStr) return false;
    const chosenDate = new Date(dateStr).toISOString().split("T")[0];
    const todayDate = new Date().toISOString().split("T")[0];
    // If date is before today, any time is fine
    if (chosenDate < todayDate) return true;
    // If date is today, time must not exceed current time
    const [h, m] = timeStr.split(":").map(Number);
    const chosenDateTime = new Date(dateStr);
    chosenDateTime.setHours(h, m, 0, 0);
    return chosenDateTime <= new Date();
  }
  const fileInputRef = useRef(null);
  // const handleChange = (e) => {
  //   const file = e.target.files[0];
  //   if (file) {
  //     setImage(URL.createObjectURL(file));
  //   }
  // };

  const handleCancel = () => {
    setIsCancel(true);
  }
  const handleKeepEditing = () => {
    setIsCancel(false);
  }
  const handleDiscard = () => {
    if(reportId){
      navigate(`/notifications/${reportId}/verify`);
    }
    else if(id){
      navigate(`/profile/report-history/${userID}`);
    }else{
      setIsCancel(false);
    setNextPage(true);
    setSubmitted(true);
    }

    toast.custom((e) => (
      <Toast icon={InfoIcon} message="Edit has been cancelled." />
    ));
  }
  const handleEditReport = () => {
    setNextPage(false);
    setSubmitted(false);
    setIsEdit(true);

  }

  const handleUpdate = async () => {

    setShowSubmitConfirmation(false)

    try {
      setIsUpdating(true);
      const formData = new FormData();
      formData.append("image", selectedFile);
      formData.append("item_name", itemName);
      formData.append("description", description);
      formData.append("contents", contents);
      formData.append("category_id", categoryID);
      formData.append("user_id", userID);
      formData.append("specific_location", specificlocation);

      formData.append(
        "lost_date",
        `${dateLost} ${timeLost}`
      );

      if (cantRemember) {
        formData.append("location_lost", JSON.stringify(["Can't Remember"]));
      } else {
        const allSelectedLocations = [
          ...selectedCollegeBuilding,
          ...selectedSharedSpaces,
          ...selectedGates,
          ...selectedOthers,
        ];
        formData.append("location_lost", JSON.stringify(allSelectedLocations));
      }

      const response = await fetchWithAuth(
        `${API_URL}/api/lost-reports/${createdReportID}`,
        {
          method: "PUT",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
        setIsUpdating(false);
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      if (response.ok) {
        setIsUpdating(false);
        setSubmitted(true);
        toast.custom((e) => (
          <Toast icon={InfoIcon} message="Report edited successfully." />
        ));
      }
    } catch (err) {
      console.error(err);
    }

  }
  //new
  const handleSubmit = async () => {
    try {

      setIsSubmitting(true);
      const formData = new FormData();

      formData.append("image", selectedFile);
      formData.append("item_name", itemName);
      formData.append("description", description);
      formData.append("contents", contents);
      formData.append("category_id", categoryID);
      formData.append("user_id", userID);
      formData.append("specific_location", specificlocation);

      formData.append(
        "lost_date",
        `${dateLost} ${timeLost}`
      );

      if (cantRemember) {
        formData.append("location_lost", JSON.stringify(["Can't Remember"]));
      } else {
        const allSelectedLocations = [
          ...selectedCollegeBuilding,
          ...selectedSharedSpaces,
          ...selectedGates,
          ...selectedOthers,
        ];
        formData.append("location_lost", JSON.stringify(allSelectedLocations));
      }

      const response = await fetchWithAuth(
        `${API_URL}/api/lost-reports`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
        setIsSubmitting(false);
      }

      setSubmitted(true);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      if (response.ok) {
        setIsSubmitting(false);


        setCreatedReportID(data.report.lost_report_id);
        setCreatedItemID(data.item.item_id);
  
      }

    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = async (e) => {
    const file = e.target.files[0];

    if (!file) return;

    setSelectedFile(file);
    setImage(URL.createObjectURL(file));

    try {
      setIsLoading(true);

      const formData = new FormData();
      formData.append("image", file);
      const response = await fetchWithAuth(
        `${API_URL}/api/gemini-item-listing/describe-item`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "AI analysis failed");
      }

      setItemName(data.itemName || "");
      setDescription(data.detailedDescription || "");
      setContents(data.contents || "");

      const matchedCategory = categories.find(
        (category) =>
          category.category_name.toLowerCase() ===
          data.category.toLowerCase()
      );

      if (matchedCategory) {
        setCategoryID(String(matchedCategory.category_id));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const [isLoadingReport, setIsLoadingReport] = useState(false);

const fetchLostReport = async (id) => {
  try {
    setIsLoadingReport(true);
    const response = await fetchWithAuth(`${API_URL}/api/lost-reports/${id}`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "cannot fetch lost report");
    }
    setLostReport(data);

  

  
    setItemName(data.item_name || "");
    setDescription(data.description || "");
    setContents(data.contents || "");
    setCategoryID(String(data.category_id || ""));
    setSpecificLocation(data.specific_location || "");

    if (data.image_url) {
      setImage(data.image_url); // shows existing photo; only overwritten if user picks a new one
    }

    
    if (data.lost_date) {
      const [datePart, timePart] = data.lost_date.split(/[T ]/);
      setDateLost(datePart || "");
      setTimeLost(timePart?.slice(0, 5) || ""); // trims seconds if present, e.g. "14:30:00" -> "14:30"
  
    }

    


    if (data.location_lost) {
  let parsedLocations;

  try {
    parsedLocations = JSON.parse(data.location_lost);
  } catch (e) {
    parsedLocations = [data.location_lost];
  }

  if (Array.isArray(parsedLocations)) {
    if (parsedLocations.includes("Can't Remember")) {
      setCantRemember(true);
      setdDisableOtherLcoations(true);
    } else {
      setRawLocations(parsedLocations);
    }
  }
}

    setIsEdit(true);
  } catch (error) {
    console.log(error.message);
  } finally {
    setIsLoadingReport(false);
  }
};


useEffect(() => {
  if (id) {
    fetchLostReport(id);
    setCreatedReportID(id); 
  }
}, [id]);



  useEffect(() => {
    if (rawLocations.length > 0 && locations.length > 0) {
      setSelectedCollegeBuilding(
        rawLocations.filter((loc) =>
          locations.some((l) => l.office_name?.trim().toLowerCase() === loc.trim().toLowerCase())
        )
      );
    }
  }, [rawLocations, locations]);

 
  useEffect(() => {
    if (rawLocations.length > 0 && sharedSpaces.length > 0) {
      setSelectedSharedSpaces(
        rawLocations.filter((loc) =>
          sharedSpaces.some((s) => s.shared_space_name?.trim().toLowerCase() === loc.trim().toLowerCase())
        )
      );
    }
  }, [rawLocations, sharedSpaces]);

 
  useEffect(() => {
    if (rawLocations.length > 0 && gates.length > 0) {
      setSelectedGates(
        rawLocations.filter((loc) =>
          gates.some((g) => g.gate_name?.trim().toLowerCase() === loc.trim().toLowerCase())
        )
      );
    }
  }, [rawLocations, gates]);



  const dateValid = isValidPastOrToday(dateLost);
  const timeValid = dateValid && isTimeNotFuture(dateLost, timeLost)

  const handleDateChange = (val) => {
    setDateLost(val);
    setTimeLost("");
  };
  const openFilePicker = () => {
    fileInputRef.current.click();
  };

  useEffect(() => {
    fetch(`${API_URL}/api/categories`)
      .then((res) => res.json())
      .then((data) => {
   
        setCategories(data);
      })
      .catch((err) => {
        console.error(err);
      });
  }, []);

        //OFFICES FETCH
            useEffect(() => {
                fetch(`${API_URL}/api/offices`)
                    .then((res) => res.json())
                    .then((data) => {
                        setLocations(data);
                    })
                    .catch((err) => {
                        console.error(err);
                    });
            }, []);
            //GATES FETCH
            useEffect(() => {
                fetch(`${API_URL}/api/gates`)
                    .then((res) => res.json())
                    .then((data) => {
                        setGates(data);
                    })
                    .catch((err) => {
                        console.error(err);
                    });
            }, []);
            //SHARED SPACES FETCH
            useEffect(() => {
                fetch(`${API_URL}/api/shared-spaces`)
                    .then((res) => res.json())
                    .then((data) => {
                        setSharedSpaces(data);
                    })
                    .catch((err) => {
                        console.error(err);
                    });
            }, []);





  return (
    <>
      <div className={`${submitted ? "hidden" : ""}`} >
        
        {mode? 
          <>
            <PageLabelWithReturn label= {"View Lost Item Report Form"} onClick={navBack}/>
          </>
          :
          <>
          <PageLabel label= {id? "Edit Lost Item Report Form" : "Lost Item Report Form"} />
          </>

        }
      </div>
      <div className={`${submitted ? "bg-(--color-primary) flex flex-col items-center justify-center" : "bg-(--color-secondary)"}  min-h-screen px-4`}>


        {!nextPage ?
          (<>
            <PageLabel2 label="Item Description" />
            <HorizontalBreak />
            <div className="bg-white w-full h-fit p-2 rounded-xl mt-4 mb-2 flex items-center justify-center flex-col ">
              {(image && image !== "REMOVE")  ? (
                <img
                src={image}
                alt="Uploaded"
                onClick={() => {
                  if (mode !== "view") {
                    setShowImageOptions(true);
                  }
                }}
                className={`w-full max-h-50 object-contain rounded-xl transition ${
                  mode === "view"
                    ? "cursor-default"
                    : "cursor-pointer hover:opacity-80"
                }`}
              />
              ) : (
                <div className="p-1 border border-dashed rounded-full border-(--color-primary)">
                  {/* <label onClick={openFilePicker} className="btn-circle btn-lg bg-(--color-primary) cursor-pointer flex items-center justify-center">
                    <i className="fa-solid fa-plus text-white"></i>
                  </label> */}
                  <button
                    type="button"
                    disabled={mode === "view"}
                    onClick={() => setShowImageOptions(true)}
                    className="btn-circle btn-lg bg-(--color-primary) cursor-pointer flex items-center justify-center disabled:opacity-80"
                  >
                    <i className="fa-solid fa-plus text-white"></i>
                  </button>
                </div>
              )}
              {/* <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleChange}
              /> */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleChange}
              />

              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleChange}
              />
              {(!image  || image === "REMOVE") && (
                <>
                  <p className="text-sm text-(--color-tertiary) opacity-70 font-medium mt-2">
                    Upload Item Photo (Optional)
                  </p>
                  <p className="text-xs text-center text-(--color-tertiary) opacity-70 font-medium mt-4 px-6">
                    *FoundNest AI will help auto-fill details based on your photo.
                  </p>
                </>
              )}

             
            </div>
            <DropDown title="Categories*" placeholder="Select Category" value={categoryID} options={categories} onChange={setCategoryID} disabled={mode === "view"} />
            <TextField title="Item Name*" placeholder="e.g., iPhone 13 Pro Max, Bag, Umbrella" value={itemName} onChange={setItemName} error={false} maxLength={50} disabled={mode === "view"}/>
            <TextArea title="Detailed Description*" placeholder="Brand, Model, Size, Color, Material, etc." value={description} onChange={(value) => setDescription(sanitizeInput(value, 500))} error={false} maxLength={500} disabled={mode === "view"}/>
              <p className="text-xs text-gray-500 text-right">
                  {description.length}/500
              </p>
            <TextField title="Contents (if applicable)" placeholder="e.g., Cash amount, ID name" value={contents} onChange={setContents} error={false} maxLength={100} disabled={mode === "view"}/>
            <HorizontalBreak />
            <div className="pb-5"></div>
            <div className="flex justify-between items-center pb-20">
              <p className="text-xs">Page 1 out of 2</p>

              <div className="flex gap-2">
                {isEdit && !mode?
                  (
                    <>
                      <ButtonNegative label="Cancel" onClick={handleCancel} />
                    </>
                  )
                  :
                  (
                    <>

                    </>
                  )
                }
                <ButtonPositive label="Next" enable={isPage1Valid} onClick={() => setNextPage(true)} />
              </div>
            </div>
          </>)
          :
          (
            <></>
          )
        }
        {nextPage && !submitted ?
          (
            <>
              <PageLabel2 label="When & Where" />
              <HorizontalBreak />
              <DateInput
                title="Date Lost*"
                value={dateLost}
                onChange={handleDateChange}
                error={dateLost && !dateValid}
                max={new Date().toISOString().split("T")[0]}
                disabled={mode === "view"}
              />
              {dateLost && !dateValid && (
                <p className="text-xs text-red-500 mt-1 ml-1">Date cannot be in the future.</p>
              )}

              <HourInput
                title="Time Lost*"
                value={timeLost}
                onChange={setTimeLost}
                error={dateValid && timeLost && !timeValid}
                disabled={!dateValid || (mode === "view")}
              />
              {!dateValid && (
                <p className="text-xs text-yellow-500 mt-1 ml-1">Enter a valid date first.</p>
              )}
              {dateValid && timeLost && !timeValid && (
                <p className="text-xs text-red-500 mt-1 ml-1">Time cannot be in the future.</p>
              )}
       
            <p className="mt-3 text-xs font-semibold">Location Lost <span className="text-primary">*</span></p>
            <div className="relative w-full mt-2">
              <button
                className={`w-full p-3 text-xs disabled:opacity-80 ${
                  openLocations ? " border-primary text-black border" : " "
                } 
                ${totalLocations === 0? "text-[#4B2D23]/50" : "text-black"}
                rounded-md  flex items-center justify-between min-w-37.5 shadow-sm bg-white `}
                onClick={() => setOpenLocations(!openLocations)}
                disabled={mode === "view"}
              >
                <span className="font-medium truncate max-w-55 text-left">
                  {getDropdownLabel()}
                </span>
                <i
                  className={`fa-solid fa-angle-${
                    openLocations ? "up" : "down"
                  } ml-2 text-primary shrink-0`}
                />
              </button>

              {openLocations && (
                <div className="absolute top-full left-0 mt-1 w-full z-50">
                  <div className="border border-primary bg-white rounded-md p-2 flex flex-col gap-2 shadow-lg max-h-[60vh] overflow-y-auto">
                    {/* 1. College Buildings */}
                    <div className="flex flex-col rounded-md">
                      <button
                        onClick={() =>
                          setOpenCollgeBuilding(!openCollgeBuilding)
                        }
                        disabled={dsiableOtherLcoations || (mode === "view")}
                        className="flex justify-between items-center p-2 text-xs font-medium bg-[#F2F2F2] rounded-md hover:bg-gray-200 transition-colors disabled:opacity-40"
                      >
                        <span>
                          College Buildings{" "}
                          {selectedCollegeBuilding.length > 0 &&
                            `(${selectedCollegeBuilding.length})`}
                        </span>
                        <i
                          className={`fa-solid fa-angle-${
                            openCollgeBuilding ? "up" : "down"
                          } text-primary`}
                        ></i>
                      </button>
                      {openCollgeBuilding && (
                        <div className="flex flex-wrap gap-2 pt-2 px-1">
                          {locations?.map((building) => (
                            <label
                              key={building.office_id}
                              className="cursor-pointer flex items-center gap-2 text-xs p-2 rounded-md font-medium w-fit bg-[#f9f9f9] border hover:border-primary transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={selectedCollegeBuilding.includes(
                                  building.office_name
                                )}
                                onChange={() =>
                                  handleCollgeClick(building.office_name)
                                }
                                className="w-3.5 h-3.5 accent-primary cursor-pointer"
                              />
                              {building.office_name}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 2. Shared Spaces */}
                    <div className="flex flex-col rounded-md">
                      <button
                        onClick={() => setOpenSharedSpaces(!openSharedSpaces)}
                        disabled={dsiableOtherLcoations}
                        className="flex justify-between items-center p-2 text-xs font-medium bg-[#F2F2F2] rounded-md hover:bg-gray-200 transition-colors disabled:opacity-40"
                      >
                        <span>
                          Shared Spaces{" "}
                          {selectedSharedSpaces.length > 0 &&
                            `(${selectedSharedSpaces.length})`}
                        </span>
                        <i
                          className={`fa-solid fa-angle-${
                            openSharedSpaces ? "up" : "down"
                          } text-primary`}
                        ></i>
                      </button>
                      {openSharedSpaces && (
                        <div className="flex flex-wrap gap-2 pt-2 px-1">
                          {sharedSpaces?.map((space) => (
                            <label
                              key={space.shared_space_id}
                              className="cursor-pointer flex items-center gap-2 text-xs p-2 rounded-md font-medium w-fit bg-[#f9f9f9] border hover:border-primary transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={selectedSharedSpaces.includes(
                                  space.shared_space_name
                                )}
                                onChange={() =>
                                  handleSharedSpaceClick(space.shared_space_name)
                                }
                                className="w-3.5 h-3.5 accent-primary cursor-pointer"
                              />
                              {space.shared_space_name}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 3. Gates */}
                    <div className="flex flex-col rounded-md">
                      <button
                        onClick={() => setOpenGates(!openGates)}
                        disabled={dsiableOtherLcoations}
                        className="flex justify-between items-center p-2 text-xs font-medium bg-[#F2F2F2] rounded-md hover:bg-gray-200 transition-colors disabled:opacity-40"
                      >
                        <span>
                          Gates{" "}
                          {selectedGates.length > 0 &&
                            `(${selectedGates.length})`}
                        </span>
                        <i
                          className={`fa-solid fa-angle-${
                            openGates ? "up" : "down"
                          } text-primary`}
                        ></i>
                      </button>
                      {openGates && (
                        <div className="flex flex-wrap gap-2 pt-2 px-1">
                          {gates?.map((gate) => (
                            <label
                              key={gate.gate_id}
                              className="cursor-pointer flex items-center gap-2 text-xs p-2 rounded-md font-medium w-fit bg-[#f9f9f9] border hover:border-primary transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={selectedGates.includes(gate.gate_name)}
                                onChange={() => handleGateClick(gate.gate_name)}
                                className="w-3.5 h-3.5 accent-primary cursor-pointer"
                              />
                              {gate.gate_name}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>

                  

                    <hr className="my-1 border-gray-200" />

                    {/* 5. Can't Remember Option */}
                    <label
                      className={`cursor-pointer flex items-center gap-2 text-xs p-2 rounded-md font-medium w-full transition-colors ${
                        cantRemember
                          ? "bg-[#e5d4b8] text-primary"
                          : "bg-[#F2F2F2] hover:bg-gray-200"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={cantRemember}
                        onChange={() => {
                          const newValue = !cantRemember;
                          setCantRemember(newValue);
                          setOpenCollgeBuilding(false);
                          setOpenGates(false);
                          setOpenSharedSpaces(false)

                          // Clear other selections when "Can't remember" is checked
                            setSelectedCollegeBuilding([]);
                            setSelectedSharedSpaces([]);
                            setSelectedGates([]);
                            setSelectedOthers([]);  
                              setdDisableOtherLcoations(!dsiableOtherLcoations);
                              
                        }}
                        className="w-4 h-4 accent-primary cursor-pointer ml-1"
                      />
                      Can't remember the location
                    </label>
                  </div>
                </div>
              )}
            </div>
             
              <TextField title="Specific Location" placeholder="e.g., 2nd Floor, Room A, near stairs, etc." value={specificlocation} onChange={setSpecificLocation} error={false} maxLength={100} disabled={mode === "view"}/>
              <div className=" bg-primary/20 text-primary-content w-full my-3 rounded-md">
                <div className="card-body">
                  <div className="w-full flex items-center">
                    <CircleAlert className="size-4 mr-2" />
                    <p className="card-title text-sm">What happens next?</p>
                  </div>
                  <p className="text-primary text-xs">We’ll check for matching found items and notify you if we find a potential match. You’ll recieve updates via the notification bell.</p>
                  <div className="card-actions justify-end">
                  </div>
                </div>
              </div>
              <HorizontalBreak />
              <div className="flex justify-between items-center mt-4">
                <p className="text-xs">Page 2 out of 2</p>
                <div className="flex gap-2">
                  <ButtonNegative label="Back" onClick={() => { setNextPage(false) }} />
                  {!mode &&
                  <>
                   {isEdit ?
                    (
                      <>
                        <ButtonPositive label="Confirm" enable={timeValid} onClick={()=>setShowSubmitConfirmation(true)} />
                      </>
                    )
                    :
                    (
                      <>
                        <ButtonPositive label="Submit" enable={timeValid && totalLocations > 0} onClick={()=>setShowSubmitConfirmation(true)} />
                      </>
                    )
                  }
                  </>

                  }
                </div>
              </div>
              <div className="pb-20"></div>

            </>)
          :
          (
            <>
            </>
          )
        }
        {submitted && nextPage ?
          (
            <>
              <div className="h-fit w-fit px-3 flex flex-col gap-8">
                <div className="h-28 w-full flex gap-2 justify-evenly ">
                  <img className="h-full w-2/5" src={heart} alt="smiley heart" />
                  <div className="flex flex-col gap-2 h-full w-full ">
                    <p className="text-white font-bold text-md">Report Successful!</p>
                    <p className="text-white/70 font-bold text-xs text-justify">We've secured your lost report and immediately started searching for a match. Rest assured, we'll notify you if we find it.</p>
                  </div>
                </div>
                <div className="h-full w-full rounded-xl  bg-white">
                  <div className="h-full w-full flex flex-col gap-2 p-4">
                    <p className=" font-bold text-xs">What happens next?</p>
                    <div className="pl-5 flex flex-col gap-2">

                      <li className=" text-xs">Your detailed description has been added to our records.</li>
                      <li className=" text-xs">Our system is now automatically searching and comparing your report against all old and newly found items.</li>
                      <li className=" text-xs">We will notify you immediately via email or in-app notifications if a potential match is reported by a finder..</li>

                    </div>

                  </div>
                  <HorizontalBreak />
                  <div className=" flex justify-between px-3 py-3 ">
                    <div className="flex justify-evenly gap-1" onClick={handleEditReport}>
                      <i className="fa-regular fa-pen-to-square text-primary"></i>
                      <p className="text-xs text-primary">Edit Report</p>
                    </div>
                    <div className="flex gap-1">
                      <p className="text-xs text-primary">Go to my Report History</p>
                      <i className="fa-solid fa-arrow-right text-primary"></i>
                    </div>
                  </div>

                </div>
              </div>
            </>
          )
          :
          (
            <>
            </>
          )

        }
        {isLoading ?
          (
            <>
              <Loading label="Analyzing Image" />
            </>
          )
          :
          (
            <>

            </>
          )

        }
        {isSubmitting &&
          (
            <>
              <Loading label="Creating Lost Report" />
            </>
          )
        }
        {isUpdating &&
          (
            <>
              <Loading label="Updating Lost Report" />
            </>
          )
        }
        {isCancel ?
          (
            <>
              <AlertDialog message="Discard changes? Unsaved edits will be lost." b1Label="Keep Editing" b2Label="Discard" b1OnClick={handleKeepEditing} b2OnClick={handleDiscard} />
            </>
          )
          :
          (
            <>

            </>
          )

        }
        {showImageOptions && (
          <div className="fixed inset-0 bg-black/20 flex items-end justify-center z-50 ">
            <div className="bg-white w-full max-w-md p-4 rounded-t-xl flex flex-col gap-2 pb-25">
              <ButtonPositive label="Take Photo" enable={showImageOptions} onClick={() => {
                setShowImageOptions(false);
                cameraInputRef.current?.click();
              }} />
              <ButtonPositive label="Choose from Gallery" enable={showImageOptions} onClick={() => {
                setShowImageOptions(false);
                galleryInputRef.current?.click();
              }} />
              {image && image !== "REMOVE" &&
              <ButtonPositive label="Remove Photo" enable={showImageOptions} onClick={() => {
                setShowImageOptions(false);
                setImage("REMOVE");
                setSelectedFile("REMOVE");    
              }} />
              }
              <ButtonNegative label="Cancel" onClick={() => setShowImageOptions(false)} />
            </div>
          </div>
        )}

        {showImageOptions && (
          <div className="fixed inset-0 bg-black/20 flex items-end justify-center z-50 ">
            <div className="bg-white w-full max-w-md p-4 rounded-t-xl flex flex-col gap-2 pb-25">
              <ButtonPositive label="Take Photo" enable={showImageOptions} onClick={() => {
                setShowImageOptions(false);
                cameraInputRef.current?.click();
              }} />
              <ButtonPositive label="Choose from Gallery" enable={showImageOptions} onClick={() => {
                setShowImageOptions(false);
                galleryInputRef.current?.click();
              }} />
              {image && image !== "REMOVE" &&
              <ButtonPositive label="Remove Photo" enable={showImageOptions} onClick={() => {
                setShowImageOptions(false);
                setImage("REMOVE");
                setSelectedFile("REMOVE");
                
              }} />
              }
              <ButtonNegative label="Cancel" onClick={() => setShowImageOptions(false)} />
            </div>
          </div>
        )}

        {showSubmitConfirmation &&
          <AlertDialog 
          message="Please review the information for accuracy before to submission."
          b1Label={"Cancel"}
          b2Label={"Submit"}
          b1OnClick={()=>setShowSubmitConfirmation(false)}
          b2OnClick={isEdit? handleUpdate : handleSubmit}
        />

        }

      </div>
      {isLoadingReport && 
        <Loading/>

      }
    </>
  );
}
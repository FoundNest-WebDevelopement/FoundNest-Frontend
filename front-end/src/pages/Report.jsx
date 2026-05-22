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

export default function Report() {

  const [userID, setUserID] = useState(7);


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
  const [location, setLocation] = useState("");

  const [isCancel, setIsCancel] = useState(false);
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
    setIsCancel(false);
    setNextPage(true);
    setSubmitted(true);

    toast.custom((e) => (
          <Toast icon={InfoIcon} message="Edit has been cancelled."/>
        ));
  }
  const handleEditReport = () => {
    setNextPage(false);
    setSubmitted(false);
    setIsEdit(true);
    
  }

  const handleUpdate = async () => {

    try{
    setIsLoading(true);
      const formData = new FormData();

      formData.append("image", selectedFile);
      formData.append("item_name", itemName);
      formData.append("description", description);
      formData.append("contents", contents);
      formData.append("category_id", categoryID);
      formData.append("user_id", userID);
      formData.append("location_lost", location);

      formData.append(
        "lost_date",
        `${dateLost} ${timeLost}`
      );

      const response = await fetch(
        `http://localhost:5000/api/lost-reports/${createdReportID}`,
        {
          method: "PUT",
          body: formData,
        }
      );

      const data = await response.json();

      console.log(data);

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");+
        setIsLoading(false);
      }

      console.log(data);


       

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      if(response.ok){
        setIsLoading(false);
        setSubmitted(true);
        toast.custom((e) => (
          <Toast icon={InfoIcon} message="Report edited successfully."/>
        ));
      }
    }catch (err) {
      console.error(err);
    }

  }
  //new
  const handleSubmit = async () => {
    try {
  
      setIsLoading(true);
      const formData = new FormData();

      formData.append("image", selectedFile);
      formData.append("item_name", itemName);
      formData.append("description", description);
      formData.append("contents", contents);
      formData.append("category_id", categoryID);
      formData.append("user_id", userID);
      formData.append("location_lost", location);

      formData.append(
        "lost_date",
        `${dateLost} ${timeLost}`
      );

      const response = await fetch(
        "http://localhost:5000/api/lost-reports",
        {
          method: "POST",
          body: formData,
        }
      );


      const data = await response.json();

      console.log(data);

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");+
        setIsLoading(false);
      }

      console.log(data);

      // alert("Lost report submitted!");


      // setItemName("");
      // setDescription("");
      // setContents("");
      // setCategoryID("");
      // setLocation("");
      // setDateLost("");
      // setTimeLost("");
      // setSelectedFile(null);
      // setImage(null);
      setSubmitted(true);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      if(response.ok){
        setIsLoading(false);
        

        setCreatedReportID(data.report.lost_report_id);
        setCreatedItemID(data.item.item_id);
        console.log("CREATED REPORT ID: " + data.report.lost_report_id);
      }

    } catch (err) {
      console.error(err);
    }
  };
  //new 
  const handleChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      setSelectedFile(file);
      setImage(URL.createObjectURL(file));
    }
  };
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
    fetch("http://localhost:5000/api/categories")
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        setCategories(data);
      })
      .catch((err) => {
        console.error(err);
      });
  }, []);

  return (
    <>
      <div className={`${submitted? "hidden" : ""}`} >
      <PageLabel label="Lost Item Report Form" />
      </div>
      <div className={`${submitted ? "bg-(--color-primary) flex flex-col items-center justify-center" : "bg-(--color-secondary)"}  min-h-screen px-4`}>
        

        {!nextPage ?
          (<>
            <PageLabel2 label="Item Description" />
            <HorizontalBreak />
            <div className="bg-white w-full h-fit p-2 rounded-xl mt-4 mb-2 flex items-center justify-center flex-col">
              {image ? (
                <img
                  src={image}
                  alt="Uploaded"
                  onClick={openFilePicker}
                  className="w-full max-h-50 object-cover rounded-xl cursor-pointer hover:opacity-80 transition"
                />
              ) : (
                <div className="p-1 border border-dashed rounded-full border-(--color-primary)">
                  <label onClick={openFilePicker} className="btn-circle btn-lg bg-(--color-primary) cursor-pointer flex items-center justify-center">
                    <i className="fa-solid fa-plus text-white"></i>
                  </label>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleChange}
              />
              {!image && (
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
            <DropDown title="Categories*" placeholder="Select Category" value={categoryID} options={categories} onChange={setCategoryID} />
            <TextField title="Item Name*" placeholder="e.g., iPhone 13 Pro Max, Bag, Umbrella" value={itemName} onChange={setItemName} error={false} />
            <TextArea title="Detailed Description*" placeholder="Brand, Model, Size, Color, Material, etc." value={description} onChange={setDescription} error={false} />
            <TextField title="Contents (if applicable)" placeholder="e.g., Cash amount, ID name" value={contents} onChange={setContents} error={false} />
            <HorizontalBreak />
            <div className="pb-5"></div>
            <div className="flex justify-between items-center pb-20">
              <p className="text-xs">Page 1 out of 2</p>
              
              <div className="flex gap-2">
                  {isEdit?
                  (
                  <>
                    <ButtonNegative label="Cancel" onClick={handleCancel}  />
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
              />
              {dateLost && !dateValid && (
                <p className="text-xs text-red-500 mt-1 ml-1">Date cannot be in the future.</p>
              )}

              <HourInput
                title="Time Lost*"
                value={timeLost}
                onChange={setTimeLost}
                error={dateValid && timeLost && !timeValid}
                disabled={!dateValid}
              />
              {!dateValid && (
                <p className="text-xs text-yellow-500 mt-1 ml-1">Enter a valid date first.</p>
              )}
              {dateValid && timeLost && !timeValid && (
                <p className="text-xs text-red-500 mt-1 ml-1">Time cannot be in the future.</p>
              )}
              <TextField title="Specific Location" placeholder="e.g., 2nd Floor, Room A, near stairs, etc." value={location} onChange={setLocation} error={false} />
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
                  {isEdit?
                  (
                  <>
                    <ButtonPositive label="Confirm" enable={timeValid} onClick={handleUpdate} />
                  </>
                  )
                  :
                  (
                  <>
                    <ButtonPositive label="Submit" enable={timeValid} onClick={handleSubmit} />
                  </>
                  )
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
                  <HorizontalBreak/>
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
              <Loading label="Analyzing Image"/>
            </>
          )
          :
          (
            <>
             
            </>
          )

        }
        {isCancel ?
          (
            <>  
              <AlertDialog message="Discard changes? Unsaved edits will be lost." b1Label="Keep Editing" b2Label="Discard" b1OnClick={handleKeepEditing} b2OnClick={handleDiscard}/>
            </>
          )
          :
          (
            <>
  
            </>
          )

        }
        

      </div>
    </>
  );
}
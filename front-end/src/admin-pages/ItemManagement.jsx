import {Download, QrCode, Plus, Table} from "lucide-react"
import AdminButton from "../admin-components/AdminButton"
import AdminLocationDropDown from "../admin-components/AdminLocationDropDown"
import { useEffect, useState } from "react";
import AdminCategoriesDropdown from "../admin-components/AdminCategoriesDropdown";
import AdminStatusDropDown from "../admin-components/AdminStatusDropDown";
import AdminDateInput from "../admin-components/AdminDateInput";
import AdminTable from "../admin-components/AdminTable";
import FoundItemModal from "../admin-components/FoundItemModal";
import { FOUND_REPORT_STATUS } from "../../../back-end/constants/found_item_status";


export default function ItemManagement(){
    const API_URL = import.meta.env.VITE_API_URL;

    const [location, setLocation] = useState("");
    const [category, setCategory] = useState("");
    const [status, setStatus] = useState("");
    const [openLogItem, setOpenLogItem] = useState(true);
    const [categories, setCategories] = useState([]);
    const [locations, setLocations] = useState([]);
    const [reports, setReports] = useState([]);
    const statuses = Object.values(FOUND_REPORT_STATUS);

 useEffect(() => {
    fetch(`${API_URL}/api/categories`)
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        setCategories(data);
      })
      .catch((err) => {
        console.error(err);
      });
  }, []);
  useEffect(() => {
    fetch(`${API_URL}/api/found-reports`)
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        setReports(data);
      })
      .catch((err) => {
        console.error(err);
      });
  }, []);
  useEffect(() => {
    fetch(`${API_URL}/api/offices`)
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        setLocations(data);
      })
      .catch((err) => {
        console.error(err);
      });
  }, []);

    return(
        <>
            <div className="min-h-screen w-full bg-[#F5F5F5] px-5 pt-5 xl:px-10 xl:pt-10 flex flex-col items-center gap-8">

                <div className="flex h-10 w-full  ">
                     <div className="flex flex-1 border border-[#DDD9CF]  rounded-md shadow-[0_4px_4px_0px_rgba(0,0,0,0.25)]">
                            <input type="text" placeholder="Search" className="input input-bordered w-full" />
                     </div>
                       <div className="h-full w-fit ml-10 xl:ml-35 flex items-center gap-1 xl:gap-5">
                        <AdminButton icon={Download} label="Export CSV" isBorder={true} isShadow={true} isIcon={true}/>
                        <AdminButton icon={QrCode} label="Log via QR" isBorder={true} isShadow={true} isIcon={true}/>
                        <AdminButton icon={Plus} label="Log New Item" isSolid={true} isBorder={true} isShadow={true} isIcon={true} onClick={() => {setOpenLogItem(true)}}/>
                    </div>
                </div>
                 <div className="pb-3 px-4 border  border-[#DDD9CF] w-full shadow-[0_4px_4px_0px_rgba(0,0,0,0.25)] rounded-md ">

                        <div className="flex w-full h-full gap-2 items-center justify-center">
                                 <div className="flex-1">
                            <AdminLocationDropDown placeholder="All Locations" value={location} onChange={setLocation} options={locations}/>
                        </div>
                        <div className="flex-1">
                            <AdminCategoriesDropdown placeholder="All Categories" value={category} onChange={setCategory} options={categories}/>
                        </div>
                        <div className="flex-1">
                            <AdminStatusDropDown placeholder="All Status" value={status} onChange={setStatus} options={statuses}/>
                        </div>
                        <div className="flex-1">
                            <AdminDateInput/>
                        </div>
                        <div className="h-full w-fit flex items-center justify-center mt-2 ml-20 gap-1">
                            <AdminButton isIcon={false} isSolid={true} label="Apply Filters " isBorder={true} isShadow={true}/>
                            <AdminButton isIcon={false} label="Clear " isBorder={false} isShadow={false}/>
                        </div>
                        </div>
  
                 </div>
                <div className="h-125 w-full rounded-2xl overflow-hidden bg-white border border-[#DDD9CF] shadow-[0_4px_4px_0px_rgba(0,0,0,0.25)] flex flex-col ">
                    <AdminTable reports={reports}/>
                </div>
            </div>
            {openLogItem &&
            (
                <>
                    <FoundItemModal
                        open={openLogItem}
                        setOpen={setOpenLogItem}
                        categories={categories}
                        locations={locations}
                    />
                </>
            )

            }
        </>
    )
}


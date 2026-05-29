import { useEffect, useState } from "react";
import PageLabel from "../components/PageLabel";
import FoundItemCard from "../components/FoundItemCard";
import AdminLocationDropDown from "../admin-components/AdminLocationDropDown";
import { FOUND_REPORT_STATUS } from "../../../back-end/constants/found_item_status";
import AdminCategoriesDropdown from "../admin-components/AdminCategoriesDropdown";
import AdminStatusDropDown from "../admin-components/AdminStatusDropDown";
import CategoriesDropDownFilter from "../components/CategoriesDropDownFilter";
import OfficeDropDown from "../components/OfficeDropDown";
import StudentSpacedDrowDown from "../components/StudentSpacesDropDown";
import GateDropDown from "../components/GateDropDown";
import StatusDropDown from "../components/StatusDropDown";
import Loading from "../components/Loading";
import { useNavigate } from "react-router-dom";




export default function Find() {
  const API_URL = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();
  const [viewItem, setViewItem] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState("");
  const [gates, setGates] = useState([]);
  const [building, setBuilding] = useState("");
  const [gate, setGate] = useState("");
  const [space, setSpace] = useState("");
  const [spaces, setSpaces] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [status, setStatus] = useState("");
  const [locations, setLocations] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [locationLabel, setlocationLabel] = useState("");
  const [openLocations, setOpenLocations] = useState(false);
  const statuses = Object.values(FOUND_REPORT_STATUS);
  const [reports, setReports] = useState();
  const reportStatuses = ["Unclaimed", "Claimed"]
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
    fetch(`${API_URL}/api/offices`)
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        setBuildings(data);
      })
      .catch((err) => {
        console.error(err);
      });
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/api/gates`)
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        setGates(data);
      })
      .catch((err) => {
        console.error(err);
      })
  }, [])

  useEffect(() => {
    fetch(`${API_URL}/api/shared-spaces`)
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        setSpaces(data);
      })
      .catch((err) => {
        console.error(err);
      })
  }, [])


  const filteredReports = reports?.filter((report) => {
    const query = search.toLowerCase();
    const words = (locationLabel || "")
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    const firstWord = words[0];
    const firstTwoWords =
      words.length >= 2
        ? `${words[0]} ${words[1]}`
        : words[0];
    const locationText =
      report.location_found?.toLowerCase() || "";
    const matchesSearch =
      report.item_name?.toLowerCase().includes(query) ||
      report.description?.toLowerCase().includes(query) ||
      report.contents?.toLowerCase().includes(query) ||
      report.category_name?.toLowerCase().includes(query) ||
      report.location_found?.toLowerCase().includes(query) ||
      report.reported_by?.toLowerCase().includes(query);
    const matchesLocation =
      !locationLabel ||
      locationText.includes(firstTwoWords) ||
      locationText.includes(firstWord);
    const matchesCategory =
      !category || String(report.category_id) === String(category);
    const matchesStatus =
      !status || report.status === status;

    return (
      matchesSearch &&
      matchesCategory &&
      matchesLocation &&
      matchesStatus
    );
  });
  const sortedReports = [...(filteredReports || [])].sort((a, b) => {
    if (!locationLabel) return 0;
    const words = locationLabel
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    const getScore = (text = "") => {
      text = text.toLowerCase();
      let score = 0;
      const firstWord = words[0];
      const firstTwoWords =
        words.length >= 2
          ? `${words[0]} ${words[1]}`
          : firstWord;
      if (text === locationLabel.toLowerCase()) score += 100;
      if (text.includes(firstTwoWords)) score += 50;
      if (text.includes(firstWord)) score += 25;
      return score;
    };
    return (
      getScore(b.location_found) -
      getScore(a.location_found)
    );
  });

  const onFoundItemClick = (id) => {
    navigate(`/find/${id}`);
    console.log("ID :" + id)
  }
  return (
    <>
      <PageLabel label="Search Item" />
      <div className="bg-(--color-secondary)  min-h-screen w-full px-2 flex flex-col">
        {spaces && buildings && gates && buildings && categories && reports ?
          (
            <>
              <div className="flex h-12 bg-white border border-[#DDD9CF]  rounded-xl shadow-[0_4px_4px_0px_rgba(0,0,0,0.25)] items-center my-3">
                <i className="fa-brands fa-sistrix text-primary text-2xl ml-1"></i>
                <input
                  type="text"
                  placeholder="Search"
                  className="input input-bordered w-full"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex flex-col bg-white border border-[#DDD9CF] px-1 rounded-xl shadow-[0_4px_4px_0px_rgba(0,0,0,0.25)] mb-3 gap-1">
                <div className="flex h-12 p-1 items-center gap-1 overflow-x-auto overflow-y-hidden">
                  <div className="shrink-0">
                    <CategoriesDropDownFilter value={category} onChange={setCategory} defaultOption="All Category" options={categories} />
                  </div>
                  <button className="h-full px-2 text-xs bg-[#F2F2F2] rounded-md shrink-0" onClick={() => setOpenLocations(!openLocations)}>
                    {location || locationLabel ? locationLabel : "All Locations"} <i className="fa-solid fa-caret-down text-[9px]"></i>
                  </button>
                  <div className="w-fit shrink-0">
                    <StatusDropDown value={status} onChange={setStatus} defaultOption="Status" options={reportStatuses} />
                  </div>
                </div>
                {openLocations && spaces && buildings && gates &&
                  (
                    <div className="grid grid-cols-2 h-fit p-1 gap-1 ">
                      <button className="m-1 text-xs bg-[#F2F2F2] rounded-md"
                        onClick={() => { setOpenLocations(!openLocations), setLocation(""), setSpace(""), setGate(""), setlocationLabel("") }}>All Locations</button>
                      <OfficeDropDown value={location} onChange={(value) => { setSpace(""), setGate(""), setLocation(value) }} defaultOption="Buildings" options={buildings} setLabel={setlocationLabel} />
                      <StudentSpacedDrowDown value={space} onChange={(value) => { setSpace(value), setGate(""), setLocation("") }} defaultOption="Shared Student Spaces" options={spaces} setLabel={setlocationLabel} />
                      <GateDropDown value={gate} onChange={(value) => { setSpace(""), setGate(value), setLocation("") }} defaultOption="Gates" options={gates} setLabel={setlocationLabel} />

                    </div>
                  )
                }
              </div>
              <div className=" grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                {sortedReports?.map((report, index) =>
                  <FoundItemCard key={index} data={report}  onClick={onFoundItemClick}/>
                )}
              </div>
            </>
          )
          :
          (
            <>
              <Loading />
            </>)

        }


      </div>
    </>
  );
}

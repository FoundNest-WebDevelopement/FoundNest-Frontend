import { useEffect, useState } from "react";
import PageLabel from "../components/PageLabel";
import FoundItemCard from "../components/FoundItemCard";
import AdminLocationDropDown from "../admin-components/AdminLocationDropDown";
import { FOUND_REPORT_STATUS } from "../constants/found_item_status";
import AdminCategoriesDropdown from "../admin-components/AdminCategoriesDropdown";
import AdminStatusDropDown from "../admin-components/AdminStatusDropDown";
import CategoriesDropDownFilter from "../components/CategoriesDropDownFilter";
import OfficeDropDown from "../components/OfficeDropDown";
import StudentSpacedDrowDown from "../components/StudentSpacesDropDown";
import GateDropDown from "../components/GateDropDown";
import StatusDropDown from "../components/StatusDropDown";
import Loading from "../components/Loading";
import { useNavigate } from "react-router-dom";
import { fetchWithAuth } from "../utils/fetchWithAuth";




export default function Find() {
  const API_URL = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();
  const [viewItem, setViewItem] = useState();
  const [selectedStatus, setSelectedStatus] = useState("");
  const [openStatus, setOpenStatus] = useState(false);
  const [openCategory, setOpenCategory] = useState(false);
  const [openLocations, setOpenLocations] = useState(false);
  const [selectedGates, setSelectedGates] = useState([]);
  const [openGates, setOpenGates] = useState(false);
  const [openCollgeBuilding, setOpenCollgeBuilding] = useState(false);
  const [openSharedSpaces, setOpenSharedSpaces] = useState(false);
  const [selectedSharedSpaces, setSelectedSharedSpaces] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedCollegeBuilding, setSelectedCollegeBuilding] = useState([]);
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

  const statuses = Object.values(FOUND_REPORT_STATUS);
  const [reports, setReports] = useState([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const reportStatuses = ["Unclaimed", "Claimed"];

  useEffect(() => {

    setIsLoadingReports(true);
    fetchWithAuth(`${API_URL}/api/found-reports`
      ,  
    )
      .then((res) => res.json())
      .then((data) => {
        setReports(data);
        setIsLoadingReports(false)
      })
      .catch((err) => {
        console.error(err);
      });
  }, []);

  const categoryLabel =
  selectedCategories.length === 0
    ? "Categories"
    : selectedCategories.length === 1
    ? categories.find(
        (c) => c.category_id === selectedCategories[0]
      )?.category_name
    : `Categories (${selectedCategories.length})`;

    const locationCount =
  selectedCollegeBuilding.length +
  selectedSharedSpaces.length +
  selectedGates.length;

const allLocationNames = [
  ...selectedCollegeBuilding,
  ...selectedSharedSpaces,
  ...selectedGates,
];

const locationLabel =
  locationCount === 0
    ? "Locations"
    : locationCount === 1
    ? allLocationNames[0]
    : `Locations (${locationCount})`;
  

  const allSelectedLocations = [
    ...selectedCollegeBuilding,
    ...selectedSharedSpaces,
    ...selectedGates,
  ];

  

  useEffect(() => {

    fetch(`${API_URL}/api/categories`
    )
      .then((res) => res.json())
      .then((data) => {
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
      allSelectedLocations.length === 0 ||
      allSelectedLocations.some((location) =>
        locationText.includes(location.toLowerCase())
      );
    const matchesCategory =
      selectedCategories.length === 0 ||
      selectedCategories.includes(report.category_id);
    const matchesStatus =
  !selectedStatus || report.status === selectedStatus;

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
  }

  const handleCategoryClick = (categoryId) => {
    setSelectedCategories((prev) => {
      if (prev.includes(categoryId)) {
        return prev.filter((id) => id !== categoryId);
      }

      return [...prev, categoryId];
    });
  };

  const handleCollgeClick = (locationId) => {
    setSelectedCollegeBuilding((prev) => {
      if (prev.includes(locationId)) {
        return prev.filter((id) => id !== locationId);
      }

      return [...prev, locationId];
    });
  };

  const handleSharedSpaceClick = (spaceId) => {
    setSelectedSharedSpaces((prev) => {
      if (prev.includes(spaceId)) {
        return prev.filter((id) => id !== spaceId);
      }

      return [...prev, spaceId];
    });
  };

  const handleGateClick = (gateName) => {
    setSelectedGates((prev) => {
      if (prev.includes(gateName)) {
        return prev.filter((name) => name !== gateName);
      }

      return [...prev, gateName];
    });
  };

  const handleStatusClick = (isClicked) => {
    if(isClicked){
      setSelectedStatus("claimed")
    }
    else{
        setSelectedStatus("unclaimed")
    }
  };


  return (
    <>
      <PageLabel label="Search Item" />
      <div className="bg-(--color-secondary)  min-h-screen w-full px-2 flex flex-col pb-25">
        {!isLoadingReports &&  spaces && buildings && gates && buildings && categories && reports.length > 0  ?
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
                <div className="flex h-12 p-1 items-center gap-1 overflow-x-auto overflow-y-auto">
                  <div className="  shrink-0">
                    <button
                      className={`w-full p-2 text-xs ${openCategory ? "bg-white" : "bg-[#F2F2F2]"
                        } rounded-md`}
                      onClick={() => {
                        setOpenCategory(!openCategory);
                        setOpenLocations(false);
                        setOpenStatus(false);
                      }}
                    >
                      {categoryLabel}
                      <i
                        className={`fa-solid fa-angle-${openCategory ? "up" : "down"
                          } ml-2 text-primary`}
                      />
                    </button>
                  </div>

                  <div className="shrink-0">
                    <button
                      className={`w-full p-2 text-xs ${openLocations ? "bg-white" : "bg-[#F2F2F2]"
                        } rounded-md`}
                      onClick={() => {
                        setOpenLocations(!openLocations);
                        setOpenCategory(false);
                        setOpenStatus(false);
                      }}
                    >
                      {locationLabel}
                      <i
                        className={`fa-solid fa-angle-${openLocations ? "up" : "down"
                          } ml-2 text-primary`}
                      />
                    </button>
                  </div>

                  <div className="shrink-0">
                    <button
                      className={`w-full p-2 text-xs ${openStatus ? "bg-white" : "bg-[#F2F2F2]"
                        } rounded-md`}
                      onClick={() => { 
                        const nextStatus = !openStatus;
                        setOpenStatus(!openStatus);
                        handleStatusClick(nextStatus);
          
                      }}
                    >
                        {openStatus? "Claimed Items" : "Unclaimed Items"}
                    </button>
                  </div>
                </div>



                {openCategory &&
                  (
                    <>
                      <div className="w-full min-h-20  flex flex-wrap gap-2 pb-2 px-3">
                        <button
                          onClick={() => setSelectedCategories([])}
                          className={`text-xs p-2 rounded-md font-medium w-fit h-fit px-5 text-center ${selectedCategories.length === 0
                            ? "bg-(--color-primary) text-white"
                            : "bg-[#F2F2F2]"
                            }`}
                        >
                          All Category
                        </button>

                        {categories?.map((cat) => (
                          <button
                            key={cat.category_id}
                            onClick={() => handleCategoryClick(cat.category_id)}
                            className={`text-xs p-2 rounded-md font-medium w-fit px-5 text-center ${selectedCategories.includes(cat.category_id)
                              ? "bg-(--color-primary) text-white"
                              : "bg-[#F2F2F2]"
                              }`}
                          >
                            {cat.category_name}
                          </button>
                        ))}
                      </div>
                    </>
                  )

                }
                {openLocations &&
                  (
                    <>
                      <div className="w-full min-h-20  flex flex-wrap gap-2 pb-2 px-3 relative z-60">

                        <div className="h-fit rounded-t-md  ">
                          <button
                            onClick={() => { setOpenCollgeBuilding(!openCollgeBuilding), setOpenGates(false), setOpenSharedSpaces(false) }}
                            className={`text-xs p-2 rounded-md z-60 font-medium min-w-35 h-fit text-center ${openCollgeBuilding ? "bg-white border border-primary" : "bg-[#F2F2F2]"}  `}
                          >
                            College Buildings
                            <i className={`fa-solid fa-angle-${openCollgeBuilding ? "up" : "down"} 
                                     ml-3 text-primary`}></i>
                          </button>
                          {openCollgeBuilding &&
                            (
                              <>
                                <div className="absolute w-full h-full  left-0   z-50 ">
                                  <div className="w-full min-h-20 border border-primary mt-1 rounded-md bg-white p-2 flex flex-wrap gap-2">
                                    <button
                                      onClick={() => setSelectedCollegeBuilding([])}
                                      className={`text-xs p-2 rounded-md font-medium w-fit px-5  h-fit text-center ${selectedCollegeBuilding.length === 0
                                        ? "bg-(--color-primary) text-white"
                                        : "bg-[#F2F2F2]"
                                        }`}
                                    >
                                      All College Buildings
                                    </button>
                                    {buildings?.map((building) => (
                                      <button
                                        key={building.office_id}
                                        onClick={() => handleCollgeClick(building.office_name)}
                                        className={`text-xs p-2 rounded-md font-medium w-fit px-5  text-center ${selectedCollegeBuilding.includes(building.office_name)
                                          ? "bg-(--color-primary) text-white"
                                          : "bg-[#F2F2F2]"
                                          }`}
                                      >
                                        {building.office_name}
                                      </button>
                                    ))}

                                  </div>

                                </div>
                              </>
                            )

                          }
                        </div>
                        <div className="h-fit rounded-t-md">
                          <button
                            onClick={() => { setOpenSharedSpaces(!openSharedSpaces), setOpenCollgeBuilding(false), setOpenGates(false) }}
                            className={`text-xs p-2 rounded-md font-medium min-w-35 h-fit text-center ${openSharedSpaces
                                ? "bg-white border border-primary"
                                : "bg-[#F2F2F2]"
                              }`}
                          >
                            Shared Spaces
                            <i
                              className={`fa-solid fa-angle-${openSharedSpaces ? "up" : "down"
                                } ml-3 text-primary`}
                            ></i>
                          </button>

                          {openSharedSpaces && (
                            <div className="absolute w-full left-0 z-50">
                              <div className="w-full min-h-20 border border-primary mt-1 rounded-md bg-white p-2 flex flex-wrap gap-2">

                                <button
                                  onClick={() => setSelectedSharedSpaces([])}
                                  className={`text-xs p-2 rounded-md font-medium w-fit px-5  h-fit text-center ${selectedSharedSpaces.length === 0
                                      ? "bg-(--color-primary) text-white"
                                      : "bg-[#F2F2F2]"
                                    }`}
                                >
                                  All Shared Spaces
                                </button>

                                {spaces?.map((space) => (
                                  <button
                                    key={space.shared_space_id}
                                    onClick={() =>
                                      handleSharedSpaceClick(space.shared_space_name)
                                    }
                                    className={`text-xs p-2 rounded-md font-medium w-fit px-5  text-center ${selectedSharedSpaces.includes(space.shared_space_name)
                                        ? "bg-(--color-primary) text-white"
                                        : "bg-[#F2F2F2]"
                                      }`}
                                  >
                                    {space.shared_space_name}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="h-fit rounded-t-md">
                          <button
                            onClick={() => { setOpenGates(!openGates), setOpenCollgeBuilding(false), setOpenSharedSpaces(false) }}
                            className={`text-xs p-2 rounded-md font-medium min-w-35 h-fit text-center ${openGates
                                ? "bg-white border border-primary"
                                : "bg-[#F2F2F2]"
                              }`}
                          >
                            Gates
                            <i
                              className={`fa-solid fa-angle-${openGates ? "up" : "down"
                                } ml-3 text-primary`}
                            />
                          </button>

                          {openGates && (
                            <div className="absolute w-full left-0 z-50">
                              <div className="w-full min-h-20 border border-primary mt-1 rounded-md bg-white p-2 flex flex-wrap gap-2">

                                <button
                                  onClick={() => setSelectedGates([])}
                                  className={`text-xs p-2 rounded-md font-medium w-fit px-5  h-fit text-center ${selectedGates.length === 0
                                      ? "bg-(--color-primary) text-white"
                                      : "bg-[#F2F2F2]"
                                    }`}
                                >
                                  All Gates
                                </button>

                                {gates?.map((gate) => (
                                  <button
                                    key={gate.gate_id}
                                    onClick={() => handleGateClick(gate.gate_name)}
                                    className={`text-xs p-2 rounded-md font-medium w-fit px-5 text-center ${selectedGates.includes(gate.gate_name)
                                        ? "bg-(--color-primary) text-white"
                                        : "bg-[#F2F2F2]"
                                      }`}
                                  >
                                    {gate.gate_name}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>





                      </div>
                    </>
                  )

                }

                {/* {openStatus && (
  <div className="w-full flex gap-2 pb-2 px-3">
    <button
      onClick={() => setSelectedStatus("")}
      className={`text-xs p-2 rounded-md font-medium px-5 ${
        selectedStatus === ""
          ? "bg-(--color-primary) text-white"
          : "bg-[#F2F2F2]"
      }`}
    >
      All
    </button>

    <button
      onClick={() => setSelectedStatus("unclaimed")}
      className={`text-xs p-2 rounded-md font-medium px-5 ${
        selectedStatus === "unclaimed"
          ? "bg-(--color-primary) text-white"
          : "bg-[#F2F2F2]"
      }`}
    >
      Unclaimed
    </button>

    <button
      onClick={() => setSelectedStatus("claimed")}
      className={`text-xs p-2 rounded-md font-medium px-5 ${
        selectedStatus === "claimed"
          ? "bg-(--color-primary) text-white"
          : "bg-[#F2F2F2]"
      }`}
    >
      Claimed
    </button>
  </div>
)} */}


              </div>
              <div className=" grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                {sortedReports?.map((report, index) =>
                  <FoundItemCard key={index} data={report} onClick={onFoundItemClick} />
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

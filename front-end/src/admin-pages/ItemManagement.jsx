import { Download, QrCode, Plus, ScanLine } from "lucide-react";
import AdminButton from "../admin-components/AdminButton";
import AdminLocationDropDown from "../admin-components/AdminLocationDropDown";
import { useEffect, useState } from "react";
import AdminCategoriesDropdown from "../admin-components/AdminCategoriesDropdown";
import AdminStatusDropDown from "../admin-components/AdminStatusDropDown";
import AdminDateInput from "../admin-components/AdminDateInput";
import ItemManagementTable from "../admin-components/ItemManagementTable";
import FoundItemModal from "../admin-components/FoundItemModal";
import QRScanModal from "../admin-components/QRScanModal";
import QRItemFinderModal from "../admin-components/QRItemFinderModal";
import { FOUND_REPORT_STATUS } from "../constants/found_item_status";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import { useSearchParams, useLocation } from "react-router-dom";

export default function ItemManagement() {
  const API_URL = import.meta.env.VITE_API_URL;
  const adminId = localStorage.getItem("admin_id");

  const [openLogItem, setOpenLogItem] = useState(false);
  const [openQRScan, setOpenQRScan] = useState(false);
  const [openQRFinder, setOpenQRFinder] = useState(false);
  const [qrPrefillData, setQrPrefillData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [reports, setReports] = useState([]);
  const statuses = Object.values(FOUND_REPORT_STATUS);

  // Redirect states
  const [searchParams] = useSearchParams();
  const useLoc     = useLocation();
  const [selectedItem, setSelectedItem] = useState(null);
  const navigatedItemId = searchParams.get("itemId");

  // LOCATIONS STORAGE
  const [gates, setGates] = useState([]);
  const [sharedSpaces, setSharedSpaces] = useState([]);
  const [locations, setLocations] = useState([]);

  const allLocations = [
    ...locations?.map((building) => ({
      id: building.office_id,
      name: building.office_name,
      type: "college",
    })),
    ...sharedSpaces?.map((space) => ({
      id: space.shared_space_id,
      name: space.shared_space_name,
      type: "shared-space",
    })),
    ...gates?.map((gate) => ({
      id: gate.gate_id,
      name: gate.gate_name,
      type: "gate",
    })),
  ];

  // TEMP VARIABLES FILTER STORAGE
  const [searchTemp, setSearchTemp] = useState("");
  const [dateFoundTemp, setDateFoundTemp] = useState("");
  const [locationTemp, setLocationTemp] = useState("");
  const [categoryTemp, setCategoryTemp] = useState("");
  const [statusTemp, setStatusTemp] = useState("unclaimed");

  // SEARCH AND FILTER VARIABLES
  const [search, setSearch] = useState("");
  const [dateFound, setDateFound] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("unclaimed");

  // SEARCH AND FILTER FUNCTION
  const filteredReports = reports.filter((report) => {
    const query = search.toLowerCase();

    const formattedItemId = `SI-${String(report.item_id).padStart(5, "0")}`;
    const paddedItemId = String(report.item_id).padStart(5, "0");

    const matchesSearch =
      !query ||
      String(report.item_id).includes(query) ||
      paddedItemId.includes(query) ||
      formattedItemId.toLowerCase().includes(query.toLowerCase()) ||
      report.item_name?.toLowerCase().includes(query) ||
      report.category_name?.toLowerCase().includes(query) ||
      report.location_found?.toLowerCase().includes(query) ||
      report.reported_by?.toLowerCase().includes(query);

    const matchesCategory =
      !category || String(report.category_id) === String(category);

    const matchesLocation =
      !location || String(report.office_id) === String(location);

    const matchesStatus = !status || report.status === status.toLocaleLowerCase();

    const reportDate = new Date(report.found_date).toISOString().split("T")[0];
    const matchesDate = !dateFound || reportDate === dateFound;

    return (
      matchesSearch &&
      matchesCategory &&
      matchesLocation &&
      matchesDate &&
      matchesStatus
    );
  });

  // FETCH REPORTS AND OTHER DATA
  useEffect(() => {
    fetch(`${API_URL}/api/categories`)
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    fetchWithAuth(`${API_URL}/api/found-reports`)
      .then((res) => res.json())
      .then((data) => setReports(data))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (!navigatedItemId || reports.length === 0) return;
    const report = reports.find(
      (r) => String(r.item_id) === String(navigatedItemId)
    );
    if (report) setSelectedItem(report);
  }, [navigatedItemId, reports, useLoc.key]);

  useEffect(() => {
    fetch(`${API_URL}/api/offices`)
      .then((res) => res.json())
      .then((data) => setLocations(data))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/api/gates`)
      .then((res) => res.json())
      .then((data) => setGates(data))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/api/shared-spaces`)
      .then((res) => res.json())
      .then((data) => setSharedSpaces(data))
      .catch((err) => console.error(err));
  }, []);

  // HANDLE CLEAR FILTER
  const handleClearFilters = () => {
    setSearch("");
    setLocation("");
    setCategory("");
    setStatus("unclaimed");
    setDateFound("");
    setSearchTemp("");
    setLocationTemp("");
    setCategoryTemp("");
    setStatusTemp("unclaimed");
    setDateFoundTemp("");
  };

  // HANDLE APPLY FILTER
  const handleApplyFilters = () => {
    setSearch(searchTemp);
    setLocation(locationTemp);
    setCategory(categoryTemp);

    if (statusTemp.toLocaleLowerCase() === 'for disposal') {
      setStatus("to_be_disposed");
    } else {
      setStatus(statusTemp);
    }

    setDateFound(dateFoundTemp);
  };

  // HANDLE QR SCAN USE DATA (for log via QR)
  const handleQRUseData = (data) => {
    setQrPrefillData(data);
    setOpenLogItem(true);
  };

  // HANDLE QR ITEM FINDER — opens modal for scanned item
  const handleQRItemFound = (itemId) => {
    const report = reports.find(
      (r) => String(r.item_id) === String(itemId)
    );
    if (report) {
      setSelectedItem(report);
    } else {
      alert(`Item SI-${String(itemId).padStart(5, "0")} not found in the system.`);
    }
  };

  // EXPORT CSV
  const downloadCSV = async () => {
    const response = await fetchWithAuth(`${API_URL}/api/export/found-reports`);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "found-reports.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="min-h-screen w-full bg-[#F5F5F5] px-5 pt-5 xl:px-10 xl:pt-7 flex flex-col items-center gap-3">
        <div className="flex h-10 w-full">
          <div className="flex flex-1 border border-[#DDD9CF] rounded-md shadow-[0_4px_4px_0px_rgba(0,0,0,0.25)]">
            <input
              type="text"
              placeholder="Search"
              className="input input-bordered w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="h-full w-fit ml-10 xl:ml-35 flex items-center gap-1 xl:gap-5">
            <AdminButton icon={Download} label="Export CSV" isBorder={true} isShadow={true} isIcon={true} onClick={downloadCSV} />
            <AdminButton icon={ScanLine} label="Find via QR" isBorder={true} isShadow={true} isIcon={true} onClick={() => setOpenQRFinder(true)} />
            <AdminButton icon={QrCode} label="Log via QR" isBorder={true} isShadow={true} isIcon={true} onClick={() => setOpenQRScan(true)} />
            <AdminButton icon={Plus} label="Log New Item" isSolid={true} isBorder={true} isShadow={true} isIcon={true} onClick={() => setOpenLogItem(true)} />
          </div>
        </div>

        <div className="py-1 px-4 border border-[#DDD9CF] w-full shadow-[0_4px_4px_0px_rgba(0,0,0,0.25)] rounded-md">
          <div className="flex w-full h-full gap-2 items-center justify-center">
            <div className="flex-1">
              <AdminLocationDropDown placeholder="All Locations" value={locationTemp} onChange={setLocationTemp} options={locations} />
            </div>
            <div className="flex-1">
              <AdminCategoriesDropdown placeholder="All Categories" value={categoryTemp} onChange={setCategoryTemp} options={categories} />
            </div>
            <div className="flex-1">
              <AdminStatusDropDown placeholder="All Status" value={statusTemp} onChange={setStatusTemp} options={statuses} />
            </div>
            <div className="flex-1">
              <AdminDateInput value={dateFoundTemp} onChange={setDateFoundTemp} />
            </div>
            <div className="h-full w-fit flex items-center justify-center ml-20 gap-1">
              <AdminButton isIcon={false} isSolid={true} label="Apply Filters" isBorder={true} isShadow={true} onClick={handleApplyFilters} />
              <AdminButton isIcon={false} label="Clear" isBorder={false} isShadow={false} onClick={handleClearFilters} />
            </div>
          </div>
        </div>

        <div className="w-full min-w-0">
          <ItemManagementTable
            reports={filteredReports}
            categories={categories}
            locations={locations}
            onUpdated={setReports}
            allLocations={allLocations}
            selectedItem={selectedItem}
            setSelectedItem={setSelectedItem}
          />
        </div>
      </div>

      {/* Log New Item Modal */}
      {openLogItem && (
        <FoundItemModal
          open={openLogItem}
          setOpen={(val) => {
            setOpenLogItem(val);
            if (!val) setQrPrefillData(null);
          }}
          categories={categories}
          locations={locations}
          allLocations={allLocations} 
          prefillData={qrPrefillData}
          onUpdated={setReports}
          setSelectedItem={setSelectedItem}
        />
      )}

      {/* QR Scan Modal (Log via QR) */}
      {openQRScan && (
        <QRScanModal
          open={openQRScan}
          setOpen={setOpenQRScan}
          onUseData={handleQRUseData}
        />
      )}

      {/* QR Item Finder Modal (Find via QR) */}
      {openQRFinder && (
        <QRItemFinderModal
          open={openQRFinder}
          setOpen={setOpenQRFinder}
          onItemFound={handleQRItemFound}
        />
      )}
    </>
  );
}
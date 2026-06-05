import {  Routes, Route } from "react-router-dom";
import AdminLayout from "./layout/AdminLayout";
import Dashboard from "./admin-pages/Dashboard";
import ItemManagement from "./admin-pages/ItemManagement";
import ReportManagement from "./admin-pages/ReportManagement";
import CenterProfile from "./admin-pages/CenterProfile";
import Feedbacks from "./admin-pages/Feedbacks";
import Transactions from "./admin-pages/Tansactions";
import AdminProfile from "./admin-pages/AdminProfile";


function Admin() {
  return (

      <Routes>
        <Route path="/" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="item_management" element={<ItemManagement/>} />
          <Route path="report_management" element={<ReportManagement/>} />
          <Route path="center_profile" element={<CenterProfile/>} />
          <Route path="feedbacks" element={<Feedbacks/>} />
          <Route path="transactions" element={<Transactions/>} />
          <Route path="admin_profile" element={<AdminProfile/>} />
        </Route>
      </Routes>

  );
}

export default Admin;
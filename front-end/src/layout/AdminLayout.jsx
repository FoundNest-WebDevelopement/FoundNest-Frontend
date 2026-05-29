
import { Outlet } from "react-router-dom";
import AdminTopBar from "../admin-components/AdminTopBar";
import Menu from "../admin-components/Menu.jsx"
import { useState } from "react";

function AdminLayout() {
    
 const [tabName, setTabName] = useState("Dashboard");   


  return (
    <div className="min-h-screen bg-base-100">
      <header className="fixed top-0 left-0 right-0 h-20 z-40">
        <AdminTopBar tabName={tabName}/>
      </header>

      <aside className="fixed top-20 left-0 bottom-0 w-60 bg-primary flex justify-center z-10">
            <Menu onChange={setTabName}/>
      </aside>

      <main className="pt-20 ml-60 min-h-screen bg-gray-100 text-black">
        <div className="">
            <Outlet />
        </div>
        </main>
    </div>
  );
}

export default AdminLayout;
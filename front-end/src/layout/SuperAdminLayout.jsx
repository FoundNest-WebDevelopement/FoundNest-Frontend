
import { Outlet } from "react-router-dom";
import { useState } from "react";
import SuperAdminTopBar from "../super-admin-components/SuperAdminTopBar";
import SuperAdminMenu from "../super-admin-components/SuperAdminMenu";

function SuperAdminLayout() {
    
 const [tabName, setTabName] = useState("Dashboard");   


  return (
    <div className="min-h-screen bg-base-100">
      <header className="fixed top-0 left-0 right-0 h-20 z-40">
        <SuperAdminTopBar tabName={tabName}/>
      </header>

      <aside className="fixed top-20 left-0 bottom-0 w-60 bg-primary flex justify-center z-40">
            <SuperAdminMenu onChange={setTabName}/>
      </aside>

      <main className="pt-20 ml-60 min-h-screen bg-gray-100 text-black">
        <div className="">
            <Outlet />
        </div>
        </main>
    </div>
  );
}

export default SuperAdminLayout;
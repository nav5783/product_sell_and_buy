import Sidebar from "../components/Sidebar";
import { Outlet } from "react-router-dom";

const SidebarLayout = () => {
  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      {/* FIX: Changed ml-64 to md:ml-64. 
        This margin now only applies on screens >= md, which is when the fixed sidebar is permanently visible.
        On mobile, the margin is zero, and the content uses the full screen width.
      */}
      <main className="md:ml-64 flex-1 p-0 md:p-6 bg-gray-50 min-h-screen w-full">
        <Outlet />
      </main>
    </div>
  );
};

export default SidebarLayout;

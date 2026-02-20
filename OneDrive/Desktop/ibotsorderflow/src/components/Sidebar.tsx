import { NavLink } from "react-router-dom";
import React, { useState } from "react"; 
import {
  LayoutDashboard,
  Calculator,
  ShieldCheck,
  Users,
  UsersRound,
  LogOut,
  Menu, 
  X, 
  ListTodo,
  Package,
  ChevronDown,
  ChevronUp,
  Settings,
  GraduationCap
} from "lucide-react";
import { useAuth } from "../App"; 

const Sidebar = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isManagementOpen, setIsManagementOpen] = useState(false);

  const baseNavItems = [
    { name: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={18} /> },
    { name: "Enquiries", path: "/enquiries", icon: <Calculator size={18} /> },
    { name: "Dropped", path: "/dropped", icon: <Calculator size={18} /> },
    { name: "Tasks", path:"/task", icon:<ListTodo size={18}/>},
    { name: "Inventory", path:"/inventory", icon:<Package size={18}/>},
    { name: "Training", path:"/training", icon:<GraduationCap size={18}/>},
    { name: "Logout", action: logout, icon: <LogOut size={18} /> },
  ];
  
  const managementItems = [
    { name: "Add Admin", path: "/admin/add-admin", icon: <ShieldCheck size={18} /> },
    { name: "Add Manager", path: "/admin/add-manager", icon: <Users size={18} /> },
    { name: "Add Staff", path: "/admin/add-staff", icon: <Users size={18} /> },
    { name: "Manage Teams", path: "/manage-teams", icon: <UsersRound size={18} /> },
  ];

  const handleNavClick = (isAction: boolean) => {
    if (!isAction) {
        setIsOpen(false);
    }
  };

  const handleManagementClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsManagementOpen(!isManagementOpen);
  };

  const navItems = [...baseNavItems.slice(0,2), ...baseNavItems.slice(2)];

  return (
    <>
      {/* Mobile Menu Button - Visible on small screens, hidden on md and up */}
      <button 
        onClick={() => setIsOpen(true)} 
        className="md:hidden fixed top-4 left-4 z-40 p-2 text-gray-700 bg-white rounded-lg shadow-md hover:bg-gray-100"
        aria-label="Open menu"
      >
        <Menu size={24} />
      </button>

      {/* Sidebar - Positioned for fixed, full height. Hidden by default on mobile, shown with 'isOpen' */}
      <aside 
        className={`
          w-64 h-screen bg-gray-100 shadow-xl p-4 fixed top-0 overflow-y-auto z-50 transition-transform duration-300 ease-in-out
          md:translate-x-0 md:block 
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex justify-between items-center mb-6">
            <div className="w-20 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">iBots</span>
            </div>
            {/* Close Button - Visible only on mobile inside the sidebar */}
            <button 
                onClick={() => setIsOpen(false)} 
                className="md:hidden p-1 text-gray-500 hover:text-red-500 rounded-full"
                aria-label="Close menu"
            >
                <X size={24} />
            </button>
        </div>

        <h3 className="text-xl font-bold mb-8"> Welcome {user.role} </h3>

        <nav className="flex flex-col gap-3">
          {/* First part of nav items (Dashboard, Enquiries) */}
          {navItems.slice(0, 2).map((item) => {
            const isAction = !!item.action;
            
            return item.action ? (
              <button
                key={item.name}
                onClick={() => {
                  item.action();
                  handleNavClick(isAction);
                }}
                className="flex items-center w-full gap-3 px-3 py-2 rounded-md transition-colors duration-200 text-red-600 cursor-pointer hover:bg-red-100"
              >
                {item.icon}
                {item.name}
              </button>
            ) : (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => handleNavClick(isAction)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-md transition-colors duration-200 
                  hover:bg-gray-200 ${
                    isActive ? "bg-purple-100 text-purple-500 font-semibold" : "text-gray-700"
                  }`
                }
              >
                {item.icon}
                {item.name}
              </NavLink>
            )
          })}

          {/* Management Dropdown - Only for admin users */}
          {user?.role === "admin" && (
            <div className="flex flex-col">
              <button
                onClick={handleManagementClick}
                className="flex items-center justify-between w-full gap-3 px-3 py-2 rounded-md transition-colors duration-200 text-gray-700 hover:bg-gray-200"
              >
                <div className="flex items-center gap-3">
                  <Settings size={18} />
                  <span>Management</span>
                </div>
                {isManagementOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
              
              {/* Dropdown items */}
              {isManagementOpen && (
                <div className="ml-6 mt-1 flex flex-col gap-1">
                  {managementItems.map((item) => (
                    <NavLink
                      key={item.name}
                      to={item.path}
                      onClick={() => handleNavClick(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-md transition-colors duration-200 text-sm
                        hover:bg-gray-200 ${
                          isActive ? "bg-purple-100 text-purple-500 font-semibold" : "text-gray-700"
                        }`
                      }
                    >
                      {item.icon}
                      {item.name}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Remaining nav items (Dropped, Tasks, Inventory, Logout) */}
          {navItems.slice(2).map((item) => {
            const isAction = !!item.action;
            
            return item.action ? (
              <button
                key={item.name}
                onClick={() => {
                  item.action();
                  handleNavClick(isAction);
                }}
                className="flex items-center w-full gap-3 px-3 py-2 rounded-md transition-colors duration-200 text-red-600 cursor-pointer hover:bg-red-100"
              >
                {item.icon}
                {item.name}
              </button>
            ) : (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => handleNavClick(isAction)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-md transition-colors duration-200 
                  hover:bg-gray-200 ${
                    isActive ? "bg-purple-100 text-purple-500 font-semibold" : "text-gray-700"
                  }`
                }
              >
                {item.icon}
                {item.name}
              </NavLink>
            )
          })}
        </nav>
      </aside>
      
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" 
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </>
  );
};

export default Sidebar;
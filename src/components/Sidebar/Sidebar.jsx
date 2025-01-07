import React from "react";
import { NavLink } from "react-router-dom";
import { RiDashboardLine, RiProductHuntLine, RiFileList3Line } from "react-icons/ri";
import { BsGraphUp, BsGear } from "react-icons/bs";
import { MdOutlineAddBox, MdOutlineDescription } from "react-icons/md";

export const Sidebar = () => {
  const menuItems = [
    { icon: <RiDashboardLine size={20} />, text: "Dashboard", path: "/" },
    { icon: <RiProductHuntLine size={20} />, text: "Products", path: "/product" },
    { icon: <BsGraphUp size={20} />, text: "Analysis", path: "/analysis" },
    { icon: <MdOutlineAddBox size={20} />, text: "Add Products", path: "/addproduct" },
    { icon: <RiFileList3Line size={20} />, text: "Write Report", path: "/report" },
    { icon: <MdOutlineDescription size={20} />, text: "View Reports", path: "/get-report" },
    { icon: <BsGear size={20} />, text: "Settings", path: "/settings" },
  ];

  return (
    <div className="w-64 min-h-screen bg-blue-900 text-gray-300 py-6 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white px-4">Temiperi</h1>
      </div>

      <nav className="space-y-1">
        {menuItems.map((item, index) => (
          <NavLink
            key={index}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? "bg-blue-800 text-white"
                  : "hover:bg-blue-800/70 hover:text-white"
              }`
            }
          >
            <span className="text-current">{item.icon}</span>
            <span className="font-medium">{item.text}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

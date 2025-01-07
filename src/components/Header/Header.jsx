import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { IoNotificationsOutline, IoSearchOutline } from "react-icons/io5";
import { RiMenu3Line } from "react-icons/ri";

const Header = ({ showLogin, setShowLogin }) => {
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setDate(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-white shadow-sm">
      <div className="max-w-[1800px] mx-auto">
        <div className="flex items-center justify-between h-16 px-4">
          {/* Left side - Menu and Search */}
          <div className="flex items-center flex-1">
            <button className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 lg:hidden">
              <RiMenu3Line size={24} />
            </button>
            
            <div className="hidden lg:flex items-center ml-4 flex-1 max-w-lg">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500"
                />
                <IoSearchOutline
                  size={20}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
              </div>
            </div>
          </div>

          {/* Right side - Navigation and Profile */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-4">
              <Link to="/product" className="text-gray-700 hover:text-gray-900 font-medium">
                Stock
              </Link>
              <Link to="/orders" className="text-gray-700 hover:text-gray-900 font-medium">
                Orders
              </Link>
              <Link to="/report" className="text-gray-700 hover:text-gray-900 font-medium">
                Report
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <button className="p-2 rounded-full text-gray-500 hover:bg-gray-100">
                  <IoNotificationsOutline size={24} />
                  <span className="absolute top-0 right-0 h-5 w-5 text-xs flex items-center justify-center bg-red-500 text-white rounded-full">
                    5
                  </span>
                </button>
              </div>

              {!showLogin ? (
                <button className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">TE</span>
                  </div>
                </button>
              ) : (
                setShowLogin
              )}
            </div>
          </div>
        </div>

        {/* Date and Time Display */}
        <div className="px-4 py-3 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-lg font-semibold text-gray-800">
                {date.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: true,
                })}
              </div>
              <div className="text-sm text-gray-600">
                {date.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { IoNotificationsOutline, IoSearchOutline } from "react-icons/io5";
// import { RiMenu3Line } from "react-icons/ri";
import { useOrderContext } from "../../context/OrderContext";
import { VscAccount } from "react-icons/vsc";

// const Header = ({ showLogin, setShowLogin }) => {
//   const [date, setDate] = useState(new Date());
//   const { newOrdersCount, resetNotifications } = useOrderContext();

//   useEffect(() => {
//     const timer = setInterval(() => {
//       setDate(new Date());
//     }, 1000);

//     return () => clearInterval(timer);
//   }, []);

//   const currentTime = date.toLocaleTimeString("en-US", {
//     hour: "2-digit",
//     minute: "2-digit",
//     second: "2-digit",
//     hour12: true,
//   });

//   const currentDate = date.toLocaleDateString("en-US", {
//     weekday: "long",
//     year: "numeric",
//     month: "long",
//     day: "numeric",
//   });

//   return (
//     <div className="bg-white shadow-sm">
//       <div className="max-w-[1800px] mx-auto">
//         <div className="flex items-center justify-between h-16 px-4">
//           {/* Left side - Menu and Search */}
//           <div className="flex items-center flex-1 justify-center">
//             <div className="text-gray-600">
//               {currentDate} {currentTime}
//             </div>
//           </div>

//           {/* Right side - Navigation and Profile */}
//           <div className="flex items-center space-x-6">
//             <div className="flex items-center space-x-4">
//               <Link
//                 to="/product"
//                 className="text-gray-700 hover:text-gray-900 font-medium"
//               >
//                 Stock
//               </Link>
//               <Link
//                 to="/orders"
//                 className="text-gray-700 hover:text-gray-900 font-medium"
//                 onClick={resetNotifications}
//               >
//                 Orders
//               </Link>
//               <Link
//                 to="/report"
//                 className="text-gray-700 hover:text-gray-900 font-medium"
//               >
//                 Report
//               </Link>
//             </div>

//             <div className="flex items-center space-x-4">
//               <div className="relative">
//                 <Link to="/orders" onClick={resetNotifications}>
//                   <button className="p-2 rounded-full text-gray-500 hover:bg-gray-100">
//                     <IoNotificationsOutline size={24} />
//                     {newOrdersCount > 0 && (
//                       <span className="absolute top-0 right-0 h-5 w-5 text-xs flex items-center justify-center bg-red-500 text-white rounded-full">
//                         {newOrdersCount}
//                       </span>
//                     )}
//                   </button>
//                 </Link>
//               </div>

//               {!showLogin ? (
//                 <button className="flex items-center space-x-2">
//                   <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
//                     <span className="text-sm font-medium text-gray-600">
//                       TE
//                     </span>
//                   </div>
//                 </button>
//               ) : (
//                 setShowLogin
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Header;

import { FaRegCalendarAlt } from "react-icons/fa";
import { IoMdSearch, IoMdTime } from "react-icons/io";
// import { useLocation } from 'react-router-dom';

const Header = () => {
    const [date, setDate] = useState(new Date());
    const { newOrdersCount, resetNotifications } = useOrderContext();

    useEffect(() => {
      const timer = setInterval(() => {
        setDate(new Date());
      }, 1000);

      return () => clearInterval(timer);
    }, []);

    const currentTime = date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

    const currentDate = date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });

    return (
        <div className='max-md:w-screen w-full px-4 lg:px-6 py-4 bg-white'>
            <div className='flex flex-col lg:flex-row lg:items-center justify-between gap-4'>
              <h1 className="text-xl font-bold">Welcome Admin</h1>
                {/* Date and Time */}
              <div className="flex items-center gap-4 ">
                  <p className='font-medium flex items-center gap-2 text-sm lg:text-base bg-gray-200 p-2'>
                      {currentDate}
                  </p>
                  <p className='font-medium flex items-center gap-2 text-sm lg:text-base bg-gray-200 p-2'>
                      {currentTime}
                  </p>
                  <Link to="/orders" onClick={resetNotifications}>
                    <button className="p-2 rounded-full bg-gray-200 hover:bg-gray-100 duration-300 ease-linear">
                      <IoNotificationsOutline className="text-2xl text-black" />
                      {newOrdersCount > 0 && (
                        <span className="absolute top-3 right-20 h-5 w-5 text-xs flex items-center justify-center bg-red-500 text-white rounded-full">
                          {newOrdersCount}
                        </span>
                      )}
                  </button>
                </Link>
                  <Link to="/">
                    <button className="p-2 rounded-full bg-gray-200 hover:bg-gray-100 duration-300 ease-linear">
                      <VscAccount className="text-2xl text-black" />
                    </button>
                </Link>
              </div>
            </div>
        </div>
    );
};

export default Header;

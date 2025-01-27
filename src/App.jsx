// import React, { useEffect, useState } from "react";
import Analysis from "./components/Analysis/Analysis";
import Header from "./components/Header/Header";
// import Orders from "./components/Orders/Orders";
import Products from "./components/Products/Products";
import AddProduct from "./components/AddProduct/AddProduct";
import Settings from "./components/Settings/Settings";
import Report from "./components/Reprot/Report";
import { OrderProvider } from "./context/OrderContext";
import Expenses from "./components/Expenses/Expenses";
import Summary from "./components/Summary/Summary";
import ViewReports from "./components/Reprot/ViewReports";
import { Sidebar } from "./components/Sidebar/Sidebar";
// import "./app.css";
import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
// import Products from './pages/Products';
// import Orders from './pages/Orders';
import { HiMenuAlt2 } from "react-icons/hi";
import Stocks from "./pages/Stocks";
import Order from "./pages/Orders";
import Reports from "./pages/Reports";
import LowStock from "./pages/LowStock";

const App = ({ data }) => {
  // const [showLogin, setShowLogin] = useState(true);
  // const navigate = useNavigate();
  // const location = useLocation();
  const [isSideNavOpen, setIsSideNavOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  // const forbiddenRoutes = ["/login"];
  // const isLoginPage = location.pathname.includes(forbiddenRoutes);

  // useEffect(() => {
  //   if (!data) {
  //     showLogin;
  //   } else {
  //     navigate("/analysis");
  //   }
  // }, []);

  return (
    <OrderProvider>
      {/* <div className="app">
        {!isLoginPage && (
          <>
            <Header />
            <div className="main-container">
              <Sidebar />
              <div className="content-container">
                <Routes>
                  <Route path="/" element={<Analysis />} />
                  <Route path="/product" element={<Products />} />
                  <Route path="/addproduct" element={<AddProduct />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/report" element={<Report />} />
                  <Route path="/get-report" element={<ViewReports />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/expenses" element={<Expenses />} />
                  <Route path="/analysis" element={<Analysis />} />
                  <Route path="/summary" element={<Summary />} />
                </Routes>
              </div>
            </div>
          </>
        )}
        {isLoginPage && (
          <Routes>
            <Route path="/login" element={<Login />} />
          </Routes>
        )}
      </div> */}
      <div className="flex h-screen relative">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsSideNavOpen(!isSideNavOpen)}
          className="lg:hidden fixed top-4 right-4 z-50 p-2 rounded-md bg-blue text-white hover:bg-opacity-90"
        >
          <HiMenuAlt2 className="text-2xl" />
        </button>

        {/* Overlay for mobile */}
        {isSideNavOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setIsSideNavOpen(false)}
          />
        )}

        {/* Side Navigation */}
        <div
          className={`fixed lg:static h-full z-40 transform transition-transform duration-300 ease-in-out ${
            isSideNavOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }`}
        >
          <Sidebar onClose={() => setIsSideNavOpen(false)} />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Header */}
          <div className="sticky top-0 z-20 lg:relative">
            <Header />
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 max-md:w-screen overflow-y-auto px-4 lg:px-6 pt-8 md:pt-16 lg:pt-0 pb-6">
            <Routes>
              <Route path="/" element={<Stocks />} />
              <Route path="/product" element={<Products />} />
              <Route path="/addproduct" element={<AddProduct />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/report" element={<Reports />} />
              <Route path="/get-report" element={<ViewReports />} />
              <Route path="/orders" element={<Order />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/analysis" element={<Analysis />} />
              <Route path="/summary" element={<Summary />} />
              <Route path="/low-stock" element={<LowStock />} />
            </Routes>
          </div>
        </div>
      </div>
    </OrderProvider>
  );
};

export default App;

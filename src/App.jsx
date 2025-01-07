import React, { useEffect, useState } from "react";
import { Route, Routes, useNavigate } from "react-router-dom";
import Login from "./components/Login/Login";
import Analysis from "./components/Analysis/Analysis";
import Header from "./components/Header/Header";
import Orders from "./components/Orders/Orders";
import Products from "./components/Products/Products";
import AddProduct from "./components/AddProduct/AddProduct";
import Settings from "./components/Settings/Settings";
import Report from "./components/Reprot/Report";
import Footer from "./components/Footer/Footer";
import { useLocation } from "react-router-dom";
import { OrderProvider } from "./context/OrderContext";
import Expenses from "./components/Expenses/Expenses";
import Summary from "./components/Summary/Summary";
import ViewReports from "./components/Reprot/ViewReports";
import { Sidebar } from "./components/Sidebar/Sidebar";
import "./app.css";

const App = ({ data }) => {
  const [showLogin, setShowLogin] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const forbiddenRoutes = ["/login"];
  const isLoginPage = location.pathname.includes(forbiddenRoutes);

  useEffect(() => {
    if (!data) {
      showLogin;
    } else {
      navigate("/analysis");
    }
  }, []);

  return (
    <OrderProvider>
      <div className="app">
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
      </div>
    </OrderProvider>
  );
};

export default App;

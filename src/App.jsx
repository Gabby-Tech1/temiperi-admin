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

const App = ({ data }) => {
  // const devUrl = "http://localhost:4000/temiperi";
  // const prodUrl = "https://temiperi-backend.onrender.com/temiperi";
  // const baseUrl = window.location.hostname === "localhost" ? devUrl : prodUrl;

  const [showLogin, setShowLogin] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();

  const forbiddenRoutes = ["/login"];

  useEffect(() => {
    if (!data) {
      showLogin;
    } else {
      navigate("/analysis");
    }
  }, []);
  return (
    <>
      <div>
        {!location.pathname.includes(forbiddenRoutes) && <Header />}
        <Routes>
          <Route path="/" element={<Analysis />} />
          <Route path="/product" element={<Products />} />
          <Route path="/addproduct" element={<AddProduct />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/report" element={<Report />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/login" element={<Login />} />
        </Routes>
        {/* <Footer /> */}
      </div>
    </>
  );
};

export default App;

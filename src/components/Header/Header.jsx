import React, { useState } from "react";
import "./header.css";
import { asset } from "../../assets/assets";
import { Link } from "react-router-dom";
import Sales from "../Sales/Sales";
import TotalProduct from "../TotalProduct/TotalProduct";

const Header = ({ showLogin, setShowLogin }) => {
  const [date, setDate] = useState(new Date());
  const [expense, setExpense] = useState(0);
  const [percentage, setPercentage] = useState(0);
  const [result, setResult] = useState(0);

  const handleProfit = () => {
    console.log(setResult(Number(sales) + Number(expense)));
  };

  return (
    <div className="header">
      <nav>
        <div className="logo">
          <img src={asset.logo} alt="" />
        </div>

         <div className="nav_menu">
            <Link to='/product'>
               <p className='stock'>Stock</p>
            </Link>
            <Link to='/orders'>
               <p className='ord'>Orders</p>
            </Link>
            <Link to='/report'>
               <p className='rep'>Report</p>
            </Link>
         </div>

        <div className="notification">
          <div className="message">
            <img src={asset.notification} alt="" />
            <div className="noti_text">5</div>
          </div>
          {!showLogin ? <img src={asset.person} alt="" /> : setShowLogin}
        </div>
      </nav>

      {/* ======== date ===== */}

      <div className="date">
        <div className="date_time">
          <p className="time">{date.getHours()}</p>
          <p className="time">{date.getMinutes()}</p>
        </div>
        <div className="month_year">
          <p className="">{date.getDate()}</p>
          <p className="month">{date.getMonth() + 1}</p>
          <p className="year">{date.getFullYear()}</p>
        </div>
      </div>

      {/* ============= cards ============== */}

      <div className="cards_container">
        <Sales />
        <TotalProduct />

        <div className="card" id="expense">
          <img src={asset.expense} alt="" />
          <div className="total_sales">
            <div>
              <h3>Total Expense</h3>
              <p>GH {expense}</p>
            </div>

            <div className="sales_percent">
              <p>Increase in sales by</p>
              <div className="percent">
                <h4>{percentage}%</h4>
              </div>
            </div>
          </div>
          <small>Last 24 hours</small>
        </div>
        <div className="card" id="profit">
          <img src={asset.profit} alt="" />
          <div className="total_sales">
            <div>
              <h3>Total Profit</h3>
              <p>GH {result}</p>
            </div>

            <div className="sales_percent">
              <p>Increase in sales by</p>
              <div className="percent">
                <h4>{percentage}%</h4>
              </div>
            </div>
          </div>
          <small>Last 24 hours</small>
        </div>
      </div>
    </div>
  );
};

export default Header;

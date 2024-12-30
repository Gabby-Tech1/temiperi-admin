import React, { useState, useEffect } from "react";
import axios from "axios";
import { asset } from "../../assets/assets";

const Sales = () => {
  const [sales, setSales] = useState(0);
  const [percentage, setPercentage] = useState(0);

  const devUrl = "http://localhost:4000";
  const prodUrl = "https://temiperi-backend.onrender.com";
  const baseUrl = window.location.hostname === "localhost" ? devUrl : prodUrl;

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const response = await axios.get(`${baseUrl}/invoices`);
        const invoices = response.data.data;

        // Get the current time and calculate 24 hours ago
        const now = new Date();
        const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        // Filter invoices created within the last 24 hours
        const recentInvoices = invoices.filter((invoice) => {
          return new Date(invoice.createdAt) > last24Hours;
        }, 0);

        // Calculate total sales for recent invoices
        const totalSales = recentInvoices.reduce(
          (total, invoice) => total + invoice.totalAmount,
          0
        );
        setSales(totalSales);

        // Calculate percentage increase (dummy example, replace with actual logic)
        const previousSales = 1000; // Example previous sales
        const percentageIncrease =
          ((totalSales - previousSales) / previousSales) * 100;
        setPercentage(percentageIncrease.toFixed(2));
      } catch (error) {
        console.error("Error fetching invoices:", error);
      }
    };

    fetchInvoices();
  }, []);

  return (
    <div>
      <div className="card" id="sales">
        <img src={asset.sale} alt="Sales" />
        <div className="total_sales">
          <div>
            <h3>Total Sales</h3>
            <p>GH {sales}</p>
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
  );
};

export default Sales;

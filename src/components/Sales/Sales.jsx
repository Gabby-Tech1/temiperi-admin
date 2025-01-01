import React, { useState, useEffect } from "react";
import axios from "axios";
import { asset } from "../../assets/assets";

const Sales = () => {
  const [sales, setSales] = useState(0);
  const [percentage, setPercentage] = useState(0);

  const devUrl = "http://localhost:4000";
  const prodUrl = "https://temiperi-stocks-backend.onrender.com/temiperi";
  const baseUrl = window.location.hostname === "localhost" ? devUrl : prodUrl;

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const response = await axios.get(`https://temiperi-stocks-backend.onrender.com/temiperi/invoices`);
        const invoices = response?.data?.data || [];

        // Get the current time and calculate 24 hours ago
        const now = new Date();
        const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        // Filter invoices created within the last 24 hours
        const recentInvoices = invoices.filter((invoice) => {
          const invoiceDate = new Date(invoice?.createdAt);
          return invoiceDate <= last24Hours
        });

        const totalAmount = invoices.reduce(
          (total, invoice) => total + (invoice?.totalAmount || 0),
          0
        );
        // Calculate total sales for recent invoices
        const totalSales = recentInvoices.reduce(
          (total, invoice) => total + (invoice?.totalAmount || 0),
          0
        );
        setSales(totalSales);

        // Calculate percentage change from previous period
        const previousPeriodStart = new Date(last24Hours.getTime() - 24 * 60 * 60 * 1000);
        const previousInvoices = invoices.filter((invoice) => {
          const invoiceDate = new Date(invoice?.createdAt);
          return invoiceDate >= previousPeriodStart;
        });

        const previousTotal = previousInvoices.reduce(
          (total, invoice) => total + (invoice?.totalAmount || 0),
          0
        );

        const percentageChange = previousTotal === 0 
          ? 0 
          : ((totalSales - previousTotal) / totalAmount) * 100;
        
        setPercentage(percentageChange.toFixed(2));
      } catch (error) {
        console.error("Error fetching invoices:", error);
      }
    };

    // Fetch immediately
    fetchInvoices();

    // Set up interval to fetch every 5 minutes
    const intervalId = setInterval(fetchInvoices, 5 * 60 * 1000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [baseUrl]);

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

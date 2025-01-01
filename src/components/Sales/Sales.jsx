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
        const response = await axios.get(
          `https://temiperi-stocks-backend.onrender.com/temiperi/invoices`
        );
        const invoices = response?.data?.data || [];

        // Get the current time and calculate time ranges
        const now = new Date();
        const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const previousPeriodStart = new Date(last24Hours.getTime() - 24 * 60 * 60 * 1000);

        // Filter invoices created within the last 24 hours
        const recentInvoices = invoices.filter((invoice) => {
          const invoiceDate = new Date(invoice?.createdAt);
          return invoiceDate >= last24Hours && invoiceDate <= now;
        });

        // Calculate total sales for recent invoices
        const totalSales = recentInvoices.reduce(
          (total, invoice) => total + (invoice?.totalAmount || 0),
          0
        );
        setSales(totalSales);

        // Filter invoices for the previous 24-hour period
        const previousInvoices = invoices.filter((invoice) => {
          const invoiceDate = new Date(invoice?.createdAt);
          return invoiceDate >= previousPeriodStart && invoiceDate < last24Hours;
        });

        // Calculate total sales for the previous period
        const previousTotal = previousInvoices.reduce(
          (total, invoice) => total + (invoice?.totalAmount || 0),
          0
        );

        // Calculate percentage change with a more balanced approach
        let percentageChange = 0;
        if (previousTotal === 0 && totalSales === 0) {
          percentageChange = 0;
        } else if (previousTotal === 0) {
          percentageChange = 100; // Cap it at 100% for new sales
        } else {
          // Use a more balanced percentage calculation
          const increase = totalSales > previousTotal;
          const larger = Math.max(totalSales, previousTotal);
          const smaller = Math.min(totalSales, previousTotal);
          let change = ((larger - smaller) / larger) * 100;
          
          // Cap at 100% and maintain the sign
          change = Math.min(change, 100);
          percentageChange = increase ? change : -change;
        }

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

import React, { useState, useEffect } from "react";
import axios from "axios";
import { asset } from "../../assets/assets";
import "./sales.css";
import { useOrderContext } from "../../context/OrderContext";

const Sales = () => {
  const [sales, setSales] = useState(0);
  const [percentage, setPercentage] = useState(0);
  const [allInvoices, setAllInvoices] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isCustomDate, setIsCustomDate] = useState(false);
  const { refreshTrigger } = useOrderContext();

  const fetchInvoices = async () => {
    try {
      const response = await axios.get(
        "https://temiperi-stocks-backend.onrender.com/temiperi/invoices"
      );
      const invoices = response?.data?.data || [];
      setAllInvoices(invoices);
      
      // By default, show last 24 hours
      calculateSalesForTimeWindow();
    } catch (error) {
      console.error("Error fetching invoices:", error);
    }
  };

  const calculateSalesForTimeWindow = () => {
    // Get the current time and calculate 24 hours ago
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const previous24Hours = new Date(last24Hours.getTime() - 24 * 60 * 60 * 1000);

    // Filter and calculate for current 24 hours
    const recentInvoices = allInvoices.filter((invoice) => {
      const invoiceDate = new Date(invoice?.createdAt);
      return invoiceDate >= last24Hours && invoiceDate <= now;
    });

    // Filter and calculate for previous 24 hours
    const previousInvoices = allInvoices.filter((invoice) => {
      const invoiceDate = new Date(invoice?.createdAt);
      return invoiceDate >= previous24Hours && invoiceDate < last24Hours;
    });

    calculateSalesAndPercentage(recentInvoices, previousInvoices);
    setIsCustomDate(false);
    setStartDate("");
    setEndDate("");
  };

  const calculateSalesForDateRange = () => {
    if (!startDate || !endDate) return;

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Include the entire end date

    // Calculate the same duration for the previous period
    const duration = end.getTime() - start.getTime();
    const previousStart = new Date(start.getTime() - duration);
    const previousEnd = new Date(end.getTime() - duration);

    // Filter and calculate for selected date range
    const selectedInvoices = allInvoices.filter((invoice) => {
      const invoiceDate = new Date(invoice?.createdAt);
      return invoiceDate >= start && invoiceDate <= end;
    });

    // Filter and calculate for previous period
    const previousInvoices = allInvoices.filter((invoice) => {
      const invoiceDate = new Date(invoice?.createdAt);
      return invoiceDate >= previousStart && invoiceDate < previousEnd;
    });

    calculateSalesAndPercentage(selectedInvoices, previousInvoices);
    setIsCustomDate(true);
  };

  const calculateSalesAndPercentage = (currentInvoices, previousInvoices) => {
    // Calculate total sales for current period
    const totalSales = currentInvoices.reduce(
      (total, invoice) => total + (invoice?.totalAmount || 0),
      0
    );

    // Calculate total sales for previous period
    const previousTotal = previousInvoices.reduce(
      (total, invoice) => total + (invoice?.totalAmount || 0),
      0
    );

    // Calculate percentage change
    let percentageChange = 0;
    if (previousTotal === 0 && totalSales === 0) {
      percentageChange = 0;
    } else if (previousTotal === 0) {
      percentageChange = 100;
    } else {
      const increase = totalSales > previousTotal;
      const larger = Math.max(totalSales, previousTotal);
      const smaller = Math.min(totalSales, previousTotal);
      let change = ((larger - smaller) / larger) * 100;
      change = Math.min(change, 100);
      percentageChange = increase ? change : -change;
    }

    setSales(totalSales);
    setPercentage(percentageChange.toFixed(2));
  };

  useEffect(() => {
    fetchInvoices();
  }, [refreshTrigger]);

  // Update calculations when allInvoices changes
  useEffect(() => {
    if (!isCustomDate) {
      calculateSalesForTimeWindow();
    }
  }, [allInvoices]);

  return (
    <div>
      <div className="card" id="sales">
        <img src={asset.sale} alt="Sales" />
        <div className="sales-content">
          <h3 className="text-white">{isCustomDate ? "Custom Date Range Sales" : "24-Hour Sales"}</h3>
          
          <div className="filter-section">
            <button 
              type="button"
              onClick={calculateSalesForTimeWindow}
              className={`filter-btn ${!isCustomDate ? 'active' : ''}`}
            >
              Last 24 Hours
            </button>
            
            <div className="date-range">
              <div className="date-input-wrapper">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <span className="date-separator">to</span>
              <div className="date-input-wrapper">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <button 
                type="button"
                onClick={calculateSalesForDateRange}
                disabled={!startDate || !endDate}
                className="filter-btn"
              >
                Filter
              </button>
            </div>
          </div>

          <div className="total_sales">
            <div>
              <p>Total Sales</p>
              <h3>GH {sales.toFixed(2)}</h3>
            </div>

            <div className="sales_percent">
              <p>
                {percentage >= 0 ? "Increase" : "Decrease"} in sales by
              </p>
              <div className={`${percentage >= 0 ? 'positive' : 'negative'}`}>
                <div className="percent"> 
                  <h4 className="percent">{Math.abs(percentage)}%</h4>
                </div>
              </div>
            </div>
          </div>
          <small>
            {isCustomDate 
              ? `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`
              : "Last 24 hours"
            }
          </small>
        </div>
      </div>
    </div>
  );
};

export default Sales;

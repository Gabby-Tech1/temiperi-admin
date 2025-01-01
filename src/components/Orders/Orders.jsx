import { useEffect, useState } from "react";
import "./order.css";
import axios from "axios";

const Orders = () => {
  const [orderList, setOrderList] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isCustomDate, setIsCustomDate] = useState(false);

  // Fetch orders from API
  const fetchOrders = async () => {
    try {
      const response = await axios.get("https://temiperi-stocks-backend.onrender.com/temiperi/orders");
      if (response?.data) {
        const allOrders = response?.data?.data || [];
        setOrderList(allOrders);
        
        // By default, show last 24 hours
        filterOrdersByTimeWindow();
      } else {
        console.log("No orders found");
      }
    } catch (error) {
      console.error("Error fetching orders: ", error);
    }
  };

  // Filter orders by time window (last 24 hours by default)
  const filterOrdersByTimeWindow = () => {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const recentOrders = orderList.filter((order) => {
      const orderDate = new Date(order?.createdAt);
      return orderDate >= last24Hours && orderDate <= now;
    });

    setFilteredOrders(recentOrders);
    setIsCustomDate(false);
    setStartDate("");
    setEndDate("");
  };

  // Filter orders by custom date range
  const filterOrdersByDateRange = () => {
    if (!startDate || !endDate) return;

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Include the entire end date

    const filteredOrders = orderList.filter((order) => {
      const orderDate = new Date(order?.createdAt);
      return orderDate >= start && orderDate <= end;
    });

    setFilteredOrders(filteredOrders);
    setIsCustomDate(true);
  };

  useEffect(() => {
    // Fetch immediately
    fetchOrders();

    // Set up interval to fetch every 5 minutes
    const intervalId = setInterval(fetchOrders, 5 * 60 * 1000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  // Update filtered orders when orderList changes
  useEffect(() => {
    if (!isCustomDate) {
      filterOrdersByTimeWindow();
    }
  }, [orderList]);

  return (
    <div className="table_container">
      <div className="header-section">
        <h2 className="font-bold">
          {isCustomDate ? "Custom Date Range Orders" : "Recent Orders (Last 24 Hours)"}
        </h2>
        
        <div className="date-filter">
          <button 
            onClick={filterOrdersByTimeWindow}
            className={`filter-btn ${!isCustomDate ? 'active' : ''}`}
          >
            Last 24 Hours
          </button>
          
          <div className="date-inputs">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="date-input"
            />
            <span>to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="date-input"
            />
            <button 
              onClick={filterOrdersByDateRange}
              disabled={!startDate || !endDate}
              className="filter-btn"
            >
              Filter
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="table table-xs">
          <thead>
            <tr>
              <th>Invoice Number</th>
              <th>Customer Name</th>
              <th>Order Date</th>
              <th>Items</th>
              <th>Total Price</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr key={order?._id}>
                <td>{order?.invoiceNumber}</td>
                <td>{order?.customerName}</td>
                <td>{new Date(order?.createdAt).toLocaleString()}</td>
                <td>
                  <ul>
                    {order?.items?.map((item, index) => (
                      <li key={index}>
                        {item?.quantity} x {item?.description || "N/A"} @ $
                        {item?.price}
                      </li>
                    ))}
                  </ul>
                </td>
                <td>
                  $
                  {order?.items?.reduce(
                    (total, item) => total + (item?.quantity || 0) * (item?.price || 0),
                    0
                  ).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Orders;

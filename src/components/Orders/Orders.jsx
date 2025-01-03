import { useEffect, useState } from "react";
import "./order.css";
import axios from "axios";
import { useOrderContext } from "../../context/OrderContext";

const Orders = () => {
  const [orderList, setOrderList] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isCustomDate, setIsCustomDate] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchBy, setSearchBy] = useState("all");
  const [editingOrder, setEditingOrder] = useState(null);
  const [sortByPayment, setSortByPayment] = useState(false);
  const [paymentTotals, setPaymentTotals] = useState({
    cash: 0,
    momo: 0,
    credit: 0
  });
  const { refreshTrigger, triggerRefresh } = useOrderContext();

  // Fetch orders from API
  const fetchOrders = async () => {
    try {
      const response = await axios.get("https://temiperi-stocks-backend.onrender.com/temiperi/orders");
      if (response?.data) {
        const allOrders = response?.data?.data || [];
        setOrderList(allOrders);
        console.log('Fetched orders:', allOrders);
        // Calculate totals immediately after fetching
        calculatePaymentTotals(allOrders);
        // By default, show last 24 hours
        filterOrdersByTimeWindow(allOrders);
      } else {
        console.log("No orders found");
      }
    } catch (error) {
      console.error("Error fetching orders: ", error);
    }
  };

  // Calculate payment method totals
  const calculatePaymentTotals = (orders) => {
    console.log('Calculating totals for orders:', orders);
    
    const totals = orders.reduce((acc, order) => {
      const method = (order?.paymentMethod || 'cash').toLowerCase();
      // Parse the amount from the order items
      const amount = order?.items?.reduce((sum, item) => {
        return sum + (parseFloat(item.price) * parseFloat(item.quantity));
      }, 0) || 0;
      
      console.log(`Order ${order._id}:`, { method, amount });
      
      // Initialize the method if it doesn't exist
      if (!acc[method]) {
        acc[method] = 0;
      }
      
      acc[method] += amount;
      return acc;
    }, {
      cash: 0,
      momo: 0,
      credit: 0
    });
    
    console.log('Final totals:', totals);
    setPaymentTotals(totals);
  };

  useEffect(() => {
    fetchOrders();
  }, [refreshTrigger]);

  useEffect(() => {
    if (filteredOrders.length > 0) {
      calculatePaymentTotals(filteredOrders);
    }
  }, [filteredOrders]);

  // Sort orders by payment method
  const sortOrdersByPaymentMethod = (orders) => {
    if (!sortByPayment) return orders;
    
    return [...orders].sort((a, b) => {
      const methodA = (a?.paymentMethod || '').toLowerCase();
      const methodB = (b?.paymentMethod || '').toLowerCase();
      return methodA.localeCompare(methodB);
    });
  };

  // Filter orders by time window (last 24 hours by default)
  const filterOrdersByTimeWindow = (orders = orderList) => {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const recentOrders = orders
      .filter((order) => {
        const orderDate = new Date(order?.createdAt);
        return orderDate >= last24Hours && orderDate <= now;
      })
      .sort((a, b) => new Date(b?.createdAt) - new Date(a?.createdAt)); // Sort by date descending

    const sortedOrders = sortOrdersByPaymentMethod(recentOrders);
    setFilteredOrders(sortedOrders);
    setIsCustomDate(false);
    setStartDate("");
    setEndDate("");
    applySearch(sortedOrders);
    calculatePaymentTotals(sortedOrders);
  };

  // Filter orders by custom date range
  const filterOrdersByDateRange = () => {
    if (!startDate || !endDate) return;

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Include the entire end date

    const dateFilteredOrders = orderList
      .filter((order) => {
        const orderDate = new Date(order?.createdAt);
        return orderDate >= start && orderDate <= end;
      })
      .sort((a, b) => new Date(b?.createdAt) - new Date(a?.createdAt)); // Sort by date descending

    const sortedOrders = sortOrdersByPaymentMethod(dateFilteredOrders);
    setFilteredOrders(sortedOrders);
    setIsCustomDate(true);
    applySearch(sortedOrders);
    calculatePaymentTotals(sortedOrders);
  };

  // Apply search filter
  const applySearch = (orders) => {
    if (!searchQuery.trim()) {
      setFilteredOrders(sortOrdersByPaymentMethod(orders));
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = orders
      .filter((order) => {
        const invoiceMatch = order?.invoiceNumber?.toLowerCase().includes(query);
        const nameMatch = order?.customerName?.toLowerCase().includes(query);

        switch (searchBy) {
          case "invoice":
            return invoiceMatch;
          case "name":
            return nameMatch;
          default:
            return invoiceMatch || nameMatch;
        }
      })
      .sort((a, b) => new Date(b?.createdAt) - new Date(a?.createdAt)); // Sort by date descending

    setFilteredOrders(sortOrdersByPaymentMethod(filtered));
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    applySearch(isCustomDate ? filteredOrders : orderList);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this order?")) {
      return;
    }

    try {
      const response = await axios.get(
        `https://temiperi-stocks-backend.onrender.com/temiperi/delete-order?id=${id}`
      );

      if (response.data && response.data.success) {
        console.log("Delete response:", response.data);
        // Refresh all components
        triggerRefresh();
        // Refresh local state
        fetchOrders();
        alert("Order deleted successfully!");
      } else {
        throw new Error(response.data?.message || "Failed to delete order");
      }
    } catch (error) {
      console.error("Error deleting order:", error);
      console.error("Error response:", error.response?.data);
      alert(`Failed to delete order: ${error.response?.data?.message || error.message}`);
    }
  };

  //handle delete function
  const handleEdit = (order) => {
    setEditingOrder(order);
  };

  const handleSaveEdit = async () => {
    if (!editingOrder) return;

    try {
      // Format the request data
      const updateData = {
        orderId: editingOrder._id,
        items: editingOrder.items.map(item => ({
          productId: item.productId || item._id,
          quantity: item.quantity,
          price: item.price
        }))
      };

      await axios.post(
        `https://temiperi-stocks-backend.onrender.com/temiperi/update-order?id=${editingOrder._id}`,
        updateData
      );
      // Refresh all components
      triggerRefresh();
      // Refresh local state
      fetchOrders();
      setEditingOrder(null);
    } catch (error) {
      console.error("Error updating order:", error);
      alert("Failed to update order. Please try again.");
    }
    console.log("Updated order with ID:", editingOrder._id);
  };

  const handleQuantityChange = (itemIndex, newQuantity) => {
    if (!editingOrder) return;

    const updatedItems = [...editingOrder.items];
    updatedItems[itemIndex] = {
      ...updatedItems[itemIndex],
      quantity: parseInt(newQuantity) || 0
    };

    setEditingOrder({
      ...editingOrder,
      items: updatedItems
    });
  };

  const getPaymentMethodStyle = (method) => {
    switch (method?.toLowerCase()) {
      case 'cash':
        return 'bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium';
      case 'momo':
        return 'bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-medium';
      case 'card':
        return 'bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium';
      case 'bank transfer':
        return 'bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium';
      default:
        return 'bg-gray-100 text-gray-800 px-2 py-1 rounded-full font-medium';
    }
  };

  useEffect(() => {
    // Fetch immediately
    fetchOrders();

    // Set up interval to fetch every 5 minutes
    const intervalId = setInterval(fetchOrders, 5 * 60 * 1000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="table_container">
      <div className="header-section border border-solid rounded-md border-gray-300 p-6">
        <div className="title-section">
          <h2 className="font-bold text-2xl mb-2">
            {isCustomDate ? "Custom Date Range Orders" : "Recent Orders (Last 24 Hours)"}
          </h2>
          <div className="order-stats">
            <div className="flex items-center flex-row justify-between">
              <p className="text-lg">
              Total Orders:
              </p>
              <p className="font-semibold">{filteredOrders.length}</p>
            </div>
            <div className="flex items-center flex-row justify-between">
              <p className="text-lg p-1">
                Total Amount: 
              </p>
              <p className="font-semibold">GHC
                  {filteredOrders.reduce((total, order) => {
                    const orderTotal = order?.items?.reduce(
                      (sum, item) => sum + (item?.quantity || 0) * (item?.price || 0),
                      0
                    );
                    return  total + orderTotal;
                  }, 0).toFixed(2)}
                </p>
            </div>
            <div className="flex items-center flex-row justify-between">
              <p className="text-lg p-1">
                Payment Totals: 
              </p>
              <div className="flex flex-col">
                <p className="font-semibold">Cash: GHC {paymentTotals.cash.toFixed(2)}</p>
                <p className="font-semibold">Momo: GHC {paymentTotals.momo.toFixed(2)}</p>
                <p className="font-semibold">Credit: GHC {paymentTotals.credit.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="controls-section">
          <div className="search-section">
            <div className="search-container">
              <input
                type="text"
                placeholder="Search orders..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="search-input"
              />
              <select
                value={searchBy}
                onChange={(e) => setSearchBy(e.target.value)}
                className="search-select"
              >
                <option value="all">All</option>
                <option value="invoice">Invoice Number</option>
                <option value="name">Customer Name</option>
              </select>
            </div>
          </div>
          
          <div className="date-filter">
            <button
              onClick={() => filterOrdersByTimeWindow()}
              className={`filter-btn ${!isCustomDate ? 'active' : ''}`}
            >
              Last 24 Hours
            </button>
            
            <div className="flex items-center justify-center gap-4 p-4 ">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="date-input"
              />
              <span className="date-separator">to</span>
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
          <div className="flex items-center justify-center gap-4 p-4 ">
            <button
              onClick={() => setSortByPayment(!sortByPayment)}
              className={`filter-btn ${sortByPayment ? 'active' : ''}`}
            >
              Sort by Payment Method
            </button>
          </div>
        </div>
      </div>

      <div className="orders-list mt-6">
        {filteredOrders.map((order) => (
          <div key={order._id} className="order-item border border-gray-200 rounded-lg p-4 mb-4 shadow-sm">
            <div className="order-header flex justify-between items-center mb-3">
              <div>
                <h3 className="font-semibold">Invoice: {order.invoiceNumber}</h3>
                <p className="text-gray-600">Customer: {order.customerName}</p>
                <p className="text-gray-600">Date: {new Date(order.createdAt).toLocaleString()}</p>
                <p className="flex items-center gap-2">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className={getPaymentMethodStyle(order.paymentMethod)}>
                    {order.paymentMethod || 'Not specified'}
                  </span>
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(order)}
                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(order._id)}
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>

            {editingOrder && editingOrder._id === order._id ? (
              <div className="edit-form bg-gray-50 p-4 rounded">
                <h4 className="font-semibold mb-2">Edit Order Items</h4>
                {editingOrder.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 mb-2">
                    <p className="flex-1">{item.description || item.name}</p>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(index, e.target.value)}
                      className="w-20 p-1 border rounded"
                      min="0"
                    />
                    <p className="w-24">GHC {item.price}</p>
                    <p className="w-24">GHC {(item.quantity * item.price).toFixed(2)}</p>
                  </div>
                ))}
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => setEditingOrder(null)}
                    className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <div className="order-items">
                <table className="w-full">
                  <thead>
                    <tr className="text-left">
                      <th className="py-2">Item</th>
                      <th className="py-2">Quantity</th>
                      <th className="py-2">Price</th>
                      <th className="py-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item, index) => (
                      <tr key={index}>
                        <td className="py-1">{item.description || item.name}</td>
                        <td className="py-1">{item.quantity}</td>
                        <td className="py-1">GHC {item.price}</td>
                        <td className="py-1">GHC {(item.quantity * item.price).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="order-total mt-2 text-right">
                  <p className="font-semibold">
                    Total: GHC {order.items.reduce((sum, item) => sum + item.quantity * item.price, 0).toFixed(2)}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Orders;

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
  const [momoAmount, setMomoAmount] = useState(0);
  const [cashAmount, setCashAmount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(10);
  const [paymentTotals, setPaymentTotals] = useState({
    cash: 0,
    momo: 0,
    credit: 0,
    partialCash: 0,
    partialMomo: 0,
  });
  const { refreshTrigger, triggerRefresh } = useOrderContext();

  // Fetch orders from API
  const fetchOrders = async () => {
    try {
      const response = await axios.get(
        "https://temiperi-stocks-backend.onrender.com/temiperi/orders"
      );
      if (response?.data) {
        const allOrders = response?.data?.data || [];
        setOrderList(allOrders);
        console.log("Fetched orders:", allOrders);
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
    console.log("Calculating totals for orders:", orders);

    let totalMomo = 0;
    let totalCash = 0;

    orders.forEach((order) => {
      const totalAmount =
        order?.items?.reduce((sum, item) => {
          return sum + parseFloat(item.price) * parseFloat(item.quantity);
        }, 0) || 0;

      if (order.paymentMethod === "momo") {
        totalMomo += totalAmount;
      } else if (order.paymentMethod === "cash") {
        totalCash += totalAmount;
      } else if (order.paymentMethod === "momo/cash") {
        totalMomo += parseFloat(order.momoAmount || 0);
        totalCash += parseFloat(order.cashAmount || 0);
      }
    });

    setMomoAmount(totalMomo);
    setCashAmount(totalCash);

    console.log("Momo Total:", totalMomo);
    console.log("Cash Total:", totalCash);
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
      const methodA = (a?.paymentMethod || "").toLowerCase();
      const methodB = (b?.paymentMethod || "").toLowerCase();
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
        const invoiceMatch = order?.invoiceNumber
          ?.toLowerCase()
          .includes(query);
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
      alert(
        `Failed to delete order: ${
          error.response?.data?.message || error.message
        }`
      );
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
        items: editingOrder.items.map((item) => ({
          productId: item.productId || item._id,
          quantity: item.quantity,
          price: item.price,
        })),
        customerName: editingOrder.customerName,
        paymentMethod: editingOrder.paymentMethod,
        cashAmount: editingOrder.cashAmount,
        momoAmount: editingOrder.momoAmount,
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
      quantity: parseInt(newQuantity) || 0,
    };

    setEditingOrder({
      ...editingOrder,
      items: updatedItems,
    });
  };

  const getPaymentMethodStyle = (method) => {
    switch (method?.toLowerCase()) {
      case "cash":
        return "bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium";
      case "momo":
        return "bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-medium";
      case "card":
        return "bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium";
      case "bank transfer":
        return "bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium";
      default:
        return "bg-gray-100 text-gray-800 px-2 py-1 rounded-full font-medium";
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

  // Get current orders
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(
    indexOfFirstOrder,
    indexOfLastOrder
  );

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const EditForm = () => {
    if (!editingOrder) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <h2 className="text-xl font-bold mb-4">Edit Order</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Customer Name</label>
              <input
                type="text"
                value={editingOrder.customerName || ''}
                onChange={(e) => setEditingOrder({...editingOrder, customerName: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Payment Method</label>
              <select
                value={editingOrder.paymentMethod || ''}
                onChange={(e) => setEditingOrder({...editingOrder, paymentMethod: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="cash">Cash</option>
                <option value="momo">Momo</option>
                <option value="momo/cash">Momo/Cash</option>
              </select>
            </div>

            {editingOrder.paymentMethod === 'momo/cash' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Cash Amount</label>
                  <input
                    type="number"
                    value={editingOrder.cashAmount || 0}
                    onChange={(e) => setEditingOrder({...editingOrder, cashAmount: parseFloat(e.target.value)})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Momo Amount</label>
                  <input
                    type="number"
                    value={editingOrder.momoAmount || 0}
                    onChange={(e) => setEditingOrder({...editingOrder, momoAmount: parseFloat(e.target.value)})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Items</label>
              {editingOrder.items.map((item, index) => (
                <div key={index} className="flex gap-4 mb-2">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500">Product</label>
                    <input
                      type="text"
                      value={item.name || ''}
                      disabled
                      className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50"
                    />
                  </div>
                  <div className="w-24">
                    <label className="block text-xs text-gray-500">Quantity</label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(index, e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div className="w-24">
                    <label className="block text-xs text-gray-500">Price</label>
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) => {
                        const updatedItems = [...editingOrder.items];
                        updatedItems[index] = { ...item, price: parseFloat(e.target.value) || 0 };
                        setEditingOrder({ ...editingOrder, items: updatedItems });
                      }}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-4">
            <button
              onClick={() => setEditingOrder(null)}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="table_container">
      <div className="header-section border border-solid rounded-md border-gray-300 p-6">
        <div className="title-section">
          <h2 className="font-bold text-2xl mb-2">
            {isCustomDate
              ? "Custom Date Range Orders"
              : "Recent Orders (Last 24 Hours)"}
          </h2>
          <div className="order-stats">
            <div className="flex items-center flex-row justify-between">
              <p className="text-lg">Total Orders:</p>
              <p className="font-semibold">{filteredOrders.length}</p>
            </div>
            <div className="flex items-center flex-row justify-between">
              <p className="text-lg p-1">Total Amount:</p>
              <p className="font-semibold">
                GHC
                {filteredOrders
                  .reduce((total, order) => {
                    const orderTotal = order?.items?.reduce(
                      (sum, item) =>
                        sum + (item?.quantity || 0) * (item?.price || 0),
                      0
                    );
                    return total + orderTotal;
                  }, 0)
                  .toFixed(2)}
              </p>
            </div>
            <div className="flex items-center flex-row justify-between">
              <p className="text-lg p-1">Payment Totals:</p>
              <div className="flex flex-col">
                <p className="font-semibold">
                  Cash: GHC {cashAmount.toFixed(2)}
                </p>
                <p className="font-semibold">
                  Momo: GHC {momoAmount.toFixed(2)}
                </p>
                <p className="font-semibold">
                  Credit: GHC {paymentTotals.credit.toFixed(2)}
                </p>
                <p className="font-semibold">
                  Partial Cash: GHC {paymentTotals.partialCash.toFixed(2)}
                </p>
                <p className="font-semibold">
                  Partial Momo: GHC {paymentTotals.partialMomo.toFixed(2)}
                </p>
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
              className={`filter-btn ${!isCustomDate ? "active" : ""}`}
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
              className={`filter-btn ${sortByPayment ? "active" : ""}`}
            >
              Sort by Payment Method
            </button>
          </div>
        </div>
      </div>

      <div className="orders-list mt-6">
        <table className="w-full">
          <thead>
            <tr className="text-left">
              <th className="px-4 py-2">Customer</th>
              <th className="px-4 py-2">Items</th>
              <th className="px-4 py-2">Payment Method</th>
              <th className="px-4 py-2">Total</th>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Invoice</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentOrders.map((order) => (
              <tr key={order._id} className="border-b">
                <td className="px-4 py-2">{order.customerName}</td>
                <td className="px-4 py-2">
                  {order.items.map((item, index) => (
                    <div key={index}>
                      {item.description} - {item.quantity} x GHC{" "}
                      {item.price.toFixed(2)}
                    </div>
                  ))}
                </td>
                <td className="px-4 py-2">
                  <div>
                    <div className="font-semibold">{order.paymentMethod}</div>
                    {(order.paymentMethod === "momo/cash" ||
                      order.paymentType === "partial") && (
                      <div className="text-sm text-gray-600">
                        {order.cashAmount > 0 && (
                          <div>
                            Cash: GHC {parseFloat(order.cashAmount).toFixed(2)}
                          </div>
                        )}
                        {order.momoAmount > 0 && (
                          <div>
                            Momo: GHC {parseFloat(order.momoAmount).toFixed(2)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-2">
                  GHC{" "}
                  {order.items
                    .reduce((sum, item) => sum + item.quantity * item.price, 0)
                    .toFixed(2)}
                </td>
                <td className="px-4 py-2">
                  {new Date(order.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-2">{order.invoiceNumber}</td>
                <td className="px-4 py-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(order)}
                      className="bg-blue-500 text-white px-2 py-1 rounded text-sm hover:bg-blue-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(order._id)}
                      className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="pagination-container mt-4 flex justify-center items-center gap-2">
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
          >
            Previous
          </button>

          {Array.from({
            length: Math.ceil(filteredOrders.length / ordersPerPage),
          }).map((_, index) => (
            <button
              key={index}
              onClick={() => paginate(index + 1)}
              className={`px-3 py-1 rounded ${
                currentPage === index + 1
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              {index + 1}
            </button>
          ))}

          <button
            onClick={() => paginate(currentPage + 1)}
            disabled={
              currentPage === Math.ceil(filteredOrders.length / ordersPerPage)
            }
            className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
      {editingOrder && <EditForm />}
    </div>
  );
};

export default Orders;

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
  const [invoices, setInvoices] = useState([]);
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
      const [ordersResponse, invoicesResponse] = await Promise.all([
        axios.get(
          "https://temiperi-stocks-backend.onrender.com/temiperi/orders"
        ),
        axios.get(
          "https://temiperi-stocks-backend.onrender.com/temiperi/invoices"
        ),
      ]);

      if (ordersResponse?.data) {
        const allOrders = invoicesResponse?.data?.data || [];
        setOrderList(allOrders);
        // Filter orders by time window
        filterOrdersByTimeWindow(allOrders);
      } else {
        console.log("No orders found");
      }

      // Calculate totals from invoices
      if (invoicesResponse?.data?.data) {
        const invoices = invoicesResponse.data.data;
        const today = new Date();
        // Filter invoices to only include today's
        const todaysInvoices = invoices.filter((invoice) => {
          const invoiceDate = new Date(invoice.createdAt);
          return (
            invoiceDate.getFullYear() === today.getFullYear() &&
            invoiceDate.getMonth() === today.getMonth() &&
            invoiceDate.getDate() === today.getDate()
          );
        });

        let totalMomo = 0;
        let totalCash = 0;
        let totalCredit = 0;
        let totalPartialCash = 0;
        let totalPartialMomo = 0;

        todaysInvoices.forEach((invoice) => {
          const totalAmount = invoice.totalAmount || 0;

          if (invoice.paymentMethod === "momo") {
            totalMomo += totalAmount;
          } else if (invoice.paymentMethod === "cash") {
            totalCash += totalAmount;
          } else if (invoice.paymentMethod === "credit") {
            totalCredit += totalAmount;
          } else if (invoice.paymentMethod === "momo/cash") {
            totalMomo += parseFloat(invoice.momoAmount || 0);
            totalCash += parseFloat(invoice.cashAmount || 0);
          } else if (invoice.paymentType === "partial") {
            if (invoice.momoAmount)
              totalPartialMomo += parseFloat(invoice.momoAmount);
            if (invoice.cashAmount)
              totalPartialCash += parseFloat(invoice.cashAmount);
          }
        });

        setMomoAmount(totalMomo);
        setCashAmount(totalCash);
        setPaymentTotals({
          cash: totalCash,
          momo: totalMomo,
          credit: totalCredit,
          partialCash: totalPartialCash,
          partialMomo: totalPartialMomo,
        });
      }
    } catch (error) {
      console.error("Error fetching data: ", error);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [refreshTrigger]);

  useEffect(() => {
    if (filteredOrders.length > 0) {
      // We don't need to recalculate totals here anymore since it's based on invoices
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

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const response = await axios.get(
          "https://temiperi-stocks-backend.onrender.com/temiperi/invoices"
        );
        if (response.data && response.data.data) {
          setInvoices(response.data.data);
        }

        //reduce total amount
        const total = response.data.data.reduce(
          (sum, invoice) => sum + invoice?.totalAmount,
          0
        );
      } catch (error) {
        console.error("Error fetching invoices:", error);
      }
    };

    fetchInvoices();
  }, []);
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
        `https://temiperi-stocks-backend.onrender.com/temiperi/delete-invoice?id=${id}`
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

  // Get current orders for pagination
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(
    indexOfFirstOrder,
    indexOfLastOrder
  );

  // Change page
  const paginate = (pageNumber) => {
    // Ensure pageNumber is within valid range
    const maxPage = Math.ceil(filteredOrders.length / ordersPerPage);
    const validPageNumber = Math.max(1, Math.min(pageNumber, maxPage));
    setCurrentPage(validPageNumber);
  };

  const EditForm = () => {
    if (!editingOrder) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <h2 className="text-xl font-bold mb-4">Edit Order</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Customer Name
              </label>
              <input
                type="text"
                value={editingOrder.customerName || ""}
                onChange={(e) =>
                  setEditingOrder({
                    ...editingOrder,
                    customerName: e.target.value,
                  })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Payment Method
              </label>
              <select
                value={editingOrder.paymentMethod || ""}
                onChange={(e) =>
                  setEditingOrder({
                    ...editingOrder,
                    paymentMethod: e.target.value,
                  })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="cash">Cash</option>
                <option value="momo">Momo</option>
                <option value="momo/cash">Momo/Cash</option>
              </select>
            </div>

            {editingOrder.paymentMethod === "momo/cash" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Cash Amount
                  </label>
                  <input
                    type="number"
                    value={editingOrder.cashAmount || 0}
                    onChange={(e) =>
                      setEditingOrder({
                        ...editingOrder,
                        cashAmount: parseFloat(e.target.value),
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Momo Amount
                  </label>
                  <input
                    type="number"
                    value={editingOrder.momoAmount || 0}
                    onChange={(e) =>
                      setEditingOrder({
                        ...editingOrder,
                        momoAmount: parseFloat(e.target.value),
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Items
              </label>
              {editingOrder.items.map((item, index) => (
                <div key={index} className="flex gap-4 mb-2">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500">
                      Product
                    </label>
                    <input
                      type="text"
                      value={item.name || ""}
                      disabled
                      className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50"
                    />
                  </div>
                  <div className="w-24">
                    <label className="block text-xs text-gray-500">
                      Quantity
                    </label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        handleQuantityChange(index, e.target.value)
                      }
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
                        updatedItems[index] = {
                          ...item,
                          price: parseFloat(e.target.value) || 0,
                        };
                        setEditingOrder({
                          ...editingOrder,
                          items: updatedItems,
                        });
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
    <div className="orders-container p-4">
      <div className="summary-section bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="stats-card">
            <h3 className="text-xl font-bold mb-4">Today's Sales Summary</h3>
            <div className="flex flex-col space-y-2">
              <div className="stat-item">
                <p className="font-semibold text-gray-700">
                  Cash:{" "}
                  <span className="text-green-600">
                    GHC {cashAmount.toFixed(2)}
                  </span>
                </p>
              </div>
              <div className="stat-item">
                <p className="font-semibold text-gray-700">
                  Momo:{" "}
                  <span className="text-blue-600">
                    GHC {momoAmount.toFixed(2)}
                  </span>
                </p>
              </div>
              <div className="stat-item">
                <p className="font-semibold text-gray-700">
                  Credit:{" "}
                  <span className="text-red-600">
                    GHC {paymentTotals.credit.toFixed(2)}
                  </span>
                </p>
              </div>
              {/* <div className="stat-item">
                <p className="font-semibold text-gray-700">
                  Partial Cash:{" "}
                  <span className="text-orange-600">
                    GHC {paymentTotals.partialCash.toFixed(2)}
                  </span>
                </p>
              </div> */}
              {/* <div className="stat-item">
                <p className="font-semibold text-gray-700">
                  Partial Momo:{" "}
                  <span className="text-purple-600">
                    GHC {paymentTotals.partialMomo.toFixed(2)}
                  </span>
                </p>
              </div> */}
              <div className="stat-item mt-2 pt-2 border-t">
                <p className="font-bold text-lg text-gray-800">
                  Total: GHC{" "}
                  {(
                    cashAmount +
                    momoAmount +
                    paymentTotals.credit +
                    paymentTotals.partialCash +
                    paymentTotals.partialMomo
                  ).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="controls-section">
            <div className="search-section mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="flex-grow px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={searchBy}
                  onChange={(e) => setSearchBy(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All</option>
                  <option value="invoice">Invoice Number</option>
                  <option value="name">Customer Name</option>
                </select>
              </div>
            </div>

            <div className="date-controls space-y-4">
              <button
                onClick={() => filterOrdersByTimeWindow()}
                className={`w-full py-2 px-4 rounded-lg ${
                  !isCustomDate
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Last 24 Hours
              </button>

              <div className="custom-date-range space-y-2">
                <div className="flex gap-2 items-center">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={filterOrdersByDateRange}
                  disabled={!startDate || !endDate}
                  className="w-full py-2 px-4 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Filter by Date
                </button>
              </div>
            </div>

            <button
              onClick={() => setSortByPayment(!sortByPayment)}
              className={`w-full mt-4 py-2 px-4 rounded-lg ${
                sortByPayment
                  ? "bg-purple-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {sortByPayment
                ? "Sorting by Payment Method"
                : "Sort by Payment Method"}
            </button>
          </div>
        </div>
      </div>

      <div className="orders-list bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Items
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Payment Method
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Total
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Invoice
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentOrders.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{order.customerName}</td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      {order.items.map((item, index) => (
                        <div key={index} className="text-sm">
                          {item.description} - {item.quantity} x GHC{" "}
                          {item.price.toFixed(2)}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium text-gray-900">
                        {order.paymentMethod}
                      </div>
                      {(order.paymentMethod === "momo/cash" ||
                        order.paymentType === "partial") && (
                        <div className="mt-1 text-sm text-gray-600">
                          {order.cashAmount > 0 && (
                            <div>
                              Cash: GHC{" "}
                              {parseFloat(order.cashAmount).toFixed(2)}
                            </div>
                          )}
                          {order.momoAmount > 0 && (
                            <div>
                              Momo: GHC{" "}
                              {parseFloat(order.momoAmount).toFixed(2)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    GHC{" "}
                    {order.totalAmount
                      ? order.totalAmount.toFixed(2)
                      : order.items
                          .reduce(
                            (sum, item) => sum + item.quantity * item.price,
                            0
                          )
                          .toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(order.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm">{order.invoiceNumber}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(order)}
                        className="bg-blue-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-600 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(order._id)}
                        className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-600 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="pagination-container p-4 flex justify-center items-center gap-2">
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>

          {Array.from({
            length: Math.ceil(filteredOrders.length / ordersPerPage),
          }).map((_, index) => (
            <button
              key={index}
              onClick={() => paginate(index + 1)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                currentPage === index + 1
                  ? "bg-blue-600 text-white"
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
            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

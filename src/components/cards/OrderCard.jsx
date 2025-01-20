import React, { useEffect, useState } from "react";
import axios from "axios";
import { useOrderContext } from "../../context/OrderContext";
import card from "../../assets/card-icon.png";
import arrow from "../../assets/arrow.png";

const OrderCard = () => {
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
        "https://temiperi-stocks-backend.onrender.com/temiperi/invoices"
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
    <div className="flex items-center flex-end w-[70%] gap-6 justify-end">
      <div className="border-2 rounded-md p-2 w-full">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-semibold">{filteredOrders.length}</h3>
          <p className="text-sm">Orders in last 24 hours</p>
        </div>
        <hr />
        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center gap-2">
            <img src={card} alt="card" className="w-12 h-12" />
            <div className="">
              <p className="text-xs font-semibold text-gray-500 mt-4">
                Total Amount
              </p>
              <p>
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
          </div>
          <div className="flex items-start ">
            <img src={arrow} alt="arrow" className="w-8 h-8" />
            <div className="text-gary-500 text-[13px] flex flex-col leading-3 text-gray-500 justify-start">
              <p className="font-semibold">Payments</p>
              <p className="flex items-center gap-1">
                Momo: GHC{momoAmount.toFixed(2)}
              </p>
              <p className="flex items-center gap-1">
                Cash: GHC{cashAmount.toFixed(2)}
              </p>
              <p className="flex items-center gap-1">
                Credit: GHC{paymentTotals.credit.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="border-2 rounded-md p-2 w-full">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-semibold">{filteredOrders.length}</h3>
          <p className="text-sm">Orders in last 24 hours</p>
        </div>
        <hr />
        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center gap-2">
            <img src={card} alt="card" className="w-12 h-12" />
            <div className="">
              <p className="text-xs font-semibold text-gray-500 mt-4">
                Total Amount
              </p>
              <p>
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
          </div>
          <div className="flex items-start ">
            <img src={arrow} alt="arrow" className="w-8 h-8" />
            <div className="text-gary-500 text-[13px] flex flex-col leading-3 text-gray-500 justify-start">
              <p className="font-semibold">Payments</p>
              <p className="flex items-center gap-1">
                Momo: GHC{momoAmount.toFixed(2)}
              </p>
              <p className="flex items-center gap-1">
                Cash: GHC{cashAmount.toFixed(2)}
              </p>
              <p className="flex items-center gap-1">
                Credit: GHC{paymentTotals.credit.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderCard;

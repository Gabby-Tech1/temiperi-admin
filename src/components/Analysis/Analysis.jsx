import React, { useState, useEffect } from "react";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import { Chart as ChartJS } from "chart.js/auto";
import axios from "axios";
import { MdTrendingUp, MdTrendingDown } from "react-icons/md";
import { BsArrowUpRight, BsArrowDownRight } from "react-icons/bs";

const Analysis = () => {
  const [salesData, setSalesData] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedTimeFrame, setSelectedTimeFrame] = useState("monthly");
  const [selectedProduct, setSelectedProduct] = useState("all");
  const [products, setProducts] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [timeFrameData, setTimeFrameData] = useState({
    labels: [],
    values: [],
    average: 0,
    highest: 0,
    lowest: 0,
    total: 0,
  });
  const [productPerformance, setProductPerformance] = useState({
    timeLabels: [],
    datasets: [],
    summary: {
      totalRevenue: 0,
      totalQuantity: 0,
      averageOrderValue: 0,
      bestPerformingPeriod: "",
      worstPerformingPeriod: "",
      bestPerformingProduct: {
        name: "",
        revenue: 0,
        quantity: 0
      }
    },
  });

  // Fetch orders data
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        "https://temiperi-stocks-backend.onrender.com/temiperi/orders"
      );
      if (response?.data?.data) {
        const orders = response.data.data;
        processOrdersData(orders);
        calculateTopProducts(orders);
        updateTimeFrameAnalysis(orders);
        processProductPerformance(orders);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [selectedYear, selectedMonth, selectedTimeFrame, selectedProduct]);

  // Process product performance data
  const processProductPerformance = (orders) => {
    // Extract unique products
    const uniqueProducts = new Set();
    orders.forEach(order => {
      order.items.forEach(item => uniqueProducts.add(item.name));
    });
    setProducts(Array.from(uniqueProducts));

    // Filter orders based on selected time frame
    const filteredOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      const orderYear = orderDate.getFullYear();
      const orderMonth = orderDate.getMonth();

      if (selectedTimeFrame === 'monthly') {
        return orderYear === selectedYear;
      } else {
        return orderYear === selectedYear && orderMonth === selectedMonth;
      }
    });

    // Process data
    const timeFrameData = new Map();
    const productData = new Map();

    filteredOrders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      let timeKey = '';

      switch (selectedTimeFrame) {
        case 'monthly':
          timeKey = orderDate.getMonth();
          break;
        case 'weekly':
          const weekNum = Math.ceil((orderDate.getDate() + 
            new Date(orderDate.getFullYear(), orderDate.getMonth(), 1).getDay()) / 7);
          timeKey = `Week ${weekNum}`;
          break;
        case 'daily':
          timeKey = orderDate.getDate();
          break;
      }

      order.items.forEach(item => {
        if (selectedProduct === 'all' || selectedProduct === item.name) {
          const amount = (parseFloat(item.price) || 0) * (parseFloat(item.quantity) || 0);
          const quantity = parseFloat(item.quantity) || 0;

          if (!timeFrameData.has(timeKey)) {
            timeFrameData.set(timeKey, { revenue: 0, quantity: 0, orders: 0 });
          }
          const timeData = timeFrameData.get(timeKey);
          timeData.revenue += amount;
          timeData.quantity += quantity;
          timeData.orders += 1;

          if (!productData.has(item.name)) {
            productData.set(item.name, { revenue: 0, quantity: 0, orders: 0 });
          }
          const prodData = productData.get(item.name);
          prodData.revenue += amount;
          prodData.quantity += quantity;
          prodData.orders += 1;
        }
      });
    });

    // Find best performing product
    let bestProduct = { name: "", revenue: 0, quantity: 0 };
    productData.forEach((data, name) => {
      if (data.revenue > bestProduct.revenue) {
        bestProduct = {
          name,
          revenue: data.revenue,
          quantity: data.quantity
        };
      }
    });

    // Prepare performance summary
    const totalRevenue = Array.from(productData.values())
      .reduce((sum, data) => sum + data.revenue, 0);
    const totalQuantity = Array.from(productData.values())
      .reduce((sum, data) => sum + data.quantity, 0);
    const totalOrders = Array.from(productData.values())
      .reduce((sum, data) => sum + data.orders, 0);
    
    setProductPerformance({
      ...productPerformance,
      summary: {
        totalRevenue,
        totalQuantity,
        averageOrderValue: totalOrders ? totalRevenue / totalOrders : 0,
        bestPerformingPeriod: getBestPerformingPeriod(timeFrameData),
        worstPerformingPeriod: getWorstPerformingPeriod(timeFrameData),
        bestPerformingProduct: bestProduct
      }
    });
  };

  const getBestPerformingPeriod = (timeFrameData) => {
    let bestPeriod = '';
    let maxRevenue = -1;
    timeFrameData.forEach((data, period) => {
      if (data.revenue > maxRevenue) {
        maxRevenue = data.revenue;
        bestPeriod = period;
      }
    });
    return formatPeriod(bestPeriod);
  };

  const getWorstPerformingPeriod = (timeFrameData) => {
    let worstPeriod = '';
    let minRevenue = Infinity;
    timeFrameData.forEach((data, period) => {
      if (data.revenue < minRevenue && data.revenue > 0) {
        minRevenue = data.revenue;
        worstPeriod = period;
      }
    });
    return formatPeriod(worstPeriod);
  };

  const formatPeriod = (period) => {
    if (selectedTimeFrame === 'monthly') {
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                         'July', 'August', 'September', 'October', 'November', 'December'];
      return monthNames[period];
    }
    return period.toString();
  };

  // Process orders data for monthly sales chart
  const processOrdersData = (orders) => {
    const monthlySales = Array(12).fill(0);

    orders.forEach((order) => {
      const orderDate = new Date(order.createdAt);
      const orderYear = orderDate.getFullYear();

      if (orderYear === selectedYear) {
        const month = orderDate.getMonth();
        const orderTotal = order.items.reduce((total, item) => {
          const price = parseFloat(item.price) || 0;
          const quantity = parseFloat(item.quantity) || 0;
          return total + price * quantity;
        }, 0);
        monthlySales[month] += orderTotal;
      }
    });

    setSalesData(monthlySales);
  };

  // Calculate top products by total amount
  const calculateTopProducts = (orders) => {
    // Create a map to store product totals
    const productTotals = new Map();

    // Process all orders and their items
    orders.forEach((order) => {
      if (!order.items || !Array.isArray(order.items)) {
        console.log("Invalid order:", order);
        return;
      }

      order.items.forEach((item) => {
        // Debug log to see item structure
        console.log("Processing item:", item);

        // Try to get product name from all possible locations
        const productName = item.product?.name || item.productName || item.name;

        if (!productName) {
          console.log("No product name found in item:", item);
          return;
        }

        const price =
          parseFloat(item.price) || parseFloat(item.product?.price) || 0;
        const quantity = parseFloat(item.quantity) || 0;
        const itemTotal = price * quantity;

        // If product exists in map, update its totals
        if (productTotals.has(productName)) {
          const product = productTotals.get(productName);
          product.totalAmount += itemTotal;
          product.totalQuantity += quantity;
          product.orders += 1;
        } else {
          // Add new product to map
          productTotals.set(productName, {
            name: productName,
            totalAmount: itemTotal,
            totalQuantity: quantity,
            unitPrice: price,
            orders: 1,
          });
        }
      });
    });

    // Debug log for product totals
    console.log("Product totals:", Array.from(productTotals.entries()));

    // Convert map to array and sort by total amount
    const sortedProducts = Array.from(productTotals.values())
      .filter((product) => product.totalAmount > 0)
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 4);

    console.log("Top products:", sortedProducts);
    setTopProducts(sortedProducts);
  };

  // Process time-based analysis
  const updateTimeFrameAnalysis = (orders) => {
    const filteredOrders = orders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      const orderYear = orderDate.getFullYear();
      const orderMonth = orderDate.getMonth();

      if (selectedTimeFrame === "monthly") {
        return orderYear === selectedYear;
      } else {
        return orderYear === selectedYear && orderMonth === selectedMonth;
      }
    });

    let timeFrameMap = new Map();
    let labels = [];
    let values = [];

    filteredOrders.forEach((order) => {
      const orderDate = new Date(order.createdAt);
      let key = "";

      switch (selectedTimeFrame) {
        case "monthly":
          key = orderDate.getMonth(); // 0-11
          break;
        case "weekly":
          // Get week number within the month
          const weekNum = Math.ceil(
            (orderDate.getDate() +
              new Date(
                orderDate.getFullYear(),
                orderDate.getMonth(),
                1
              ).getDay()) /
              7
          );
          key = `Week ${weekNum}`;
          break;
        case "daily":
          key = orderDate.getDate(); // 1-31
          break;
      }

      const orderTotal = order.items.reduce((sum, item) => {
        return (
          sum + (parseFloat(item.price) || 0) * (parseFloat(item.quantity) || 0)
        );
      }, 0);

      timeFrameMap.set(key, (timeFrameMap.get(key) || 0) + orderTotal);
    });

    if (selectedTimeFrame === "monthly") {
      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      labels = monthNames;
      values = monthNames.map((_, index) => timeFrameMap.get(index) || 0);
    } else if (selectedTimeFrame === "weekly") {
      // Generate 4-5 weeks for the selected month
      const weeksInMonth = 5;
      labels = Array.from({ length: weeksInMonth }, (_, i) => `Week ${i + 1}`);
      values = labels.map((week) => timeFrameMap.get(week) || 0);
    } else {
      // Daily - get all days in the selected month
      const daysInMonth = new Date(
        selectedYear,
        selectedMonth + 1,
        0
      ).getDate();
      labels = Array.from({ length: daysInMonth }, (_, i) => i + 1);
      values = labels.map((day) => timeFrameMap.get(day) || 0);
    }

    const nonZeroValues = values.filter((v) => v > 0);
    const average = nonZeroValues.length
      ? nonZeroValues.reduce((a, b) => a + b, 0) / nonZeroValues.length
      : 0;

    setTimeFrameData({
      labels,
      values,
      average,
      highest: Math.max(...values),
      lowest: Math.min(...nonZeroValues),
      total: values.reduce((a, b) => a + b, 0),
    });
  };

  return (
    <div className="p-0 min-h-screen">
      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* Product Performance Section */}
        <div className="p-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Product Performance</h2>
            <div className="flex items-center space-x-4">
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Products</option>
                {products.map((product, index) => (
                  <option key={index} value={product}>
                    {product}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-5 w-full">
          <div className="">
          {/* Time Frame Controls */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Sales Analysis</h2>
                <div className="flex items-center space-x-4">
                  <select
                    value={selectedTimeFrame}
                    onChange={(e) => setSelectedTimeFrame(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="weekly">Weekly</option>
                    <option value="daily">Daily</option>
                  </select>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {[...Array(5)].map((_, i) => (
                      <option key={i} value={new Date().getFullYear() - i}>
                        {new Date().getFullYear() - i}
                      </option>
                    ))}
                  </select>
                  {selectedTimeFrame !== "monthly" && (
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                      className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {[
                        "January",
                        "February",
                        "March",
                        "April",
                        "May",
                        "June",
                        "July",
                        "August",
                        "September",
                        "October",
                        "November",
                        "December",
                      ].map((month, index) => (
                        <option key={index} value={index}>
                          {month}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-lg h-[400px] relative">
                  <Bar
                    data={{
                      labels: timeFrameData.labels,
                      datasets: [
                        {
                          label: "Sales",
                          data: timeFrameData.values,
                          backgroundColor: "rgba(59, 130, 246, 0.5)",
                          borderColor: "rgb(59, 130, 246)",
                          borderWidth: 1,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false,
                        },
                        title: {
                          display: true,
                          text: "Sales Distribution",
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            callback: (value) => `GH₵${value}`,
                          },
                        },
                      },
                    }}
                  />
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <Line
                    data={{
                      labels: timeFrameData.labels,
                      datasets: [
                        {
                          label: "Sales Trend",
                          data: timeFrameData.values,
                          borderColor: "rgb(34, 197, 94)",
                          tension: 0.4,
                          fill: true,
                          backgroundColor: "rgba(34, 197, 94, 0.1)",
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          display: false,
                        },
                        title: {
                          display: true,
                          text: "Sales Trend",
                        },
                      },
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Top Products Table */}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600">Total Revenue</p>
                <h4 className="text-xl font-bold text-blue-900 mt-1">
                  GH₵{productPerformance.summary.totalRevenue.toFixed(2)}
                </h4>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600">Total Quantity</p>
                <h4 className="text-xl font-bold text-green-900 mt-1">
                  {productPerformance.summary.totalQuantity}
                </h4>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-purple-600">Average Order Value</p>
                <h4 className="text-xl font-bold text-purple-900 mt-1">
                  GH₵{productPerformance.summary.averageOrderValue.toFixed(2)}
                </h4>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-yellow-600">Best Period</p>
                <h4 className="text-xl font-bold text-yellow-900 mt-1">
                  {productPerformance.summary.bestPerformingPeriod}
                </h4>
              </div>
              <div className="bg-indigo-50 p-4 rounded-lg">
                <p className="text-sm text-indigo-600">Best Product</p>
                <h4 className="text-xl font-bold text-indigo-900 mt-1">
                  {productPerformance.summary.bestPerformingProduct.name}
                </h4>
                <p className="text-sm text-indigo-600 mt-1">
                  GH₵{productPerformance.summary.bestPerformingProduct.revenue.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h2 className="text-xl font-semibold mb-6">Top Performing Products</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Sales
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity Sold
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Orders
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {topProducts.map((product, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            GH₵{product.totalAmount.toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {product.totalQuantity}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{product.orders}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Analysis;

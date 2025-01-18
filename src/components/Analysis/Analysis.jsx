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
  const [productsInventory, setProductsInventory] = useState([]);
  const [invoiceTotal, setInvoiceTotal] = useState(0);
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
    summary: {
      totalRevenue: 0,
      totalQuantity: 0,
      averageOrderValue: 0,
      bestPerformingPeriod: "",
      worstPerformingPeriod: "",
      bestPerformingProduct: { name: "", revenue: 0, quantity: 0 },
    },
  });

  // Add 24-hour reset functionality
  useEffect(() => {
    // Function to check and reset sales data
    const checkAndResetSales = () => {
      const now = new Date();
      const lastResetTime = localStorage.getItem("lastSalesResetTime");

      if (
        !lastResetTime ||
        now - new Date(lastResetTime) >= 24 * 60 * 60 * 1000
      ) {
        // Reset sales data
        setSalesData({});
        setTimeFrameData({
          labels: [],
          values: [],
          average: 0,
          highest: 0,
          lowest: 0,
          total: 0,
        });
        setProductPerformance({
          summary: {
            totalRevenue: 0,
            totalQuantity: 0,
            averageOrderValue: 0,
            bestPerformingPeriod: "",
            worstPerformingPeriod: "",
            bestPerformingProduct: { name: "", revenue: 0, quantity: 0 },
          },
        });
        setTopProducts([]);

        // Update last reset time
        localStorage.setItem("lastSalesResetTime", now.toISOString());

        // Fetch fresh data
        const fetchData = async () => {
          try {
            const [invoicesResponse, productsResponse] = await Promise.all([
              axios.get(
                "https://temiperi-stocks-backend.onrender.com/temiperi/invoices"
              ),
              axios.get(
                "https://temiperi-stocks-backend.onrender.com/temiperi/products"
              ),
            ]);

            if (productsResponse?.data?.products) {
              setProductsInventory(productsResponse.data.products);
            }

            if (invoicesResponse?.data?.data) {
              const invoices = invoicesResponse.data.data;
              processOrdersData(invoices);
              calculateTopProducts(invoices);
              updateTimeFrameAnalysis(invoices);
              processProductPerformance(invoices);
            }
          } catch (error) {
            console.error("Error fetching data:", error);
          } finally {
            setLoading(false);
          }
        };

        fetchData();
      }
    };

    // Check on component mount
    checkAndResetSales();

    // Set up interval to check every hour
    const interval = setInterval(checkAndResetSales, 60 * 60 * 1000);

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, []);

  // Separate useEffect just for fetching products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(
          "https://temiperi-stocks-backend.onrender.com/temiperi/products"
        );
        if (response?.data?.products) {
          const products = response.data.products;
          setProductsInventory(products);
          setProductPerformance((prev) => ({
            ...prev,
            summary: {
              ...prev.summary,
              totalQuantity: products.reduce((total, product) => {
                const quantity = parseInt(product.quantity) || 0;
                return total + quantity;
              }, 0),
            },
          }));
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    fetchProducts();
  }, []); // Only run once on component mount
  // function to get the invoices and update the invoices

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const response = await axios.get(
          "https://temiperi-stocks-backend.onrender.com/temiperi/invoices"
        );
        if (response?.data?.data) {
          const invoices = response.data.data;
          const totalInvoiceAmount = invoices.reduce(
            (total, invoice) => total + invoice.totalAmount,
            0
          );
          setInvoiceTotal(totalInvoiceAmount);
        }
      } catch (error) {
        console.error("Error fetching invoices:", error);
      }
    };

    fetchInvoices();
  }, []);
  // Separate useEffect for invoices and other data
  useEffect(() => {
    const fetchInvoicesData = async () => {
      try {
        const response = await axios.get(
          "https://temiperi-stocks-backend.onrender.com/temiperi/invoices"
        );
        if (response?.data?.data) {
          const invoices = response.data.data;
          processOrdersData(invoices);
          calculateTopProducts(invoices);
          updateTimeFrameAnalysis(invoices);
          processProductPerformance(invoices);
        }
      } catch (error) {
        console.error("Error fetching invoices:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoicesData();
  }, [selectedYear, selectedMonth, selectedTimeFrame, selectedProduct]);

  // Process product performance data
  const processProductPerformance = (invoices) => {
    // Extract unique products
    const uniqueProducts = new Set();
    invoices.forEach((invoice) => {
      invoice.items.forEach((item) => uniqueProducts.add(item.description));
    });
    setProducts(Array.from(uniqueProducts));

    // Filter invoices based on selected time frame
    const filteredInvoices = invoices.filter((invoice) => {
      const invoiceDate = new Date(invoice.createdAt);
      const invoiceYear = invoiceDate.getFullYear();
      const invoiceMonth = invoiceDate.getMonth();

      if (selectedTimeFrame === "monthly") {
        return invoiceYear === selectedYear;
      } else {
        return invoiceYear === selectedYear && invoiceMonth === selectedMonth;
      }
    });

    // Process data
    const timeFrameData = new Map();
    const productData = new Map();

    filteredInvoices.forEach((invoice) => {
      const invoiceDate = new Date(invoice.createdAt);
      let timeKey = "";

      switch (selectedTimeFrame) {
        case "monthly":
          timeKey = invoiceDate.getMonth();
          break;
        case "weekly":
          const weekNum = Math.ceil(
            (invoiceDate.getDate() +
              new Date(
                invoiceDate.getFullYear(),
                invoiceDate.getMonth(),
                1
              ).getDay()) /
              7
          );
          timeKey = `Week ${weekNum}`;
          break;
        case "daily":
          timeKey = invoiceDate.getDate();
          break;
      }

      invoice.items.forEach((item) => {
        if (selectedProduct === "all" || selectedProduct === item.description) {
          const amount =
            (parseFloat(item.price) || 0) * (parseFloat(item.quantity) || 0);
          const quantity = parseFloat(item.quantity) || 0;

          if (!timeFrameData.has(timeKey)) {
            timeFrameData.set(timeKey, { revenue: 0, quantity: 0, orders: 0 });
          }
          const timeData = timeFrameData.get(timeKey);
          timeData.revenue += amount;
          timeData.quantity += quantity;
          timeData.orders += 1;

          if (!productData.has(item.description)) {
            productData.set(item.description, {
              revenue: 0,
              quantity: 0,
              orders: 0,
            });
          }
          const prodData = productData.get(item.description);
          prodData.revenue += amount;
          prodData.quantity += quantity;
          prodData.orders += 1;
        }
      });
    });

    // Find best performing product based on revenue
    let bestProduct = { name: "", revenue: 0, quantity: 0 };
    productData.forEach((data, name) => {
      if (data.revenue > bestProduct.revenue) {
        bestProduct = {
          name: name,
          revenue: data.revenue,
          quantity: data.quantity,
        };
      }
    });

    // Prepare performance summary
    const totalRevenue = Array.from(productData.values()).reduce(
      (sum, data) => sum + data.revenue,
      0
    );

    const totalOrders = Array.from(productData.values()).reduce(
      (sum, data) => sum + data.orders,
      0
    );

    setProductPerformance((prev) => ({
      ...prev,
      summary: {
        ...prev.summary,
        totalRevenue,
        averageOrderValue: totalOrders ? totalRevenue / totalOrders : 0,
        bestPerformingPeriod: getBestPerformingPeriod(timeFrameData),
        worstPerformingPeriod: getWorstPerformingPeriod(timeFrameData),
        bestPerformingProduct: bestProduct,
      },
    }));
  };

  const getBestPerformingPeriod = (timeFrameData) => {
    let bestPeriod = "";
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
    let worstPeriod = "";
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
      return monthNames[period];
    }
    return period.toString();
  };

  // Process invoices data for monthly sales chart
  const processOrdersData = (invoices) => {
    const monthlySales = Array(12).fill(0);
    const today = new Date();

    invoices.forEach((invoice) => {
      const invoiceDate = new Date(invoice.createdAt);

      // Only process invoices from today
      if (
        invoiceDate.getFullYear() === today.getFullYear() &&
        invoiceDate.getMonth() === today.getMonth() &&
        invoiceDate.getDate() === today.getDate()
      ) {
        const month = invoiceDate.getMonth();
        const invoiceTotal = invoice.items.reduce((total, item) => {
          const price = parseFloat(item.price) || 0;
          const quantity = parseFloat(item.quantity) || 0;
          return total + price * quantity;
        }, 0);
        monthlySales[month] += invoiceTotal;
      }
    });

    setSalesData(monthlySales);
  };

  // Calculate top products by total amount
  const calculateTopProducts = (invoices) => {
    const productTotals = new Map();
    const today = new Date();

    invoices.forEach((invoice) => {
      const invoiceDate = new Date(invoice.createdAt);

      // Only process invoices from today
      if (
        invoiceDate.getFullYear() === today.getFullYear() &&
        invoiceDate.getMonth() === today.getMonth() &&
        invoiceDate.getDate() === today.getDate()
      ) {
        if (!invoice.items || !Array.isArray(invoice.items)) {
          console.log("Invalid invoice:", invoice);
          return;
        }

        invoice.items.forEach((item) => {
          const productName =
            item.product?.name || item.productName || item.name;

          if (!productName) {
            return;
          }

          const price =
            parseFloat(item.price) || parseFloat(item.product?.price) || 0;
          const quantity = parseFloat(item.quantity) || 0;
          const itemTotal = price * quantity;

          if (productTotals.has(productName)) {
            const product = productTotals.get(productName);
            product.totalAmount += itemTotal;
            product.totalQuantity += quantity;
            product.orders += 1;
          } else {
            productTotals.set(productName, {
              name: productName,
              totalAmount: itemTotal,
              totalQuantity: quantity,
              unitPrice: price,
              orders: 1,
            });
          }
        });
      }
    });

    const sortedProducts = Array.from(productTotals.values())
      .filter((product) => product.totalAmount > 0)
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 4);

    setTopProducts(sortedProducts);
  };

  // Process time-based analysis
  const updateTimeFrameAnalysis = (invoices) => {
    const today = new Date();
    const filteredInvoices = invoices.filter((invoice) => {
      const invoiceDate = new Date(invoice.createdAt);

      // Only process invoices from today
      return (
        invoiceDate.getFullYear() === today.getFullYear() &&
        invoiceDate.getMonth() === today.getMonth() &&
        invoiceDate.getDate() === today.getDate()
      );
    });

    let timeFrameMap = new Map();
    let labels = [];
    let values = [];

    filteredInvoices.forEach((invoice) => {
      const invoiceDate = new Date(invoice.createdAt);
      let key = "";

      switch (selectedTimeFrame) {
        case "monthly":
          key = invoiceDate.getMonth(); // 0-11
          break;
        case "weekly":
          // Get week number within the month
          const weekNum = Math.ceil(
            (invoiceDate.getDate() +
              new Date(
                invoiceDate.getFullYear(),
                invoiceDate.getMonth(),
                1
              ).getDay()) /
              7
          );
          key = `Week ${weekNum}`;
          break;
        case "daily":
          key = invoiceDate.getDate(); // 1-31
          break;
      }

      const invoiceTotal = invoice.items.reduce((sum, item) => {
        return (
          sum + (parseFloat(item.price) || 0) * (parseFloat(item.quantity) || 0)
        );
      }, 0);

      timeFrameMap.set(key, (timeFrameMap.get(key) || 0) + invoiceTotal);
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
      highest: values.length ? Math.max(...values) : 0,
      lowest: nonZeroValues.length ? Math.min(...nonZeroValues) : 0,
      total: values.reduce((a, b) => a + b, 0),
    });
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* Header Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Sales</p>
                <h3 className="text-2xl font-bold mt-1">
                  GH₵{timeFrameData.total.toFixed(2)}
                </h3>
                <p className="text-sm text-green-600 flex items-center mt-2">
                  <BsArrowUpRight className="mr-1" />
                  +2.5% from last period
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                <MdTrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Average Sale</p>
                <h3 className="text-2xl font-bold mt-1">
                  GH₵{timeFrameData.average.toFixed(2)}
                </h3>
                <p className="text-sm text-red-600 flex items-center mt-2">
                  <BsArrowDownRight className="mr-1" />
                  -0.8% from last period
                </p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
                <MdTrendingDown className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Highest Sale</p>
                <h3 className="text-2xl font-bold mt-1">
                  GH₵{timeFrameData.highest.toFixed(2)}
                </h3>
                <p className="text-sm text-green-600 flex items-center mt-2">
                  <BsArrowUpRight className="mr-1" />
                  Peak performance
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center">
                <MdTrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Lowest Sale</p>
                <h3 className="text-2xl font-bold mt-1">
                  GH₵{timeFrameData.lowest.toFixed(2)}
                </h3>
                <p className="text-sm text-yellow-600 flex items-center mt-2">
                  <MdTrendingDown className="mr-1" />
                  Room for improvement
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-50 rounded-full flex items-center justify-center">
                <MdTrendingDown className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Product Performance Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-6">
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600">Total Revenue</p>
              <h4 className="text-xl font-bold text-blue-900 mt-1">
                GH₵{invoiceTotal.toFixed(2)}
              </h4>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600">Total Quantity</p>
              <h4 className="text-xl font-bold text-green-900 mt-1">
                {productsInventory.reduce((total, product) => {
                  const quantity = parseInt(product.quantity) || 0;
                  return total + quantity;
                }, 0)}
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
                GH₵
                {productPerformance.summary.bestPerformingProduct.revenue.toFixed(
                  2
                )}
              </p>
            </div>
          </div>
        </div>

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
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold mb-6">
            Top Performing Products
          </h2>
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
                      <div className="text-sm text-gray-900">
                        {product.orders}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analysis;

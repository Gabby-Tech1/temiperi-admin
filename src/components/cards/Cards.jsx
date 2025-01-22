import React, { useState, useEffect } from "react";
import axios from "axios";
import card from "../../assets/card-icon.png";
import arrow from "../../assets/arrow.png";
import { MdTrendingUp, MdTrendingDown } from "react-icons/md";
import { BsArrowUpRight, BsArrowDownRight } from "react-icons/bs";

const Cards = () => {
  const [salesData, setSalesData] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedTimeFrame, setSelectedTimeFrame] = useState("monthly");
  const [selectedProduct, setSelectedProduct] = useState("all");
  const [products, setProducts] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [stockTotal, setStockTotal] = useState(0);
  const [invoiceTotal, setInvoiceTotal] = useState(0);
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
        quantity: 0,
      },
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

  // Fetch invoice total
  useEffect(() => {
    const fetchInvoiceTotal = async () => {
      try {
        const response = await axios.get(
          "https://temiperi-stocks-backend.onrender.com/temiperi/invoices"
        );
        if (response.data && response.data.data) {
          const total = response.data.data.reduce(
            (sum, invoice) => sum + (invoice?.totalAmount || 0),
            0
          );
          setInvoiceTotal(total);
        }
      } catch (error) {
        console.error("Error fetching invoice total:", error);
      }
    };

    fetchInvoiceTotal();
  }, []);

  // Fetch total stocks
  useEffect(() => {
    const fetchTotalStocks = async () => {
      try {
        const response = await axios.get(
          "https://temiperi-stocks-backend.onrender.com/temiperi/products"
        );
        if (response.data && response.data.products) {
          const total = response.data.products.reduce(
            (sum, product) => sum + (product?.quantity || 0),
            0
          );
          setStockTotal(total);
        }
      } catch (error) {
        console.error("Error fetching total stocks:", error);
      }
    };

    fetchTotalStocks();
  }, []);

  // Process product performance data
  const processProductPerformance = (orders) => {
    // Extract unique products
    const uniqueProducts = new Set();
    orders.forEach((order) => {
      order.items.forEach((item) => uniqueProducts.add(item.name));
    });
    setProducts(Array.from(uniqueProducts));

    // Filter orders based on selected time frame
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

    // Process data
    const timeFrameData = new Map();
    const productData = new Map();

    filteredOrders.forEach((order) => {
      const orderDate = new Date(order.createdAt);
      let timeKey = "";

      switch (selectedTimeFrame) {
        case "monthly":
          timeKey = orderDate.getMonth();
          break;
        case "weekly":
          const weekNum = Math.ceil(
            (orderDate.getDate() +
              new Date(
                orderDate.getFullYear(),
                orderDate.getMonth(),
                1
              ).getDay()) /
              7
          );
          timeKey = `Week ${weekNum}`;
          break;
        case "daily":
          timeKey = orderDate.getDate();
          break;
      }

      order.items.forEach((item) => {
        if (selectedProduct === "all" || selectedProduct === item.name) {
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
          quantity: data.quantity,
        };
      }
    });

    // Prepare performance summary
    const totalRevenue = Array.from(productData.values()).reduce(
      (sum, data) => sum + data.revenue,
      0
    );
    const totalQuantity = Array.from(productData.values()).reduce(
      (sum, data) => sum + data.quantity,
      0
    );
    const totalOrders = Array.from(productData.values()).reduce(
      (sum, data) => sum + data.orders,
      0
    );

    setProductPerformance({
      ...productPerformance,
      summary: {
        totalRevenue,
        totalQuantity,
        averageOrderValue: totalOrders ? totalRevenue / totalOrders : 0,
        bestPerformingPeriod: getBestPerformingPeriod(timeFrameData),
        worstPerformingPeriod: getWorstPerformingPeriod(timeFrameData),
        bestPerformingProduct: bestProduct,
      },
    });
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
    <div>
      <div className="flex items-center flex-end w-[70%] gap-6 justify-end">
        {/* <div className="bg-white p-6 rounded-xl shadow-sm">
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
          </div> */}
        <div className="border-2 rounded-md p-2 w-full">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-semibold">
              GH₵{invoiceTotal.toFixed(2)}
            </h3>
            <p>Total Revenue</p>
          </div>
          <hr />
          <div className="flex items-center justify-between mt-6">
            <div className="flex items-center gap-2">
              <img src={card} alt="card" className="w-12 h-12" />
              <div className="">
                <p className="text-xs font-semibold text-gray-500 mt-4">
                  Total Stocks Available
                </p>
                <p>{stockTotal}</p>
              </div>
            </div>
            <div className="flex items-center">
              <img src={arrow} alt="arrow" className="w-8 h-8" />
              <p className="text-gary-500 text-sm">Last 24 hours</p>
            </div>
          </div>
        </div>
        <div className="border-2 rounded-md p-2 w-full">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-semibold">
              GH₵{invoiceTotal.toFixed(2)}
            </h3>
            <p>Total Revenue</p>
          </div>
          <hr />
          <div className="flex items-center justify-between mt-6">
            <div className="flex items-center gap-2">
              <img src={card} alt="card" className="w-12 h-12" />
              <div className="">
                <p className="text-xs font-semibold text-gray-500 mt-4">
                  Total Stocks Available
                </p>
                <p>{stockTotal}</p>
              </div>
            </div>
            <div className="flex items-center">
              <img src={arrow} alt="arrow" className="w-8 h-8" />
              <p className="text-gary-500 text-sm">Last 24 hours</p>
            </div>
          </div>
        </div>

        {/* <div className="bg-white p-6 rounded-xl shadow-sm">
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
          </div> */}

        {/* <div className="bg-white p-6 rounded-xl shadow-sm">
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
          </div> */}

        {/* <div className="bg-white p-6 rounded-xl shadow-sm">
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
          </div> */}
      </div>
    </div>
  );
};

export default Cards;

import React, { useState, useEffect } from "react";
import "./analysis.css";
import { Sidebar } from "../Sidebar/Sidebar";
import { NavLink } from "react-router-dom";
import { Bar, Line } from "react-chartjs-2";
import { Chart as ChartJS } from "chart.js/auto";
import axios from "axios";
import Header from "../Header/Header";
import Footer from "../Footer/Footer";

const Analysis = () => {
  const [salesData, setSalesData] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedTimeFrame, setSelectedTimeFrame] = useState('monthly'); // 'monthly', 'weekly', 'daily'
  const [topProducts, setTopProducts] = useState([]);
  const [timeFrameData, setTimeFrameData] = useState({
    labels: [],
    values: [],
    average: 0,
    highest: 0,
    lowest: 0,
    total: 0
  });

  // Fetch orders data
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get("https://temiperi-stocks-backend.onrender.com/temiperi/orders");
      if (response?.data?.data) {
        const orders = response.data.data;
        processOrdersData(orders);
        calculateTopProducts(orders);
        updateTimeFrameAnalysis(orders);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [selectedYear, selectedMonth, selectedTimeFrame]);

  // Process time-based analysis
  const updateTimeFrameAnalysis = (orders) => {
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

    let timeFrameMap = new Map();
    let labels = [];
    let values = [];

    filteredOrders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      let key = '';
      
      switch (selectedTimeFrame) {
        case 'monthly':
          key = orderDate.getMonth(); // 0-11
          break;
        case 'weekly':
          // Get week number within the month
          const weekNum = Math.ceil((orderDate.getDate() + 
            new Date(orderDate.getFullYear(), orderDate.getMonth(), 1).getDay()) / 7);
          key = `Week ${weekNum}`;
          break;
        case 'daily':
          key = orderDate.getDate(); // 1-31
          break;
      }

      const orderTotal = order.items.reduce((sum, item) => {
        return sum + (parseFloat(item.price) || 0) * (parseFloat(item.quantity) || 0);
      }, 0);

      timeFrameMap.set(key, (timeFrameMap.get(key) || 0) + orderTotal);
    });

    if (selectedTimeFrame === 'monthly') {
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                         'July', 'August', 'September', 'October', 'November', 'December'];
      labels = monthNames;
      values = monthNames.map((_, index) => timeFrameMap.get(index) || 0);
    } else if (selectedTimeFrame === 'weekly') {
      // Generate 4-5 weeks for the selected month
      const weeksInMonth = 5;
      labels = Array.from({length: weeksInMonth}, (_, i) => `Week ${i + 1}`);
      values = labels.map(week => timeFrameMap.get(week) || 0);
    } else {
      // Daily - get all days in the selected month
      const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      labels = Array.from({length: daysInMonth}, (_, i) => i + 1);
      values = labels.map(day => timeFrameMap.get(day) || 0);
    }

    const nonZeroValues = values.filter(v => v > 0);
    const average = nonZeroValues.length ? 
      nonZeroValues.reduce((a, b) => a + b, 0) / nonZeroValues.length : 0;

    setTimeFrameData({
      labels,
      values,
      average,
      highest: Math.max(...values),
      lowest: Math.min(...nonZeroValues),
      total: values.reduce((a, b) => a + b, 0)
    });
  };

  // Calculate top products by total amount
  const calculateTopProducts = (orders) => {
    // Create a map to store product totals
    const productTotals = new Map();

    // Process all orders and their items
    orders.forEach(order => {
      if (!order.items || !Array.isArray(order.items)) {
        console.log('Invalid order:', order);
        return;
      }

      order.items.forEach(item => {
        // Debug log to see item structure
        console.log('Processing item:', item);

        // Try to get product name from all possible locations
        const productName = item.product?.name || item.productName || item.name;
        
        if (!productName) {
          console.log('No product name found in item:', item);
          return;
        }

        const price = parseFloat(item.price) || parseFloat(item.product?.price) || 0;
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
            orders: 1
          });
        }
      });
    });

    // Debug log for product totals
    console.log('Product totals:', Array.from(productTotals.entries()));

    // Convert map to array and sort by total amount
    const sortedProducts = Array.from(productTotals.values())
      .filter(product => product.totalAmount > 0)
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 4);

    console.log('Top products:', sortedProducts);
    setTopProducts(sortedProducts);
  };

  // Process orders data for monthly sales chart
  const processOrdersData = (orders) => {
    const monthlySales = Array(12).fill(0);

    orders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      const orderYear = orderDate.getFullYear();
      
      if (orderYear === selectedYear) {
        const month = orderDate.getMonth();
        const orderTotal = order.items.reduce((total, item) => {
          const price = parseFloat(item.price) || 0;
          const quantity = parseFloat(item.quantity) || 0;
          return total + (price * quantity);
        }, 0);
        monthlySales[month] += orderTotal;
      }
    });

    setSalesData(monthlySales);
  };

  const TimeFrameChart = () => {
    const data = {
      labels: timeFrameData.labels,
      datasets: [{
        label: `Sales (GH₵) - ${selectedTimeFrame.charAt(0).toUpperCase() + selectedTimeFrame.slice(1)}`,
        data: timeFrameData.values,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
        tension: 0.4
      }]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        },
        tooltip: {
          callbacks: {
            label: (context) => `GH₵ ${context.raw.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Sales in Cedis (GH₵)'
          },
          ticks: {
            callback: (value) => `GH₵ ${value.toLocaleString()}`
          }
        }
      }
    };

    return (
      <div style={{ width: '100%', height: '400px' }}>
        {selectedTimeFrame === 'monthly' ? 
          <Bar data={data} options={options} /> :
          <Line data={data} options={options} />
        }
      </div>
    );
  };

  const MyBarChart = () => {
    const data = {
      labels: [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ],
      datasets: [
        {
          label: `Sales (GH₵) - ${selectedYear}`,
          data: salesData,
          backgroundColor: "rgba(75, 192, 192, 0.6)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 1,
        },
      ],
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top",
        },
        tooltip: {
          enabled: true,
          callbacks: {
            label: (context) => {
              return `GH₵ ${context.raw.toLocaleString()}`;
            }
          }
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Sales in Cedis (GH₵)",
          },
          ticks: {
            callback: (value) => `GH₵ ${value.toLocaleString()}`
          }
        },
        x: {
          title: {
            display: true,
            text: "Months",
          },
        },
      },
    };

    return (
      <div style={{ width: "600px", height: "400px" }}>
        <Bar data={data} options={options} />
      </div>
    );
  };

  return (
    <div className="mt-10">
      <h2>Sales Analysis</h2>

      <div className="container">
        <Sidebar />

        <div className="div">
          <div className="analysis-controls">
            <div className="time-frame-selector">
              <label>
                View By:
                <select 
                  value={selectedTimeFrame}
                  onChange={(e) => setSelectedTimeFrame(e.target.value)}
                >
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                  <option value="daily">Daily</option>
                </select>
              </label>

              <label>
                Year:
                <select 
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                >
                  {[2023, 2024, 2025].map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </label>

              {selectedTimeFrame !== 'monthly' && (
                <label>
                  Month:
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  >
                    {['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'
                    ].map((month, index) => (
                      <option key={index} value={index}>{month}</option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          </div>

          <div className="chart_container">
            {loading ? (
              <div>Loading sales data...</div>
            ) : (
              <>
                <div className="sales-summary">
                  <div className="summary-card">
                    <h4>Total Sales</h4>
                    <p>GH₵ {timeFrameData.total.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}</p>
                  </div>
                  <div className="summary-card">
                    <h4>Average Sales</h4>
                    <p>GH₵ {timeFrameData.average.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}</p>
                  </div>
                  <div className="summary-card">
                    <h4>Highest Sales</h4>
                    <p>GH₵ {timeFrameData.highest.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}</p>
                  </div>
                  <div className="summary-card">
                    <h4>Lowest Sales</h4>
                    <p>GH₵ {timeFrameData.lowest.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}</p>
                  </div>
                </div>

                <div className="myChart">
                  <TimeFrameChart />
                </div>

                <div className="best_performing_product">
                  <h4>Top Selling Products</h4>
                  <div className="best_products">
                    {topProducts && topProducts.length > 0 ? (
                      topProducts.map((product, index) => (
                        <div key={index} className="products_details">
                          <p className="product-name" style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                            {index + 1}. {product.name || 'Unknown Product'}
                          </p>
                          <small className="total-amount">
                            Total Revenue: GH₵ {product.totalAmount.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                          </small>
                          <small className="quantity">Total Quantity Sold: {product.totalQuantity}</small>
                          <small className="orders">Number of Orders: {product.orders}</small>
                        </div>
                      ))
                    ) : (
                      <div>No products found</div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="btn report">
            <NavLink to={"/report"}>
              <button>Write Report</button>
            </NavLink>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analysis;

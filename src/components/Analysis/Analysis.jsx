import React, { useState, useEffect } from "react";
import "./analysis.css";
import { Sidebar } from "../Sidebar/Sidebar";
import { NavLink } from "react-router-dom";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS } from "chart.js/auto";
import axios from "axios";
import Header from "../Header/Header";
import Footer from "../Footer/Footer";

const Analysis = () => {
  const [salesData, setSalesData] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [topProducts, setTopProducts] = useState([]);

  // Fetch orders data
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get("https://temiperi-stocks-backend.onrender.com/temiperi/orders");
      if (response?.data?.data) {
        const orders = response.data.data;
        processOrdersData(orders);
        calculateTopProducts(orders);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
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

  useEffect(() => {
    fetchOrders();
  }, [selectedYear]);

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
      <h2>Performance Analysis</h2>

      <div className="container">
        <Sidebar />

        <div className="div">
          <div className="filer">
            <div className="product_filter_container">
              <label>
                Year
                <select 
                  value={selectedYear} 
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                >
                  {[2023, 2024, 2025].map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="chart_container">
            {loading ? (
              <div>Loading sales data...</div>
            ) : (
              <>
                <div className="myChart">
                  <MyBarChart />
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
                          <small className="unit-price">
                            Unit Price: GH₵ {product.unitPrice.toLocaleString(undefined, {
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

import React, { useState, useEffect } from 'react';
// import { Sidebar } from '../Sidebar/Sidebar';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import axios from 'axios';
import './summary.css';

const Summary = () => {
  const [loading, setLoading] = useState(true);
  const [selectedTimeFrame, setSelectedTimeFrame] = useState('monthly');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedProduct, setSelectedProduct] = useState('all');
  const [products, setProducts] = useState([]);
  const [productPerformance, setProductPerformance] = useState({
    timeLabels: [],
    datasets: [],
    summary: {
      totalRevenue: 0,
      totalQuantity: 0,
      averageOrderValue: 0,
      bestPerformingPeriod: '',
      worstPerformingPeriod: ''
    }
  });

  // Fetch orders data
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get("https://temiperi-stocks-backend.onrender.com/temiperi/orders");
      if (response?.data?.data) {
        processOrdersData(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [selectedTimeFrame, selectedYear, selectedMonth, selectedProduct]);

  const processOrdersData = (orders) => {
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

    // Process data based on time frame
    const timeFrameData = new Map();
    const productData = new Map();

    filteredOrders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      let timeKey = '';

      // Generate time key based on selected time frame
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

      // Process each item in the order
      order.items.forEach(item => {
        if (selectedProduct === 'all' || selectedProduct === item.name) {
          const amount = (parseFloat(item.price) || 0) * (parseFloat(item.quantity) || 0);
          const quantity = parseFloat(item.quantity) || 0;

          // Update time-based data
          if (!timeFrameData.has(timeKey)) {
            timeFrameData.set(timeKey, { revenue: 0, quantity: 0, orders: 0 });
          }
          const timeData = timeFrameData.get(timeKey);
          timeData.revenue += amount;
          timeData.quantity += quantity;
          timeData.orders += 1;

          // Update product-based data
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

    // Prepare chart data
    let timeLabels = [];
    let datasets = [];

    if (selectedTimeFrame === 'monthly') {
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                         'July', 'August', 'September', 'October', 'November', 'December'];
      timeLabels = monthNames;
      const revenueData = monthNames.map((_, index) => 
        timeFrameData.get(index)?.revenue || 0
      );
      const quantityData = monthNames.map((_, index) => 
        timeFrameData.get(index)?.quantity || 0
      );
      datasets = [
        {
          label: 'Revenue (GH₵)',
          data: revenueData,
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          yAxisID: 'y'
        },
        {
          label: 'Quantity Sold',
          data: quantityData,
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          yAxisID: 'y1'
        }
      ];
    } else if (selectedTimeFrame === 'weekly') {
      const weeksInMonth = 5;
      timeLabels = Array.from({length: weeksInMonth}, (_, i) => `Week ${i + 1}`);
      const revenueData = timeLabels.map(week => 
        timeFrameData.get(week)?.revenue || 0
      );
      const quantityData = timeLabels.map(week => 
        timeFrameData.get(week)?.quantity || 0
      );
      datasets = [
        {
          label: 'Revenue (GH₵)',
          data: revenueData,
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          yAxisID: 'y'
        },
        {
          label: 'Quantity Sold',
          data: quantityData,
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          yAxisID: 'y1'
        }
      ];
    } else {
      const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      timeLabels = Array.from({length: daysInMonth}, (_, i) => i + 1);
      const revenueData = timeLabels.map(day => 
        timeFrameData.get(day)?.revenue || 0
      );
      const quantityData = timeLabels.map(day => 
        timeFrameData.get(day)?.quantity || 0
      );
      datasets = [
        {
          label: 'Revenue (GH₵)',
          data: revenueData,
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          yAxisID: 'y'
        },
        {
          label: 'Quantity Sold',
          data: quantityData,
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          yAxisID: 'y1'
        }
      ];
    }

    // Calculate summary statistics
    const totalRevenue = Array.from(productData.values())
      .reduce((sum, data) => sum + data.revenue, 0);
    const totalQuantity = Array.from(productData.values())
      .reduce((sum, data) => sum + data.quantity, 0);
    const totalOrders = Array.from(productData.values())
      .reduce((sum, data) => sum + data.orders, 0);

    const timeFrameEntries = Array.from(timeFrameData.entries());
    const bestPerformingPeriod = timeFrameEntries.reduce((best, current) => 
      !best || current[1].revenue > best[1].revenue ? current : best
    );
    const worstPerformingPeriod = timeFrameEntries.reduce((worst, current) => 
      !worst || current[1].revenue < worst[1].revenue ? current : worst
    );

    setProductPerformance({
      timeLabels,
      datasets,
      summary: {
        totalRevenue,
        totalQuantity,
        averageOrderValue: totalOrders ? totalRevenue / totalOrders : 0,
        bestPerformingPeriod: bestPerformingPeriod ? bestPerformingPeriod[0].toString() : '',
        worstPerformingPeriod: worstPerformingPeriod ? worstPerformingPeriod[0].toString() : ''
      }
    });
  };

  const TimeSeriesChart = () => {
    const options = {
      responsive: true,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: `Product Performance Over Time (${selectedTimeFrame})`
        }
      },
      scales: {
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: {
            display: true,
            text: 'Revenue (GH₵)'
          }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          title: {
            display: true,
            text: 'Quantity Sold'
          },
          grid: {
            drawOnChartArea: false
          }
        }
      }
    };

    const data = {
      labels: productPerformance.timeLabels,
      datasets: productPerformance.datasets
    };

    return (
      <div className="chart-container">
        {selectedTimeFrame === 'monthly' ? 
          <Bar data={data} options={options} /> :
          <Line data={data} options={options} />
        }
      </div>
    );
  };

  return (
    <div className="summary-container w-full">
      {/* <Sidebar /> */}
      
      <div className="summary-content">
        {/* <h2>Product Performance Summary</h2> */}

        <div className="controls-section">
          <div className="time-controls">
            <select 
              value={selectedTimeFrame}
              onChange={(e) => setSelectedTimeFrame(e.target.value)}
              className="select-control"
            >
              <option value="monthly">Monthly View</option>
              <option value="weekly">Weekly View</option>
              <option value="daily">Daily View</option>
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="select-control"
            >
              {[2023, 2024, 2025].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>

            {selectedTimeFrame !== 'monthly' && (
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="select-control"
              >
                {['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'
                ].map((month, index) => (
                  <option key={index} value={index}>{month}</option>
                ))}
              </select>
            )}

            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="select-control"
            >
              <option value="all">All Products</option>
              {products.map((product, index) => (
                <option key={index} value={product}>{product}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading performance data...</div>
        ) : (
          <>
            <div className="grid grid-cols-5 gap-4">
              <div className="stat-card">
                <h3>Total Revenue</h3>
                <p>GH₵ {productPerformance.summary.totalRevenue.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}</p>
              </div>
              <div className="stat-card">
                <h3>Total Quantity Sold</h3>
                <p>{productPerformance.summary.totalQuantity.toLocaleString()}</p>
              </div>
              <div className="stat-card">
                <h3>Average Order Value</h3>
                <p>GH₵ {productPerformance.summary.averageOrderValue.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}</p>
              </div>
              <div className="stat-card">
                <h3>Best Performing Period</h3>
                <p>{productPerformance.summary.bestPerformingPeriod}</p>
              </div>
              <div className="stat-card">
                <h3>Worst Performing Period</h3>
                <p>{productPerformance.summary.worstPerformingPeriod}</p>
              </div>
            </div>

            <div className="chart-section">
              <TimeSeriesChart />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Summary;

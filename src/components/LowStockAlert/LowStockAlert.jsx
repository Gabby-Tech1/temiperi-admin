import React, { useState, useEffect } from "react";
import axios from "axios";

const LowStockAlert = () => {
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLowStockProducts = async () => {
      try {
        const response = await axios.get(
          "https://temiperi-stocks-backend.onrender.com/temiperi/products"
        );
        const productsData = response?.data?.products || [];
        const lowStock = productsData.filter(
          (product) => product.quantity < 10
        );
        setLowStockProducts(lowStock);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching low stock products:", error);
        setLoading(false);
      }
    };

    fetchLowStockProducts();
    // Set up an interval to check every 5 minutes
    const interval = setInterval(fetchLowStockProducts, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return null; // Don't show anything while loading
  }

  if (lowStockProducts.length === 0) {
    return null; // Don't show anything if no low stock products
  }

  return (
    <div className="mb-4 bg-red-50 rounded-lg shadow-sm border border-red-200">
      <div className="flex justify-between items-center p-3 border-b border-red-100">
        <h3 className="text-lg font-semibold text-red-700">Low Stock Alert!</h3>
        <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
          {lowStockProducts.length} items
        </span>
      </div>
      <div className="p-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {lowStockProducts.map((product) => (
            <div
              key={product._id}
              className="bg-white rounded border border-red-100 p-2"
            >
              <div className="font-medium text-red-600">{product.name}</div>
              <div className="text-sm text-gray-600">
                Quantity remaining:{" "}
                <span className="font-bold text-red-500">
                  {product.quantity}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                Category: {product.category}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LowStockAlert;

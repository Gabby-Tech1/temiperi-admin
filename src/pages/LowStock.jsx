import React, { useState, useEffect } from 'react';
import axios from 'axios';

const LowStock = () => {
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLowStockProducts = async () => {
      try {
        const response = await axios.get(
          "https://temiperi-stocks-backend.onrender.com/temiperi/products"
        );
        const productsData = response?.data?.products || [];
        const lowStock = productsData.filter(product => product.quantity < 10);
        setLowStockProducts(lowStock);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching low stock products:', error);
        setLoading(false);
      }
    };

    fetchLowStockProducts();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (lowStockProducts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-xl text-gray-600">No Low Stock Items</div>
        <p className="text-gray-500 mt-2">All products have sufficient quantity.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Low Stock Products</h1>
        <span className="bg-red-100 text-red-800 text-sm font-medium px-3 py-1 rounded-full">
          {lowStockProducts.length} items need attention
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {lowStockProducts.map((product) => (
          <div key={product._id} className="bg-white rounded-lg shadow-sm border border-red-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <div className="font-medium text-lg text-gray-800">{product.name}</div>
              <div className="bg-red-50 text-red-700 text-sm font-medium px-2 py-1 rounded">
                {product.quantity} left
              </div>
            </div>
            <div className="text-sm text-gray-600 mb-2">
              Category: {product.category}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  Status: <span className="text-red-600 font-medium">Low Stock</span>
                </div>
                <button 
                  onClick={() => window.location.href = '/product'} 
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View Details →
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LowStock;

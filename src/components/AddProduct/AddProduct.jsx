import React, { useState, useEffect } from "react";
import "./addproduct.css";
import { Sidebar } from "../Sidebar/Sidebar";
import Orders from "../Orders/Orders";
import Header from "../Header/Header";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AddProduct = () => {
  // Determine base URL dynamically
  const devUrl = "http://localhost:4000/temiperi/products";
  const prodUrl =
    "https://temiperi-stocks-backend.onrender.com/temiperi/products";
  const baseUrl = window.location.hostname === "localhost" ? devUrl : prodUrl;

  // State for form fields
  const [productData, setProductData] = useState({
    name: "",
    category: "",
    price: {
      retail_price: "",
      whole_sale_price: "",
    },
    quantity: "",
  });

  // Add state for existing product
  const [existingProduct, setExistingProduct] = useState(null);

  // Handle Input Change
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "retail_price" || name === "whole_sale_price") {
      setProductData((prev) => ({
        ...prev,
        price: { ...prev.price, [name]: Number(value) },
      }));
    } else {
      setProductData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Check for existing product when name changes
  useEffect(() => {
    const checkExistingProduct = async () => {
      if (productData.name) {
        try {
          const response = await axios.get(
            "https://temiperi-stocks-backend.onrender.com/temiperi/products"
          );
          const found = response.data.products.find(
            (product) =>
              product.name.toLowerCase() === productData.name.toLowerCase()
          );

          if (found) {
            setExistingProduct(found);
            setProductData((prev) => ({
              ...prev,
              category: found.category,
              price: {
                retail_price: found.price.retail_price,
                whole_sale_price: found.price.whole_sale_price,
              },
            }));
          } else {
            setExistingProduct(null);
          }
        } catch (error) {
          console.error("Error checking for existing product:", error);
        }
      }
    };

    const timeoutId = setTimeout(checkExistingProduct, 500); // Debounce the API call
    return () => clearTimeout(timeoutId);
  }, [productData.name]);

  // Submit Form
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (existingProduct) {
        const updatedQuantity =
          parseInt(existingProduct.quantity) + parseInt(productData.quantity);
        await axios.patch(
          `https://temiperi-stocks-backend.onrender.com/temiperi/products/?id=${existingProduct._id}`,
          {
            ...existingProduct,
            quantity: updatedQuantity,
          }
        );
        toast.success("Product quantity updated successfully!");
      } else {
        await axios.post(
          "https://temiperi-stocks-backend.onrender.com/temiperi/products",
          productData
        );
        toast.success("New product added successfully!");
      }

      setProductData({
        name: "",
        category: "",
        price: {
          retail_price: "",
          whole_sale_price: "",
        },
        quantity: "",
      });
      setExistingProduct(null);
    } catch (error) {
      console.error("Error managing product:", error);
      toast.error(error.response?.data?.message || "Failed to manage product!");
    }
  };

  return (
    <>
      <ToastContainer />
      {/* <Header /> */}
      <div className="w-full">
        <div className="p-4">
          
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">
              <div className="flex gap-2 flex-col">
                <label className="block text-sm font-medium text-gray-700 ">
                  Category
                </label>
                <select
                  name="category"
                  value={productData.category}
                  onChange={handleInputChange}
                  disabled={existingProduct}
                  className="w-full px-3 py-2 border border-gray-500 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  <option value="">Select Category</option>
                  <option value="ABL">ABL</option>
                  <option value="Water">Water</option>
                  <option value="Pet Drinks">Pet Drinks</option>
                  <option value="Guinness">Guinness</option>
                </select>
              </div>

              <div className="">
                <label className="block text-sm font-medium text-gray-700 ">
                  Product Name
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter product name"
                  value={productData.name}
                  onChange={handleInputChange}
                  disabled={existingProduct}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>

              <div className="">
                <label className="block text-sm font-medium text-gray-700 ">
                  Retail Price (GH₵)
                </label>
                <input
                  type="number"
                  name="retail_price"
                  placeholder="0.00"
                  value={productData.price.retail_price}
                  onChange={handleInputChange}
                  disabled={existingProduct}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>

              <div className="">
                <label className="block text-sm font-medium text-gray-700 ">
                  Wholesale Price (GH₵)
                </label>
                <input
                  type="number"
                  name="whole_sale_price"
                  placeholder="0.00"
                  value={productData.price.whole_sale_price}
                  onChange={handleInputChange}
                  disabled={existingProduct}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>

              <div className="">
                <label className="block text-sm font-medium text-gray-700 ">
                  Quantity
                </label>
                <input
                  type="number"
                  name="quantity"
                  placeholder="Enter quantity"
                  value={productData.quantity}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-blue text-white rounded-md hover:bg-opacity-90 transition-colors"
                >
                  {existingProduct ? "Update Quantity" : "Add Product"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Display Recently Added Products */}
        <table>
          <caption>Recently Added Products</caption>
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Category</th>
              <th>Retail Price</th>
              <th>Wholesale Price</th>
              <th>Quantity</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{productData.name}</td>
              <td>{productData.category}</td>
              <td>{productData.price.retail_price}</td>
              <td>{productData.price.whole_sale_price}</td>
              <td>{productData.quantity}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
};

export default AddProduct;

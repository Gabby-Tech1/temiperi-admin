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
            toast.info(
              "Product exists - prices auto-filled and quantity will be added to existing stock"
            );
          } else {
            setExistingProduct(null);
          }
        } catch (error) {
          console.error("Error checking for existing product:", error);
          toast.error("Error checking for existing product");
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
      <div>
        {/* <Orders url={baseUrl} /> */}

        <h2>Add New Products</h2>
        <p>Please enter the product details in the table below</p>
        <div className="addproduct_container">
          <form className="addproduct" onSubmit={handleSubmit}>
            <label>
              Category
              <select
                name="category"
                value={productData.category}
                onChange={handleInputChange}
                disabled={existingProduct}
              >
                <option value="">Select Category</option>
                <option value="ABL">ABL</option>
                <option value="Water">Water</option>
                <option value="Pet Drinks">Pet Drinks</option>
                <option value="Guinness">Guinness</option>
              </select>
            </label>
            <label>
              Product Name
              <input
                type="text"
                name="name"
                placeholder="Alvaro"
                value={productData.name}
                onChange={handleInputChange}
                disabled={existingProduct}
              />
            </label>
            <label>
              Retail Price
              <input
                type="number"
                name="retail_price"
                placeholder="Retail Price"
                value={productData.price.retail_price}
                onChange={handleInputChange}
                disabled={existingProduct}
              />
            </label>
            <label>
              Wholesale Price
              <input
                type="number"
                name="whole_sale_price"
                placeholder="Wholesale Price"
                value={productData.price.whole_sale_price}
                onChange={handleInputChange}
                disabled={existingProduct}
              />
            </label>
            <label>
              Quantity
              <input
                type="number"
                name="quantity"
                placeholder="Quantity"
                value={productData.quantity}
                onChange={handleInputChange}
              />
            </label>
            <div className="btn">
              <button type="submit">
                {existingProduct ? "Update Quantity" : "Add Product"}
              </button>
            </div>
          </form>
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

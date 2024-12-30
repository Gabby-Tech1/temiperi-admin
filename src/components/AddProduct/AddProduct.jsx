import React, { useState } from "react";
import "./addproduct.css";
import { Sidebar } from "../Sidebar/Sidebar";
import Orders from "../Orders/Orders";
import Header from "../Header/Header";
import axios from "axios";

const AddProduct = () => {
  // Determine base URL dynamically
  const devUrl = "http://localhost:4000/temiperi/products";
  const prodUrl = "https://temiperi-backend.onrender.com/temiperi/products";
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

  // Submit Form
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(baseUrl, productData);
      alert("Product added successfully!");
      console.log(response.data);
    } catch (error) {
      console.error("Error adding product:", error);
      alert("Failed to add product!");
    }
  };

  return (
    <>
      {/* <Header /> */}
      <div>
        <Orders url={baseUrl} />

        <h2>Add New Products</h2>
        <p>Please enter the product details in the table below</p>
        <div className="addproduct_container">
          <Sidebar />
          <form className="addproduct" onSubmit={handleSubmit}>
            <label>
              Category
              <select
                name="category"
                value={productData.category}
                onChange={handleInputChange}
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
              <button type="submit">Add Product</button>
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

import React, { useState, useEffect } from "react";
import "./stock.css";
import axios from "axios";

const Stocks = ({
  category,
  name,
  wholesale_price,
  sizes,
  retails_price,
  quantity,
}) => {
  const [stock, setStock] = useState([]);
  useEffect(() => {
    const fetchProducts = async () => {
      const response = await axios.get(
        "https://temiperi-stocks-backend.onrender.com/temiperi/products"
      );
      console.log(response.data);
      const stock = await response.data;
      console.log(stock);
      setStock(stock);
    };
    fetchProducts();
  }, []);

  return (
    <div className="list add flex_col">
      <div className="product_table">
        <div className="product_table_format title">
          <b>Category</b>
          <b>Name</b>
          <b>Wholesale Price</b>
          <b>Retails Price</b>
          <b>Quantity</b>
          <b>Size</b>
        </div>

        <div className="product_table_format">
          <p>{category}</p>
          <p>{name}</p>
          <p>{wholesale_price}</p>
          <p>{retails_price}</p>
          <p>{quantity}</p>
          <p>{sizes}</p>
        </div>
      </div>
    </div>
  );
};

export default Stocks;

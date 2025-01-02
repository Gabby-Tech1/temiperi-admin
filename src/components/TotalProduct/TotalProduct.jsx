import { useState, useEffect } from "react";
import axios from "axios";
import { asset } from "../../assets/assets";
import { useOrderContext } from "../../context/OrderContext";

const TotalProduct = () => {
  const [totalProducts, setTotalProducts] = useState(0);
  const devUrl = "http://localhost:4000/temiperi";
  const prodUrl = "https://temiperi-stocks-backend.onrender.com/temiperi";
  const baseUrl = window.location.hostname === "localhost" ? devUrl : prodUrl;
  const { refreshTrigger } = useOrderContext();

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${prodUrl}/products`);
      const products = response?.data?.products || [];

      // Calculate total product quantity correctly
      const totalQuantity = products.reduce((total, product) => {
        return total + (product?.quantity || 0);
      }, 0);

      setTotalProducts(totalQuantity);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [refreshTrigger]);

  return (
    <div>
      <div className="card" id="purchase">
        <img src={asset.purchase} alt="" />
        <div className="total_sales">
          <div>
            <h3>Total Stock</h3>
            <p>{totalProducts}</p>
          </div>

          <div className="sales_percent">
            <p>Total Stock Available</p>
            <div className="percent">
              <h4>{totalProducts}</h4>
            </div>
          </div>
        </div>
        <small>Last 24 hours</small>
      </div>
    </div>
  );
};

export default TotalProduct;

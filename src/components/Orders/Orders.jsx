import { useEffect, useState } from "react";
import "./order.css";
import axios from "axios";

const Orders = ({ url }) => {
  const [orderList, setOrderList] = useState([]);

  // Fetch orders from API
  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${url}/orders`);
      if (response.data) {
        setOrderList(response.data.data);
        console.log("Orders fetched successfully");
      } else {
        console.log("No orders found");
      }
    } catch (error) {
      console.error("Error fetching orders: ", error);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="table_container">
      <h2 className="font-bold">Recent Orders</h2>

      <div className="overflow-x-auto">
        <table className="table table-xs">
          <thead>
            <tr>
              <th>Invoice Number</th>
              <th>Customer Name</th>
              <th>Order Date</th>
              <th>Items</th>
              <th>Total Price</th>
            </tr>
          </thead>
          <tbody>
            {orderList?.map((order) => (
              <tr key={order._id}>
                <td>{order.invoiceNumber}</td>
                <td>{order.customerName}</td>
                <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                <td>
                  <ul>
                    {order.items.map((item, index) => (
                      <li key={index}>
                        {item.quantity} x {item.description || "N/A"} @ $
                        {item.price}
                      </li>
                    ))}
                  </ul>
                </td>
                <td>
                  $
                  {order.items.reduce(
                    (total, item) => total + item.quantity * item.price,
                    0
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Orders;

import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const OrderContext = createContext();

export const OrderProvider = ({ children }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [newOrdersCount, setNewOrdersCount] = useState(() => {
    const savedCount = localStorage.getItem('newOrdersCount');
    return savedCount ? parseInt(savedCount) : 0;
  });
  const [lastCheckedTimestamp, setLastCheckedTimestamp] = useState(() => {
    const savedTimestamp = localStorage.getItem('lastCheckedTimestamp');
    return savedTimestamp ? parseInt(savedTimestamp) : Date.now();
  });
  const [previousOrders, setPreviousOrders] = useState(() => {
    const savedOrders = localStorage.getItem('previousOrders');
    return savedOrders ? JSON.parse(savedOrders) : [];
  });

  const triggerRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const checkForNewOrders = async () => {
    try {
      const response = await axios.get(
        "https://temiperi-stocks-backend.onrender.com/temiperi/orders"
      );
      if (response?.data?.data) {
        const currentOrders = response.data.data;
        
        // If this is the first time loading orders
        if (previousOrders.length === 0) {
          setPreviousOrders(currentOrders);
          localStorage.setItem('previousOrders', JSON.stringify(currentOrders));
          return;
        }

        // Find new orders by comparing with previous orders
        const newOrders = currentOrders.filter(currentOrder => 
          !previousOrders.some(prevOrder => prevOrder._id === currentOrder._id)
        );

        if (newOrders.length > 0) {
          console.log('New orders detected:', newOrders.length);
          const updatedCount = newOrdersCount + newOrders.length;
          setNewOrdersCount(updatedCount);
          localStorage.setItem('newOrdersCount', updatedCount.toString());
          setPreviousOrders(currentOrders);
          localStorage.setItem('previousOrders', JSON.stringify(currentOrders));
        }
      }
    } catch (error) {
      console.error("Error checking for new orders:", error);
    }
  };

  const resetNotifications = () => {
    setNewOrdersCount(0);
    localStorage.setItem('newOrdersCount', '0');
    const currentTime = Date.now();
    setLastCheckedTimestamp(currentTime);
    localStorage.setItem('lastCheckedTimestamp', currentTime.toString());
  };

  // Check for new orders every 10 seconds
  useEffect(() => {
    const interval = setInterval(checkForNewOrders, 10000);
    return () => clearInterval(interval);
  }, [previousOrders, newOrdersCount]);

  // Initial check for new orders
  useEffect(() => {
    checkForNewOrders();
  }, []);

  return (
    <OrderContext.Provider 
      value={{ 
        refreshTrigger, 
        triggerRefresh, 
        newOrdersCount,
        resetNotifications
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrderContext = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error("useOrderContext must be used within an OrderProvider");
  }
  return context;
};

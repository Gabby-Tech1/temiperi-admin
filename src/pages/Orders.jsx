import React, { useState } from 'react'
import OrderCard from '../components/cards/OrderCard'
import Orders from '../components/Orders/Orders'
// import orders from '../components/Products/Products'
// import Analysis from '../components/Analysis/Analysis'
// import Summary from '../components/Summary/Summary'
// import AddProduct from '../components/AddProduct/AddProduct'

const Order = () => {
  const [activeTab, setActiveTab] = useState('orders')

  const renderComponent = () => {
    switch (activeTab) {
      case 'orders':
        return <Orders />
      default:
        return null
    }
  }

  return (
    <div className='w-full h-screen'>
      <div className="min-w-[1024px] px-6 flex flex-col gap-10"> {/* Minimum width to prevent content squishing */}
        <div className="mb-6">
          <OrderCard />
        </div>
        
      <div className="px-2">
          {/* Navigation Links */}
          <div className="flex justify-between w-full border-b pb-2 text-black font-semibold">
            <div 
              onClick={() => setActiveTab('orders')}
              className={`cursor-pointer ${activeTab === 'orders' ? 'underline text-blue' : ''}`}
            >
              Orders
            </div>
          </div>

          {/* Component Render Area */}
          <div className="">
            {renderComponent()}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Order
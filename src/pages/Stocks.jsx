import React, { useState } from 'react'
import Cards from '../components/cards/Cards'
import Products from '../components/Products/Products'
import Analysis from '../components/Analysis/Analysis'
import Summary from '../components/Summary/Summary'
import AddProduct from '../components/AddProduct/AddProduct'

const Stocks = () => {
  const [activeTab, setActiveTab] = useState('products')

  const renderComponent = () => {
    switch (activeTab) {
      case 'products':
        return <Products />
      case 'analysis':
        return <Analysis />
      case 'summary':
        return <Summary />
      case 'addProducts':
        return <AddProduct />
      default:
        return null
    }
  }

  return (
    <div className='w-full h-screen'>
      <div className="min-w-[1024px] px-6 flex flex-col gap-10"> {/* Minimum width to prevent content squishing */}
        <div className="mb-6">
          <Cards />
        </div>
        
      <div className="px-2">
          {/* Navigation Links */}
          <div className="flex justify-between w-full border-b pb-2 text-black font-semibold">
            <div 
              onClick={() => setActiveTab('products')}
              className={`cursor-pointer ${activeTab === 'products' ? 'underline text-blue' : ''}`}
            >
              Products
            </div>
            <div 
              onClick={() => setActiveTab('analysis')}
              className={`cursor-pointer ${activeTab === 'analysis' ? 'underline text-blue' : ''}`}
            >
              Analysis
            </div>
            <div 
              onClick={() => setActiveTab('summary')}
              className={`cursor-pointer ${activeTab === 'summary' ? 'underline text-blue' : ''}`}
            >
              Summary
            </div>
            <div 
              onClick={() => setActiveTab('addProducts')}
              className={`cursor-pointer ${activeTab === 'addProducts' ? 'underline text-blue' : ''}`}
            >
              Add Products
            </div>
          </div>

          {/* Component Render Area */}
          <div className="mt-2">
            {renderComponent()}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Stocks
import React, { useState } from 'react'
import Cards from '../components/cards/Cards'
import Products from '../components/Products/Products'
import Analysis from '../components/Analysis/Analysis'
import Summary from '../components/Summary/Summary'
import AddProduct from '../components/AddProduct/AddProduct'
import Report from '../components/Reprot/Report'
import ViewReports from '../components/Reprot/ViewReports'

const Reports = () => {
  const [activeTab, setActiveTab] = useState('get-report')

  const renderComponent = () => {
    switch (activeTab) {
      case 'get-report':
        return <ViewReports />
      case 'report':
        return <Report />
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
          <div className="flex justify-start gap-10 w-full border-b pb-2 text-black font-semibold">
            <div 
              onClick={() => setActiveTab('get-report')}
              className={`cursor-pointer ${activeTab === 'get-report' ? 'underline text-blue' : ''}`}
            >
              View Reports
            </div>
            <div 
              onClick={() => setActiveTab('report')}
              className={`cursor-pointer ${activeTab === 'report' ? 'underline text-blue' : ''}`}
            >
              Add Report
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

export default Reports
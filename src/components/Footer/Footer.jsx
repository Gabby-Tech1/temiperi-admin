import React from 'react'
import './footer.css'
import { Link } from 'react-router-dom'
import { asset } from '../../assets/assets'

const Footer = () => {
  return (
    <div>
      <footer>

        <div className="logo">
          <img src={asset.logo} alt="" />
        </div>
         <div>
          <p>Policy & Privacy</p>
          <p>Terms and Conditions</p>
           <p>&copy; Copyright 2024. All rights reserved</p>
         </div>


         <div className="quick_links">
            <h3>Quick Links</h3>
            <Link to={'/product'}>
               <p>Stock</p>
            </Link>
            <Link to={'/orders'}>
               <p>Orders</p>
            </Link>
            <Link to={'/report'}>
               <p>Report</p>
            </Link>
            <Link to={'/analysis'}>
              <p>Analysis</p>
            </Link>
         </div>
      </footer>
    </div>
  )
}

export default Footer
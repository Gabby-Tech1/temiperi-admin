// import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Logo from '../../assets/temiperi-logo.jpg';
import { IoMdClose, IoMdMenu } from 'react-icons/io';
import { GoChecklist } from "react-icons/go";
import { IoSettings } from 'react-icons/io5';
import { TbReport } from "react-icons/tb";
import { MdWarning } from "react-icons/md";

export const Sidebar = ({ onClose }) => {
    const location = useLocation();

    const now = new Date();
    const formattedDate = now.toLocaleDateString("en-US", {
        year: "numeric"
    });

    const getLinkClass = (path) =>
        location.pathname === path
            ? 'bg-white text-blue w-full py-2 text-center rounded-md flex px-4 items-center gap-2'
            : 'text-white w-full text-center hover:bg-white/10 py-2 rounded-md transition-colors flex px-4 items-center gap-2';

    return (
        <div className='w-[280px] lg:w-64 h-full flex flex-col px-4 lg:px-6 py-6 lg:py-10 items-center bg-blue gap-8'>
            {/* Close button for mobile */}
            <button 
                onClick={onClose}
                className='lg:hidden self-end p-2 text-white hover:bg-white/10 rounded-full'
            >
                <IoMdClose className='text-2xl' />
            </button>

            {/* Logo */}
            <img src={Logo} alt="Temiperi Logo" className='w-16 h-16 lg:w-20 lg:h-20 rounded-full' />
            
            {/* Navigation Links */}
            <div className="flex flex-col gap-3 items-center font-medium text-base lg:text-lg w-full">
                <Link to="/" className='w-full' onClick={onClose}>
                    <p className={getLinkClass('/')}><IoMdMenu className="text-2xl"/> Stocks</p>
                </Link>
                <Link to="/orders" className='w-full' onClick={onClose}>
                    <p className={getLinkClass('/orders')}><GoChecklist className="text-2xl"/> Orders</p>
                </Link>
                <Link to="/report" className='w-full' onClick={onClose}>
                    <p className={getLinkClass('/report')}><TbReport className="text-2xl"/> Report</p>
                </Link>
                <Link to="/low-stock" className='w-full' onClick={onClose}>
                    <p className={getLinkClass('/low-stock')}><MdWarning className="text-2xl"/> Low Stock</p>
                </Link>
                <Link to="/settings" className='w-full' onClick={onClose}>
                    <p className={getLinkClass('/settings')}><IoSettings className="text-2xl"/> Settings</p>
                </Link>
            </div>

            {/* Company Info */}
            <div className="mt-auto text-center text-white">
                <p className="text-sm opacity-80"> {formattedDate} | Temiperi Enterprise</p>
            </div>
        </div>
    );
};

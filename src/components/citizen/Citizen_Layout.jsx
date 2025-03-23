/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import Header from './Header';
import { Outlet, Link, useLocation } from 'react-router-dom';

function Citizen_Layout() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Helper function to determine if a link is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className='bg-gray-50 min-h-screen flex flex-col'>
      <Header />
      
      {/* Navigation Bar */}
      <div className='bg-white shadow-sm sticky top-0 z-10'>
        <div className='container mx-auto px-4'>
          <div className='py-4 hidden md:flex items-center space-x-6'>
            <Link
              to="/citizen"
              className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                isActive('/citizen') 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'
              }`}
            >
              <div className='flex items-center'>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
                Dashboard
              </div>
            </Link>
            <Link
              to="/citizen/appointments"
              className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                isActive('/citizen/appointments') 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'
              }`}
            >
              <div className='flex items-center'>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                My Appointments
              </div>
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <div className='md:hidden py-3 flex justify-between items-center'>
            <h2 className='text-lg font-semibold text-gray-800'>Citizen Portal</h2>
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className='p-2 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none'
            >
              {isMobileMenuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className='md:hidden pb-3 space-y-2'>
              <Link
                to="/citizen"
                className={`block px-4 py-2 rounded-md ${
                  isActive('/citizen') 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div className='flex items-center'>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                  </svg>
                  Dashboard
                </div>
              </Link>
              <Link
                to="/citizen/appointments"
                className={`block px-4 py-2 rounded-md ${
                  isActive('/citizen/appointments') 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div className='flex items-center'>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  My Appointments
                </div>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className='flex-grow container mx-auto px-4 py-6'>
        <main>
          <Outlet />
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="container mx-auto px-4 py-4">
          <p className="text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} Community Health Services. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Citizen_Layout;
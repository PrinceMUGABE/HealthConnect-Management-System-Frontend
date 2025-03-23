/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CitizenHome.css';
import { Link, useNavigate } from 'react-router-dom';

function CitizenHome() {
  const [servicesData, setServicesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const servicesPerPage = 9;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const servicesRes = await axios.get('http://127.0.0.1:8000/service/services/', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
  
        if (servicesRes.data) {
          setServicesData(servicesRes.data);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching services:', error);
        setError('Failed to load services. Please try again later.');
        setLoading(false);
        
        if (error.response && error.response.status === 401) {
          console.error('Unauthorized access - Redirecting to login');
          // navigate('/login');
        }
      }
    };
    fetchData();
  }, []);
  
  // Pagination logic
  const indexOfLastService = currentPage * servicesPerPage;
  const indexOfFirstService = indexOfLastService - servicesPerPage;
  const currentServices = servicesData.slice(indexOfFirstService, indexOfLastService);
  const totalPages = Math.ceil(servicesData.length / servicesPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    // Smooth scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="container mx-auto px-4 py-8 mt-16">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-500 rounded-xl p-8 mb-10 shadow-lg text-white">
        <h1 className="text-3xl font-bold mb-3">Community Health Services</h1>
        <p className="text-lg opacity-90 max-w-2xl">
          Connect with dedicated community health workers who can assist you with various health services.
          Schedule an appointment today to get the care you need.
        </p>
      </div>

      {/* Services Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2 text-gray-800">Available Services</h2>
        <div className="w-20 h-1 bg-indigo-500 mb-6"></div>
        <p className="text-gray-600 mb-8">
          Browse through our available services and create an appointment with our community health workers.
        </p>
      </div>

      {/* Loading and Error States */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Services Grid */}
      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentServices.map((service) => (
              <div key={service.id} className="bg-white rounded-lg shadow-lg overflow-hidden transition-transform duration-300 hover:shadow-xl hover:-translate-y-1">
                {/* Card Header */}
                <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 p-4">
                  <h3 className="text-xl font-semibold text-white">{service.name}</h3>
                </div>
                
                {/* Card Content */}
                <div className="p-6">
                  <div className="mb-6">
                    <div className="flex items-center mb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                      </svg>
                      <p className="text-gray-700">
                        <span className="font-medium">Assistant:</span> {service.created_by?.phone || 'Not assigned'}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                      <p className="text-gray-700">
                        <span className="font-medium">Created:</span> {formatDate(service.created_at)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Action Button */}
                  <Link
                    to="/citizen/createAppointment"
                    className="block w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-md transition duration-200"
                  >
                    Schedule Appointment
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* No Services Message */}
          {currentServices.length === 0 && !loading && (
            <div className="bg-gray-100 p-8 rounded-lg text-center">
              <p className="text-gray-600 text-lg">No services are currently available.</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-10">
              <nav className="flex items-center">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`mx-1 px-4 py-2 rounded-md ${
                    currentPage === 1 
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Previous
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`mx-1 w-10 h-10 rounded-full flex items-center justify-center ${
                      page === currentPage 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`mx-1 px-4 py-2 rounded-md ${
                    currentPage === totalPages 
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Next
                </button>
              </nav>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default CitizenHome;
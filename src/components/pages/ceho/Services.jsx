/* eslint-disable react/no-unescaped-entities */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faEye, 
  faEdit, 
  faTrash, 
  faFilter, 
  faFileDownload, 
  faSearch,
  faChevronLeft,
  faChevronRight,
  faTable,
  faThLarge,
  faCalendarAlt,
  faUser,
  faTag
} from "@fortawesome/free-solid-svg-icons";

function ManageServices() {
  const [serviceData, setserviceData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [servicesPerPage, setServicesPerPage] = useState(5);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, recent: 0 });
  const [viewMode, setViewMode] = useState("table"); // "table" or "card" view
  const navigate = useNavigate();

  const storedUserData = localStorage.getItem("userData");
  const accessToken = storedUserData ? JSON.parse(storedUserData).access_token : null;

  useEffect(() => {
    if (!accessToken) {
      alert("Unauthorized! Please log in again.");
      navigate("/login");
    }
  }, [accessToken, navigate]);

  const axiosConfig = {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  };

  const handleFetch = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get("http://127.0.0.1:8000/service/services/", axiosConfig);
      if (Array.isArray(res.data)) {
        setserviceData(res.data);
        
        // Calculate statistics for dashboard cards
        const total = res.data.length;
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        
        const recent = res.data.filter(service => 
          new Date(service.created_at) >= lastWeek
        ).length;
        
        // Assuming a service is active based on some property, update as needed
        const active = res.data.filter(service => service.is_active || true).length;
        
        setStats({ total, active, recent });
      } else {
        setserviceData([]);
        setStats({ total: 0, active: 0, recent: 0 });
      }
    } catch (err) {
      if (err.response && err.response.status === 401) {
        alert("Session expired. Please log in again.");
        navigate("/login");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      handleFetch();
    }
  }, [accessToken]);

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Do you want to delete this service?");
    if (confirmDelete) {
      try {
        const res = await axios.delete(
          `http://127.0.0.1:8000/service/delete/${id}/`,
          axiosConfig
        );
        if (res.status === 204) {
          setserviceData((prevData) => prevData.filter((service) => service.id !== id));
          // Update statistics after deletion
          setStats(prev => ({
            ...prev,
            total: prev.total - 1
          }));
        } else {
          alert("Failed to delete service");
        }
      } catch (err) {
        alert("An error occurred while deleting the service");
      }
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleRowsPerPageChange = (e) => {
    setServicesPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when changing rows per page
  };

  const toggleViewMode = (mode) => {
    setViewMode(mode);
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.text("Services Report", 14, 16);
    doc.autoTable({ 
      html: "#service-table",
      startY: 20,
      styles: { fontSize: 8 },
      columnStyles: { 0: { cellWidth: 40 }, 1: { cellWidth: 40 }, 2: { cellWidth: 40 } }
    });
    doc.save("services.pdf");
  };

  const handleDownloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(serviceData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "services");
    XLSX.writeFile(workbook, "services.xlsx");
  };

  const filteredData = serviceData.filter((service) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      // Search in all text fields for greater flexibility
      service.created_by.phone?.toLowerCase().includes(searchLower) ||
      service.name?.toLowerCase().includes(searchLower) ||
      service.created_at?.includes(searchQuery) ||
      (service.description && service.description.toLowerCase().includes(searchLower)) ||
      (service.status && service.status.toLowerCase().includes(searchLower)) ||
      (service.category && service.category.toLowerCase().includes(searchLower))
    );
  });

  const indexOfLastservice = currentPage * servicesPerPage;
  const indexOfFirstservice = indexOfLastservice - servicesPerPage;
  const currentservices = filteredData.slice(indexOfFirstservice, indexOfLastservice);
  const totalPages = Math.ceil(filteredData.length / servicesPerPage);

  const paginate = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // Generate pagination links with ellipsis for large numbers
  const renderPaginationLinks = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always show first page
      pageNumbers.push(1);
      
      // Calculate start and end of visible pages around current
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);
      
      // Adjust to show maxVisiblePages - 2 pages (for first and last)
      if (endPage - startPage < maxVisiblePages - 3) {
        if (currentPage < totalPages / 2) {
          endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 3);
        } else {
          startPage = Math.max(2, endPage - (maxVisiblePages - 3));
        }
      }
      
      // Add ellipsis before middle pages if needed
      if (startPage > 2) {
        pageNumbers.push('...');
      }
      
      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
      
      // Add ellipsis after middle pages if needed
      if (endPage < totalPages - 1) {
        pageNumbers.push('...');
      }
      
      // Always show last page
      pageNumbers.push(totalPages);
    }
    
    return pageNumbers;
  };

  // Function to generate random pastel color for card borders (for visual variety)
  const getServiceColor = (id) => {
    const colors = ["blue", "green", "purple", "pink", "yellow", "indigo", "red", "teal"];
    // Use service ID to deterministically select a color
    const colorIndex = id % colors.length;
    return colors[colorIndex];
  };

  return (
    <div className="bg-gray-50 p-6 rounded-lg shadow">
      <h1 className="text-center text-black font-bold text-2xl capitalize mb-6">
        Manage Services
      </h1>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Services</p>
              <p className="text-3xl font-bold text-gray-800">{stats.total}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Active Services</p>
              <p className="text-3xl font-bold text-gray-800">{stats.active}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">New This Week</p>
              <p className="text-3xl font-bold text-gray-800">{stats.recent}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Action & Filters Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-center mb-6 gap-4">
        <Link
          to="/admin/createService"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-200 flex items-center w-full lg:w-auto justify-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          Create New Service
        </Link>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <div className="relative flex-grow lg:flex-grow-0">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search any field..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-10 pr-4 py-2 w-full text-gray-500 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center space-x-2">
            {/* View Toggle Buttons */}
            <div className="bg-white px-2 py-1 rounded-lg border flex">
              <button
                onClick={() => toggleViewMode("table")}
                className={`px-3 py-1 rounded ${
                  viewMode === "table"
                    ? "bg-blue-500 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                title="Table View"
              >
                <FontAwesomeIcon icon={faTable} />
              </button>
              <button
                onClick={() => toggleViewMode("card")}
                className={`px-3 py-1 rounded ${
                  viewMode === "card"
                    ? "bg-blue-500 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                title="Card View"
              >
                <FontAwesomeIcon icon={faThLarge} />
              </button>
            </div>

            <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-lg border">
              <FontAwesomeIcon icon={faFilter} className="text-gray-500" />
              <select
                value={servicesPerPage}
                onChange={handleRowsPerPageChange}
                className="border-none focus:ring-0 bg-transparent text-gray-700"
              >
                <option value="5">5 per page</option>
                <option value="10">10 per page</option>
                <option value="30">30 per page</option>
                <option value="50">50 per page</option>
                <option value="100">100 per page</option>
              </select>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={handleDownloadPDF}
                className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition flex items-center"
                title="Download PDF"
              >
                <FontAwesomeIcon icon={faFileDownload} className="mr-2" />
                PDF
              </button>
              <button
                onClick={handleDownloadExcel}
                className="px-3 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition flex items-center"
                title="Download Excel"
              >
                <FontAwesomeIcon icon={faFileDownload} className="mr-2" />
                Excel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Data section */}
      <div className="bg-white rounded-lg shadow">
        {isLoading ? (
          <div className="py-10 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-gray-600">Loading services...</p>
          </div>
        ) : (
          <>
            {/* Table View */}
            {viewMode === "table" && (
              <div className="relative overflow-x-auto">
                <table
                  id="service-table"
                  className="w-full text-sm text-left text-gray-500"
                >
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3">
                        Created by
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Name of service
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Created Date
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {currentservices.length > 0 ? (
                      currentservices.map((service) => (
                        <tr key={service.id} className="bg-white border-b hover:bg-gray-50">
                          <td className="px-6 py-4 font-medium text-gray-900">
                            {service.created_by.phone}
                          </td>
                          <td className="px-6 py-4">{service.name}</td>
                          <td className="px-6 py-4">
                            {service.created_at
                              ? new Date(service.created_at).toLocaleDateString()
                              : "N/A"}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-4">
                              <Link 
                                to={`/admin/viewService/${service.id}`}
                                className="text-blue-500 hover:text-blue-700 transition"
                                title="View Details"
                              >
                                <FontAwesomeIcon icon={faEye} />
                              </Link>
                              <Link 
                                to={`/admin/editService/${service.id}`}
                                className="text-green-500 hover:text-green-700 transition"
                                title="Edit Service"
                              >
                                <FontAwesomeIcon icon={faEdit} />
                              </Link>
                              <button
                                onClick={() => handleDelete(service.id)}
                                className="text-red-500 hover:text-red-700 transition cursor-pointer"
                                title="Delete Service"
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="px-6 py-10 text-center text-gray-500">
                          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          <p className="mt-2 text-sm">No services found</p>
                          <p className="mt-1 text-xs text-gray-400">Try adjusting your search or filter to find what you're looking for.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Card View */}
            {viewMode === "card" && (
              <div className="p-4">
                {currentservices.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {currentservices.map((service) => {
                      const colorName = getServiceColor(service.id);
                      return (
                        <div 
                          key={service.id}
                          className={`bg-white rounded-lg shadow-md overflow-hidden border-t-4 border-${colorName}-500 hover:shadow-lg transition duration-200`}
                        >
                          <div className="p-5">
                            <h3 className="text-lg font-semibold text-gray-800 mb-2 truncate">
                              {service.name}
                            </h3>
                            <div className="space-y-2 mb-4">
                              <div className="flex items-center text-sm text-gray-600">
                                <FontAwesomeIcon icon={faUser} className="mr-2 text-gray-400" />
                                <span className="truncate">{service.created_by.phone}</span>
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 text-gray-400" />
                                <span>
                                  {service.created_at
                                    ? new Date(service.created_at).toLocaleDateString()
                                    : "N/A"}
                                </span>
                              </div>
                              {service.category && (
                                <div className="flex items-center text-sm text-gray-600">
                                  <FontAwesomeIcon icon={faTag} className="mr-2 text-gray-400" />
                                  <span>{service.category}</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Description truncated preview */}
                            {service.description && (
                              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                {service.description}
                              </p>
                            )}
                            
                            <div className="flex items-center justify-end space-x-2 pt-2 border-t">
                              <Link 
                                to={`/admin/viewService/${service.id}`}
                                className="p-2 text-blue-500 hover:text-blue-700 transition"
                                title="View Details"
                              >
                                <FontAwesomeIcon icon={faEye} />
                              </Link>
                              <Link 
                                to={`/admin/editService/${service.id}`}
                                className="p-2 text-green-500 hover:text-green-700 transition"
                                title="Edit Service"
                              >
                                <FontAwesomeIcon icon={faEdit} />
                              </Link>
                              <button
                                onClick={() => handleDelete(service.id)}
                                className="p-2 text-red-500 hover:text-red-700 transition cursor-pointer"
                                title="Delete Service"
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-10 text-center text-gray-500">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="mt-2 text-sm">No services found</p>
                    <p className="mt-1 text-xs text-gray-400">Try adjusting your search or filter to find what you're looking for.</p>
                  </div>
                )}
              </div>
            )}

            {/* Enhanced Pagination */}
            {totalPages > 0 && (
              <div className="p-4 border-t flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {indexOfFirstservice + 1} to {Math.min(indexOfLastservice, filteredData.length)} of {filteredData.length} entries
                </div>
                
                <div className="flex items-center space-x-1">
                  <button 
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded border ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    <FontAwesomeIcon icon={faChevronLeft} className="text-sm" />
                  </button>
                  
                  {renderPaginationLinks().map((page, index) => (
                    <button
                      key={index}
                      onClick={() => typeof page === 'number' ? paginate(page) : null}
                      className={`px-3 py-1 border rounded ${
                        currentPage === page
                          ? 'bg-blue-500 text-white'
                          : page === '...' 
                            ? 'text-gray-500 cursor-default'
                            : 'bg-white text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button 
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded border ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    <FontAwesomeIcon icon={faChevronRight} className="text-sm" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default ManageServices;
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
  faDownload, 
  faFilter, 
  faSearch,
  faCalendarCheck,
  faCalendarTimes,
  faHourglassHalf,
  faSync
} from "@fortawesome/free-solid-svg-icons";

function CommunityHealthWorker_ManageAppointments() {
  // State variables
  const [appointmentData, setAppointmentData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [appointmentsPerPage, setAppointmentsPerPage] = useState(5);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState({ from: "", to: "" });
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: "created_date", direction: "desc" });
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    cancelled: 0
  });
  
  const navigate = useNavigate();
  const accessToken = localStorage.getItem("token");

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

  // Fetch appointments
  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get("http://127.0.0.1:8000/appointment/worker_appointments/", axiosConfig);
      console.log("Appointments fetched from API:", res.data);
      setAppointmentData(res.data || []);
      
      // Calculate statistics
      const data = res.data || [];
      setStats({
        total: data.length,
        pending: data.filter(item => item.status === "pending").length,
        completed: data.filter(item => item.status === "completed").length,
        cancelled: data.filter(item => item.status === "cancelled").length
      });
    } catch (err) {
      console.error("Error fetching appointments:", err);
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
      fetchAppointments();
    }
  }, [accessToken]);

  // Handle appointment deletion
  const handleDelete = async (id) => {
    if (window.confirm("Do you want to delete this appointment?")) {
      try {
        await axios.delete(`http://127.0.0.1:8000/appointment/delete/${id}/`, axiosConfig);
        setAppointmentData(prevData => prevData.filter(appointment => appointment.id !== id));
        alert("Appointment deleted successfully!");
        fetchAppointments(); // Refresh data after deletion
      } catch (err) {
        alert("Failed to delete appointment.");
        console.error("Error deleting appointment:", err);
      }
    }
  };

  // Handle status change
  const handleStatusChange = async (id, newStatus) => {
    try {
      await axios.patch(
        `http://127.0.0.1:8000/appointment/status/${id}/`, 
        { status: newStatus }, 
        axiosConfig
      );
      
      // Update local state
      setAppointmentData(prevData => 
        prevData.map(appointment => 
          appointment.id === id 
            ? { ...appointment, status: newStatus } 
            : appointment
        )
      );
      
      alert(`Appointment status updated to ${newStatus}`);
      fetchAppointments(); // Refresh data to update statistics
    } catch (err) {
      alert("Failed to update appointment status.");
      console.error("Error updating status:", err);
    }
  };

  // Search and filter functions
  const handleSearchChange = (e) => setSearchQuery(e.target.value);
  const handleStatusFilterChange = (e) => setStatusFilter(e.target.value);
  const handleDateFilterChange = (e, field) => {
    setDateFilter(prev => ({ ...prev, [field]: e.target.value }));
  };
  const handleRowsPerPageChange = (e) => {
    setAppointmentsPerPage(parseInt(e.target.value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Export functions
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.text("Appointments Report", 14, 16);
    doc.autoTable({ 
      html: "#appointment-table",
      startY: 20,
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: { 0: { cellWidth: 25 } }
    });
    doc.save("appointments.pdf");
  };

  const handleDownloadExcel = () => {
    // Filter out only the data we want to export
    const exportData = filteredData.map(item => ({
      'First Name': item.first_name,
      'Last Name': item.last_name,
      'Phone': item.created_by?.phone || 'N/A',
      'Address': item.address,
      'Created Date': new Date(item.created_date).toLocaleDateString(),
      'Due Date': new Date(item.due_date).toLocaleDateString(),
      'Status': item.status.charAt(0).toUpperCase() + item.status.slice(1)
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Appointments");
    XLSX.writeFile(workbook, "appointments.xlsx");
  };

  // Sorting function
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Filter and sort the data
  const getFilteredData = () => {
    return appointmentData.filter(appointment => {
      // Status filter
      if (statusFilter !== "all" && appointment.status !== statusFilter) {
        return false;
      }

      // Date filter
      if (dateFilter.from && new Date(appointment.created_date) < new Date(dateFilter.from)) {
        return false;
      }
      if (dateFilter.to && new Date(appointment.created_date) > new Date(dateFilter.to)) {
        return false;
      }

      // Search query - check multiple fields
      const searchFields = [
        appointment.first_name,
        appointment.last_name,
        appointment.address,
        appointment.created_by?.phone,
        appointment.status,
        new Date(appointment.created_date).toLocaleDateString()
      ];
      
      const searchTerms = searchQuery.toLowerCase().split(" ");
      
      // Check if ALL search terms match at least one field
      return searchTerms.every(term => 
        searchFields.some(field => 
          field && field.toString().toLowerCase().includes(term)
        )
      );
    });
  };

  // Sort the filtered data
  const sortedData = () => {
    const filteredResults = getFilteredData();
    
    if (!sortConfig.key) return filteredResults;
    
    return [...filteredResults].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      
      // Handle nested objects
      if (sortConfig.key.includes('.')) {
        const keys = sortConfig.key.split('.');
        aValue = keys.reduce((obj, key) => obj?.[key], a);
        bValue = keys.reduce((obj, key) => obj?.[key], b);
      }
      
      // Handle dates
      if (sortConfig.key === 'created_date' || sortConfig.key === 'due_date') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }
      
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  const filteredData = sortedData();
  const totalPages = Math.ceil(filteredData.length / appointmentsPerPage);
  const indexOfLastAppointment = currentPage * appointmentsPerPage;
  const indexOfFirstAppointment = indexOfLastAppointment - appointmentsPerPage;
  const currentAppointments = filteredData.slice(indexOfFirstAppointment, indexOfLastAppointment);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Get status badge style
  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  // Status icon mapping
  const getStatusIcon = (status) => {
    switch(status) {
      case 'pending':
        return <FontAwesomeIcon icon={faHourglassHalf} className="mr-1" />;
      case 'completed':
        return <FontAwesomeIcon icon={faCalendarCheck} className="mr-1" />;
      case 'cancelled':
        return <FontAwesomeIcon icon={faCalendarTimes} className="mr-1" />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-center text-black font-bold text-2xl capitalize mb-6">
        Manage Your Appointments
      </h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <p className="text-sm text-gray-500">Total Appointments</p>
          <p className="text-2xl font-bold text-blue-700">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-2xl font-bold text-blue-700">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <p className="text-sm text-gray-500">Completed</p>
          <p className="text-2xl font-bold text-blue-700">{stats.completed}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
          <p className="text-sm text-gray-500">Cancelled</p>
          <p className="text-2xl font-bold text-blue-700">{stats.cancelled}</p>
        </div>
      </div>
      
      {/* Search and Filters */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search appointments..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full px-4 py-2 pr-10 bg-white text-black border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <FontAwesomeIcon 
                icon={faSearch} 
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => setIsFilterVisible(!isFilterVisible)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg border shadow-sm hover:bg-gray-200 flex items-center"
            >
              <FontAwesomeIcon icon={faFilter} className="mr-2" />
              Filters
            </button>
            
            <select
              value={appointmentsPerPage}
              onChange={handleRowsPerPageChange}
              className="px-2 py-2 bg-white text-gray-500 border rounded-lg shadow-sm"
            >
              <option value={5}>5 rows</option>
              <option value={10}>10 rows</option>
              <option value={30}>30 rows</option>
              <option value={50}>50 rows</option>
              <option value={100}>100 rows</option>
            </select>
            
            <button 
              onClick={handleDownloadPDF} 
              className="px-4 py-2 bg-green-500 text-white rounded-lg shadow-sm hover:bg-green-600"
              title="Download PDF"
            >
              <FontAwesomeIcon icon={faDownload} className="mr-2" />
              PDF
            </button>
            
            <button 
              onClick={handleDownloadExcel} 
              className="px-4 py-2 bg-yellow-500 text-white rounded-lg shadow-sm hover:bg-yellow-600"
              title="Download Excel"
            >
              <FontAwesomeIcon icon={faDownload} className="mr-2" />
              Excel
            </button>
          </div>
        </div>
        
        {/* Advanced Filter Panel */}
        {isFilterVisible && (
          <div className="bg-white p-4 rounded-lg shadow-md mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                className="w-full text-gray-500 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
              <input
                type="date"
                value={dateFilter.from}
                onChange={(e) => handleDateFilterChange(e, 'from')}
                className="w-full text-gray-500 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
              <input
                type="date"
                value={dateFilter.to}
                onChange={(e) => handleDateFilterChange(e, 'to')}
                className="w-full text-gray-500 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </div>
      
      {/* Results info */}
      <div className="mb-2 text-sm text-gray-500">
        Showing {Math.min(filteredData.length, indexOfFirstAppointment + 1)} to {Math.min(indexOfLastAppointment, filteredData.length)} of {filteredData.length} appointments
      </div>
      
      {/* Table */}
      <div className="relative overflow-x-auto shadow-md sm:rounded-lg bg-white">
        {isLoading ? (
          <div className="p-8 text-center">
            <FontAwesomeIcon icon={faSync} spin className="text-blue-500 text-2xl mb-2" />
            <p>Loading appointments...</p>
          </div>
        ) : (
          <table id="appointment-table" className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 cursor-pointer hover:bg-gray-100"
                  onClick={() => requestSort('first_name')}
                >
                  Citizen Name
                  {sortConfig.key === 'first_name' && (
                    <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th className="px-6 py-3">Citizen Phone</th>
                <th 
                  className="px-6 py-3 cursor-pointer hover:bg-gray-100"
                  onClick={() => requestSort('address')}
                >
                  Address
                  {sortConfig.key === 'address' && (
                    <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  className="px-6 py-3 cursor-pointer hover:bg-gray-100"
                  onClick={() => requestSort('created_date')}
                >
                  Created Date
                  {sortConfig.key === 'created_date' && (
                    <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  className="px-6 py-3 cursor-pointer hover:bg-gray-100"
                  onClick={() => requestSort('status')}
                >
                  Status
                  {sortConfig.key === 'status' && (
                    <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th className="px-6 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {currentAppointments.length > 0 ? (
                currentAppointments.map(appointment => (
                  <tr key={appointment.id} className="bg-white border-b hover:bg-gray-50">
                    <th className="px-6 py-4 font-medium">
                      {appointment.first_name} {appointment.last_name}
                    </th>
                    <td className="px-6 py-4">{appointment.created_by?.phone || 'N/A'}</td>
                    <td className="px-6 py-4">{appointment.address}</td>
                    <td className="px-6 py-4"> Created on: 
                      {new Date(appointment.created_date).toLocaleDateString()}
                      <p className="text-black"> Due date: <span className="text-blue-700">{new Date(appointment.due_date).toLocaleDateString()}</span></p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative group">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs ${getStatusBadgeClass(appointment.status)}`}>
                          {getStatusIcon(appointment.status)}
                          {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                        </span>
                        
                        {/* Status change dropdown */}
                        <div className="hidden group-hover:block absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                          <div className="py-1">
                            <button 
                              onClick={() => handleStatusChange(appointment.id, 'pending')}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              disabled={appointment.status === 'pending'}
                            >
                              {getStatusIcon('pending')} Mark as Pending
                            </button>
                            <button 
                              onClick={() => handleStatusChange(appointment.id, 'completed')}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              disabled={appointment.status === 'completed'}
                            >
                              {getStatusIcon('completed')} Mark as Completed
                            </button>
                            <button 
                              onClick={() => handleStatusChange(appointment.id, 'cancelled')}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              disabled={appointment.status === 'cancelled'}
                            >
                              {getStatusIcon('cancelled')} Mark as Cancelled
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-3">
                        <Link to={`/chw/viewAppointmentDetails/${appointment.id}`}>
                          <FontAwesomeIcon icon={faEye} className="text-blue-500 hover:text-blue-700" title="View Details" />
                        </Link>
                        {/* <Link to={`/chw/editAppointment/${appointment.id}`}>
                          <FontAwesomeIcon icon={faEdit} className="text-green-500 hover:text-green-700" title="Edit" />
                        </Link> */}
                        <button onClick={() => handleDelete(appointment.id)} className="text-red-500 hover:text-red-700">
                          <FontAwesomeIcon icon={faTrash} title="Delete" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center">
                    {searchQuery || statusFilter !== 'all' || dateFilter.from || dateFilter.to ? 
                      "No appointments match your filters" : "No appointments found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <div>
            <button 
              onClick={() => paginate(1)} 
              disabled={currentPage === 1}
              className={`mr-2 px-3 py-1 rounded ${currentPage === 1 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              First
            </button>
            <button 
              onClick={() => paginate(currentPage - 1)} 
              disabled={currentPage === 1}
              className={`mr-2 px-3 py-1 rounded ${currentPage === 1 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              Previous
            </button>
          </div>
          
          <div className="flex">
            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              // Show current page in the middle if possible
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => paginate(pageNum)}
                  className={`mx-1 px-3 py-1 rounded ${
                    currentPage === pageNum
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          
          <div>
            <button 
              onClick={() => paginate(currentPage + 1)} 
              disabled={currentPage === totalPages}
              className={`ml-2 px-3 py-1 rounded ${currentPage === totalPages ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              Next
            </button>
            <button 
              onClick={() => paginate(totalPages)} 
              disabled={currentPage === totalPages}
              className={`ml-2 px-3 py-1 rounded ${currentPage === totalPages ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              Last
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CommunityHealthWorker_ManageAppointments;
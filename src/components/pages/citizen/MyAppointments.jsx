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
  faTrash, 
  faEdit, 
  faCalendarAlt, 
  faUser, 
  faFilter, 
  faDownload, 
  faSearch,
  faClipboardList,
  faCalendarCheck,
  faClock,
  faChevronLeft,
  faChevronRight,
  faFilePdf,
  faFileExcel,
  faTimesCircle,
  faTimes
} from "@fortawesome/free-solid-svg-icons";

function Citizen_ManageAppointments() {
  const [appointmentData, setAppointmentData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [appointmentsPerPage, setAppointmentsPerPage] = useState(5);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterWorker, setFilterWorker] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const navigate = useNavigate();

  const accessToken = localStorage.getItem("token");

  // Redirect to login if the user is not authenticated
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

  // Fetch appointment data
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://127.0.0.1:8000/appointment/user_appointments/", axiosConfig);
      console.log("Appointments fetched from API:", res.data);
      setAppointmentData(res.data || []);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching appointments:", err);
      setLoading(false);
      if (err.response && err.response.status === 401) {
        alert("Session expired. Please log in again.");
        navigate("/login");
      }
    }
  };

  // Fetch appointments on component mount
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
      } catch (err) {
        alert("Failed to delete appointment.");
        console.error("Error deleting appointment:", err);
      }
    }
  };

  // Open detail modal
  const openDetailModal = (appointment) => {
    setSelectedAppointment(appointment);
    setModalOpen(true);
  };

  // Close detail modal
  const closeDetailModal = () => {
    setModalOpen(false);
    setSelectedAppointment(null);
  };

  // Handle search input change
  const handleSearchChange = (e) => setSearchQuery(e.target.value);

  // Generate PDF report
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.text("Appointments Report", 14, 16);
    doc.autoTable({ 
      html: "#appointment-table",
      startY: 20,
      styles: { fontSize: 8 },
      columnStyles: { 0: { cellWidth: 25 } }
    });
    doc.save("appointments.pdf");
  };

  // Generate Excel report
  const handleDownloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(appointmentData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "appointments");
    XLSX.writeFile(workbook, "appointments.xlsx");
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery("");
    setFilterStartDate("");
    setFilterEndDate("");
    setFilterStatus("");
    setFilterWorker("");
  };

  // Function to check if a date is within the range
  const isDateInRange = (dateToCheck, startDate, endDate) => {
    if (!startDate && !endDate) return true;
    
    const checkDate = new Date(dateToCheck);
    
    if (startDate && !endDate) {
      const start = new Date(startDate);
      return checkDate >= start;
    }
    
    if (!startDate && endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Set to end of day
      return checkDate <= end;
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Set to end of day
    
    return checkDate >= start && checkDate <= end;
  };

  // Filter appointments based on search query and filters
  const filteredData = appointmentData.filter(appointment => {
    // Main search query - checks multiple fields
    const matchesSearch = 
      (appointment.appointed_to?.first_name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (appointment.appointed_to?.last_name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (appointment.appointed_to?.address?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (appointment.details?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (appointment.status?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      new Date(appointment.created_date).toLocaleDateString().includes(searchQuery);
    
    // Date range filter
    const matchesDate = isDateInRange(appointment.created_date, filterStartDate, filterEndDate);
    
    // Status filter
    const matchesStatus = !filterStatus || (appointment.status?.toLowerCase() === filterStatus.toLowerCase());
    
    // Worker filter
    const matchesWorker = !filterWorker || 
      (appointment.appointed_to?.first_name?.toLowerCase() || "").includes(filterWorker.toLowerCase()) ||
      (appointment.appointed_to?.last_name?.toLowerCase() || "").includes(filterWorker.toLowerCase());
    
    return matchesSearch && matchesDate && matchesStatus && matchesWorker;
  });

  // Get status counts for metrics
  const statusCounts = {
    pending: appointmentData.filter(app => app.status?.toLowerCase() === "pending").length,
    completed: appointmentData.filter(app => app.status?.toLowerCase() === "completed").length,
    rejected: appointmentData.filter(app => app.status?.toLowerCase() === "rejected").length,
    total: appointmentData.length
  };

  // Get status color
  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Truncate text function
  const truncateText = (text, maxLength = 10) => {
    if (!text) return "";
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  // Pagination logic
  const indexOfLastAppointment = currentPage * appointmentsPerPage;
  const indexOfFirstAppointment = indexOfLastAppointment - appointmentsPerPage;
  const currentAppointments = filteredData.slice(indexOfFirstAppointment, indexOfLastAppointment);
  const totalPages = Math.ceil(filteredData.length / appointmentsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="bg-gray-50 py-6 rounded-lg shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Manage Your Appointments
        </h1>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                  <FontAwesomeIcon icon={faClipboardList} className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Appointments</dt>
                    <dd className="text-3xl font-semibold text-gray-900">{statusCounts.total}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                  <FontAwesomeIcon icon={faClock} className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Pending</dt>
                    <dd className="text-3xl font-semibold text-gray-900">{statusCounts.pending}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                  <FontAwesomeIcon icon={faCalendarCheck} className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Completed</dt>
                    <dd className="text-3xl font-semibold text-gray-900">{statusCounts.completed}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-red-500 rounded-md p-3">
                  <FontAwesomeIcon icon={faTimesCircle} className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Rejected</dt>
                    <dd className="text-3xl font-semibold text-gray-900">{statusCounts.rejected}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons and search */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex flex-col sm:flex-row gap-2 mb-4 md:mb-0">
                <Link to="/citizen/createAppointment" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" />
                  Create New Appointment
                </Link>
                <button 
                  onClick={() => setShowFilters(!showFilters)} 
                  className="inline-flex text-black items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <FontAwesomeIcon icon={faFilter} className="mr-2" />
                  {showFilters ? "Hide Filters" : "Show Filters"}
                </button>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleDownloadPDF}
                  className="inline-flex text-red-700 items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <FontAwesomeIcon icon={faFilePdf} className="mr-2 text-red-600" />
                  Export PDF
                </button>
                <button
                  onClick={handleDownloadExcel}
                  className="inline-flex text-green-700 items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <FontAwesomeIcon icon={faFileExcel} className="mr-2 text-green-600" />
                  Export Excel
                </button>
              </div>
            </div>
          </div>

          {/* Advanced filters (conditionally rendered) */}
          {showFilters && (
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="search"
                      placeholder="Search anything..."
                      value={searchQuery}
                      onChange={handleSearchChange}
                      className="focus:ring-indigo-500 text-gray-500 focus:border-indigo-500 block w-full pl-10 pr-12 sm:text-sm border-gray-300 rounded-md py-2"
                    />
                  </div>
                </div>

                {/* Date range filter - start date */}
                <div>
                  <label htmlFor="start-date-filter" className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                  <input
                    type="date"
                    id="start-date-filter"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    className="focus:ring-indigo-500 text-gray-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md py-2"
                  />
                </div>

                {/* Date range filter - end date */}
                <div>
                  <label htmlFor="end-date-filter" className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                  <input
                    type="date"
                    id="end-date-filter"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                    className="focus:ring-indigo-500 text-gray-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md py-2"
                  />
                </div>

                <div>
                  <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    id="status-filter"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="focus:ring-indigo-500 text-gray-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md py-2"
                  >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="worker-filter" className="block text-sm font-medium text-gray-700 mb-1">Health Worker</label>
                  <input
                    type="text"
                    id="worker-filter"
                    placeholder="Worker name..."
                    value={filterWorker}
                    onChange={(e) => setFilterWorker(e.target.value)}
                    className="focus:ring-indigo-500 text-gray-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md py-2"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button 
                  onClick={resetFilters}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-900 focus:outline-none"
                >
                  Reset all filters
                </button>
              </div>
            </div>
          )}

          {/* Items per page selector */}
          <div className="p-4 flex justify-between items-center">
            <div className="flex items-center">
              <span className="text-sm text-gray-700 mr-2">Show</span>
              <select
                value={appointmentsPerPage}
                onChange={(e) => {
                  setAppointmentsPerPage(Number(e.target.value));
                  setCurrentPage(1); // Reset to first page when changing items per page
                }}
                className="focus:ring-indigo-500 text-gray-500 focus:border-indigo-500 h-full py-0 pl-2 pr-7 border-gray-300 bg-white rounded-md text-sm"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={30}>30</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm text-gray-700 ml-2">entries</span>
            </div>
            <div className="text-sm text-gray-700">
              Showing {filteredData.length > 0 ? indexOfFirstAppointment + 1 : 0} to {Math.min(indexOfLastAppointment, filteredData.length)} of {filteredData.length} appointments
            </div>
          </div>
        </div>

        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        )}

        {/* Detail Modal */}
        {modalOpen && selectedAppointment && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
            <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-medium text-gray-900">Appointment Details</h3>
                <button 
                  onClick={closeDetailModal}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <FontAwesomeIcon icon={faTimes} className="h-5 w-5" />
                </button>
              </div>
              
              <div className="mt-2">
                <p className="text-sm text-gray-500 whitespace-pre-line">
                  {selectedAppointment.details}
                </p>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
                  onClick={closeDetailModal}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {!loading && (
          <>
            {/* Desktop View - Table (hidden on small screens) */}
            <div className="hidden sm:block bg-white shadow overflow-hidden border-b border-gray-200 sm:rounded-lg mb-6">
              <div className="overflow-x-auto">
                <table
                  id="appointment-table"
                  className="min-w-full divide-y divide-gray-200"
                >
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Worker Name</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created Date</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentAppointments.length > 0 ? (
                      currentAppointments.map(appointment => (
                        <tr key={appointment.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                <FontAwesomeIcon icon={faUser} className="h-5 w-5 text-indigo-600" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {appointment.appointed_to?.first_name} {appointment.appointed_to?.last_name}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{appointment.appointed_to?.created_by?.phone}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">{appointment.appointed_to?.address}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-500 max-w-xs">
                              {truncateText(appointment.details, 10)}
                              <button 
                                onClick={() => openDetailModal(appointment)}
                                className="ml-2 text-indigo-600 hover:text-indigo-900"
                              >
                                <FontAwesomeIcon icon={faEye} />
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
                              {appointment.status || "Unknown"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(appointment.created_date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(appointment.due_date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <Link 
                                to={`/citizen/editAppointment/${appointment.id}`}
                                className="text-green-600 hover:text-green-900" 
                                title="Edit"
                              >
                                <FontAwesomeIcon icon={faEdit} />
                              </Link>
                              <button
                                onClick={() => handleDelete(appointment.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete"
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="px-6 py-10 text-center text-gray-500">
                          {searchQuery || filterStartDate || filterEndDate || filterStatus || filterWorker ? 
                            "No appointments match your filters" : 
                            "No appointments found"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Mobile View - Cards (visible only on small screens) */}
            <div className="sm:hidden space-y-4 mb-6">
              {currentAppointments.length > 0 ? (
                currentAppointments.map(appointment => (
                  <div key={appointment.id} className="bg-white shadow overflow-hidden rounded-lg">
                    <div className="px-4 py-4 sm:px-6 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                            <FontAwesomeIcon icon={faUser} className="h-5 w-5 text-indigo-600" />
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-gray-900">
                              {appointment.appointed_to?.first_name} {appointment.appointed_to?.last_name}
                            </h3>
                            <p className="text-xs text-gray-500">{appointment.appointed_to?.created_by?.phone}</p>
                          </div>
                        </div>
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
                          {appointment.status || "Unknown"}
                        </span>
                      </div>
                    </div>
                    <div className="px-4 py-2 divide-y divide-gray-200">
                      <div className="py-2">
                        <div className="flex justify-between">
                          <span className="text-xs font-medium text-gray-500">Location:</span>
                          <span className="text-xs text-gray-900">{appointment.appointed_to?.address}</span>
                        </div>
                      </div>
                      <div className="py-2">
                        <div className="flex justify-between">
                        <span className="text-xs text-gray-900">{truncateText(appointment.details, 20)}</span>
                          <button 
                            onClick={() => openDetailModal(appointment)}
                            className="ml-1 text-indigo-600 hover:text-indigo-900 text-xs"
                          >
                            <FontAwesomeIcon icon={faEye} />
                          </button>
                        </div>
                      </div>
                      <div className="py-2">
                        <div className="flex justify-between">
                          <span className="text-xs font-medium text-gray-500">Created:</span>
                          <span className="text-xs text-gray-900">{new Date(appointment.created_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="py-2">
                        <div className="flex justify-between">
                          <span className="text-xs font-medium text-gray-500">Due Date:</span>
                          <span className="text-xs text-gray-900">{new Date(appointment.due_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="px-4 py-3 bg-gray-50 flex justify-around">

                      <Link 
                        to={`/citizen/editAppointment/${appointment.id}`}
                        className="text-green-600 hover:text-green-900" 
                        title="Edit"
                      >
                        <FontAwesomeIcon icon={faEdit} /> Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(appointment.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <FontAwesomeIcon icon={faTrash} /> Delete
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white shadow overflow-hidden rounded-lg px-4 py-5 text-center">
                  <p className="text-gray-500">
                    {searchQuery || filterStartDate || filterEndDate || filterStatus || filterWorker ? 
                      "No appointments match your filters" : 
                      "No appointments found"}
                  </p>
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {filteredData.length > 0 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg shadow">
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{indexOfFirstAppointment + 1}</span> to{" "}
                      <span className="font-medium">{Math.min(indexOfLastAppointment, filteredData.length)}</span> of{" "}
                      <span className="font-medium">{filteredData.length}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                          currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <span className="sr-only">Previous</span>
                        <FontAwesomeIcon icon={faChevronLeft} className="h-5 w-5" />
                      </button>
                      
                      {/* Page numbers */}
                      {[...Array(totalPages).keys()].map(number => (
                        <button
                          key={number}
                          onClick={() => paginate(number + 1)}
                          className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${
                            currentPage === number + 1
                              ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                              : 'text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {number + 1}
                        </button>
                      ))}
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                          currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <span className="sr-only">Next</span>
                        <FontAwesomeIcon icon={faChevronRight} className="h-5 w-5" />
                      </button>
                    </nav>
                  </div>
                </div>
                
                {/* Mobile pagination */}
                <div className="flex items-center justify-between w-full sm:hidden">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                      currentPage === 1 ? 'text-gray-300 bg-gray-50 cursor-not-allowed' : 'text-gray-700 bg-white hover:bg-gray-50'
                    }`}
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-500">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                      currentPage === totalPages ? 'text-gray-300 bg-gray-50 cursor-not-allowed' : 'text-gray-700 bg-white hover:bg-gray-50'
                    }`}
                  >
                    Next
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

export default Citizen_ManageAppointments;
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
// Import FontAwesome icons
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faEye, 
  faEdit, 
  faTrash, 
  faTable, 
  faThLarge, 
  faFilter, 
  faDownload, 
  faPlus,
  faSearch,
  faChartBar,
  faCalendarAlt,
  faUserFriends
} from "@fortawesome/free-solid-svg-icons";

function ManageTrainings() {
  const [trainingData, setTrainingData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [trainingsPerPage, setTrainingsPerPage] = useState(5);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("table"); // "table" or "cards"
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: { start: "", end: "" },
    status: "all"
  });
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
    try {
      const res = await axios.get("http://127.0.0.1:8000/training/trainings/", axiosConfig);
      if (Array.isArray(res.data)) {
        setTrainingData(res.data);
      } else {
        setTrainingData([]);
      }
    } catch (err) {
      if (err.response && err.response.status === 401) {
        alert("Session expired. Please log in again.");
        navigate("/login");
      }
    }
  };

  useEffect(() => {
    if (accessToken) {
      handleFetch();
    }
  }, [accessToken]);

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Do you want to delete this training?");
    if (confirmDelete) {
      try {
        const res = await axios.delete(
          `http://127.0.0.1:8000/training/delete/${id}/`,
          axiosConfig
        );
        if (res.status === 204) {
          setTrainingData((prevData) => prevData.filter((training) => training.id !== id));
        } else {
          alert("Failed to delete training");
        }
      } catch (err) {
        alert("An error occurred while deleting the training");
      }
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFilters(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        [name]: value
      }));
    }
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.autoTable({ html: "#training-table" });
    doc.save("trainings.pdf");
  };

  const handleDownloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "trainings");
    XLSX.writeFile(workbook, "trainings.xlsx");
  };

  const toggleViewMode = () => {
    setViewMode(prev => prev === "table" ? "cards" : "table");
  };

  const toggleFilterPanel = () => {
    setIsFilterOpen(!isFilterOpen);
  };

  const handleTrainingsPerPageChange = (e) => {
    setTrainingsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Apply all filters and search
  const filteredData = trainingData.filter(training => {
    // Search query filter (search in any field)
    const searchInFields = [
      training.created_by.phone,
      training.name,
      training.created_at,
      // Add any other searchable fields here
    ];
    
    const matchesSearch = searchQuery === '' || 
      searchInFields.some(field => 
        field && field.toString().toLowerCase().includes(searchQuery.toLowerCase())
      );
    
    // Date range filter
    let matchesDateRange = true;
    if (filters.dateRange.start && filters.dateRange.end) {
      const trainingDate = new Date(training.created_at);
      const startDate = new Date(filters.dateRange.start);
      const endDate = new Date(filters.dateRange.end);
      endDate.setHours(23, 59, 59); // Include the full end date
      matchesDateRange = trainingDate >= startDate && trainingDate <= endDate;
    }
    
    // Status filter (you would need to add a status field to your training data)
    const matchesStatus = filters.status === 'all' || training.status === filters.status;
    
    return matchesSearch && matchesDateRange && matchesStatus;
  });

  // Calculate summary stats for the dashboard cards
  const stats = {
    totalTrainings: trainingData.length,
    recentTrainings: trainingData.filter(t => {
      const date = new Date(t.created_at);
      const now = new Date();
      const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
      return date >= thirtyDaysAgo;
    }).length,
    uniqueCreators: new Set(trainingData.map(t => t.created_by.phone)).size
  };

  // Pagination logic
  const indexOfLastTraining = currentPage * trainingsPerPage;
  const indexOfFirstTraining = indexOfLastTraining - trainingsPerPage;
  const currentTrainings = filteredData.slice(indexOfFirstTraining, indexOfLastTraining);
  const totalPages = Math.ceil(filteredData.length / trainingsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Generate pagination buttons
  const renderPaginationButtons = () => {
    // Always show first and last page, and a few pages around the current page
    const maxPagesToShow = 5;
    let pages = [];
    
    if (totalPages <= maxPagesToShow) {
      // Show all pages if there are few
      pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    } else {
      // Show first, last, and pages around current
      const leftSide = Math.floor(maxPagesToShow / 2);
      const rightSide = maxPagesToShow - leftSide - 1;
      
      if (currentPage <= leftSide + 1) {
        // Near the start
        pages = Array.from({ length: maxPagesToShow - 1 }, (_, i) => i + 1);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - rightSide) {
        // Near the end
        pages = [1, "..."];
        const start = totalPages - maxPagesToShow + 2;
        pages.push(...Array.from({ length: maxPagesToShow - 2 }, (_, i) => start + i));
      } else {
        // Somewhere in the middle
        pages = [1, "..."];
        const start = currentPage - Math.floor((maxPagesToShow - 4) / 2);
        pages.push(...Array.from({ length: maxPagesToShow - 4 }, (_, i) => start + i));
        pages.push("...");
        pages.push(totalPages);
      }
    }
    
    return pages.map((page, index) => {
      if (page === "...") {
        return (
          <span key={`ellipsis-${index}`} className="px-4 py-2 border text-sm font-medium bg-white text-gray-500">
            ...
          </span>
        );
      }
      return (
        <button
          key={`page-${page}`}
          onClick={() => paginate(page)}
          className={`px-4 py-2 border text-sm font-medium ${
            currentPage === page
              ? "bg-indigo-600 text-white"
              : "bg-white text-gray-500 hover:bg-gray-100"
          }`}
        >
          {page}
        </button>
      );
    });
  };

  return (
    <div className="p-4">
      <h1 className="text-center text-black font-bold text-2xl capitalize mb-6">
        Manage Trainings
      </h1>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-blue-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Total Trainings</p>
              <p className="text-2xl text-blue-700 font-bold">{stats.totalTrainings}</p>
            </div>
            <FontAwesomeIcon icon={faChartBar} className="text-3xl text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-green-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Recent Trainings (30 days)</p>
              <p className="text-2xl text-blue-700 font-bold">{stats.recentTrainings}</p>
            </div>
            <FontAwesomeIcon icon={faCalendarAlt} className="text-3xl text-green-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-purple-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Unique Creators</p>
              <p className="text-2xl text-blue-700 font-bold">{stats.uniqueCreators}</p>
            </div>
            <FontAwesomeIcon icon={faUserFriends} className="text-3xl text-purple-500" />
          </div>
        </div>
      </div>

      {/* Action Buttons and Search */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex flex-col md:flex-row justify-between mb-4 gap-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Link
              to="/admin/createtraining"
              className="px-4 py-2 bg-blue-500 text-white rounded flex items-center justify-center gap-2 hover:bg-blue-600 transition"
            >
              <FontAwesomeIcon icon={faPlus} />
              <span>Create New Training</span>
            </Link>
            
            <div className="flex gap-2">
              <button
                onClick={handleDownloadPDF}
                className="px-4 py-2 bg-green-500 text-white rounded flex items-center justify-center gap-2 hover:bg-green-600 transition"
              >
                <FontAwesomeIcon icon={faDownload} />
                <span>PDF</span>
              </button>
              <button
                onClick={handleDownloadExcel}
                className="px-4 py-2 bg-yellow-500 text-white rounded flex items-center justify-center gap-2 hover:bg-yellow-600 transition"
              >
                <FontAwesomeIcon icon={faDownload} />
                <span>Excel</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              // onClick={toggleFilterPanel}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded flex items-center justify-center gap-2 hover:bg-gray-300 transition"
            >
              <FontAwesomeIcon icon={faFilter} />
              <span>Filters</span>
            </button>
            
            <button
              onClick={toggleViewMode}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded flex items-center justify-center gap-2 hover:bg-gray-300 transition"
            >
              <FontAwesomeIcon icon={viewMode === "table" ? faThLarge : faTable} />
              <span>{viewMode === "table" ? "Card View" : "Table View"}</span>
            </button>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search in any field..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-10 px-4 py-2 bg-white text-black border rounded-full w-full"
              />
            </div>
          </div>
        </div>
        
        {/* Filter Panel */}
        {isFilterOpen && (
          <div className="bg-gray-100 p-4 rounded-lg mt-2 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  name="dateRange.start"
                  value={filters.dateRange.start}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  name="dateRange.end"
                  value={filters.dateRange.end}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="scheduled">Scheduled</option>
                </select>
              </div>
            </div>
          </div>
        )}
        
        {/* Results count and items per page */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-2">
          <div className="text-sm text-gray-500 mb-2 sm:mb-0">
            Showing {indexOfFirstTraining + 1}-{Math.min(indexOfLastTraining, filteredData.length)} of {filteredData.length} results
          </div>
          <div className="flex items-center">
            <label className="text-sm text-gray-500 mr-2">Items per page:</label>
            <select
              value={trainingsPerPage}
              onChange={handleTrainingsPerPageChange}
              className="px-2 text-gray-500 py-1 border rounded text-sm"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={30}>30</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table View */}
      {viewMode === "table" && (
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg bg-white">
          <table
            id="training-table"
            className="min-w-full text-sm text-left text-gray-500"
          >
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">Created by</th>
                <th scope="col" className="px-6 py-3">Name of Training</th>
                <th scope="col" className="px-6 py-3">Created Date</th>
                <th scope="col" className="px-6 py-3">Action</th>
              </tr>
            </thead>

            <tbody>
              {currentTrainings.length > 0 ? (
                currentTrainings.map((training) => (
                  <tr key={training.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{training.created_by.phone}</td>
                    <td className="px-6 py-4">{training.name}</td>
                    <td className="px-6 py-4">
                      {training.created_at
                        ? new Date(training.created_at).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-4">
                        <Link to={`/admin/viewtraining/${training.id}`} className="text-blue-500 hover:text-blue-700 transition">
                          <FontAwesomeIcon icon={faEye} className="mr-1" />
                          <span className="hidden sm:inline">View</span>
                        </Link>
                        <Link to={`/admin/edittraining/${training.id}`} className="text-green-500 hover:text-green-700 transition">
                          <FontAwesomeIcon icon={faEdit} className="mr-1" />
                          <span className="hidden sm:inline">Edit</span>
                        </Link>
                        <button 
                          onClick={() => handleDelete(training.id)} 
                          className="text-red-500 hover:text-red-700 transition cursor-pointer"
                        >
                          <FontAwesomeIcon icon={faTrash} className="mr-1" />
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center">
                    No trainings found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Card View */}
      {viewMode === "cards" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentTrainings.length > 0 ? (
            currentTrainings.map((training) => (
              <div key={training.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition duration-300">
                <div className="p-4 border-b">
                  <h3 className="text-lg font-semibold text-gray-800 truncate">{training.name}</h3>
                  <p className="text-sm text-gray-500">Created by: {training.created_by.phone}</p>
                </div>
                <div className="p-4">
                  <div className="mb-4">
                    <p className="text-sm text-gray-700">
                      <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 text-indigo-500" />
                      {training.created_at
                        ? new Date(training.created_at).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                  <div className="flex justify-between">
                    <Link to={`/admin/viewtraining/${training.id}`} className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm hover:bg-blue-600 transition">
                      <FontAwesomeIcon icon={faEye} className="mr-1" />
                      View
                    </Link>
                    <Link to={`/admin/edittraining/${training.id}`} className="px-3 py-1 bg-green-500 text-white rounded-full text-sm hover:bg-green-600 transition">
                      <FontAwesomeIcon icon={faEdit} className="mr-1" />
                      Edit
                    </Link>
                    <button 
                      onClick={() => handleDelete(training.id)} 
                      className="px-3 py-1 bg-red-500 text-white rounded-full text-sm hover:bg-red-600 transition"
                    >
                      <FontAwesomeIcon icon={faTrash} className="mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center p-8 bg-white rounded-lg shadow">
              <p className="text-gray-500">No trainings found</p>
            </div>
          )}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 0 && (
        <div className="flex justify-center mt-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => paginate(1)}
              disabled={currentPage === 1}
              className={`px-3 py-1 border rounded ${
                currentPage === 1 
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                  : "bg-white text-indigo-600 hover:bg-indigo-50"
              }`}
            >
              First
            </button>
            
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-3 py-1 border rounded ${
                currentPage === 1 
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                  : "bg-white text-indigo-600 hover:bg-indigo-50"
              }`}
            >
              Prev
            </button>
            
            <div className="flex">{renderPaginationButtons()}</div>
            
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 border rounded ${
                currentPage === totalPages 
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                  : "bg-white text-indigo-600 hover:bg-indigo-50"
              }`}
            >
              Next
            </button>
            
            <button
              onClick={() => paginate(totalPages)}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 border rounded ${
                currentPage === totalPages 
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                  : "bg-white text-indigo-600 hover:bg-indigo-50"
              }`}
            >
              Last
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageTrainings;
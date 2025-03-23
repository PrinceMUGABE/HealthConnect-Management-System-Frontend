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
  faChartLine, 
  faTrophy, 
  faSadTear, 
  faBalanceScale,
  faSearch,
  faDownload,
  faFilter
} from "@fortawesome/free-solid-svg-icons";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function ManagetrainingCandidates() {
  const [trainingCandidateData, settrainingCandidateData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [trainingCandidatesPerPage, setTrainingCandidatesPerPage] = useState(5);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: { start: "", end: "" }
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
      const res = await axios.get("http://127.0.0.1:8000/trainingCandidate/candidates/", axiosConfig);
      if (Array.isArray(res.data)) {
        settrainingCandidateData(res.data);
      } else {
        settrainingCandidateData([]);
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
    const confirmDelete = window.confirm("Do you want to delete this training candidate?");
    if (confirmDelete) {
      try {
        const res = await axios.delete(
          `http://127.0.0.1:8000/trainingCandidate/delete/${id}/`,
          axiosConfig
        );
        if (res.status === 204) {
          settrainingCandidateData((prevData) => prevData.filter((trainingCandidate) => trainingCandidate.id !== id));
        } else {
          alert("Failed to delete training candidate");
        }
      } catch (err) {
        alert("An error occurred while deleting the training candidate");
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

  const toggleFilterPanel = () => {
    setIsFilterOpen(!isFilterOpen);
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.autoTable({ html: "#trainingCandidate-table" });
    doc.save("trainingCandidates.pdf");
  };

  const handleDownloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "trainingCandidates");
    XLSX.writeFile(workbook, "trainingCandidates.xlsx");
  };

  const handleTrainingCandidatesPerPageChange = (e) => {
    setTrainingCandidatesPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Apply all filters and search
  const filteredData = trainingCandidateData.filter(candidate => {
    // Search query filter
    const searchInFields = [
      candidate.worker?.created_by?.phone,
      candidate.worker?.first_name,
      candidate.worker?.last_name,
      candidate.training?.name,
      candidate.created_at
    ];
    
    const matchesSearch = searchQuery === '' || 
      searchInFields.some(field => 
        field && field.toString().toLowerCase().includes(searchQuery.toLowerCase())
      );
    
    // Date range filter
    let matchesDateRange = true;
    if (filters.dateRange.start && filters.dateRange.end) {
      const candidateDate = new Date(candidate.created_at);
      const startDate = new Date(filters.dateRange.start);
      const endDate = new Date(filters.dateRange.end);
      endDate.setHours(23, 59, 59); // Include the full end date
      matchesDateRange = candidateDate >= startDate && candidateDate <= endDate;
    }
    
    return matchesSearch && matchesDateRange;
  });

  // Calculate statistics for dashboard cards
  const calculateStats = () => {
    // Group candidates by training
    const trainingGroups = {};
    trainingCandidateData.forEach(candidate => {
      if (candidate.training && candidate.training.name) {
        const trainingName = candidate.training.name;
        if (!trainingGroups[trainingName]) {
          trainingGroups[trainingName] = [];
        }
        trainingGroups[trainingName].push(candidate);
      }
    });

    // Find training with highest and lowest candidates
    let highestTraining = { name: 'None', count: 0 };
    let lowestTraining = { name: 'None', count: Infinity };
    let totalCandidates = 0;
    let totalTrainings = 0;

    Object.entries(trainingGroups).forEach(([name, candidates]) => {
      const count = candidates.length;
      totalCandidates += count;
      totalTrainings++;

      if (count > highestTraining.count) {
        highestTraining = { name, count };
      }
      if (count < lowestTraining.count) {
        lowestTraining = { name, count };
      }
    });

    // Calculate average
    const averageCandidates = totalTrainings > 0 ? (totalCandidates / totalTrainings).toFixed(1) : 0;

    // If there are no trainings, set lowest to 0
    if (lowestTraining.count === Infinity) {
      lowestTraining = { name: 'None', count: 0 };
    }

    return {
      highestTraining,
      lowestTraining,
      averageCandidates,
      totalCandidates
    };
  };

  const stats = calculateStats();

  // Prepare data for the line chart - group by month
  const prepareChartData = () => {
    const monthData = {};
    
    // Initialize with past 6 months
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today);
      d.setMonth(today.getMonth() - i);
      const monthYear = `${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear()}`;
      monthData[monthYear] = 0;
    }
    
    // Count candidates by month
    trainingCandidateData.forEach(candidate => {
      if (candidate.created_at) {
        const date = new Date(candidate.created_at);
        // Only include last 6 months
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        if (date >= sixMonthsAgo) {
          const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
          if (monthData[monthYear] !== undefined) {
            monthData[monthYear]++;
          } else {
            monthData[monthYear] = 1;
          }
        }
      }
    });
    
    // Convert to array format for chart
    return Object.entries(monthData).map(([name, count]) => ({ name, count }));
  };

  const chartData = prepareChartData();

  const indexOfLasttrainingCandidate = currentPage * trainingCandidatesPerPage;
  const indexOfFirsttrainingCandidate = indexOfLasttrainingCandidate - trainingCandidatesPerPage;
  const currenttrainingCandidates = filteredData.slice(indexOfFirsttrainingCandidate, indexOfLasttrainingCandidate);
  const totalPages = Math.ceil(filteredData.length / trainingCandidatesPerPage);

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
        Manage Training Candidates
      </h1>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-blue-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Total Candidates</p>
              <p className="text-2xl text-blue-700 font-bold">{stats.totalCandidates}</p>
            </div>
            <FontAwesomeIcon icon={faChartLine} className="text-3xl text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-green-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Highest Training</p>
              <p className="text-2xl font-bold text-blue-700">{stats.highestTraining.count}</p>
              <p className="text-xs text-gray-500 truncate max-w-xs">{stats.highestTraining.name}</p>
            </div>
            <FontAwesomeIcon icon={faTrophy} className="text-3xl text-green-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-red-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Lowest Training</p>
              <p className="text-2xl font-bold text-blue-700">{stats.lowestTraining.count}</p>
              <p className="text-xs text-gray-500 truncate max-w-xs">{stats.lowestTraining.name}</p>
            </div>
            <FontAwesomeIcon icon={faSadTear} className="text-3xl text-red-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-purple-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Average per Training</p>
              <p className="text-2xl font-bold text-blue-700">{stats.averageCandidates}</p>
            </div>
            <FontAwesomeIcon icon={faBalanceScale} className="text-3xl text-purple-500" />
          </div>
        </div>
      </div>

      {/* Line Chart */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <h2 className="text-lg font-semibold mb-4">Candidates Trend Over Time</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="count" 
                name="Candidates" 
                stroke="#8884d8" 
                activeDot={{ r: 8 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Action Buttons and Search */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex flex-col md:flex-row justify-between mb-4 gap-4">
          <div className="flex flex-col sm:flex-row gap-2">
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
              onClick={toggleFilterPanel}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded flex items-center justify-center gap-2 hover:bg-gray-300 transition"
            >
              <FontAwesomeIcon icon={faFilter} />
              <span>Filters</span>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  name="dateRange.start"
                  value={filters.dateRange.start}
                  onChange={handleFilterChange}
                  className="w-full text-gray-500 px-3 py-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  name="dateRange.end"
                  value={filters.dateRange.end}
                  onChange={handleFilterChange}
                  className="w-full text-gray-500 px-3 py-2 border rounded-md"
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Results count and items per page */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-2">
          <div className="text-sm text-gray-500 mb-2 sm:mb-0">
            Showing {indexOfFirsttrainingCandidate + 1}-{Math.min(indexOfLasttrainingCandidate, filteredData.length)} of {filteredData.length} results
          </div>
          <div className="flex items-center">
            <label className="text-sm text-gray-500 mr-2">Items per page:</label>
            <select
              value={trainingCandidatesPerPage}
              onChange={handleTrainingCandidatesPerPageChange}
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

      <div className="relative overflow-x-auto shadow-md sm:rounded-lg bg-white">
        <table
          id="trainingCandidate-table"
          className="min-w-full text-sm text-left text-gray-500"
        >
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3">Candidate</th>
              <th scope="col" className="px-6 py-3">Name of Training</th>
              <th scope="col" className="px-6 py-3">Created Date</th>
              <th scope="col" className="px-6 py-3">Action</th>
            </tr>
          </thead>

          <tbody>
            {currenttrainingCandidates.length > 0 ? (
              currenttrainingCandidates.map((trainingCandidate) => (
                <tr key={trainingCandidate.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">
                    <div>
                      {trainingCandidate.worker?.created_by?.phone}
                      {trainingCandidate.worker?.first_name && trainingCandidate.worker?.last_name && (
                        <div className="text-xs text-gray-500">
                          {trainingCandidate.worker.first_name} {trainingCandidate.worker.last_name}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">{trainingCandidate.training.name}</td>
                  <td className="px-6 py-4">
                    {trainingCandidate.created_at
                      ? new Date(trainingCandidate.created_at).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-4">
                      <Link to={`/admin/viewTrainingCandidate/${trainingCandidate.id}`} className="text-blue-500 hover:text-blue-700 transition">
                        <FontAwesomeIcon icon={faEye} className="mr-1" />
                        <span className="hidden sm:inline">View</span>
                      </Link>
                      <Link to={`/admin/editTrainingCandidate/${trainingCandidate.id}`} className="text-green-500 hover:text-green-700 transition">
                        <FontAwesomeIcon icon={faEdit} className="mr-1" />
                        <span className="hidden sm:inline">Edit</span>
                      </Link>
                      <button 
                        onClick={() => handleDelete(trainingCandidate.id)} 
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
                  No training candidates found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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

export default ManagetrainingCandidates;
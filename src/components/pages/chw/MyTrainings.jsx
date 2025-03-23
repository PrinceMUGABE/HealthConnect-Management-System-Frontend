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
  faCalendarAlt, 
  faUsers, 
  faCheckCircle, 
  faSpinner, 
  faSearch, 
  faDownload,
  faFilter
} from "@fortawesome/free-solid-svg-icons";

function CommunityHealthWorkTrainings() {
  const [trainingData, setTrainingData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [trainingsPerPage, setTrainingsPerPage] = useState(5);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const storedUserData = localStorage.getItem("userData");
  const accessToken = storedUserData
    ? JSON.parse(storedUserData).access_token
    : null;

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
    setLoading(true);
    try {
      const res = await axios.get(
        "http://127.0.0.1:8000/trainingCandidate/my_trainings/",
        axiosConfig
      );
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      handleFetch();
    }
  }, [accessToken]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page on new search
  };

  const handlePerPageChange = (e) => {
    setTrainingsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1); // Reset to first page on new filter
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

  // Enhanced search functionality
  const filteredData = trainingData.filter((training) => {
    const searchTerms = searchQuery.toLowerCase();
    
    // Apply status filter first
    if (statusFilter !== "all" && training.status !== statusFilter) {
      return false;
    }
    
    // If no search query, return all that passed status filter
    if (searchTerms === "") return true;
    
    // Search across all relevant fields
    return (
      (training.training?.created_by?.phone || "").toLowerCase().includes(searchTerms) ||
      (training.training?.name || "").toLowerCase().includes(searchTerms) ||
      (training.status || "").toLowerCase().includes(searchTerms) ||
      (training.created_at || "").includes(searchTerms)
    );
  });

  // Get statistics for dashboard cards
  const totalTrainings = trainingData.length;
  const pendingTrainings = trainingData.filter(t => t.status === "Pending").length;
  const completedTrainings = trainingData.filter(t => t.status === "Completed").length;
  const inProgressTrainings = trainingData.filter(t => t.status === "In Progress").length;

  // Enhanced pagination
  const indexOfLastTraining = currentPage * trainingsPerPage;
  const indexOfFirstTraining = indexOfLastTraining - trainingsPerPage;
  const currentTrainings = filteredData.slice(
    indexOfFirstTraining,
    indexOfLastTraining
  );
  const totalPages = Math.ceil(filteredData.length / trainingsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Pagination controls
  const renderPaginationControls = () => {
    if (totalPages <= 1) return null;
    
    const pageNumbers = [];
    
    // Always show first page
    pageNumbers.push(1);
    
    // Current range
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(currentPage + 1, totalPages - 1); i++) {
      if (!pageNumbers.includes(i)) {
        pageNumbers.push(i);
      }
    }
    
    // Always show last page if there's more than one page
    if (totalPages > 1 && !pageNumbers.includes(totalPages)) {
      // Add ellipsis if there's a gap
      if (pageNumbers[pageNumbers.length - 1] < totalPages - 1) {
        pageNumbers.push("...");
      }
      pageNumbers.push(totalPages);
    }
    
    return (
      <div className="flex items-center justify-between mt-4 px-4">
        <button 
          onClick={() => paginate(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className={`px-3 py-1 rounded border ${currentPage === 1 ? 'bg-gray-200 text-gray-500' : 'bg-white hover:bg-gray-100'}`}
        >
          Previous
        </button>
        
        <div className="flex space-x-1">
          {pageNumbers.map((page, index) => (
            page === "..." ? 
            <span key={`ellipsis-${index}`} className="px-3 py-1">...</span> :
            <button
              key={`page-${page}`}
              onClick={() => paginate(page)}
              className={`px-3 py-1 border rounded ${
                currentPage === page
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              {page}
            </button>
          ))}
        </div>
        
        <button 
          onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages || totalPages === 0}
          className={`px-3 py-1 rounded border ${currentPage === totalPages || totalPages === 0 ? 'bg-gray-200 text-gray-500' : 'bg-white hover:bg-gray-100'}`}
        >
          Next
        </button>
        
        <div className="ml-4 text-sm text-gray-600">
          Showing {indexOfFirstTraining + 1}-{Math.min(indexOfLastTraining, filteredData.length)} of {filteredData.length} trainings
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-center text-black font-bold text-2xl capitalize mb-6">
        Your Registered Trainings
      </h1>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Trainings</p>
              <p className="text-2xl font-bold text-gray-700">{totalTrainings}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <FontAwesomeIcon icon={faCalendarAlt} className="text-blue-500 text-xl" />
            </div>
          </div>
        </div>

        {/* <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Completed</p>
              <p className="text-2xl font-bold text-gray-700">{completedTrainings}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 text-xl" />
            </div>
          </div>
        </div> */}

        {/* <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">In Progress</p>
              <p className="text-2xl font-bold text-gray-700">{inProgressTrainings}</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <FontAwesomeIcon icon={faSpinner} className="text-orange-500 text-xl" />
            </div>
          </div>
        </div> */}

        {/* <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Pending</p>
              <p className="text-2xl font-bold text-gray-700">{pendingTrainings}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <FontAwesomeIcon icon={faUsers} className="text-purple-500 text-xl" />
            </div>
          </div>
        </div> */}
      </div>

      {/* Action Bar */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <Link
            to="/chw"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition flex items-center space-x-2"
          >
            <span>Enroll New Training</span>
          </Link>

          <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3 w-full md:w-auto">
            {/* Status Filter */}
            {/* <div className="relative w-full md:w-40">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FontAwesomeIcon icon={faFilter} className="text-gray-400" />
              </div>
              <select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                className="block w-full pl-10 pr-3 py-2 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div> */}

            {/* Search Bar */}
            <div className="relative w-full md:w-64">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search anything..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="block w-full pl-10 pr-3 py-2 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Items Per Page */}
            <div className="flex items-center space-x-2 w-full md:w-auto">
              <label className="text-sm text-gray-600">Show:</label>
              <select
                value={trainingsPerPage}
                onChange={handlePerPageChange}
                className="border rounded p-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={30}>30</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            {/* Download Buttons */}
            <div className="flex space-x-2 w-full md:w-auto">
              <button
                onClick={handleDownloadPDF}
                className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition flex items-center space-x-1"
              >
                <FontAwesomeIcon icon={faDownload} />
                <span>PDF</span>
              </button>
              <button
                onClick={handleDownloadExcel}
                className="px-3 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition flex items-center space-x-1"
              >
                <FontAwesomeIcon icon={faDownload} />
                <span>Excel</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            <div className="relative overflow-x-auto">
              <table
                id="training-table"
                className="min-w-full text-sm text-left text-gray-500"
              >
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3">
                      Created by
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Name of Training
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
                  {currentTrainings.length > 0 ? (
                    currentTrainings.map((training) => (
                      <tr key={training.id} className="bg-white border-b hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium">
                          {training.training?.created_by?.phone || "N/A"}
                        </td>
                        <td className="px-6 py-4">{training.training?.name || "N/A"}</td>
                        {/* <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold 
                            ${training.status === "Completed" ? "bg-green-100 text-green-800" : 
                             training.status === "In Progress" ? "bg-orange-100 text-orange-800" : 
                             "bg-blue-100 text-blue-800"}`}>
                            {training.status}
                          </span>
                        </td> */}
                        <td className="px-6 py-4">
                          {training.created_at
                            ? new Date(training.created_at).toLocaleDateString()
                            : "N/A"}
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            to={`/chw/myTrainingDetails/${training.training?.id}`}
                            className="text-blue-500 hover:text-blue-700"
                          >
                            <FontAwesomeIcon icon={faEye} className="mr-1" />
                            <span>View</span>
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-10 text-center text-gray-500">
                        {searchQuery || statusFilter !== "all" ? 
                          "No trainings match your search criteria" : 
                          "No trainings found"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {renderPaginationControls()}
          </>
        )}
      </div>
    </div>
  );
}

export default CommunityHealthWorkTrainings;
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
  faChartBar,
  faCheck,
  faTimes,
  faCalendarAlt,
  faUserGraduate
} from "@fortawesome/free-solid-svg-icons";

function AdminManageExamResults() {
  const [resultData, setresultData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [resultsPerPage, setResultsPerPage] = useState(5);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [trainingFilter, setTrainingFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  // Get unique training names and statuses for filters
  const uniqueTrainings = [...new Set(resultData.map(result => result.exam?.training?.name).filter(Boolean))];
  const uniqueStatuses = [...new Set(resultData.map(result => result.status).filter(Boolean))];

  // Stats for summary cards
  const totalResults = resultData.length;
  const passedResults = resultData.filter(result => result.status === "succeed").length;
  const failedResults = resultData.filter(result => result.status === "failed").length;
  const pendingResults = resultData.filter(result => 
    result.status !== "succeed" && result.status !== "failed"
  ).length;

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
      const res = await axios.get("http://127.0.0.1:8000/result/results/", axiosConfig);
      if (Array.isArray(res.data)) {
        setresultData(res.data);
      } else {
        setresultData([]);
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
    const confirmDelete = window.confirm("Do you want to delete this result?");
    if (confirmDelete) {
      try {
        const res = await axios.delete(
          `http://127.0.0.1:8000/result/delete/${id}/`,
          axiosConfig
        );
        if (res.status === 204) {
          setresultData((prevData) => prevData.filter((result) => result.id !== id));
        } else {
          alert("Failed to delete result");
        }
      } catch (err) {
        alert("An error occurred while deleting the result");
      }
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page on new search
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.autoTable({ html: "#result-table" });
    doc.save("results.pdf");
  };

  const handleDownloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(resultData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "results");
    XLSX.writeFile(workbook, "results.xlsx");
  };

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
    setTrainingFilter("");
    setDateFilter("");
    setCurrentPage(1);
  };

  // Apply all filters
  const filteredData = resultData.filter(result => {
    // Search query filter - comprehensive search across all fields
    const searchMatch = 
      !searchQuery || 
      (result.candidate?.worker?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      result.candidate?.worker?.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      result.candidate?.worker.created_by?.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      result.exam?.training?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      result.exam?.training?.service?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      result.status?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      result.total_marks?.toString().includes(searchQuery) ||
      (result.created_at && new Date(result.created_at).toLocaleDateString().includes(searchQuery)));

    // Status filter
    const statusMatch = !statusFilter || result.status === statusFilter;

    // Training filter
    const trainingMatch = !trainingFilter || result.exam?.training?.name === trainingFilter;

    // Date filter
    const dateMatch = !dateFilter || (
      result.created_at && new Date(result.created_at).toISOString().slice(0, 10) === dateFilter
    );

    return searchMatch && statusMatch && trainingMatch && dateMatch;
  });

  const indexOfLastresult = currentPage * resultsPerPage;
  const indexOfFirstresult = indexOfLastresult - resultsPerPage;
  const currentresults = filteredData.slice(indexOfFirstresult, indexOfLastresult);
  const totalPages = Math.ceil(filteredData.length / resultsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Advanced pagination with visible page numbers
  const renderPagination = () => {
    const pageNumbers = [];
    const maxPageNumbersToShow = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxPageNumbersToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPageNumbersToShow - 1);
    
    if (endPage - startPage + 1 < maxPageNumbersToShow) {
      startPage = Math.max(1, endPage - maxPageNumbersToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="flex justify-center items-center mt-4 space-x-1">
        <button
          onClick={() => currentPage > 1 && paginate(1)}
          disabled={currentPage === 1}
          className="px-3 py-1 border rounded-md text-sm bg-white text-gray-700 disabled:opacity-50"
        >
          First
        </button>
        <button
          onClick={() => currentPage > 1 && paginate(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 border rounded-md text-sm bg-white text-gray-700 disabled:opacity-50"
        >
          Prev
        </button>
        
        {pageNumbers.map(number => (
          <button
            key={number}
            onClick={() => paginate(number)}
            className={`px-3 py-1 border rounded-md text-sm ${
              currentPage === number
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            {number}
          </button>
        ))}
        
        <button
          onClick={() => currentPage < totalPages && paginate(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0}
          className="px-3 py-1 border rounded-md text-sm bg-white text-gray-700 disabled:opacity-50"
        >
          Next
        </button>
        <button
          onClick={() => currentPage < totalPages && paginate(totalPages)}
          disabled={currentPage === totalPages || totalPages === 0}
          className="px-3 py-1 border rounded-md text-sm bg-white text-gray-700 disabled:opacity-50"
        >
          Last
        </button>
        
        <span className="ml-4 text-sm text-gray-600">
          Showing {filteredData.length > 0 ? indexOfFirstresult + 1 : 0}-
          {Math.min(indexOfLastresult, filteredData.length)} of {filteredData.length} results
        </span>
      </div>
    );
  };

  return (
    <div className="bg-gray-50 p-6 rounded-lg shadow">
      <h1 className="text-center text-gray-800 font-bold text-2xl capitalize mb-6">
        Manage Exam Results
      </h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-blue-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-sm">Total Results</p>
              <p className="text-2xl font-bold text-gray-800">{totalResults}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <FontAwesomeIcon icon={faChartBar} className="text-blue-500 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-green-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-sm">Passed</p>
              <p className="text-2xl font-bold text-gray-800">{passedResults}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <FontAwesomeIcon icon={faCheck} className="text-green-500 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-red-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-sm">Failed</p>
              <p className="text-2xl font-bold text-gray-800">{failedResults}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <FontAwesomeIcon icon={faTimes} className="text-red-500 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-yellow-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-sm">Pending</p>
              <p className="text-2xl font-bold text-gray-800">{pendingResults}</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <FontAwesomeIcon icon={faCalendarAlt} className="text-yellow-500 text-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Action and Search Bar */}
      <div className="flex flex-col md:flex-row justify-between mb-6 space-y-4 md:space-y-0">
        <div className="flex items-center space-x-2">
          <button
            onClick={handleDownloadPDF}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition flex items-center space-x-1"
          >
            <FontAwesomeIcon icon={faDownload} />
            <span>PDF</span>
          </button>
          <button
            onClick={handleDownloadExcel}
            className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition flex items-center space-x-1"
          >
            <FontAwesomeIcon icon={faDownload} />
            <span>Excel</span>
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center space-x-1"
          >
            <FontAwesomeIcon icon={faFilter} />
            <span>{showFilters ? "Hide Filters" : "Show Filters"}</span>
          </button>
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by any field..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-10 pr-4 py-2 bg-white text-black border rounded-md w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Filter Section */}
      {showFilters && (
        <div className="bg-white p-4 rounded-lg shadow-md mb-6 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full text-gray-500 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Statuses</option>
                {uniqueStatuses.map((status, index) => (
                  <option key={index} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Training</label>
              <select
                value={trainingFilter}
                onChange={(e) => {
                  setTrainingFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full text-gray-500 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Trainings</option>
                {uniqueTrainings.map((training, index) => (
                  <option key={index} value={training}>
                    {training}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Date</label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full text-gray-500 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="flex items-end">
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition w-full"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results Per Page Selector */}
      <div className="flex justify-end mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Results per page:</span>
          <select
            value={resultsPerPage}
            onChange={(e) => {
              setResultsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="border text-gray-500 border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            {[5, 10, 25, 50, 100].map(value => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Table */}
      <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <table
            id="result-table"
            className="min-w-full text-sm text-left text-gray-500"
          >
            <thead className="text-xs text-gray-700 uppercase bg-gray-100">
              <tr>
                <th scope="col" className="px-6 py-3">
                  Firstname
                </th>
                <th scope="col" className="px-6 py-3">
                  Lastname
                </th>
                <th scope="col" className="px-6 py-3">
                  Phone
                </th>
                <th scope="col" className="px-6 py-3">
                  Training Name
                </th>
                <th scope="col" className="px-6 py-3">
                  Service Name
                </th>
                <th scope="col" className="px-6 py-3">
                  Total Marks
                </th>
                <th scope="col" className="px-6 py-3">
                  Status
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
              {currentresults.length > 0 ? (
                currentresults.map((result) => (
                  <tr key={result.id} className="bg-white border-b hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-medium">{result.candidate?.worker?.first_name || "N/A"}</td>
                    <td className="px-6 py-4">{result.candidate?.worker?.last_name || "N/A"}</td>
                    <td className="px-6 py-4">{result.candidate?.worker.created_by?.phone || "N/A"}</td>
                    <td className="px-6 py-4">{result.exam?.training?.name || "N/A"}</td>
                    <td className="px-6 py-4">{result.exam?.training?.service?.name || "N/A"}</td>
                    <td className="px-6 py-4 font-medium">{result.total_marks}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        result.status === "Passed" ? "bg-green-100 text-green-800" : 
                        result.status === "Failed" ? "bg-red-100 text-red-800" : 
                        "bg-yellow-100 text-yellow-800"
                      }`}>
                        {result.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {result.created_at
                        ? new Date(result.created_at).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <Link to={`/admin/viewresult/${result.id}`} className="hover:text-blue-700">
                          <FontAwesomeIcon icon={faEye} className="text-blue-500" />
                        </Link>
                        <Link to={`/admin/editresult/${result.id}`} className="hover:text-green-700">
                          <FontAwesomeIcon icon={faEdit} className="text-green-500" />
                        </Link>
                        <button 
                          onClick={() => handleDelete(result.id)} 
                          className="hover:text-red-700 cursor-pointer"
                        >
                          <FontAwesomeIcon icon={faTrash} className="text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="px-6 py-10 text-center text-gray-500">
                    {filteredData.length === 0 && resultData.length > 0 
                      ? "No results match your search criteria" 
                      : "No results found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {renderPagination()}
    </div>
  );
}

export default AdminManageExamResults;
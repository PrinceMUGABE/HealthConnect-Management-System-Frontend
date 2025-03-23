/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { Pie } from "react-chartjs-2";
import { Chart, ArcElement, Tooltip, Legend } from "chart.js";

Chart.register(ArcElement, Tooltip, Legend);

function CommunityHealthWorkResults() {
  const [resultData, setResultData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [resultsPerPage, setResultsPerPage] = useState(5);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [totalResults, setTotalResults] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const storedUserData = localStorage.getItem("userData");
  const accessToken = storedUserData ? JSON.parse(storedUserData).access_token : null;

  useEffect(() => {
    if (!accessToken) {
      alert("Unauthorized! Please log in again.");
      navigate("/login");
    }
  }, [accessToken, navigate]);

  const axiosConfig = useMemo(() => ({
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  }), [accessToken]);

  const handleFetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await axios.get("http://127.0.0.1:8000/result/candidate/", axiosConfig);
      const data = Array.isArray(res.data) ? res.data : [];
      setResultData(data);
      setTotalResults(data.length);
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
      if (err.response && err.response.status === 401) {
        alert("Session expired. Please log in again.");
        navigate("/login");
      }
    }
  }, [axiosConfig, navigate]);

  useEffect(() => {
    if (accessToken) {
      handleFetch();
    }
  }, [accessToken, handleFetch]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page on new search
  };

  const handleResultsPerPageChange = (e) => {
    setResultsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when changing results per page
  };

  const handleStatusFilterChange = (e) => {
    setFilterStatus(e.target.value);
    setCurrentPage(1); // Reset to first page on new filter
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.text("Community Health Worker Results", 14, 16);
    doc.autoTable({
      html: "#result-table",
      startY: 20,
      styles: { fontSize: 8 },
      columnStyles: { 0: { cellWidth: 40 } },
    });
    doc.save("health_worker_results.pdf");
  };

  const handleDownloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Results");
    XLSX.writeFile(workbook, "health_worker_results.xlsx");
  };

  const filteredData = useMemo(() => {
    return resultData.filter((result) => {
      // First filter by status if not "all"
      if (filterStatus !== "all" && result.status !== filterStatus) {
        return false;
      }

      // Then filter by search query across multiple fields
      const searchLower = searchQuery.toLowerCase();
      return (
        searchQuery === "" ||
        (result.exam?.training?.name && result.exam.training.name.toLowerCase().includes(searchLower)) ||
        (result.total_marks && result.total_marks.toString().includes(searchLower)) ||
        (result.status && result.status.toLowerCase().includes(searchLower)) ||
        (result.created_at && new Date(result.created_at).toLocaleDateString().includes(searchLower))
      );
    });
  }, [resultData, searchQuery, filterStatus]);

  const indexOfLastResult = currentPage * resultsPerPage;
  const indexOfFirstResult = indexOfLastResult - resultsPerPage;
  const currentResults = filteredData.slice(indexOfFirstResult, indexOfLastResult);
  const totalPages = Math.ceil(filteredData.length / resultsPerPage);

  const paginate = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // Calculate statistics for summary cards
  const statistics = useMemo(() => {
    const statusCounts = resultData.reduce((acc, result) => {
      acc[result.status] = (acc[result.status] || 0) + 1;
      return acc;
    }, {});

    const avgScore = resultData.length > 0
      ? (resultData.reduce((sum, item) => sum + (item.total_marks || 0), 0) / resultData.length).toFixed(1)
      : 0;

    // Updated to use "Succeeded" instead of "Passed"
    const passCount = statusCounts["succeed"] || 0;
    const passRate = resultData.length > 0
      ? ((passCount / resultData.length) * 100).toFixed(1)
      : 0;

    const latestExam = resultData.length > 0
      ? resultData.reduce((latest, current) => {
        return new Date(current.created_at) > new Date(latest.created_at) ? current : latest;
      }, resultData[0])
      : null;

    return {
      totalExams: resultData.length,
      avgScore,
      passRate,
      passCount: statusCounts["succeed"] || 0,
      failCount: statusCounts["failed"] || 0,
      latestExam
    };
  }, [resultData]);

  // Prepare data for the pie chart
  const resultStatusCounts = useMemo(() => {
    const statusCounts = resultData.reduce((acc, result) => {
      acc[result.status] = (acc[result.status] || 0) + 1;
      return acc;
    }, {});

    return {
      labels: Object.keys(statusCounts),
      datasets: [
        {
          label: "Results by Status",
          data: Object.values(statusCounts),
          backgroundColor: ["#4CAF50", "#FF6384", "#36A2EB", "#FFCE56", "#FF9F40"],
          borderColor: ["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
          borderWidth: 1,
        },
      ],
    };
  }, [resultData]);

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-center text-black font-bold text-2xl capitalize mb-6">Your Awards & Certifications</h1>

      {/* Summary Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-blue-500">
          <h3 className="text-gray-500 text-sm font-medium">Total Exams</h3>
          <p className="text-3xl font-bold text-gray-800">{statistics.totalExams}</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-green-500">
          <h3 className="text-gray-500 text-sm font-medium">Pass Rate</h3>
          <p className="text-3xl font-bold text-gray-800">{statistics.passRate}%</p>
          <p className="text-sm text-gray-600">{statistics.passCount} passed</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-yellow-500">
          <h3 className="text-gray-500 text-sm font-medium">Average Score</h3>
          <p className="text-3xl font-bold text-gray-800">{statistics.avgScore}</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-purple-500">
          <h3 className="text-gray-500 text-sm font-medium">Latest Exam</h3>
          <p className="text-lg font-semibold text-gray-800">
            {statistics.latestExam ? (
              statistics.latestExam.exam?.training?.name || "N/A"
            ) : (
              "No exams taken"
            )}
          </p>
          <p className="text-sm text-gray-600">
            {statistics.latestExam ? (
              new Date(statistics.latestExam.created_at).toLocaleDateString()
            ) : (
              ""
            )}
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row">
        {/* Pie Chart */}
        <div className="w-full md:w-1/3 p-4">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-center font-bold mb-4 text-gray-700">Results by Status</h2>
            {resultData.length > 0 ? (
              <Pie
                data={resultStatusCounts}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'bottom',
                    },
                    tooltip: {
                      callbacks: {
                        label: function (context) {
                          const label = context.label || '';
                          const value = context.raw || 0;
                          const total = context.dataset.data.reduce((a, b) => a + b, 0);
                          const percentage = Math.round((value / total) * 100);
                          return `${label}: ${value} (${percentage}%)`;
                        }
                      }
                    }
                  }
                }}
              />
            ) : (
              <div className="flex justify-center items-center h-40">
                <p className="text-gray-500">No data available</p>
              </div>
            )}
          </div>

          {/* Export buttons */}
          <div className="bg-white rounded-lg shadow-md p-4 mt-4">
            <h2 className="text-center font-bold mb-4 text-gray-700">Export Options</h2>
            <div className="flex space-x-2">
              <button
                onClick={handleDownloadPDF}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded"
              >
                Export PDF
              </button>
              <button
                onClick={handleDownloadExcel}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
              >
                Export Excel
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="w-full md:w-2/3 p-4">
          <div className="bg-white rounded-lg shadow-md p-4">
            {/* Search and filter controls */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 space-y-2 md:space-y-0">
              <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search anything..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="border text-gray-500 rounded-lg px-3 py-2 w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>

                <select
                  value={filterStatus}
                  onChange={handleStatusFilterChange}
                  className="border text-gray-500 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="succeed">Succeeded</option>
                  <option value="failed">Failed</option>
                  {/* Add other statuses if needed */}
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Show:</span>
                <select
                  value={resultsPerPage}
                  onChange={handleResultsPerPageChange}
                  className="border text-gray-500 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={30}>30</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            {/* Results count */}
            <div className="mb-2 text-sm text-gray-600">
              Showing {filteredData.length > 0 ? indexOfFirstResult + 1 : 0} to {Math.min(indexOfLastResult, filteredData.length)} of {filteredData.length} results
              {searchQuery && ` (filtered from ${totalResults} total)`}
            </div>

            {/* Table */}
            <div className="relative overflow-x-auto sm:rounded-lg">
              {isLoading ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <table id="result-table" className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3">Training</th>
                      <th scope="col" className="px-6 py-3">Score</th>
                      <th scope="col" className="px-6 py-3">Status</th>
                      <th scope="col" className="px-6 py-3">Date</th>
                      <th scope="col" className="px-6 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentResults.length > 0 ? (
                      currentResults.map((result) => (
                        <tr key={result.id} className="bg-white border-b hover:bg-gray-50">
                          <td className="px-6 py-4 font-medium text-gray-900">{result.exam?.training?.name || "N/A"}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${result.status === "Passed" ? "bg-green-100 text-green-800" :
                                result.status === "Failed" ? "bg-red-100 text-red-800" :
                                  "bg-gray-100 text-gray-800"
                              }`}>
                              {result.total_marks}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${result.status === "Succeeded" ? "bg-green-100 text-green-800" :
                                result.status === "Failed" ? "bg-red-100 text-red-800" :
                                  "bg-blue-100 text-blue-800"
                              }`}>
                              {result.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {result.created_at ? new Date(result.created_at).toLocaleDateString() : "N/A"}
                          </td>
                          <td className="px-6 py-4">
                            <Link
                              to={`/chw/viewCertificate/${result.id}`}
                              className="text-blue-600 hover:text-blue-900 hover:underline"
                            >
                              View certificate
                            </Link>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-6 py-10 text-center text-gray-500">
                          {searchQuery ? (
                            <>
                              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <p className="mt-1">No results match your search criteria.</p>
                              <button
                                onClick={() => setSearchQuery("")}
                                className="mt-2 text-blue-600 hover:text-blue-900"
                              >
                                Clear search
                              </button>
                            </>
                          ) : (
                            <>
                              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <p className="mt-1">No results found</p>
                            </>
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* Improved Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-4">
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border text-sm font-medium ${currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-500 hover:bg-gray-50'
                      }`}
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>

                  {/* First page */}
                  {currentPage > 3 && (
                    <>
                      <button
                        onClick={() => paginate(1)}
                        className="relative inline-flex items-center px-4 py-2 border text-sm font-medium bg-white text-gray-700 hover:bg-gray-50"
                      >
                        1
                      </button>
                      {currentPage > 4 && (
                        <span className="relative inline-flex items-center px-4 py-2 border text-sm font-medium bg-white text-gray-700">
                          ...
                        </span>
                      )}
                    </>
                  )}

                  {/* Page numbers */}
                  {[...Array(totalPages)].map((_, i) => {
                    const pageNumber = i + 1;
                    // Show current page, one before, and one after
                    if (
                      pageNumber === currentPage ||
                      pageNumber === currentPage - 1 ||
                      pageNumber === currentPage + 1
                    ) {
                      return (
                        <button
                          key={i}
                          onClick={() => paginate(pageNumber)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === pageNumber
                              ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                              : 'bg-white text-gray-500 hover:bg-gray-50'
                            }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    }
                    return null;
                  })}

                  {/* Last page */}
                  {currentPage < totalPages - 2 && (
                    <>
                      {currentPage < totalPages - 3 && (
                        <span className="relative inline-flex items-center px-4 py-2 border text-sm font-medium bg-white text-gray-700">
                          ...
                        </span>
                      )}
                      <button
                        onClick={() => paginate(totalPages)}
                        className="relative inline-flex items-center px-4 py-2 border text-sm font-medium bg-white text-gray-700 hover:bg-gray-50"
                      >
                        {totalPages}
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border text-sm font-medium ${currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-500 hover:bg-gray-50'
                      }`}
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CommunityHealthWorkResults;
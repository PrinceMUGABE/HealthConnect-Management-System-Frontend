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
  faChartBar, 
  faFileExcel, 
  faFilePdf, 
  faSortAmountDown, 
  faSortAmountUp,
  faSearch
} from "@fortawesome/free-solid-svg-icons";

function CommunityHealthWorkManageReports() {
  const [reportData, setReportData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [reportsPerPage, setReportsPerPage] = useState(5);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [newReport, setNewReport] = useState({ activity: "", number: "" });
  const [sortField, setSortField] = useState("created_date");
  const [sortDirection, setSortDirection] = useState("desc");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState({ start: "", end: "" });
  const [totalReports, setTotalReports] = useState(0);
  const [averageNumber, setAverageNumber] = useState(0);
  const [highestNumber, setHighestNumber] = useState(0);
  const [lowestNumber, setLowestNumber] = useState(0);
  const navigate = useNavigate();

  const storedUserData = localStorage.getItem("userData");
  const accessToken = storedUserData ? JSON.parse(storedUserData).access_token : null;

  const axiosConfig = {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  };

  useEffect(() => {
    if (!accessToken) {
      alert("Unauthorized! Please log in again.");
      navigate("/login");
    }
  }, [accessToken, navigate]);

  const handleFetch = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/report/user/", axiosConfig);
      if (Array.isArray(res.data)) {
        setReportData(res.data);
        calculateStatistics(res.data);
      } else {
        setReportData([]);
      }
    } catch (err) {
      if (err.response && err.response.status === 401) {
        alert("Session expired. Please log in again.");
        navigate("/login");
      } else {
        console.error("Error fetching reports:", err);
      }
    }
  };

  const calculateStatistics = (data) => {
    setTotalReports(data.length);
    
    if (data.length > 0) {
      const numbers = data.map(item => parseInt(item.number));
      const sum = numbers.reduce((acc, curr) => acc + curr, 0);
      setAverageNumber(Math.round(sum / numbers.length));
      setHighestNumber(Math.max(...numbers));
      setLowestNumber(Math.min(...numbers));
    }
  };

  useEffect(() => {
    if (accessToken) {
      handleFetch();
    }
  }, [accessToken]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.text("Community Health Work Reports", 14, 16);
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 24);
    
    // Add statistics
    doc.text(`Total Reports: ${totalReports}`, 14, 32);
    doc.text(`Average Number: ${averageNumber}`, 14, 40);
    
    doc.autoTable({ 
      head: [['Activity', 'Number', 'Created Date']],
      body: filteredData.map(report => [
        report.activity || 'N/A',
        report.number,
        new Date(report.created_date).toLocaleDateString()
      ]),
      startY: 50
    });
    
    doc.save("community_health_reports.pdf");
  };

  const handleDownloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredData.map(report => ({
      Activity: report.activity || 'N/A',
      Number: report.number,
      'Created Date': new Date(report.created_date).toLocaleDateString()
    })));
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reports");
    XLSX.writeFile(workbook, "community_health_reports.xlsx");
  };

  const handleCreateReport = async () => {
    try {
      const res = await axios.post("http://127.0.0.1:8000/report/create/", newReport, axiosConfig);
      setShowCreateModal(false);
      setNewReport({ activity: "", number: "" });
      handleFetch(); // Refresh the report list
    } catch (error) {
      console.error("Error creating report:", error);
    }
  };

  const handleEdit = (report) => {
    setSelectedReport(report);
    setShowEditModal(true);
  };

  const handleUpdateReport = async () => {
    try {
      await axios.put(`http://127.0.0.1:8000/report/update/${selectedReport.id}/`, selectedReport, axiosConfig);
      setShowEditModal(false);
      handleFetch(); // Refresh the report list
    } catch (error) {
      console.error("Error updating report:", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this report?")) {
      try {
        await axios.delete(`http://127.0.0.1:8000/report/delete/${id}/`, axiosConfig);
        handleFetch(); // Refresh the report list
      } catch (error) {
        console.error("Error deleting report:", error);
      }
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleReportsPerPageChange = (e) => {
    setReportsPerPage(parseInt(e.target.value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Apply filters and sorting
  const filteredData = reportData.filter(report => {
    // Check if any field matches the search query
    const matchesSearch = 
      (report.activity && report.activity.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (report.number && report.number.toString().includes(searchQuery)) ||
      (report.created_date && report.created_date.includes(searchQuery));
    
    // Apply date filter if set
    const matchesDateFilter = (!dateFilter.start || new Date(report.created_date) >= new Date(dateFilter.start)) &&
                             (!dateFilter.end || new Date(report.created_date) <= new Date(dateFilter.end));
    
    return matchesSearch && matchesDateFilter;
  });

  // Apply sorting
  const sortedData = [...filteredData].sort((a, b) => {
    if (sortField === "number") {
      return sortDirection === "asc" 
        ? parseInt(a.number) - parseInt(b.number)
        : parseInt(b.number) - parseInt(a.number);
    } else if (sortField === "created_date") {
      return sortDirection === "asc"
        ? new Date(a.created_date) - new Date(b.created_date)
        : new Date(b.created_date) - new Date(a.created_date);
    } else {
      // For string fields like activity
      if (!a[sortField]) return sortDirection === "asc" ? 1 : -1;
      if (!b[sortField]) return sortDirection === "asc" ? -1 : 1;
      
      return sortDirection === "asc"
        ? a[sortField].localeCompare(b[sortField])
        : b[sortField].localeCompare(a[sortField]);
    }
  });

  const indexOfLastReport = currentPage * reportsPerPage;
  const indexOfFirstReport = indexOfLastReport - reportsPerPage;
  const currentReports = sortedData.slice(indexOfFirstReport, indexOfLastReport);
  const totalPages = Math.ceil(sortedData.length / reportsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
      <h1 className="text-center text-gray-800 font-bold text-2xl capitalize mb-6">
        Manage Your Reports
      </h1>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-blue-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Total Reports</p>
              <p className="text-2xl font-bold text-gray-800">{totalReports}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <FontAwesomeIcon icon={faChartBar} className="text-blue-500 text-xl" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-green-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Average Number</p>
              <p className="text-2xl font-bold text-gray-800">{averageNumber}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <FontAwesomeIcon icon={faChartBar} className="text-green-500 text-xl" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-purple-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Highest Number</p>
              <p className="text-2xl font-bold text-gray-800">{highestNumber}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <FontAwesomeIcon icon={faSortAmountUp} className="text-purple-500 text-xl" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-yellow-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Lowest Number</p>
              <p className="text-2xl font-bold text-gray-800">{lowestNumber}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <FontAwesomeIcon icon={faSortAmountDown} className="text-yellow-500 text-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons and Search */}
      <div className="flex flex-col md:flex-row justify-between mb-4 gap-4">
        <div className="flex flex-col md:flex-row gap-2">
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            onClick={() => setShowCreateModal(true)}
          >
            <FontAwesomeIcon icon={faEdit} />
            <span>Create New Report</span>
          </button>
          
          <div className="flex gap-2">
            <button
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              onClick={handleDownloadExcel}
            >
              <FontAwesomeIcon icon={faFileExcel} />
              <span>Excel</span>
            </button>
            
            <button
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              onClick={handleDownloadPDF}
            >
              <FontAwesomeIcon icon={faFilePdf} />
              <span>PDF</span>
            </button>
          </div>
        </div>

        <div className="relative flex items-center">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by any field..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-10 pr-4 py-2 bg-white text-gray-500 border rounded-full w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button 
            className="ml-2 p-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            <FontAwesomeIcon icon={faFilter} />
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      {isFilterOpen && (
        <div className="bg-white p-4 mb-4 rounded-lg shadow border">
          <h3 className="font-medium text-gray-700 mb-3">Advanced Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={dateFilter.start}
                onChange={(e) => setDateFilter({ ...dateFilter, start: e.target.value })}
                className="w-full text-gray-500 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={dateFilter.end}
                onChange={(e) => setDateFilter({ ...dateFilter, end: e.target.value })}
                className="w-full text-gray-500 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors mr-2"
              onClick={() => setDateFilter({ start: "", end: "" })}
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-4">
        <div className="flex justify-between p-4 border-b">
          <h2 className="font-semibold text-gray-700">Reports List</h2>
          <div className="flex items-center">
            <label className="text-sm text-gray-600 mr-2">Show:</label>
            <select
              value={reportsPerPage}
              onChange={handleReportsPerPageChange}
              className="border text-gray-500 rounded px-2 py-1 text-sm"
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="30">30</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>
        
        <div className="overflow-auto" style={{ maxHeight: "400px" }}>
          <table id="report-table" className="min-w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
              <tr>
                <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => handleSort("activity")}>
                  <div className="flex items-center">
                    Activity
                    {sortField === "activity" && (
                      <FontAwesomeIcon 
                        icon={sortDirection === "asc" ? faSortAmountUp : faSortAmountDown} 
                        className="ml-1 text-gray-500" 
                      />
                    )}
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => handleSort("number")}>
                  <div className="flex items-center">
                    Number
                    {sortField === "number" && (
                      <FontAwesomeIcon 
                        icon={sortDirection === "asc" ? faSortAmountUp : faSortAmountDown} 
                        className="ml-1 text-gray-500" 
                      />
                    )}
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => handleSort("created_date")}>
                  <div className="flex items-center">
                    Created Date
                    {sortField === "created_date" && (
                      <FontAwesomeIcon 
                        icon={sortDirection === "asc" ? faSortAmountUp : faSortAmountDown} 
                        className="ml-1 text-gray-500" 
                      />
                    )}
                  </div>
                </th>
                <th scope="col" className="px-6 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {currentReports.length > 0 ? (
                currentReports.map((report) => (
                  <tr key={report.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{report.activity || "N/A"}</td>
                    <td className="px-6 py-4">{report.number}</td>
                    <td className="px-6 py-4">
                      {report.created_date
                        ? new Date(report.created_date).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <button 
                          className="text-green-500 hover:text-green-700 transition-colors"
                          onClick={() => handleEdit(report)}
                          title="Edit"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button 
                          className="text-red-500 hover:text-red-700 transition-colors"
                          onClick={() => handleDelete(report.id)}
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
                  <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                    No reports found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-col md:flex-row justify-between items-center mt-4">
        <div className="text-sm text-gray-600 mb-2 md:mb-0">
          Showing {indexOfFirstReport + 1} to {Math.min(indexOfLastReport, sortedData.length)} of {sortedData.length} entries
        </div>
        
        <nav className="relative z-0 inline-flex shadow-sm rounded-md">
          <button
            onClick={() => currentPage > 1 && paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-3 py-2 rounded-l-md border text-sm font-medium ${
              currentPage === 1 
                ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                : "bg-white text-gray-500 hover:bg-gray-100"
            }`}
          >
            Previous
          </button>
          
          {totalPages <= 7 ? (
            // Show all pages if there are 7 or fewer
            Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => paginate(i + 1)}
                className={`px-3 py-2 border text-sm font-medium ${
                  currentPage === i + 1 
                    ? "bg-blue-600 text-white" 
                    : "bg-white text-gray-500 hover:bg-gray-100"
                }`}
              >
                {i + 1}
              </button>
            ))
          ) : (
            // Show limited pages with ellipsis for many pages
            <>
              {/* First page always shown */}
              <button
                onClick={() => paginate(1)}
                className={`px-3 py-2 border text-sm font-medium ${
                  currentPage === 1 ? "bg-blue-600 text-white" : "bg-white text-gray-500 hover:bg-gray-100"
                }`}
              >
                1
              </button>
              
              {/* Show ellipsis if not near start */}
              {currentPage > 3 && (
                <span className="px-3 py-2 border text-sm font-medium bg-white text-gray-500">
                  ...
                </span>
              )}
              
              {/* Show current page and neighbors */}
              {Array.from({ length: 3 }, (_, i) => {
                const pageNum = currentPage - 1 + i;
                if (pageNum > 1 && pageNum < totalPages) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => paginate(pageNum)}
                      className={`px-3 py-2 border text-sm font-medium ${
                        currentPage === pageNum 
                          ? "bg-blue-600 text-white" 
                          : "bg-white text-gray-500 hover:bg-gray-100"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                }
                return null;
              })}
              
              {/* Show ellipsis if not near end */}
              {currentPage < totalPages - 2 && (
                <span className="px-3 py-2 border text-sm font-medium bg-white text-gray-500">
                  ...
                </span>
              )}
              
              {/* Last page always shown */}
              <button
                onClick={() => paginate(totalPages)}
                className={`px-3 py-2 border text-sm font-medium ${
                  currentPage === totalPages 
                    ? "bg-blue-600 text-white" 
                    : "bg-white text-gray-500 hover:bg-gray-100"
                }`}
              >
                {totalPages}
              </button>
            </>
          )}
          
          <button
            onClick={() => currentPage < totalPages && paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-3 py-2 rounded-r-md border text-sm font-medium ${
              currentPage === totalPages 
                ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                : "bg-white text-gray-500 hover:bg-gray-100"
            }`}
          >
            Next
          </button>
        </nav>
      </div>

      {/* Create Report Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Create New Report</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Activity</label>
              <input
                type="text"
                placeholder="Enter activity name"
                value={newReport.activity}
                onChange={(e) => setNewReport({ ...newReport, activity: e.target.value })}
                className="w-full text-gray-500 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Number</label>
              <input
                type="number"
                placeholder="Enter number"
                value={newReport.number}
                onChange={(e) => setNewReport({ ...newReport, number: e.target.value })}
                className="w-full text-gray-500 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button 
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
              <button 
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                onClick={handleCreateReport}
              >
                Create Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Report Modal */}
      {showEditModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Edit Report</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Activity</label>
              <input
                type="text"
                placeholder="Enter activity name"
                value={selectedReport.activity}
                onChange={(e) => setSelectedReport({ ...selectedReport, activity: e.target.value })}
                className="w-full text-gray-500 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Number</label>
              <input
                type="number"
                placeholder="Enter number"
                value={selectedReport.number}
                onChange={(e) => setSelectedReport({ ...selectedReport, number: e.target.value })}
                className="w-full text-gray-500 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button 
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </button>
              <button 
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                onClick={handleUpdateReport}
              >
                Update Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CommunityHealthWorkManageReports;
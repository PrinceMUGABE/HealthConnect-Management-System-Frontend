/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faTrash,
  faDownload,
  faCalendarAlt,
  faFilter,
  faSearch,
  faChartLine,
  faTable
} from "@fortawesome/free-solid-svg-icons";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

function AdminManageReports() {
  const [reportData, setReportData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [reportsPerPage, setReportsPerPage] = useState(5);
  const [searchQuery, setSearchQuery] = useState("");
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewedReport, setViewedReport] = useState(null);
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: ""
  });
  const [totalReports, setTotalReports] = useState(0);
  const [reportsThisMonth, setReportsThisMonth] = useState(0);
  const [reportsLastMonth, setReportsLastMonth] = useState(0);
  const [averageNumber, setAverageNumber] = useState(0);
  const [showChartView, setShowChartView] = useState(false);
  const [monthlyData, setMonthlyData] = useState([]);

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

  useEffect(() => {
    if (accessToken) {
      fetchReports();
    }
  }, [accessToken]);

  const fetchReports = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/report/reports/', axiosConfig);
      setReportData(response.data);
      calculateStats(response.data);
      generateMonthlyData(response.data);
    } catch (error) {
      console.error("Error fetching reports:", error);
    }
  };

  const calculateStats = (data) => {
    // Total reports
    setTotalReports(data.length);

    // Current month and reports
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const thisMonthReports = data.filter(report => {
      const reportDate = new Date(report.created_date);
      return reportDate.getMonth() === currentMonth && reportDate.getFullYear() === currentYear;
    });
    setReportsThisMonth(thisMonthReports.length);

    // Last month reports
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const lastMonthReports = data.filter(report => {
      const reportDate = new Date(report.created_date);
      return reportDate.getMonth() === lastMonth && reportDate.getFullYear() === lastMonthYear;
    });
    setReportsLastMonth(lastMonthReports.length);

    // Average number value
    const sum = data.reduce((acc, report) => acc + (Number(report.number) || 0), 0);
    setAverageNumber(data.length ? (sum / data.length).toFixed(2) : 0);
  };

  // Replace the existing generateMonthlyData function with this one
  const generateMonthlyData = (data) => {
    // Sort the reports by date
    const sortedReports = [...data].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));

    if (sortedReports.length === 0) {
      setMonthlyData([]);
      return;
    }

    // Determine the date range and appropriate grouping
    const firstDate = new Date(sortedReports[0].created_date);
    const lastDate = new Date(sortedReports[sortedReports.length - 1].created_date);
    const diffDays = Math.round((lastDate - firstDate) / (1000 * 60 * 60 * 24));

    let timePoints = [];
    let format = '';

    // Choose grouping based on the date range
    if (diffDays <= 7) {
      // Daily grouping for short ranges
      format = 'MMM dd';
      const timeMap = new Map();

      sortedReports.forEach(report => {
        const reportDate = new Date(report.created_date);
        const key = reportDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });

        if (!timeMap.has(key)) {
          timeMap.set(key, {
            reports: 0,
            total: 0,
            date: new Date(reportDate)
          });
        }

        const data = timeMap.get(key);
        data.reports += 1;
        data.total += (Number(report.number) || 0);
      });

      timeMap.forEach((value, key) => {
        timePoints.push({
          name: key,
          reports: value.reports,
          average: value.reports ? (value.total / value.reports).toFixed(1) : 0,
          timestamp: value.date.getTime() // For sorting
        });
      });
    } else if (diffDays <= 90) {
      // Weekly grouping for medium ranges
      format = 'MMM dd';
      const timeMap = new Map();

      sortedReports.forEach(report => {
        const reportDate = new Date(report.created_date);
        // Get start of week
        const dayOfWeek = reportDate.getDay();
        const startOfWeek = new Date(reportDate);
        startOfWeek.setDate(reportDate.getDate() - dayOfWeek);

        const key = startOfWeek.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });

        if (!timeMap.has(key)) {
          timeMap.set(key, {
            reports: 0,
            total: 0,
            date: new Date(startOfWeek)
          });
        }

        const data = timeMap.get(key);
        data.reports += 1;
        data.total += (Number(report.number) || 0);
      });

      timeMap.forEach((value, key) => {
        timePoints.push({
          name: `Week of ${key}`,
          reports: value.reports,
          average: value.reports ? (value.total / value.reports).toFixed(1) : 0,
          timestamp: value.date.getTime() // For sorting
        });
      });
    } else {
      // Monthly grouping for long ranges
      format = 'MMM yyyy';
      const timeMap = new Map();

      sortedReports.forEach(report => {
        const reportDate = new Date(report.created_date);
        const key = reportDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

        if (!timeMap.has(key)) {
          timeMap.set(key, {
            reports: 0,
            total: 0,
            date: new Date(reportDate.getFullYear(), reportDate.getMonth(), 1)
          });
        }

        const data = timeMap.get(key);
        data.reports += 1;
        data.total += (Number(report.number) || 0);
      });

      timeMap.forEach((value, key) => {
        timePoints.push({
          name: key,
          reports: value.reports,
          average: value.reports ? (value.total / value.reports).toFixed(1) : 0,
          timestamp: value.date.getTime() // For sorting
        });
      });
    }

    // Sort timepoints chronologically
    timePoints.sort((a, b) => a.timestamp - b.timestamp);

    setMonthlyData(timePoints);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleDateRangeChange = (e) => {
    const { name, value } = e.target;
    setDateRange({ ...dateRange, [name]: value });
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleReportsPerPageChange = (e) => {
    setReportsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const resetFilters = () => {
    setSearchQuery("");
    setDateRange({ startDate: "", endDate: "" });
    setCurrentPage(1);
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.text("Reports Data", 14, 16);
    doc.autoTable({
      html: "#report-table",
      startY: 20,
      styles: { fontSize: 8 },
      columnStyles: { 0: { cellWidth: 40 } }
    });
    doc.save("reports.pdf");
  };

  const handleDownloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reports");
    XLSX.writeFile(workbook, "reports.xlsx");
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this report?")) {
      try {
        await axios.delete(`http://127.0.0.1:8000/report/delete/${id}/`, axiosConfig);
        fetchReports();
      } catch (error) {
        console.error("Error deleting report:", error);
      }
    }
  };

  const handleView = async (report) => {
    try {
      const userRes = await axios.get(`http://127.0.0.1:8000/report/${report.id}/`, axiosConfig);
      setUserData(userRes.data);
      setViewedReport(report);
      setShowViewModal(true);
    } catch (error) {
      alert("Error fetching report details. Please try again.");
      console.error("Error fetching user data:", error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  // Filter data based on search query and date range
  const filteredData = reportData.filter((report) => {
    const matchesSearch =
      (report.activity?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (report.number?.toString().includes(searchQuery)) ||
      (report.created_date?.includes(searchQuery)) ||
      (userData?.created_by?.username?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (userData?.created_by?.email?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (userData?.created_by?.phone?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (userData?.created_by?.role?.toLowerCase().includes(searchQuery.toLowerCase()));

    const reportDate = new Date(report.created_date);
    const startDateFilter = dateRange.startDate ? new Date(dateRange.startDate) : null;
    const endDateFilter = dateRange.endDate ? new Date(dateRange.endDate) : null;

    const matchesDateRange =
      (!startDateFilter || reportDate >= startDateFilter) &&
      (!endDateFilter || reportDate <= endDateFilter);

    return matchesSearch && matchesDateRange;
  });

  // Pagination
  const indexOfLastReport = currentPage * reportsPerPage;
  const indexOfFirstReport = indexOfLastReport - reportsPerPage;
  const currentReports = filteredData.slice(indexOfFirstReport, indexOfLastReport);
  const totalPages = Math.ceil(filteredData.length / reportsPerPage);

  // Generate pagination items
  const renderPaginationItems = () => {
    const pageItems = [];
    const maxVisiblePages = 5;

    // Always show first page
    pageItems.push(
      <button
        key="first"
        onClick={() => paginate(1)}
        className={`px-3 py-1 border ${currentPage === 1 ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'} hover:bg-gray-100`}
      >
        1
      </button>
    );

    // Calculate range of pages to show
    let startPage = Math.max(2, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 3);

    if (startPage > 2) {
      pageItems.push(<span key="ellipsis1" className="px-2">...</span>);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageItems.push(
        <button
          key={i}
          onClick={() => paginate(i)}
          className={`px-3 py-1 border ${currentPage === i ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'} hover:bg-gray-100`}
        >
          {i}
        </button>
      );
    }

    if (endPage < totalPages - 1) {
      pageItems.push(<span key="ellipsis2" className="px-2">...</span>);
    }

    // Always show last page if there is more than one page
    if (totalPages > 1) {
      pageItems.push(
        <button
          key="last"
          onClick={() => paginate(totalPages)}
          className={`px-3 py-1 border ${currentPage === totalPages ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'} hover:bg-gray-100`}
        >
          {totalPages}
        </button>
      );
    }

    return pageItems;
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="bg-gray-50 min-h-screen p-4">
      <h1 className="text-center text-gray-800 font-bold text-2xl mb-6 border-b pb-2">
        Reports Management Dashboard
      </h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-blue-500">
          <h3 className="text-gray-500 text-sm font-medium">Total Reports</h3>
          <p className="text-2xl font-bold text-gray-800">{totalReports}</p>
          <p className="text-xs text-gray-500 mt-1">All time</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-green-500">
          <h3 className="text-gray-500 text-sm font-medium">This Month</h3>
          <p className="text-2xl font-bold text-gray-800">{reportsThisMonth}</p>
          <p className="text-xs text-gray-500 mt-1">
            {reportsLastMonth > 0
              ? `${((reportsThisMonth - reportsLastMonth) / reportsLastMonth * 100).toFixed(1)}% from last month`
              : "No data from last month"}
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-yellow-500">
          <h3 className="text-gray-500 text-sm font-medium">Last Month</h3>
          <p className="text-2xl font-bold text-gray-800">{reportsLastMonth}</p>
          <p className="text-xs text-gray-500 mt-1">{new Date(new Date().setMonth(new Date().getMonth() - 1)).toLocaleString('default', { month: 'long' })}</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-purple-500">
          <h3 className="text-gray-500 text-sm font-medium">Average Number</h3>
          <p className="text-2xl font-bold text-gray-800">{averageNumber}</p>
          <p className="text-xs text-gray-500 mt-1">Across all reports</p>
        </div>
      </div>

      {/* Toggle between Chart and Table */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowChartView(false)}
          className={`px-4 py-2 rounded-l-md flex items-center ${!showChartView ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          <FontAwesomeIcon icon={faTable} className="mr-2" /> Table
        </button>
        <button
          onClick={() => setShowChartView(true)}
          className={`px-4 py-2 rounded-r-md flex items-center ${showChartView ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          <FontAwesomeIcon icon={faChartLine} className="mr-2" /> Chart
        </button>
      </div>

      {/* Chart View */}
      {/* Replace the existing Chart View section with this improved version */}
      {showChartView && (
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <h2 className="text-lg font-semibold mb-4">Reports Timeline</h2>

          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" />
                <YAxis yAxisId="right" orientation="right" stroke="#10b981" />
                <Tooltip
                  formatter={(value, name) => {
                    return [value, name === "reports" ? "Reports Count" : "Average Number Value"];
                  }}
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="reports"
                  stroke="#3b82f6"
                  activeDot={{ r: 8 }}
                  name="Reports Count"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="average"
                  stroke="#10b981"
                  name="Average Number Value"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex justify-center items-center h-64 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No data available to display</p>
            </div>
          )}

          <div className="mt-4 text-sm text-gray-500">
            <p>Note: Timeline automatically adjusts based on your data range:</p>
            <ul className="list-disc list-inside ml-4 mt-1">
              <li>Daily view for 1 week or less</li>
              <li>Weekly view for up to 3 months</li>
              <li>Monthly view for longer periods</li>
            </ul>
          </div>
        </div>
      )}

      {/* Filters and Actions */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
              </span>
              <input
                type="text"
                placeholder="Search by any field..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 text-gray-700 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex flex-wrap md:flex-nowrap items-center space-y-2 md:space-y-0 md:space-x-4">
            <div className="flex items-center space-x-2">
              <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-400" />
              <input
                type="date"
                name="startDate"
                value={dateRange.startDate}
                onChange={handleDateRangeChange}
                className="px-2 py-1 text-gray-500 bg-gray-100 border rounded text-sm"
              />
              <span>to</span>
              <input
                type="date"
                name="endDate"
                value={dateRange.endDate}
                onChange={handleDateRangeChange}
                className="px-2 py-1 text-gray-500 bg-gray-100 border rounded text-sm"
              />
            </div>

            <div className="flex items-center space-x-2">
              <FontAwesomeIcon icon={faFilter} className="text-gray-400" />
              <select
                value={reportsPerPage}
                onChange={handleReportsPerPageChange}
                className="px-2 py-1 text-gray-500 bg-gray-100 border rounded text-sm"
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={30}>30 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
            </div>

            <button
              onClick={resetFilters}
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Export Buttons */}
      <div className="flex justify-end space-x-2 mb-4">
        <button
          onClick={handleDownloadPDF}
          className="flex items-center px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
        >
          <FontAwesomeIcon icon={faDownload} className="mr-1" /> PDF
        </button>
        <button
          onClick={handleDownloadExcel}
          className="flex items-center px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
        >
          <FontAwesomeIcon icon={faDownload} className="mr-1" /> Excel
        </button>
      </div>

      {/* Table */}
      {!showChartView && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table id="report-table" className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Number</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created Date</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentReports.length > 0 ? (
                  currentReports.map((report) => (
                    <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{report.activity || "N/A"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{report.number}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {report.created_date
                            ? new Date(report.created_date).toLocaleDateString()
                            : "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleView(report)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          <FontAwesomeIcon icon={faEye} />
                        </button>
                        <button
                          onClick={() => handleDelete(report.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                      No reports found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {filteredData.length > 0 && (
        <div className="flex flex-col md:flex-row justify-between items-center mt-4 bg-white p-4 rounded-lg shadow-md">
          <div className="text-sm text-gray-700 mb-2 md:mb-0">
            Showing <span className="font-medium">{indexOfFirstReport + 1}</span> to{" "}
            <span className="font-medium">
              {Math.min(indexOfLastReport, filteredData.length)}
            </span>{" "}
            of <span className="font-medium">{filteredData.length}</span> results
          </div>

          <div className="flex justify-center">
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => paginate(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${currentPage === 1 ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'
                  }`}
              >
                <span className="sr-only">Previous</span>
                &laquo;
              </button>

              {renderPaginationItems()}

              <button
                onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${currentPage === totalPages ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'
                  }`}
              >
                <span className="sr-only">Next</span>
                &raquo;
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && viewedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4 text-blue-700">
              Report Details
            </h2>
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-700">
                  <span className="font-semibold">Activity:</span> {viewedReport?.activity || "N/A"}
                </p>
                <p className="text-gray-700">
                  <span className="font-semibold">Number:</span> {viewedReport?.number || "N/A"}
                </p>
                <p className="text-gray-700">
                  <span className="font-semibold">Created Date:</span>{" "}
                  <span className="text-blue-600">
                    {formatDate(viewedReport?.created_date)}
                  </span>
                </p>
              </div>

              {userData && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h3 className="text-xl font-bold text-blue-700 mb-2">
                    User Information
                  </h3>
                  <p className="text-gray-700">
                    <span className="font-semibold">Name:</span> {userData.created_by.phone || "N/A"}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-semibold">Role:</span> {userData.created_by.role || "N/A"}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-semibold">Joined Date:</span>{" "}
                    <span className="text-blue-600">
                      {formatDate(userData.created_by.created_at)}
                    </span>
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminManageReports;
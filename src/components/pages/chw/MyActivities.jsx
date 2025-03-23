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
  faPlus, 
  faTasks, 
  faCalendarAlt, 
  faSearch, 
  faDownload,
  faFilter,
  faSort,
  faClock
} from "@fortawesome/free-solid-svg-icons";

function CommunityHealthWorkManageActivities() {
  const [activityData, setActivityData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [activitiesPerPage, setActivitiesPerPage] = useState(5);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [newActivity, setNewActivity] = useState({ name: "" });
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState("created_at");
  const [sortDirection, setSortDirection] = useState("desc");
  const [timeFilter, setTimeFilter] = useState("all");

  const navigate = useNavigate();

  const storedUserData = localStorage.getItem("userData");
  const accessToken = storedUserData
    ? JSON.parse(storedUserData).access_token
    : null;

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
    setLoading(true);
    try {
      const res = await axios.get(
        "http://127.0.0.1:8000/activity/user/",
        axiosConfig
      );
      if (Array.isArray(res.data)) {
        setActivityData(res.data);
      } else {
        setActivityData([]);
      }
    } catch (err) {
      if (err.response && err.response.status === 401) {
        alert("Session expired. Please log in again.");
        navigate("/login");
      } else {
        console.error("Error fetching activities:", err);
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
    setActivitiesPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const handleTimeFilterChange = (e) => {
    setTimeFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.autoTable({ html: "#activity-table" });
    doc.save("activities.pdf");
  };

  const handleDownloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "activities");
    XLSX.writeFile(workbook, "activities.xlsx");
  };

  const handleCreateActivity = async () => {
    if (!newActivity.name.trim()) {
      alert("Activity name cannot be empty");
      return;
    }
    
    try {
      const res = await axios.post(
        "http://127.0.0.1:8000/activity/create/",
        {
          name: newActivity.name,
        },
        axiosConfig
      );
      setShowCreateModal(false);
      setNewActivity({ name: "" });
      handleFetch(); // Refresh the activity list
    } catch (error) {
      console.error("Error creating activity:", error);
      alert("Failed to create activity: " + (error.response?.data?.message || error.message));
    }
  };

  const handleEdit = (activity) => {
    setSelectedActivity(activity);
    setShowEditModal(true);
  };

  const handleUpdateActivity = async () => {
    if (!selectedActivity.name.trim()) {
      alert("Activity name cannot be empty");
      return;
    }
    
    try {
      await axios.put(
        `http://127.0.0.1:8000/activity/update/${selectedActivity.id}/`,
        selectedActivity,
        axiosConfig
      );
      setShowEditModal(false);
      handleFetch(); // Refresh the activity list
    } catch (error) {
      console.error("Error updating activity:", error);
      alert("Failed to update activity: " + (error.response?.data?.message || error.message));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this activity?")) {
      try {
        await axios.delete(
          `http://127.0.0.1:8000/activity/delete/${id}/`,
          axiosConfig
        );
        handleFetch(); // Refresh the activity list
      } catch (error) {
        console.error("Error deleting activity:", error);
        alert("Failed to delete activity: " + (error.response?.data?.message || error.message));
      }
    }
  };

  // Filter the data based on search query and time filter
  const filterByDate = (activities, timeFilter) => {
    if (timeFilter === "all") return activities;
    
    const now = new Date();
    const cutoff = new Date();
    
    switch (timeFilter) {
      case "today":
        cutoff.setDate(now.getDate() - 1);
        break;
      case "week":
        cutoff.setDate(now.getDate() - 7);
        break;
      case "month":
        cutoff.setMonth(now.getMonth() - 1);
        break;
      case "year":
        cutoff.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return activities;
    }
    
    return activities.filter(activity => {
      const createdDate = new Date(activity.created_at);
      return createdDate >= cutoff;
    });
  };

  const filteredBySearch = activityData.filter(
    (activity) =>
      activity.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (activity.created_at && new Date(activity.created_at).toLocaleDateString().includes(searchQuery))
  );
  
  const filteredByTime = filterByDate(filteredBySearch, timeFilter);
  
  // Sort the filtered data
  const sortedData = [...filteredByTime].sort((a, b) => {
    let comparison = 0;
    
    if (sortField === 'name') {
      comparison = (a.name || '').localeCompare(b.name || '');
    } else if (sortField === 'created_at') {
      comparison = new Date(a.created_at || 0) - new Date(b.created_at || 0);
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });
  
  const filteredData = sortedData;

  // Stats for dashboard
  const totalActivities = activityData.length;
  const recentActivities = filterByDate(activityData, "week").length;
  const oldestActivity = activityData.length > 0 ? 
    new Date(Math.min(...activityData.map(a => new Date(a.created_at || Date.now()).getTime()))) : 
    null;
  const newestActivity = activityData.length > 0 ? 
    new Date(Math.max(...activityData.map(a => new Date(a.created_at || Date.now()).getTime()))) : 
    null;

  const indexOfLastActivity = currentPage * activitiesPerPage;
  const indexOfFirstActivity = indexOfLastActivity - activitiesPerPage;
  const currentActivities = filteredData.slice(
    indexOfFirstActivity,
    indexOfLastActivity
  );
  const totalPages = Math.ceil(filteredData.length / activitiesPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Enhanced pagination controls
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
          Showing {filteredData.length > 0 ? indexOfFirstActivity + 1 : 0}-{Math.min(indexOfLastActivity, filteredData.length)} of {filteredData.length} activities
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-center text-black font-bold text-2xl capitalize mb-6">
        Manage Your Activities
      </h1>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Activities</p>
              <p className="text-2xl font-bold text-gray-700">{totalActivities}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <FontAwesomeIcon icon={faTasks} className="text-blue-500 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Added This Week</p>
              <p className="text-2xl font-bold text-gray-700">{recentActivities}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <FontAwesomeIcon icon={faCalendarAlt} className="text-green-500 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">First Activity</p>
              <p className="text-sm font-medium text-gray-700">{oldestActivity ? oldestActivity.toLocaleDateString() : 'N/A'}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <FontAwesomeIcon icon={faClock} className="text-purple-500 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Latest Activity</p>
              <p className="text-sm font-medium text-gray-700">{newestActivity ? newestActivity.toLocaleDateString() : 'N/A'}</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <FontAwesomeIcon icon={faCalendarAlt} className="text-orange-500 text-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition flex items-center space-x-2"
            onClick={() => setShowCreateModal(true)}
          >
            <FontAwesomeIcon icon={faPlus} />
            <span>Create New Activity</span>
          </button>

          <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3 w-full md:w-auto">
            {/* Time Filter */}
            <div className="relative w-full md:w-40">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FontAwesomeIcon icon={faFilter} className="text-gray-400" />
              </div>
              <select
                value={timeFilter}
                onChange={handleTimeFilterChange}
                className="block text-gray-500 w-full pl-10 pr-3 py-2 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
            </div>

            {/* Search Bar */}
            <div className="relative w-full md:w-64">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search activities..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="block w-full text-gray-500 pl-10 pr-3 py-2 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Items Per Page */}
            <div className="flex items-center space-x-2 w-full md:w-auto">
              <label className="text-sm text-gray-600">Show:</label>
              <select
                value={activitiesPerPage}
                onChange={handlePerPageChange}
                className="border text-gray-500 rounded p-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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

      {/* Activity Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            <div className="relative overflow-x-auto">
              <table
                id="activity-table"
                className="min-w-full text-sm text-left text-gray-500"
              >
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => handleSort('name')}>
                      <div className="flex items-center">
                        Name
                        {sortField === 'name' && (
                          <FontAwesomeIcon 
                            icon={faSort} 
                            className="ml-1"
                            title={`Sorted ${sortDirection === 'asc' ? 'ascending' : 'descending'}`}
                          />
                        )}
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => handleSort('created_at')}>
                      <div className="flex items-center">
                        Created Date
                        {sortField === 'created_at' && (
                          <FontAwesomeIcon 
                            icon={faSort} 
                            className="ml-1"
                            title={`Sorted ${sortDirection === 'asc' ? 'ascending' : 'descending'}`}
                          />
                        )}
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentActivities.length > 0 ? (
                    currentActivities.map((activity) => (
                      <tr key={activity.id} className="bg-white border-b hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {activity.name || "N/A"}
                        </td>
                        <td className="px-6 py-4">
                          {activity.created_at
                            ? new Date(activity.created_at).toLocaleDateString()
                            : "N/A"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <button 
                              onClick={() => handleEdit(activity)}
                              className="text-green-500 hover:text-green-700"
                              title="Edit Activity"
                            >
                              <FontAwesomeIcon icon={faEdit} />
                            </button>
                            <button 
                              onClick={() => handleDelete(activity.id)}
                              className="text-red-500 hover:text-red-700"
                              title="Delete Activity"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="px-6 py-10 text-center text-gray-500">
                        {searchQuery || timeFilter !== "all" ? 
                          "No activities match your search criteria" : 
                          "No activities found"}
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

      {/* Modal for creating an activity - improved styling */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Create New Activity</h2>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="activity-name">
                  Activity Name
                </label>
                <input
                  id="activity-name"
                  type="text"
                  placeholder="Enter activity name"
                  value={newActivity.name}
                  onChange={(e) => setNewActivity({ ...newActivity, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                  onClick={handleCreateActivity}
                >
                  Create Activity
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal for editing an activity - improved styling */}
      {showEditModal && selectedActivity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Activity</h2>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="edit-activity-name">
                  Activity Name
                </label>
                <input
                  id="edit-activity-name"
                  type="text"
                  placeholder="Enter activity name"
                  value={selectedActivity.name}
                  onChange={(e) => setSelectedActivity({ ...selectedActivity, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                  onClick={handleUpdateActivity}
                >
                  Update Activity
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CommunityHealthWorkManageActivities;
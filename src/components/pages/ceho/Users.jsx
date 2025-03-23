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
  faSearch, 
  faDownload, 
  faUserPlus, 
  faUsers, 
  faUserCheck, 
  faUserShield, 
  faCalendar,
  faFilter,
  faChevronLeft, 
  faChevronRight
} from "@fortawesome/free-solid-svg-icons";

function Users() {
  const [userData, setUserData] = useState([]); // Initialize as an empty array
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(5);
  const [searchQuery, setSearchQuery] = useState("");
  const [totalUsers, setTotalUsers] = useState(0);
  const [roleFilter, setRoleFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate(); // To redirect user if unauthorized

  // Get the access token from localStorage
  const storedUserData = localStorage.getItem("userData");
  const accessToken = storedUserData
    ? JSON.parse(storedUserData).access_token
    : null; // Make sure to use `access_token` from your stored user data

  // Redirect to login if no token found
  useEffect(() => {
    if (!accessToken) {
      alert("Unauthorized! Please log in again.");
      navigate("/login"); // Redirect to login page if no token
    }
  }, [accessToken, navigate]);

  // Axios config with Authorization header
  const axiosConfig = {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json", // Ensure the content type is set
    },
  };

  // Fetch users with the stored token
  const handleFetch = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://127.0.0.1:8000/users/", axiosConfig);
      console.log("API Response:", res.data); // Log the whole response

      // Directly set user data from the response
      if (Array.isArray(res.data) && res.data.length > 0) {
        console.log("Fetched Users:", res.data); // Log users to the console
        setUserData(res.data); // Set the fetched users in state
        setTotalUsers(res.data.length);
      } else {
        console.log("No users found in response");
        setUserData([]); // Set user data to an empty array if no users found
        setTotalUsers(0);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      if (err.response && err.response.status === 401) {
        alert("Session expired. Please log in again.");
        navigate("/login"); // Redirect to login page if 401 (Unauthorized)
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

  const handleDelete = async (id) => {
    // Confirmation dialog before deletion
    const conf = window.confirm("Do you want to delete this user?");
    if (conf) {
      try {
        // Make the DELETE request to the API
        const res = await axios.delete(
          `http://127.0.0.1:8000/delete/${id}/`, // Adjusted URL to match the backend
          {
            headers: {
              Authorization: `Bearer ${accessToken}`, // Ensure authorization header is included
              "Content-Type": "application/json", // Optional, but good practice to specify
            },
          }
        );

        // Check if the response status is 204 (No Content)
        if (res.status === 204) {
          console.log("User deleted successfully");
          // Update state to remove the deleted user from the list
          setUserData((prevUserData) =>
            prevUserData.filter((user) => user.id !== id)
          );
          setTotalUsers(prev => prev - 1);
        } else {
          alert("Failed to delete user");
        }
      } catch (err) {
        // Handle error response from the server
        console.error("Error deleting user", err);
        if (err.response) {
          alert(
            `Error: ${err.response.data.message || err.response.statusText}`
          );
        } else {
          alert("An error occurred while deleting the user");
        }
      }
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleRoleFilterChange = (e) => {
    setRoleFilter(e.target.value);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleDateFilterChange = (e) => {
    setDateFilter(e.target.value);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleRowsPerPageChange = (e) => {
    setUsersPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when changing rows per page
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.text("Users Report", 14, 16);
    doc.autoTable({ 
      html: "#user-table",
      startY: 20,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });
    doc.save("users-report.pdf");
  };

  const handleDownloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Users");
    XLSX.writeFile(workbook, "users-report.xlsx");
  };

  // Determine date range for filtering
  const getDateRangeFilter = (date, range) => {
    const today = new Date();
    switch (range) {
      case "today":
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        return new Date(date) >= startOfDay;
      case "week":
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);
        return new Date(date) >= lastWeek;
      case "month":
        const lastMonth = new Date(today);
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        return new Date(date) >= lastMonth;
      default:
        return true;
    }
  };

  // Function to get data for our dashboard
  const getDashboardData = () => {
    const roleCount = {
      citizen: 0,
      chw: 0,
      ceho: 0,
      other: 0
    };

    userData.forEach(user => {
      if (user.role === "citizen") roleCount.citizen++;
      else if (user.role === "chw") roleCount.chw++;
      else if (user.role === "ceho") roleCount.ceho++;
      else roleCount.other++;
    });

    return roleCount;
  };

  // Apply all filters
  const filteredData = userData.filter(user => {
    // Search filter
    const searchFields = [
      user.phone || "",
      user.role || "",
      user.created_at || ""
    ].map(field => field.toLowerCase());
    
    const searchMatches = searchQuery === "" || 
      searchFields.some(field => field.includes(searchQuery.toLowerCase()));
    
    // Role filter
    const roleMatches = roleFilter === "all" || user.role === roleFilter;
    
    // Date filter
    const dateMatches = dateFilter === "all" || 
      getDateRangeFilter(user.created_at, dateFilter);
    
    return searchMatches && roleMatches && dateMatches;
  });

  // Function to map roles to their display names
  const getRoleDisplayName = (role) => {
    switch (role) {
      case "citizen":
        return "Citizen";
      case "chw":
        return "Community Health Worker";
      case "ceho":
        return "Community Environment Officer";
      default:
        return role; // Return the original role if no mapping found
    }
  };

  // Get role icon based on user role
  const getRoleIcon = (role) => {
    switch (role) {
      case "citizen":
        return faUsers;
      case "chw":
        return faUserCheck;
      case "ceho":
        return faUserShield;
      default:
        return faUsers;
    }
  };

  // Pagination logic
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredData.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredData.length / usersPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Dashboard statistics
  const dashboardData = getDashboardData();

  return (
    <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
      <h1 className="text-center text-black font-bold text-2xl mb-6">
        User Management Dashboard
      </h1>
      
      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-sm">Total Users</p>
              <p className="text-2xl font-bold text-blue-700">{totalUsers}</p>
            </div>
            <div className="rounded-full bg-blue-100 p-3">
              <FontAwesomeIcon icon={faUsers} className="text-blue-500 text-xl" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-sm">Health Workers</p>
              <p className="text-2xl font-bold text-blue-700">{dashboardData.chw}</p>
            </div>
            <div className="rounded-full bg-green-100 p-3">
              <FontAwesomeIcon icon={faUserCheck} className="text-green-500 text-xl" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-purple-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-sm">Environment Officers</p>
              <p className="text-2xl font-bold text-blue-700">{dashboardData.ceho}</p>
            </div>
            <div className="rounded-full bg-purple-100 p-3">
              <FontAwesomeIcon icon={faUserShield} className="text-purple-500 text-xl" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-yellow-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-sm">Citizens</p>
              <p className="text-2xl text-blue-700 font-bold">{dashboardData.citizen}</p>
            </div>
            <div className="rounded-full bg-yellow-100 p-3">
              <FontAwesomeIcon icon={faUsers} className="text-yellow-500 text-xl" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Action Bar */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Search Box */}
          <div className="relative w-full md:w-auto">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-10 pr-4 py-2 text-gray-500 bg-gray-50 border border-gray-300 rounded-lg w-full md:w-64"
            />
            <FontAwesomeIcon 
              icon={faSearch} 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
            />
          </div>
          
          {/* Filter Controls */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Role:</label>
              <select 
                value={roleFilter}
                onChange={handleRoleFilterChange}
                className="border text-gray-500 border-gray-300 rounded-lg px-3 py-1.5 bg-white"
              >
                <option value="all">All Roles</option>
                <option value="citizen">Citizen</option>
                <option value="chw">Health Worker</option>
                <option value="ceho">Environment Officer</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Created:</label>
              <select 
                value={dateFilter}
                onChange={handleDateFilterChange}
                className="border text-gray-500 border-gray-300 rounded-lg px-3 py-1.5 bg-white"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Show:</label>
              <select
                value={usersPerPage}
                onChange={handleRowsPerPageChange}
                className="border border-gray-300 text-gray-500 rounded-lg px-3 py-1.5 bg-white"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={30}>30</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2 w-full md:w-auto">
            <Link
              to="/admin/createUser"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center gap-2 hover:bg-blue-600 transition-colors"
            >
              <FontAwesomeIcon icon={faUserPlus} />
              <span>New User</span>
            </Link>
            
            <div className="dropdown relative">
              <button 
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg flex items-center gap-2 hover:bg-gray-300 transition-colors"
              >
                <FontAwesomeIcon icon={faDownload} />
                <span>Export</span>
              </button>
              <div className="dropdown-menu absolute right-0 mt-2 hidden bg-white border rounded-lg shadow-lg py-1 z-10">
                <button 
                  onClick={handleDownloadPDF} 
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  PDF
                </button>
                <button 
                  onClick={handleDownloadExcel} 
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  Excel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Results Summary */}
      <div className="mb-4 text-sm text-gray-600">
        <p>
          Showing {indexOfFirstUser + 1} to {Math.min(indexOfLastUser, filteredData.length)} of {filteredData.length} results
          {(searchQuery || roleFilter !== "all" || dateFilter !== "all") && " (filtered)"}
        </p>
      </div>
      
      {/* Users Table */}
      <div className="relative overflow-x-auto shadow-md sm:rounded-lg mb-6">
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <table
            id="user-table"
            className="w-full text-sm text-left text-gray-500"
          >
            <thead className="text-xs text-white uppercase bg-blue-600">
              <tr>
                <th scope="col" className="px-6 py-3">Phone</th>
                <th scope="col" className="px-6 py-3">Role</th>
                <th scope="col" className="px-6 py-3">Created Date</th>
                <th scope="col" className="px-6 py-3 text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              {currentUsers.length > 0 ? (
                currentUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="bg-white border-b hover:bg-gray-50 transition-colors"
                  >
                    <th
                      scope="row"
                      className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap"
                    >
                      {user.phone}
                    </th>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon 
                          icon={getRoleIcon(user.role)} 
                          className={`
                            ${user.role === 'citizen' ? 'text-yellow-500' : ''}
                            ${user.role === 'chw' ? 'text-green-500' : ''}
                            ${user.role === 'ceho' ? 'text-purple-500' : ''}
                          `}
                        />
                        {getRoleDisplayName(user.role)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faCalendar} className="text-gray-400" />
                        {user.created_at
                          ? new Date(user.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })
                          : "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-3">
                        <Link
                          to={`/admin/viewUser/${user.id}`}
                          className="text-blue-500 hover:text-blue-700 transition-colors"
                          title="View User"
                        >
                          <FontAwesomeIcon icon={faEye} />
                        </Link>
                        <Link
                          to={`/admin/editUser/${user.id}`}
                          className="text-green-500 hover:text-green-700 transition-colors"
                          title="Edit User"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </Link>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                          title="Delete User"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                    {searchQuery || roleFilter !== "all" || dateFilter !== "all" 
                      ? "No users match your search criteria"
                      : "No users found in the system"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
      
      {/* Pagination */}
      {totalPages > 0 && (
        <div className="flex justify-between items-center">
          <div>
            <span className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
          </div>
          
          <nav className="inline-flex shadow-sm -space-x-px rounded-md overflow-hidden">
            <button
              onClick={() => paginate(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center px-3 py-2 border border-gray-300 bg-white text-sm font-medium
                ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              <FontAwesomeIcon icon={faChevronLeft} className="h-4 w-4" />
            </button>
            
            {totalPages <= 7 ? (
              // Show all pages if 7 or fewer
              Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => paginate(i + 1)}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium
                    ${currentPage === i + 1
                      ? 'bg-blue-50 border-blue-500 text-blue-600 z-10'
                      : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  {i + 1}
                </button>
              ))
            ) : (
              // Show limited pages with ellipses for many pages
              <>
                {/* Always show first page */}
                <button
                  onClick={() => paginate(1)}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium
                    ${currentPage === 1
                      ? 'bg-blue-50 border-blue-500 text-blue-600 z-10'
                      : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  1
                </button>
                
                {/* Show ellipsis if not near the beginning */}
                {currentPage > 3 && (
                  <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                    ...
                  </span>
                )}
                
                {/* Show pages around current page */}
                {Array.from({ length: 5 }).map((_, i) => {
                  // Calculate the page number to show
                  let pageNum;
                  if (currentPage <= 3) {
                    // Near start, show 2-6
                    pageNum = i + 2;
                  } else if (currentPage >= totalPages - 2) {
                    // Near end, show last 5 pages
                    pageNum = totalPages - 6 + i + 2;
                  } else {
                    // Middle, show 2 before and 2 after current
                    pageNum = currentPage - 2 + i;
                  }
                  
                  // Skip if pageNum is 1 or totalPages (we show those separately)
                  // or if outside valid range
                  if (pageNum <= 1 || pageNum >= totalPages || pageNum < 1) {
                    return null;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => paginate(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium
                        ${currentPage === pageNum
                          ? 'bg-blue-50 border-blue-500 text-blue-600 z-10'
                          : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                {/* Show ellipsis if not near the end */}
                {currentPage < totalPages - 2 && (
                  <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                    ...
                  </span>
                )}
                
                {/* Always show last page */}
                <button
                  onClick={() => paginate(totalPages)}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium
                    ${currentPage === totalPages
                      ? 'bg-blue-50 border-blue-500 text-blue-600 z-10'
                      : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  {totalPages}
                </button>
              </>
            )}
            
            <button
              onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className={`relative inline-flex items-center px-3 py-2 border border-gray-300 bg-white text-sm font-medium
                ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              <FontAwesomeIcon icon={faChevronRight} className="h-4 w-4" />
            </button>
          </nav>
        </div>
      )}
      
      {/* Add this style for dropdown functionality */}
      <style jsx="true">{`
        .dropdown:hover .dropdown-menu {
          display: block;
        }
      `}</style>
    </div>
  );
}

export default Users;
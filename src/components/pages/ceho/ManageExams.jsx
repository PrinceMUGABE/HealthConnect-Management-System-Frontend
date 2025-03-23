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
  faChartBar, 
  faDownload, 
  faFilter, 
  faSearch, 
  faChevronLeft, 
  faChevronRight,
  faTable,
  faThLarge,
  faCalendarAlt,
  faUser,
  faBookOpen
} from "@fortawesome/free-solid-svg-icons";

function AdminManageExams() {
  const [examData, setExamData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [examsPerPage, setExamsPerPage] = useState(5);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filterOption, setFilterOption] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'descending' });
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'card'
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
    setIsLoading(true);
    try {
      const res = await axios.get("http://127.0.0.1:8000/exam/exams/", axiosConfig);
      setExamData(Array.isArray(res.data) ? res.data : []);
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
    const confirmDelete = window.confirm("Do you want to delete this exam?");
    if (confirmDelete) {
      try {
        const res = await axios.delete(`http://127.0.0.1:8000/exam/delete/${id}/`, axiosConfig);
        if (res.status === 204) {
          setExamData((prevData) => prevData.filter((exam) => exam.id !== id));
        } else {
          alert("Failed to delete exam");
        }
      } catch (err) {
        alert("An error occurred while deleting the exam");
      }
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.autoTable({ html: "#exam-table" });
    doc.save("exams.pdf");
  };

  const handleDownloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "exams");
    XLSX.writeFile(workbook, "exams.xlsx");
  };

  const handleExamsPerPageChange = (e) => {
    setExamsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const handleFilterChange = (e) => {
    setFilterOption(e.target.value);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const toggleViewMode = () => {
    setViewMode(viewMode === 'table' ? 'card' : 'table');
  };

  // Advanced filtering
  const filteredData = examData.filter((exam) => {
    // Global search across all fields
    const searchableFields = [
      exam.training?.name || "",
      exam.created_by?.phone || "",
      exam.created_by?.email || "",
      exam.created_at || "",
      exam.total_marks?.toString() || "",
    ];
    
    const matchesSearch = searchableFields.some(field => 
      field.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Apply additional filter
    if (filterOption === "all") return matchesSearch;
    if (filterOption === "recent") {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return matchesSearch && new Date(exam.created_at) >= oneWeekAgo;
    }
    if (filterOption === "old") {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return matchesSearch && new Date(exam.created_at) < oneWeekAgo;
    }
    
    return matchesSearch;
  });

  // Sorting
  const sortedData = [...filteredData].sort((a, b) => {
    if (sortConfig.key === 'created_at') {
      const dateA = new Date(a[sortConfig.key]);
      const dateB = new Date(b[sortConfig.key]);
      
      if (sortConfig.direction === 'ascending') {
        return dateA - dateB;
      } else {
        return dateB - dateA;
      }
    } else if (sortConfig.key === 'total_marks') {
      return sortConfig.direction === 'ascending' 
        ? a[sortConfig.key] - b[sortConfig.key]
        : b[sortConfig.key] - a[sortConfig.key];
    } else {
      // For text fields
      const valueA = a[sortConfig.key] || '';
      const valueB = b[sortConfig.key] || '';
      
      if (sortConfig.direction === 'ascending') {
        return valueA.localeCompare(valueB);
      } else {
        return valueB.localeCompare(valueA);
      }
    }
  });

  // Pagination
  const indexOfLastExam = currentPage * examsPerPage;
  const indexOfFirstExam = indexOfLastExam - examsPerPage;
  const currentExams = sortedData.slice(indexOfFirstExam, indexOfLastExam);
  const totalPages = Math.ceil(sortedData.length / examsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const openEditModal = (exam) => {
    setSelectedExam(exam);
    setIsModalOpen(true);
  };

  const closeEditModal = () => {
    setIsModalOpen(false);
    setSelectedExam(null);
  };

  const handleUpdateExam = async (updatedExam) => {
    try {
      const res = await axios.put(`http://127.0.0.1:8000/exam/update/${updatedExam.id}/`, updatedExam, axiosConfig);
      if (res.status === 200) {
        setExamData((prevData) => prevData.map((exam) => (exam.id === updatedExam.id ? updatedExam : exam)));
        closeEditModal();
      }
    } catch (err) {
      alert("An error occurred while updating the exam");
    }
  };

  // Calculate stats for dashboard cards
  const totalExams = examData.length;
  const recentExams = examData.filter(exam => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return new Date(exam.created_at) >= oneWeekAgo;
  }).length;
  
  // Group exams by training
  const trainingGroups = examData.reduce((acc, exam) => {
    const trainingName = exam.training?.name || "Unknown";
    acc[trainingName] = (acc[trainingName] || 0) + 1;
    return acc;
  }, {});
  
  // Find training with most exams
  let popularTraining = { name: "None", count: 0 };
  Object.entries(trainingGroups).forEach(([name, count]) => {
    if (count > popularTraining.count) {
      popularTraining = { name, count };
    }
  });

  // Calculate completion percentage (for demonstration: each exam is 5% towards a goal)
  const completionPercentage = Math.min(totalExams * 5, 100);

  // Format date for cards
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg shadow">
      <h1 className="text-center text-black font-bold text-2xl capitalize mb-6">Manage Exams</h1>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <h3 className="text-gray-500 text-sm uppercase">Total Exams</h3>
          <p className="text-3xl font-bold text-blue-600">{totalExams}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <h3 className="text-gray-500 text-sm uppercase">Recent Exams (7 days)</h3>
          <p className="text-3xl font-bold text-green-600">{recentExams}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
          <h3 className="text-gray-500 text-sm uppercase">Popular Training</h3>
          <p className="text-lg font-semibold text-yellow-600 truncate">{popularTraining.name}</p>
          <p className="text-sm text-gray-500">{popularTraining.count} exams</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
          <h3 className="text-gray-500 text-sm uppercase">Completion Rate</h3>
          <div className="flex items-center">
            <div className="h-2 flex-grow bg-gray-200 rounded-full mt-2">
              <div className="h-full bg-purple-500 rounded-full" style={{width: `${completionPercentage}%`}}></div>
            </div>
            <span className="ml-2 text-sm font-medium text-purple-600">{completionPercentage}%</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Based on target goal</p>
        </div>
      </div>

      {/* Action Buttons and Search Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex items-center space-x-2">
          <Link to="/admin/createExam" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow transition-colors duration-300 flex items-center">
            <span className="mr-2">+</span> Create New Exam
          </Link>
          
          {/* View Toggle */}
          <div className="bg-white border rounded-md shadow-sm overflow-hidden flex">
            <button 
              onClick={() => setViewMode('table')} 
              className={`px-3 py-2 flex items-center ${viewMode === 'table' ? 'bg-blue-100 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
              title="Table View"
            >
              <FontAwesomeIcon icon={faTable} className="mr-1" />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button 
              onClick={() => setViewMode('card')} 
              className={`px-3 py-2 flex items-center ${viewMode === 'card' ? 'bg-blue-100 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
              title="Card View"
            >
              <FontAwesomeIcon icon={faThLarge} className="mr-1" />
              <span className="hidden sm:inline">Cards</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <select 
              value={filterOption} 
              onChange={handleFilterChange}
              className="appearance-none px-4 py-2 pr-8 bg-white border rounded-md shadow-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Exams</option>
              <option value="recent">Recent (7 days)</option>
              <option value="old">Older Exams</option>
            </select>
            <FontAwesomeIcon icon={faFilter} className="absolute right-3 top-3 text-gray-400" />
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Search in any field..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-10 pr-4 py-2 bg-white text-black border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64"
            />
            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-3 text-gray-400" />
          </div>

          <div className="flex space-x-2">
            <button 
              onClick={handleDownloadPDF} 
              className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md shadow transition-colors duration-300 flex items-center"
              title="Download as PDF"
            >
              <FontAwesomeIcon icon={faDownload} className="mr-2" /> PDF
            </button>
            <button 
              onClick={handleDownloadExcel} 
              className="px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md shadow transition-colors duration-300 flex items-center"
              title="Download as Excel"
            >
              <FontAwesomeIcon icon={faDownload} className="mr-2" /> Excel
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Records count and items per page selector */}
          <div className="flex justify-between items-center p-4 bg-white border rounded-t-lg shadow-sm">
            <div className="text-sm text-gray-500">
              Showing {indexOfFirstExam + 1} to {Math.min(indexOfLastExam, sortedData.length)} of {sortedData.length} entries
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-500">Show</label>
              <select 
                value={examsPerPage} 
                onChange={handleExamsPerPageChange}
                className="border text-gray-500 rounded p-1 text-sm"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={30}>30</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm text-gray-500">entries</span>
            </div>
          </div>
          
          {/* Table View */}
          {viewMode === 'table' && (
            <div className="relative overflow-x-auto shadow-md sm:rounded-b-lg bg-white border-t-0 border">
              <table id="exam-table" className="min-w-full text-sm text-left text-gray-500 border-collapse">
                <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                  <tr>
                    <th 
                      scope="col" 
                      className="px-6 py-3 cursor-pointer hover:bg-gray-200"
                      onClick={() => handleSort('training.name')}
                    >
                      <div className="flex items-center">
                        Training
                        {sortConfig.key === 'training.name' && (
                          <span className="ml-2">
                            {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 cursor-pointer hover:bg-gray-200"
                      onClick={() => handleSort('created_by.phone')}
                    >
                      <div className="flex items-center">
                        Created by
                        {sortConfig.key === 'created_by.phone' && (
                          <span className="ml-2">
                            {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 cursor-pointer hover:bg-gray-200"
                      onClick={() => handleSort('created_at')}
                    >
                      <div className="flex items-center">
                        Created Date
                        {sortConfig.key === 'created_at' && (
                          <span className="ml-2">
                            {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-right">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {currentExams.length > 0 ? (
                    currentExams.map((exam) => (
                      <tr key={exam.id} className="bg-white border-b hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 font-medium text-gray-900">{exam.training.name}</td>
                        <td className="px-6 py-4">{exam.created_by.phone}</td>
                        <td className="px-6 py-4">
                          {exam.created_at ? formatDate(exam.created_at) : "N/A"}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-4">
                            <Link 
                              to={`/admin/viewExam/${exam.id}`}
                              className="text-blue-600 hover:text-blue-900 transition-colors duration-200"
                              title="View Exam"
                            >
                              <FontAwesomeIcon icon={faEye} />
                            </Link>
                            <button
                              onClick={() => handleDelete(exam.id)}
                              className="text-red-600 hover:text-red-900 transition-colors duration-200"
                              title="Delete Exam"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-10 text-center text-gray-500">
                        No exams found matching your criteria
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Card View */}
          {viewMode === 'card' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {currentExams.length > 0 ? (
                currentExams.map((exam) => (
                  <div key={exam.id} className="bg-white rounded-lg shadow-md overflow-hidden border hover:shadow-lg transition-shadow duration-300">
                    <div className="bg-blue-500 text-white p-4">
                      <h3 className="font-semibold text-lg truncate">{exam.training.name}</h3>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center mb-3">
                        <FontAwesomeIcon icon={faUser} className="text-gray-500 mr-2" />
                        <span className="text-gray-700">{exam.created_by.phone}</span>
                      </div>
                      <div className="flex items-center mb-4">
                        <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-500 mr-2" />
                        <span className="text-gray-700">{formatDate(exam.created_at)}</span>
                      </div>
                      <hr className="my-3" />
                      <div className="flex justify-end mt-2 space-x-3">
                        <Link 
                          to={`/admin/viewExam/${exam.id}`}
                          className="text-blue-600 hover:text-blue-900 transition-colors duration-200 p-2 bg-blue-50 rounded-full"
                          title="View Exam"
                        >
                          <FontAwesomeIcon icon={faEye} />
                        </Link>
                        <button
                          onClick={() => handleDelete(exam.id)}
                          className="text-red-600 hover:text-red-900 transition-colors duration-200 p-2 bg-red-50 rounded-full"
                          title="Delete Exam"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full p-8 text-center text-gray-500 bg-white rounded-lg shadow">
                  No exams found matching your criteria
                </div>
              )}
            </div>
          )}

          {/* Pagination */}
          <div className="flex flex-col md:flex-row justify-between items-center p-4 border-t bg-white rounded-b-lg shadow-sm mt-1">
            <div className="text-sm text-gray-500 mb-4 md:mb-0">
              Page {currentPage} of {totalPages}
            </div>
            
            <div className="flex items-center space-x-1">
              <button 
                onClick={() => paginate(1)} 
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded border ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-blue-600 hover:bg-blue-50'}`}
              >
                First
              </button>
              
              <button 
                onClick={() => paginate(currentPage - 1)} 
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded border ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-blue-600 hover:bg-blue-50'}`}
              >
                <FontAwesomeIcon icon={faChevronLeft} />
              </button>
              
              {/* Page numbers */}
              <div className="flex">
                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                  let pageNum;
                  
                  // Calculate which page numbers to show
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  // Only render if pageNum is valid
                  if (pageNum > 0 && pageNum <= totalPages) {
                    return (
                      <button
                        key={i}
                        onClick={() => paginate(pageNum)}
                        className={`px-3 py-1 rounded border ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-blue-600 hover:bg-blue-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                  return null;
                })}
              </div>
              
              <button 
                onClick={() => paginate(currentPage + 1)} 
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded border ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-blue-600 hover:bg-blue-50'}`}
              >
                <FontAwesomeIcon icon={faChevronRight} />
              </button>
              
              <button 
                onClick={() => paginate(totalPages)} 
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded border ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-blue-600 hover:bg-blue-50'}`}
              >
                Last
              </button>
            </div>
          </div>
        </>
      )}

      {/* Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4 text-black">Edit Exam</h2>
            {selectedExam && (
              <form onSubmit={(e) => {
                e.preventDefault();
                const updatedExam = {
                  id: selectedExam.id,
                  training: selectedExam.training,
                  total_marks: e.target.total_marks.value,
                  // Include other fields as necessary
                };
                handleUpdateExam(updatedExam);
              }}>
                <div className="mb-4">
                  <label htmlFor="total_marks" className="text-black block text-sm font-medium mb-1">Total Marks</label>
                  <input
                    type="number"
                    id="total_marks"
                    name="total_marks"
                    defaultValue={selectedExam.total_marks}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                {/* Add more input fields as necessary */}
                <div className="flex justify-end gap-2 mt-6">
                  <button 
                    type="button" 
                    onClick={closeEditModal} 
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Update
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminManageExams;
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { LockClosedIcon, ArrowPathIcon } from "@heroicons/react/20/solid"; // Using ArrowPathIcon for spinner

const EditTraining = () => {
  const { id } = useParams();
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false); // Loading state for spinner
  const [errorMessage, setErrorMessage] = useState(""); // Error message to show on the page
  const [newMaterials, setNewMaterials] = useState([]); // State for new materials
  const [existingMaterials, setExistingMaterials] = useState([]); // State for existing materials
  const navigate = useNavigate();

  // Fetch the training data by ID
  useEffect(() => {
    const token = localStorage.getItem("token"); // Retrieve the token from local storage

    if (!token) {
      console.error("No token found. Training is not authenticated.");
      setErrorMessage("No token found. Please login first.");
      return; // Stop the request if there's no token
    }

    setLoading(true); // Start loading before making the request
    axios
      .get(`http://127.0.0.1:8000/training/${id}/`, {
        headers: {
          Authorization: `Bearer ${token}`, // Include the token in the headers
        },
      })
      .then((res) => {
        if (res.data) {
          setData(res.data); // Set the fetched training data
          setExistingMaterials(res.data.materials || []); // Set the existing materials
        }
      })
      .catch((err) => {
        setErrorMessage(err.response?.data?.message || "Error fetching training data.");
      })
      .finally(() => {
        setLoading(false); // Stop loading after the request finishes
      });
  }, [id]);

  // Update the training data
  const handleSubmit = (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token"); // Retrieve the token from local storage

    if (!token) {
      setErrorMessage("No token found. Please login first.");
      return; // Stop the request if there's no token
    }

    setLoading(true); // Start loading when the form is submitted
    setErrorMessage(""); // Clear any previous error message

    // Create a FormData object to send data including files
    const formData = new FormData();
    formData.append("name", data.name);
    
    // Append new materials
    newMaterials.forEach((file) => {
      formData.append("materials", file); // Attach new files if they exist
    });

    axios
      .put(`http://127.0.0.1:8000/training/update/${id}/`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data", // Important for file uploads
        },
      })
      .then((res) => {
        alert("Data updated successfully");
        navigate("/admin/training"); // Navigate back to the trainings list page
      })
      .catch((err) => {
        setErrorMessage(err.response?.data?.message || "Error updating training.");
      })
      .finally(() => {
        setLoading(false); // Stop loading after the request finishes
      });
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files); // Convert FileList to Array
    setNewMaterials(files); // Update new materials state with the selected files
  };

  const handleRemoveMaterial = (index) => {
    setExistingMaterials((prev) => prev.filter((_, i) => i !== index)); // Remove material by index
  };

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8 bg-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          Update Training
        </h2>
      </div>

      {errorMessage && (
        <div className="text-red-600 text-center">
          <p>{errorMessage}</p>
        </div>
      )}

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium leading-6 text-gray-900"
            >
              Name
            </label>
            <div className="mt-2">
              <input
                id="name"
                name="name"
                type="text"
                value={data.name || ""} // Ensure 'data.name' is handled safely
                onChange={(e) => setData({ ...data, name: e.target.value })}
                required
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="existing-materials"
              className="block text-sm font-medium leading-6 text-gray-900"
            >
              Existing Materials
            </label>
            <ul className="mt-2">
              {existingMaterials.length === 0 ? (
                <li>No materials uploaded yet.</li>
              ) : (
                existingMaterials.map((material, index) => (
                  <li key={index} className="flex justify-between items-center">
                    {/* Display link for the material */}
                    <a 
                      href={material.file} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-blue-500 hover:underline"
                    >
                      {material.name}
                    </a>
                    <button
                      type="button"
                      onClick={() => handleRemoveMaterial(index)}
                      className="ml-2 text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div>
            <label
              htmlFor="materials"
              className="block text-sm font-medium leading-6 text-gray-900"
            >
              Upload New Materials
            </label>
            <div className="mt-2">
              <input
                id="materials"
                name="materials"
                type="file"
                onChange={handleFileChange} // Handle file upload
                accept=".pdf,.mp4,.avi,.mkv" // Accept only specific formats
                className="block w-full text-gray-900"
                multiple // Allow multiple uploads
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative flex w-full justify-center rounded-md bg-purple-500 px-3 py-2 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                {loading ? (
                  <ArrowPathIcon
                    className="h-5 w-5 text-white animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <LockClosedIcon
                    className="h-5 w-5 text-purple-400 group-hover:text-indigo-400"
                    aria-hidden="true"
                  />
                )}
              </span>
              {loading ? "Updating..." : "Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTraining;

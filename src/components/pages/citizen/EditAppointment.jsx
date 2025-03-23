/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { LockClosedIcon, ArrowPathIcon } from "@heroicons/react/20/solid"; // For icons

const CitizenEditAppointment = () => {
  const { id } = useParams(); // Get the appointment ID from the URL
  const [data, setData] = useState({
    first_name: "",
    last_name: "",
    worker: "", // To store the worker ID
    address: "",
    details: "",
  }); // Form data
  const [loading, setLoading] = useState(false); // Loading state
  const [errorMessage, setErrorMessage] = useState(""); // Error messages
  const [workers, setWorkers] = useState([]); // State for workers dropdown
  const navigate = useNavigate();

  // Fetch workers for dropdown
  useEffect(() => {
    const token = localStorage.getItem("token");

    const fetchWorkers = async () => {
      try {
        const response = await axios.get("http://127.0.0.1:8000/worker/workers/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setWorkers(response.data);
      } catch (error) {
        console.error("Error fetching workers:", error);
        setErrorMessage("Error fetching workers. Please try again.");
      }
    };

    fetchWorkers();
  }, []);

  // Fetch appointment details when component loads
  useEffect(() => {
    const token = localStorage.getItem("token");

    const fetchAppointment = async () => {
      try {
        const response = await axios.get(`http://127.0.0.1:8000/appointment/${id}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Set the fetched data and worker ID
        const appointmentData = response.data;
        setData({
          first_name: appointmentData.first_name,
          last_name: appointmentData.last_name,
          worker: appointmentData.appointed_to.id, // Set current worker ID
          address: appointmentData.address,
          details: appointmentData.details,
        });
      } catch (error) {
        console.error("Error fetching appointment:", error);
        setErrorMessage("Error fetching appointment. Please try again.");
      }
    };

    fetchAppointment();
  }, [id]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    setLoading(true);
    setErrorMessage(""); // Clear previous errors

    try {
      const response = await axios.put(`http://127.0.0.1:8000/appointment/update/${id}/`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      alert("Appointment updated successfully");
      navigate("/citizen/appointments"); // Navigate back to the appointments list
    } catch (error) {
      setErrorMessage("Error updating appointment. Please try again.");
      console.error("Error updating appointment:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8 bg-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          Edit Appointment
        </h2>
      </div>

      {errorMessage && (
        <div className="text-red-600 text-center">
          <p>{errorMessage}</p>
        </div>
      )}

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form className="space-y-6" onSubmit={handleSubmit}>


          {/* Address */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium leading-6 text-gray-900">Address</label>
            <div className="mt-2">
              <input
                id="address"
                name="address"
                type="text"
                value={data.address || ""}
                onChange={(e) => setData({ ...data, address: e.target.value })}
                required
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              />
            </div>
          </div>

          {/* Worker Selection */}
<div>
  <label htmlFor="worker" className="block text-sm font-medium leading-6 text-gray-900">
    Assigned Worker
  </label>
  <div className="mt-2">
    <select
      id="worker"
      name="worker"
      value={data.worker || ""}
      onChange={(e) => setData({ ...data, worker: e.target.value })}
      required
      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
    >
      <option value="">Select a worker</option>
      {workers.map((worker) => (
        <option key={worker.id} value={worker.id}>
          {worker.first_name} {worker.last_name}
        </option>
      ))}
    </select>
  </div>
</div>

          {/* Details */}
          <div>
            <label htmlFor="details" className="block text-sm font-medium leading-6 text-gray-900">Details</label>
            <div className="mt-2">
              <textarea
                id="details"
                name="details"
                value={data.details || ""}
                onChange={(e) => setData({ ...data, details: e.target.value })}
                required
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              className="group relative flex w-full justify-center rounded-md bg-purple-500 px-3 py-2 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                {loading ? (
                  <ArrowPathIcon className="h-5 w-5 animate-spin" aria-hidden="true" />
                ) : (
                  <LockClosedIcon className="h-5 w-5" aria-hidden="true" />
                )}
              </span>
              {loading ? "Updating..." : "Update Appointment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CitizenEditAppointment;

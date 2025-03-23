/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { FaSearch } from "react-icons/fa";

const CitizenCreateAppointment = () => {
  const [workers, setWorkers] = useState([]);
  const [services, setServices] = useState([]);
  const [results, setResults] = useState([]);
  const [filteredWorkers, setFilteredWorkers] = useState([]);
  
  const [data, setData] = useState({
    first_name: "",
    last_name: "",
    worker: "",
    service: "",
    address: "",
    details: "",
    due_date: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setErrorMessage("No token found. Please login first.");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const workersRes = await fetch("http://127.0.0.1:8000/worker/workers/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const workersData = await workersRes.json();
        if (!workersRes.ok) throw new Error(workersData.message || 'Failed to fetch workers');
        setWorkers(workersData);
        console.log("Workers loaded:", workersData.length);

        const servicesRes = await fetch("http://127.0.0.1:8000/service/services/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const servicesData = await servicesRes.json();
        if (!servicesRes.ok) throw new Error(servicesData.message || 'Failed to fetch services');
        setServices(servicesData);
        console.log("Services loaded:", servicesData.length);

        const resultsRes = await fetch("http://127.0.0.1:8000/result/results/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const resultsData = await resultsRes.json();
        if (!resultsRes.ok) throw new Error(resultsData.message || 'Failed to fetch results');
        setResults(resultsData);
        console.log("Results loaded:", resultsData.length);
      } catch (error) {
        setErrorMessage("Error fetching data: " + error.message);
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const validateForm = () => {
    const errors = {};
    
    if (!data.first_name) errors.first_name = "First name is required";
    if (!data.last_name) errors.last_name = "Last name is required";
    if (!data.service) errors.service = "Service is required";
    if (!data.worker) errors.worker = "Worker is required";
    if (!data.address) errors.address = "Address is required";
    if (!data.details) errors.details = "Details are required";
    if (!data.due_date) errors.due_date = "Due date is required";
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleServiceSearch = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setErrorMessage("No token found. Please login first.");
      return;
    }
    if (!data.service) {
      setFieldErrors({...fieldErrors, service: "Please select a service first."});
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setFieldErrors({});

    try {
      const response = await fetch(`http://127.0.0.1:8000/result/service/${data.service}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const workerData = await response.json();
      if (!response.ok) throw new Error(workerData.message || 'Failed to fetch workers');
      
      setFilteredWorkers(workerData);
      console.log("Found workers for service:", workerData.length);
      
      if (workerData.length === 0) {
        setErrorMessage("No workers found for this service.");
      }
    } catch (error) {
      setErrorMessage("Error fetching workers: " + error.message);
      console.error("Error fetching workers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset messages
    setErrorMessage("");
    setSuccessMessage("");
    
    // Validate form
    if (!validateForm()) {
      setErrorMessage("Please fill in all required fields.");
      return;
    }
    
    const token = localStorage.getItem("token");
    if (!token) {
      setErrorMessage("No token found. Please login first.");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("first_name", data.first_name);
    formData.append("last_name", data.last_name);
    formData.append("worker", data.worker);
    formData.append("service", data.service);
    formData.append("address", data.address);
    formData.append("details", data.details);
    formData.append("due_date", data.due_date);

    try {
      console.log("Submitting appointment data:", Object.fromEntries(formData));
      
      const response = await fetch(`http://127.0.0.1:8000/appointment/create/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error("Server error:", result);
        throw new Error(result.error || 'Failed to create appointment');
      }

      setSuccessMessage("Appointment created successfully!");
      console.log("Appointment created:", result);
      
      // Redirect after short delay
      setTimeout(() => {
        window.location.href = "/citizen/appointments";
      }, 2000);
    } catch (err) {
      setErrorMessage(err.message || "Error creating appointment.");
      console.error("Error creating appointment:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8 bg-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          Create New Appointment
        </h2>
      </div>

      {errorMessage && (
        <div className="mt-4 text-red-600 text-center bg-red-100 p-3 rounded-md border border-red-300">
          <p>{errorMessage}</p>
        </div>
      )}
      
      {successMessage && (
        <div className="mt-4 text-green-600 text-center bg-green-100 p-3 rounded-md border border-green-300">
          <p>{successMessage}</p>
        </div>
      )}

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-lg">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="flex flex-col md:flex-row md:space-x-4">
            <div className="flex-1">
              <label htmlFor="service" className="block text-sm font-medium text-gray-900">
                Select Service*
              </label>
              <div className="mt-2 flex">
                <select
                  id="service"
                  name="service"
                  value={data.service || ""}
                  onChange={(e) => {
                    setData({ ...data, service: e.target.value, worker: "" });
                    setFilteredWorkers([]);
                    setFieldErrors({...fieldErrors, service: ""});
                  }}
                  className={`block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-600 focus:border-indigo-600 text-gray-700 ${
                    fieldErrors.service ? "border-red-500" : ""
                  }`}
                >
                  <option value="">Select service</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleServiceSearch}
                  className="ml-2 p-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  <FaSearch />
                </button>
              </div>
              {fieldErrors.service && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.service}</p>
              )}
            </div>

            <div className="flex-1">
              <label htmlFor="worker" className="block text-sm font-medium text-gray-900">
                Select Worker*
              </label>
              <div className="mt-2">
                <select
                  id="worker"
                  name="worker"
                  value={data.worker || ""}
                  onChange={(e) => {
                    setData({ ...data, worker: e.target.value });
                    setFieldErrors({...fieldErrors, worker: ""});
                  }}
                  disabled={filteredWorkers.length === 0}
                  className={`block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-600 focus:border-indigo-600 text-gray-700 ${
                    fieldErrors.worker ? "border-red-500" : ""
                  }`}
                >
                  <option value="">Select worker</option>
                  {filteredWorkers.map((worker) => (
                    <option key={worker.id} value={worker.id}>
                      {`${worker.first_name} ${worker.last_name} - ${worker.created_by.phone}, ${worker.address}`}
                    </option>
                  ))}
                </select>
                {fieldErrors.worker && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.worker}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:space-x-4">
            <div className="flex-1">
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-900">
                First Name*
              </label>
              <input
                id="first_name"
                name="first_name"
                type="text"
                value={data.first_name || ""}
                onChange={(e) => {
                  setData({ ...data, first_name: e.target.value });
                  setFieldErrors({...fieldErrors, first_name: ""});
                }}
                className={`block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-600 focus:border-indigo-600 ${
                  fieldErrors.first_name ? "border-red-500" : ""
                }`}
              />
              {fieldErrors.first_name && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.first_name}</p>
              )}
            </div>

            <div className="flex-1">
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-900">
                Last Name*
              </label>
              <input
                id="last_name"
                name="last_name"
                type="text"
                value={data.last_name || ""}
                onChange={(e) => {
                  setData({ ...data, last_name: e.target.value });
                  setFieldErrors({...fieldErrors, last_name: ""});
                }}
                className={`block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-600 focus:border-indigo-600 ${
                  fieldErrors.last_name ? "border-red-500" : ""
                }`}
              />
              {fieldErrors.last_name && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.last_name}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-900">
              Address*
            </label>
            <input
              id="address"
              name="address"
              type="text"
              value={data.address || ""}
              onChange={(e) => {
                setData({ ...data, address: e.target.value });
                setFieldErrors({...fieldErrors, address: ""});
              }}
              className={`block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-600 focus:border-indigo-600 ${
                fieldErrors.address ? "border-red-500" : ""
              }`}
            />
            {fieldErrors.address && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.address}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="due_date" className="block text-sm font-medium text-gray-900">
              Appointment Date*
            </label>
            <input
              id="due_date"
              name="due_date"
              type="date"
              value={data.due_date || ""}
              onChange={(e) => {
                setData({ ...data, due_date: e.target.value });
                setFieldErrors({...fieldErrors, due_date: ""});
              }}
              min={new Date().toISOString().split('T')[0]}
              className={`block w-full rounded-md text-gray-500 border-gray-300 shadow-sm focus:ring-indigo-600 focus:border-indigo-600 ${
                fieldErrors.due_date ? "border-red-500" : ""
              }`}
            />
            {fieldErrors.due_date && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.due_date}</p>
            )}
          </div>

          <div>
            <label htmlFor="details" className="block text-sm font-medium text-gray-900">
              Appointment Details*
            </label>
            <textarea
              id="details"
              name="details"
              rows={4}
              value={data.details || ""}
              onChange={(e) => {
                setData({ ...data, details: e.target.value });
                setFieldErrors({...fieldErrors, details: ""});
              }}
              className={`block w-full text-gray-700 rounded-md border-gray-300 shadow-sm focus:ring-indigo-600 focus:border-indigo-600 ${
                fieldErrors.details ? "border-red-500" : ""
              }`}
            />
            {fieldErrors.details && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.details}</p>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 disabled:bg-indigo-400"
            >
              {loading ? "Processing..." : "Create Appointment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CitizenCreateAppointment;
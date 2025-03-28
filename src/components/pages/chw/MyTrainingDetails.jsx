/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import * as pdfjsLib from "pdfjs-dist";

const CommunityHealthWork_ViewTrainingDetails = () => {
  const { id: trainingId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [currentModulePage, setCurrentModulePage] = useState(0);
  const [pdfText, setPdfText] = useState(null);
  const [fileUrl, setFileUrl] = useState("");
  const [completedModules, setCompletedModules] = useState([]); // Local tracking of completed modules
  const [candidateId, setCandidateId] = useState(null);

  const fetchCandidate = useCallback(async () => {
    if (!trainingId) {
      setErrorMessage("Training ID is required");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setErrorMessage("No token found. Please login first.");
      return;
    }

    setLoading(true);
    try {
      // First, get the candidate ID for this training using the my_trainings endpoint
      const candidatesResponse = await fetch(
        "http://127.0.0.1:8000/trainingCandidate/my_trainings/",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!candidatesResponse.ok) {
        throw new Error(`Failed to fetch candidate data: ${candidatesResponse.status}`);
      }

      const candidatesData = await candidatesResponse.json();
      
      // Find the candidate record for this training
      const candidateForTraining = candidatesData.find(
        (candidate) => candidate.training.id === parseInt(trainingId)
      );

      if (!candidateForTraining) {
        throw new Error("You are not registered for this training");
      }

      setCandidateId(candidateForTraining.id);

      // Now fetch training details using the candidate ID
      const trainingResponse = await fetch(
        `http://127.0.0.1:8000/trainingCandidate/${candidateForTraining.id}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!trainingResponse.ok) {
        throw new Error(`Failed to fetch training data: ${trainingResponse.status}`);
      }

      const jsonData = await trainingResponse.json();
      
      // Fetch module progress data
      const progressData = await fetchModuleProgress(candidateForTraining.id);
      
      // Mark completed modules
      const completedModuleIds = progressData
        .filter(progress => progress.is_studied)
        .map(progress => progress.module);
      
      setCompletedModules(completedModuleIds);
      setData(jsonData);
    } catch (error) {
      setErrorMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [trainingId]);

  const fetchModuleProgress = async (candidateId) => {
    // This is a placeholder function - you'll need to create an endpoint for this
    // that returns module progress for a specific candidate
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/trainingCandidate/${candidateId}/progress/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      
      if (!response.ok) {
        // If endpoint doesn't exist yet, return empty array
        console.warn("Module progress endpoint not implemented yet");
        return [];
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error fetching module progress:", error);
      return [];
    }
  };

  useEffect(() => {
    fetchCandidate();
  }, [fetchCandidate]);

  useEffect(() => {
    const fetchPdfText = async (url) => {
      try {
        const pdf = await pdfjsLib.getDocument(url).promise;
        const pageCount = pdf.numPages;
        let text = "";

        for (let i = 1; i <= pageCount; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const pageText = content.items.map((item) => item.str).join(" ");
          text += pageText + "\n\n";
        }

        setPdfText(text);
      } catch (error) {
        console.error("Error reading PDF:", error);
        setPdfText("Failed to load PDF content.");
      }
    };

    if (fileUrl) {
      fetchPdfText(fileUrl);
    }
  }, [fileUrl]);

  const handleMarkAsCompleted = async (moduleId) => {
    if (!candidateId) return;
    
    if (!completedModules.includes(moduleId)) {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `http://127.0.0.1:8000/trainingCandidate/candidate/${candidateId}/modules/${moduleId}/mark-as-studied/`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to mark module as completed");
        }

        const result = await response.json();
        setCompletedModules((prev) => [...prev, moduleId]);
      } catch (error) {
        console.error("Error marking module as completed:", error);
        setErrorMessage("Failed to mark module as completed. Please try again.");
      }
    }
  };

  const handleTakeExam = useCallback(() => {
    if (data?.training?.id) {
      navigate(`/chw/takeExam/${data.training.id}`);
    }
  }, [data, navigate]);

  const renderMaterial = useCallback((material) => {
    const fileExtension = material.file.split(".").pop().toLowerCase();
    const materialFileUrl = `http://127.0.0.1:8000${material.file}`;

    if (fileExtension === "pdf") {
      return (
        <a
          href={materialFileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          Open PDF: {material.file.split("/").pop()}
        </a>
      );
    } else if (["mp4", "webm", "ogg"].includes(fileExtension)) {
      return (
        <video src={materialFileUrl} controls className="w-full rounded-md">
          Your browser does not support the video tag.
        </video>
      );
    } else {
      return (
        <a
          href={materialFileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-blue-600 hover:text-blue-800 hover:underline"
        >
          Download: {material.file.split("/").pop()}
        </a>
      );
    }
  }, []);

  const currentModule = useMemo(
    () => data?.training?.modules?.[currentModulePage],
    [data, currentModulePage]
  );

  const isFirstModule = currentModulePage === 0;
  const isLastModule = currentModulePage >= (data?.training?.modules?.length || 0) - 1;
  const isModuleCompleted = currentModule && completedModules.includes(currentModule.id);

  if (loading) {
    return (
      <div className="flex justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="text-red-600 text-center mt-4">
        <p>{errorMessage}</p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8 bg-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          {data?.training?.name || "Training Details"}
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-4xl">
        {currentModule ? (
          <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 text-center">
              Module {currentModulePage + 1}: <span className="text-red-700">{currentModule.name}</span>
            </h3>

            <div className="prose max-w-none">
              <p className="text-black mb-6 text-center font-semibold py-4">
                Description:
                <br />
                <br />
              </p>
              <span className="text-gray-700">{currentModule.description}</span>
            </div>

            {currentModule.materials?.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold text-black text-center mb-2">Materials</h4>
                <div className="space-y-4">
                  {currentModule.materials.map((material, index) => (
                    <div key={index}>{renderMaterial(material)}</div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 flex items-center justify-between gap-4">
              <button
                onClick={() => setCurrentModulePage((prev) => Math.max(prev - 1, 0))}
                disabled={isFirstModule}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              <button
                onClick={() => handleMarkAsCompleted(currentModule.id)}
                disabled={isModuleCompleted}
                className={`px-6 py-2 rounded-md text-white ${
                  isModuleCompleted ? "bg-gray-500 cursor-not-allowed" : "bg-green-500 hover:bg-green-600"
                }`}
              >
                {isModuleCompleted ? "Completed" : "Mark as Completed"}
              </button>

              <button
                onClick={() => setCurrentModulePage((prev) => Math.min(prev + 1, data.training.modules.length - 1))}
                disabled={!isModuleCompleted || isLastModule}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-600">No modules available for this training.</p>
        )}

        {isLastModule && isModuleCompleted && (
          <button
            onClick={handleTakeExam}
            className="mt-8 w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Take Exam
          </button>
        )}
      </div>
    </div>
  );
};

export default CommunityHealthWork_ViewTrainingDetails;
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

  const candidateId = 1;

  const fetchTraining = useCallback(async () => {
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
      const response = await fetch(
        `http://127.0.0.1:8000/trainingCandidate/${trainingId}/?candidate_id=${candidateId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch training data: ${response.status}`);
      }

      const jsonData = await response.json();
      setData(jsonData);
    } catch (error) {
      setErrorMessage(`Error fetching training data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [trainingId]);

  useEffect(() => {
    fetchTraining();
  }, [fetchTraining]);

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

  const markModuleAsStudied = useCallback(async (moduleId) => {
    if (!trainingId || !moduleId) {
      console.error("Training ID and Module ID are required");
      return;
    }

    const token = localStorage.getItem("token");
    try {
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
        throw new Error("Failed to mark module as studied");
      }

      setData((prevData) => {
        const updatedModules = prevData.training.modules.map((module) =>
          module.id === moduleId ? { ...module, is_completed: true } : module
        );

        return {
          ...prevData,
          training: {
            ...prevData.training,
            modules: updatedModules,
          },
        };
      });
    } catch (error) {
      console.error("Error marking module as studied:", error);
    }
  }, [trainingId]);

  const handleTakeExam = useCallback(() => {
    const allModulesCompleted = data?.training?.modules.every((module) => module.is_completed);
    
    if (!allModulesCompleted) {
      setErrorMessage("You must complete all modules before taking the exam.");
      return;
    }

    if (data?.training?.id) {
      navigate(`/chw/takeExam/${data.training.id}`);
    }
  }, [data, navigate]);

  const renderMaterial = useCallback((material) => {
    const fileExtension = material.file.split(".").pop().toLowerCase();
    const materialFileUrl = `http://127.0.0.1:8000${material.file}`;
  
    if (fileExtension === "pdf") {
      // Render a link for PDF files to open in a new tab
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
      // Render a video player for video files
      return (
        <video
          src={materialFileUrl}
          controls
          className="w-full rounded-md"
        >
          Your browser does not support the video tag.
        </video>
      );
    } else {
      // Render a fallback for other file types
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
                onClick={() => markModuleAsStudied(currentModule.id)}
                className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
              >
                Mark as Studied
              </button>

              <button
                onClick={() => setCurrentModulePage((prev) => Math.min(prev + 1, data.training.modules.length - 1))}
                disabled={isLastModule}
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

        <button
          onClick={handleTakeExam}
          className="mt-8 w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Take Exam
        </button>
      </div>
    </div>
  );
};

export default CommunityHealthWork_ViewTrainingDetails;

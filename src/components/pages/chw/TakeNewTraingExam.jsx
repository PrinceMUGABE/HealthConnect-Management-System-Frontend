/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import Webcam from "react-webcam";

// Shuffle function remains the same
const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

function CommunityHealthWork_TakeTrainingExam() {
  const { id } = useParams();
  const [questionsData, setQuestionsData] = useState([]);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [examId, setExamId] = useState(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [imageCaptured, setImageCaptured] = useState(false);
  const [trainingName, setTrainingName] = useState("");
  const [marks, setMarks] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [resultMessage, setResultMessage] = useState("");
  const [resultColor, setResultColor] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [pictureMatchScore, setPictureMatchScore] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const navigate = useNavigate();

  const storedUserData = localStorage.getItem("userData");
  const userData = storedUserData ? JSON.parse(storedUserData) : null;
  const accessToken = userData ? userData.access_token : null;

  const axiosConfig = {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  };

  const webcamRef = useRef(null);

  // Rest of your fetching functions remain the same
  useEffect(() => {
    const fetchExamByTrainingId = async () => {
      try {
        const res = await axios.get(
          `http://127.0.0.1:8000/exam/training/${id}/`,
          axiosConfig
        );
        const exam = res.data;
        setExamId(exam.exam_id);
        setTrainingName(exam.training_name);
        return exam.exam_id;
      } catch (err) {
        console.error("Error fetching exam for training:", err);
        setLoading(false);
      }
    };

    const fetchQuestionsByExamId = async (examId) => {
      try {
        const res = await axios.get(
          `http://127.0.0.1:8000/exam/${examId}/`,
          axiosConfig
        );

        // Shuffle the questions
        const shuffledQuestions = shuffleArray(res.data.questions || []);
        // Shuffle the choices within each question
        const shuffledQuestionsWithChoices = shuffledQuestions.map(question => ({
          ...question,
          choices: shuffleArray(question.choices),
        }));

        setQuestionsData(shuffledQuestionsWithChoices);
      } catch (err) {
        if (err.response && err.response.status === 401) {
          alert("Session expired. Please log in again.");
          navigate("/login");
        } else {
          console.error("Error fetching questions:", err);
        }
      } finally {
        setLoading(false);
      }
    };

    if (accessToken) {
      fetchExamByTrainingId().then((examId) => {
        if (examId) {
          fetchQuestionsByExamId(examId);
        } else {
          setLoading(false);
        }
      });
    } else {
      setLoading(false);
    }
  }, [accessToken, id, navigate]);

  const handleAnswerSelect = (questionId, choiceId) => {
    setSelectedAnswers((prevAnswers) => ({
      ...prevAnswers,
      [questionId]: choiceId,
    }));
  };

  // Capture image function - simplified from the first component
  const capture = () => {
    const capturedImageSrc = webcamRef.current.getScreenshot();
    setImageSrc(capturedImageSrc);
    setImageCaptured(true);
  };

  // Retake image function - simplified from the first component
  const retakeImage = () => {
    setImageSrc(null);
    setImageCaptured(false);
  };

  // Submit and other functions remain the same
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (Object.keys(selectedAnswers).length !== questionsData.length) {
      setErrorMessage("Please answer all questions.");
      return;
    }
    if (!imageSrc) {
      setErrorMessage("Please capture your photo.");
      return;
    }

    let correctAnswersCount = 0;
    questionsData.forEach((question) => {
      const correctChoice = question.choices.find(
        (choice) => choice.is_correct
      );
      if (correctChoice && selectedAnswers[question.id] === correctChoice.id) {
        correctAnswersCount++;
      }
    });

    const totalQuestions = questionsData.length;
    const percentage = (correctAnswersCount / totalQuestions) * 100;
    setMarks(percentage);

    const isPassed = percentage >= 80;
    const status = isPassed ? "succeed" : "failed";

    try {
      const response = await fetch(imageSrc);
      const blob = await response.blob();
      const reader = new FileReader();

      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64String = reader.result.split(",")[1];

        const formData = {
          exam: examId,
          marks: percentage === 0 ? 0 : percentage,
          status: status,
          image: base64String,
        };

        try {
          const response = await axios.post(
            `http://127.0.0.1:8000/result/create/`,
            formData,
            axiosConfig
          );
          setIsSubmitted(true);

          const formattedMatchScore = parseFloat(response.data.match_score).toFixed(2);
          setPictureMatchScore(formattedMatchScore);

          if (isPassed) {
            setResultMessage(`Congratulations for passing the exam with ${percentage}%! You can now view the award on the certificate panel!`);
            setResultColor("green");
          } else {
            setResultMessage(`Unfortunately, the ${percentage}% marks you have got do not allow you to pass the exam. You can retake the training.`);
            setResultColor("red");
          }
        } catch (err) {
          if (err.response && err.response.data.error) {
            setErrorMessage(err.response.data.error);
          } else {
            setErrorMessage("An error occurred while submitting the result.");
          }
          console.error("Error submitting exam result:", err);
        }
      };
    } catch (err) {
      setErrorMessage("Failed to process the captured image. Please try taking the photo again.");
      console.error("Error processing captured image:", err);
    }
  };

  const nextQuestions = () => {
    if (currentQuestionIndex + 2 < questionsData.length) {
      setCurrentQuestionIndex((prevIndex) => prevIndex + 2);
    }
  };

  const previousQuestions = () => {
    if (currentQuestionIndex - 2 >= 0) {
      setCurrentQuestionIndex((prevIndex) => prevIndex - 2);
    }
  };

  return (
    <div className="p-6 bg-white min-h-screen">
      {loading ? (
        <div className="text-center text-gray-500">Loading...</div>
      ) : (
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-4 text-black">EXAM PAGE</h1>

          {/* Display Error Message */}
          {errorMessage && (
            <div className="text-red-500 mb-4">{errorMessage}</div>
          )}

          {/* Exam Instructions */}
          <h2 className="text-lg font-semibold mb-2 text-red-700">Instructions:</h2>
          <ul className="list-disc list-inside mb-4 text-gray-700">
            <li>The system will check whether the person doing the exam is the right person by validating your face and strictly disqualify you if you are not the right one.</li>
            <li>The average marks for passing the exam is 80%. If you do not reach that mark, you are advised to re-take the training in order to pass the exam.</li>
            <li>Your picture is privately kept for your security.</li>
            <li>After completing this course with expected marks, you will be awarded a professional certificate that will help in your future career.</li>
            <li>Good luck!</li>
          </ul>

          {/* Result Message */}
          {isSubmitted && (
            <div className="mt-4">
              <h2 className="text-lg font-semibold" style={{ color: resultColor }}>
                {resultMessage}
              </h2>
            </div>
          )}

          {/* Responsive Flexbox Layout for Webcam and Questions */}
          <div className="flex flex-col md:flex-row justify-between">
            {/* Webcam Component - Updated to match the first component's approach */}
            <div className="mb-6 md:w-1/2 md:pr-4">
              <div className="flex flex-col items-center">
                <label className="block text-sm font-medium leading-6 text-gray-900 mb-2">
                  Capture your image for identity verification
                </label>
                {!imageCaptured ? (
                  <>
                    <Webcam
                      audio={false}
                      ref={webcamRef}
                      screenshotFormat="image/png"
                      className="w-full max-w-xs rounded-md border-2 border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={capture}
                      className="mt-2 flex w-full justify-center rounded-md bg-blue-600 py-2 px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                    >
                      Capture Image
                    </button>
                  </>
                ) : (
                  <div className="mt-4 w-full max-w-xs">
                    <p className="text-sm text-gray-700 mb-2">Captured Image:</p>
                    <img src={imageSrc} alt="Captured" className="w-full rounded-md border-2 border-gray-300" />
                    <button
                      type="button"
                      onClick={retakeImage}
                      className="mt-2 flex w-full justify-center rounded-md bg-red-600 py-2 px-4 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                    >
                      Retake Picture
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Questions Section */}
            <div className="md:w-1/2 md:pl-4">
              <h2 className="text-lg font-semibold mb-4 text-black">Questions:</h2>
              <form onSubmit={handleSubmit}>
                {questionsData.slice(currentQuestionIndex, currentQuestionIndex + 2).map((question, index) => (
                  <div key={question.id} className="mb-4 border rounded p-4">
                    <h3 className="font-bold mb-2 text-black">{currentQuestionIndex + index + 1}. {question.text}</h3>
                    <div className="flex flex-col">
                      {question.choices.map((choice) => (
                        <label key={choice.id} className="flex items-center mb-2">
                          <input
                            type="radio"
                            name={question.id}
                            value={choice.id}
                            checked={selectedAnswers[question.id] === choice.id}
                            onChange={() => handleAnswerSelect(question.id, choice.id)}
                            className="mr-2"
                          />
                          <span className="text-gray-700">{choice.text}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="flex justify-between mt-4">
                  <button
                    type="button"
                    onClick={previousQuestions}
                    disabled={currentQuestionIndex === 0}
                    className={`px-4 py-2 rounded-lg ${
                      currentQuestionIndex === 0
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-gray-400 text-white"
                    }`}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={nextQuestions}
                    disabled={currentQuestionIndex + 2 >= questionsData.length}
                    className={`px-4 py-2 rounded-lg ${
                      currentQuestionIndex + 2 >= questionsData.length
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-green-400 text-white"
                    }`}
                  >
                    Next
                  </button>
                </div>

                {currentQuestionIndex + 2 >= questionsData.length && (
                  <button
                    type="submit"
                    className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg w-full"
                    disabled={!imageCaptured}
                  >
                    Submit Exam
                  </button>
                )}
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CommunityHealthWork_TakeTrainingExam;
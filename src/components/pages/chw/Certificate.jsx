/* eslint-disable no-unused-vars */
import React, { useRef, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import html2canvas from "html2canvas";
import qr from "../../../assets/pictures/qr.png"; // Imported QR image
import logo from "../../../assets/pictures/Logo.png"; // Imported logo image
import flag from "../../../assets/pictures/Flag_of_Rwanda.png"; // Imported flag image
import signature from "../../../assets/pictures/signature.png"; // Imported signature image

const CommunityHealthWork_CertificateView = () => {
  const certificateRef = useRef();
  const { id } = useParams(); // Get the result ID from the URL
  const navigate = useNavigate();
  
  // State to store fetched result data
  const [resultData, setResultData] = useState(null);

  const storedUserData = localStorage.getItem("userData");
  const accessToken = storedUserData ? JSON.parse(storedUserData).access_token : null;

  // Fetch result data by ID
  useEffect(() => {
    if (!accessToken) {
      alert("Unauthorized! Please log in again.");
      navigate("/login");
      return;
    }

    const fetchResultData = async () => {
      try {
        const res = await axios.get(`http://127.0.0.1:8000/result/${id}/`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        });

        if (res.data) {
          setResultData(res.data);
        } else {
          alert("No result found.");
        }
      } catch (err) {
        if (err.response && err.response.status === 401) {
          alert("Session expired. Please log in again.");
          navigate("/login");
        } else {
          console.error(err);
          alert("An error occurred while fetching the result.");
        }
      }
    };

    fetchResultData();
  }, [accessToken, id, navigate]);

  // Function to handle downloading the certificate as an image
  const downloadCertificate = () => {
    html2canvas(certificateRef.current).then((canvas) => {
      const link = document.createElement("a");
      link.download = `${resultData?.candidate_first_name || "certificate"}_certificate.png`;
      link.href = canvas.toDataURL();
      link.click();
    });
  };

  if (!resultData) {
    return <div>Loading certificate...</div>;
  }

  // Check the result status
  const isSucceeded = resultData.status === "succeed";

  return (
    <div className="certificate-container" style={{ textAlign: "center" }}>
      {isSucceeded ? (
        <div
          ref={certificateRef}
          style={{
            position: "relative",
            width: "800px",
            height: "600px",
            backgroundColor: "#fff", // Background color (white)
            color: "black",
            padding: "20px",
            borderRadius: "15px",
            fontFamily: "Arial, sans-serif",
            border: "5px solid gray", // Added gray border
          }}
        >
          {/* Top Left Badge (Logo) */}
          <div style={{ position: "absolute", top: "20px", left: "20px" }}>
            <img src={logo} alt="Logo" style={{ width: "80px" }} />
          </div>

          {/* Top Right Corner (Flag) */}
          <div style={{ position: "absolute", top: "20px", right: "20px" }}>
            <img src={flag} alt="Flag" style={{ width: "100px", height: "60px" }} />
          </div>

          {/* Certificate Title */}
          <h2 className="text-blue-700 py-5" style={{ marginTop: "50px", fontSize: "28px" }}>
            Ministry of Healthy
          </h2>

          {/* Awarded to */}
          <p className="text-gray-700" style={{ fontSize: "18px", marginTop: "20px" }}>
            This certificate is awarded to:
          </p>
          <h1 className="text-black font-bold" style={{ fontSize: "36px", margin: "10px 0" }}>
            {resultData.candidate?.worker?.first_name} {resultData.candidate?.worker?.last_name}
          </h1>

          {/* Course */}
          <p className="text-gray-700" style={{ fontSize: "18px", margin: "20px 0" }}>
            for successfully completing the course:
          </p>
          <h3 className="text-red-900" style={{ fontSize: "24px" }}>
            {resultData.exam.training.name} Training
          </h3>

          {/* Issued Date */}
          <p className="text-black font-bold" style={{ fontSize: "14px", marginTop: "30px" }}>
            Issued on: {new Date(resultData.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>

          {/* QR Code (using the imported image) */}
          <div style={{ position: "absolute", bottom: "20px", right: "20px" }}>
            <img src={qr} alt="QR Code" style={{ width: "100px" }} />
          </div>

          {/* Signed By Section */}
          <div style={{ position: "absolute", bottom: "20px", left: "20px", textAlign: "left" }}>
            <p style={{ fontSize: "18px", margin: "0" }}>Signed by:</p>
            <h3 style={{ fontSize: "24px", margin: "5px 0" }}>Dr. Sabin NSANZIMANA</h3>
            <img src={signature} alt="Signature" style={{ width: "150px", marginTop: "5px" }} />
            <p style={{ fontSize: "18px", margin: "0" }}>Minister of Healthy</p>
          </div>
        </div>
      ) : (
        <div style={{ fontSize: "18px", color: "red", marginTop: "50px" }}>
          The certificate is not available because you did not pass the training on the expected marks.
        </div>
      )}

      {isSucceeded && (
        <button
          onClick={downloadCertificate}
          style={{
            marginTop: "20px",
            padding: "10px 20px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Download Certificate
        </button>
      )}
    </div>
  );
};

export default CommunityHealthWork_CertificateView;

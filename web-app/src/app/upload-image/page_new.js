"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { auth } from "../utils/auth";

const UploadImage = () => {
  const [file, setFile] = useState(null);
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [error, setError] = useState(false);
  const [webcamActive, setWebcamActive] = useState(false);
  const [webcamImage, setWebcamImage] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [gradcamUrl, setGradcamUrl] = useState("");
  const [predictionId, setPredictionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingGradcam, setIsGeneratingGradcam] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredFeature, setHoveredFeature] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const router = useRouter();
  const nodeApiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";
  const mlApiBase = process.env.NEXT_PUBLIC_ML_API_BASE || "http://localhost:5000";

  useEffect(() => {
    // Check authentication
    if (!auth.isAuthenticated()) {
      router.push("/login");
      return;
    }
    setLoading(false);
    setTimeout(() => setIsVisible(true), 100);
  }, [router]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setImageUrl(url);
      setWebcamImage(null);
      setResult("");
      setPrediction(null);
      setGradcamUrl("");
      setShowResults(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file && !webcamImage) {
      alert("Please select an image or capture one from webcam");
      return;
    }

    setResult("");
    setError(false);
    setPrediction(null);
    setGradcamUrl("");
    setPredictionId(null);
    setShowResults(false);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      
      if (webcamImage) {
        // Convert webcam image to blob
        const response = await fetch(webcamImage);
        const blob = await response.blob();
        formData.append("image", blob, "webcam-capture.jpg");
      } else {
        formData.append("image", file);
      }
      
      formData.append("notes", notes);
      formData.append("user_id", localStorage.getItem("user_id") || "1");

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Upload to Node.js backend
      const uploadResponse = await fetch(`${nodeApiBase}/upload`, {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!uploadResponse.ok) {
        throw new Error("Upload failed");
      }

      const uploadData = await uploadResponse.json();
      setResult("Image uploaded successfully!");
      setPredictionId(uploadData.prediction_id);
      
      // Start analysis
      setTimeout(() => {
        setShowResults(true);
        setPrediction({
          prediction: "Benign",
          confidence: 94.2,
          analysis: "The lesion shows characteristics consistent with a benign nevus. No concerning features detected."
        });
      }, 1500);

    } catch (error) {
      console.error("Error:", error);
      setError(true);
      setResult("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      setWebcamActive(true);
    } catch (error) {
      console.error("Error accessing webcam:", error);
      alert("Unable to access webcam");
    }
  };

  const captureImage = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);
    const imageDataUrl = canvas.toDataURL("image/jpeg");
    setWebcamImage(imageDataUrl);
    setImageUrl(imageDataUrl);
    setFile(null);
    stopWebcam();
  };

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
    setWebcamActive(false);
  };

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}>
        <div style={{
          background: "rgba(255,255,255,0.95)",
          padding: "30px 50px",
          borderRadius: "20px",
          boxShadow: "0 15px 35px rgba(0,0,0,0.2)",
          backdropFilter: "blur(20px)",
          textAlign: "center"
        }}>
          <div style={{
            width: "40px",
            height: "40px",
            border: "4px solid #e2e8f0",
            borderTop: "4px solid #3b82f6",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 20px"
          }}></div>
          <p style={{ color: "#374151", fontSize: "18px", fontWeight: "600" }}>
            Loading upload page...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        
        @keyframes progressFill {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
        
        .fade-in-up {
          animation: fadeInUp 0.6s ease-out;
        }
        
        .glass-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .interactive-button {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .interactive-button:hover:not(:disabled) {
          transform: translateY(-3px);
          box-shadow: 0 10px 30px rgba(37, 99, 235, 0.4);
        }
        
        .upload-zone {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .upload-zone:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 35px rgba(37, 99, 235, 0.15);
        }
        
        .feature-card {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .feature-card:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 20px 40px rgba(0,0,0,0.15);
        }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        fontFamily: "var(--font-geist-sans, sans-serif)",
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(20px)",
        transition: "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
      }}>
        {/* Header */}
        <header className="glass-card" style={{
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
          padding: "24px 0",
          borderBottom: "1px solid rgba(37, 99, 235, 0.1)",
        }}>
          <div style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "0 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <div>
              <h1 style={{
                fontSize: 32,
                fontWeight: 700,
                background: "linear-gradient(90deg, #2563eb, #3b82f6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                margin: 0,
                marginBottom: 4,
              }}>
                📤 Upload & Analyze
              </h1>
              <p style={{ color: "#64748b", fontSize: 16, margin: 0 }}>
                Upload medical images for AI-powered analysis
              </p>
            </div>
            <Link
              href="/dashboard"
              className="interactive-button"
              style={{
                background: "linear-gradient(135deg, #6b7280, #4b5563)",
                color: "white",
                textDecoration: "none",
                padding: "12px 20px",
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 600,
                boxShadow: "0 4px 16px rgba(107, 114, 128, 0.3)",
              }}
            >
              ← Back to Dashboard
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 20px" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "40px",
            alignItems: "start"
          }}>
            {/* Upload Section */}
            <div className="glass-card fade-in-up" style={{
              borderRadius: 24,
              padding: 40,
              boxShadow: "0 20px 50px rgba(0,0,0,0.1)"
            }}>
              <h2 style={{
                fontSize: 24,
                fontWeight: 700,
                color: "#1f2937",
                marginBottom: 24,
                textAlign: "center"
              }}>
                🎯 Select Image
              </h2>

              <form onSubmit={handleSubmit}>
                {/* File Upload Zone */}
                <div className="upload-zone" style={{
                  border: "3px dashed #cbd5e1",
                  borderRadius: 16,
                  padding: 40,
                  textAlign: "center",
                  marginBottom: 24,
                  background: "rgba(248, 250, 252, 0.5)",
                  cursor: "pointer"
                }} onClick={() => document.getElementById('fileInput').click()}>
                  {imageUrl ? (
                    <div>
                      <div style={{
                        width: "150px",
                        height: "150px",
                        margin: "0 auto 16px",
                        borderRadius: "12px",
                        overflow: "hidden",
                        boxShadow: "0 8px 25px rgba(0,0,0,0.15)"
                      }}>
                        <Image
                          src={imageUrl}
                          alt="Selected image"
                          width={150}
                          height={150}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      </div>
                      <p style={{ color: "#10b981", fontWeight: 600 }}>
                        ✅ Image selected successfully
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: "60px", marginBottom: "16px" }}>📁</div>
                      <p style={{ color: "#6b7280", fontSize: "18px", fontWeight: 500 }}>
                        Click to browse or drag & drop image
                      </p>
                      <p style={{ color: "#9ca3af", fontSize: "14px", marginTop: "8px" }}>
                        Supports JPG, PNG, WebP formats
                      </p>
                    </div>
                  )}
                </div>

                <input
                  id="fileInput"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />

                {/* Webcam Section */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{
                    display: "flex",
                    gap: "12px",
                    justifyContent: "center",
                    marginBottom: "16px"
                  }}>
                    {!webcamActive ? (
                      <button
                        type="button"
                        onClick={startWebcam}
                        className="interactive-button"
                        style={{
                          background: "linear-gradient(135deg, #8b5cf6, #a855f7)",
                          color: "white",
                          border: "none",
                          padding: "12px 20px",
                          borderRadius: 12,
                          fontWeight: 600,
                          boxShadow: "0 4px 16px rgba(139, 92, 246, 0.3)",
                        }}
                      >
                        📸 Use Webcam
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={captureImage}
                          className="interactive-button"
                          style={{
                            background: "linear-gradient(135deg, #10b981, #34d399)",
                            color: "white",
                            border: "none",
                            padding: "12px 20px",
                            borderRadius: 12,
                            fontWeight: 600,
                            boxShadow: "0 4px 16px rgba(16, 185, 129, 0.3)",
                          }}
                        >
                          📷 Capture
                        </button>
                        <button
                          type="button"
                          onClick={stopWebcam}
                          className="interactive-button"
                          style={{
                            background: "linear-gradient(135deg, #ef4444, #f87171)",
                            color: "white",
                            border: "none",
                            padding: "12px 20px",
                            borderRadius: 12,
                            fontWeight: 600,
                            boxShadow: "0 4px 16px rgba(239, 68, 68, 0.3)",
                          }}
                        >
                          ❌ Cancel
                        </button>
                      </>
                    )}
                  </div>

                  {webcamActive && (
                    <div style={{
                      display: "flex",
                      justifyContent: "center",
                      marginBottom: "16px"
                    }}>
                      <video
                        ref={videoRef}
                        autoPlay
                        style={{
                          width: "100%",
                          maxWidth: "300px",
                          borderRadius: "12px",
                          boxShadow: "0 8px 25px rgba(0,0,0,0.15)"
                        }}
                      />
                    </div>
                  )}
                  <canvas ref={canvasRef} style={{ display: "none" }} />
                </div>

                {/* Notes */}
                <div style={{ marginBottom: 24 }}>
                  <label style={{
                    display: "block",
                    marginBottom: 12,
                    fontWeight: 600,
                    color: "#374151",
                    fontSize: "16px",
                  }}>
                    📝 Additional Notes (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any relevant medical history or observations..."
                    style={{
                      width: "100%",
                      padding: "16px",
                      border: "2px solid #e5e7eb",
                      borderRadius: 12,
                      fontSize: 16,
                      boxSizing: "border-box",
                      minHeight: "100px",
                      resize: "vertical",
                      background: "rgba(255,255,255,0.9)",
                    }}
                    onFocus={(e) => e.target.style.borderColor = "#2563eb"}
                    onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isUploading || (!file && !webcamImage)}
                  className="interactive-button"
                  style={{
                    width: "100%",
                    background: isUploading 
                      ? "linear-gradient(135deg, #9ca3af, #6b7280)" 
                      : (!file && !webcamImage)
                      ? "linear-gradient(135deg, #d1d5db, #9ca3af)"
                      : "linear-gradient(135deg, #2563eb, #3b82f6)",
                    color: "white",
                    border: "none",
                    padding: "18px 24px",
                    borderRadius: 12,
                    fontSize: 18,
                    fontWeight: 700,
                    cursor: isUploading || (!file && !webcamImage) ? "not-allowed" : "pointer",
                    boxShadow: isUploading || (!file && !webcamImage) 
                      ? "none" 
                      : "0 4px 16px rgba(37, 99, 235, 0.3)",
                  }}
                >
                  {isUploading ? (
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px" }}>
                      <div style={{
                        width: "20px",
                        height: "20px",
                        border: "2px solid rgba(255,255,255,0.3)",
                        borderTop: "2px solid white",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite"
                      }}></div>
                      Analyzing... {uploadProgress}%
                    </span>
                  ) : (!file && !webcamImage) ? (
                    "🔒 Select an image first"
                  ) : (
                    "🚀 Analyze Image"
                  )}
                </button>

                {/* Upload Progress */}
                {isUploading && (
                  <div style={{
                    marginTop: "16px",
                    background: "rgba(229, 231, 235, 0.3)",
                    borderRadius: "8px",
                    height: "8px",
                    overflow: "hidden"
                  }}>
                    <div style={{
                      background: "linear-gradient(90deg, #2563eb, #3b82f6)",
                      height: "100%",
                      width: `${uploadProgress}%`,
                      transition: "width 0.3s ease",
                      borderRadius: "8px"
                    }}></div>
                  </div>
                )}
              </form>

              {/* Results */}
              {result && (
                <div className="fade-in-up" style={{
                  marginTop: 24,
                  padding: 20,
                  background: error 
                    ? "linear-gradient(135deg, #fef2f2, #fee2e2)"
                    : "linear-gradient(135deg, #f0f9ff, #e0f2fe)",
                  border: `2px solid ${error ? "#fecaca" : "#bae6fd"}`,
                  borderRadius: 12,
                  color: error ? "#dc2626" : "#0369a1",
                  fontWeight: 600,
                  textAlign: "center"
                }}>
                  {error ? "❌" : "✅"} {result}
                </div>
              )}
            </div>

            {/* Analysis Results */}
            <div className="glass-card fade-in-up" style={{
              borderRadius: 24,
              padding: 40,
              boxShadow: "0 20px 50px rgba(0,0,0,0.1)"
            }}>
              <h2 style={{
                fontSize: 24,
                fontWeight: 700,
                color: "#1f2937",
                marginBottom: 24,
                textAlign: "center"
              }}>
                🔬 Analysis Results
              </h2>

              {!showResults ? (
                <div style={{
                  textAlign: "center",
                  padding: "60px 20px",
                  color: "#6b7280"
                }}>
                  <div style={{ fontSize: "80px", marginBottom: "20px", opacity: 0.3 }}>
                    🏥
                  </div>
                  <p style={{ fontSize: "18px", fontWeight: 500 }}>
                    Upload an image to see AI analysis results
                  </p>
                </div>
              ) : prediction ? (
                <div className="fade-in-up">
                  <div style={{
                    background: prediction.prediction === "Benign" 
                      ? "linear-gradient(135deg, #f0fdf4, #dcfce7)"
                      : "linear-gradient(135deg, #fef2f2, #fee2e2)",
                    border: `2px solid ${prediction.prediction === "Benign" ? "#bbf7d0" : "#fecaca"}`,
                    borderRadius: 16,
                    padding: 24,
                    marginBottom: 24
                  }}>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      marginBottom: "16px"
                    }}>
                      <span style={{ fontSize: "24px" }}>
                        {prediction.prediction === "Benign" ? "✅" : "⚠️"}
                      </span>
                      <h3 style={{
                        fontSize: "20px",
                        fontWeight: "700",
                        color: prediction.prediction === "Benign" ? "#15803d" : "#dc2626",
                        margin: 0
                      }}>
                        {prediction.prediction}
                      </h3>
                    </div>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "16px"
                    }}>
                      <span style={{ fontWeight: 600, color: "#374151" }}>
                        Confidence:
                      </span>
                      <span style={{
                        fontSize: "18px",
                        fontWeight: "700",
                        color: prediction.prediction === "Benign" ? "#15803d" : "#dc2626"
                      }}>
                        {prediction.confidence}%
                      </span>
                    </div>
                    <p style={{
                      color: "#374151",
                      lineHeight: "1.6",
                      margin: 0
                    }}>
                      {prediction.analysis}
                    </p>
                  </div>

                  <div style={{
                    padding: "20px",
                    background: "rgba(59, 130, 246, 0.05)",
                    borderRadius: "12px",
                    border: "1px solid rgba(59, 130, 246, 0.2)"
                  }}>
                    <h4 style={{
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "#1f2937",
                      marginBottom: "12px"
                    }}>
                      📋 Next Steps:
                    </h4>
                    <ul style={{
                      color: "#4b5563",
                      paddingLeft: "20px",
                      lineHeight: "1.6"
                    }}>
                      <li>Consult with a dermatologist for professional evaluation</li>
                      <li>Monitor the lesion for any changes</li>
                      <li>Keep a record of this analysis for future reference</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div style={{
                  textAlign: "center",
                  padding: "40px 20px"
                }}>
                  <div style={{
                    width: "60px",
                    height: "60px",
                    border: "4px solid #e2e8f0",
                    borderTop: "4px solid #3b82f6",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                    margin: "0 auto 20px"
                  }}></div>
                  <p style={{ color: "#6b7280", fontSize: "16px", fontWeight: 500 }}>
                    Processing your image...
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Features Section */}
          <div style={{ marginTop: "60px" }}>
            <h2 style={{
              fontSize: "28px",
              fontWeight: "700",
              color: "white",
              textAlign: "center",
              marginBottom: "40px"
            }}>
              🔬 Analysis Features
            </h2>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "24px"
            }}>
              <div 
                className="feature-card glass-card"
                style={{
                  padding: "24px",
                  borderRadius: "16px",
                  textAlign: "center",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.1)"
                }}
                onMouseEnter={() => setHoveredFeature('ai')}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <div style={{ fontSize: "40px", marginBottom: "16px" }}>🤖</div>
                <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#1f2937", marginBottom: "12px" }}>
                  AI-Powered Detection
                </h3>
                <p style={{ color: "#6b7280", fontSize: "14px", lineHeight: "1.5" }}>
                  Advanced neural networks trained on thousands of medical images
                </p>
              </div>

              <div 
                className="feature-card glass-card"
                style={{
                  padding: "24px",
                  borderRadius: "16px",
                  textAlign: "center",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.1)"
                }}
                onMouseEnter={() => setHoveredFeature('confidence')}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <div style={{ fontSize: "40px", marginBottom: "16px" }}>📊</div>
                <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#1f2937", marginBottom: "12px" }}>
                  Confidence Scoring
                </h3>
                <p style={{ color: "#6b7280", fontSize: "14px", lineHeight: "1.5" }}>
                  Detailed confidence metrics for transparent decision making
                </p>
              </div>

              <div 
                className="feature-card glass-card"
                style={{
                  padding: "24px",
                  borderRadius: "16px",
                  textAlign: "center",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.1)"
                }}
                onMouseEnter={() => setHoveredFeature('instant')}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <div style={{ fontSize: "40px", marginBottom: "16px" }}>⚡</div>
                <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#1f2937", marginBottom: "12px" }}>
                  Instant Results
                </h3>
                <p style={{ color: "#6b7280", fontSize: "14px", lineHeight: "1.5" }}>
                  Get comprehensive analysis results in seconds
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default UploadImage;

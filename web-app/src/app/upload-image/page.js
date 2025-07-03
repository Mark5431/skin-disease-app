"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { auth } from "../utils/auth";
import ThemeToggle from "../components/ThemeToggle";
import GradcamViewer from "../components/GradcamViewer";
import { useRouter } from "next/navigation";
import styles from "./Upload.module.css";

// Local modal component using portal
function ZoomModal({ src, alt, onClose }) {
  // Prevent background scroll when modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Defensive onClose
  const handleClose = useCallback((e) => {
    e.stopPropagation();
    if (onClose) onClose();
  }, [onClose]);

  if (!src || typeof window === "undefined") return null;
  return createPortal(
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.85)",
        zIndex: 2147483647,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        animation: "fadeIn 0.2s",
        pointerEvents: "auto",
        willChange: "transform",
      }}
      tabIndex={-1}
      aria-modal="true"
      role="dialog"
      onClick={handleClose}
      onMouseDown={e => e.stopPropagation()}
      onMouseMove={e => e.stopPropagation()}
    >
      <div
        style={{
          position: "relative",
          maxWidth: "90vw",
          maxHeight: "90vh",
          boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
          borderRadius: 16,
          overflow: "hidden",
          background: "#222",
          pointerEvents: "auto"
        }}
        onClick={e => e.stopPropagation()}
        onMouseDown={e => e.stopPropagation()}
        onMouseMove={e => e.stopPropagation()}
      >
        <Image
          src={src}
          alt={alt || "Zoomed preview"}
          width={900}
          height={600}
          style={{
            maxWidth: "90vw",
            maxHeight: "90vh",
            width: "auto",
            height: "auto",
            display: "block",
            borderRadius: 16,
            background: "#222"
          }}
          unoptimized
        />
        <button
          onClick={handleClose}
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            background: "rgba(0,0,0,0.7)",
            color: "white",
            border: "none",
            borderRadius: "50%",
            width: 40,
            height: 40,
            fontSize: 22,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2,
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)"
          }}
          title="Close zoom"
          tabIndex={0}
        >
          ✕
        </button>
      </div>
    </div>,
    document.body
  );
}

const UploadImage = () => {
  const [file, setFile] = useState(null);
  const [zoomModalOpen, setZoomModalOpen] = useState(false);
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
      let imageBlob = null;
      if (webcamImage) {
        const response = await fetch(webcamImage);
        imageBlob = await response.blob();
        formData.append("file", imageBlob, "webcam-capture.jpg");
      } else {
        formData.append("file", file);
        imageBlob = file;
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
      const uploadResponse = await fetch(`${nodeApiBase}/upload-image`, {
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

      // 2. Run combined prediction and Grad-CAM using ML backend
      setResult("🔍 Analyzing image and generating Grad-CAM...");
      setIsGeneratingGradcam(true);
      if (gradcamUrl) {
        try { URL.revokeObjectURL(gradcamUrl); } catch (e) {}
      }
      setGradcamUrl("");
      let analyzeData;
      let gradcamBlob = null;
      let gradcamObjectUrl = null;
      let gradcamUri = "";
      try {
        const analyzeForm = new FormData();
        if (webcamImage) {
          analyzeForm.append("file", imageBlob, "webcam-capture.jpg");
        } else {
          analyzeForm.append("file", imageBlob);
        }
        const analyzeRes = await fetch(`${mlApiBase}/analyze/`, {
          method: "POST",
          body: analyzeForm,
        });
        if (!analyzeRes.ok) throw new Error("Failed to analyze image");
        analyzeData = await analyzeRes.json();
      } catch (err) {
        setResult("❌ " + (err.message || "Analysis failed."));
        setError(true);
        setIsUploading(false);
        setIsGeneratingGradcam(false);
        setUploadProgress(0);
        return;
      }

      // Set prediction
      const predData = analyzeData.prediction || {};
      const predicted_class = predData.predicted_class || "Unknown";
      const lesion_type = predData.lesion_type || null;
      let confidence_score = predData.confidence;
      if (confidence_score === undefined && predData.confidence_scores) {
        if (typeof predData.confidence_scores === "object") {
          const vals = Object.values(predData.confidence_scores).filter(v => typeof v === 'number');
          confidence_score = vals.length > 0 ? Math.max(...vals) : undefined;
        }
      }
      const analysis = predData.analysis || predData.summary || "";
      const predictionForUI = { predicted_class, lesion_type, confidence: confidence_score, analysis };
      setPrediction(predictionForUI);

      // Set Grad-CAM overlay and upload to backend
      if (analyzeData.gradcam_overlay_b64) {
        const byteCharacters = atob(analyzeData.gradcam_overlay_b64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        gradcamBlob = new Blob([byteArray], { type: "image/jpeg" });
        gradcamObjectUrl = URL.createObjectURL(gradcamBlob);
        setGradcamUrl(gradcamObjectUrl);

        // Upload GradCAM to backend
        try {
          const gradcamForm = new FormData();
          const gradcamFilename = (file ? file.name.replace(/(\.[^.]+)?$/, '_gradcam.jpg') : 'webcam-capture_gradcam.jpg');
          gradcamForm.append('file', gradcamBlob, gradcamFilename);
          gradcamForm.append('user_id', localStorage.getItem("user_id") || "1");
          const gradcamUploadRes = await fetch(`${nodeApiBase}/upload-gradcam`, {
            method: 'POST',
            body: gradcamForm
          });
          if (gradcamUploadRes.ok) {
            const gradcamUploadData = await gradcamUploadRes.json();
            gradcamUri = gradcamUploadData.url || "";
          } else {
            gradcamUri = "";
          }
        } catch (err) {
          gradcamUri = "";
        }
      } else {
        setGradcamUrl("");
        gradcamUri = "";
      }
      setIsGeneratingGradcam(false);

      // Store prediction and image info in backend
      const currentUser = auth.getCurrentUser && auth.getCurrentUser();
      const user_id = currentUser?.userId || localStorage.getItem("user_id") || "demo_user_id";
      const filename = file ? file.name : "webcam-capture.jpg";
      const model_version = "mobilenetv2-dermascope-v1.3";
      try {
        const storeRes = await fetch(`${nodeApiBase}/store-prediction`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id,
            image_uri: uploadData.url,
            filename,
            predicted_class,
            confidence_score, // store as number
            confidence_scores: predData, // store as JSON
            model_version,
            gradcam_uri: gradcamUri, // now set to uploaded GradCAM URI
            analysis,
            notes, // save user notes
          }),
        });
        const storeData = await storeRes.json();
        setPredictionId(storeData.prediction_id);
      } catch (err) {
        console.error("Failed to store prediction in backend:", err);
      }

      setTimeout(() => {
        setShowResults(true);
        setResult(""); // Clear the status/result message when analysis is done
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

  // Store webcam stream globally so we can access it in useEffect
  const streamRef = useRef(null);

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream; // Store stream reference
      setWebcamActive(true); // This will trigger the video element to render
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
    // Stop tracks from stream reference first
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach(track => track.stop());
      streamRef.current = null;
    }
    // Also clean up video srcObject as a fallback
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setWebcamActive(false);
  };

  // Effect to set the video srcObject after the video element is rendered
  useEffect(() => {
    if (webcamActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [webcamActive]);

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
        background: "var(--primary-gradient)",
        fontFamily: "var(--font-geist-sans, sans-serif)",
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(20px)",
        transition: "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
      }}>
        {/* Header */}
        <header style={{
          background: "var(--card-background)",
          backdropFilter: "blur(20px)",
          boxShadow: "var(--shadow-lg)",
          padding: "24px 0",
          borderBottom: "1px solid var(--border-color)",
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
                margin: 0,
                marginBottom: 4,
                background: "linear-gradient(90deg, var(--info-color), var(--primary-color, #a855f7))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                📤 Upload & Analyze
              </h1>
              <p style={{ color: "var(--text-secondary)", fontSize: 16, margin: 0 }}>
                Upload medical images for AI-powered analysis
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <Link href="/dashboard" className={styles.backLink}>
                ← Back to Dashboard
              </Link>
              <ThemeToggle />
            </div>
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
            <div className="fade-in-up" style={{
              background: "var(--card-background)",
              borderRadius: 24,
              padding: 40,
              boxShadow: "var(--shadow-lg)",
              border: "1px solid var(--card-border)"
            }}>
              <h2 style={{
                fontSize: 24,
                fontWeight: 700,
                color: "var(--text-primary)",
                marginBottom: 24,
                textAlign: "center"
              }}>
                🎯 Select Image
              </h2>

              <form onSubmit={handleSubmit}>
                {/* File Upload Zone */}
                <div className="upload-zone" style={{
                  border: "3px dashed var(--card-border)",
                  borderRadius: 16,
                  padding: 40,
                  textAlign: "center",
                  marginBottom: 24,
                  background: "var(--hover-background)",
                  cursor: "pointer"
                }} onClick={() => document.getElementById('fileInput').click()}>
                  {imageUrl ? (
                    <div>
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "100%",
                        margin: "0 auto 16px",
                        borderRadius: "12px",
                        overflow: "hidden",
                        boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
                        background: "var(--input-background)",
                        maxWidth: "180px",
                        maxHeight: "180px",
                        aspectRatio: "1/1",
                        position: "relative"
                      }}>
                        <Image
                          src={imageUrl}
                          alt="Selected image"
                          width={180}
                          height={180}
                          style={{
                            display: "block",
                            maxWidth: "100%",
                            maxHeight: "100%",
                            width: "auto",
                            height: "auto",
                            objectFit: "contain",
                            borderRadius: "12px",
                            background: "var(--input-background)"
                          }}
                        />
                        {/* Zoom button overlay */}
                        <button
                          type="button"
                          onClick={e => { e.stopPropagation(); setZoomModalOpen(true); }}
                          style={{
                            position: "absolute",
                            bottom: 8,
                            right: 8,
                            background: "rgba(0,0,0,0.7)",
                            color: "#fff",
                            border: "none",
                            borderRadius: "50%",
                            width: 36,
                            height: 36,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                            zIndex: 2
                          }}
                          title="Zoom image"
                        >
                          <span style={{ fontSize: 20 }}>🔍</span>
                        </button>
                      </div>
                      <p style={{ color: "var(--success-color)", fontWeight: 600 }}>
                        ✅ Image selected successfully
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: "60px", marginBottom: "16px" }}>📁</div>
                      <p style={{ color: "var(--text-primary)", fontSize: "18px", fontWeight: 500 }}>
                        Click to browse or drag & drop image
                      </p>
                      <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "8px" }}>
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
                          background: "var(--info-color)",
                          color: "white",
                          border: "none",
                          padding: "12px 20px",
                          borderRadius: 12,
                          fontWeight: 600,
                          boxShadow: "var(--shadow-md)",
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
                            background: "var(--success-color)",
                            color: "white",
                            border: "none",
                            padding: "12px 20px",
                            borderRadius: 12,
                            fontWeight: 600,
                            boxShadow: "var(--shadow-md)",
                          }}
                        >
                          📷 Capture
                        </button>
                        <button
                          type="button"
                          onClick={stopWebcam}
                          className="interactive-button"
                          style={{
                            background: "var(--error-color)",
                            color: "white",
                            border: "none",
                            padding: "12px 20px",
                            borderRadius: 12,
                            fontWeight: 600,
                            boxShadow: "var(--shadow-md)",
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
                          boxShadow: "var(--shadow-lg)"
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
                    color: "var(--text-primary)",
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
                      border: "2px solid var(--input-border)",
                      borderRadius: 12,
                      fontSize: 16,
                      boxSizing: "border-box",
                      background: "var(--input-background)",
                      color: "var(--text-primary)",
                      minHeight: "100px",
                      resize: "vertical",
                    }}
                    onFocus={(e) => e.target.style.borderColor = "var(--info-color)"}
                    onBlur={(e) => e.target.style.borderColor = "var(--input-border)"}
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
                      ? "var(--text-muted)" 
                      : (!file && !webcamImage)
                      ? "var(--text-muted)"
                      : "var(--info-color)",
                    color: "white",
                    border: "none",
                    padding: "18px 24px",
                    borderRadius: 12,
                    fontSize: 18,
                    fontWeight: 700,
                    cursor: isUploading || (!file && !webcamImage) ? "not-allowed" : "pointer",
                    boxShadow: isUploading || (!file && !webcamImage) 
                      ? "none" 
                      : "var(--shadow-md)",
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
                      background: "var(--info-color)",
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
                    ? "var(--error-background, #fef2f2)"
                    : "var(--success-background, #f0f9ff)",
                  border: `2px solid ${error ? "var(--error-color)" : "var(--success-color)"}`,
                  borderRadius: 12,
                  color: error ? "var(--error-color)" : "var(--success-color)",
                  fontWeight: 600,
                  textAlign: "center"
                }}>
                  {error ? "❌" : "✅"} {result}
                </div>
              )}
            </div>

            {/* Analysis Results */}
            <div className="fade-in-up" style={{
              background: "var(--card-background)",
              borderRadius: 24,
              padding: 40,
              boxShadow: "var(--shadow-lg)",
              border: "1px solid var(--card-border)"
            }}>
              <h2 style={{
                fontSize: 24,
                fontWeight: 700,
                color: "var(--text-primary)",
                marginBottom: 24,
                textAlign: "center"
              }}>
                🔬 Analysis Results
              </h2>

              {!showResults ? (
                <div style={{
                  textAlign: "center",
                  padding: "60px 20px",
                  color: "var(--text-secondary)"
                }}>
                  <div style={{ fontSize: "80px", marginBottom: "20px", opacity: 0.3 }}>
                    🏥
                  </div>
                  <p style={{ fontSize: "18px", fontWeight: 500 }}>
                    Upload an image to see AI analysis results
                  </p>
                </div>
              ) : prediction ? (
                <div className="fade-in-up" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  {/* Responsive card and next steps in one parent */}
                  <div
                    style={{
                      background: prediction.predicted_class && (prediction.predicted_class.toLowerCase().includes("benign") || prediction.predicted_class.toLowerCase().includes("nevus"))
                        ? "var(--success-background, #f0fdf4)"
                        : "var(--error-background, #fef2f2)",
                      border: `2px solid ${prediction.predicted_class && (prediction.predicted_class.toLowerCase().includes("benign") || prediction.predicted_class.toLowerCase().includes("nevus")) ? "var(--success-color)" : "var(--error-color)"}`,
                      borderRadius: 16,
                      padding: 24,
                      marginBottom: 24,
                      width: "100%",
                      maxWidth: 500,
                      boxShadow: "var(--shadow-md)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      boxSizing: "border-box"
                    }}
                  >
                    <div style={{ fontSize: 36, marginBottom: 8 }}>
                      {prediction.predicted_class && (prediction.predicted_class.toLowerCase().includes("benign") || prediction.predicted_class.toLowerCase().includes("nevus")) ? "✅" : "⚠️"}
                    </div>
                    <div style={{
                      fontWeight: 700,
                      fontSize: 20,
                      color: prediction.predicted_class && (prediction.predicted_class.toLowerCase().includes("benign") || prediction.predicted_class.toLowerCase().includes("nevus"))
                        ? "var(--success-color)"
                        : "var(--error-color)",
                      marginBottom: 8,
                      textAlign: "center"
                    }}>
                      Prediction: <span style={{ fontWeight: 700, fontSize: 22 }}>{prediction.predicted_class || "Unknown"}</span>
                      {prediction.lesion_type && (
                        <>
                          <br />
                          Lesion Type: <span style={{ fontWeight: 700, fontSize: 18 }}>{prediction.lesion_type}</span>
                        </>
                      )}
                      <br />
                      Confidence: <span style={{ fontWeight: 700, fontSize: 20 }}>{typeof prediction.confidence === "number" ? prediction.confidence.toFixed(2) : prediction.confidence}%</span>
                    </div>
                    <div style={{
                      color: "var(--text-primary)",
                      fontSize: 15,
                      marginBottom: 8,
                      textAlign: "center"
                    }}>
                      {prediction.analysis || (prediction.predicted_class && (prediction.predicted_class.toLowerCase().includes("benign") || prediction.predicted_class.toLowerCase().includes("nevus"))
                        ? "No concerning features detected."
                        : "Some features may be concerning. Please consult a dermatologist.")}
                    </div>
                  </div>
                  <div style={{
                    padding: "20px",
                    background: "var(--hover-background)",
                    borderRadius: "12px",
                    border: "1px solid var(--card-border)",
                    width: "100%",
                    maxWidth: 500,
                    boxSizing: "border-box"
                  }}>
                    <h4 style={{
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "var(--text-primary)",
                      marginBottom: "12px"
                    }}>
                      📋 Next Steps:
                    </h4>
                    <ul style={{
                      color: "var(--text-secondary)",
                      paddingLeft: "20px",
                      lineHeight: "1.6",
                      margin: 0
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

              {/* Gradcam Viewer - to be displayed after the prediction card */}
              {prediction && gradcamUrl && (
                <div style={{ margin: '32px 0', width: '100%', display: 'flex', justifyContent: 'center' }}>
                  <GradcamViewer
                    originalUrl={imageUrl}
                    gradcamUrl={gradcamUrl}
                    alt="Skin lesion and Grad-CAM"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Features Section */}
          <div style={{ marginTop: "60px" }}>
            <h2 style={{
              fontSize: "28px",
              fontWeight: "700",
              color: "var(--text-primary)",
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
                className="feature-card"
                style={{
                  background: "var(--card-background)",
                  padding: "24px",
                  borderRadius: "16px",
                  textAlign: "center",
                  boxShadow: "var(--shadow-lg)",
                  border: "1px solid var(--card-border)"
                }}
                onMouseEnter={() => setHoveredFeature('ai')}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <div style={{ fontSize: "40px", marginBottom: "16px" }}>🤖</div>
                <h3 style={{ fontSize: "18px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "12px" }}>
                  AI-Powered Detection
                </h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: "1.5" }}>
                  Advanced neural networks trained on thousands of medical images
                </p>
              </div>

              <div 
                className="feature-card"
                style={{
                  background: "var(--card-background)",
                  padding: "24px",
                  borderRadius: "16px",
                  textAlign: "center",
                  boxShadow: "var(--shadow-lg)",
                  border: "1px solid var(--card-border)"
                }}
                onMouseEnter={() => setHoveredFeature('confidence')}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <div style={{ fontSize: "40px", marginBottom: "16px" }}>📊</div>
                <h3 style={{ fontSize: "18px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "12px" }}>
                  Confidence Scoring
                </h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: "1.5" }}>
                  Detailed confidence metrics for transparent decision making
                </p>
              </div>

              <div 
                className="feature-card"
                style={{
                  background: "var(--card-background)",
                  padding: "24px",
                  borderRadius: "16px",
                  textAlign: "center",
                  boxShadow: "var(--shadow-lg)",
                  border: "1px solid var(--card-border)"
                }}
                onMouseEnter={() => setHoveredFeature('instant')}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <div style={{ fontSize: "40px", marginBottom: "16px" }}>⚡</div>
                <h3 style={{ fontSize: "18px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "12px" }}>
                  Instant Results
                </h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: "1.5" }}>
                  Get comprehensive analysis results in seconds
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
      {/* Zoom Modal rendered as a portal, outside the card/page layout */}
      {zoomModalOpen && (
        <ZoomModal
          src={imageUrl}
          alt="Zoomed preview"
          onClose={() => setZoomModalOpen(false)}
        />
      )}
    </>
  );
};

export default UploadImage;

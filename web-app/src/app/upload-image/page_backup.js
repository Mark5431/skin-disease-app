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
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const router = useRouter();
  const nodeApiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";  // Node.js backend (file upload, database)
  const mlApiBase = process.env.NEXT_PUBLIC_ML_API_BASE || "http://localhost:5000";    // Python ML backend (prediction, gradcam)

  useEffect(() => {
    // Check authentication
    if (!auth.isAuthenticated()) {
      router.push("/login");
      return;
    }
    setLoading(false);
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResult("");
    setError(false);
    setImageUrl("");
    setPrediction(null);
    setGradcamUrl("");
    setPredictionId(null);
    setShowResults(false);
    setIsUploading(true);
    setUploadProgress(0);
    
    let uploadFile = file;
    if (!uploadFile && webcamImage) {
      uploadFile = webcamImage;
    }
    if (!uploadFile) {
      setResult("Please select or capture an image.");
      setError(true);
      setIsUploading(false);
      return;
    }
    try {
      // 1. Upload the original image and get its URL
      setUploadProgress(20);
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("notes", notes);
      const imageRes = await fetch(`${nodeApiBase}/upload-image`, {
        method: "POST",
        body: formData,
      });
      const imageData = await imageRes.json();
      if (!imageData.url) throw new Error(imageData.error || "Upload failed");
      setImageUrl(imageData.url);
      setUploadProgress(50);
      
      // 2. Run prediction
      setResult("🔍 Analyzing image...");
      const predForm = new FormData();
      predForm.append("file", uploadFile);
      const predRes = await fetch(`${mlApiBase}/predict/`, {
        method: "POST",
        body: predForm,
      });
      const predData = await predRes.json();
      if (predData.error || predData.detail)
        throw new Error(predData.error || predData.detail);
      setPrediction(predData);
      setUploadProgress(80);
      
      setResult(
        `✅ Prediction: ${predData.lesion_type} | Confidence: ${predData.confidence_scores[predData.lesion_type].toFixed(
          2
        )}%`
      );
      setUploadProgress(100);
      
      // 3. Store prediction and image info in backend (without gradcam_uri)
      const currentUser = auth.getCurrentUser();
      const user_id = currentUser?.userId || "demo_user_id";
      const filename = uploadFile.name || "webcam.jpg";
      const predicted_class = predData.predicted_class || predData.lesion_type;
      const confidence_scores = predData.confidence_scores; // send the full object
      const model_version = "mobilenetv2-dermascope-v1.3";
      const storeRes = await fetch(`${nodeApiBase}/store-prediction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id,
          image_uri: imageData.url,
          filename,
          predicted_class,
          confidence_scores,
          model_version,
          gradcam_uri: "",
        }),
      });
      const storeData = await storeRes.json();
      setPredictionId(storeData.prediction_id);
      
      setTimeout(() => {
        setShowResults(true);
      }, 500);
    } catch (err) {
      setResult("❌ " + (err.message || "Prediction failed."));
      setError(true);
    } finally {
      setIsUploading(false);
    }
  };

  const handleGradcam = async () => {
    let uploadFile = file;
    if (!uploadFile && webcamImage) {
      uploadFile = webcamImage;
    }
    if (!uploadFile) return;
    
    setIsGeneratingGradcam(true);
    setResult("🎨 Generating Grad-CAM visualization...");
    
    try {
      const gradcamForm = new FormData();
      gradcamForm.append("file", uploadFile);
      const gradcamRes = await fetch(`${mlApiBase}/gradcam/`, {
        method: "POST",
        body: gradcamForm,
      });
      if (!gradcamRes.ok) throw new Error("Failed to get Grad-CAM");
      const gradcamBlob = await gradcamRes.blob();
      const gradcamFilename = (uploadFile.name || "webcam.jpg").replace(
        /(\.[^.]+)?$/,
        "_gradcam.jpg"
      );
      const gradcamFile = new File([gradcamBlob], gradcamFilename, {
        type: "image/jpeg",
      });
      // Upload Grad-CAM image to backend
      const gradcamUploadRes = await fetch(`${nodeApiBase}/upload-gradcam`, {
        method: "POST",
        body: (() => {
          const fd = new FormData();
          fd.append("file", gradcamFile, gradcamFilename);
          return fd;
        })(),
      });
      const gradcamUploadData = await gradcamUploadRes.json();
      if (!gradcamUploadData.url) throw new Error("Failed to upload Grad-CAM");
      setGradcamUrl(gradcamUploadData.url);
      // Update prediction document with gradcam_uri
      if (predictionId && gradcamUploadData.url) {
        await fetch(`${nodeApiBase}/update-gradcam-uri`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prediction_id: predictionId, gradcam_uri: gradcamUploadData.url }),
        });
      }
      setResult("✨ Grad-CAM generated successfully!");
    } catch (err) {
      setResult("❌ " + (err.message || "Grad-CAM failed."));
      setError(true);
    } finally {
      setIsGeneratingGradcam(false);
    }
  };

  const startWebcam = async () => {
    setWebcamActive(true);
    setWebcamImage(null);
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    }
  };

  const stopWebcam = () => {
    setWebcamActive(false);
    setWebcamImage(null);
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      context.drawImage(videoRef.current, 0, 0, 320, 240);
      canvasRef.current.toBlob(
        (blob) => {
          setWebcamImage(
            new File([blob], "webcam.jpg", { type: "image/jpeg" })
          );
        },
        "image/jpeg"
      );
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        minHeight: "100vh",
        fontFamily: "var(--font-geist-sans, sans-serif)",
      }}>
        <p style={{ fontSize: 18, color: "#6b7280" }}>Loading...</p>
      </div>
    );
  }

  return (
    <>
      <style jsx>{`
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
        
        @keyframes shimmer {
          0% {
            background-position: -200px 0;
          }
          100% {
            background-position: calc(200px + 100%) 0;
          }
        }
        
        .fade-in-up {
          animation: fadeInUp 0.6s ease-out;
        }
        
        .pulse {
          animation: pulse 2s infinite;
        }
        
        .shimmer {
          background: linear-gradient(90deg, #f0f0f0 0px, #e0e0e0 40px, #f0f0f0 80px);
          background-size: 200px;
          animation: shimmer 1.5s infinite;
        }
        
        .hover-lift {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .hover-lift:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(37, 99, 235, 0.15);
        }
        
        .scale-on-hover {
          transition: transform 0.2s ease;
        }
        
        .scale-on-hover:hover {
          transform: scale(1.05);
        }
        
        .progress-bar {
          width: 100%;
          height: 4px;
          background: #e5e7eb;
          border-radius: 2px;
          overflow: hidden;
          margin: 16px 0;
        }
        
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #2563eb, #38bdf8);
          border-radius: 2px;
          transition: width 0.3s ease;
        }
        
        .glass-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .gradient-text {
          background: linear-gradient(90deg, #2563eb, #38bdf8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>

      {/* Header */}
      <header
        className="hover-lift"
        style={{
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 4px 32px rgba(0,0,0,0.08)",
          padding: "20px 0",
          position: "sticky",
          top: 0,
          zIndex: 100,
          borderBottom: "1px solid rgba(37, 99, 235, 0.1)",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "0 20px",
            display: "flex",
            alignItems: "center",
            gap: 20,
          }}
        >
          <button
            onClick={() => router.push("/dashboard")}
            className="scale-on-hover"
            style={{
              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
              color: "white",
              border: "none",
              padding: "12px 20px",
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.3s ease",
              boxShadow: "0 4px 16px rgba(37, 99, 235, 0.3)",
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "scale(1.05)";
              e.target.style.boxShadow = "0 8px 25px rgba(37, 99, 235, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "scale(1)";
              e.target.style.boxShadow = "0 4px 16px rgba(37, 99, 235, 0.3)";
            }}
          >
            ← Dashboard
          </button>
          <h1
            className="gradient-text"
            style={{
              fontSize: 24,
              fontWeight: 700,
              margin: 0,
            }}
          >
            🔬 AI Medical Analysis
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <div
        className="fade-in-up glass-card hover-lift"
        style={{
          maxWidth: 520,
          margin: "60px auto",
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(20px)",
          borderRadius: 24,
          boxShadow: "0 8px 32px rgba(37, 99, 235, 0.15)",
          padding: 40,
          fontFamily: "var(--font-geist-sans, sans-serif)",
          color: "#222",
          border: "1px solid rgba(255, 255, 255, 0.2)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              width: 80,
              height: 80,
              background: "linear-gradient(135deg, #2563eb, #38bdf8)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              fontSize: 32,
              animation: isUploading ? "pulse 2s infinite" : "none",
            }}
          >
            {isUploading ? "⏳" : "🔬"}
          </div>
          <h1
            className="gradient-text"
            style={{
              fontSize: 32,
              fontWeight: 700,
              margin: 0,
              marginBottom: 8,
            }}
          >
            Medical Image Analysis
          </h1>
          <p style={{ color: "#64748b", fontSize: 16, margin: 0 }}>
            Upload an image for AI-powered medical analysis
          </p>
        </div>

        {/* Progress Bar */}
        {isUploading && (
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}
      <form onSubmit={handleSubmit} style={{ marginTop: 24 }}>
        {/* File Input Section */}
        <div 
          className="hover-lift"
          style={{ 
            marginBottom: 24,
            padding: 20,
            border: file ? "2px solid #2563eb" : "2px dashed #cbd5e1",
            borderRadius: 16,
            textAlign: "center",
            background: file ? "rgba(37, 99, 235, 0.05)" : "#f8fafc",
            transition: "all 0.3s ease",
            cursor: "pointer",
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.currentTarget.style.borderColor = "#2563eb";
            e.currentTarget.style.background = "rgba(37, 99, 235, 0.1)";
          }}
          onDragLeave={(e) => {
            e.currentTarget.style.borderColor = file ? "#2563eb" : "#cbd5e1";
            e.currentTarget.style.background = file ? "rgba(37, 99, 235, 0.05)" : "#f8fafc";
          }}
          onDrop={(e) => {
            e.preventDefault();
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile && droppedFile.type.startsWith('image/')) {
              setFile(droppedFile);
            }
            e.currentTarget.style.borderColor = "#2563eb";
            e.currentTarget.style.background = "rgba(37, 99, 235, 0.05)";
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 12 }}>
            {file ? "✅" : "📁"}
          </div>
          <label
            htmlFor="image"
            style={{
              display: "block",
              marginBottom: 8,
              fontWeight: 600,
              fontSize: 18,
              color: file ? "#2563eb" : "#374151",
              cursor: "pointer",
            }}
          >
            {file ? file.name : "Choose Image or Drag & Drop"}
          </label>
          <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>
            {file ? "Image selected! Ready to analyze." : "Supports JPG, PNG, JPEG formats"}
          </p>
          <input
            type="file"
            id="image"
            name="image"
            accept="image/*"
            onChange={(e) => setFile(e.target.files[0])}
            style={{
              position: "absolute",
              opacity: 0,
              width: 1,
              height: 1,
              overflow: "hidden",
            }}
          />
        </div>

        {/* Webcam Section */}
        <div style={{ marginBottom: 24 }}>
          <button
            type="button"
            onClick={webcamActive ? stopWebcam : startWebcam}
            className="scale-on-hover"
            style={{
              background: webcamActive 
                ? "linear-gradient(135deg, #ef4444, #dc2626)" 
                : "linear-gradient(135deg, #2563eb, #1d4ed8)",
              color: "#fff",
              padding: "12px 24px",
              borderRadius: 12,
              fontWeight: 600,
              fontSize: 16,
              border: "none",
              cursor: "pointer",
              width: "100%",
              boxShadow: webcamActive 
                ? "0 4px 16px rgba(239, 68, 68, 0.3)" 
                : "0 4px 16px rgba(37, 99, 235, 0.3)",
              transition: "all 0.3s ease",
            }}
          >
            {webcamActive ? "🛑 Stop Webcam" : "📹 Use Webcam"}
          </button>
          {webcamActive && (
            <div 
              className="fade-in-up"
              style={{ 
                marginTop: 20, 
                textAlign: "center",
                padding: 20,
                background: "linear-gradient(135deg, #f1f5f9, #e2e8f0)",
                borderRadius: 16,
                border: "1px solid #cbd5e1",
              }}
            >
              <video
                ref={videoRef}
                width={320}
                height={240}
                style={{
                  borderRadius: 12,
                  border: "3px solid #2563eb",
                  boxShadow: "0 8px 24px rgba(37, 99, 235, 0.2)",
                }}
              />
              <br />
              <button
                type="button"
                onClick={captureImage}
                className="scale-on-hover"
                style={{
                  marginTop: 16,
                  background: "linear-gradient(135deg, #38bdf8, #0ea5e9)",
                  color: "#fff",
                  padding: "12px 24px",
                  borderRadius: 12,
                  fontWeight: 600,
                  fontSize: 16,
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 4px 16px rgba(56, 189, 248, 0.3)",
                }}
              >
                📸 Capture Image
              </button>
              <canvas
                ref={canvasRef}
                width={320}
                height={240}
                style={{ display: "none" }}
              />
            </div>
          )}
        </div>
        {webcamImage && (
          <div 
            className="fade-in-up"
            style={{ 
              marginTop: 20, 
              textAlign: "center",
              padding: 20,
              background: "linear-gradient(135deg, #ecfdf5, #d1fae5)",
              borderRadius: 16,
              border: "2px solid #10b981",
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 12 }}>✅</div>
            <Image
              src={URL.createObjectURL(webcamImage)}
              alt="Webcam Preview"
              width={280}
              height={210}
              className="hover-lift"
              style={{
                borderRadius: 12,
                border: "3px solid #10b981",
                marginBottom: 12,
                objectFit: "cover",
                boxShadow: "0 8px 24px rgba(16, 185, 129, 0.2)",
              }}
              unoptimized
            />
            <div style={{ 
              fontSize: 16, 
              color: "#059669", 
              fontWeight: 600,
              background: "rgba(16, 185, 129, 0.1)",
              padding: "8px 16px",
              borderRadius: 8,
              display: "inline-block",
            }}>
              📷 Webcam image captured successfully!
            </div>
          </div>
        )}

        {/* Notes Section */}
        <div style={{ marginBottom: 24 }}>
          <label
            htmlFor="notes"
            style={{
              display: "block",
              marginBottom: 12,
              fontWeight: 600,
              fontSize: 16,
              color: "#374151",
            }}
          >
            📝 Additional Notes (Optional)
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any relevant medical history, symptoms, or observations..."
            style={{
              width: "100%",
              padding: 16,
              borderRadius: 12,
              border: "2px solid #e5e7eb",
              fontSize: 16,
              background: "#f8fafc",
              transition: "all 0.3s ease",
              fontFamily: "inherit",
              resize: "vertical",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#2563eb";
              e.target.style.background = "#fff";
              e.target.style.boxShadow = "0 0 0 3px rgba(37, 99, 235, 0.1)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#e5e7eb";
              e.target.style.background = "#f8fafc";
              e.target.style.boxShadow = "none";
            }}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isUploading || (!file && !webcamImage)}
          className={isUploading ? "pulse" : "scale-on-hover"}
          style={{
            width: "100%",
            background: isUploading 
              ? "linear-gradient(90deg, #64748b, #475569)" 
              : "linear-gradient(90deg, #2563eb 0%, #38bdf8 100%)",
            color: "#fff",
            padding: 16,
            borderRadius: 12,
            fontWeight: 700,
            fontSize: 18,
            border: "none",
            cursor: isUploading ? "not-allowed" : "pointer",
            boxShadow: isUploading 
              ? "0 4px 16px rgba(100, 116, 139, 0.3)"
              : "0 6px 20px rgba(37, 99, 235, 0.4)",
            transition: "all 0.3s ease",
            opacity: (!file && !webcamImage) ? 0.5 : 1,
          }}
        >
          {isUploading 
            ? `🔄 Analyzing... ${uploadProgress}%` 
            : "🚀 Start AI Analysis"}
        </button>
        {/* Status Messages */}
        {result && (
          <div
            className="fade-in-up"
            style={{
              marginTop: 24,
              padding: 16,
              borderRadius: 12,
              textAlign: "center",
              fontWeight: 600,
              fontSize: 16,
              background: error 
                ? "linear-gradient(135deg, #fef2f2, #fee2e2)"
                : "linear-gradient(135deg, #f0fdf4, #dcfce7)",
              color: error ? "#dc2626" : "#16a34a",
              border: error ? "2px solid #fca5a5" : "2px solid #86efac",
              boxShadow: error 
                ? "0 4px 16px rgba(220, 38, 38, 0.1)"
                : "0 4px 16px rgba(22, 163, 74, 0.1)",
            }}
          >
            {result}
          </div>
        )}
      </form>

      {/* Results Section */}
      {imageUrl && (
        <div 
          className={`fade-in-up ${showResults ? 'show' : ''}`}
          style={{ 
            marginTop: 32, 
            textAlign: "center",
            padding: 24,
            background: "linear-gradient(135deg, #f8fafc, #f1f5f9)",
            borderRadius: 16,
            border: "1px solid #e2e8f0",
          }}
        >
          <h3 style={{ 
            fontSize: 20, 
            fontWeight: 700, 
            marginBottom: 16,
            color: "#1e293b",
          }}>
            📊 Analysis Results
          </h3>
          <Image
            src={imageUrl}
            alt="Uploaded"
            width={320}
            height={240}
            className="hover-lift"
            style={{
              maxWidth: "100%",
              borderRadius: 12,
              boxShadow: "0 8px 24px rgba(37, 99, 235, 0.15)",
              height: "auto",
              border: "3px solid #2563eb",
            }}
          />
        </div>
      )}

      {prediction && showResults && (
        <div 
          className="fade-in-up"
          style={{ 
            marginTop: 24, 
            textAlign: "center",
            padding: 24,
            background: "linear-gradient(135deg, #eff6ff, #dbeafe)",
            borderRadius: 16,
            border: "2px solid #2563eb",
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 12 }}>🎯</div>
          <div
            style={{
              fontWeight: 700,
              color: "#1d4ed8",
              fontSize: 24,
              marginBottom: 8,
            }}
          >
            Prediction: {prediction.lesion_type}
          </div>
          <div
            style={{
              color: "#64748b",
              fontSize: 18,
              marginBottom: 20,
              background: "rgba(37, 99, 235, 0.1)",
              padding: "8px 16px",
              borderRadius: 8,
              display: "inline-block",
            }}
          >
            Confidence: {prediction.confidence_scores[prediction.lesion_type].toFixed(2)}%
          </div>
          <button
            type="button"
            onClick={handleGradcam}
            disabled={isGeneratingGradcam}
            className={isGeneratingGradcam ? "pulse" : "scale-on-hover"}
            style={{
              background: isGeneratingGradcam
                ? "linear-gradient(135deg, #64748b, #475569)"
                : "linear-gradient(135deg, #38bdf8, #0ea5e9)",
              color: "#fff",
              padding: "12px 24px",
              borderRadius: 12,
              fontWeight: 600,
              fontSize: 16,
              border: "none",
              cursor: isGeneratingGradcam ? "not-allowed" : "pointer",
              boxShadow: "0 4px 16px rgba(56, 189, 248, 0.3)",
              transition: "all 0.3s ease",
            }}
          >
            {isGeneratingGradcam ? "🎨 Generating..." : "🔍 Show Grad-CAM Heatmap"}
          </button>
        </div>
      )}

      {gradcamUrl && (
        <div 
          className="fade-in-up"
          style={{ 
            marginTop: 24, 
            textAlign: "center",
            padding: 24,
            background: "linear-gradient(135deg, #fefce8, #fef3c7)",
            borderRadius: 16,
            border: "2px solid #f59e0b",
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔥</div>
          <h3 style={{ 
            fontSize: 20, 
            fontWeight: 700, 
            marginBottom: 16,
            color: "#92400e",
          }}>
            Grad-CAM Heatmap Analysis
          </h3>
          <Image
            src={gradcamUrl}
            alt="Grad-CAM"
            width={320}
            height={240}
            className="hover-lift"
            style={{
              maxWidth: "100%",
              borderRadius: 12,
              boxShadow: "0 8px 24px rgba(245, 158, 11, 0.2)",
              height: "auto",
              border: "3px solid #f59e0b",
            }}
          />
          <p style={{ 
            fontSize: 14, 
            color: "#92400e", 
            marginTop: 12,
            background: "rgba(245, 158, 11, 0.1)",
            padding: "8px 12px",
            borderRadius: 8,
            display: "inline-block",
          }}>
            🎯 Red areas indicate regions the AI focused on for diagnosis
          </p>
        </div>
      )}
      {/* Footer Info */}
      <div
        style={{
          marginTop: 32,
          textAlign: "center",
          padding: 20,
          background: "linear-gradient(135deg, #f1f5f9, #e2e8f0)",
          borderRadius: 16,
          border: "1px solid #cbd5e1",
        }}
      >
        <div style={{ fontSize: 24, marginBottom: 8 }}>🔒</div>
        <p style={{
          fontSize: 14,
          color: "#64748b",
          margin: 0,
          lineHeight: 1.6,
        }}>
          <strong>Privacy & Security:</strong> All uploaded images are processed securely. 
          Device metadata is automatically collected for analysis accuracy.
        </p>
      </div>
      </div>
    </>
  );
};

export default UploadImage;
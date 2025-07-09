"use client";
import useIsMobile from "../hooks/useIsMobile";
import React, { useEffect, useState } from "react";
import ImageZoomModal from "./ImageZoomModal";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { auth } from "../utils/auth";
import ThemeToggle from "../components/ThemeToggle";

import dynamic from 'next/dynamic';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ConfidenceTrendChart from '../components/ConfidenceTrendChart';

// Dynamic import for timeline component to avoid SSR issues
const TimelineChart = dynamic(() => import('../components/TimelineChart'), { 
  ssr: false,
  loading: () => (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    </div>
  )
});

const ImageHistory = () => {
  const isMobile = useIsMobile(480);
  const [zoomedImage, setZoomedImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [predictions, setPredictions] = useState([]);
  const [filteredPredictions, setFilteredPredictions] = useState([]);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all"); // all, benign, malignant
  const [sortBy, setSortBy] = useState("newest"); // newest, oldest, confidence
  const [viewMode, setViewMode] = useState("cards"); // cards, table, timeline
  const router = useRouter();

  useEffect(() => {
    // Check authentication
    if (!auth.isAuthenticated()) {
      router.push("/login");
      return;
    }

    // Load user's prediction history
    loadPredictions();
  }, [router]);

  const loadPredictions = async () => {
    try {
      const userPredictions = await auth.getUserPredictions();
      setPredictions(userPredictions);
      setFilteredPredictions(userPredictions);
    } catch (err) {
      setError("Failed to load prediction history");
      console.error("Error loading predictions:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort predictions
  useEffect(() => {
    let filtered = [...predictions];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(prediction =>
        prediction.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prediction.predicted_class.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply type filter
    if (filterType !== "all") {
      filtered = filtered.filter(prediction => {
        const isBenign = prediction.predicted_class.toLowerCase().includes('benign') || 
                        prediction.predicted_class.toLowerCase().includes('nevus');
        return filterType === "benign" ? isBenign : !isBenign;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return new Date(a.upload_timestamp) - new Date(b.upload_timestamp);
        case "confidence":
          const getConf = (p) => {
            if (typeof p.confidence_score === 'number') return p.confidence_score;
            if (
              p.confidence_scores &&
              typeof p.confidence_scores === 'object' &&
              p.confidence_scores.confidence_scores &&
              typeof p.confidence_scores.confidence_scores === 'object'
            ) {
              const vals = Object.values(p.confidence_scores.confidence_scores)
                .map(v => parseFloat(v))
                .filter(v => !isNaN(v));
              if (vals.length > 0) return Math.max(...vals);
            }
            return 0;
          };
          return getConf(b) - getConf(a);
        case "newest":
        default:
          return new Date(b.upload_timestamp) - new Date(a.upload_timestamp);
      }
    });

    setFilteredPredictions(filtered);
  }, [predictions, searchTerm, filterType, sortBy]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatistics = () => {
    const total = predictions.length;
    const benign = predictions.filter(p => 
      p.predicted_class.toLowerCase().includes('benign') || 
      p.predicted_class.toLowerCase().includes('nevus')
    ).length;
    const malignant = total - benign;
    const getConf = (p) => {
      if (typeof p.confidence_score === 'number') return p.confidence_score;
      if (
        p.confidence_scores &&
        typeof p.confidence_scores === 'object' &&
        p.confidence_scores.confidence_scores &&
        typeof p.confidence_scores.confidence_scores === 'object'
      ) {
        const vals = Object.values(p.confidence_scores.confidence_scores)
          .map(v => parseFloat(v))
          .filter(v => !isNaN(v));
        if (vals.length > 0) return Math.max(...vals);
      }
      return 0;
    };
    const avgConfidence = total > 0 ? 
      (predictions.reduce((sum, p) => sum + getConf(p), 0) / total).toFixed(2) : 0;
    
    return { total, benign, malignant, avgConfidence };
  };

  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    // App logo and title
    doc.setFontSize(22);
    doc.text('Analysis History Report', 40, 50);
    // User info (customize as needed)
    doc.setFontSize(12);
    doc.text(`Exported: ${new Date().toLocaleString()}`, 40, 70);
    // Table headers and rows
    const tableColumn = [
      'Date',
      'Result',
      'Confidence',
      'Summary',
      'Notes',
    ];
    const tableRows = filteredPredictions.map(pred => [
      pred.upload_timestamp ? new Date(pred.upload_timestamp).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '',
      getFullClassName(pred) || '',
      (typeof pred.confidence_score === 'number')
        ? `${pred.confidence_score.toFixed(2)}%`
        : (pred.confidence_scores && typeof pred.confidence_scores === 'object' && pred.confidence_scores.confidence_scores && typeof pred.confidence_scores.confidence_scores === 'object')
          ? (() => {
              const vals = Object.values(pred.confidence_scores.confidence_scores)
                .map(v => parseFloat(v))
                .filter(v => !isNaN(v));
              if (vals.length > 0) return `${Math.max(...vals).toFixed(2)}%`;
              return '';
            })()
          : '',
      pred.summary || pred.analysis || '',
      pred.notes || '',
    ]);
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 90,
      styles: { fontSize: 10, cellPadding: 6 },
      headStyles: { fillColor: [59, 130, 246], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: 40, right: 40 },
    });
    // Footer
    doc.setFontSize(10);
    doc.text('This report is for informational purposes only. Consult a dermatologist for medical advice.', 40, doc.internal.pageSize.height - 30);
    doc.save('analysis-history.pdf');
  };

  // Helper function to extract confidence score consistently from different data structures
  const getConfidenceScore = (prediction) => {
    if (typeof prediction.confidence_score === 'number') {
      return prediction.confidence_score;
    }
    if (
      prediction.confidence_scores &&
      typeof prediction.confidence_scores === 'object' &&
      prediction.confidence_scores.confidence_scores &&
      typeof prediction.confidence_scores.confidence_scores === 'object'
    ) {
      const vals = Object.values(prediction.confidence_scores.confidence_scores)
        .map(v => parseFloat(v))
        .filter(v => !isNaN(v));
      if (vals.length > 0) return Math.max(...vals);
    }
    return 0;
  };

  // Helper function to get the full class name from a prediction
  const getFullClassName = (prediction) => {
    if (prediction.lesion_type) {
      return prediction.lesion_type;
    }
    return prediction.predicted_class || 'Unknown';
  };

  // Helper to get the full lesion name if available
  const getLesionName = (prediction) => {
    // First priority: direct lesion_name, lesion_type, or full_name properties
    if (prediction.lesion_name) return prediction.lesion_name;
    if (prediction.lesion_type) return prediction.lesion_type;
    if (prediction.full_name) return prediction.full_name;
    
    // Second priority: check in confidence_scores for lesion_type
    if (prediction.confidence_scores?.lesion_type) return prediction.confidence_scores.lesion_type;
    
    // Fallbacks
    return prediction.predicted_class || prediction.prediction || 'Unknown';
  };

  if (loading) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        minHeight: "100vh",
        background: "var(--primary-gradient)"
      }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            background: "var(--card-background)",
            padding: "30px 50px",
            borderRadius: 20,
            boxShadow: "var(--shadow-lg)",
            backdropFilter: "blur(20px)",
          }}
        >
          <div
            style={{
              width: 24,
              height: 24,
              border: "3px solid var(--info-color)",
              borderTop: "3px solid transparent",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          />
          <div style={{ fontSize: 18, color: "var(--text-primary)", fontWeight: 600 }}>
            Loading analysis history...
          </div>
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
      `}</style>
      
      <div
        style={{
          minHeight: "100vh",
          background: "var(--primary-gradient)",
          fontFamily: "var(--font-geist-sans, sans-serif)",
        }}
      >
        {/* Header */}
        <header
          style={{
            background: "var(--card-background)",
            backdropFilter: "blur(20px)",
            boxShadow: "var(--shadow-lg)",
            padding: "24px 0",
            borderBottom: "1px solid var(--border-color)"
          }}
        >
          {isMobile ? (
            <div className="dashboard-header-mobile-stack" style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px", width: "100%" }}>
              {/* Row 1: Title */}
              <div className="dashboard-header-mobile-row" style={{ width: "100%" }}>
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
                  📊 Analysis History
                </h1>
              </div>
              {/* Row 2: Actions */}
              <div className="dashboard-header-mobile-actions">
                <ThemeToggle />
              </div>
            </div>
          ) : (
            <div
              style={{
                maxWidth: 1200,
                margin: "0 auto",
                padding: "0 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <Link
                  href="/dashboard"
                  style={{
                    textDecoration: "none",
                    fontSize: 18,
                    color: "var(--info-color)",
                  }}
                >
                  ← Back to Dashboard
                </Link>
                <h1
                  style={{
                    fontSize: "32px",
                    fontWeight: 700,
                    margin: "0 0 4px 0",
                    background: "linear-gradient(90deg, var(--info-color), var(--primary-color, #a855f7))",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  📊 Analysis History
                </h1>
              </div>
              <ThemeToggle />
            </div>
          )}
        </header>

        {/* Confidence Trend Chart */}
        <ConfidenceTrendChart predictions={filteredPredictions} />

      {/* Main Content */}
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 20px" }}>
        {error && (
          <div
            style={{
              background: "var(--card-background)",
              border: "1px solid var(--error-color)",
              color: "var(--error-color)",
              padding: 16,
              borderRadius: 8,
              marginBottom: 24,
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}

        {/* Statistics & Controls */}
        {!loading && predictions.length > 0 && (
          <>
            {/* Statistics Cards */}
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
              gap: 16, 
              marginBottom: 32 
            }}>
              {(() => {
                const stats = getStatistics();
                return (
                  <>
                    <div style={{
                      background: "var(--card-background)",
                      padding: 20,
                      borderRadius: 12,
                      boxShadow: "var(--shadow-md)",
                      border: "1px solid var(--card-border)",
                      textAlign: "center"
                    }}>
                      <div style={{ fontSize: 28, fontWeight: 700, color: "var(--info-color)" }}>
                        {stats.total}
                      </div>
                      <div style={{ fontSize: 14, color: "var(--text-secondary)", fontWeight: 500 }}>
                        Total Analyses
                      </div>
                    </div>
                    <div style={{
                      background: "var(--card-background)",
                      padding: 20,
                      borderRadius: 12,
                      boxShadow: "var(--shadow-md)",
                      border: "1px solid var(--card-border)",
                      textAlign: "center"
                    }}>
                      <div style={{ fontSize: 28, fontWeight: 700, color: "var(--success-color)" }}>
                        {stats.benign}
                      </div>
                      <div style={{ fontSize: 14, color: "var(--text-secondary)", fontWeight: 500 }}>
                        Benign Results
                      </div>
                    </div>
                    <div style={{
                      background: "var(--card-background)",
                      padding: 20,
                      borderRadius: 12,
                      boxShadow: "var(--shadow-md)",
                      border: "1px solid var(--card-border)",
                      textAlign: "center"
                    }}>
                      <div style={{ fontSize: 28, fontWeight: 700, color: "var(--warning-color)" }}>
                        {stats.malignant}
                      </div>
                      <div style={{ fontSize: 14, color: "var(--text-secondary)", fontWeight: 500 }}>
                        Concerning Results
                      </div>
                    </div>
                    <div style={{
                      background: "var(--card-background)",
                      padding: 20,
                      borderRadius: 12,
                      boxShadow: "var(--shadow-md)",
                      border: "1px solid var(--card-border)",
                      textAlign: "center"
                    }}>
                      <div style={{ fontSize: 28, fontWeight: 700, color: "var(--text-primary)" }}>
                        {stats.avgConfidence}%
                      </div>
                      <div style={{ fontSize: 14, color: "var(--text-secondary)", fontWeight: 500 }}>
                        Avg. Confidence
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Search and Filter Controls */}
            <div style={{
              background: "var(--card-background)",
              padding: 24,
              borderRadius: 12,
              boxShadow: "var(--shadow-md)",
              border: "1px solid var(--card-border)",
              marginBottom: 24,
              display: "flex",
              flexWrap: "wrap",
              gap: 16,
              alignItems: "center"
            }}>
              {/* Search */}
              <div style={{ flex: 1, minWidth: 200 }}>
                <input
                  type="text"
                  placeholder="Search by filename or result..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: 8,
                    border: "1px solid var(--input-border)",
                    background: "var(--input-background)",
                    color: "var(--text-primary)",
                    fontSize: 14,
                    outline: "none",
                    transition: "border-color 0.2s ease"
                  }}
                />
              </div>

              {/* Filter by Type */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                style={{
                  padding: "12px 16px",
                  borderRadius: 8,
                  border: "1px solid var(--input-border)",
                  background: "var(--input-background)",
                  color: "var(--text-primary)",
                  fontSize: 14,
                  outline: "none",
                  cursor: "pointer"
                }}
              >
                <option value="all">All Results</option>
                <option value="benign">Benign Only</option>
                <option value="malignant">Concerning Only</option>
              </select>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  padding: "12px 16px",
                  borderRadius: 8,
                  border: "1px solid var(--input-border)",
                  background: "var(--input-background)",
                  color: "var(--text-primary)",
                  fontSize: 14,
                  outline: "none",
                  cursor: "pointer",
                  minWidth: 140,
                  height: 44,
                  boxSizing: "border-box"
                }}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="confidence">By Confidence</option>
              </select>

              {/* View Mode Toggle */}
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => setViewMode("cards")}
                  style={{
                    padding: "12px 16px",
                    borderRadius: 8,
                    border: "1px solid var(--input-border)",
                    background: viewMode === "cards" ? "var(--info-color)" : "var(--input-background)",
                    color: viewMode === "cards" ? "white" : "var(--text-primary)",
                    fontSize: 14,
                    cursor: "pointer",
                    minWidth: 140,
                    height: 44,
                    boxSizing: "border-box",
                    outline: "none",
                    transition: "all 0.2s ease"
                  }}
                >
                  📱 Cards
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  style={{
                    padding: "12px 16px",
                    borderRadius: 8,
                    border: "1px solid var(--input-border)",
                    background: viewMode === "table" ? "var(--info-color)" : "var(--input-background)",
                    color: viewMode === "table" ? "white" : "var(--text-primary)",
                    fontSize: 14,
                    cursor: "pointer",
                    minWidth: 140,
                    height: 44,
                    boxSizing: "border-box",
                    outline: "none",
                    transition: "all 0.2s ease"
                  }}
                >
                  📊 Table
                </button>
                <button
                  onClick={() => setViewMode("timeline")}
                  style={{
                    padding: "12px 16px",
                    borderRadius: 8,
                    border: "1px solid var(--input-border)",
                    background: viewMode === "timeline" ? "var(--info-color)" : "var(--input-background)",
                    color: viewMode === "timeline" ? "white" : "var(--text-primary)",
                    fontSize: 14,
                    cursor: "pointer",
                    minWidth: 140,
                    height: 44,
                    boxSizing: "border-box",
                    outline: "none",
                    transition: "all 0.2s ease"
                  }}
                >
                  📈 Timeline
                </button>
              </div>

              {/* Export as PDF Button */}
              <button
                onClick={handleExportPDF}
                style={{
                  background: "var(--info-color)",
                  color: "white",
                  border: "none",
                  padding: "12px 20px",
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                  boxShadow: "var(--shadow-sm)",
                  transition: "background 0.2s",
                  display: "flex",
                  alignItems: "center",
                  gap: 8
                }}
                title="Export your analysis history as a PDF file"
              >
                <span role="img" aria-label="Export">📄</span> Export as PDF
              </button>

              {/* Results Count */}
              <div style={{ 
                fontSize: 14, 
                color: "var(--text-secondary)",
                fontWeight: 500,
                padding: "8px 12px",
                background: "var(--hover-background)",
                borderRadius: 6
              }}>
                {filteredPredictions.length} of {predictions.length} results
              </div>
            </div>
          </>
        )}

        {/* Empty State */}
        {!loading && predictions.length === 0 && (
          <div
            style={{
              background: "var(--card-background)",
              borderRadius: 12,
              padding: 64,
              boxShadow: "var(--shadow-lg)",
              border: "1px solid var(--card-border)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 80,
                height: 80,
                background: "var(--hover-background)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 24px",
              }}
            >
              <span style={{ fontSize: 32, color: "var(--text-muted)" }}>📋</span>
            </div>
            <h2
              style={{
                fontSize: 24,
                fontWeight: 600,
                color: "var(--text-primary)",
                marginBottom: 16,
              }}
            >
              No Analysis History Yet
            </h2>
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: 16,
                marginBottom: 32,
                maxWidth: 400,
                margin: "0 auto 32px",
              }}
            >
              You haven&apos;t uploaded any images for analysis yet. Start by uploading your first image to see your analysis history here.
            </p>
            <Link
              href="/upload-image"
              style={{
                display: "inline-block",
                background: "var(--info-color)",
                color: "white",
                textDecoration: "none",
                padding: "14px 28px",
                borderRadius: 8,
                fontWeight: 500,
                fontSize: 16,
              }}
            >
              Upload Your First Image
            </Link>
          </div>
        )}

        {/* History Items */}
        {filteredPredictions.length > 0 ? (
          <div>
            {viewMode === "timeline" ? (
              /* Timeline View */
              <TimelineChart predictions={filteredPredictions} />
            ) : viewMode === "cards" ? (
              /* Card View */
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
                  gap: 24,
                }}
              >
                {filteredPredictions.map((prediction) => (
                  <div
                    key={prediction.prediction_id}
                    style={{
                      background: "var(--card-background)",
                      borderRadius: 16,
                      padding: 24,
                      boxShadow: "var(--shadow-lg)",
                      border: "1px solid var(--card-border)",
                      transition: "all 0.3s ease",
                      cursor: "pointer",
                      position: "relative",
                      overflow: "hidden"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-4px)";
                      e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "var(--shadow-lg)";
                    }}
                  >
                    {/* Status Badge */}
                    <div style={{
                      position: "absolute",
                      top: 16,
                      right: 16,
                      padding: "4px 12px",
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 600,
                      background: prediction.predicted_class.toLowerCase().includes('benign') || 
                                prediction.predicted_class.toLowerCase().includes('nevus')
                        ? "var(--success-color)" : "var(--warning-color)",
                      color: "white"
                    }}>
                      {prediction.predicted_class.toLowerCase().includes('benign') || 
                       prediction.predicted_class.toLowerCase().includes('nevus') ? "✅ Benign" : "⚠️ Concerning"}
                    </div>

                    {/* Image */}
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ 
                        position: "relative", 
                        width: "100%", 
                        height: 220, 
                        borderRadius: 12, 
                        overflow: "hidden", 
                        background: "var(--hover-background)",
                        boxShadow: "inset 0 0 0 1px var(--card-border)"
                      }}>
                        <Image
                          src={prediction.image_uri}
                          alt={prediction.filename}
                          fill
                          style={{ objectFit: "cover" }}
                          unoptimized
                          onError={() => {
                            console.log("Image failed to load:", prediction.image_uri);
                          }}
                        />
                      </div>
                    </div>

                    {/* Prediction Details */}
                    <div style={{ marginBottom: 20 }}>
                      <h3
                        style={{
                          fontSize: 20,
                          fontWeight: 700,
                          color: "var(--text-primary)",
                          marginBottom: 12,
                          lineHeight: 1.2
                        }}
                      >
                        {getLesionName(prediction)}
                      </h3>
                      {/* Confidence Bar */}
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <span style={{ fontSize: 14, color: "var(--text-secondary)", fontWeight: 500 }}>
                            Confidence
                          </span>
                          <span style={{ 
                            fontSize: 16, 
                            fontWeight: 700, 
                            color: prediction.predicted_class.toLowerCase().includes('benign') || 
                                  prediction.predicted_class.toLowerCase().includes('nevus')
                              ? "var(--success-color)" : "var(--warning-color)"
                          }}>
                            {getConfidenceScore(prediction).toFixed(2)}%
                          </span>
                        </div>
                        <div style={{
                          width: "100%",
                          height: 8,
                          background: "var(--hover-background)",
                          borderRadius: 4,
                          overflow: "hidden"
                        }}>
                          <div style={{
                            width: `${getConfidenceScore(prediction)}%`,
                            height: "100%",
                            background: prediction.predicted_class.toLowerCase().includes('benign') || 
                                      prediction.predicted_class.toLowerCase().includes('nevus')
                              ? "var(--success-color)" : "var(--warning-color)",
                            borderRadius: 4,
                            transition: "width 0.8s ease-out"
                          }}></div>
                        </div>
                      </div>
                      {/* Notes Section */}
                      {prediction.notes && (
                        <div style={{
                          background: "var(--hover-background)",
                          padding: 12,
                          borderRadius: 8,
                          marginBottom: 8,
                          color: "var(--text-secondary)",
                          fontSize: 14
                        }}>
                          <span style={{ fontWeight: 600 }}>Notes:</span> {prediction.notes}
                        </div>
                      )}
                      {/* Metadata */}
                      <div style={{
                        background: "var(--hover-background)",
                        padding: 16,
                        borderRadius: 8,
                        marginBottom: 16
                      }}>
                        <div style={{ 
                          fontSize: 14, 
                          color: "var(--text-secondary)", 
                          marginBottom: 8,
                          display: "flex",
                          alignItems: "center",
                          gap: 8
                        }}>
                          <span>📅</span>
                          {formatDate(prediction.upload_timestamp)}
                        </div>
                        <div style={{ 
                          fontSize: 13, 
                          color: "var(--text-muted)",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          wordBreak: "break-all"
                        }}>
                          <span>📎</span>
                          {prediction.filename}
                        </div>
                      </div>
                      {/* Action Buttons */}
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => setZoomedImage(prediction.image_uri)}
                          style={{
                            flex: 1,
                            background: "linear-gradient(90deg, #2563eb 0%, #1e40af 100%)",
                            border: "none",
                            color: "#fff",
                            padding: "12px 0",
                            borderRadius: 8,
                            fontSize: 15,
                            fontWeight: 700,
                            cursor: "pointer",
                            transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8,
                            boxShadow: "0 2px 12px rgba(37,99,235,0.10)",
                            letterSpacing: 0.5,
                            outline: "none"
                          }}
                          title="Zoom image"
                          onMouseEnter={e => e.currentTarget.style.background = "linear-gradient(90deg, #1e40af 0%, #2563eb 100%)"}
                          onMouseLeave={e => e.currentTarget.style.background = "linear-gradient(90deg, #2563eb 0%, #1e40af 100%)"}
                        >
                          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" style={{marginRight: 6}}><path stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m1.35-4.15A7 7 0 1 1 5 5a7 7 0 0 1 13 7Z"/></svg>
                          <span>Zoom</span>
                        </button>
                      </div>
      {/* Image Zoom Modal */}
      <ImageZoomModal src={zoomedImage} alt="Zoomed preview" onClose={() => setZoomedImage(null)} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Table View */
              <div style={{
                background: "var(--card-background)",
                borderRadius: 12,
                boxShadow: "var(--shadow-lg)",
                border: "1px solid var(--card-border)",
                overflow: "hidden"
              }}>
                <div style={{ 
                  overflowX: "auto",
                  maxWidth: "100%"
                }}>
                  <table style={{ 
                    width: "100%", 
                    borderCollapse: "collapse",
                    fontSize: 14 
                  }}>
                    <thead>
                      <tr style={{ background: "var(--hover-background)" }}>
                        <th style={{ 
                          padding: "16px", 
                          textAlign: "left", 
                          fontWeight: 600, 
                          color: "var(--text-primary)",
                          borderBottom: "1px solid var(--card-border)",
                          minWidth: 100
                        }}>
                          Image
                        </th>
                        <th style={{ 
                          padding: "16px", 
                          textAlign: "left", 
                          fontWeight: 600, 
                          color: "var(--text-primary)",
                          borderBottom: "1px solid var(--card-border)",
                          minWidth: 150
                        }}>
                          Filename
                        </th>
                        <th style={{ 
                          padding: "16px", 
                          textAlign: "left", 
                          fontWeight: 600, 
                          color: "var(--text-primary)",
                          borderBottom: "1px solid var(--card-border)",
                          minWidth: 150
                        }}>
                          Result
                        </th>
                        <th style={{ 
                          padding: "16px", 
                          textAlign: "center", 
                          fontWeight: 600, 
                          color: "var(--text-primary)",
                          borderBottom: "1px solid var(--card-border)",
                          minWidth: 120
                        }}>
                          Confidence
                        </th>
                        <th style={{ 
                          padding: "16px", 
                          textAlign: "left", 
                          fontWeight: 600, 
                          color: "var(--text-primary)",
                          borderBottom: "1px solid var(--card-border)",
                          minWidth: 150
                        }}>
                          Date
                        </th>
                        <th style={{ 
                          padding: "16px", 
                          textAlign: "center", 
                          fontWeight: 600, 
                          color: "var(--text-primary)",
                          borderBottom: "1px solid var(--card-border)",
                          width: 120
                        }}>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPredictions.map((prediction, index) => (
                        <tr 
                          key={prediction.prediction_id}
                          style={{ 
                            borderBottom: index < filteredPredictions.length - 1 ? "1px solid var(--card-border)" : "none",
                            transition: "background-color 0.2s ease"
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "var(--hover-background)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                          }}
                        >
                          <td style={{ padding: "16px" }}>
                            <div style={{ 
                              width: 60, 
                              height: 60, 
                              borderRadius: 8, 
                              overflow: "hidden",
                              position: "relative",
                              background: "var(--hover-background)"
                            }}>
                              <Image
                                src={prediction.image_uri}
                                alt={prediction.filename}
                                fill
                                style={{ objectFit: "cover" }}
                                unoptimized
                              />
                            </div>
                          </td>
                          <td style={{ 
                            padding: "16px", 
                            color: "var(--text-primary)",
                            fontWeight: 500,
                            maxWidth: 200,
                            wordBreak: "break-all"
                          }}>
                            {prediction.filename}
                          </td>
                          <td style={{ padding: "16px" }}>
                            <div style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              padding: "4px 12px",
                              borderRadius: 16,
                              fontSize: 12,
                              fontWeight: 600,
                              background: prediction.predicted_class.toLowerCase().includes('benign') || 
                                        prediction.predicted_class.toLowerCase().includes('nevus')
                                ? "rgba(34, 197, 94, 0.1)" : "rgba(251, 191, 36, 0.1)",
                              color: prediction.predicted_class.toLowerCase().includes('benign') || 
                                   prediction.predicted_class.toLowerCase().includes('nevus')
                                ? "var(--success-color)" : "var(--warning-color)"
                            }}>
                              {prediction.predicted_class.toLowerCase().includes('benign') || 
                               prediction.predicted_class.toLowerCase().includes('nevus') ? "✅" : "⚠️"} {getLesionName(prediction)}
                      </div>
                          </td>
                          <td style={{ 
                            padding: "16px", 
                            textAlign: "center",
                            fontWeight: 600,
                            color: prediction.predicted_class.toLowerCase().includes('benign') || 
                                  prediction.predicted_class.toLowerCase().includes('nevus')
                              ? "var(--success-color)" : "var(--warning-color)"
                          }}>
                            {(getConfidenceScore(prediction) || 0).toFixed(2)}%
                          </td>
                          <td style={{ 
                            padding: "16px", 
                            color: "var(--text-secondary)",
                            fontSize: 13
                          }}>
                            {formatDate(prediction.upload_timestamp)}
                          </td>
                          <td style={{ padding: "16px", textAlign: "center" }}>
                            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                              <button
                                onClick={() => {
                                  if (prediction.image_uri) {
                                    window.open(prediction.image_uri, '_blank');
                                  }
                                }}
                                style={{
                                  width: 32,
                                  height: 32,
                                  background: "var(--hover-background)",
                                  border: "1px solid var(--card-border)",
                                  color: "var(--text-primary)",
                                  borderRadius: 6,
                                  fontSize: 12,
                                  cursor: "pointer",
                                  transition: "all 0.2s ease"
                                }}
                                title="Download Image"
                              >
                                📥
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : searchTerm || filterType !== "all" ? (
          /* No Results Found */
          <div style={{
            background: "var(--card-background)",
            borderRadius: 12,
            padding: 48,
            boxShadow: "var(--shadow-lg)",
            border: "1px solid var(--card-border)",
            textAlign: "center",
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <h3 style={{
              fontSize: 20,
              fontWeight: 600,
              color: "var(--text-primary)",
              marginBottom: 12,
            }}>
              No Results Found
            </h3>
            <p style={{
              color: "var(--text-secondary)",
              fontSize: 16,
              marginBottom: 24,
            }}>
              No analyses match your current search or filter criteria.
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setFilterType("all");
              }}
              style={{
                background: "var(--info-color)",
                color: "white",
                border: "none",
                padding: "12px 24px",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Clear Filters
            </button>
          </div>
        ) : null}
      </main>
    </div>
    </>
  );
};

export default ImageHistory;
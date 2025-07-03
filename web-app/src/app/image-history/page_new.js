"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { auth } from "../utils/auth";

export default function ImageHistory() {
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [hoveredCard, setHoveredCard] = useState(null);
  const [images, setImages] = useState([]);
  const router = useRouter();

  useEffect(() => {
    // Check authentication
    if (!auth.isAuthenticated()) {
      router.push("/login");
      return;
    }

    // Load mock data
    loadImageHistory();
  }, [router]);

  const loadImageHistory = async () => {
    // Simulate API call with mock data
    setTimeout(() => {
      const mockImages = [
        {
          id: 1,
          filename: "skin_lesion_001.jpg",
          uploadDate: "2024-01-15",
          prediction: "Benign",
          confidence: 94.2,
          status: "completed",
          thumbnail: "/api/placeholder/150/150"
        },
        {
          id: 2,
          filename: "mole_check_002.jpg",
          uploadDate: "2024-01-12",
          prediction: "Malignant",
          confidence: 87.5,
          status: "completed",
          thumbnail: "/api/placeholder/150/150"
        },
        {
          id: 3,
          filename: "derma_scan_003.jpg",
          uploadDate: "2024-01-10",
          prediction: "Benign",
          confidence: 91.8,
          status: "completed",
          thumbnail: "/api/placeholder/150/150"
        },
        {
          id: 4,
          filename: "skin_analysis_004.jpg",
          uploadDate: "2024-01-08",
          prediction: "Benign",
          confidence: 96.1,
          status: "completed",
          thumbnail: "/api/placeholder/150/150"
        },
        {
          id: 5,
          filename: "lesion_check_005.jpg",
          uploadDate: "2024-01-05",
          prediction: "Processing",
          confidence: null,
          status: "processing",
          thumbnail: "/api/placeholder/150/150"
        }
      ];
      
      setImages(mockImages);
      setLoading(false);
      setTimeout(() => setIsVisible(true), 100);
    }, 1000);
  };

  const filteredImages = images.filter(image => {
    const matchesSearch = image.filename.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || 
                         (filterType === 'benign' && image.prediction === 'Benign') ||
                         (filterType === 'malignant' && image.prediction === 'Malignant') ||
                         (filterType === 'processing' && image.status === 'processing');
    return matchesSearch && matchesFilter;
  }).sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.uploadDate) - new Date(a.uploadDate);
    } else if (sortBy === 'oldest') {
      return new Date(a.uploadDate) - new Date(b.uploadDate);
    } else if (sortBy === 'confidence') {
      return (b.confidence || 0) - (a.confidence || 0);
    }
    return 0;
  });

  const getStatusColor = (status, prediction) => {
    if (status === 'processing') return '#f59e0b';
    if (prediction === 'Malignant') return '#ef4444';
    if (prediction === 'Benign') return '#10b981';
    return '#6b7280';
  };

  const getStatusIcon = (status, prediction) => {
    if (status === 'processing') return '⏳';
    if (prediction === 'Malignant') return '⚠️';
    if (prediction === 'Benign') return '✅';
    return '📄';
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
            Loading history...
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
        
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .fade-in-up {
          animation: fadeInUp 0.6s ease-out;
        }
        
        .slide-in-left {
          animation: slideInLeft 0.4s ease-out;
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
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(37, 99, 235, 0.4);
        }
        
        .image-card {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .image-card:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 20px 40px rgba(0,0,0,0.15);
        }
        
        .filter-button {
          transition: all 0.3s ease;
        }
        
        .filter-button:hover {
          transform: translateY(-2px);
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
                📊 Analysis History
              </h1>
              <p style={{ color: "#64748b", fontSize: 16, margin: 0 }}>
                Review your previous image analyses and results
              </p>
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <Link
                href="/upload-image"
                className="interactive-button"
                style={{
                  background: "linear-gradient(135deg, #10b981, #34d399)",
                  color: "white",
                  textDecoration: "none",
                  padding: "12px 20px",
                  borderRadius: 12,
                  fontSize: 16,
                  fontWeight: 600,
                  boxShadow: "0 4px 16px rgba(16, 185, 129, 0.3)",
                }}
              >
                📤 Upload New
              </Link>
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
                ← Dashboard
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 20px" }}>
          {/* Filters and Search */}
          <div className="glass-card fade-in-up" style={{
            borderRadius: 20,
            padding: 30,
            marginBottom: 30,
            boxShadow: "0 15px 35px rgba(0,0,0,0.1)"
          }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr auto auto",
              gap: "20px",
              alignItems: "center"
            }}>
              {/* Search */}
              <div>
                <input
                  type="text"
                  placeholder="🔍 Search by filename..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "16px 20px",
                    border: "2px solid #e5e7eb",
                    borderRadius: 12,
                    fontSize: 16,
                    boxSizing: "border-box",
                    background: "rgba(255,255,255,0.9)",
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#2563eb"}
                  onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
                />
              </div>

              {/* Filter */}
              <div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  style={{
                    padding: "16px 20px",
                    border: "2px solid #e5e7eb",
                    borderRadius: 12,
                    fontSize: 16,
                    background: "white",
                    cursor: "pointer"
                  }}
                >
                  <option value="all">🔍 All Results</option>
                  <option value="benign">✅ Benign</option>
                  <option value="malignant">⚠️ Malignant</option>
                  <option value="processing">⏳ Processing</option>
                </select>
              </div>

              {/* Sort */}
              <div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    padding: "16px 20px",
                    border: "2px solid #e5e7eb",
                    borderRadius: 12,
                    fontSize: 16,
                    background: "white",
                    cursor: "pointer"
                  }}
                >
                  <option value="newest">📅 Newest First</option>
                  <option value="oldest">📅 Oldest First</option>
                  <option value="confidence">📊 By Confidence</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="fade-in-up" style={{
            marginBottom: "30px",
            textAlign: "center"
          }}>
            <p style={{
              color: "rgba(255,255,255,0.9)",
              fontSize: "18px",
              fontWeight: "600"
            }}>
              📋 Showing {filteredImages.length} of {images.length} analyses
            </p>
          </div>

          {/* Image Grid */}
          {filteredImages.length > 0 ? (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: "24px"
            }}>
              {filteredImages.map((image, index) => (
                <div
                  key={image.id}
                  className="image-card glass-card slide-in-left"
                  style={{
                    borderRadius: 20,
                    padding: 24,
                    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
                    animationDelay: `${index * 0.1}s`
                  }}
                  onMouseEnter={() => setHoveredCard(image.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  {/* Image Thumbnail */}
                  <div style={{
                    width: "100%",
                    height: "200px",
                    background: "linear-gradient(135deg, #f3f4f6, #e5e7eb)",
                    borderRadius: "12px",
                    marginBottom: "20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    position: "relative"
                  }}>
                    {image.thumbnail ? (
                      <div style={{
                        width: "100%",
                        height: "100%",
                        background: "linear-gradient(45deg, #f3f4f6 25%, transparent 25%), linear-gradient(-45deg, #f3f4f6 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f3f4f6 75%), linear-gradient(-45deg, transparent 75%, #f3f4f6 75%)",
                        backgroundSize: "20px 20px",
                        backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}>
                        <div style={{
                          fontSize: "60px",
                          color: "#9ca3af"
                        }}>
                          🖼️
                        </div>
                      </div>
                    ) : (
                      <div style={{
                        fontSize: "60px",
                        color: "#9ca3af"
                      }}>
                        🖼️
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    <div style={{
                      position: "absolute",
                      top: "12px",
                      right: "12px",
                      background: getStatusColor(image.status, image.prediction),
                      color: "white",
                      padding: "6px 12px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: "600",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
                    }}>
                      <span>{getStatusIcon(image.status, image.prediction)}</span>
                      {image.status === 'processing' ? 'Processing' : image.prediction}
                    </div>
                  </div>

                  {/* Image Info */}
                  <div>
                    <h3 style={{
                      fontSize: "18px",
                      fontWeight: "700",
                      color: "#1f2937",
                      marginBottom: "8px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap"
                    }}>
                      📄 {image.filename}
                    </h3>
                    
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "12px"
                    }}>
                      <span style={{
                        color: "#6b7280",
                        fontSize: "14px"
                      }}>
                        📅 {new Date(image.uploadDate).toLocaleDateString()}
                      </span>
                      {image.confidence && (
                        <span style={{
                          color: getStatusColor(image.status, image.prediction),
                          fontSize: "14px",
                          fontWeight: "600"
                        }}>
                          📊 {image.confidence}%
                        </span>
                      )}
                    </div>

                    {/* Analysis Result */}
                    {image.status === 'completed' && (
                      <div style={{
                        background: image.prediction === 'Malignant' 
                          ? "linear-gradient(135deg, #fef2f2, #fee2e2)"
                          : "linear-gradient(135deg, #f0fdf4, #dcfce7)",
                        border: `1px solid ${image.prediction === 'Malignant' ? '#fecaca' : '#bbf7d0'}`,
                        borderRadius: "8px",
                        padding: "12px",
                        marginBottom: "16px"
                      }}>
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px"
                        }}>
                          <span style={{ fontSize: "16px" }}>
                            {getStatusIcon(image.status, image.prediction)}
                          </span>
                          <span style={{
                            fontWeight: "600",
                            color: image.prediction === 'Malignant' ? '#dc2626' : '#15803d'
                          }}>
                            {image.prediction}
                          </span>
                          <span style={{
                            color: image.prediction === 'Malignant' ? '#991b1b' : '#166534',
                            fontSize: "14px"
                          }}>
                            ({image.confidence}% confidence)
                          </span>
                        </div>
                      </div>
                    )}

                    {image.status === 'processing' && (
                      <div style={{
                        background: "linear-gradient(135deg, #fefbf3, #fef3c7)",
                        border: "1px solid #fed7aa",
                        borderRadius: "8px",
                        padding: "12px",
                        marginBottom: "16px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px"
                      }}>
                        <div style={{
                          width: "16px",
                          height: "16px",
                          border: "2px solid #f59e0b",
                          borderTop: "2px solid transparent",
                          borderRadius: "50%",
                          animation: "spin 1s linear infinite"
                        }}></div>
                        <span style={{
                          color: "#92400e",
                          fontWeight: "600"
                        }}>
                          Analysis in progress...
                        </span>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div style={{
                      display: "flex",
                      gap: "8px"
                    }}>
                      <Link
                        href={`/image-detail/${image.id}`}
                        className="interactive-button"
                        style={{
                          flex: 1,
                          background: "linear-gradient(135deg, #2563eb, #3b82f6)",
                          color: "white",
                          textDecoration: "none",
                          padding: "10px 16px",
                          borderRadius: 8,
                          fontSize: 14,
                          fontWeight: 600,
                          textAlign: "center",
                          boxShadow: "0 2px 8px rgba(37, 99, 235, 0.3)",
                        }}
                      >
                        👀 View Details
                      </Link>
                      
                      <button
                        className="interactive-button"
                        style={{
                          background: "linear-gradient(135deg, #10b981, #34d399)",
                          color: "white",
                          border: "none",
                          padding: "10px 16px",
                          borderRadius: 8,
                          fontSize: 14,
                          fontWeight: 600,
                          cursor: "pointer",
                          boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)",
                        }}
                      >
                        📥 Download
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card fade-in-up" style={{
              borderRadius: 20,
              padding: 60,
              textAlign: "center",
              boxShadow: "0 15px 35px rgba(0,0,0,0.1)"
            }}>
              <div style={{ fontSize: "80px", marginBottom: "20px", opacity: 0.5 }}>
                📭
              </div>
              <h3 style={{
                fontSize: "24px",
                fontWeight: "600",
                color: "#374151",
                marginBottom: "12px"
              }}>
                No images found
              </h3>
              <p style={{
                color: "#6b7280",
                fontSize: "16px",
                marginBottom: "30px"
              }}>
                {searchTerm || filterType !== 'all' 
                  ? "Try adjusting your search or filter criteria"
                  : "Start by uploading your first image for analysis"
                }
              </p>
              {(!searchTerm && filterType === 'all') && (
                <Link
                  href="/upload-image"
                  className="interactive-button"
                  style={{
                    display: "inline-block",
                    background: "linear-gradient(135deg, #2563eb, #3b82f6)",
                    color: "white",
                    textDecoration: "none",
                    padding: "16px 32px",
                    borderRadius: 12,
                    fontWeight: 600,
                    fontSize: 16,
                    boxShadow: "0 4px 16px rgba(37, 99, 235, 0.3)",
                  }}
                >
                  📤 Upload First Image
                </Link>
              )}
            </div>
          )}
        </main>
      </div>
    </>
  );
}

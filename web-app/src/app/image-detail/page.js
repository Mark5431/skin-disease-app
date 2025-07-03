"use client";

import React, { useEffect, useState } from "react";
import MarkdownRenderer from "../components/MarkdownRenderer";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ThemeToggle from "../components/ThemeToggle";
import GradcamViewer from "../components/GradcamViewer";
import styles from "./ImageDetail.module.css";

// Define the API base URL
const nodeApiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

// Helper: get user from localStorage (same as dashboard)
function getCurrentUser() {
  if (typeof window === 'undefined') return null;
  return {
    userId: localStorage.getItem('user_id'),
    username: localStorage.getItem('username'),
    email: localStorage.getItem('userEmail'),
    firstName: localStorage.getItem('firstName'),
    lastName: localStorage.getItem('lastName'),
    token: localStorage.getItem('authToken')
  };
}


export default function ImageDetail() {
  const searchParams = useSearchParams();
  const imageId = searchParams.get("image_id");
  const [image, setImage] = useState(null);
  const [llmSummary, setLlmSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("original");

  // Fetch image and prediction by imageId (search user's predictions)
  useEffect(() => {
    if (!imageId) return;
    setLoading(true);
    const userObj = getCurrentUser();
    setUser(userObj);
    if (!userObj?.userId) {
      setError("User not authenticated");
      setLoading(false);
      return;
    }
    // 1. Fetch all predictions for this user
    fetch(`${nodeApiBase}/get-user-predictions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userObj.userId })
    })
      .then(res => res.json())
      .then(data => {
        if (!data.predictions) throw new Error("No predictions found");
        // Find the prediction by imageId
        const found = data.predictions.find(p => p.image_id === imageId);
        if (!found) throw new Error("Image not found");
        setImage(found);
        // Try to fetch LLM summary for this upload (by userId + uploadId)
        fetch(`/api/user-summaries?userId=${userObj.userId}&limit=10`)
          .then(res => res.json())
          .then(summaryData => {
            // Find summary for this uploadId (image_id)
            const summary = (summaryData.summaries || []).find(s => s.originalResults?.image_id === imageId || s.uploadId === imageId);
            setLlmSummary(summary?.llmSummary || null);
            setLoading(false);
          })
          .catch(() => {
            setLlmSummary(null);
            setLoading(false);
          });
      })
      .catch(err => {
        setError("Failed to load image details: " + err.message);
        setLoading(false);
      });
  }, [imageId]);

  // Generate or regenerate summary
  const handleGenerateSummary = async () => {
    if (!image || !user?.userId) return;
    setGenerating(true);
    setError("");
    try {
      // Extract the correct confidence for the predicted class
      let confidence = image.confidence_score;
      // Try to extract from confidence_scores if available
      if (
        image.confidence_scores &&
        typeof image.confidence_scores === 'object' &&
        image.confidence_scores.confidence_scores &&
        typeof image.confidence_scores.confidence_scores === 'object'
      ) {
        // Map predicted_class to lesion label if needed
        let lesionLabel = image.lesion_type || image.predicted_class;
        // Try to find the best match in confidence_scores
        const scoresObj = image.confidence_scores.confidence_scores;
        // Try exact match first
        if (scoresObj[lesionLabel] !== undefined) {
          confidence = scoresObj[lesionLabel];
        } else {
          // Try to find a key that includes the predicted_class or lesion_type
          const foundKey = Object.keys(scoresObj).find(k => k.toLowerCase().includes((lesionLabel || '').toLowerCase()));
          if (foundKey) confidence = scoresObj[foundKey];
        }
      }
      // Prepare mlResults with correct confidence
      const mlResults = { ...image, confidence_score: confidence };
      // Call /api/generate-summary with ML results and userId
      const res = await fetch("/api/generate-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mlResults, userId: user.userId, uploadId: image.image_id })
      });
      const data = await res.json();
      if (!data.summary) throw new Error("No summary returned");
      setLlmSummary(data.summary);
    } catch (err) {
      setError("Failed to generate summary: " + err.message);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: "var(--primary-gradient)"
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        background: "var(--card-background)",
        padding: "30px 50px",
        borderRadius: 20,
        boxShadow: "var(--shadow-lg)",
        backdropFilter: "blur(20px)",
        border: "1px solid var(--card-border)"
      }}>
        <div style={{
          width: 24,
          height: 24,
          border: "3px solid var(--info-color)",
          borderTop: "3px solid transparent",
          borderRadius: "50%",
          animation: "spin 1s linear infinite"
        }} />
        <div style={{ fontSize: 18, color: "var(--text-primary)", fontWeight: 600 }}>
          Loading image details...
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: "var(--primary-gradient)"
    }}>
      <div style={{
        background: "var(--card-background)",
        padding: "40px",
        borderRadius: 20,
        boxShadow: "var(--shadow-lg)",
        backdropFilter: "blur(20px)",
        textAlign: "center",
        maxWidth: 400
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <h2 style={{ color: "var(--error-color)", marginBottom: 16 }}>Image Detail Error</h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: 24 }}>{error}</p>
        <Link href="/dashboard" style={{
          background: "var(--info-color)",
          color: "white",
          border: "none",
          padding: "12px 24px",
          borderRadius: 12,
          fontSize: 16,
          fontWeight: 600,
          cursor: "pointer",
          textDecoration: "none"
        }}>Go to Dashboard</Link>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--primary-gradient)", fontFamily: "var(--font-geist-sans, sans-serif)" }}>
      {/* Header updated to match settings page */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <Link href="/dashboard" className={styles.backLink}>
              ← Back to Dashboard
            </Link>
            <h1>🔍 Image Details</h1>
            <p>View and analyze your diagnostic image results</p>
          </div>
          <div className={styles.headerRight}>
            <ThemeToggle />
          </div>
        </div>
      </header>
      {/* Main Content */}
      <main className={styles.container}>
        {/* Left Column: Image & GradCAM */}
        <section className={styles.leftCol}>
          <div className={`${styles.card} fade-in-up`}>
            <h2 className={styles.cardTitle}>Image Analysis</h2>
            {image && (
              <>
                {/* Tabbed interface for Original and Grad-CAM views */}
                <div className={styles.tabContainer}>
                  <div className={styles.tabButtons}>
                    <button 
                      className={`${styles.tabButton} ${activeTab === "original" ? styles.active : ""}`} 
                      onClick={() => setActiveTab("original")}
                    >
                      Original Image
                    </button>
                    <button 
                      className={`${styles.tabButton} ${activeTab === "gradcam" ? styles.active : ""}`} 
                      onClick={() => setActiveTab("gradcam")}
                    >
                      Grad-CAM View
                    </button>
                    <button 
                      className={`${styles.tabButton} ${activeTab === "compare" ? styles.active : ""}`} 
                      onClick={() => setActiveTab("compare")}
                    >
                      Compare
                    </button>
                  </div>
                  
                  <div className={`${styles.tabContent} ${activeTab === "original" ? styles.active : ""}`}>
                    <div className={styles.imagePreview}>
                      <div className={styles.imageWrapper}>
                        <Image 
                          src={image.image_uri}
                          alt="Original Image"
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw"
                          style={{ objectFit: "contain" }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className={`${styles.tabContent} ${activeTab === "gradcam" ? styles.active : ""}`}>
                    <React.Suspense fallback={<div>Loading Grad-CAM...</div>}>
                      <div className={styles.imagePreview}>
                        <GradcamViewer originalUrl={image.image_uri} gradcamUrl={image.gradcam_uri || null} alt="Grad-CAM" />
                      </div>
                    </React.Suspense>
                    {!image.gradcam_uri && (
                      <div className={styles.gradcamNotice}>
                        Grad-CAM not available for this image. It will be auto-generated soon if missing.
                      </div>
                    )}
                  </div>
                  
                  <div className={`${styles.tabContent} ${activeTab === "compare" ? styles.active : ""}`}>
                    <div className={styles.imageGradcamContainer}>
                      <div className={styles.imageSection}>
                        <div className={styles.sectionTitle}>Original Image</div>
                        <div className={styles.imageWrapper}>
                          <Image 
                            src={image.image_uri}
                            alt="Original"
                            fill
                            sizes="(max-width: 768px) 100vw, 40vw"
                            style={{ objectFit: "contain" }}
                          />
                        </div>
                      </div>
                      
                      <div className={styles.gradcamSection}>
                        <div className={styles.sectionTitle}>Grad-CAM Visualization</div>
                        <React.Suspense fallback={<div>Loading...</div>}>
                          {image.gradcam_uri ? (
                            <div className={styles.imageWrapper}>
                              <Image 
                                src={image.gradcam_uri}
                                alt="Grad-CAM"
                                fill
                                sizes="(max-width: 768px) 100vw, 40vw"
                                style={{ objectFit: "contain" }}
                              />
                            </div>
                          ) : (
                            <div className={styles.gradcamNotice}>
                              Grad-CAM not available for this image.
                            </div>
                          )}
                        </React.Suspense>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Image metadata shown below the image/gradcam display */}
                <div className={styles.meta}><strong>{image.predicted_class}</strong></div>
                <div className={styles.meta}>Lesion Type: <strong>{image.confidence_scores?.lesion_type || "-"}</strong></div>
                <div className={styles.meta}>Confidence: <strong style={{ color: "var(--success-color)" }}>{(() => {
                  if (typeof image.confidence_score === 'number') {
                    return image.confidence_score.toFixed(2) + "%";
                  } else if (
                    image.confidence_scores &&
                    typeof image.confidence_scores === 'object' &&
                    image.confidence_scores.confidence_scores &&
                    typeof image.confidence_scores.confidence_scores === 'object'
                  ) {
                    const vals = Object.values(image.confidence_scores.confidence_scores)
                      .map(v => parseFloat(v))
                      .filter(v => !isNaN(v));
                    if (vals.length > 0) return Math.max(...vals).toFixed(2) + "%";
                  }
                  return "-";
                })()}</strong></div>
              </>
            )}
          </div>
        </section>
        {/* Right Column: AI Medical Summary */}
        <section className={styles.rightCol}>
          <div className={`${styles.card} fade-in-up`}>
            <h2 className={styles.cardTitle}>AI Medical Summary</h2>
            <div className={styles.summaryScroll}>
              {llmSummary ? (
                <MarkdownRenderer
                  markdown={(() => {
                    let md = '';
                    if (llmSummary.summary) {
                      md += `#### **📝 Summary**\n\n${llmSummary.summary}\n\n---\n`;
                    }
                    if (llmSummary.key_findings && Array.isArray(llmSummary.key_findings)) {
                      md += `#### **🔍 Key Findings**\n\n`;
                      llmSummary.key_findings.forEach(f => { md += `- ${f}\n`; });
                      md += '\n---\n';
                    }
                    if (llmSummary.step_by_step_action_plan && Array.isArray(llmSummary.step_by_step_action_plan)) {
                      md += `#### **🗂️ Action Plan**\n\n`;
                      llmSummary.step_by_step_action_plan.forEach((s, i) => { md += `${i+1}. ${s}\n`; });
                      md += '\n---\n';
                    }
                    if (llmSummary.interpretation && (llmSummary.interpretation.risk_level || llmSummary.interpretation.confidence_assessment)) {
                      md += `#### **🧩 Interpretation**\n\n`;
                      if (llmSummary.interpretation.risk_level) md += `**Risk Level:** <span style=\"color:#b91c1c;font-weight:bold;\">${llmSummary.interpretation.risk_level}</span>\n\n`;
                      if (llmSummary.interpretation.confidence_assessment) md += `**Confidence Assessment:** ${llmSummary.interpretation.confidence_assessment}\n`;
                      md += '\n---\n';
                    }
                    if (llmSummary.recommendations && (llmSummary.recommendations.immediate_actions || llmSummary.recommendations.follow_up || llmSummary.recommendations.monitoring)) {
                      md += `#### **💡 Recommendations**\n\n`;
                      if (llmSummary.recommendations.immediate_actions && Array.isArray(llmSummary.recommendations.immediate_actions)) {
                        md += `**Immediate Actions:**\n`;
                        llmSummary.recommendations.immediate_actions.forEach(a => { md += `- <span style=\"color:#b45309;\">${a}</span>\n`; });
                        md += '\n';
                      }
                      if (llmSummary.recommendations.follow_up) md += `**Follow Up:** ${llmSummary.recommendations.follow_up}\n`;
                      if (llmSummary.recommendations.monitoring) md += `**Monitoring:** ${llmSummary.recommendations.monitoring}\n`;
                      md += '\n---\n';
                    }
                    if (llmSummary.medical_disclaimer) {
                      md += `\n<div style=\"background:var(--warning-color)22;border:1.5px solid var(--warning-color);padding:14px 18px;border-radius:10px;margin-top:18px;font-size:15px;\"><strong>Disclaimer:</strong> ${llmSummary.medical_disclaimer}</div>\n`;
                    }
                    return md;
                  })()}
                  style={{
                    marginBottom: 0,
                    fontSize: 18,
                    lineHeight: 1.8,
                    fontFamily: 'var(--font-geist-sans, sans-serif)',
                    color: 'var(--text-primary)'
                  }}
                />
              ) : (
                <div style={{ color: "var(--warning-color)", marginBottom: 16, fontSize: 18, fontWeight: 500 }}>No summary available for this image.</div>
              )}
            </div>
            <button
              onClick={handleGenerateSummary}
              disabled={generating || !image}
              className="interactive-button"
              style={{
                marginTop: 12,
                background: "var(--warning-color)",
                color: "#78350f",
                border: "none",
                borderRadius: 8,
                padding: "10px 20px",
                fontWeight: 600,
                fontSize: 16,
                cursor: generating ? "not-allowed" : "pointer",
                boxShadow: "var(--shadow-sm)"
              }}
            >
              {llmSummary ? (generating ? "Regenerating..." : "Regenerate Summary") : (generating ? "Generating..." : "Generate Summary")}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
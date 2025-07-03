"use client";
import React, { useState } from "react";
import Image from "next/image";

const GradcamViewer = ({ originalUrl, gradcamUrl, alt }) => {
  const [showGradcam, setShowGradcam] = useState(true);
  const [opacity, setOpacity] = useState(0.6);

  return (
    <div style={{ textAlign: "center", margin: "16px 0" }}>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 24 }}>
        <div style={{ position: "relative", width: 224, height: 224 }}>
          <Image
            src={originalUrl}
            alt={alt || "Original skin lesion"}
            fill
            sizes="224px"
            style={{ 
              objectFit: "cover",
              borderRadius: 12, 
              boxShadow: "var(--shadow-md)", 
              opacity: showGradcam ? 1 - opacity : 1, 
              position: "absolute", 
              top: 0, 
              left: 0, 
              zIndex: 1, 
              transition: "opacity 0.3s" 
            }}
          />
          {gradcamUrl && (
            <Image
              src={gradcamUrl}
              alt={alt ? alt + " Grad-CAM" : "Grad-CAM overlay"}
              fill
              sizes="224px"
              style={{ 
                objectFit: "cover",
                borderRadius: 12, 
                boxShadow: "var(--shadow-md)", 
                opacity: showGradcam ? opacity : 0, 
                position: "absolute", 
                top: 0, 
                left: 0, 
                zIndex: 2, 
                transition: "opacity 0.3s" 
              }}
            />
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8 }}>
          <button
            onClick={() => setShowGradcam((v) => !v)}
            style={{
              background: "var(--info-color)",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              padding: "6px 14px",
              fontWeight: 500,
              cursor: "pointer",
              fontSize: 13,
              marginBottom: 8
            }}
          >
            {showGradcam ? "Hide Grad-CAM" : "Show Grad-CAM"}
          </button>
          <label style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            Grad-CAM Opacity: {Math.round(opacity * 100)}%
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={opacity}
              onChange={e => setOpacity(Number(e.target.value))}
              style={{ marginLeft: 8 }}
            />
          </label>
        </div>
      </div>
      <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 8, maxWidth: 400, marginLeft: "auto", marginRight: "auto" }}>
        <b>What is Grad-CAM?</b> This heatmap shows which parts of the image the AI focused on for its prediction. Redder areas indicate higher importance.
      </div>
    </div>
  );
};

export default GradcamViewer;

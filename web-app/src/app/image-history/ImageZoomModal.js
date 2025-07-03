import React from "react";
import Image from "next/image";

export default function ImageZoomModal({ src, alt, onClose }) {
  if (!src) return null;
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.85)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        animation: "fadeIn 0.2s"
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: "relative",
          maxWidth: "90vw",
          maxHeight: "90vh",
          boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
          borderRadius: 16,
          overflow: "hidden",
          background: "#222"
        }}
        onClick={e => e.stopPropagation()}
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
          onClick={onClose}
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
        >
          ✕
        </button>
      </div>
    </div>
  );
}

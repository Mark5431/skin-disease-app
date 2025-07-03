"use client";
import React from "react";
import { marked } from "marked";

const MarkdownRenderer = ({ markdown, className = "", style = {} }) => {
  if (!markdown) return null;
  return (
    <div
      className={className}
      style={{ ...style, fontSize: 17, lineHeight: 1.7, color: "var(--text-primary)", fontFamily: "var(--font-geist-sans, sans-serif)", background: "none" }}
      dangerouslySetInnerHTML={{ __html: marked.parse(markdown) }}
    />
  );
};

export default MarkdownRenderer;

"use client";
import React from "react";
import { useSidebar } from "./SidebarContext";
import styles from "../upload-image/UploadImage.module.css";

export default function SidebarToggleButton() {
  const { openSidebar } = useSidebar();
  return (
    <button
      className={styles.hamburgerBtn}
      aria-label="Open sidebar"
      onClick={openSidebar}
      type="button"
    >
      <span className={styles.hamburger}>
        <span></span>
        <span></span>
        <span></span>
      </span>
    </button>
  );
}
